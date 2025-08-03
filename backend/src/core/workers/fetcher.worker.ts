import { Job, Worker } from 'bullmq';
import puppeteer, { Browser, Page } from 'puppeteer';
import { config } from '@/config';
import { createLogger } from '@/config/logger';
import { supabase } from '@/config/supabase';
import { AppError } from '@/types';
import * as path from 'path';

const logger = createLogger('fetcher-worker');

interface FetcherJobData {
  analysisId: string;
  workspaceId: string;
  websiteId: string;
  userId: string;
  url?: string; // For public analyses without websiteId
}

interface ExtractedAssets {
  html: string;
  css: string[];
  js: string[];
  robots?: string;
  sitemap?: string;
}

async function updateAnalysisStatus(analysisId: string, status: 'processing' | 'completed' | 'failed') {
  logger.info('Updating analysis status', { analysisId, status });
  
  const { data, error } = await supabase
    .from('analyses')
    .update({ status, ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {}) })
    .eq('id', analysisId)
    .select();

  if (error) {
    logger.error('Failed to update analysis status', {
      error: error.message,
      errorCode: error.code,
      errorDetails: error.details,
      analysisId,
      status
    });
    throw new AppError(`Failed to update analysis status: ${error.message}`, 500, true, error);
  }

  logger.info('Analysis status updated successfully', {
    analysisId,
    status,
    data
  });
}

async function updateAnalysisJobStatus(analysisId: string, moduleId: string, status: 'running' | 'completed' | 'failed', errorMessage?: string) {
  const updateData: any = { 
    status,
    ...(status === 'running' ? { started_at: new Date().toISOString() } : {}),
    ...(status === 'completed' || status === 'failed' ? { completed_at: new Date().toISOString() } : {}),
    ...(errorMessage ? { error_message: errorMessage } : {})
  };

  const { error } = await supabase
    .from('analysis_jobs')
    .update(updateData)
    .eq('analysis_id', analysisId)
    .eq('module_id', moduleId);

  if (error) {
    logger.error('Failed to update analysis job status', { error, analysisId, moduleId, status });
  }
}

async function extractPageAssets(page: Page): Promise<ExtractedAssets> {
  // Extract all CSS (inline and external)
  const css = await page.evaluate(() => {
    const styles: string[] = [];
    
    // Get all <style> tags
    document.querySelectorAll('style').forEach(style => {
      styles.push(style.textContent || '');
    });
    
    // Get all inline styles
    document.querySelectorAll('[style]').forEach(element => {
      const inlineStyle = element.getAttribute('style');
      if (inlineStyle) {
        styles.push(`/* Inline style from ${element.tagName} */\n${inlineStyle}`);
      }
    });
    
    // Get computed styles for critical elements
    const criticalSelectors = ['body', 'main', 'header', 'nav', 'footer', 'h1', 'h2', 'h3', 'p', 'a', 'button', 'input', 'img'];
    criticalSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element, index) => {
          const computed = window.getComputedStyle(element);
          const criticalProps = ['color', 'background-color', 'font-size', 'font-weight', 'line-height', 'padding', 'margin'];
          const computedStyles = criticalProps
            .map(prop => `${prop}: ${computed.getPropertyValue(prop)};`)
            .join('\n  ');
          if (computedStyles) {
            styles.push(`/* Computed styles for ${selector}:nth-of-type(${index + 1}) */\n${selector} {\n  ${computedStyles}\n}`);
          }
        });
      } catch (e) {
        // Ignore errors for missing selectors
      }
    });
    
    return styles;
  });

  // Extract JavaScript files
  const js = await page.evaluate(() => {
    const scripts: string[] = [];
    document.querySelectorAll('script').forEach(script => {
      if (script.textContent && !script.src) {
        scripts.push(script.textContent);
      }
    });
    return scripts;
  });

  // Get the fully rendered HTML
  const html = await page.content();

  return { html, css, js };
}

async function fetchRobotsAndSitemap(page: Page, baseUrl: string): Promise<{ robots?: string; sitemap?: string }> {
  const result: { robots?: string; sitemap?: string } = {};
  
  try {
    // Fetch robots.txt
    const robotsUrl = new URL('/robots.txt', baseUrl).href;
    const robotsResponse = await page.goto(robotsUrl);
    if (robotsResponse && robotsResponse.status() === 200) {
      result.robots = await robotsResponse.text();
    }
  } catch (error) {
    logger.warn('Failed to fetch robots.txt', { error: error.message });
  }

  try {
    // Fetch sitemap.xml
    const sitemapUrl = new URL('/sitemap.xml', baseUrl).href;
    const sitemapResponse = await page.goto(sitemapUrl);
    if (sitemapResponse && sitemapResponse.status() === 200) {
      result.sitemap = await sitemapResponse.text();
    }
  } catch (error) {
    logger.warn('Failed to fetch sitemap.xml', { error: error.message });
  }

  return result;
}

async function captureScreenshots(page: Page, workspaceId: string, analysisId: string) {
  const screenshots = [];
  const basePath = `${workspaceId}/${analysisId}/screenshots`;

  try {
    logger.info('Starting screenshot capture', { basePath });

    // Desktop screenshot with timeout
    logger.info('Capturing desktop screenshot');
    await page.setViewport({ width: 1920, height: 1080 });
    await page.waitForTimeout(500); // Allow viewport to settle
    const desktopScreenshot = await Promise.race([
      page.screenshot({ type: 'jpeg', quality: 85 }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Desktop screenshot timeout')), 10000))
    ]);
    const desktopPath = `${basePath}/desktop.jpg`;
    const { error: desktopError } = await supabase.storage.from('analysis_assets').upload(desktopPath, desktopScreenshot);
    if (desktopError) {
      logger.warn('Failed to upload desktop screenshot', { error: desktopError.message });
    } else {
      screenshots.push({ type: 'desktop', path: desktopPath });
      logger.info('Desktop screenshot captured and uploaded');
    }

    // Mobile screenshot with timeout
    logger.info('Capturing mobile screenshot');
    await page.setViewport({ width: 375, height: 667, isMobile: true });
    await page.waitForTimeout(500);
    const mobileScreenshot = await Promise.race([
      page.screenshot({ type: 'jpeg', quality: 85 }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Mobile screenshot timeout')), 10000))
    ]);
    const mobilePath = `${basePath}/mobile.jpg`;
    const { error: mobileError } = await supabase.storage.from('analysis_assets').upload(mobilePath, mobileScreenshot);
    if (mobileError) {
      logger.warn('Failed to upload mobile screenshot', { error: mobileError.message });
    } else {
      screenshots.push({ type: 'mobile', path: mobilePath });
      logger.info('Mobile screenshot captured and uploaded');
    }

    // Tablet screenshot with timeout
    logger.info('Capturing tablet screenshot');
    await page.setViewport({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    const tabletScreenshot = await Promise.race([
      page.screenshot({ type: 'jpeg', quality: 85 }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Tablet screenshot timeout')), 10000))
    ]);
    const tabletPath = `${basePath}/tablet.jpg`;
    const { error: tabletError } = await supabase.storage.from('analysis_assets').upload(tabletPath, tabletScreenshot);
    if (tabletError) {
      logger.warn('Failed to upload tablet screenshot', { error: tabletError.message });
    } else {
      screenshots.push({ type: 'tablet', path: tabletPath });
      logger.info('Tablet screenshot captured and uploaded');
    }

    // Full page screenshot with timeout - this one often hangs
    logger.info('Capturing full page screenshot');
    await page.setViewport({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    try {
      const fullPageScreenshot = await Promise.race([
        page.screenshot({ type: 'jpeg', quality: 85, fullPage: true }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Full page screenshot timeout')), 15000))
      ]);
      const fullPagePath = `${basePath}/full-page.jpg`;
      const { error: fullPageError } = await supabase.storage.from('analysis_assets').upload(fullPagePath, fullPageScreenshot);
      if (fullPageError) {
        logger.warn('Failed to upload full page screenshot', { error: fullPageError.message });
      } else {
        screenshots.push({ type: 'full_page', path: fullPagePath });
        logger.info('Full page screenshot captured and uploaded');
      }
    } catch (fullPageError) {
      logger.warn('Full page screenshot failed, skipping', { error: fullPageError.message });
      // Continue without full page screenshot
    }

    logger.info('Screenshot capture completed', { count: screenshots.length });
    return screenshots;

  } catch (error) {
    logger.error('Screenshot capture failed', { error: error.message });
    // Return any screenshots we managed to capture
    return screenshots;
  }
}

export const fetcherWorker = new Worker('fetcher', async (job: Job<FetcherJobData>) => {
  const { analysisId, workspaceId, websiteId, userId, url } = job.data;
  logger.info('Starting fetcher job', { analysisId, workspaceId, websiteId });

  let browser: Browser | null = null;
  
  try {
    // Update analysis status
    await updateAnalysisStatus(analysisId, 'processing');
    
    // Get the fetcher module ID (we'll need to create this in the seed data)
    const { data: fetcherModule } = await supabase
      .from('analysis_modules')
      .select('id')
      .eq('name', 'Fetcher')
      .single();
      
    if (fetcherModule) {
      await updateAnalysisJobStatus(analysisId, fetcherModule.id, 'running');
    }

    // Get the target URL
    let targetUrl: string;
    if (url) {
      targetUrl = url;
    } else {
      const { data: website, error } = await supabase
        .from('websites')
        .select('url')
        .eq('id', websiteId)
        .single();
        
      if (error || !website) {
        throw new AppError('Website not found', 404);
      }
      targetUrl = website.url;
    }

    logger.info('Launching browser for URL', { targetUrl });

    // Launch browser with highly optimized settings for Docker containers
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins',
        '--disable-site-isolation-trials',
        '--memory-pressure-off',
        '--max_old_space_size=4096',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--disable-features=TranslateUI',
        '--disable-background-networking',
        '--disable-background-sync',
        '--disable-component-extensions-with-background-pages'
      ],
      timeout: 30000,
      protocolTimeout: 30000
    });

    const page = await browser.newPage();
    
    // Configure page settings for better reliability
    await page.setDefaultTimeout(15000);
    await page.setDefaultNavigationTimeout(15000);
    
    // Set user agent to identify as our crawler
    await page.setUserAgent('SiteCraft-Analyzer/1.0 (Web Accessibility Analysis Bot)');
    
    // Set viewport for consistent rendering
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Block unnecessary resources for performance and reliability
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      const url = request.url();
      
      // Block problematic resource types that can cause issues
      if (['font', 'media', 'websocket'].includes(resourceType)) {
        request.abort();
      } else if (url.includes('google-analytics') || url.includes('facebook.com') || url.includes('doubleclick')) {
        // Block tracking scripts that can cause timeouts
        request.abort();
      } else {
        request.continue();
      }
    });

    // Handle page errors gracefully
    page.on('error', (error) => {
      logger.warn('Page error occurred', { error: error.message, targetUrl });
    });

    page.on('pageerror', (error) => {
      logger.warn('Page script error occurred', { error: error.message, targetUrl });
    });

    // Navigate to the page with robust error handling
    logger.info('Navigating to target URL');
    
    let navigationSuccess = false;
    try {
      const response = await page.goto(targetUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      if (response && response.ok()) {
        navigationSuccess = true;
        logger.info('Navigation successful', { 
          status: response.status(),
          targetUrl 
        });
      } else {
        logger.warn('Navigation returned non-OK response', { 
          status: response?.status(),
          targetUrl 
        });
      }

      // Wait for dynamic content but don't block on errors
      try {
        await page.waitForTimeout(2000);
      } catch (waitError) {
        logger.warn('Wait timeout error', { error: waitError.message });
      }

    } catch (navigationError) {
      logger.error('Navigation failed', { 
        error: navigationError.message,
        targetUrl 
      });
      
      // Try one more time with a simpler approach
      try {
        logger.info('Retrying navigation with simpler settings');
        await page.goto(targetUrl, { 
          waitUntil: 'load',
          timeout: 10000
        });
        navigationSuccess = true;
        await page.waitForTimeout(1000);
      } catch (retryError) {
        logger.error('Navigation retry failed', { 
          error: retryError.message,
          targetUrl 
        });
        throw new AppError(`Failed to navigate to ${targetUrl}: ${navigationError.message}`, 500);
      }
    }

    if (!navigationSuccess) {
      throw new AppError(`Failed to load page: ${targetUrl}`, 500);
    }

    // Extract all assets
    logger.info('Extracting page assets');
    const assets = await extractPageAssets(page);
    
    // Fetch robots.txt and sitemap.xml
    logger.info('Fetching robots.txt and sitemap.xml');
    const { robots, sitemap } = await fetchRobotsAndSitemap(page, targetUrl);
    
    // Navigate back to main page for screenshots
    await page.goto(targetUrl, { waitUntil: 'networkidle2' });
    
    // Capture screenshots at different viewports
    logger.info('Capturing screenshots');
    const screenshots = await captureScreenshots(page, workspaceId, analysisId);

    // Store all assets in Supabase Storage with timeout protection
    const basePath = `${workspaceId}/${analysisId}`;
    
    logger.info('Starting asset storage', { basePath });
    
    // Store HTML with timeout
    logger.info('Storing HTML content');
    try {
      const { error: htmlError } = await Promise.race([
        supabase.storage
          .from('analysis_assets')
          .upload(`${basePath}/html/index.html`, assets.html, {
            contentType: 'text/html',
            upsert: true
          }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('HTML upload timeout')), 10000))
      ]);
      if (htmlError) {
        logger.error('Failed to store HTML', { error: htmlError.message });
        throw new AppError(`Failed to store HTML: ${htmlError.message}`, 500);
      }
      logger.info('HTML stored successfully');
    } catch (error) {
      logger.error('HTML storage failed', { error: error.message });
      throw error;
    }

    // Store CSS files with timeout
    logger.info('Storing CSS files', { count: assets.css.length });
    for (let i = 0; i < assets.css.length; i++) {
      if (assets.css[i]) {
        try {
          const { error: cssError } = await Promise.race([
            supabase.storage
              .from('analysis_assets')
              .upload(`${basePath}/css/styles-${i}.css`, assets.css[i], {
                contentType: 'text/css',
                upsert: true
              }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('CSS upload timeout')), 5000))
          ]);
          if (cssError) {
            logger.warn(`Failed to store CSS file ${i}`, { error: cssError.message });
          } else {
            logger.info(`CSS file ${i} stored successfully`);
          }
        } catch (error) {
          logger.warn(`CSS file ${i} storage failed`, { error: error.message });
          // Continue with other files
        }
      }
    }

    // Store JS files with timeout
    logger.info('Storing JS files', { count: assets.js.length });
    for (let i = 0; i < assets.js.length; i++) {
      if (assets.js[i]) {
        try {
          const { error: jsError } = await Promise.race([
            supabase.storage
              .from('analysis_assets')
              .upload(`${basePath}/js/script-${i}.js`, assets.js[i], {
                contentType: 'application/javascript',
                upsert: true
              }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('JS upload timeout')), 5000))
          ]);
          if (jsError) {
            logger.warn(`Failed to store JS file ${i}`, { error: jsError.message });
          } else {
            logger.info(`JS file ${i} stored successfully`);
          }
        } catch (error) {
          logger.warn(`JS file ${i} storage failed`, { error: error.message });
          // Continue with other files
        }
      }
    }

    // Store meta files with timeout
    if (robots) {
      logger.info('Storing robots.txt');
      try {
        const { error: robotsError } = await Promise.race([
          supabase.storage
            .from('analysis_assets')
            .upload(`${basePath}/meta/robots.txt`, robots, {
              contentType: 'text/plain',
              upsert: true
            }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Robots.txt upload timeout')), 5000))
        ]);
        if (robotsError) {
          logger.warn('Failed to store robots.txt', { error: robotsError.message });
        } else {
          logger.info('robots.txt stored successfully');
        }
      } catch (error) {
        logger.warn('robots.txt storage failed', { error: error.message });
      }
    }

    if (sitemap) {
      logger.info('Storing sitemap.xml');
      try {
        const { error: sitemapError } = await Promise.race([
          supabase.storage
            .from('analysis_assets')
            .upload(`${basePath}/meta/sitemap.xml`, sitemap, {
              contentType: 'application/xml',
              upsert: true
            }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Sitemap.xml upload timeout')), 5000))
        ]);
        if (sitemapError) {
          logger.warn('Failed to store sitemap.xml', { error: sitemapError.message });
        } else {
          logger.info('sitemap.xml stored successfully');
        }
      } catch (error) {
        logger.warn('sitemap.xml storage failed', { error: error.message });
      }
    }

    logger.info('Asset storage phase completed');

    // Store metadata about what was captured
    logger.info('Storing metadata');
    const metadata = {
      url: targetUrl,
      capturedAt: new Date().toISOString(),
      assets: {
        html: true,
        cssCount: assets.css.length,
        jsCount: assets.js.length,
        hasRobots: !!robots,
        hasSitemap: !!sitemap,
        screenshots: screenshots.map(s => s.type)
      }
    };

    try {
      const { error: metadataError } = await Promise.race([
        supabase.storage
          .from('analysis_assets')
          .upload(`${basePath}/meta/metadata.json`, JSON.stringify(metadata, null, 2), {
            contentType: 'application/json',
            upsert: true
          }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Metadata upload timeout')), 5000))
      ]);
      if (metadataError) {
        logger.warn('Failed to store metadata', { error: metadataError.message });
      } else {
        logger.info('Metadata stored successfully');
      }
    } catch (error) {
      logger.warn('Metadata storage failed', { error: error.message });
    }

    // Insert screenshot records into database with timeout
    if (screenshots.length > 0) {
      logger.info('Inserting screenshot records', { count: screenshots.length });
      const screenshotRecords = screenshots.map(screenshot => ({
        analysis_id: analysisId,
        type: screenshot.type,
        storage_bucket: 'analysis_assets',
        storage_path: screenshot.path,
        url: targetUrl
      }));

      try {
        const { error: screenshotError } = await Promise.race([
          supabase.from('screenshots').insert(screenshotRecords),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Screenshot insert timeout')), 5000))
        ]);
        if (screenshotError) {
          logger.warn('Failed to insert screenshot records', { error: screenshotError.message });
        } else {
          logger.info('Screenshot records inserted successfully');
        }
      } catch (error) {
        logger.warn('Screenshot record insertion failed', { error: error.message });
      }
    }

    // Update job status
    if (fetcherModule) {
      await updateAnalysisJobStatus(analysisId, fetcherModule.id, 'completed');
    }

    logger.info('Successfully fetched and stored all assets', { 
      analysisId, 
      workspaceId,
      assetPath: basePath 
    });

    // Return the asset path for other workers to use
    return {
      success: true,
      assetPath: basePath,
      metadata
    };

  } catch (error) {
    logger.error('Error in fetcher worker', { 
      error: error.message, 
      stack: error.stack,
      analysisId,
      workspaceId 
    });
    
    await updateAnalysisStatus(analysisId, 'failed');
    
    // Get the fetcher module ID to update job status
    const { data: fetcherModule } = await supabase
      .from('analysis_modules')
      .select('id')
      .eq('name', 'Fetcher')
      .single();
      
    if (fetcherModule) {
      await updateAnalysisJobStatus(analysisId, fetcherModule.id, 'failed', error.message);
    }
    
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}, {
  connection: {
    host: config.redis.host,
    port: config.redis.port,
  },
  concurrency: 1, // Reduce concurrency for Docker resource constraints
  // Reduced retry logic for faster failure handling
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 3000
    },
    removeOnComplete: 10,
    removeOnFail: 10,
    // Add job timeout to prevent infinite hanging
    jobTimeout: 120000 // 2 minutes total timeout
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing fetcher worker...');
  await fetcherWorker.close();
});