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
  const { error } = await supabase
    .from('analyses')
    .update({ status, ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {}) })
    .eq('id', analysisId);

  if (error) {
    throw new AppError('Failed to update analysis status', 500, true, error);
  }
}

async function updateAnalysisJobStatus(analysisId: string, moduleId: string, status: 'processing' | 'completed' | 'failed', errorMessage?: string) {
  const updateData: any = { 
    status,
    ...(status === 'processing' ? { started_at: new Date().toISOString() } : {}),
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

  // Desktop screenshot
  await page.setViewport({ width: 1920, height: 1080 });
  const desktopScreenshot = await page.screenshot({ type: 'jpeg', quality: 85 });
  const desktopPath = `${basePath}/desktop.jpg`;
  await supabase.storage.from('analysis_assets').upload(desktopPath, desktopScreenshot);
  screenshots.push({ type: 'desktop', path: desktopPath });

  // Mobile screenshot
  await page.setViewport({ width: 375, height: 667, isMobile: true });
  const mobileScreenshot = await page.screenshot({ type: 'jpeg', quality: 85 });
  const mobilePath = `${basePath}/mobile.jpg`;
  await supabase.storage.from('analysis_assets').upload(mobilePath, mobileScreenshot);
  screenshots.push({ type: 'mobile', path: mobilePath });

  // Tablet screenshot
  await page.setViewport({ width: 768, height: 1024 });
  const tabletScreenshot = await page.screenshot({ type: 'jpeg', quality: 85 });
  const tabletPath = `${basePath}/tablet.jpg`;
  await supabase.storage.from('analysis_assets').upload(tabletPath, tabletScreenshot);
  screenshots.push({ type: 'tablet', path: tabletPath });

  // Full page screenshot
  await page.setViewport({ width: 1920, height: 1080 });
  const fullPageScreenshot = await page.screenshot({ type: 'jpeg', quality: 85, fullPage: true });
  const fullPagePath = `${basePath}/full-page.jpg`;
  await supabase.storage.from('analysis_assets').upload(fullPagePath, fullPageScreenshot);
  screenshots.push({ type: 'full_page', path: fullPagePath });

  return screenshots;
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
      await updateAnalysisJobStatus(analysisId, fetcherModule.id, 'processing');
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

    // Launch browser with optimized settings
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    // Set user agent to identify as our crawler
    await page.setUserAgent('SiteCraft-Analyzer/1.0 (Web Accessibility Analysis Bot)');
    
    // Block unnecessary resources for performance
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      // Still load CSS and JS for accurate analysis, but block media
      if (['font', 'media'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Navigate to the page
    logger.info('Navigating to target URL');
    await page.goto(targetUrl, { 
      waitUntil: 'networkidle2',
      timeout: config.analysis.timeout || 30000
    });

    // Wait for any dynamic content to load
    await page.waitForTimeout(2000);

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

    // Store all assets in Supabase Storage
    const basePath = `${workspaceId}/${analysisId}`;
    
    // Store HTML
    await supabase.storage
      .from('analysis_assets')
      .upload(`${basePath}/html/index.html`, assets.html, {
        contentType: 'text/html',
        upsert: true
      });

    // Store CSS files
    for (let i = 0; i < assets.css.length; i++) {
      if (assets.css[i]) {
        await supabase.storage
          .from('analysis_assets')
          .upload(`${basePath}/css/styles-${i}.css`, assets.css[i], {
            contentType: 'text/css',
            upsert: true
          });
      }
    }

    // Store JS files
    for (let i = 0; i < assets.js.length; i++) {
      if (assets.js[i]) {
        await supabase.storage
          .from('analysis_assets')
          .upload(`${basePath}/js/script-${i}.js`, assets.js[i], {
            contentType: 'application/javascript',
            upsert: true
          });
      }
    }

    // Store meta files
    if (robots) {
      await supabase.storage
        .from('analysis_assets')
        .upload(`${basePath}/meta/robots.txt`, robots, {
          contentType: 'text/plain',
          upsert: true
        });
    }

    if (sitemap) {
      await supabase.storage
        .from('analysis_assets')
        .upload(`${basePath}/meta/sitemap.xml`, sitemap, {
          contentType: 'application/xml',
          upsert: true
        });
    }

    // Store metadata about what was captured
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

    await supabase.storage
      .from('analysis_assets')
      .upload(`${basePath}/meta/metadata.json`, JSON.stringify(metadata, null, 2), {
        contentType: 'application/json',
        upsert: true
      });

    // Insert screenshot records into database
    const screenshotRecords = screenshots.map(screenshot => ({
      analysis_id: analysisId,
      type: screenshot.type,
      storage_bucket: 'analysis_assets',
      storage_path: screenshot.path,
      url: targetUrl
    }));

    await supabase.from('screenshots').insert(screenshotRecords);

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
  concurrency: config.analysis.maxConcurrentAnalyses || 5,
  // Add retry logic for transient failures
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing fetcher worker...');
  await fetcherWorker.close();
});