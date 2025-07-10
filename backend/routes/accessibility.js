const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const accessibilityAnalyzer = require('../services/accessibilityAnalyzer');
const pdfGenerator = require('../services/pdfGenerator');
const logger = require('../utils/logger');

const router = express.Router();

// Rate limiting for analysis endpoint
const analysisLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100 : 10, // More permissive in development
  message: {
    error: 'Too many analysis requests, please try again later.',
    retryAfter: 15 * 60 * 1000
  },
  standardHeaders: true,
  legacyHeaders: false
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
router.post('/analyze', analysisLimiter, validateAnalysisRequest, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { url, reportType = 'overview', language = 'en' } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;
    
    logger.info(`Analysis request received`, { 
      url, 
      clientIp,
      userAgent: req.get('User-Agent') 
    });

    // Start analysis
    const startTime = Date.now();
    
    try {
      const report = await accessibilityAnalyzer.analyzeWebsite(url, reportType, language);
      const analysisTime = Date.now() - startTime;
      
      logger.info(`Analysis completed successfully`, {
        url,
        analysisId: report.analysisId,
        score: report.scores.overall,
        analysisTime,
        violations: report.summary.totalViolations,
        reportType
      });

      // Debug logging to see what's being sent to frontend
      logger.info('Sending response to frontend', {
        analysisId: report.analysisId,
        imagesWithoutAlt: report.summary?.imagesWithoutAlt,
        totalViolations: report.summary?.totalViolations,
        reportType: report.reportType
      });

      res.json({
        success: true,
        data: report,
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
      let errorMessage = 'Unable to analyze the website. ';
      
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
router.get('/detailed/:analysisId', async (req, res) => {
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
    const detailedReport = accessibilityAnalyzer.getDetailedReport(analysisId);
    
    if (!detailedReport) {
      return res.status(404).json({
        error: 'Report not found',
        message: 'The requested analysis report was not found or has expired'
      });
    }

    // If language is different from default, regenerate recommendations with proper language
    if (language !== 'en') {
      detailedReport.recommendations = accessibilityAnalyzer.generateRecommendations(
        detailedReport.axeResults,
        detailedReport.customChecks,
        detailedReport.reportType,
        language,
        detailedReport.colorContrastAnalysis
      );
    }
    
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

// GET /api/accessibility/pdf/:analysisId
router.get('/pdf/:analysisId', async (req, res) => {
  try {
    const { analysisId } = req.params;
    const { language = 'en' } = req.query; // Accept language parameter
    
    if (!analysisId) {
      return res.status(400).json({
        error: 'Missing analysis ID',
        message: 'Please provide a valid analysis ID'
      });
    }

    logger.info('PDF download request received', { analysisId, language });
    console.log('DEBUG: Backend received language parameter:', language);

    // Create cache key that includes language
    const cacheKey = `${analysisId}_${language}`;
    const pdfBuffer = accessibilityAnalyzer.getCachedPDF(cacheKey);
    
    if (!pdfBuffer) {
      // Try to get the detailed report and generate PDF on demand
      const detailedReport = accessibilityAnalyzer.getDetailedReport(analysisId);
      
      if (!detailedReport) {
        return res.status(404).json({
          error: 'Report not found',
          message: 'The requested analysis report was not found or has expired'
        });
      }
      
      logger.info('Generating PDF on demand', { analysisId, language });
      // Pass language to PDF generator
      const newPdfBuffer = await pdfGenerator.generateAccessibilityReport(detailedReport, language);
      accessibilityAnalyzer.pdfCache.set(cacheKey, newPdfBuffer);
      
      const filename = `accessibility-report-${analysisId}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', newPdfBuffer.length);
      
      res.send(newPdfBuffer);
      
      logger.info('PDF generated and sent successfully', { analysisId, language, size: newPdfBuffer.length });
      return;
    }
    
    const filename = `accessibility-report-${analysisId}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
    
    logger.info('Cached PDF sent successfully', { analysisId, language, size: pdfBuffer.length });

  } catch (error) {
    logger.error('PDF download failed:', { error: error.message, analysisId: req.params.analysisId });
    res.status(500).json({
      error: 'PDF download failed',
      message: 'Unable to download PDF report. Please try again later.'
    });
  }
});

// POST /api/accessibility/generate-pdf (legacy endpoint for backward compatibility)
router.post('/generate-pdf', analysisLimiter, async (req, res) => {
  try {
    const { analysisId, reportData, language = 'en' } = req.body;
    
    if (!analysisId) {
      return res.status(400).json({
        error: 'Missing required data',
        message: 'analysisId is required'
      });
    }

    // Try to use cached PDF first (with language-specific cache key)
    const cacheKey = `${analysisId}_${language}`;
    const cachedPdf = accessibilityAnalyzer.getCachedPDF(cacheKey);
    if (cachedPdf) {
      const filename = `accessibility-report-${analysisId}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', cachedPdf.length);
      
      res.send(cachedPdf);
      
      logger.info('Cached PDF sent via legacy endpoint', { analysisId, language, size: cachedPdf.length });
      return;
    }

    // Fallback to generating PDF if reportData is provided
    if (!reportData) {
      return res.status(400).json({
        error: 'Missing required data',
        message: 'reportData is required when PDF is not cached'
      });
    }

    logger.info('PDF generation request received (legacy)', { analysisId, language });

    const pdfBuffer = await pdfGenerator.generateAccessibilityReport(reportData, language);
    
    const filename = `accessibility-report-${analysisId}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
    
    logger.info('PDF generated and sent successfully (legacy)', { analysisId, language, size: pdfBuffer.length });

  } catch (error) {
    logger.error('PDF generation failed (legacy):', { error: error.message });
    res.status(500).json({
      error: 'PDF generation failed',
      message: 'Unable to generate PDF report. Please try again later.'
    });
  }
});

// GET /api/accessibility/demo
router.get('/demo', (req, res) => {
  res.json({
    message: 'SiteCraft Accessibility Analyzer API',
    version: '1.0.0',
    endpoints: {
      analyze: 'POST /api/accessibility/analyze',
      'detailed-report': 'GET /api/accessibility/detailed/:analysisId',
      'download-pdf': 'GET /api/accessibility/pdf/:analysisId',
      'generate-pdf': 'POST /api/accessibility/generate-pdf (legacy)',
      health: 'GET /api/accessibility/health'
    },
    documentation: 'https://sitecraft.com/api-docs'
  });
});

module.exports = router;