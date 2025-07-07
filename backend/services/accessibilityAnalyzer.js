const puppeteer = require('puppeteer');
const { AxePuppeteer } = require('@axe-core/puppeteer');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const pdfGenerator = require('./pdfGenerator');
const i18n = require('../utils/i18n');

class AccessibilityAnalyzer {
  constructor() {
    this.browser = null;
    // In-memory storage for full analysis data (in production, use Redis or database)
    this.analysisCache = new Map();
    this.pdfCache = new Map();
    
    // Cache TTL: 24 hours for analysis data, 1 hour for PDFs (PDFs can be regenerated)
    this.ANALYSIS_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
    this.PDF_CACHE_TTL = 60 * 60 * 1000; // 1 hour
    
    // Start cache cleanup interval
    this.startCacheCleanup();
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

  async analyzeWebsite(url, reportType = 'overview', language = 'en') {
    const analysisId = uuidv4();
    logger.info(`Starting accessibility analysis for ${url}`, { analysisId, reportType });

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
        logger.error(`Page error: ${err.message}`, { analysisId });
      });
      
      page.on('pageerror', (err) => {
        logger.error(`Page script error: ${err.message}`, { analysisId });
      });
      
      logger.info(`Navigating to ${validUrl}`, { analysisId });
      
      try {
        await page.goto(validUrl, { 
          waitUntil: 'networkidle2',
          timeout: 45000
        });
        
        // Wait for dynamic content and images to load
        await page.waitForTimeout(5000);
        
        // Wait for images to load or timeout after 10 seconds
        try {
          await page.waitForFunction(() => {
            const images = document.querySelectorAll('img');
            return Array.from(images).every(img => 
              img.complete || 
              img.naturalWidth > 0 ||
              img.hasAttribute('aria-hidden') ||
              img.getAttribute('role') === 'presentation'
            );
          }, { timeout: 10000 });
        } catch (loadError) {
          logger.warn('Some images may not have fully loaded', { analysisId });
        }
        
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
      
      // Always generate detailed report first
      const detailedReport = this.generateReport({
        url: validUrl,
        analysisId,
        metadata,
        axeResults,
        customChecks,
        performanceMetrics,
        timestamp: new Date().toISOString(),
        reportType: 'detailed'
      }, language);
      
      // Store full analysis data in cache with timestamp
      this.analysisCache.set(analysisId, {
        data: detailedReport,
        timestamp: Date.now()
      });
      
      // Generate PDF asynchronously and cache it
      this.generateAndCachePDF(detailedReport, language).catch(error => {
        logger.error(`PDF generation failed for ${analysisId}:`, error);
      });
      
      // Return appropriate report based on requested type
      const report = reportType === 'detailed' ? detailedReport : this.generateReport({
        url: validUrl,
        analysisId,
        metadata,
        axeResults,
        customChecks,
        performanceMetrics,
        timestamp: new Date().toISOString(),
        reportType: 'overview'
      }, language);

      // Final consistency check
      logger.info(`Final report summary`, {
        analysisId,
        requestedReportType: reportType,
        actualReportType: report.reportType,
        imagesWithoutAlt: report.summary.imagesWithoutAlt,
        totalViolations: report.summary.totalViolations,
        detailedReportImages: detailedReport.summary.imagesWithoutAlt
      });
      
      logger.info(`Analysis completed for ${url}`, { analysisId, score: report.scores.overall, reportType });
      
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

        // Helper function to detect meaningless alt text
        const isMeaninglessAlt = (altText) => {
          if (!altText || altText.trim() === '') return false; // Empty alt is valid for decorative images
          
          const meaninglessPatterns = [
            /^\.+$/, // Just dots: ".", "..", "..."
            /^image$/i, // Just "image"
            /^photo$/i, // Just "photo" 
            /^picture$/i, // Just "picture"
            /^img$/i, // Just "img"
            /^graphic$/i, // Just "graphic"
            /^logo$/i, // Just "logo"
            /^icon$/i, // Just "icon"
            /^\d+$/, // Just numbers
            /^untitled/i, // "untitled", "untitled-1", etc.
            /^dsc_?\d+/i, // Camera defaults like "DSC_1234"
            /^img_?\d+/i, // Generic like "IMG_1234"
            /^screenshot/i, // "screenshot", "screenshot1", etc.
            /^[a-z0-9_-]{1,3}$/i, // Very short meaningless strings
            /^(jpeg|jpg|png|gif|svg|webp)$/i, // Just file extensions
          ];
          
          const trimmed = altText.trim().toLowerCase();
          
          // Check against patterns
          if (meaninglessPatterns.some(pattern => pattern.test(trimmed))) {
            return true;
          }
          
          // Check if it's just a filename (contains file extension)
          if (trimmed.match(/\.(jpg|jpeg|png|gif|svg|webp|bmp)$/i)) {
            return true;
          }
          
          // Check if it's too short to be meaningful (less than 3 characters)
          if (trimmed.length < 3) {
            return true;
          }
          
          return false;
        };

        // Image analysis with improved decorative image detection
        const images = document.querySelectorAll('img');
        images.forEach((img, index) => {
          // More comprehensive decorative image detection
          const isDecorative = 
            img.hasAttribute('aria-hidden') ||
            img.getAttribute('role') === 'presentation' ||
            img.getAttribute('role') === 'img' ||
            img.alt === '' || // Empty alt is valid for decorative images
            img.closest('[aria-hidden="true"]') ||
            img.hasAttribute('data-decorative') ||
            // Check if image is in a decorative context
            img.closest('.icon, .logo, .decoration, .bg-image, [role="img"]') ||
            // SVG images are often decorative
            img.src.includes('.svg') ||
            // Very small images are often decorative (icons, spacers)
            (img.naturalWidth > 0 && img.naturalWidth <= 16 && img.naturalHeight <= 16);

          const hasValidAlt = img.alt !== null && img.alt !== undefined;
          const altText = img.alt || '';
          const hasMeaninglessAlt = hasValidAlt && isMeaninglessAlt(altText);
          
          
          results.images.push({
            index,
            src: img.src,
            alt: altText,
            hasAlt: hasValidAlt,
            isEmpty: !altText || altText.trim() === '',
            isDecorative,
            hasMeaninglessAlt,
            hasGoodAlt: hasValidAlt && !hasMeaninglessAlt && altText.trim() !== '',
            naturalWidth: img.naturalWidth || 0,
            naturalHeight: img.naturalHeight || 0,
            isLoaded: img.complete && img.naturalWidth > 0,
            // Add debugging info
            selector: img.tagName.toLowerCase() + (img.id ? '#' + img.id : '') + (img.className ? '.' + img.className.split(' ').join('.') : ''),
            context: img.closest('[class*="post"], [class*="content"], [class*="article"], main, section')?.tagName || 'unknown'
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

  generateReport(data, language = 'en') {
    const { url, analysisId, metadata, axeResults, customChecks, performanceMetrics, timestamp, reportType = 'overview' } = data;
    
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
    
    // Custom checks scoring - images with missing or meaningless alt text
    const imagesWithInadequateAlt = customChecks.images.filter(img => 
      !img.isDecorative && 
      img.isLoaded && // Only count loaded images
      img.naturalWidth > 16 && // Exclude very small images (likely icons)
      img.naturalHeight > 16 &&
      img.src && // Must have a source
      !img.src.includes('data:') && // Exclude data URLs (often decorative)
      (!img.hasAlt || img.hasMeaninglessAlt) // Missing alt OR meaningless alt
    );
    
    const formsWithoutLabels = customChecks.forms.reduce((count, form) => 
      count + form.inputs.filter(input => !input.hasLabel && !input.hasAriaLabel).length, 0);
    const emptyLinks = customChecks.links.filter(link => link.isEmpty).length;
    
    let customScore = 100;
    // Penalties for usability issues
    customScore -= (imagesWithInadequateAlt.length * 4); // Increased since this includes meaningful content
    customScore -= (formsWithoutLabels * 5);
    customScore -= (emptyLinks * 2);
    customScore = Math.max(0, customScore);
    
    // Overall score
    const overallScore = Math.round((accessibilityScore + customScore) / 2);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(axeResults, customChecks, reportType, language);
    
    // Determine if site has excellent accessibility (very few/no real issues)
    const hasExcellentAccessibility = 
      criticalViolations === 0 && 
      seriousViolations === 0 && 
      moderateViolations <= 1 && 
      imagesWithInadequateAlt.length === 0 &&
      formsWithoutLabels === 0 &&
      emptyLinks === 0;

    // Log scoring details for debugging
    logger.info('Accessibility scoring details', {
      analysisId,
      url,
      criticalViolations,
      seriousViolations,
      moderateViolations,
      minorViolations,
      imagesWithInadequateAlt: imagesWithInadequateAlt.length,
      totalImagesAnalyzed: customChecks.images.length,
      imagesWithMeaninglessAlt: customChecks.images.filter(img => img.hasMeaninglessAlt).length,
      imagesWithoutAltAttribute: customChecks.images.filter(img => !img.hasAlt).length,
      formsWithoutLabels,
      emptyLinks,
      accessibilityScore: Math.round(accessibilityScore),
      customScore: Math.round(customScore),
      overallScore,
      hasExcellentAccessibility
    });
    
    // Log data consistency for debugging
    logger.info(`Report generation for ${reportType}`, {
      analysisId,
      url,
      reportType,
      imagesWithInadequateAlt: imagesWithInadequateAlt.length,
      totalImagesAnalyzed: customChecks.images.length,
      totalViolations,
      criticalViolations,
      seriousViolations
    });

    const baseReport = {
      analysisId,
      url,
      timestamp,
      reportType,
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
        imagesWithoutAlt: imagesWithInadequateAlt.length, // Use new comprehensive count
        formsWithoutLabels,
        emptyLinks,
        hasExcellentAccessibility // Flag for frontend to show appropriate messaging
      },
      recommendations,
      reportGenerated: new Date().toISOString()
    };

    // Add full details for detailed reports only
    if (reportType === 'detailed') {
      baseReport.axeResults = axeResults;
      baseReport.customChecks = customChecks;
      baseReport.performanceMetrics = performanceMetrics;
    } else {
      // Overview report - show only basic issue counts, no specific violations
      const criticalCount = axeResults.violations.filter(v => v.impact === 'critical').length;
      const seriousCount = axeResults.violations.filter(v => v.impact === 'serious').length;
      
      baseReport.issuePreview = {
        criticalIssues: criticalCount,
        seriousIssues: seriousCount,
        hasViolations: axeResults.violations.length > 0,
        categories: [...new Set(axeResults.violations.map(v => v.tags[0] || 'other'))].slice(0, 3)
      };
      
      baseReport.upgradeInfo = {
        available: true,
        features: [
          'Complete list of all accessibility violations with specific locations',
          'Step-by-step fixing instructions with code examples', 
          'WCAG compliance guidelines and success criteria',
          'Performance metrics and page load optimization',
          'Custom accessibility checks for images, forms, and navigation',
          'Professional PDF report with executive summary and technical details',
          'Detailed priority matrix for development teams',
          'Before/after examples and implementation best practices'
        ]
      };
    }

    return baseReport;
  }

  async generateAndCachePDF(reportData, language = 'en') {
    try {
      logger.info(`Starting background PDF generation for ${reportData.analysisId}`, { language });
      const pdfBuffer = await pdfGenerator.generateAccessibilityReport(reportData, language);
      const cacheKey = `${reportData.analysisId}_${language}`;
      this.pdfCache.set(cacheKey, {
        buffer: pdfBuffer,
        timestamp: Date.now()
      });
      logger.info(`PDF cached successfully for ${reportData.analysisId}`, { size: pdfBuffer.length, language });
    } catch (error) {
      logger.error(`PDF generation failed for ${reportData.analysisId}:`, error);
      throw error;
    }
  }

  getDetailedReport(analysisId) {
    const cached = this.analysisCache.get(analysisId);
    if (!cached) return null;
    
    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.ANALYSIS_CACHE_TTL) {
      this.analysisCache.delete(analysisId);
      return null;
    }
    
    return cached.data;
  }

  getCachedPDF(analysisId) {
    const cached = this.pdfCache.get(analysisId);
    if (!cached) return null;
    
    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.PDF_CACHE_TTL) {
      this.pdfCache.delete(analysisId);
      return null;
    }
    
    return cached.buffer;
  }

  clearCache(analysisId) {
    this.analysisCache.delete(analysisId);
    this.pdfCache.delete(analysisId);
  }

  startCacheCleanup() {
    // Clean up expired cache entries every 30 minutes
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 30 * 60 * 1000);
  }

  cleanupExpiredCache() {
    const now = Date.now();
    
    // Clean up expired analysis cache
    for (const [analysisId, cached] of this.analysisCache.entries()) {
      if (now - cached.timestamp > this.ANALYSIS_CACHE_TTL) {
        this.analysisCache.delete(analysisId);
        logger.info(`Cleaned up expired analysis cache for ${analysisId}`);
      }
    }
    
    // Clean up expired PDF cache
    for (const [analysisId, cached] of this.pdfCache.entries()) {
      if (now - cached.timestamp > this.PDF_CACHE_TTL) {
        this.pdfCache.delete(analysisId);
        logger.info(`Cleaned up expired PDF cache for ${analysisId}`);
      }
    }
    
    logger.debug(`Cache cleanup completed. Analysis cache size: ${this.analysisCache.size}, PDF cache size: ${this.pdfCache.size}`);
  }

  generateRecommendations(axeResults, customChecks, reportType = 'overview', language = 'en') {
    const recommendations = [];
    
    if (reportType === 'detailed') {
      // Detailed recommendations with specific counts and instructions
      if (axeResults.violations.some(v => v.impact === 'critical')) {
        const criticalCount = axeResults.violations.filter(v => v.impact === 'critical').length;
        recommendations.push({
          priority: 'high',
          category: i18n.t('reports:recommendations.categories.criticalIssues', language),
          title: i18n.t('reports:recommendations.titles.fixCriticalViolations', language),
          description: i18n.t('reports:recommendations.descriptions.criticalAccessibilityIssues', language, { count: criticalCount }),
          action: i18n.t('reports:recommendations.actions.reviewCriticalViolations', language)
        });
      }
      
      // Check for images with missing or meaningless alt text
      const imagesWithInadequateAlt = customChecks.images.filter(img => 
        !img.isDecorative && 
        img.isLoaded && 
        img.naturalWidth > 16 && 
        img.naturalHeight > 16 &&
        img.src && 
        !img.src.includes('data:') &&
        (!img.hasAlt || img.hasMeaninglessAlt)
      );
      
      if (imagesWithInadequateAlt.length > 0) {
        const missingAlt = imagesWithInadequateAlt.filter(img => !img.hasAlt).length;
        const meaninglessAlt = imagesWithInadequateAlt.filter(img => img.hasMeaninglessAlt).length;
        
        let description = '';
        if (missingAlt > 0 && meaninglessAlt > 0) {
          description = i18n.t('reports:recommendations.descriptions.imagesMissingAndMeaninglessAlt', language, { 
            missing: missingAlt, 
            meaningless: meaninglessAlt,
            total: imagesWithInadequateAlt.length
          });
        } else if (meaninglessAlt > 0) {
          description = i18n.t('reports:recommendations.descriptions.imagesMeaninglessAlt', language, { count: meaninglessAlt });
        } else {
          description = i18n.t('reports:recommendations.descriptions.imagesMissingAltText', language, { count: missingAlt });
        }
        
        recommendations.push({
          priority: 'high',
          category: i18n.t('reports:recommendations.categories.images', language),
          title: i18n.t('reports:recommendations.titles.improveImageAltText', language),
          description,
          action: i18n.t('reports:recommendations.actions.addDescriptiveAltText', language),
          details: {
            imagesWithIssues: imagesWithInadequateAlt.map(img => ({
              src: img.src,
              alt: img.alt,
              issue: img.hasAlt ? 'meaningless' : 'missing',
              selector: img.selector,
              context: img.context
            }))
          }
        });
      }
      
      const formsWithoutLabels = customChecks.forms.reduce((count, form) => 
        count + form.inputs.filter(input => !input.hasLabel && !input.hasAriaLabel).length, 0);
      if (formsWithoutLabels > 0) {
        recommendations.push({
          priority: 'medium',
          category: i18n.t('reports:recommendations.categories.forms', language),
          title: i18n.t('reports:recommendations.titles.addLabelsToFormFields', language),
          description: i18n.t('reports:recommendations.descriptions.formFieldsMissingLabels', language, { count: formsWithoutLabels }),
          action: i18n.t('reports:recommendations.actions.associateLabelsWithFormFields', language)
        });
      }
    } else {
      // Overview - very generic recommendations only
      if (axeResults.violations.length > 0) {
        recommendations.push({
          priority: 'high',
          category: i18n.t('reports:recommendations.categories.accessibilityIssues', language),
          title: i18n.t('reports:recommendations.titles.addressAccessibilityCompliance', language),
          description: i18n.t('reports:recommendations.descriptions.accessibilityIssuesOverview', language),
          action: i18n.t('reports:recommendations.actions.getDetailedReport', language)
        });
      }
      
      if (customChecks.images.some(img => !img.hasAlt) || 
          customChecks.forms.some(form => form.inputs.some(input => !input.hasLabel))) {
        recommendations.push({
          priority: 'medium',
          category: i18n.t('reports:recommendations.categories.contentAndForms', language),
          title: i18n.t('reports:recommendations.titles.improveContentAccessibility', language),
          description: i18n.t('reports:recommendations.descriptions.contentFormsAccessibility', language),
          action: i18n.t('reports:recommendations.actions.upgradeToDetailedReport', language)
        });
      }
    }
    
    if (reportType === 'detailed') {
      if (!customChecks.structure.hasH1) {
        recommendations.push({
          priority: 'medium',
          category: i18n.t('reports:recommendations.categories.structure', language),
          title: i18n.t('reports:recommendations.titles.addMainHeading', language),
          description: i18n.t('reports:recommendations.descriptions.missingH1Heading', language),
          action: i18n.t('reports:recommendations.actions.addClearH1Heading', language)
        });
      }
      
      // Low priority recommendations - only in detailed
      const emptyLinks = customChecks.links.filter(link => link.isEmpty);
      if (emptyLinks.length > 0) {
        recommendations.push({
          priority: 'low',
          category: i18n.t('reports:recommendations.categories.links', language),
          title: i18n.t('reports:recommendations.titles.fixEmptyLinks', language),
          description: i18n.t('reports:recommendations.descriptions.emptyLinksNoTextContent', language, { count: emptyLinks.length }),
          action: i18n.t('reports:recommendations.actions.addDescriptiveTextToLinks', language)
        });
      }
    }
    
    return recommendations;
  }
}

module.exports = new AccessibilityAnalyzer();