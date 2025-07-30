const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const AccessibilityAnalyzer = require('../services/accessibilityAnalyzer');
const SeoAnalyzer = require('../services/analysis/SeoAnalyzer');
const AiAnalysisService = require('../services/analysis/AiAnalysisService');
const screenshotService = require('../services/ScreenshotService');
const ReportService = require('../services/reports/ReportService');
// const pdfGenerator = require('../services/pdfGenerator'); // Removed - PDF functionality disabled
const Analysis = require('../models/Analysis');
const { extractUser } = require('../middleware/auth');
const logger = require('../utils/logger');
const supabase = require('../config/supabase');

// Create analyzer instances
const accessibilityAnalyzer = new AccessibilityAnalyzer();
const seoAnalyzer = new SeoAnalyzer();
const aiAnalysisService = new AiAnalysisService();
const reportService = new ReportService();

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

// Helper function to validate report data structure
function validateReportData(report) {
  const errors = [];

  // Check required fields
  if (!report.analysisId) {
    errors.push('Missing analysisId');
  }

  if (!report.url) {
    errors.push('Missing URL');
  }

  // Validate scores are numbers within valid range
  const scores = ['overallScore', 'accessibilityScore', 'seoScore', 'performanceScore'];
  scores.forEach(scoreField => {
    if (report.summary && report.summary[scoreField] !== undefined) {
      const score = report.summary[scoreField];
      if (typeof score !== 'number' || score < 0 || score > 100) {
        errors.push(`Invalid ${scoreField}: must be a number between 0 and 100`);
      }
    }
  });

  // Validate violations structure
  if (report.violations && !Array.isArray(report.violations)) {
    errors.push('Violations must be an array');
  }

  // Validate summary structure
  if (report.summary && typeof report.summary !== 'object') {
    errors.push('Summary must be an object');
  }

  // Validate metadata structure
  if (report.metadata && typeof report.metadata !== 'object') {
    errors.push('Metadata must be an object');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Helper function to validate detailed report data
function validateDetailedReportData(report) {
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    dataPresence: {}
  };

  // Check required fields
  const requiredFields = ['analysisId', 'url', 'reportType'];
  requiredFields.forEach(field => {
    if (!report[field]) {
      validation.errors.push(`Missing required field: ${field}`);
      validation.isValid = false;
    }
  });

  // Check data presence
  validation.dataPresence = {
    violations: !!(report.violations && Array.isArray(report.violations)),
    summary: !!report.summary,
    screenshots: !!(report.screenshot?.desktop || report.screenshot?.mobile || report.screenshot?.url),
    seo: !!report.seo,
    aiInsights: !!report.aiInsights,
    metadata: !!report.metadata
  };

  // Add warnings for missing enhanced features
  if (!validation.dataPresence.screenshots) {
    validation.warnings.push('Screenshots data is missing or incomplete');
  }
  if (!validation.dataPresence.seo) {
    validation.warnings.push('SEO analysis data is missing');
  }
  if (!validation.dataPresence.aiInsights) {
    validation.warnings.push('AI insights data is missing');
  }

  return validation;
}

// Helper function to find cached analysis with retry logic
async function findCachedAnalysis(url, cacheHours = 24, maxRetries = 2) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data, error } = await supabase
        .rpc('find_cached_analysis', {
          p_url: url,
          p_cache_hours: cacheHours
        });

      if (error) {
        // Log the error but don't retry for function not found errors
        if (error.code === 'PGRST202') {
          logger.error('find_cached_analysis function not found in database:', error);
          return null;
        }
        throw error;
      }

      return data?.[0] || null;
    } catch (error) {
      lastError = error;
      logger.warn(`Cache lookup attempt ${attempt}/${maxRetries} failed:`, error.message);

      if (attempt < maxRetries) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  logger.error('All cache lookup attempts failed:', lastError);
  return null;
}

// Helper function to upload screenshot to Supabase Storage
async function uploadScreenshotToStorage(screenshotData, analysisId, userId, type = 'desktop') {
  try {
    if (!screenshotData) return null;

    // Remove data URL prefix if present
    const base64Data = screenshotData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Create user-specific file path: {userId}/{analysisId}/screenshots/{type}.jpg
    const fileName = `${type}.jpg`;
    const filePath = userId ?
      `${userId}/${analysisId}/screenshots/${fileName}` :
      `anonymous/${analysisId}/screenshots/${fileName}`;

    // Upload to Supabase Storage
    logger.info('Attempting to upload screenshot to Supabase Storage', {
      filePath,
      bufferSize: buffer.length,
      hasSupabase: !!supabase,
      hasStorage: !!supabase?.storage
    });

    if (!supabase || !supabase.storage) {
      logger.error('Supabase client or storage not available');
      return null;
    }

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
async function processScreenshots(screenshotData, analysisId, userId = null) {
  if (!screenshotData) return null;

  try {
    const [desktopUrl, mobileUrl] = await Promise.all([
      uploadScreenshotToStorage(screenshotData.desktop, analysisId, userId, 'desktop'),
      uploadScreenshotToStorage(screenshotData.mobile, analysisId, userId, 'mobile')
    ]);

    return {
      desktop: desktopUrl,
      mobile: mobileUrl,
      timestamp: screenshotData.timestamp
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
          
          if (!error && cachedAnalysis) {
            logger.info('Returning cached analysis', {
              analysisId: cachedResult.analysis_id,
              url: url
            });

            // Reconstruct the analysis data from separate columns
            const reconstructedAnalysis = {
              analysisId: cachedAnalysis.id,
              url: cachedAnalysis.url,
              reportType: cachedAnalysis.report_type,
              overallScore: cachedAnalysis.overall_score,
              violations: cachedAnalysis.violations,
              summary: cachedAnalysis.summary,
              metadata: cachedAnalysis.metadata,
              screenshot: cachedAnalysis.screenshots,
              seo: cachedAnalysis.seo_analysis,
              aiInsights: cachedAnalysis.ai_insights
            };

            // Add cache metadata to response
            const response = {
              ...reconstructedAnalysis,
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
          // Run additional services with separate browser instances for better isolation
          let browser = null;
          let page = null;
          
          try {
            // Get the browser instance from the accessibility analyzer for SEO and AI analysis
            browser = accessibilityAnalyzer.browserUtils.getBrowser();
            
            if (!browser) {
              logger.warn('No browser instance available from accessibility analyzer, creating new one');
              const launchOptions = browserConfig.getLaunchOptions();
              browser = await puppeteer.launch(launchOptions);
            }
            
            logger.info('Using browser instance for SEO and AI analysis');
            page = await browser.newPage();
            
            // Set up page for analysis
            await page.setViewport({ width: 1920, height: 1080 });
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
            
            // Run SEO analysis
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
            
            // Capture screenshots using the already loaded page
            try {
              logger.info('Running screenshot capture with already loaded page');
              
              const screenshots = {};
              
              // Desktop screenshot
              await page.setViewport({
                width: 1920,
                height: 1080,
                deviceScaleFactor: 1
              });
              
              screenshots.desktop = await page.screenshot({
                encoding: 'base64',
                fullPage: false,
                type: 'jpeg',
                quality: 85,
                clip: {
                  x: 0,
                  y: 0,
                  width: 1920,
                  height: 1080
                }
              });
              
              // Mobile screenshot
              await page.setViewport({
                width: 375,
                height: 667,
                deviceScaleFactor: 2
              });
              
              screenshots.mobile = await page.screenshot({
                encoding: 'base64',
                fullPage: false,
                type: 'jpeg',
                quality: 85,
                clip: {
                  x: 0,
                  y: 0,
                  width: 375,
                  height: 667
                }
              });
              
              // Format screenshot data
              screenshotData = {
                desktop: `data:image/jpeg;base64,${screenshots.desktop}`,
                mobile: `data:image/jpeg;base64,${screenshots.mobile}`,
                timestamp: new Date().toISOString(),
                url: url
              };
              
              logger.info('Screenshot capture completed successfully');
            } catch (err) {
              logger.error('Screenshot capture failed:', {
                error: err.message,
                stack: err.stack
              });
              screenshotData = null;
            }
            
          } catch (err) {
            logger.warn('SEO/AI analysis failed:', err.message);
            logger.warn('SEO/AI analysis stack:', err.stack);
          } finally {
            if (page) {
              try { await page.close(); } catch (e) { logger.warn('Page close error:', e.message); }
            }
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

      // Create comprehensive raw analysis data
      const rawAnalysisData = {
        ...accessibilityReport,
        screenshot: screenshotData,
        screenshots: screenshotData, // For new report format
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
      if (rawAnalysisData.summary) {
        rawAnalysisData.summary.seoScore = seoData?.score || 0;
        rawAnalysisData.summary.performanceScore = 0; // Placeholder for future performance analysis
        
        // Use the calculated overallScore from the detailed report
        rawAnalysisData.summary.accessibilityScore = rawAnalysisData.overallScore || rawAnalysisData.summary.accessibilityScore || 0;
        rawAnalysisData.summary.overallScore = Math.round(
          (rawAnalysisData.summary.accessibilityScore * 0.5) + 
          (rawAnalysisData.summary.seoScore * 0.3) + 
          (rawAnalysisData.summary.performanceScore * 0.2)
        );
        
        logger.info('Updated summary scores:', {
          accessibilityScore: rawAnalysisData.summary.accessibilityScore,
          seoScore: rawAnalysisData.summary.seoScore,
          overallScore: rawAnalysisData.summary.overallScore,
          reportOverallScore: rawAnalysisData.overallScore
        });
      }

      // NEW DUAL REPORT GENERATION: Generate BOTH free and detailed reports
      logger.info('Generating dual reports (free + detailed)', {
        analysisId: rawAnalysisData.analysisId,
        hasUser: !!req.user,
        userId: req.user?.id
      });

      let freeReport = rawAnalysisData;
      let detailedReport = rawAnalysisData;
      let freeStructuredReport = null;
      let detailedStructuredReport = null;
      
      try {
        // 1. Generate FREE report (always available)
        logger.info('Generating free report');
        freeStructuredReport = await reportService.generateReport(rawAnalysisData, {
          user: req.user,
          requestedReportType: 'free', // Force free report
          language: language
        });
        freeReport = reportService.convertToLegacyFormat(freeStructuredReport);
        freeReport.structuredReport = freeStructuredReport;
        freeReport.reportType = 'free';
        
        // 2. Generate DETAILED report (always generate, but access controlled)
        logger.info('Generating detailed report');
        detailedStructuredReport = await reportService.generateReport(rawAnalysisData, {
          user: req.user,
          requestedReportType: 'detailed', // Force detailed report
          language: language
        });
        detailedReport = reportService.convertToLegacyFormat(detailedStructuredReport);
        detailedReport.structuredReport = detailedStructuredReport;
        detailedReport.reportType = 'detailed';
        
        logger.info('Both reports generated successfully', {
          freeReportSize: JSON.stringify(freeReport).length,
          detailedReportSize: JSON.stringify(detailedReport).length
        });
        
      } catch (reportError) {
        logger.warn('Failed to generate structured reports, using legacy format:', reportError.message);
        // Use the original rawAnalysisData as fallback, but ensure they're different
        freeReport = { 
          ...rawAnalysisData, 
          reportType: 'free',
          // Limit free report content
          violations: rawAnalysisData.violations ? rawAnalysisData.violations.slice(0, 3) : [],
          structuredReport: null
        };
        detailedReport = { 
          ...rawAnalysisData, 
          reportType: 'detailed',
          // Keep full content for detailed report
          structuredReport: null
        };
      }

      // Determine which report to return to user based on request
      let report;
      if (reportType === 'detailed' && req.user) {
        // User requested detailed report and is authenticated
        report = detailedReport;
        logger.info('Returning detailed report to user');
      } else {
        // Return free report for anonymous users or overview requests
        report = freeReport;
        logger.info('Returning free report to user');
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
          isAnonymous: !req.user || !req.user.id,
          authHeader: req.headers.authorization ? 'present' : 'missing',
          authHeaderLength: req.headers.authorization?.length || 0
        });
        
        // Generate a unique ID for the analysis if needed
        const analysisId = report.analysisId || crypto.randomUUID();

        // Validate report data structure before saving
        const validation = validateReportData(report);
        if (!validation.isValid) {
          logger.warn('Report validation failed:', validation.errors);
          // Continue anyway but log the issues for debugging
        }

        // Process and upload screenshots to Supabase Storage
        logger.info('Screenshot processing check', { 
          hasScreenshotData: !!screenshotData, 
          screenshotDataType: typeof screenshotData,
          analysisId 
        });
        
        let processedScreenshots = null;
        if (screenshotData) {
          logger.info('Processing screenshots for storage', { analysisId, userId: req.user?.id });
          processedScreenshots = await processScreenshots(screenshotData, analysisId, req.user?.id);
          
          // Update report with processed screenshot URLs
          if (processedScreenshots) {
            report.screenshot = processedScreenshots;
          }
        }
        
        // Calculate cache expiry time
        const cacheHours = isDevelopment ? 0.5 : 24; // 30 minutes in dev, 24 hours in production
        const cacheExpiresAt = new Date(Date.now() + (cacheHours * 60 * 60 * 1000));
        
        // Determine payment/access status for detailed report
        const hasDetailedAccess = req.user && (req.user.plan_type === 'premium' || req.user.plan_type === 'basic');
        const detailedReportPaid = hasDetailedAccess || (process.env.NODE_ENV === 'development' || process.env.APP_ENV === 'development');
        
        // Prepare analysis data for database with DUAL REPORTS
        const analysisDataForDb = {
          url: url,
          reportType: reportType, // Keep original requested type for compatibility
          language: language,
          overallScore: report.summary?.overallScore || report.overallScore || 0,
          accessibilityScore: report.summary?.accessibilityScore || report.accessibilityScore || 0,
          seoScore: report.summary?.seoScore || report.seoScore || 0,
          performanceScore: report.summary?.performanceScore || report.performanceScore || 0,
          
          // Legacy field for backward compatibility
          analysisData: report,
          
          // NEW DUAL REPORT STORAGE
          freeReport: freeReport,
          detailedReport: detailedReport,
          detailedReportPaid: detailedReportPaid,
          hasDetailedAccess: hasDetailedAccess,
          
          metadata: {
            ...report.metadata,
            originalAnalysisId: analysisId,
            analysisTime,
            clientIp,
            userAgent: req.get('User-Agent'),
            hasProcessedScreenshots: !!processedScreenshots,
            dualReportsGenerated: true,
            freeReportSize: JSON.stringify(freeReport).length,
            detailedReportSize: JSON.stringify(detailedReport).length
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
        
        // Add the analysis ID to match the screenshot storage path
        analysisDataForDb.analysisId = analysisId;
        
        logger.info('Saving analysis to database', { 
          analysisId: analysisId,
          isAnonymous: analysisDataForDb.isAnonymous,
          urlHash: analysisDataForDb.urlHash,
          cacheExpiresAt: analysisDataForDb.cacheExpiresAt
        });
        
        // Use Analysis model to save with DUAL REPORT structure
        const savedAnalysis = await Analysis.create({
          ...analysisDataForDb
        });
        
        logger.info('Dual reports saved successfully', {
          analysisId: analysisId,
          databaseId: savedAnalysis.id,
          detailedReportPaid: detailedReportPaid,
          hasDetailedAccess: hasDetailedAccess,
          returnedReportType: report.reportType
        });
          
        // Error handling is now done in the Analysis model
        
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

      // Clean up accessibility analyzer browser before sending response
      try {
        logger.info('Cleaning up accessibility analyzer browser');
        await accessibilityAnalyzer.cleanup();
        logger.info('Accessibility analyzer cleanup completed');
      } catch (cleanupError) {
        logger.warn('Accessibility analyzer cleanup failed:', cleanupError.message);
        // Don't fail the request if cleanup fails
      }

      res.json({
        success: true,
        data: {
          ...report,
          // Ensure all summary scores are included at the top level for frontend compatibility
          overallScore: report.summary?.overallScore || report.overallScore || 0,
          accessibilityScore: report.summary?.accessibilityScore || report.accessibilityScore || 0,
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

      // Clean up accessibility analyzer browser on error
      try {
        logger.info('Cleaning up accessibility analyzer browser after error');
        await accessibilityAnalyzer.cleanup();
        logger.info('Accessibility analyzer cleanup completed after error');
      } catch (cleanupError) {
        logger.warn('Accessibility analyzer cleanup failed after error:', cleanupError.message);
      }

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
    
    // Clean up accessibility analyzer browser on unexpected error
    try {
      logger.info('Cleaning up accessibility analyzer browser after unexpected error');
      await accessibilityAnalyzer.cleanup();
      logger.info('Accessibility analyzer cleanup completed after unexpected error');
    } catch (cleanupError) {
      logger.warn('Accessibility analyzer cleanup failed after unexpected error:', cleanupError.message);
    }
    
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

    logger.info('Detailed report request received (Database-First Approach)', { 
      analysisId, 
      userId: req.user?.id,
      hasUser: !!req.user 
    });

    const { language = 'en' } = req.query;
    
    let detailedReport = null;
    const startTime = Date.now();

    // Option C: Database-First Approach
    // Step 1: Try database first (most reliable source of truth)
    if (req.user && req.user.id) {
      logger.info('Attempting database retrieval', { analysisId, userId: req.user.id });
      
      try {
        // Use the Analysis model's proper findById method
        detailedReport = await Analysis.findById(analysisId, req.user.id);
        
        if (detailedReport) {
          const retrievalTime = Date.now() - startTime;
          
          // NEW DUAL REPORT LOGIC: Check access and return appropriate report
          const userHasAccess = detailedReport.hasDetailedAccess || 
                               (process.env.NODE_ENV === 'development' || process.env.APP_ENV === 'development');
          
          let finalReport;
          if (userHasAccess && detailedReport.detailedReport && Object.keys(detailedReport.detailedReport).length > 0) {
            // User has access, return detailed report
            finalReport = detailedReport.detailedReport;
            finalReport.reportType = 'detailed';
            logger.info('Returning detailed report to authorized user', {
              analysisId,
              userId: req.user.id,
              hasDetailedAccess: detailedReport.hasDetailedAccess,
              detailedReportPaid: detailedReport.detailedReportPaid
            });
          } else {
            // User doesn't have access, return free report
            finalReport = detailedReport.freeReport && Object.keys(detailedReport.freeReport).length > 0 
              ? detailedReport.freeReport 
              : detailedReport; // Fallback to legacy format
            finalReport.reportType = 'free';
            logger.info('Returning free report - user lacks detailed access', {
              analysisId,
              userId: req.user.id,
              hasDetailedAccess: detailedReport.hasDetailedAccess,
              detailedReportPaid: detailedReport.detailedReportPaid
            });
          }
          
          // Ensure screenshot and other shared data is included
          finalReport.screenshot = detailedReport.screenshot;
          finalReport.analysisId = detailedReport.analysisId;
          finalReport.url = detailedReport.url;
          finalReport.timestamp = detailedReport.timestamp;
          finalReport.language = detailedReport.language;
          
          // Set the final report for return
          detailedReport = finalReport;
          
          logger.info('Database retrieval successful', {
            analysisId,
            userId: req.user.id,
            retrievalTime,
            returnedReportType: detailedReport.reportType,
            hasScreenshots: !!(detailedReport.screenshot?.desktop || detailedReport.screenshot?.mobile),
            hasSeo: !!detailedReport.seo,
            hasAiInsights: !!detailedReport.aiInsights,
            hasViolations: !!(detailedReport.violations && detailedReport.violations.length > 0),
            overallScore: detailedReport.overallScore || detailedReport.summary?.overallScore
          });
        }
      } catch (dbError) {
        logger.error('Database retrieval failed, trying cache fallback', { 
          analysisId, 
          userId: req.user.id,
          error: dbError.message,
          stack: dbError.stack
        });
      }
    }

    // Step 2: Fallback to cache if database fails or user not authenticated
    if (!detailedReport) {
      logger.info('Attempting cache retrieval as fallback', { analysisId });
      
      try {
        detailedReport = accessibilityAnalyzer.getDetailedReport(analysisId);
        
        if (detailedReport) {
          logger.info('Cache retrieval successful', { 
            analysisId,
            source: 'cache'
          });
        }
      } catch (cacheError) {
        logger.error('Cache retrieval also failed', { 
          analysisId,
          error: cacheError.message
        });
      }
    }
    
    // Step 3: Return 404 if neither database nor cache has the report
    if (!detailedReport) {
      logger.warn('Report not found in database or cache', { 
        analysisId, 
        userId: req.user?.id,
        totalRetrievalTime: Date.now() - startTime
      });
      
      return res.status(404).json({
        error: 'Report not found',
        message: 'The requested analysis report was not found or has expired. Please run a new analysis.',
        code: 'REPORT_NOT_FOUND'
      });
    }

    // Step 4: Validate and ensure report has all necessary data
    const validation = validateDetailedReportData(detailedReport);

    logger.info('Report data validation', {
      analysisId,
      validation: validation,
      totalRetrievalTime: Date.now() - startTime
    });

    // Log warnings if any enhanced features are missing
    if (validation.warnings.length > 0) {
      logger.warn('Detailed report has missing enhanced features', {
        analysisId,
        warnings: validation.warnings,
        dataPresence: validation.dataPresence
      });
    }

    // Return the detailed report
    res.json({
      success: true,
      data: detailedReport,
      meta: {
        timestamp: new Date().toISOString(),
        reportType: 'detailed',
        source: detailedReport.source || 'database',
        retrievalTime: Date.now() - startTime,
        dataValidation: validation.dataPresence,
        warnings: validation.warnings
      }
    });
    
    logger.info('Detailed report sent successfully', { 
      analysisId,
      totalProcessingTime: Date.now() - startTime
    });

  } catch (error) {
    logger.error('Detailed report retrieval failed with unexpected error', { 
      error: error.message, 
      stack: error.stack,
      analysisId: req.params.analysisId,
      userId: req.user?.id
    });
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Unable to retrieve detailed report. Please try again later.',
      code: 'INTERNAL_ERROR'
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