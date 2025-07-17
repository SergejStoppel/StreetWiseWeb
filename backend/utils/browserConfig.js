const os = require('os');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

class BrowserConfig {
  constructor() {
    this.platform = os.platform();
    this.isWSL = this.detectWSL();
    this.isWindows = this.platform === 'win32';
    this.isDocker = this.detectDocker();
    this.chromeExecutablePath = this.findChromeExecutable();
  }

  detectWSL() {
    try {
      // Check for WSL environment indicators
      const procVersion = fs.readFileSync('/proc/version', 'utf8').toLowerCase();
      return procVersion.includes('microsoft') || procVersion.includes('wsl');
    } catch (error) {
      return false;
    }
  }

  detectDocker() {
    try {
      // Check for Docker environment indicators
      return fs.existsSync('/.dockerenv') || 
             (fs.existsSync('/proc/1/cgroup') && 
              fs.readFileSync('/proc/1/cgroup', 'utf8').includes('docker'));
    } catch (error) {
      return false;
    }
  }

  findChromeExecutable() {
    const possiblePaths = [];
    
    if (this.isDocker) {
      // Docker environment - use installed Chrome
      possiblePaths.push(
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium'
      );
    } else if (this.isWindows) {
      // Windows Chrome paths
      possiblePaths.push(
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        path.join(os.homedir(), 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'),
        // Edge as fallback
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
      );
    } else if (this.isWSL) {
      // For WSL, prefer bundled Chromium over Windows Chrome to avoid cross-platform issues
      possiblePaths.push(
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/snap/bin/chromium'
      );
    } else {
      // Linux Chrome paths
      possiblePaths.push(
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/snap/bin/chromium'
      );
    }

    // Find the first existing executable
    for (const chromePath of possiblePaths) {
      try {
        if (fs.existsSync(chromePath)) {
          logger.info(`Found Chrome executable at: ${chromePath}`);
          return chromePath;
        }
      } catch (error) {
        // Continue to next path
      }
    }

    logger.info('No native Chrome executable found, will use Puppeteer bundled version');
    return null;
  }

  getLaunchOptions() {
    // Create a proper user data directory in the project
    const userDataDir = path.join(__dirname, '..', 'chrome-user-data');
    
    // Ensure the directory exists
    if (!fs.existsSync(userDataDir)) {
      fs.mkdirSync(userDataDir, { recursive: true });
    }

    const baseArgs = [
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
      '--window-size=1920,1080',
      `--user-data-dir=${userDataDir}`,
      '--disable-extensions',
      '--disable-default-apps',
      '--disable-background-networking',
      '--disable-sync',
      // Anti-detection measures
      '--disable-blink-features=AutomationControlled',
      '--disable-features=site-per-process',
      '--disable-features=VizDisplayCompositor',
      '--disable-site-isolation-trials',
      '--disable-web-security',
      '--disable-features=TranslateUI',
      '--disable-component-extensions-with-background-pages',
      '--disable-client-side-phishing-detection',
      '--disable-component-update',
      '--disable-domain-reliability',
      '--disable-features=AudioServiceOutOfProcess',
      '--disable-hang-monitor',
      '--disable-notifications',
      '--disable-popup-blocking',
      '--disable-prompt-on-repost',
      '--disable-speech-api',
      '--disable-translate',
      '--ignore-gpu-blacklist',
      '--mute-audio',
      '--no-default-browser-check',
      '--no-pings',
      '--password-store=basic',
      '--use-mock-keychain'
    ];

    const options = {
      headless: 'new',
      args: baseArgs,
      defaultViewport: {
        width: 1920,
        height: 1080
      },
      timeout: 120000,
      ignoreHTTPSErrors: true,
      ignoreDefaultArgs: ['--disable-extensions'],
      userDataDir: userDataDir,
      slowMo: 0,
      devtools: false
    };

    // Add platform-specific configurations
    if (this.isDocker) {
      // Docker-specific configuration - most restrictive for container environment
      options.args.push(
        '--no-zygote',
        '--single-process',
        '--disable-gpu-sandbox',
        '--disable-software-rasterizer',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-component-extensions-with-background-pages',
        '--disable-client-side-phishing-detection',
        '--disable-component-update',
        '--disable-default-apps',
        '--disable-domain-reliability',
        '--disable-features=AudioServiceOutOfProcess',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-notifications',
        '--disable-offer-store-unmasked-wallet-cards',
        '--disable-popup-blocking',
        '--disable-print-preview',
        '--disable-prompt-on-repost',
        '--disable-renderer-backgrounding',
        '--disable-speech-api',
        '--disable-translate',
        '--hide-scrollbars',
        '--ignore-gpu-blacklist',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-default-browser-check',
        '--no-first-run',
        '--no-pings',
        '--password-store=basic',
        '--use-mock-keychain',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor',
        '--disable-site-isolation-trials',
        '--disable-features=site-per-process',
        '--disable-features=TranslateUI,BlinkGenPropertyTrees',
        '--disable-features=Viz',
        '--disable-crash-reporter',
        '--disable-extensions-file-access-check',
        '--disable-extensions-https-enforcement',
        '--disable-extensions-except=',
        '--disable-sync',
        '--disable-default-apps',
        '--disable-translate-new-ux',
        '--disable-features=VizDisplayCompositor',
        '--disable-features=VizServiceDisplayCompositor',
        '--max_old_space_size=4096'
      );
    } else if (this.isWSL && !this.isDocker) {
      // WSL-specific configuration to prevent popups and errors
      options.args.push(
        '--no-zygote',
        '--single-process',
        '--disable-gpu-sandbox',
        '--disable-software-rasterizer',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-component-extensions-with-background-pages',
        '--disable-client-side-phishing-detection',
        '--disable-component-update',
        '--disable-default-apps',
        '--disable-domain-reliability',
        '--disable-features=AudioServiceOutOfProcess',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-notifications',
        '--disable-offer-store-unmasked-wallet-cards',
        '--disable-popup-blocking',
        '--disable-print-preview',
        '--disable-prompt-on-repost',
        '--disable-renderer-backgrounding',
        '--disable-speech-api',
        '--disable-translate',
        '--hide-scrollbars',
        '--ignore-gpu-blacklist',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-default-browser-check',
        '--no-first-run',
        '--no-pings',
        '--password-store=basic',
        '--use-mock-keychain',
        '--disable-blink-features=AutomationControlled'
      );
    }

    if (this.isWindows || this.isWSL) {
      // Windows/WSL specific
      options.args.push(
        '--disable-features=VizDisplayCompositor',
        '--disable-gpu-sandbox'
      );
    }

    // Use found Chrome executable if available
    if (this.chromeExecutablePath) {
      options.executablePath = this.chromeExecutablePath;
    }

    return options;
  }

  async testBrowserLaunch() {
    try {
      const puppeteer = require('puppeteer');
      
      // Clean up any existing Chrome user data directory
      const userDataDir = path.join(__dirname, '..', 'chrome-user-data');
      if (fs.existsSync(userDataDir)) {
        try {
          const { execSync } = require('child_process');
          execSync(`rm -rf "${userDataDir}"`, { stdio: 'ignore' });
        } catch (e) {
          logger.warn('Failed to clean up Chrome user data directory:', e.message);
        }
      }
      
      const options = this.getLaunchOptions();
      
      logger.info('Testing browser launch with configuration:', {
        platform: this.platform,
        isWSL: this.isWSL,
        isWindows: this.isWindows,
        isDocker: this.isDocker,
        executablePath: options.executablePath || 'bundled',
        argsCount: options.args.length
      });

      const browser = await puppeteer.launch(options);
      const page = await browser.newPage();
      await page.goto('data:text/html,<html><body><h1>Test</h1></body></html>');
      await page.close();
      await browser.close();
      
      logger.info('Browser launch test successful');
      return true;
    } catch (error) {
      logger.error('Browser launch test failed:', { 
        message: error.message, 
        stack: error.stack 
      });
      return false;
    }
  }

  getEnvironmentInfo() {
    return {
      platform: this.platform,
      isWSL: this.isWSL,
      isWindows: this.isWindows,
      isDocker: this.isDocker,
      chromeExecutablePath: this.chromeExecutablePath,
      nodeVersion: process.version,
      arch: os.arch()
    };
  }
}

module.exports = BrowserConfig;