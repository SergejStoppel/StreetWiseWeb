/**
 * Legacy PDF Generator - Redirects to new modular system
 * 
 * This file maintains backward compatibility while redirecting all PDF generation
 * to the new modular system located in the /pdf directory. The new system provides
 * better maintainability, modularity, and easier enhancement capabilities.
 */

const PDFGenerator = require('./pdf/PDFGenerator');
const logger = require('../utils/logger');

class LegacyPDFGeneratorWrapper {
  constructor() {
    // Redirect to new modular PDF generator
    this.pdfGenerator = PDFGenerator;
    logger.info('Using new modular PDF generator system');
  }

  /**
   * Generate accessibility report - delegates to new modular system
   */
  async generateAccessibilityReport(reportData, language = 'en') {
    logger.info('Delegating PDF generation to modular system', { 
      analysisId: reportData.analysisId,
      language
    });
    
    return await this.pdfGenerator.generateAccessibilityReport(reportData, language);
  }
}

// Export instance for backward compatibility
module.exports = new LegacyPDFGeneratorWrapper();