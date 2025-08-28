import { Job, Worker } from 'bullmq';
import puppeteer, { Browser, Page, Frame } from 'puppeteer';
import { config } from '@/config';
import { createLogger } from '@/config/logger';
import { supabase } from '@/config/supabase';
import { AppError } from '@/types';

const logger = createLogger('fetcher-worker');

interface FetcherJobData {
  analysisId: string;
  workspaceId: string;
  websiteId: string;
  userId: string;
  url?: string;
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
    throw new AppError(`Failed to update analysis status: ${error.message}`, 500, true, error.message);
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

async function captureScreenshots(page: Page, workspaceId: string, analysisId: string) {
  const screenshots = [];
  const basePath = `${workspaceId}/${analysisId}/screenshots`;

  try {
    logger.info('Starting screenshot capture (desktop and mobile only)', { basePath });

    // Desktop screenshot
    logger.info('Capturing desktop screenshot');
    await page.setViewport({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000); // Allow viewport to settle
    const desktopScreenshot = await Promise.race([
      page.screenshot({ type: 'jpeg', quality: 85 }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Desktop screenshot timeout')), 10000))
    ]);
    const desktopPath = `${basePath}/desktop.jpg`;
    const { error: desktopError } = await supabase.storage
      .from('analysis-assets')
      .upload(desktopPath, desktopScreenshot as any, { upsert: true });
    
    if (desktopError) {
      logger.warn('Failed to upload desktop screenshot', { error: desktopError.message });
    } else {
      screenshots.push({ type: 'desktop', path: desktopPath });
      logger.info('Desktop screenshot captured and uploaded');
    }

    // Mobile screenshot
    logger.info('Capturing mobile screenshot');
    await page.setViewport({ width: 375, height: 667, isMobile: true });
    await page.waitForTimeout(1000); // Allow viewport to settle
    const mobileScreenshot = await Promise.race([
      page.screenshot({ type: 'jpeg', quality: 85 }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Mobile screenshot timeout')), 10000))
    ]);
    const mobilePath = `${basePath}/mobile.jpg`;
    const { error: mobileError } = await supabase.storage
      .from('analysis-assets')
      .upload(mobilePath, mobileScreenshot as any, { upsert: true });
    
    if (mobileError) {
      logger.warn('Failed to upload mobile screenshot', { error: mobileError.message });
    } else {
      screenshots.push({ type: 'mobile', path: mobilePath });
      logger.info('Mobile screenshot captured and uploaded');
    }

    logger.info('Screenshot capture completed', { count: screenshots.length });
    return screenshots;

  } catch (error) {
    logger.error('Screenshot capture failed', { error: error.message });
    return screenshots; // Return any screenshots we managed to capture
  }
}

async function tryClickSelectors(frame: Frame, selectors: string[]): Promise<boolean> {
  for (const selector of selectors) {
    try {
      const handle = await frame.$(selector);
      if (handle) {
        await handle.click({ delay: 20 });
        return true;
      }
    } catch (_) {}
  }
  return false;
}

async function tryClickByText(frame: Frame, keywords: string[]): Promise<boolean> {
  try {
    const clicked = await frame.evaluate((acceptKeywords: string[]) => {
      const isVisible = (el: any) => {
        const style = (globalThis as any).getComputedStyle(el);
        const rect = (el as any).getBoundingClientRect();
        return style && style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      };

      const doc = (globalThis as any).document as any;
      const candidates = Array.from(doc.querySelectorAll('button, [role="button"], input[type="button"], a')) as any[];
      const lowerKeywords = acceptKeywords.map(k => k.toLowerCase());

      const findMatch = (elements: any[]) => elements.find(el => {
        const text = ((el.innerText as string) || (el.textContent as string) || '').trim().toLowerCase();
        if (!text || !isVisible(el)) return false;
        return lowerKeywords.some(k => text.includes(k));
      });

      const match = findMatch(candidates);
      if (match) {
        match.click();
        return true;
      }
      return false;
    }, keywords);
    return Boolean(clicked);
  } catch (_) {
    return false;
  }
}

async function dismissCookieBanners(page: Page): Promise<boolean> {
  const selectors = [
    '#onetrust-accept-btn-handler',
    '.onetrust-accept-btn-handler',
    '#truste-consent-button',
    '.truste-button1',
    'button[aria-label="Accept cookies"]',
    'button[title*="Accept"]',
    'button[title*="ACCEPT"]',
  ];

  const acceptKeywords = [
    // English
    'accept all', 'accept', 'agree', 'allow all', 'i agree', 'got it', 'yes, i agree',
    // German
    'alle akzeptieren', 'akzeptieren', 'zustimmen', 'ich stimme zu',
    // French
    'tout accepter', 'accepter', "j\'accepte", 'je consens',
    // Spanish/Portuguese/Italian
    'aceptar', 'aceptar todo', 'aceitar', 'aceitar todos', 'accetta', 'accetta tutto',
    // Dutch
    'accepteren', 'alles accepteren',
  ];

  try {
    // Try top frame selectors first
    if (await tryClickSelectors(page.mainFrame(), selectors)) {
      await page.waitForTimeout(500);
      return true;
    }

    // Try generic keyword match
    if (await tryClickByText(page.mainFrame(), acceptKeywords)) {
      await page.waitForTimeout(500);
      return true;
    }

    // Try iframes (many CMPs load in iframes)
    for (const frame of page.frames()) {
      if (frame === page.mainFrame()) continue;
      if (await tryClickSelectors(frame, selectors)) {
        await page.waitForTimeout(500);
        return true;
      }
      if (await tryClickByText(frame, acceptKeywords)) {
        await page.waitForTimeout(500);
        return true;
      }
    }

  } catch (error: any) {
    // Non-fatal
  }
  return false;
}

export const fetcherWorker = new Worker('fetcher', async (job: Job<FetcherJobData>) => {
  const { analysisId, workspaceId, websiteId, userId, url } = job.data;
  logger.info('Starting lightweight fetcher job', { analysisId, workspaceId, websiteId });

  let browser: Browser | null = null;
  
  try {
    // Update analysis status
    await updateAnalysisStatus(analysisId, 'processing');
    
    // Get the fetcher module ID
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

    // Launch browser with optimized settings
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
        '--disable-site-isolation-trials'
      ],
      timeout: 30000
    });

    const page = await browser.newPage();
    
    // Configure page settings
    await page.setDefaultTimeout(15000);
    await page.setDefaultNavigationTimeout(15000);
    
    // Set user agent
    await page.setUserAgent('SiteCraft-Analyzer/1.0 (Web Accessibility Analysis Bot)');
    
    // Block unnecessary resources for faster loading
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      // Block media and fonts for faster loading
      if (['media', 'font'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Navigate to the page
    logger.info('Navigating to target URL');
    
    let navigationResponse: any = null;
    try {
      navigationResponse = await page.goto(targetUrl, { 
        waitUntil: 'networkidle2',
        timeout: 20000
      });
      logger.info('Navigation successful', { targetUrl });
    } catch (navigationError) {
      logger.warn('Initial navigation failed, retrying with simpler settings', { 
        error: navigationError.message,
        targetUrl 
      });
      
      // Retry with simpler settings
      navigationResponse = await page.goto(targetUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });
      
      // Wait a bit for JS to execute
      await page.waitForTimeout(3000);
    }

    // Persist rendered HTML, headers and robots.txt for analyzers
    const basePath = `${workspaceId}/${analysisId}`;
    try {
      // Save rendered HTML snapshot
      const html = await page.content();
      const { error: htmlError } = await supabase.storage
        .from('analysis-assets')
        .upload(`${basePath}/html/index.html`, html, {
          contentType: 'text/html; charset=utf-8',
          upsert: true,
        });
      if (htmlError) {
        logger.warn('Failed to upload rendered HTML', { error: htmlError.message });
      } else {
        logger.info('Rendered HTML uploaded');
      }

      // Save response headers
      const headersPayload = {
        status: navigationResponse?.status?.() ?? null,
        statusText: undefined as any,
        url: navigationResponse?.url?.() ?? targetUrl,
        headers: navigationResponse?.headers?.() ?? {},
        capturedAt: new Date().toISOString(),
      };
      const { error: headersError } = await supabase.storage
        .from('analysis-assets')
        .upload(`${basePath}/meta/headers.json`, JSON.stringify(headersPayload, null, 2), {
          contentType: 'application/json',
          upsert: true,
        });
      if (headersError) {
        logger.warn('Failed to upload headers.json', { error: headersError.message });
      } else {
        logger.info('headers.json uploaded');
      }

      // Try to fetch robots.txt and save if available
      try {
        const origin = new URL(targetUrl).origin;
        const robotsUrl = `${origin}/robots.txt`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const resp = await fetch(robotsUrl, { signal: controller.signal, redirect: 'follow', headers: { 'User-Agent': 'SiteCraft-Analyzer/1.0' } as any });
        clearTimeout(timeout);
        if (resp.ok) {
          const robotsTxt = await resp.text();
          if (robotsTxt && robotsTxt.trim().length > 0) {
            const { error: robotsError } = await supabase.storage
              .from('analysis-assets')
              .upload(`${basePath}/meta/robots.txt`, robotsTxt, {
                contentType: 'text/plain; charset=utf-8',
                upsert: true,
              });
            if (robotsError) {
              logger.warn('Failed to upload robots.txt', { error: robotsError.message });
            } else {
              logger.info('robots.txt uploaded');
            }
          }
        } else {
          logger.info('robots.txt not found or not ok', { status: resp.status });
        }
      } catch (robotsFetchError: any) {
        logger.warn('robots.txt fetch failed', { error: robotsFetchError?.message || 'Unknown robots error' });
      }
    } catch (persistError: any) {
      logger.warn('Failed persisting analyzer artifacts', { error: persistError?.message || 'Unknown persist error' });
    }

    // Attempt to dismiss cookie banners for cleaner screenshots
    try {
      const dismissed = await dismissCookieBanners(page);
      if (dismissed) {
        logger.info('Cookie banner dismissed before screenshots');
      } else {
        logger.info('No cookie banner dismissed (none detected or not clickable)');
      }
    } catch (e: any) {
      logger.warn('Cookie banner dismissal failed', { error: e?.message || 'unknown' });
    }

    // Capture screenshots (desktop and mobile only)
    logger.info('Capturing screenshots');
    const screenshots = await captureScreenshots(page, workspaceId, analysisId);

    // Store basic metadata
    logger.info('Storing metadata');
    const metadata = {
      url: targetUrl,
      finalUrl: navigationResponse?.url?.() ?? targetUrl,
      status: navigationResponse?.status?.() ?? null,
      capturedAt: new Date().toISOString(),
      screenshots: screenshots.map(s => s.type)
    };

    const { error: metadataError } = await supabase.storage
      .from('analysis-assets')
      .upload(`${basePath}/metadata.json`, JSON.stringify(metadata, null, 2), {
        contentType: 'application/json',
        upsert: true
      });
    
    if (metadataError) {
      logger.warn('Failed to store metadata', { error: metadataError.message });
    } else {
      logger.info('Metadata stored successfully');
    }

    // Insert screenshot records into database
    if (screenshots.length > 0) {
      logger.info('Inserting screenshot records', { count: screenshots.length });
      const screenshotRecords = screenshots.map(screenshot => ({
        analysis_id: analysisId,
        type: screenshot.type,
        storage_bucket: 'analysis-assets',
        storage_path: screenshot.path,
        url: targetUrl
      }));

      const { error: screenshotError } = await supabase
        .from('screenshots')
        .insert(screenshotRecords);
      
      if (screenshotError) {
        logger.warn('Failed to insert screenshot records', { error: screenshotError.message });
      } else {
        logger.info('Screenshot records inserted successfully');
      }
    }

    // Update job status
    if (fetcherModule) {
      await updateAnalysisJobStatus(analysisId, fetcherModule.id, 'completed');
    }

    logger.info('Lightweight fetcher completed successfully', { 
      analysisId, 
      workspaceId,
      assetPath: basePath,
      screenshotCount: screenshots.length
    });

    // Return minimal data for other workers
    return {
      success: true,
      assetPath: basePath,
      metadata: {
        url: targetUrl,
        finalUrl: navigationResponse?.url?.() ?? targetUrl,
        status: navigationResponse?.status?.() ?? null,
        screenshots: screenshots.length
      }
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
  concurrency: 2 // Reduced concurrency for resource management
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing fetcher worker...');
  await fetcherWorker.close();
});