/**
 * Screenshot Service
 * Captures website screenshots for report headers
 */

const puppeteer = require('puppeteer');
const logger = require('../utils/logger');
const BrowserConfig = require('../utils/browserConfig');

class ScreenshotService {
  constructor() {
    this.browser = null;
    this.isInitialized = false;
    this.browserConfig = new BrowserConfig();
  }

  /**
   * Initialize the browser instance
   */
  async initialize() {
    if (this.isInitialized && this.browser) {
      return;
    }

    try {
      const launchOptions = this.browserConfig.getLaunchOptions();
      logger.info('Initializing screenshot service with cross-platform configuration', {
        platform: this.browserConfig.platform,
        isWSL: this.browserConfig.isWSL,
        executablePath: launchOptions.executablePath || 'bundled'
      });
      
      this.browser = await puppeteer.launch(launchOptions);
      
      this.isInitialized = true;
      logger.info('Screenshot service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize screenshot service:', error);
      throw error;
    }
  }

  /**
   * Capture screenshots for both desktop and mobile viewports
   * @param {string} url - The URL to capture
   * @param {Object} options - Screenshot options
   * @returns {Object} Object with desktop and mobile screenshots
   */
  async captureScreenshots(url, options = {}) {
    try {
      await this.initialize();

      if (!this.browser) {
        throw new Error('Browser not initialized');
      }

      const page = await this.browser.newPage();
      
      // Set user agent to avoid bot detection
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Navigate to the page with timeout
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for potential dynamic content
      await new Promise(resolve => setTimeout(resolve, 2000));

      const screenshots = {};

      // Desktop screenshot
      await page.setViewport({
        width: options.desktopWidth || 1920,
        height: options.desktopHeight || 1080,
        deviceScaleFactor: options.deviceScaleFactor || 1
      });

      screenshots.desktop = await page.screenshot({
        encoding: 'base64',
        fullPage: options.fullPage || false,
        type: 'jpeg',
        quality: options.quality || 85,
        clip: options.desktopClip || {
          x: 0,
          y: 0,
          width: options.desktopWidth || 1920,
          height: Math.min(options.desktopHeight || 1080, 1080)
        }
      });

      // Mobile screenshot
      await page.setViewport({
        width: options.mobileWidth || 375,
        height: options.mobileHeight || 667,
        deviceScaleFactor: options.mobileDeviceScaleFactor || 2
      });

      screenshots.mobile = await page.screenshot({
        encoding: 'base64',
        fullPage: options.fullPage || false,
        type: 'jpeg',
        quality: options.quality || 85,
        clip: options.mobileClip || {
          x: 0,
          y: 0,
          width: options.mobileWidth || 375,
          height: Math.min(options.mobileHeight || 667, 667)
        }
      });

      await page.close();

      logger.info(`Screenshots captured successfully for ${url}`);
      
      return {
        desktop: `data:image/jpeg;base64,${screenshots.desktop}`,
        mobile: `data:image/jpeg;base64,${screenshots.mobile}`,
        timestamp: new Date().toISOString(),
        url: url
      };

    } catch (error) {
      logger.error(`Failed to capture screenshots for ${url}:`, error);
      throw new Error(`Screenshot capture failed: ${error.message}`);
    }
  }

  /**
   * Capture a single screenshot with custom viewport
   * @param {string} url - The URL to capture
   * @param {Object} viewport - Viewport configuration
   * @param {Object} options - Screenshot options
   * @returns {string} Base64 encoded screenshot
   */
  async captureScreenshot(url, viewport, options = {}) {
    try {
      await this.initialize();

      if (!this.browser) {
        throw new Error('Browser not initialized');
      }

      const page = await this.browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      await page.setViewport(viewport);
      
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      const screenshot = await page.screenshot({
        encoding: 'base64',
        fullPage: options.fullPage || false,
        type: options.type || 'jpeg',
        quality: options.quality || 85,
        clip: options.clip
      });

      await page.close();

      return `data:image/${options.type || 'jpeg'};base64,${screenshot}`;

    } catch (error) {
      logger.error(`Failed to capture screenshot for ${url}:`, error);
      throw new Error(`Screenshot capture failed: ${error.message}`);
    }
  }

  /**
   * Capture screenshots with error handling and retries
   * @param {string} url - The URL to capture
   * @param {Object} options - Screenshot options
   * @param {number} maxRetries - Maximum number of retries
   * @returns {Object} Screenshot data or null if failed
   */
  async captureScreenshotsWithRetry(url, options = {}, maxRetries = 3) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Screenshot attempt ${attempt} for ${url}`);
        return await this.captureScreenshots(url, options);
      } catch (error) {
        lastError = error;
        logger.warn(`Screenshot attempt ${attempt} failed for ${url}:`, error.message);
        
        if (attempt < maxRetries) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    logger.error(`All screenshot attempts failed for ${url}:`, lastError);
    return null;
  }

  /**
   * Validate URL before capturing
   * @param {string} url - The URL to validate
   * @returns {boolean} Whether URL is valid
   */
  validateUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get screenshot file size estimate
   * @param {string} screenshot - Base64 screenshot
   * @returns {number} Size in bytes
   */
  getScreenshotSize(screenshot) {
    if (!screenshot || typeof screenshot !== 'string') {
      return 0;
    }
    
    // Remove data URL prefix if present
    const base64Data = screenshot.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Calculate approximate size
    return Math.ceil(base64Data.length * 0.75);
  }

  /**
   * Clean up browser resources
   */
  async cleanup() {
    if (this.browser) {
      try {
        await this.browser.close();
        this.browser = null;
        this.isInitialized = false;
        logger.info('Screenshot service cleaned up successfully');
      } catch (error) {
        logger.error('Error during screenshot service cleanup:', error);
      }
    }
  }

  /**
   * Get service status
   * @returns {Object} Service status information
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasBrowser: !!this.browser,
      timestamp: new Date().toISOString()
    };
  }
}

// Create singleton instance
const screenshotService = new ScreenshotService();

// Cleanup on process exit
process.on('exit', () => {
  screenshotService.cleanup();
});

process.on('SIGINT', () => {
  screenshotService.cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  screenshotService.cleanup();
  process.exit(0);
});

module.exports = screenshotService;