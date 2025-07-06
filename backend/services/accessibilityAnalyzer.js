const puppeteer = require('puppeteer');
const { AxePuppeteer } = require('@axe-core/puppeteer');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class AccessibilityAnalyzer {
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

  async analyzeWebsite(url) {
    const analysisId = uuidv4();
    logger.info(`Starting accessibility analysis for ${url}`, { analysisId });

    try {
      // Validate URL
      const validUrl = this.validateUrl(url);
      
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      // Set viewport and user agent
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Set timeouts
      await page.setDefaultNavigationTimeout(45000);
      await page.setDefaultTimeout(45000);
      
      // Configure page settings
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        // Block unnecessary resources to speed up loading
        const resourceType = request.resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          request.abort();
        } else {
          request.continue();
        }
      });
      
      // Handle page errors
      page.on('error', (err) => {
        logger.error(`Page error: ${err.message}`, { analysisId });
      });
      
      page.on('pageerror', (err) => {
        logger.error(`Page script error: ${err.message}`, { analysisId });
      });
      
      logger.info(`Navigating to ${validUrl}`, { analysisId });
      
      try {
        await page.goto(validUrl, { 
          waitUntil: 'domcontentloaded',
          timeout: 45000
        });
        
        // Wait a bit for dynamic content
        await page.waitForTimeout(2000);
        
        // Check if page loaded successfully
        const title = await page.title();
        if (!title) {
          throw new Error('Page failed to load properly');
        }
        
      } catch (navigationError) {
        logger.error(`Navigation failed: ${navigationError.message}`, { analysisId });
        throw new Error(`Unable to load the website: ${navigationError.message}`);
      }
      
      // Get page metadata
      const metadata = await this.getPageMetadata(page);
      
      // Run axe-core accessibility analysis
      const axeResults = await this.runAxeAnalysis(page, analysisId);
      
      // Run custom accessibility checks
      const customChecks = await this.runCustomChecks(page, analysisId);
      
      // Get performance metrics
      const performanceMetrics = await this.getPerformanceMetrics(page, analysisId);
      
      // Generate comprehensive report
      const report = this.generateReport({
        url: validUrl,
        analysisId,
        metadata,
        axeResults,
        customChecks,
        performanceMetrics,
        timestamp: new Date().toISOString()
      });
      
      logger.info(`Analysis completed for ${url}`, { analysisId, score: report.overallScore });
      
      // Clean up
      try {
        await page.close();
      } catch (cleanupError) {
        logger.error(`Page cleanup error: ${cleanupError.message}`, { analysisId });
      }
      
      return report;
      
    } catch (error) {
      logger.error(`Analysis failed for ${url}:`, { error: error.message, analysisId });
      
      // Ensure browser cleanup on error
      try {
        if (this.browser) {
          const pages = await this.browser.pages();
          for (const page of pages) {
            if (!page.isClosed()) {
              await page.close();
            }
          }
        }
      } catch (cleanupError) {
        logger.error(`Cleanup error: ${cleanupError.message}`, { analysisId });
      }
      
      throw new Error(`Failed to analyze website: ${error.message}`);
    }
  }

  validateUrl(url) {
    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Invalid protocol. Only HTTP and HTTPS are supported.');
      }
      return urlObj.href;
    } catch (error) {
      throw new Error('Invalid URL format');
    }
  }

  async getPageMetadata(page) {
    return await page.evaluate(() => {
      const title = document.title;
      const description = document.querySelector('meta[name="description"]')?.content || '';
      const lang = document.documentElement.lang || '';
      const charset = document.querySelector('meta[charset]')?.getAttribute('charset') || '';
      const viewport = document.querySelector('meta[name="viewport"]')?.content || '';
      
      return {
        title,
        description,
        lang,
        charset,
        viewport,
        url: window.location.href
      };
    });
  }

  async runAxeAnalysis(page, analysisId) {
    try {
      logger.info('Running axe-core analysis', { analysisId });
      
      // Wait for page to be ready
      await page.waitForFunction(() => document.readyState === 'complete', { timeout: 10000 }).catch(() => {
        logger.warn('Page ready state timeout, continuing with analysis', { analysisId });
      });
      
      const results = await new AxePuppeteer(page)
        .configure({
          branding: {
            brand: 'SiteCraft',
            application: 'accessibility-analyzer'
          }
        })
        .options({
          reporter: 'v2'
        })
        .analyze();
      
      return {
        violations: results.violations || [],
        passes: results.passes || [],
        incomplete: results.incomplete || [],
        inapplicable: results.inapplicable || [],
        url: results.url,
        timestamp: results.timestamp
      };
    } catch (error) {
      logger.error('Axe analysis failed:', { error: error.message, analysisId });
      
      // Return empty results instead of failing completely
      return {
        violations: [],
        passes: [],
        incomplete: [],
        inapplicable: [],
        url: '',
        timestamp: new Date().toISOString()
      };
    }
  }

  async runCustomChecks(page, analysisId) {
    try {
      logger.info('Running custom accessibility checks', { analysisId });
      
      const checks = await page.evaluate(() => {
        const results = {
          images: [],
          forms: [],
          headings: [],
          links: [],
          colors: [],
          structure: {}
        };

        // Image analysis
        const images = document.querySelectorAll('img');
        images.forEach((img, index) => {
          results.images.push({
            index,
            src: img.src,
            alt: img.alt,
            hasAlt: !!img.alt,
            isEmpty: !img.alt || img.alt.trim() === '',
            isDecorative: img.hasAttribute('aria-hidden') || img.getAttribute('role') === 'presentation'
          });
        });

        // Form analysis
        const forms = document.querySelectorAll('form');
        forms.forEach((form, index) => {
          const inputs = form.querySelectorAll('input, textarea, select');
          const formData = {
            index,
            inputCount: inputs.length,
            inputs: []
          };
          
          inputs.forEach((input, inputIndex) => {
            const label = form.querySelector(`label[for="${input.id}"]`) || 
                         input.closest('label') ||
                         form.querySelector(`label[for="${input.name}"]`);
            
            formData.inputs.push({
              index: inputIndex,
              type: input.type,
              hasLabel: !!label,
              hasPlaceholder: !!input.placeholder,
              hasAriaLabel: !!input.getAttribute('aria-label'),
              required: input.required
            });
          });
          
          results.forms.push(formData);
        });

        // Heading structure analysis
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach((heading, index) => {
          results.headings.push({
            index,
            level: parseInt(heading.tagName.charAt(1)),
            text: heading.textContent.trim(),
            isEmpty: !heading.textContent.trim()
          });
        });

        // Link analysis
        const links = document.querySelectorAll('a');
        links.forEach((link, index) => {
          results.links.push({
            index,
            href: link.href,
            text: link.textContent.trim(),
            isEmpty: !link.textContent.trim(),
            hasTitle: !!link.title,
            hasAriaLabel: !!link.getAttribute('aria-label'),
            opensNewWindow: link.target === '_blank'
          });
        });

        // Color contrast analysis (simplified)
        const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button');
        const colorSamples = [];
        
        for (let i = 0; i < Math.min(textElements.length, 50); i++) {
          const element = textElements[i];
          const computedStyle = window.getComputedStyle(element);
          const color = computedStyle.color;
          const backgroundColor = computedStyle.backgroundColor;
          
          if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
            colorSamples.push({
              color,
              backgroundColor,
              fontSize: computedStyle.fontSize,
              fontWeight: computedStyle.fontWeight
            });
          }
        }
        
        results.colors = colorSamples;

        // Page structure analysis
        results.structure = {
          hasH1: !!document.querySelector('h1'),
          h1Count: document.querySelectorAll('h1').length,
          hasMain: !!document.querySelector('main'),
          hasNav: !!document.querySelector('nav'),
          hasFooter: !!document.querySelector('footer'),
          hasSkipLink: !!document.querySelector('a[href^="#"]'),
          totalElements: document.querySelectorAll('*').length,
          interactiveElements: document.querySelectorAll('a, button, input, select, textarea').length
        };

        return results;
      });

      return checks;
    } catch (error) {
      logger.error('Custom checks failed:', { error: error.message, analysisId });
      throw error;
    }
  }

  async getPerformanceMetrics(page, analysisId) {
    try {
      logger.info('Getting performance metrics', { analysisId });
      
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        return {
          loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
          domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
          firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
          totalElements: document.querySelectorAll('*').length,
          imageCount: document.querySelectorAll('img').length,
          scriptCount: document.querySelectorAll('script').length,
          stylesheetCount: document.querySelectorAll('link[rel="stylesheet"]').length
        };
      });

      return metrics;
    } catch (error) {
      logger.error('Performance metrics failed:', { error: error.message, analysisId });
      return {};
    }
  }

  generateReport(data) {
    const { url, analysisId, metadata, axeResults, customChecks, performanceMetrics, timestamp } = data;
    
    // Calculate accessibility score
    const totalViolations = axeResults.violations.length;
    const criticalViolations = axeResults.violations.filter(v => v.impact === 'critical').length;
    const seriousViolations = axeResults.violations.filter(v => v.impact === 'serious').length;
    const moderateViolations = axeResults.violations.filter(v => v.impact === 'moderate').length;
    const minorViolations = axeResults.violations.filter(v => v.impact === 'minor').length;
    
    // Scoring algorithm (0-100)
    let accessibilityScore = 100;
    accessibilityScore -= (criticalViolations * 20);
    accessibilityScore -= (seriousViolations * 10);
    accessibilityScore -= (moderateViolations * 5);
    accessibilityScore -= (minorViolations * 2);
    accessibilityScore = Math.max(0, accessibilityScore);
    
    // Custom checks scoring
    const imagesWithoutAlt = customChecks.images.filter(img => !img.hasAlt && !img.isDecorative).length;
    const formsWithoutLabels = customChecks.forms.reduce((count, form) => 
      count + form.inputs.filter(input => !input.hasLabel && !input.hasAriaLabel).length, 0);
    const emptyLinks = customChecks.links.filter(link => link.isEmpty).length;
    
    let customScore = 100;
    customScore -= (imagesWithoutAlt * 5);
    customScore -= (formsWithoutLabels * 8);
    customScore -= (emptyLinks * 3);
    customScore = Math.max(0, customScore);
    
    // Overall score
    const overallScore = Math.round((accessibilityScore + customScore) / 2);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(axeResults, customChecks);
    
    return {
      analysisId,
      url,
      timestamp,
      metadata,
      scores: {
        overall: overallScore,
        accessibility: Math.round(accessibilityScore),
        custom: Math.round(customScore)
      },
      summary: {
        totalViolations,
        criticalViolations,
        seriousViolations,
        moderateViolations,
        minorViolations,
        imagesWithoutAlt,
        formsWithoutLabels,
        emptyLinks
      },
      axeResults,
      customChecks,
      performanceMetrics,
      recommendations,
      reportGenerated: new Date().toISOString()
    };
  }

  generateRecommendations(axeResults, customChecks) {
    const recommendations = [];
    
    // High priority recommendations
    if (axeResults.violations.some(v => v.impact === 'critical')) {
      recommendations.push({
        priority: 'high',
        category: 'Critical Issues',
        title: 'Fix Critical Accessibility Violations',
        description: 'Your website has critical accessibility issues that severely impact users with disabilities.',
        action: 'Review and fix all critical violations immediately'
      });
    }
    
    const imagesWithoutAlt = customChecks.images.filter(img => !img.hasAlt && !img.isDecorative);
    if (imagesWithoutAlt.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'Images',
        title: 'Add Alt Text to Images',
        description: `${imagesWithoutAlt.length} images are missing alt text.`,
        action: 'Add descriptive alt text to all images that convey information'
      });
    }
    
    // Medium priority recommendations
    const formsWithoutLabels = customChecks.forms.reduce((count, form) => 
      count + form.inputs.filter(input => !input.hasLabel && !input.hasAriaLabel).length, 0);
    if (formsWithoutLabels > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'Forms',
        title: 'Add Labels to Form Fields',
        description: `${formsWithoutLabels} form fields are missing proper labels.`,
        action: 'Associate labels with form fields using <label> elements or aria-label attributes'
      });
    }
    
    if (!customChecks.structure.hasH1) {
      recommendations.push({
        priority: 'medium',
        category: 'Structure',
        title: 'Add Main Heading',
        description: 'Your page is missing an H1 heading.',
        action: 'Add a clear H1 heading that describes the main content of the page'
      });
    }
    
    // Low priority recommendations
    const emptyLinks = customChecks.links.filter(link => link.isEmpty);
    if (emptyLinks.length > 0) {
      recommendations.push({
        priority: 'low',
        category: 'Links',
        title: 'Fix Empty Links',
        description: `${emptyLinks.length} links have no text content.`,
        action: 'Add descriptive text to all links or use aria-label for icon links'
      });
    }
    
    return recommendations;
  }
}

module.exports = new AccessibilityAnalyzer();