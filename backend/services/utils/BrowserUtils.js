const puppeteer = require('puppeteer');
const logger = require('../../utils/logger');
const BrowserConfig = require('../../utils/browserConfig');

class BrowserUtils {
  constructor() {
    this.browser = null;
    this.browserConfig = new BrowserConfig();
  }

  async initBrowser() {
    if (!this.browser) {
      try {
        const launchOptions = this.browserConfig.getLaunchOptions();
        logger.info('Initializing browser with cross-platform configuration', {
          platform: this.browserConfig.platform,
          isWSL: this.browserConfig.isWSL,
          executablePath: launchOptions.executablePath || 'bundled'
        });
        
        this.browser = await puppeteer.launch(launchOptions);
        logger.info('Browser initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize browser:', error.message);
        throw new Error(`Browser initialization failed: ${error.message}`);
      }
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async createPage() {
    const browser = await this.initBrowser();
    const page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Set timeouts
    await page.setDefaultNavigationTimeout(45000);
    await page.setDefaultTimeout(45000);
    
    // Add stealth measures to avoid bot detection
    await page.evaluateOnNewDocument(() => {
      // Remove webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      
      // Mock chrome property
      window.chrome = {
        runtime: {},
      };
      
      // Mock plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      
      // Mock languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
      
      // Override permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
    });
    
    return page;
  }

  async setupPageInterception(page) {
    try {
      // Configure page settings with more conservative interception
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        try {
          const resourceType = request.resourceType();
          const url = request.url();
          
          // Only block heavy media files and some third-party resources
          // Keep stylesheets and fonts as they're important for accessibility analysis
          if (resourceType === 'media' && (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov'))) {
            request.abort();
          } else if (resourceType === 'image' && (url.includes('banner') || url.includes('ad'))) {
            // Block advertising images but keep content images
            request.abort();
          } else {
            // Allow all other resources including stylesheets, fonts, scripts, and content images
            request.continue();
          }
        } catch (interceptError) {
          // Fallback to allowing the request if interception fails
          try {
            request.continue();
          } catch (continueError) {
            logger.debug('Request interception error (non-critical)', { 
              url: request?.url?.(), 
              error: interceptError.message 
            });
          }
        }
      });
    } catch (setupError) {
      logger.warn('Request interception setup failed, continuing without interception', { 
        error: setupError.message 
      });
    }
    
    // Handle page errors
    page.on('error', (err) => {
      if (err && err.message) {
        logger.error(`Page error: ${err.message}`);
      }
    });
    
    page.on('pageerror', (err) => {
      if (err && err.message) {
        logger.error(`Page error: ${err.message}`);
      }
    });
    
    page.on('console', (msg) => {
      try {
        if (msg && typeof msg.type === 'function' && typeof msg.text === 'function') {
          const msgType = msg.type();
          const msgText = msg.text();
          if (msgType && msgText !== undefined && msgText !== null) {
            logger.debug(`Console ${msgType}: ${msgText}`);
          }
        }
      } catch (consoleError) {
        // Silently ignore console message errors to prevent cascading failures
        logger.debug('Console message handling error (non-critical)', { error: consoleError.message });
      }
    });
  }

  async getPageMetadata(page) {
    try {
      const metadata = await page.evaluate(() => {
        return {
          title: document.title || '',
          description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
          viewport: document.querySelector('meta[name="viewport"]')?.getAttribute('content') || '',
          language: document.documentElement.lang || document.querySelector('html')?.getAttribute('lang') || '',
          charset: document.characterSet || document.charset || '',
          url: window.location.href,
          domain: window.location.hostname,
          protocol: window.location.protocol,
          doctype: document.doctype ? document.doctype.name : '',
          lastModified: document.lastModified || '',
          generator: document.querySelector('meta[name="generator"]')?.getAttribute('content') || '',
          robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') || ''
        };
      });
      return metadata;
    } catch (error) {
      logger.error('Failed to get page metadata:', error);
      return {};
    }
  }

  getBrowser() {
    return this.browser;
  }
}

module.exports = BrowserUtils;