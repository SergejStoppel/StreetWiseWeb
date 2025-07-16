const express = require('express');
const router = express.Router();
const SeoAnalyzer = require('../services/analysis/SeoAnalyzer');
const AiAnalysisService = require('../services/analysis/AiAnalysisService');
const screenshotService = require('../services/ScreenshotService');
const logger = require('../utils/logger');

// Test endpoint for Phase 1 services
router.get('/test', async (req, res) => {
  try {
    const testUrl = req.query.url || 'https://example.com';
    
    logger.info('Testing Phase 1 services', { url: testUrl });
    
    // Test each service
    const results = {
      services: {
        seoAnalyzer: false,
        aiAnalysisService: false,
        screenshotService: false
      },
      errors: []
    };
    
    // Test SEO Analyzer
    try {
      const seoAnalyzer = new SeoAnalyzer();
      results.services.seoAnalyzer = true;
      results.seoInfo = seoAnalyzer.getInfo();
    } catch (err) {
      results.errors.push(`SEO Analyzer: ${err.message}`);
    }
    
    // Test AI Analysis Service
    try {
      const aiService = new AiAnalysisService();
      results.services.aiAnalysisService = true;
      results.aiInfo = aiService.getInfo();
    } catch (err) {
      results.errors.push(`AI Analysis Service: ${err.message}`);
    }
    
    // Test Screenshot Service
    try {
      results.services.screenshotService = true;
      results.screenshotStatus = screenshotService.getStatus();
    } catch (err) {
      results.errors.push(`Screenshot Service: ${err.message}`);
    }
    
    // Run quick test if all services loaded
    if (Object.values(results.services).every(v => v === true)) {
      try {
        const puppeteer = require('puppeteer');
        const browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.goto(testUrl, { waitUntil: 'networkidle2', timeout: 10000 });
        
        // Quick SEO test
        const seoAnalyzer = new SeoAnalyzer();
        const seoResult = await seoAnalyzer.analyzeMetaTags(page);
        results.seoSample = {
          hasTitle: seoResult.title.score > 0,
          hasDescription: seoResult.description.score > 0,
          issueCount: seoResult.issues.length
        };
        
        // Quick AI test
        const aiService = new AiAnalysisService();
        const websiteContext = await aiService.detectWebsiteContext(page, testUrl);
        results.aiSample = {
          type: websiteContext.type,
          industry: websiteContext.industry
        };
        
        await page.close();
        await browser.close();
        
        results.testStatus = 'All services operational';
      } catch (err) {
        results.testStatus = `Test failed: ${err.message}`;
      }
    }
    
    res.json({
      success: true,
      phase1Status: 'Integrated',
      results
    });
    
  } catch (error) {
    logger.error('Phase 1 test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;