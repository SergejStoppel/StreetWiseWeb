const puppeteer = require('puppeteer');
const logger = require('../../utils/logger');

class BrowserUtils {
  constructor() {
    this.browser = null;
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-features=VizDisplayCompositor',
          '--disable-ipc-flooding-protection',
          '--disable-backgrounding-occluded-windows',
          '--disable-background-media-strategy',
          '--disable-web-security',
          '--window-size=1920,1080'
        ],
        defaultViewport: {
          width: 1920,
          height: 1080
        },
        timeout: 60000,
        ignoreHTTPSErrors: true,
        ignoreDefaultArgs: ['--disable-extensions']
      });
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
    
    return page;
  }

  async setupPageInterception(page) {
    // Configure page settings
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      // Block only non-essential resources to speed up loading while preserving accessibility analysis accuracy
      const resourceType = request.resourceType();
      if (['stylesheet', 'font', 'media'].includes(resourceType)) {
        request.abort();
      } else {
        // Allow images and scripts to load for accurate accessibility analysis
        request.continue();
      }
    });
    
    // Handle page errors
    page.on('error', (err) => {
      logger.error(`Page error: ${err.message}`);
    });
    
    page.on('pageerror', (err) => {
      logger.error(`Page error: ${err.message}`);
    });
    
    page.on('console', (msg) => {
      logger.debug(`Console ${msg.type()}: ${msg.text()}`);
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