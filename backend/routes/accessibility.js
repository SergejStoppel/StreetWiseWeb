const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const accessibilityAnalyzer = require('../services/accessibilityAnalyzer');
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
    .isURL({ require_protocol: true, protocols: ['http', 'https'] })
    .withMessage('Please provide a valid HTTP or HTTPS URL')
    .isLength({ max: 2000 })
    .withMessage('URL is too long')
    .customSanitizer(value => {
      // Remove any trailing slashes and normalize
      return value.trim().replace(/\/+$/, '');
    })
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

    const { url } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;
    
    logger.info(`Analysis request received`, { 
      url, 
      clientIp,
      userAgent: req.get('User-Agent') 
    });

    // Start analysis
    const startTime = Date.now();
    
    try {
      const report = await accessibilityAnalyzer.analyzeWebsite(url);
      const analysisTime = Date.now() - startTime;
      
      logger.info(`Analysis completed successfully`, {
        url,
        analysisId: report.analysisId,
        score: report.scores.overall,
        analysisTime,
        violations: report.summary.totalViolations
      });

      res.json({
        success: true,
        data: report,
        meta: {
          analysisTime,
          timestamp: new Date().toISOString()
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

// GET /api/accessibility/demo
router.get('/demo', (req, res) => {
  res.json({
    message: 'SiteCraft Accessibility Analyzer API',
    version: '1.0.0',
    endpoints: {
      analyze: 'POST /api/accessibility/analyze',
      health: 'GET /api/accessibility/health'
    },
    documentation: 'https://sitecraft.com/api-docs'
  });
});

module.exports = router;