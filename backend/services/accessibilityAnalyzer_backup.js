const { AxePuppeteer } = require('@axe-core/puppeteer');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const pdfGenerator = require('./pdfGenerator');
const i18n = require('../utils/i18n');
const colorContrastAnalyzer = require('./analysis/colorContrastAnalyzer');

// Import new modular analyzers
const BrowserUtils = require('./utils/BrowserUtils');
const ValidationUtils = require('./utils/ValidationUtils');
const AnalysisUtils = require('./utils/AnalysisUtils');
const CacheManager = require('./cache/CacheManager');
const StructureAnalyzer = require('./analysis/StructureAnalyzer');
const AriaAnalyzer = require('./analysis/AriaAnalyzer');
const FormAnalyzer = require('./analysis/FormAnalyzer');
const TableAnalyzer = require('./analysis/TableAnalyzer');
const KeyboardAnalyzer = require('./analysis/KeyboardAnalyzer');

class AccessibilityAnalyzer {
  constructor() {
    // Initialize modular components
    this.browserUtils = new BrowserUtils();
    this.validationUtils = new ValidationUtils();
    this.cacheManager = new CacheManager();
    
    // Initialize individual analyzers
    this.structureAnalyzer = new StructureAnalyzer();
    this.ariaAnalyzer = new AriaAnalyzer();
    this.formAnalyzer = new FormAnalyzer();
    this.tableAnalyzer = new TableAnalyzer();
    this.keyboardAnalyzer = new KeyboardAnalyzer();
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
        
        // Production-ready wait strategy for dynamic content
        // 1. Wait for any lazy-loaded content
        await page.evaluate(() => {
          return new Promise((resolve) => {
            // Check if page uses Intersection Observer for lazy loading
            if ('IntersectionObserver' in window) {
              // Give lazy-loaded content time to initialize
              setTimeout(resolve, 1000);
            } else {
              resolve();
            }
          });
        });
        
        // 2. Wait for fonts to load (important for accurate text rendering)
        await page.evaluateHandle(() => document.fonts.ready);
        
        // 3. Ensure no major layout shifts are happening
        await page.waitForFunction(() => {
          // Check if any animations or transitions are running
          const animations = document.getAnimations();
          return animations.length === 0 || animations.every(a => a.playState !== 'running');
        }, { timeout: 5000 }).catch(() => {
          // Don't fail analysis if animations timeout
          logger.info('Some animations may still be running', { analysisId });
        });
        
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
      
      // Run keyboard accessibility analysis
      const keyboardAnalysis = await this.runKeyboardAccessibilityAnalysis(page, analysisId);
      
      // Run comprehensive color contrast analysis
      const colorContrastAnalysis = colorContrastAnalyzer.analyzeColorContrast(
        axeResults, 
        customChecks.colors, 
        analysisId
      );
      
      // Get performance metrics
      const performanceMetrics = await this.getPerformanceMetrics(page, analysisId);
      
      // Always generate detailed report first
      const detailedReport = this.generateReport({
        url: validUrl,
        analysisId,
        metadata,
        axeResults,
        customChecks,
        keyboardAnalysis,
        colorContrastAnalysis,
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
        keyboardAnalysis,
        colorContrastAnalysis,
        performanceMetrics,
        timestamp: new Date().toISOString(),
        reportType: 'overview'
      }, language);

      // Final consistency check
      logger.info(`Final report summary (axe-core standardized)`, {
        analysisId,
        requestedReportType: reportType,
        actualReportType: report.reportType,
        imagesWithoutAlt: report.summary.imagesWithoutAlt,
        totalViolations: report.summary.totalViolations,
        detailedReportImages: detailedReport.summary.imagesWithoutAlt,
        dataSource: report.summary.dataSource
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

        // Enhanced semantic HTML structure analysis
        results.structure = {
          // Basic structural elements
          hasH1: !!document.querySelector('h1'),
          h1Count: document.querySelectorAll('h1').length,
          hasMain: !!document.querySelector('main'),
          hasNav: !!document.querySelector('nav'),
          hasFooter: !!document.querySelector('footer'),
          hasHeader: !!document.querySelector('header'),
          hasSkipLink: !!document.querySelector('a[href^="#"]'),
          
          // Semantic HTML5 elements analysis
          semanticElements: {
            header: document.querySelectorAll('header').length,
            nav: document.querySelectorAll('nav').length,
            main: document.querySelectorAll('main').length,
            section: document.querySelectorAll('section').length,
            article: document.querySelectorAll('article').length,
            aside: document.querySelectorAll('aside').length,
            footer: document.querySelectorAll('footer').length
          },
          
          // Heading hierarchy analysis
          headingHierarchy: (() => {
            const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
            const hierarchy = headings.map((heading, index) => ({
              level: parseInt(heading.tagName.charAt(1)),
              text: heading.textContent.trim().substring(0, 100),
              isEmpty: !heading.textContent.trim(),
              position: index,
              hasId: !!heading.id
            }));
            
            // Check for heading order violations
            const violations = [];
            for (let i = 1; i < hierarchy.length; i++) {
              const current = hierarchy[i];
              const previous = hierarchy[i - 1];
              
              // Check if heading level jumps more than 1 (e.g., H1 -> H3)
              if (current.level > previous.level + 1) {
                violations.push({
                  type: 'heading_skip',
                  message: `Heading level jumps from H${previous.level} to H${current.level}`,
                  position: i,
                  previousLevel: previous.level,
                  currentLevel: current.level
                });
              }
            }
            
            return {
              headings: hierarchy,
              violations,
              hasLogicalOrder: violations.length === 0,
              totalHeadings: hierarchy.length,
              emptyHeadings: hierarchy.filter(h => h.isEmpty).length
            };
          })(),
          
          // ARIA landmarks analysis
          ariaLandmarks: {
            hasMainLandmark: !!document.querySelector('[role="main"], main'),
            hasNavigationLandmark: !!document.querySelector('[role="navigation"], nav'),
            hasBannerLandmark: !!document.querySelector('[role="banner"], header'),
            hasContentinfoLandmark: !!document.querySelector('[role="contentinfo"], footer'),
            hasSearchLandmark: !!document.querySelector('[role="search"]'),
            hasComplementaryLandmark: !!document.querySelector('[role="complementary"], aside'),
            
            // Count ARIA landmarks
            landmarkCounts: {
              main: document.querySelectorAll('[role="main"], main').length,
              navigation: document.querySelectorAll('[role="navigation"], nav').length,
              banner: document.querySelectorAll('[role="banner"], header').length,
              contentinfo: document.querySelectorAll('[role="contentinfo"], footer').length,
              search: document.querySelectorAll('[role="search"]').length,
              complementary: document.querySelectorAll('[role="complementary"], aside').length
            }
          },
          
          // Document structure quality
          documentStructure: {
            hasDoctype: !!document.doctype,
            hasLang: !!document.documentElement.lang,
            langValue: document.documentElement.lang || '',
            hasTitle: !!document.title,
            titleLength: document.title.length,
            hasMetaDescription: !!document.querySelector('meta[name="description"]'),
            hasMetaViewport: !!document.querySelector('meta[name="viewport"]')
          },
          
          // Navigation structure
          navigationStructure: {
            skipLinksCount: document.querySelectorAll('a[href^="#skip"], .skip-link, .sr-only a[href^="#"]').length,
            breadcrumbsPresent: !!document.querySelector('[aria-label*="breadcrumb"], .breadcrumb, nav[aria-label*="Breadcrumb"]'),
            navigationMenuCount: document.querySelectorAll('nav').length,
            hasSearchFunction: !!document.querySelector('input[type="search"], [role="search"]')
          },
          
          // Interactive elements analysis
          interactiveElements: {
            total: document.querySelectorAll('a, button, input, select, textarea, [tabindex], [role="button"], [role="link"]').length,
            buttons: document.querySelectorAll('button, [role="button"]').length,
            links: document.querySelectorAll('a[href], [role="link"]').length,
            formControls: document.querySelectorAll('input, select, textarea').length,
            customControls: document.querySelectorAll('[role="button"], [role="link"], [role="menuitem"], [role="tab"]').length
          },
          
          // Page metrics
          totalElements: document.querySelectorAll('*').length,
          textContent: document.body ? document.body.textContent.trim().length : 0
        };

        // Enhanced ARIA analysis
        results.ariaAnalysis = {
          // ARIA labels and descriptions
          elementsWithAriaLabel: document.querySelectorAll('[aria-label]').length,
          elementsWithAriaLabelledby: document.querySelectorAll('[aria-labelledby]').length,
          elementsWithAriaDescribedby: document.querySelectorAll('[aria-describedby]').length,
          
          // ARIA states and properties
          hiddenElements: document.querySelectorAll('[aria-hidden="true"]').length,
          expandedElements: document.querySelectorAll('[aria-expanded]').length,
          checkedElements: document.querySelectorAll('[aria-checked]').length,
          selectedElements: document.querySelectorAll('[aria-selected]').length,
          
          // Form-related ARIA
          requiredFields: document.querySelectorAll('[aria-required="true"], [required]').length,
          invalidFields: document.querySelectorAll('[aria-invalid="true"]').length,
          
          // Live regions
          liveRegions: document.querySelectorAll('[aria-live]').length,
          statusElements: document.querySelectorAll('[role="status"], [role="alert"]').length,
          
          // Custom roles validation
          customRoles: (() => {
            const roles = [];
            const elementsWithRoles = document.querySelectorAll('[role]');
            elementsWithRoles.forEach(el => {
              const role = el.getAttribute('role');
              if (role && !roles.includes(role)) {
                roles.push(role);
              }
            });
            return roles;
          })(),
          
          // ARIA landmark validation
          landmarkIssues: (() => {
            const issues = [];
            
            // Check for multiple main landmarks
            const mainLandmarks = document.querySelectorAll('[role="main"], main');
            if (mainLandmarks.length > 1) {
              issues.push({
                type: 'multiple_main_landmarks',
                count: mainLandmarks.length,
                severity: 'serious'
              });
            }
            
            // Check for navigation landmarks without labels
            const navs = document.querySelectorAll('[role="navigation"], nav');
            let unLabeledNavs = 0;
            navs.forEach(nav => {
              if (!nav.hasAttribute('aria-label') && !nav.hasAttribute('aria-labelledby')) {
                unLabeledNavs++;
              }
            });
            if (unLabeledNavs > 0 && navs.length > 1) {
              issues.push({
                type: 'unlabeled_navigation_landmarks',
                count: unLabeledNavs,
                total: navs.length,
                severity: 'moderate'
              });
            }
            
            return issues;
          })()
        };

        // Enhanced form accessibility analysis
        results.formAnalysis = {
          totalForms: document.querySelectorAll('form').length,
          
          // Input analysis
          inputAnalysis: (() => {
            const inputs = document.querySelectorAll('input, select, textarea');
            const analysis = {
              total: inputs.length,
              withLabels: 0,
              withAriaLabels: 0,
              withPlaceholders: 0,
              withoutLabels: 0,
              required: 0,
              withErrorHandling: 0,
              withFieldsets: 0,
              inputTypes: {}
            };
            
            inputs.forEach(input => {
              // Count input types
              const type = input.type || input.tagName.toLowerCase();
              analysis.inputTypes[type] = (analysis.inputTypes[type] || 0) + 1;
              
              // Check for labels
              const hasLabel = !!document.querySelector(`label[for="${input.id}"]`) || 
                              !!input.closest('label') ||
                              input.hasAttribute('aria-label') ||
                              input.hasAttribute('aria-labelledby');
              
              if (hasLabel) {
                analysis.withLabels++;
              } else {
                analysis.withoutLabels++;
              }
              
              if (input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby')) {
                analysis.withAriaLabels++;
              }
              
              if (input.hasAttribute('placeholder')) {
                analysis.withPlaceholders++;
              }
              
              if (input.hasAttribute('required') || input.hasAttribute('aria-required')) {
                analysis.required++;
              }
              
              // Check for error handling
              if (input.hasAttribute('aria-describedby') || 
                  input.hasAttribute('aria-invalid') ||
                  document.querySelector(`[id="${input.getAttribute('aria-describedby')}"]`)) {
                analysis.withErrorHandling++;
              }
            });
            
            // Check for fieldsets
            analysis.withFieldsets = document.querySelectorAll('fieldset').length;
            
            return analysis;
          })(),
          
          // Button analysis
          buttonAnalysis: (() => {
            const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"], input[type="reset"], [role="button"]');
            const analysis = {
              total: buttons.length,
              withText: 0,
              withAriaLabels: 0,
              withoutText: 0,
              submitButtons: document.querySelectorAll('button[type="submit"], input[type="submit"]').length,
              resetButtons: document.querySelectorAll('button[type="reset"], input[type="reset"]').length
            };
            
            buttons.forEach(button => {
              const hasText = button.textContent?.trim() || 
                            button.value || 
                            button.hasAttribute('aria-label') ||
                            button.hasAttribute('aria-labelledby');
              
              if (hasText) {
                analysis.withText++;
              } else {
                analysis.withoutText++;
              }
              
              if (button.hasAttribute('aria-label') || button.hasAttribute('aria-labelledby')) {
                analysis.withAriaLabels++;
              }
            });
            
            return analysis;
          })(),
          
          // Form validation and error handling
          errorHandling: (() => {
            const errorElements = document.querySelectorAll('[role="alert"], .error, .invalid, [aria-invalid="true"]');
            const requiredElements = document.querySelectorAll('[required], [aria-required="true"]');
            
            return {
              errorElements: errorElements.length,
              requiredElements: requiredElements.length,
              hasErrorSummary: !!document.querySelector('[role="alert"][aria-live], .error-summary'),
              hasInlineErrors: !!document.querySelector('[aria-describedby*="error"], [aria-describedby*="invalid"]')
            };
          })()
        };

        // Table accessibility analysis
        results.tableAnalysis = (() => {
          const tables = document.querySelectorAll('table');
          const analysis = {
            total: tables.length,
            withCaptions: 0,
            withHeaders: 0,
            withScope: 0,
            withSummary: 0,
            complexTables: 0,
            issues: []
          };
          
          tables.forEach((table, index) => {
            const hasCaption = !!table.querySelector('caption');
            const hasHeaders = !!table.querySelector('th');
            const hasScope = !!table.querySelector('[scope]');
            const hasSummary = table.hasAttribute('summary') || table.hasAttribute('aria-describedby');
            
            if (hasCaption) analysis.withCaptions++;
            if (hasHeaders) analysis.withHeaders++;
            if (hasScope) analysis.withScope++;
            if (hasSummary) analysis.withSummary++;
            
            // Check for complex tables (nested headers, merged cells)
            const hasRowspan = !!table.querySelector('[rowspan]');
            const hasColspan = !!table.querySelector('[colspan]');
            const hasNestedHeaders = table.querySelectorAll('th').length > table.querySelectorAll('tr:first-child th').length;
            
            if (hasRowspan || hasColspan || hasNestedHeaders) {
              analysis.complexTables++;
              
              if (!hasScope && !table.querySelector('[headers]')) {
                analysis.issues.push({
                  type: 'complex_table_without_headers',
                  tableIndex: index,
                  severity: 'serious'
                });
              }
            }
            
            if (!hasCaption && !table.hasAttribute('aria-label') && !table.hasAttribute('aria-labelledby')) {
              analysis.issues.push({
                type: 'table_without_caption',
                tableIndex: index,
                severity: 'moderate'
              });
            }
          });
          
          return analysis;
        })();

        return results;
      });

      return checks;
    } catch (error) {
      logger.error('Custom checks failed:', { error: error.message, analysisId });
      throw error;
    }
  }

  async runKeyboardAccessibilityAnalysis(page, analysisId) {
    try {
      logger.info('Running real keyboard accessibility analysis', { analysisId });
      
      // First, get all focusable elements without keyboard simulation
      const initialAnalysis = await page.evaluate(() => {
        const focusableSelectors = [
          'a[href]',
          'button:not([disabled])',
          'input:not([disabled])',
          'select:not([disabled])',
          'textarea:not([disabled])',
          '[tabindex]:not([tabindex="-1"])',
          '[contenteditable="true"]',
          'iframe',
          'object',
          'embed',
          'summary',
          '[role="button"]:not([tabindex="-1"])',
          '[role="link"]:not([tabindex="-1"])',
          '[role="menuitem"]:not([tabindex="-1"])',
          '[role="tab"]:not([tabindex="-1"])'
        ];

        const elements = Array.from(document.querySelectorAll(focusableSelectors.join(', ')));
        
        return elements.map((element, index) => {
          const computedStyle = window.getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          const isVisible = computedStyle.display !== 'none' && 
                           computedStyle.visibility !== 'hidden' && 
                           computedStyle.opacity !== '0' &&
                           rect.width > 0 && 
                           rect.height > 0;
          
          return {
            index,
            tagName: element.tagName.toLowerCase(),
            type: element.type || null,
            id: element.id || null,
            className: element.className || null,
            tabIndex: element.tabIndex,
            hasTabIndex: element.hasAttribute('tabindex'),
            isVisible,
            hasAriaLabel: element.hasAttribute('aria-label'),
            ariaLabel: element.getAttribute('aria-label') || null,
            text: element.textContent?.trim().substring(0, 50) || element.value?.substring(0, 50) || element.alt?.substring(0, 50) || '',
            role: element.getAttribute('role') || null,
            disabled: element.disabled || false,
            rect: {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height
            }
          };
        }).filter(el => el.isVisible && !el.disabled);
      });

      logger.info(`Found ${initialAnalysis.length} focusable elements`, { analysisId });

      // Now perform real keyboard navigation simulation
      const keyboardTestResults = await this.simulateKeyboardNavigation(page, initialAnalysis);
      
      // Analyze skip links functionality
      const skipLinksAnalysis = await this.analyzeSkipLinks(page);
      
      // Check for focus traps
      const focusTrapsAnalysis = await this.detectFocusTraps(page, keyboardTestResults.tabOrder);
      
      // Analyze focus indicators
      const focusIndicatorAnalysis = await this.analyzeFocusIndicators(page, keyboardTestResults.tabOrder);

      return {
        focusableElements: initialAnalysis,
        tabOrder: keyboardTestResults.tabOrder,
        skipLinks: skipLinksAnalysis,
        focusTraps: focusTrapsAnalysis,
        focusManagement: {
          totalFocusableElements: initialAnalysis.length,
          successfullyFocused: keyboardTestResults.successfullyFocused,
          tabNavigationWorks: keyboardTestResults.tabNavigationWorks,
          hasLogicalTabOrder: keyboardTestResults.hasLogicalTabOrder,
          hasVisibleFocusIndicators: focusIndicatorAnalysis.hasVisibleIndicators,
          focusIndicatorContrast: focusIndicatorAnalysis.contrastIssues,
          skipLinksWork: skipLinksAnalysis.filter(link => link.works).length,
          focusTrappedElements: focusTrapsAnalysis.length,
          keyboardTraversalIssues: keyboardTestResults.issues
        }
      };
    } catch (error) {
      logger.error('Real keyboard accessibility analysis failed:', { error: error.message, analysisId });
      return {
        focusableElements: [],
        focusTraps: [],
        skipLinks: [],
        tabOrder: [],
        focusManagement: {
          error: error.message
        }
      };
    }
  }

  async simulateKeyboardNavigation(page, focusableElements) {
    try {
      const results = {
        tabOrder: [],
        successfullyFocused: 0,
        tabNavigationWorks: false,
        hasLogicalTabOrder: true,
        issues: []
      };

      if (focusableElements.length === 0) {
        return results;
      }

      // Reset focus to body
      await page.evaluate(() => {
        if (document.activeElement) {
          document.activeElement.blur();
        }
        document.body.focus();
      });

      // Simulate Tab navigation through all elements
      const maxTabs = Math.min(focusableElements.length + 5, 50); // Limit to prevent infinite loops
      const tabSequence = [];
      
      for (let i = 0; i < maxTabs; i++) {
        // Press Tab
        await page.keyboard.press('Tab');
        await page.waitForTimeout(50); // Small delay for focus to settle
        
        // Get currently focused element
        const focusedElementInfo = await page.evaluate(() => {
          const activeElement = document.activeElement;
          if (!activeElement || activeElement === document.body) {
            return null;
          }
          
          const rect = activeElement.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(activeElement);
          
          return {
            tagName: activeElement.tagName.toLowerCase(),
            id: activeElement.id || null,
            className: activeElement.className || null,
            type: activeElement.type || null,
            tabIndex: activeElement.tabIndex,
            text: activeElement.textContent?.trim().substring(0, 50) || activeElement.value?.substring(0, 50) || '',
            hasOutline: computedStyle.outline !== 'none' && computedStyle.outline !== '',
            outlineColor: computedStyle.outlineColor,
            outlineWidth: computedStyle.outlineWidth,
            outlineStyle: computedStyle.outlineStyle,
            focusVisible: activeElement.matches(':focus-visible') || false,
            rect: {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height
            }
          };
        });

        if (focusedElementInfo) {
          tabSequence.push({
            order: i + 1,
            ...focusedElementInfo
          });
          results.successfullyFocused++;
        }

        // Check if we've completed a cycle (back to first element or body)
        if (i > 0 && tabSequence.length > 1) {
          const current = focusedElementInfo;
          const first = tabSequence[0];
          if (!current || (current.id === first.id && current.tagName === first.tagName)) {
            break;
          }
        }
      }

      results.tabOrder = tabSequence;
      results.tabNavigationWorks = tabSequence.length > 0;
      
      // Analyze tab order logic
      results.hasLogicalTabOrder = this.analyzeTabOrderLogic(tabSequence, focusableElements);
      
      // Check for navigation issues
      if (results.successfullyFocused < focusableElements.length * 0.8) {
        results.issues.push({
          type: 'incomplete_tab_navigation',
          description: `Only ${results.successfullyFocused} of ${focusableElements.length} focusable elements were reachable via Tab navigation`,
          severity: 'serious'
        });
      }

      return results;
    } catch (error) {
      logger.error('Keyboard navigation simulation failed:', error);
      return {
        tabOrder: [],
        successfullyFocused: 0,
        tabNavigationWorks: false,
        hasLogicalTabOrder: false,
        issues: [{ type: 'simulation_error', description: error.message, severity: 'serious' }]
      };
    }
  }

  analyzeTabOrderLogic(tabSequence, focusableElements) {
    if (tabSequence.length < 2) return true;
    
    // Check for reasonable spatial progression (generally left-to-right, top-to-bottom)
    let logicalOrder = true;
    for (let i = 1; i < tabSequence.length; i++) {
      const current = tabSequence[i];
      const previous = tabSequence[i - 1];
      
      // Skip if elements don't have valid positions
      if (!current.rect || !previous.rect) continue;
      
      // Allow for some flexibility in tab order (elements close vertically)
      const verticalTolerance = 50;
      const isNextRow = current.rect.top > previous.rect.top + verticalTolerance;
      const isSameRow = Math.abs(current.rect.top - previous.rect.top) <= verticalTolerance;
      
      // If moving to next row, that's generally acceptable
      if (isNextRow) continue;
      
      // If same row, should generally go left to right
      if (isSameRow && current.rect.left < previous.rect.left - 20) {
        logicalOrder = false;
        break;
      }
    }
    
    return logicalOrder;
  }

  async analyzeSkipLinks(page) {
    try {
      const skipLinks = await page.evaluate(() => {
        // Common skip link patterns
        const skipLinkSelectors = [
          'a[href^="#skip"]',
          'a[href^="#main"]',
          'a[href^="#content"]',
          '.skip-link',
          '.skip-to-content',
          '.sr-only a[href^="#"]',
          'a[class*="skip"]'
        ];
        
        const skipLinks = [];
        
        skipLinkSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(link => {
            const href = link.getAttribute('href');
            const target = href ? document.querySelector(href) : null;
            const computedStyle = window.getComputedStyle(link);
            
            skipLinks.push({
              text: link.textContent.trim(),
              href,
              hasTarget: !!target,
              isVisible: computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden',
              isVisuallyHidden: computedStyle.position === 'absolute' && 
                               (computedStyle.left === '-9999px' || computedStyle.left === '-10000px' ||
                                computedStyle.clip === 'rect(0px, 0px, 0px, 0px)'),
              targetExists: !!target,
              targetId: target ? target.id : null
            });
          });
        });
        
        return skipLinks;
      });

      // Test skip link functionality
      for (let skipLink of skipLinks) {
        try {
          if (skipLink.href && skipLink.hasTarget) {
            // Focus the skip link and activate it
            await page.evaluate((href) => {
              const link = document.querySelector(`a[href="${href}"]`);
              if (link) {
                link.focus();
                link.click();
              }
            }, skipLink.href);
            
            await page.waitForTimeout(100);
            
            // Check if focus moved to target
            const focusMovedCorrectly = await page.evaluate((targetId) => {
              if (!targetId) return false;
              const target = document.getElementById(targetId);
              return target && document.activeElement === target;
            }, skipLink.targetId);
            
            skipLink.works = focusMovedCorrectly;
          }
        } catch (error) {
          skipLink.works = false;
          skipLink.error = error.message;
        }
      }

      return skipLinks;
    } catch (error) {
      logger.error('Skip links analysis failed:', error);
      return [];
    }
  }

  async detectFocusTraps(page, tabOrder) {
    try {
      const focusTraps = [];
      
      // Look for potential focus traps in modals, overlays, etc.
      const potentialTraps = await page.evaluate(() => {
        const modals = Array.from(document.querySelectorAll('[role="dialog"], .modal, .overlay, .popup'));
        return modals.map(modal => ({
          id: modal.id || null,
          className: modal.className || null,
          isVisible: window.getComputedStyle(modal).display !== 'none',
          hasTabIndex: modal.hasAttribute('tabindex'),
          containsFocusableElements: modal.querySelectorAll('button, input, select, textarea, a[href]').length > 0
        }));
      });
      
      // Simple focus trap detection: if tab order gets stuck in a small subset
      if (tabOrder.length > 0) {
        const uniqueElements = new Set(tabOrder.map(el => `${el.tagName}-${el.id}-${el.className}`));
        const repetitionThreshold = tabOrder.length > 10 ? 3 : 2;
        
        tabOrder.forEach((element, index) => {
          const elementId = `${element.tagName}-${element.id}-${element.className}`;
          const occurrences = tabOrder.filter(el => 
            `${el.tagName}-${el.id}-${el.className}` === elementId
          ).length;
          
          if (occurrences >= repetitionThreshold) {
            focusTraps.push({
              type: 'repeated_focus_cycle',
              element: elementId,
              occurrences,
              severity: 'moderate'
            });
          }
        });
      }
      
      return focusTraps;
    } catch (error) {
      logger.error('Focus trap detection failed:', error);
      return [];
    }
  }

  async analyzeFocusIndicators(page, tabOrder) {
    try {
      let hasVisibleIndicators = false;
      const contrastIssues = [];
      
      if (tabOrder.length > 0) {
        // Check a sample of focused elements for visible focus indicators
        const sampleSize = Math.min(5, tabOrder.length);
        const sampleElements = tabOrder.slice(0, sampleSize);
        
        for (let element of sampleElements) {
          if (element.hasOutline || element.focusVisible) {
            hasVisibleIndicators = true;
            
            // Basic contrast check for outline color
            if (element.outlineColor && element.outlineColor !== 'transparent') {
              // Simple contrast check - this is basic, could be enhanced
              const isLightColor = this.isLightColor(element.outlineColor);
              if (isLightColor && !this.hasGoodContrast(element.outlineColor, '#ffffff')) {
                contrastIssues.push({
                  element: `${element.tagName}${element.id ? '#' + element.id : ''}`,
                  issue: 'Low contrast focus indicator',
                  outlineColor: element.outlineColor
                });
              }
            }
          }
        }
      }
      
      return {
        hasVisibleIndicators,
        contrastIssues
      };
    } catch (error) {
      logger.error('Focus indicator analysis failed:', error);
      return {
        hasVisibleIndicators: false,
        contrastIssues: []
      };
    }
  }

  isLightColor(color) {
    // Simple light color detection - could be enhanced
    const rgb = color.match(/\d+/g);
    if (rgb && rgb.length >= 3) {
      const r = parseInt(rgb[0]);
      const g = parseInt(rgb[1]);
      const b = parseInt(rgb[2]);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 125;
    }
    return false;
  }

  hasGoodContrast(color1, color2) {
    // Simplified contrast check - in a real implementation, you'd use proper WCAG contrast calculation
    return true; // Placeholder
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

  generateRecommendations(axeResults, customChecks, reportType = 'overview', language = 'en', colorContrastAnalysis = null) {
    const recommendations = [];
    
    if (reportType === 'detailed') {
      // Detailed recommendations with specific counts and instructions
      if (axeResults.violations.some(v => v.impact === 'critical')) {
        const criticalCount = axeResults.violations.filter(v => v.impact === 'critical').length;
        recommendations.push({
          priority: 'high',
          category: i18n.t('reports:recommendations.categories.criticalIssues', language),
                                 element.classList.contains('focus');

          results.focusableElements.push({
            index,
            tagName: element.tagName.toLowerCase(),
            type: element.type || null,
            role: element.getAttribute('role'),
            ariaLabel: element.getAttribute('aria-label'),
            ariaLabelledby: element.getAttribute('aria-labelledby'),
            text: element.textContent?.trim().substring(0, 50) || '',
            tabIndex: tabIndex ? parseInt(tabIndex) : null,
            isVisible,
            hasVisibleFocus,
            hasAriaHidden: element.getAttribute('aria-hidden') === 'true',
            isDisabled: element.disabled || element.getAttribute('aria-disabled') === 'true',
            selector: element.tagName.toLowerCase() + 
                     (element.id ? '#' + element.id : '') + 
                     (element.className ? '.' + element.className.split(' ').join('.') : '')
          });
        });

        // Analyze skip links
        const skipLinks = document.querySelectorAll('a[href^="#skip"], .skip-link, .sr-only a[href^="#"]');
        skipLinks.forEach((link, index) => {
          const target = document.querySelector(link.getAttribute('href'));
          results.skipLinks.push({
            index,
            text: link.textContent.trim(),
            href: link.getAttribute('href'),
            hasValidTarget: !!target,
            isVisible: window.getComputedStyle(link).display !== 'none'
          });
        });

        // Check for focus traps (basic detection)
        const modals = document.querySelectorAll('[role="dialog"], .modal, .popup');
        modals.forEach((modal, index) => {
          const isVisible = window.getComputedStyle(modal).display !== 'none';
          if (isVisible) {
            const focusableInModal = modal.querySelectorAll(focusableSelectors.join(', '));
            results.focusTraps.push({
              index,
              elementCount: focusableInModal.length,
              hasCloseButton: !!modal.querySelector('[aria-label*="close"], .close, button[type="button"]'),
              hasEscapeHandling: modal.hasAttribute('data-keyboard') || modal.hasAttribute('data-dismiss')
            });
          }
        });

        // Tab order analysis (simplified)
        const tabbableElements = Array.from(focusableElements).filter(el => {
          const tabIndex = el.getAttribute('tabindex');
          return tabIndex === null || parseInt(tabIndex) >= 0;
        }).sort((a, b) => {
          const aIndex = parseInt(a.getAttribute('tabindex')) || 0;
          const bIndex = parseInt(b.getAttribute('tabindex')) || 0;
          return aIndex - bIndex;
        });

        results.tabOrder = tabbableElements.map((el, index) => ({
          index,
          tagName: el.tagName.toLowerCase(),
          tabIndex: el.getAttribute('tabindex'),
          hasCustomTabIndex: el.getAttribute('tabindex') !== null,
          text: el.textContent?.trim().substring(0, 30) || ''
        }));

        // Focus management analysis
        results.focusManagement = {
          totalFocusableElements: results.focusableElements.length,
          visibleFocusableElements: results.focusableElements.filter(el => el.isVisible).length,
          elementsWithCustomTabIndex: results.focusableElements.filter(el => el.tabIndex !== null).length,
          elementsWithAriaLabel: results.focusableElements.filter(el => el.ariaLabel).length,
          elementsWithoutVisibleFocus: results.focusableElements.filter(el => !el.hasVisibleFocus).length,
          skipLinksCount: results.skipLinks.length,
          focusTrapsCount: results.focusTraps.length,
          hasLogicalTabOrder: results.tabOrder.every((el, index) => 
            index === 0 || !el.hasCustomTabIndex || parseInt(el.tabIndex) >= parseInt(results.tabOrder[index - 1].tabIndex))
        };

        return results;
      });

      return keyboardAnalysis;
    } catch (error) {
      logger.error('Keyboard accessibility analysis failed:', { error: error.message, analysisId });
      return {
        focusableElements: [],
        focusTraps: [],
        skipLinks: [],
        tabOrder: [],
        focusManagement: {}
      };
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
    const { url, analysisId, metadata, axeResults, customChecks, keyboardAnalysis, colorContrastAnalysis, performanceMetrics, timestamp, reportType = 'overview' } = data;
    
    // Calculate accessibility score based on axe-core results
    const totalViolations = axeResults.violations.length;
    const criticalViolations = axeResults.violations.filter(v => v.impact === 'critical').length;
    const seriousViolations = axeResults.violations.filter(v => v.impact === 'serious').length;
    const moderateViolations = axeResults.violations.filter(v => v.impact === 'moderate').length;
    const minorViolations = axeResults.violations.filter(v => v.impact === 'minor').length;
    
    // Scoring algorithm (0-100) - primarily based on axe-core
    let accessibilityScore = 100;
    accessibilityScore -= (criticalViolations * 20);
    accessibilityScore -= (seriousViolations * 10);
    accessibilityScore -= (moderateViolations * 5);
    accessibilityScore -= (minorViolations * 2);
    accessibilityScore = Math.max(0, accessibilityScore);
    
    // Extract image-related data from axe-core violations instead of custom checks
    const imageAltViolations = axeResults.violations.filter(v => v.id === 'image-alt');
    const imagesWithoutAlt = imageAltViolations.reduce((count, violation) => count + violation.nodes.length, 0);
    
    // Extract form-related data from axe-core violations
    const labelViolations = axeResults.violations.filter(v => v.id === 'label');
    const formsWithoutLabels = labelViolations.reduce((count, violation) => count + violation.nodes.length, 0);
    
    // Extract link-related data from axe-core violations  
    const linkNameViolations = axeResults.violations.filter(v => v.id === 'link-name');
    const emptyLinks = linkNameViolations.reduce((count, violation) => count + violation.nodes.length, 0);
    
    // Single unified score based on axe-core violations
    const overallScore = Math.round(accessibilityScore);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(axeResults, customChecks, reportType, language, colorContrastAnalysis);
    
    // Determine if site has excellent accessibility (very few/no real issues)
    const hasExcellentAccessibility = 
      criticalViolations === 0 && 
      seriousViolations === 0 && 
      moderateViolations <= 1 && 
      imagesWithoutAlt === 0 &&
      formsWithoutLabels === 0 &&
      emptyLinks === 0;

    // Log scoring details for debugging
    logger.info('Accessibility scoring details (axe-core based)', {
      analysisId,
      url,
      criticalViolations,
      seriousViolations,
      moderateViolations,
      minorViolations,
      imagesWithoutAlt,
      imageAltViolationsCount: imageAltViolations.length,
      formsWithoutLabels,
      labelViolationsCount: labelViolations.length,
      emptyLinks,
      linkNameViolationsCount: linkNameViolations.length,
      accessibilityScore: Math.round(accessibilityScore),
      overallScore,
      hasExcellentAccessibility
    });
    
    // Log data consistency for debugging
    logger.info(`Report generation for ${reportType} (axe-core standardized)`, {
      analysisId,
      url,
      reportType,
      imagesWithoutAlt,
      totalViolations,
      criticalViolations,
      seriousViolations,
      dataSource: 'axe-core'
    });

    const baseReport = {
      analysisId,
      url,
      timestamp,
      reportType,
      metadata,
      scores: {
        overall: overallScore
      },
      summary: {
        totalViolations,
        criticalViolations,
        seriousViolations,
        moderateViolations,
        minorViolations,
        imagesWithoutAlt, // From axe-core violations
        formsWithoutLabels, // From axe-core violations
        emptyLinks, // From axe-core violations
        colorContrastViolations: colorContrastAnalysis?.totalViolations || 0,
        colorContrastAAViolations: colorContrastAnalysis?.aaViolations || 0,
        hasExcellentAccessibility,
        dataSource: 'axe-core', // Flag to indicate data source
        // Enhanced structure analysis summary
        structureScore: customChecks?.structure ? this.calculateStructureScore(customChecks.structure) : null,
        semanticElementsFound: customChecks?.structure?.semanticElements ? Object.values(customChecks.structure.semanticElements).reduce((a, b) => a + b, 0) : 0,
        headingViolations: customChecks?.structure?.headingHierarchy?.violations?.length || 0,
        ariaLandmarksCount: customChecks?.structure?.ariaLandmarks ? Object.values(customChecks.structure.ariaLandmarks.landmarkCounts).reduce((a, b) => a + b, 0) : 0,
        // Keyboard accessibility summary
        keyboardScore: keyboardAnalysis ? this.calculateKeyboardScore(keyboardAnalysis) : null,
        focusableElementsCount: keyboardAnalysis?.focusableElements?.length || 0,
        keyboardViolations: keyboardAnalysis ? this.countKeyboardViolations(keyboardAnalysis) : 0,
        
        // Enhanced ARIA analysis summary
        ariaScore: customChecks?.ariaAnalysis ? this.calculateAriaScore(customChecks.ariaAnalysis) : null,
        ariaLandmarkIssues: customChecks?.ariaAnalysis?.landmarkIssues?.length || 0,
        elementsWithAriaLabels: customChecks?.ariaAnalysis?.elementsWithAriaLabel || 0,
        
        // Form accessibility summary
        formScore: customChecks?.formAnalysis ? this.calculateFormScore(customChecks.formAnalysis) : null,
        totalForms: customChecks?.formAnalysis?.totalForms || 0,
        unlabeledInputs: customChecks?.formAnalysis?.inputAnalysis?.withoutLabels || 0,
        unlabeledButtons: customChecks?.formAnalysis?.buttonAnalysis?.withoutText || 0,
        
        // Table accessibility summary
        tableScore: customChecks?.tableAnalysis ? this.calculateTableScore(customChecks.tableAnalysis) : null,
        totalTables: customChecks?.tableAnalysis?.total || 0,
        tableIssues: customChecks?.tableAnalysis?.issues?.length || 0
      },
      recommendations,
      reportGenerated: new Date().toISOString()
    };

    // Add full details for detailed reports only
    if (reportType === 'detailed') {
      baseReport.axeResults = axeResults;
      baseReport.customChecks = customChecks;
      baseReport.colorContrastAnalysis = colorContrastAnalysis;
      baseReport.keyboardAnalysis = keyboardAnalysis;
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

  generateRecommendations(axeResults, customChecks, reportType = 'overview', language = 'en', colorContrastAnalysis = null) {
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
      
      // Use axe-core image-alt violations for consistency
      const imageAltViolations = axeResults.violations.filter(v => v.id === 'image-alt');
      const imagesWithoutAlt = imageAltViolations.reduce((count, violation) => count + violation.nodes.length, 0);
      
      if (imagesWithoutAlt > 0) {
        recommendations.push({
          priority: 'high',
          category: i18n.t('reports:recommendations.categories.images', language),
          title: i18n.t('reports:recommendations.titles.improveImageAltText', language),
          description: i18n.t('reports:recommendations.descriptions.imagesMissingAltText', language, { count: imagesWithoutAlt }),
          action: i18n.t('reports:recommendations.actions.addDescriptiveAltText', language),
          details: {
            violationCount: imagesWithoutAlt,
            axeViolations: imageAltViolations.map(v => ({
              description: v.description,
              help: v.help,
              helpUrl: v.helpUrl,
              nodeCount: v.nodes.length
            }))
          }
        });
      }
      
      // Use axe-core label violations for consistency
      const labelViolations = axeResults.violations.filter(v => v.id === 'label');
      const formsWithoutLabels = labelViolations.reduce((count, violation) => count + violation.nodes.length, 0);
      
      if (formsWithoutLabels > 0) {
        recommendations.push({
          priority: 'medium',
          category: i18n.t('reports:recommendations.categories.forms', language),
          title: i18n.t('reports:recommendations.titles.addLabelsToFormFields', language),
          description: i18n.t('reports:recommendations.descriptions.formFieldsMissingLabels', language, { count: formsWithoutLabels }),
          action: i18n.t('reports:recommendations.actions.associateLabelsWithFormFields', language),
          details: {
            violationCount: formsWithoutLabels,
            axeViolations: labelViolations.map(v => ({
              description: v.description,
              help: v.help,
              helpUrl: v.helpUrl,
              nodeCount: v.nodes.length
            }))
          }
        });
      }
      
      // Add color contrast recommendations if analysis is available
      if (colorContrastAnalysis && colorContrastAnalysis.aaViolations > 0) {
        recommendations.push({
          priority: 'high',
          category: i18n.t('reports:recommendations.categories.colorContrast', language),
          title: i18n.t('reports:recommendations.titles.improveColorContrast', language),
          description: i18n.t('reports:recommendations.descriptions.colorContrastViolations', language, { count: colorContrastAnalysis.aaViolations }),
          action: i18n.t('reports:recommendations.actions.adjustColorContrast', language),
          details: {
            aaViolations: colorContrastAnalysis.aaViolations,
            aaaViolations: colorContrastAnalysis.aaaViolations || 0,
            complianceLevel: colorContrastAnalysis.summary?.aaComplianceLevel || 0,
            recommendations: colorContrastAnalysis.summary?.recommendations || []
          }
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
      
      // Use axe-core violations for overview recommendations
      const imageViolations = axeResults.violations.filter(v => v.id === 'image-alt');
      const labelViolations = axeResults.violations.filter(v => v.id === 'label');
      
      if (imageViolations.length > 0 || labelViolations.length > 0) {
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
      
      // Low priority recommendations - only in detailed - use axe-core data
      const linkNameViolations = axeResults.violations.filter(v => v.id === 'link-name');
      const emptyLinks = linkNameViolations.reduce((count, violation) => count + violation.nodes.length, 0);
      
      if (emptyLinks > 0) {
        recommendations.push({
          priority: 'low',
          category: i18n.t('reports:recommendations.categories.links', language),
          title: i18n.t('reports:recommendations.titles.fixEmptyLinks', language),
          description: i18n.t('reports:recommendations.descriptions.emptyLinksNoTextContent', language, { count: emptyLinks }),
          action: i18n.t('reports:recommendations.actions.addDescriptiveTextToLinks', language),
          details: {
            violationCount: emptyLinks,
            axeViolations: linkNameViolations.map(v => ({
              description: v.description,
              help: v.help,
              helpUrl: v.helpUrl,
              nodeCount: v.nodes.length
            }))
          }
        });
      }
    }
    
    return recommendations;
  }

  calculateStructureScore(structure) {
    if (!structure) return 0;
    
    let score = 100;
    
    // Check for semantic HTML5 elements
    if (!structure.hasMain) score -= 15;
    if (!structure.hasNav) score -= 10;
    if (!structure.hasHeader) score -= 10;
    if (!structure.hasFooter) score -= 5;
    
    // Check heading hierarchy
    if (!structure.hasH1) score -= 20;
    if (structure.h1Count > 1) score -= 10;
    if (structure.headingHierarchy?.violations?.length > 0) {
      score -= Math.min(structure.headingHierarchy.violations.length * 5, 20);
    }
    
    // Check ARIA landmarks
    if (!structure.ariaLandmarks?.hasMainLandmark) score -= 10;
    if (!structure.ariaLandmarks?.hasNavigationLandmark) score -= 5;
    
    // Check document structure
    if (!structure.documentStructure?.hasLang) score -= 10;
    if (!structure.documentStructure?.hasTitle) score -= 10;
    if (!structure.documentStructure?.hasMetaDescription) score -= 5;
    
    return Math.max(0, Math.round(score));
  }

  calculateKeyboardScore(keyboardAnalysis) {
    if (!keyboardAnalysis) return 0;
    
    let score = 100;
    
    // Check focusable elements
    if (keyboardAnalysis.focusableElements?.length === 0) {
      score -= 50; // Major issue if no focusable elements
    }
    
    // Check focus management
    if (keyboardAnalysis.focusManagement) {
      if (!keyboardAnalysis.focusManagement.hasVisibleFocusIndicators) score -= 20;
      if (!keyboardAnalysis.focusManagement.hasLogicalTabOrder) score -= 15;
      if (keyboardAnalysis.focusManagement.focusTrappedElements > 0) score -= 10;
    }
    
    // Check skip links
    if (keyboardAnalysis.skipLinks?.length === 0) score -= 15;
    
    // Check for keyboard traps
    if (keyboardAnalysis.focusTraps?.length > 0) {
      score -= Math.min(keyboardAnalysis.focusTraps.length * 10, 30);
    }
    
    return Math.max(0, Math.round(score));
  }

  countKeyboardViolations(keyboardAnalysis) {
    if (!keyboardAnalysis) return 0;
    
    let violations = 0;
    
    // Count focus management issues
    if (keyboardAnalysis.focusManagement) {
      if (!keyboardAnalysis.focusManagement.hasVisibleFocusIndicators) violations++;
      if (!keyboardAnalysis.focusManagement.hasLogicalTabOrder) violations++;
      violations += keyboardAnalysis.focusManagement.focusTrappedElements || 0;
    }
    
    // Count missing skip links
    if (keyboardAnalysis.skipLinks?.length === 0) violations++;
    
    // Count focus traps
    violations += keyboardAnalysis.focusTraps?.length || 0;
    
    return violations;
  }

  calculateAriaScore(ariaAnalysis) {
    if (!ariaAnalysis) return 0;
    
    let score = 100;
    
    // Deduct for landmark issues
    if (ariaAnalysis.landmarkIssues?.length > 0) {
      ariaAnalysis.landmarkIssues.forEach(issue => {
        if (issue.severity === 'serious') score -= 15;
        else if (issue.severity === 'moderate') score -= 10;
        else score -= 5;
      });
    }
    
    // Check for missing ARIA labels on elements that need them
    const totalInteractiveElements = ariaAnalysis.elementsWithAriaLabel + ariaAnalysis.elementsWithAriaLabelledby;
    if (totalInteractiveElements === 0) score -= 20;
    
    // Deduct for invalid fields without proper error handling
    if (ariaAnalysis.invalidFields > 0) score -= Math.min(ariaAnalysis.invalidFields * 5, 25);
    
    // Check for live regions
    if (ariaAnalysis.liveRegions === 0 && ariaAnalysis.statusElements === 0) score -= 10;
    
    return Math.max(0, Math.round(score));
  }

  calculateFormScore(formAnalysis) {
    if (!formAnalysis || formAnalysis.inputAnalysis?.total === 0) return 100;
    
    let score = 100;
    const inputAnalysis = formAnalysis.inputAnalysis;
    const buttonAnalysis = formAnalysis.buttonAnalysis;
    
    // Deduct for unlabeled inputs
    if (inputAnalysis.withoutLabels > 0) {
      const unlabeledRatio = inputAnalysis.withoutLabels / inputAnalysis.total;
      score -= unlabeledRatio * 40; // Heavy penalty for unlabeled inputs
    }
    
    // Deduct for buttons without text
    if (buttonAnalysis.withoutText > 0) {
      const unlabeledButtonRatio = buttonAnalysis.withoutText / buttonAnalysis.total;
      score -= unlabeledButtonRatio * 30;
    }
    
    // Deduct for missing error handling
    if (inputAnalysis.required > 0 && formAnalysis.errorHandling?.errorElements === 0) {
      score -= 20; // No error handling for required fields
    }
    
    // Deduct for forms without fieldsets (if multiple inputs)
    if (inputAnalysis.total > 3 && inputAnalysis.withFieldsets === 0) {
      score -= 10;
    }
    
    return Math.max(0, Math.round(score));
  }

  calculateTableScore(tableAnalysis) {
    if (!tableAnalysis || tableAnalysis.total === 0) return 100;
    
    let score = 100;
    
    // Deduct for tables without captions
    const tablesWithoutCaptions = tableAnalysis.total - tableAnalysis.withCaptions;
    if (tablesWithoutCaptions > 0) {
      score -= (tablesWithoutCaptions / tableAnalysis.total) * 30;
    }
    
    // Deduct for tables without headers
    const tablesWithoutHeaders = tableAnalysis.total - tableAnalysis.withHeaders;
    if (tablesWithoutHeaders > 0) {
      score -= (tablesWithoutHeaders / tableAnalysis.total) * 40;
    }
    
    // Deduct for complex tables without proper scope/headers
    if (tableAnalysis.complexTables > 0) {
      const complexTablesWithoutScope = tableAnalysis.complexTables - tableAnalysis.withScope;
      if (complexTablesWithoutScope > 0) {
        score -= (complexTablesWithoutScope / tableAnalysis.total) * 25;
      }
    }
    
    // Deduct for specific table issues
    if (tableAnalysis.issues?.length > 0) {
      tableAnalysis.issues.forEach(issue => {
        if (issue.severity === 'serious') score -= 15;
        else if (issue.severity === 'moderate') score -= 10;
        else score -= 5;
      });
    }
    
    return Math.max(0, Math.round(score));
  }
}

module.exports = new AccessibilityAnalyzer();