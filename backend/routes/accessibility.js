const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const AccessibilityAnalyzer = require('../services/accessibilityAnalyzer');
const SeoAnalyzer = require('../services/analysis/SeoAnalyzer');
const AiAnalysisService = require('../services/analysis/AiAnalysisService');
const screenshotService = require('../services/ScreenshotService');
// const pdfGenerator = require('../services/pdfGenerator'); // Removed - PDF functionality disabled
const Analysis = require('../models/Analysis');
const { extractUser } = require('../middleware/auth');
const logger = require('../utils/logger');
const supabase = require('../config/supabase');

// Create analyzer instances
const accessibilityAnalyzer = new AccessibilityAnalyzer();
const seoAnalyzer = new SeoAnalyzer();
const aiAnalysisService = new AiAnalysisService();

const router = express.Router();

// Debug logging for route loading
logger.info('Accessibility routes module loaded');

// Helper function to generate URL hash for caching
function generateUrlHash(url) {
  return crypto.createHash('sha256').update(url).digest('hex');
}

// Helper function to check if cache is valid
function isCacheValid(createdAt, cacheHours = 24) {
  const hoursOld = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  return hoursOld < cacheHours;
}

// Helper function to find cached analysis
async function findCachedAnalysis(url, cacheHours = 24) {
  try {
    const { data, error } = await supabase
      .rpc('find_cached_analysis', {
        p_url: url,
        p_cache_hours: cacheHours
      });

    if (error) {
      logger.error('Error finding cached analysis:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    logger.error('Failed to find cached analysis:', error);
    return null;
  }
}

// Helper function to upload screenshot to Supabase Storage
async function uploadScreenshotToStorage(screenshotData, analysisId, type = 'desktop') {
  try {
    if (!screenshotData) return null;

    // Remove data URL prefix if present
    const base64Data = screenshotData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Create file path
    const fileName = `${analysisId}_${type}_${Date.now()}.jpg`;
    const filePath = `screenshots/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('analysis-screenshots')
      .upload(filePath, buffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      logger.error(`Failed to upload ${type} screenshot:`, error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('analysis-screenshots')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    logger.error(`Error uploading ${type} screenshot:`, error);
    return null;
  }
}

// Helper function to process and store screenshots
async function processScreenshots(screenshotData, analysisId) {
  if (!screenshotData) return null;

  try {
    const [desktopUrl, mobileUrl] = await Promise.all([
      uploadScreenshotToStorage(screenshotData.desktop, analysisId, 'desktop'),
      uploadScreenshotToStorage(screenshotData.mobile, analysisId, 'mobile')
    ]);

    return {
      desktop: desktopUrl,
      mobile: mobileUrl,
      timestamp: screenshotData.timestamp,
      url: screenshotData.url
    };
  } catch (error) {
    logger.error('Failed to process screenshots:', error);
    return null;
  }
}

// Helper function to capture screenshots with existing browser
async function captureScreenshotsWithBrowser(browser, url, options = {}) {
  try {
    const page = await browser.newPage();
    
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

// Add middleware to log all requests to this router
router.use((req, res, next) => {
  logger.info(`=== ACCESSIBILITY ROUTER REQUEST: ${req.method} ${req.path} ===`);
  logger.info('Full URL:', req.originalUrl);
  logger.info('Headers:', req.headers);
  logger.info('Body:', req.body);
  next();
});

// Rate limiting for analysis endpoint
const analysisLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100 : 10, // More permissive in development
  message: {
    error: 'Too many analysis requests, please try again later.',
    retryAfter: 15 * 60 * 1000
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded for analysis endpoint', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      error: 'Too many analysis requests, please try again later.',
      retryAfter: 15 * 60 * 1000
    });
  }
});

// Validation middleware
const validateAnalysisRequest = [
  body('url')
    .customSanitizer(value => {
      // Trim and normalize the URL
      let cleanUrl = value.trim().replace(/\/+$/, '');
      
      // Add https:// if no protocol is specified
      if (cleanUrl && !cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = 'https://' + cleanUrl;
      }
      
      return cleanUrl;
    })
    .isURL({ require_protocol: true, protocols: ['http', 'https'] })
    .withMessage('Please provide a valid website URL (e.g., example.com or https://example.com)')
    .isLength({ max: 2000 })
    .withMessage('URL is too long')
];


// POST /api/accessibility/analyze
router.post('/analyze', analysisLimiter, validateAnalysisRequest, extractUser, async (req, res) => {
  logger.info('=== ANALYZE ENDPOINT CALLED ===');
  logger.info('Request received at analyze endpoint:', {
    method: req.method,
    url: req.url,
    path: req.path,
    body: req.body
  });
  try {
    logger.info('Step 1: Checking validation errors');
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error('Validation failed:', errors.array());
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    logger.info('Step 2: Extracting request data');
    const { url, reportType = 'overview', language = 'en' } = req.body;
    const { useCache } = req.query; // Allow forcing cache usage in development
    const clientIp = req.ip || req.connection.remoteAddress;
    
    logger.info(`Analysis request received`, { 
      url, 
      clientIp,
      userAgent: req.get('User-Agent'),
      useCache,
      environment: process.env.NODE_ENV
    });

    // Step 3: Check for cached analysis
    logger.info('Step 3: Checking for cached analysis');
    const isDevelopment = process.env.NODE_ENV === 'development';
    const cacheHours = isDevelopment ? 0.5 : 24; // 30 minutes in dev, 24 hours in production
    
    // In development: only use cache if explicitly requested
    // In production: always check cache first
    const shouldCheckCache = isDevelopment ? (useCache === 'true') : true;
    
    if (shouldCheckCache) {
      const cachedResult = await findCachedAnalysis(url, cacheHours);
      
      if (cachedResult && cachedResult.is_cache_valid) {
        logger.info('Valid cached analysis found', {
          analysisId: cachedResult.analysis_id,
          hoursOld: cachedResult.hours_old,
          createdAt: cachedResult.created_at
        });
        
        try {
          // Increment access count
          await supabase.rpc('increment_analysis_access', {
            p_analysis_id: cachedResult.analysis_id
          });
          
          // Retrieve the full analysis data
          const { data: cachedAnalysis, error } = await supabase
            .from('analyses')
            .select('*')
            .eq('id', cachedResult.analysis_id)
            .single();
          
          if (!error && cachedAnalysis && cachedAnalysis.analysis_data) {
            logger.info('Returning cached analysis', {
              analysisId: cachedResult.analysis_id,
              url: url
            });
            
            // Add cache metadata to response
            const response = {
              ...cachedAnalysis.analysis_data,
              _cache: {
                hit: true,
                createdAt: cachedAnalysis.created_at,
                hoursOld: cachedResult.hours_old,
                accessCount: cachedAnalysis.access_count + 1
              }
            };
            
            return res.json({
              success: true,
              data: response,
              meta: {
                analysisTime: 0, // No analysis time for cached results
                timestamp: new Date().toISOString(),
                reportType: cachedAnalysis.report_type,
                cached: true,
                cacheAge: `${Math.round(cachedResult.hours_old)} hours`
              }
            });
          }
        } catch (error) {
          logger.error('Failed to retrieve cached analysis:', error);
          // Continue with fresh analysis if cache retrieval fails
        }
      } else {
        logger.info('No valid cached analysis found', {
          found: !!cachedResult,
          isValid: cachedResult?.is_cache_valid,
          hoursOld: cachedResult?.hours_old
        });
      }
    }

    logger.info('Step 4: Starting comprehensive analysis');
    // Start comprehensive analysis
    const startTime = Date.now();
    
    try {
      logger.info('Starting comprehensive analysis with Phase 1 services', { url });
      
      logger.info('Step 4: Initializing Phase 1 services data');
      // Initialize Phase 1 services data
      let screenshotData = null;
      let seoData = null;
      let aiData = null;
      let accessibilityReport = null;
      
      logger.info('Step 5: About to run Phase 1 services');
      // Run Phase 1 services with proper error handling
      try {
        logger.info('Running Phase 1 services', { url });
        
        // Check if Chrome is available before launching browser-dependent services
        const puppeteer = require('puppeteer');
        const BrowserConfig = require('../utils/browserConfig');
        const browserConfig = new BrowserConfig();
        
        let browserAvailable = false;
        
        try {
          logger.info('Testing browser availability with cross-platform configuration', {
            platform: browserConfig.platform,
            isWSL: browserConfig.isWSL,
            isDocker: browserConfig.isDocker,
            chromeExecutablePath: browserConfig.chromeExecutablePath
          });
          
          logger.info('About to call testBrowserLaunch...');
          browserAvailable = await browserConfig.testBrowserLaunch();
          logger.info('testBrowserLaunch returned:', browserAvailable);
          
          if (browserAvailable) {
            logger.info('Browser test successful, proceeding with Phase 1 services');
          } else {
            logger.warn('Browser test failed, will throw error');
          }
        } catch (err) {
          logger.warn('Browser availability test failed:', err.message);
          logger.warn('Browser availability test stack:', err.stack);
          browserAvailable = false;
        }
        
        // Try to run accessibility analysis first with retry mechanism
        let accessibilityAttempts = 0;
        const maxAttempts = 2;
        
        while (accessibilityAttempts < maxAttempts && !accessibilityReport) {
          accessibilityAttempts++;
          try {
            if (browserAvailable) {
              logger.info(`Running accessibility analysis with browser (attempt ${accessibilityAttempts}/${maxAttempts})`);
              accessibilityReport = await accessibilityAnalyzer.analyzeWebsite(url, reportType, language);
            } else {
              logger.error('Browser not available, cannot perform accessibility analysis');
              throw new Error('Browser dependencies not available. Please ensure Chrome/Chromium is properly installed.');
            }
          } catch (err) {
            logger.error(`Accessibility analysis attempt ${accessibilityAttempts} failed:`, err.message);
            
            if (accessibilityAttempts >= maxAttempts) {
              // After all attempts failed, provide more specific error message
              if (err.message.includes('connection was interrupted') || err.message.includes('Protocol error') || err.message.includes('Connection closed')) {
                throw new Error(`Unable to analyze "${url}". This website appears to have security measures that prevent automated analysis. Please try a different website or contact support.`);
              } else {
                throw err; // Re-throw other errors
              }
            } else {
              // Wait a bit before retry
              logger.info(`Waiting before retry attempt...`);
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }
        
        if (browserAvailable) {
          // Reuse the browser instance from the accessibility analyzer
          let browser = null;
          let page = null;
          
          try {
            // Get the browser instance from the accessibility analyzer
            browser = accessibilityAnalyzer.browserUtils.getBrowser();
            
            if (!browser) {
              logger.warn('No browser instance available from accessibility analyzer, creating new one');
              const launchOptions = browserConfig.getLaunchOptions();
              browser = await puppeteer.launch(launchOptions);
            }
            
            logger.info('Using browser instance for comprehensive analysis');
            page = await browser.newPage();
            
            // Set up page for comprehensive analysis
            await page.setViewport({ width: 1920, height: 1080 });
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
            
            // Run SEO analysis first
            try {
              logger.info('Running SEO analysis');
              seoData = await seoAnalyzer.analyze(page, url);
              logger.info('SEO analysis completed', { score: seoData?.score || 0 });
            } catch (err) {
              logger.warn('SEO analysis failed:', err.message);
            }
            
            // Run AI analysis
            try {
              logger.info('Running AI analysis');
              aiData = await aiAnalysisService.analyze(page, url, {
                accessibility: accessibilityReport,
                seo: seoData
              });
              logger.info('AI analysis completed');
            } catch (err) {
              logger.warn('AI analysis failed:', err.message);
            }
            
            // Run screenshot service with the same browser instance
            try {
              logger.info('Running screenshot capture with existing browser');
              screenshotData = await captureScreenshotsWithBrowser(browser, url, {
                desktopWidth: 1920,
                desktopHeight: 1080,
                mobileWidth: 375,
                mobileHeight: 667,
                quality: 85
              });
              logger.info('Screenshot capture completed');
            } catch (err) {
              logger.warn('Screenshot service failed:', err.message);
            }
            
          } catch (err) {
            logger.warn('Browser operations failed:', err.message);
            logger.warn('Browser operations stack:', err.stack);
          } finally {
            if (page) {
              try { await page.close(); } catch (e) { logger.warn('Page close error:', e.message); }
            }
            // Don't close the browser here since it belongs to the accessibility analyzer
            // The accessibility analyzer will handle browser cleanup
          }
        } else {
          // No browser available - throw error instead of using fallback data
          logger.error('Browser not available, cannot perform comprehensive analysis');
          throw new Error('Browser dependencies not available. Please install Chrome dependencies using setup-chrome-wsl.bat or install-chrome-deps.sh');
        }
        
      } catch (err) {
        logger.warn('Phase 1 services error:', err.message);
      }
      
      // AI analysis was already run with SEO data above
      
      // If accessibility analysis failed, throw error immediately
      if (!accessibilityReport) {
        throw new Error('Accessibility analysis failed. Unable to generate report.');
      }

      // Create comprehensive report
      const report = {
        ...accessibilityReport,
        screenshot: screenshotData,
        seo: seoData,
        aiInsights: aiData,
        metadata: {
          ...(accessibilityReport?.metadata || {}),
          hasScreenshots: !!screenshotData,
          hasSeoAnalysis: !!seoData,
          hasAiInsights: !!aiData
        }
      };
      
      // Update summary with comprehensive data
      if (report.summary) {
        report.summary.seoScore = seoData?.score || 0;
        report.summary.performanceScore = 0; // Placeholder for future performance analysis
        
        // Use the calculated overallScore from the detailed report
        report.summary.accessibilityScore = report.overallScore || report.summary.accessibilityScore || 0;
        report.summary.overallScore = Math.round(
          (report.summary.accessibilityScore * 0.5) + 
          (report.summary.seoScore * 0.3) + 
          (report.summary.performanceScore * 0.2)
        );
        
        logger.info('Updated summary scores:', {
          accessibilityScore: report.summary.accessibilityScore,
          seoScore: report.summary.seoScore,
          overallScore: report.summary.overallScore,
          reportOverallScore: report.overallScore
        });
      }
      
      // Update the cached detailed report with enhanced features
      if (accessibilityReport && accessibilityReport.analysisId) {
        logger.info('Updating cached detailed report with enhanced features', { 
          analysisId: accessibilityReport.analysisId,
          hasScreenshots: !!screenshotData,
          hasSeoAnalysis: !!seoData,
          hasAiInsights: !!aiData
        });
        
        // Get the cached detailed report
        const cachedDetailedReport = accessibilityAnalyzer.getDetailedReport(accessibilityReport.analysisId);
        if (cachedDetailedReport) {
          // Add enhanced features to the detailed report
          cachedDetailedReport.screenshot = screenshotData;
          cachedDetailedReport.seo = seoData;
          cachedDetailedReport.aiInsights = aiData;
          cachedDetailedReport.metadata = {
            ...cachedDetailedReport.metadata,
            hasScreenshots: !!screenshotData,
            hasSeoAnalysis: !!seoData,
            hasAiInsights: !!aiData
          };
          
          // Update summary in detailed report
          if (cachedDetailedReport.summary) {
            cachedDetailedReport.summary.seoScore = seoData?.score || 0;
            cachedDetailedReport.summary.performanceScore = 0;
            cachedDetailedReport.summary.overallScore = Math.round(
              (cachedDetailedReport.summary.accessibilityScore * 0.5) + 
              (cachedDetailedReport.summary.seoScore * 0.3) + 
              (cachedDetailedReport.summary.performanceScore * 0.2)
            );
          }
          
          // Re-cache the updated detailed report
          accessibilityAnalyzer.cacheManager.setAnalysis(accessibilityReport.analysisId, cachedDetailedReport);
        }
      }
      
      const analysisTime = Date.now() - startTime;
      
      // Save analysis to Supabase database (always save, including anonymous)
      try {
        logger.info('Preparing to save analysis to database', { 
          hasUser: !!req.user,
          userId: req.user?.id,
          userEmail: req.user?.email,
          analysisId: report.analysisId,
          isAnonymous: !req.user || !req.user.id
        });
        
        // Generate a unique ID for the analysis if needed
        const analysisId = report.analysisId || crypto.randomUUID();
        
        // Process and upload screenshots to Supabase Storage
        let processedScreenshots = null;
        if (screenshotData) {
          logger.info('Processing screenshots for storage', { analysisId });
          processedScreenshots = await processScreenshots(screenshotData, analysisId);
          
          // Update report with processed screenshot URLs
          if (processedScreenshots) {
            report.screenshot = processedScreenshots;
          }
        }
        
        // Calculate cache expiry time
        const cacheHours = isDevelopment ? 0.5 : 24; // 30 minutes in dev, 24 hours in production
        const cacheExpiresAt = new Date(Date.now() + (cacheHours * 60 * 60 * 1000));
        
        // Prepare analysis data for database
        const analysisDataForDb = {
          url: url,
          reportType: reportType,
          language: language,
          overallScore: report.summary?.overallScore || report.overallScore || 0,
          accessibilityScore: report.summary?.accessibilityScore || report.overallScore || 0,
          seoScore: report.summary?.seoScore || 0,
          performanceScore: report.summary?.performanceScore || 0,
          analysisData: report,
          metadata: {
            ...report.metadata,
            originalAnalysisId: analysisId,
            analysisTime,
            clientIp,
            userAgent: req.get('User-Agent'),
            hasProcessedScreenshots: !!processedScreenshots
          },
          status: 'completed',
          isAnonymous: !req.user || !req.user.id,
          cacheExpiresAt: cacheExpiresAt.toISOString(),
          urlHash: generateUrlHash(url)
        };
        
        // Add user ID if authenticated
        if (req.user && req.user.id) {
          analysisDataForDb.userId = req.user.id;
        }
        
        logger.info('Saving analysis to database', { 
          analysisId: analysisId,
          isAnonymous: analysisDataForDb.isAnonymous,
          urlHash: analysisDataForDb.urlHash,
          cacheExpiresAt: analysisDataForDb.cacheExpiresAt
        });
        
        // Use direct Supabase insert to handle anonymous analyses
        const { data: savedAnalysis, error } = await supabase
          .from('analyses')
          .insert({
            id: analysisId,
            user_id: analysisDataForDb.userId || null,
            url: analysisDataForDb.url,
            report_type: analysisDataForDb.reportType,
            overall_score: analysisDataForDb.overallScore,
            accessibility_score: analysisDataForDb.accessibilityScore,
            seo_score: analysisDataForDb.seoScore,
            performance_score: analysisDataForDb.performanceScore,
            violations: report.violations || null,
            summary: report.summary || null,
            metadata: analysisDataForDb.metadata,
            screenshots: report.screenshot || null,
            seo_analysis: report.seo || null,
            ai_insights: report.aiInsights || null,
            status: analysisDataForDb.status,
            is_anonymous: analysisDataForDb.isAnonymous,
            cache_expires_at: analysisDataForDb.cacheExpiresAt,
            access_count: 1,
            last_accessed_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (error) {
          throw error;
        }
        
        // Update the report with the database ID for frontend reference
        report.databaseId = savedAnalysis.id;
        
        logger.info('Analysis saved to database successfully', { 
          analysisId: savedAnalysis.id,
          isAnonymous: savedAnalysis.is_anonymous,
          cacheExpiresAt: savedAnalysis.cache_expires_at
        });
      } catch (dbError) {
        logger.error('Failed to save analysis to database:', {
          error: dbError.message,
          analysisId: report.analysisId
        });
        // Continue anyway - don't fail the analysis if database save fails
      }
      
      logger.info(`Comprehensive analysis completed successfully`, {
        url,
        analysisId: report.analysisId,
        accessibilityScore: report.summary.accessibilityScore,
        seoScore: report.summary.seoScore,
        overallScore: report.summary.overallScore,
        analysisTime,
        violations: report.summary.totalIssues,
        reportType,
        hasScreenshots: report.metadata.hasScreenshots,
        hasSeoAnalysis: report.metadata.hasSeoAnalysis,
        hasAiInsights: report.metadata.hasAiInsights
      });

      logger.info('Sending response to frontend', {
        analysisId: report.analysisId,
        imagesWithoutAlt: report.summary?.imagesWithoutAlt,
        totalViolations: report.summary?.totalViolations,
        reportType: report.reportType,
        overallScore: report.summary?.overallScore,
        accessibilityScore: report.summary?.accessibilityScore,
        seoScore: report.summary?.seoScore,
        performanceScore: report.summary?.performanceScore
      });

      res.json({
        success: true,
        data: {
          ...report,
          // Ensure all summary scores are included at the top level for frontend compatibility
          overallScore: report.summary?.overallScore || report.overallScore || 0,
          accessibilityScore: report.summary?.accessibilityScore || report.overallScore || 0,
          seoScore: report.summary?.seoScore || report.seo?.score || 0,
          performanceScore: report.summary?.performanceScore || 0
        },
        meta: {
          analysisTime,
          timestamp: new Date().toISOString(),
          reportType
        }
      });

    } catch (analysisError) {
      logger.error(`Analysis failed`, {
        url,
        error: analysisError.message,
        stack: analysisError.stack,
        analysisTime: Date.now() - startTime
      });

      // Return user-friendly error message
      let errorMessage = 'DEBUGGING: Unable to analyze the website. ';
      
      if (analysisError.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
        errorMessage += 'The website could not be found. Please check the URL.';
      } else if (analysisError.message.includes('net::ERR_CONNECTION_REFUSED')) {
        errorMessage += 'The website refused the connection. It may be down or blocking automated requests.';
      } else if (analysisError.message.includes('net::ERR_TIMED_OUT')) {
        errorMessage += 'The website took too long to respond. Please try again later.';
      } else if (analysisError.message.includes('net::ERR_CERT_')) {
        errorMessage += 'The website has SSL certificate issues.';
      } else if (analysisError.message.includes('Invalid URL')) {
        errorMessage += 'Please provide a valid URL.';
      } else {
        errorMessage += 'Please try again later or contact support if the problem persists.';
      }

      res.status(422).json({
        error: 'Analysis failed',
        message: errorMessage,
        code: 'ANALYSIS_FAILED'
      });
    }

  } catch (error) {
    logger.error('Unexpected error in analysis endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again later.',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/accessibility/health
router.get('/health', async (req, res) => {
  try {
    // Basic health check
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        analyzer: 'operational'
      }
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable'
    });
  }
});

// GET /api/accessibility/detailed/:analysisId
router.get('/detailed/:analysisId', extractUser, async (req, res) => {
  try {
    const { analysisId } = req.params;
    
    if (!analysisId) {
      return res.status(400).json({
        error: 'Missing analysis ID',
        message: 'Please provide a valid analysis ID'
      });
    }

    logger.info('Detailed report request received', { analysisId });

    const { language = 'en' } = req.query;
    
    // First try to get from cache
    let detailedReport = accessibilityAnalyzer.getDetailedReport(analysisId);
    
    // If not in cache, try to get from database
    if (!detailedReport && req.user && req.user.id) {
      logger.info('Report not in cache, checking database', { analysisId, userId: req.user.id });
      
      try {
        const dbAnalysis = await Analysis.findById(analysisId, req.user.id);
        if (dbAnalysis && dbAnalysis.analysis_data) {
          detailedReport = dbAnalysis.analysis_data;
          logger.info('Report found in database', { analysisId });
        }
      } catch (dbError) {
        logger.error('Database lookup failed:', { error: dbError.message, analysisId });
      }
    }
    
    if (!detailedReport) {
      return res.status(404).json({
        error: 'Report not found',
        message: 'The requested analysis report was not found or has expired'
      });
    }

    // Note: Language-specific recommendations are now generated during analysis
    // The detailed report already contains properly localized recommendations
    
    res.json({
      success: true,
      data: detailedReport,
      meta: {
        timestamp: new Date().toISOString(),
        reportType: 'detailed'
      }
    });
    
    logger.info('Detailed report sent successfully', { analysisId });

  } catch (error) {
    logger.error('Detailed report retrieval failed:', { error: error.message, analysisId: req.params.analysisId });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Unable to retrieve detailed report. Please try again later.'
    });
  }
});

// GET /api/accessibility/pdf/:analysisId - DISABLED
router.get('/pdf/:analysisId', async (req, res) => {
  logger.info('PDF download request - feature disabled');
  res.status(501).json({
    error: 'PDF generation not available',
    message: 'PDF functionality has been disabled'
  });
});

// POST /api/accessibility/generate-pdf - DISABLED
router.post('/generate-pdf', analysisLimiter, async (req, res) => {
  logger.info('PDF generation request - feature disabled');
  res.status(501).json({
    error: 'PDF generation not available',
    message: 'PDF functionality has been disabled'
  });
});

// GET /api/accessibility/demo
router.get('/demo', (req, res) => {
  res.json({
    message: 'StreetWiseWeb Accessibility Analyzer API',
    version: '1.0.0',
    endpoints: {
      analyze: 'POST /api/accessibility/analyze',
      'detailed-report': 'GET /api/accessibility/detailed/:analysisId',
      'download-pdf': 'GET /api/accessibility/pdf/:analysisId',
      'generate-pdf': 'POST /api/accessibility/generate-pdf (legacy)',
      health: 'GET /api/accessibility/health'
    },
    documentation: 'https://streetwiseweb.com/api-docs'
  });
});

module.exports = router;