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

  async analyzeWebsite(url, reportType = 'overview', language = 'en') {
    const analysisId = uuidv4();
    logger.info(`Starting accessibility analysis for ${url}`, { analysisId, reportType });

    try {
      // Validate inputs using new ValidationUtils
      const validUrl = this.validationUtils.validateUrl(url);
      const validReportType = this.validationUtils.validateReportType(reportType);
      const validLanguage = this.validationUtils.validateLanguage(language);
      
      // Create cache key based on URL (for now, simplified)
      const cacheKey = Buffer.from(validUrl).toString('base64').substring(0, 32);
      
      // Check cache first
      const cachedResult = this.cacheManager.getAnalysis(cacheKey);
      if (cachedResult) {
        logger.info('Returning cached analysis result', { analysisId, cacheKey });
        // Generate overview report if requested from cached detailed report
        return validReportType === 'overview' ? 
          this.generateOverviewReport(cachedResult) : 
          cachedResult;
      }
      
      // Initialize browser and create page
      const page = await this.browserUtils.createPage();
      await this.browserUtils.setupPageInterception(page);
      
      logger.info(`Navigating to ${validUrl}`, { analysisId });
      
      try {
        await page.goto(validUrl, { 
          waitUntil: 'networkidle2',
          timeout: 45000
        });
        
        // Wait for page to stabilize
        await this.waitForPageStability(page, analysisId);
        
        // Get page metadata
        const metadata = await this.browserUtils.getPageMetadata(page);
        
        // Run all analyzers in parallel for better performance
        const [
          axeResults,
          structureData,
          ariaData,
          formData,
          tableData,
          keyboardData
        ] = await Promise.all([
          this.runAxeAnalysis(page, analysisId),
          this.structureAnalyzer.analyze(page, analysisId),
          this.ariaAnalyzer.analyze(page, analysisId),
          this.formAnalyzer.analyze(page, analysisId),
          this.tableAnalyzer.analyze(page, analysisId),
          this.keyboardAnalyzer.analyze(page, analysisId)
        ]);
        
        // Run color contrast analysis
        const colorContrastAnalysis = colorContrastAnalyzer.analyzeColorContrast(
          axeResults, 
          {}, // Empty colors object for now - will be enhanced in Phase 3
          analysisId
        );
        
        // Generate comprehensive report
        const detailedReport = this.generateModularReport({
          url: validUrl,
          metadata,
          axeResults,
          structureData,
          ariaData,
          formData,
          tableData,
          keyboardData,
          colorContrastAnalysis,
          analysisId,
          language: validLanguage
        });
        
        // Cache the detailed report using both URL-based key and analysisId
        this.cacheManager.setAnalysis(cacheKey, detailedReport);
        this.cacheManager.setAnalysis(analysisId, detailedReport);
        
        // Generate overview report if requested (don't cache this, generate on-the-fly)
        const report = validReportType === 'overview' ? 
          this.generateOverviewReport(detailedReport) : 
          detailedReport;
        
        await page.close();
        
        logger.info('Analysis completed successfully', { 
          analysisId, 
          score: report.overallScore,
          issues: report.summary?.totalIssues || 0
        });
        
        return report;
        
      } catch (navigationError) {
        logger.error(`Navigation failed: ${navigationError.message}`, { analysisId });
        throw new Error(`Unable to load the website: ${navigationError.message}`);
      }
      
    } catch (error) {
      logger.error(`Analysis failed: ${error.message}`, { analysisId });
      throw error;
    }
  }

  async waitForPageStability(page, analysisId) {
    try {
      // Wait for any lazy-loaded content
      await page.evaluate(() => {
        return new Promise((resolve) => {
          if ('IntersectionObserver' in window) {
            setTimeout(resolve, 1000);
          } else {
            resolve();
          }
        });
      });
      
      // Wait for fonts to load
      await page.evaluateHandle(() => document.fonts.ready);
      
      // Wait for animations to finish
      await page.waitForFunction(() => {
        const animations = document.getAnimations();
        return animations.length === 0 || animations.every(a => a.playState !== 'running');
      }, { timeout: 5000 }).catch(() => {
        logger.info('Some animations may still be running', { analysisId });
      });
      
    } catch (error) {
      logger.warn('Page stability check failed:', { error: error.message, analysisId });
    }
  }

  async runAxeAnalysis(page, analysisId) {
    try {
      logger.info('Running axe-core analysis', { analysisId });
      
      const axe = new AxePuppeteer(page);
      const results = await axe
        .configure({
          branding: {
            brand: 'SiteCraft Accessibility Scanner'
          }
        })
        .analyze();
      
      logger.info(`Axe analysis completed: ${results.violations.length} violations found`, { analysisId });
      return results;
      
    } catch (error) {
      logger.error('Axe analysis failed:', { error: error.message, analysisId });
      return { violations: [], passes: [], incomplete: [], inapplicable: [] };
    }
  }

  generateModularReport(data) {
    const {
      url,
      metadata,
      axeResults,
      structureData,
      ariaData,
      formData,
      tableData,
      keyboardData,
      colorContrastAnalysis,
      analysisId,
      language
    } = data;

    // Calculate individual scores
    const individualScores = {
      structure: this.structureAnalyzer.calculateScore(structureData),
      aria: this.ariaAnalyzer.calculateScore(ariaData),
      forms: this.formAnalyzer.calculateScore(formData),
      tables: this.tableAnalyzer.calculateScore(tableData),
      keyboard: this.keyboardAnalyzer.calculateScore(keyboardData),
      colorContrast: this.calculateColorContrastScore(colorContrastAnalysis),
      axeScore: this.calculateAxeScore(axeResults)
    };

    // Calculate weighted overall score
    const overallScore = this.calculateOverallScore(individualScores);
    
    // Create scores object matching frontend expectations
    const scores = {
      overall: overallScore,
      structure: individualScores.structure,
      aria: individualScores.aria,
      forms: individualScores.forms,
      tables: individualScores.tables,
      keyboard: individualScores.keyboard,
      colorContrast: individualScores.colorContrast,
      axeScore: individualScores.axeScore
    };

    // Generate consolidated recommendations
    const recommendations = this.generateConsolidatedRecommendations({
      structureData,
      ariaData,
      formData,
      tableData,
      keyboardData,
      axeResults,
      language
    });

    // Flatten recommendations for frontend compatibility with safety checks
    const flatRecommendations = [];
    if (recommendations && recommendations.recommendations) {
      if (recommendations.recommendations.high) {
        flatRecommendations.push(...recommendations.recommendations.high);
      }
      if (recommendations.recommendations.medium) {
        flatRecommendations.push(...recommendations.recommendations.medium);
      }
      if (recommendations.recommendations.low) {
        flatRecommendations.push(...recommendations.recommendations.low);
      }
    }

    return {
      analysisId,
      url,
      timestamp: new Date().toISOString(),
      language,
      overallScore,
      scores,
      metadata,
      summary: this.generateSummary(axeResults, recommendations, individualScores, { 
        totalTables: tableData?.totalTables || 0 
      }),
      structure: structureData,
      aria: ariaData,
      forms: formData,
      tables: tableData,
      keyboard: keyboardData,
      colorContrast: colorContrastAnalysis,
      axeResults,
      recommendations: flatRecommendations, // Flat array for frontend compatibility
      recommendationsGrouped: recommendations, // Keep grouped version for internal use
      technicalDetails: {
        analysisVersion: '2.0.0',
        timestamp: Date.now(),
        userAgent: metadata.userAgent || 'Unknown'
      }
    };
  }

  calculateOverallScore(scores) {
    // Weighted scoring based on importance
    const weights = {
      structure: 0.20,
      aria: 0.15,
      forms: 0.15,
      tables: 0.10,
      keyboard: 0.20,
      colorContrast: 0.10,
      axeScore: 0.10
    };

    let weightedSum = 0;
    let totalWeight = 0;

    Object.keys(weights).forEach(key => {
      if (scores[key] !== undefined && scores[key] !== null) {
        weightedSum += scores[key] * weights[key];
        totalWeight += weights[key];
      }
    });

    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  }

  calculateAxeScore(axeResults) {
    if (!axeResults || !axeResults.violations) return 100;
    
    const violationCount = axeResults.violations.length;
    const baseScore = 100;
    const penalty = Math.min(violationCount * 5, 80); // Max 80 points penalty
    
    return Math.max(baseScore - penalty, 0);
  }

  calculateColorContrastScore(colorContrastAnalysis) {
    if (!colorContrastAnalysis) return 100;
    
    const aaViolations = colorContrastAnalysis.aaViolations || 0;
    const aaaViolations = colorContrastAnalysis.aaaViolations || 0;
    
    let score = 100;
    
    // Penalize AA violations more heavily than AAA
    score -= Math.min(aaViolations * 15, 60); // Up to 60 points for AA violations
    score -= Math.min(aaaViolations * 5, 20); // Up to 20 points for AAA violations
    
    return Math.max(score, 0);
  }

  generateConsolidatedRecommendations(data) {
    const { structureData, ariaData, formData, tableData, keyboardData, axeResults, language } = data;
    
    try {
      const allRecommendations = [];
      
      // Safely collect recommendations from each analyzer
      try {
        const structureRecs = this.structureAnalyzer.generateRecommendations(structureData, language) || [];
        allRecommendations.push(...structureRecs);
      } catch (error) {
        logger.warn('Structure recommendations failed:', error.message);
      }
      
      try {
        const ariaRecs = this.ariaAnalyzer.generateRecommendations(ariaData, language) || [];
        allRecommendations.push(...ariaRecs);
      } catch (error) {
        logger.warn('ARIA recommendations failed:', error.message);
      }
      
      try {
        const formRecs = this.formAnalyzer.generateRecommendations(formData, language) || [];
        allRecommendations.push(...formRecs);
      } catch (error) {
        logger.warn('Form recommendations failed:', error.message);
      }
      
      try {
        const tableRecs = this.tableAnalyzer.generateRecommendations(tableData, language) || [];
        allRecommendations.push(...tableRecs);
      } catch (error) {
        logger.warn('Table recommendations failed:', error.message);
      }
      
      try {
        const keyboardRecs = this.keyboardAnalyzer.generateRecommendations(keyboardData, language) || [];
        allRecommendations.push(...keyboardRecs);
      } catch (error) {
        logger.warn('Keyboard recommendations failed:', error.message);
      }

      // Group by priority and type
      const groupedRecommendations = {
        high: allRecommendations.filter(r => r && r.priority === 'high'),
        medium: allRecommendations.filter(r => r && r.priority === 'medium'),
        low: allRecommendations.filter(r => r && r.priority === 'low')
      };

      return {
        total: allRecommendations.length,
        byPriority: {
          high: groupedRecommendations.high.length,
          medium: groupedRecommendations.medium.length,
          low: groupedRecommendations.low.length
        },
        recommendations: groupedRecommendations
      };
    } catch (error) {
      logger.error('Failed to generate consolidated recommendations:', error.message);
      // Return empty structure if all fails
      return {
        total: 0,
        byPriority: { high: 0, medium: 0, low: 0 },
        recommendations: { high: [], medium: [], low: [] }
      };
    }
  }

  generateSummary(axeResults, recommendations, individualScores, additionalData = {}) {
    const totalIssues = (axeResults.violations?.length || 0) + recommendations.total;
    
    // Extract specific violation counts from axe results
    const axeViolations = axeResults.violations || [];
    const imagesWithoutAlt = axeViolations.filter(v => v.id === 'image-alt').length;
    const formsWithoutLabels = axeViolations.filter(v => 
      v.id === 'label' || v.id === 'form-field-multiple-labels'
    ).length;
    const emptyLinks = axeViolations.filter(v => v.id === 'link-name').length;
    const colorContrastViolations = axeViolations.filter(v => 
      v.id === 'color-contrast' || v.id === 'color-contrast-enhanced'
    ).length;
    
    // Count violations by severity
    const criticalViolations = axeViolations.filter(v => v.impact === 'critical').length;
    const seriousViolations = axeViolations.filter(v => v.impact === 'serious').length;
    
    return {
      // Legacy fields that frontend expects
      totalViolations: axeViolations.length,
      totalIssues,
      criticalIssues: recommendations.byPriority.high,
      warningIssues: recommendations.byPriority.medium,
      minorIssues: recommendations.byPriority.low,
      criticalViolations,
      seriousViolations,
      
      // Specific violation types
      imagesWithoutAlt,
      formsWithoutLabels,
      emptyLinks,
      colorContrastViolations,
      
      // Individual analyzer scores
      structureScore: individualScores.structure,
      ariaScore: individualScores.aria,
      formScore: individualScores.forms,
      tableScore: individualScores.tables,
      keyboardScore: individualScores.keyboard,
      
      // Additional data
      axeViolations: axeResults.violations?.length || 0,
      overallGrade: this.getGradeFromScore(individualScores),
      passedChecks: axeResults.passes?.length || 0,
      hasExcellentAccessibility: this.calculateOverallScore(individualScores) >= 95,
      
      // Table-specific data (for conditional rendering)
      totalTables: additionalData.totalTables || 0
    };
  }

  getGradeFromScore(individualScores) {
    const overall = this.calculateOverallScore(individualScores);
    if (overall >= 95) return 'A+';
    if (overall >= 90) return 'A';
    if (overall >= 85) return 'B+';
    if (overall >= 80) return 'B';
    if (overall >= 75) return 'C+';
    if (overall >= 70) return 'C';
    if (overall >= 65) return 'D+';
    if (overall >= 60) return 'D';
    return 'F';
  }

  generateOverviewReport(detailedReport) {
    // Flatten recommendations for frontend compatibility with safety checks
    const flatRecommendations = [];
    if (detailedReport.recommendationsGrouped && detailedReport.recommendationsGrouped.recommendations) {
      const recs = detailedReport.recommendationsGrouped.recommendations;
      if (recs.high) flatRecommendations.push(...recs.high);
      if (recs.medium) flatRecommendations.push(...recs.medium);
      if (recs.low) flatRecommendations.push(...recs.low);
    } else if (Array.isArray(detailedReport.recommendations)) {
      // If recommendations is already a flat array, use it directly
      flatRecommendations.push(...detailedReport.recommendations);
    }

    // Extract key information for overview
    return {
      analysisId: detailedReport.analysisId,
      url: detailedReport.url,
      timestamp: detailedReport.timestamp,
      language: detailedReport.language,
      overallScore: detailedReport.overallScore,
      scores: detailedReport.scores,
      summary: detailedReport.summary,
      recommendations: flatRecommendations, // Flat array for frontend compatibility
      recommendationsSummary: {
        total: detailedReport.recommendations.total,
        byPriority: detailedReport.recommendations.byPriority
      },
      upgradeInfo: {
        available: true,
        features: [
          'Complete accessibility violation breakdown',
          'Detailed structure analysis',
          'ARIA landmarks and roles analysis', 
          'Form accessibility analysis',
          'Table accessibility analysis',
          'Keyboard navigation analysis',
          'PDF report generation',
          'Advanced color contrast analysis'
        ]
      },
      technicalDetails: detailedReport.technicalDetails
    };
  }

  // Legacy method support for detailed report retrieval
  getDetailedReport(analysisId) {
    try {
      logger.info('Retrieving detailed report from cache', { analysisId });
      
      // Get cached analysis
      const cachedReport = this.cacheManager.getAnalysis(analysisId);
      if (!cachedReport) {
        logger.warn('Detailed report not found in cache', { analysisId });
        return null;
      }
      
      // If the cached report is an overview, we need to construct the detailed version
      if (!cachedReport.structure || !cachedReport.aria) {
        logger.warn('Cached report appears to be overview only', { analysisId });
        return null;
      }
      
      return cachedReport;
    } catch (error) {
      logger.error('Failed to retrieve detailed report:', { error: error.message, analysisId });
      return null;
    }
  }

  // Legacy method support for PDF generation
  async generatePDF(analysisData, language = 'en') {
    try {
      const analysisId = analysisData.analysisId || uuidv4();
      
      // Check PDF cache first
      const cachedPDF = this.cacheManager.getPDF(analysisId, language);
      if (cachedPDF) {
        logger.info('Returning cached PDF', { analysisId, language });
        return cachedPDF;
      }
      
      // Generate new PDF
      const pdfBuffer = await pdfGenerator.generateAccessibilityReport(analysisData, language);
      
      // Cache the PDF
      this.cacheManager.setPDF(analysisId, pdfBuffer, language);
      
      return pdfBuffer;
    } catch (error) {
      logger.error('PDF generation failed:', error);
      throw error;
    }
  }

  // Cleanup method
  async cleanup() {
    if (this.browserUtils) {
      await this.browserUtils.closeBrowser();
    }
  }
}

module.exports = AccessibilityAnalyzer;