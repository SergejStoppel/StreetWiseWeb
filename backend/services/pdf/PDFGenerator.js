/**
 * PDFGenerator - Main PDF report orchestration and generation
 * 
 * This is the main entry point for PDF generation that orchestrates all the modular
 * components to create comprehensive accessibility reports. It handles document flow,
 * page management, and coordinates between different sections while maintaining
 * consistent styling and professional presentation.
 */

const logger = require('../../utils/logger');

// Import all PDF components
const HeaderComponent = require('./HeaderComponent');
const ExecutiveSummaryComponent = require('./ExecutiveSummaryComponent');
const ScoreVisualizationComponent = require('./ScoreVisualizationComponent');
const ViolationsComponent = require('./ViolationsComponent');
const ColorContrastComponent = require('./ColorContrastComponent');
const RecommendationsComponent = require('./RecommendationsComponent');
const AppendixComponent = require('./AppendixComponent');

class PDFGenerator extends HeaderComponent {
  constructor() {
    super();
    
    // Initialize all component instances
    this.executiveSummary = new ExecutiveSummaryComponent();
    this.scoreVisualization = new ScoreVisualizationComponent();
    this.violations = new ViolationsComponent();
    this.colorContrast = new ColorContrastComponent();
    this.recommendations = new RecommendationsComponent();
    this.appendix = new AppendixComponent();
  }

  /**
   * Generate a complete accessibility report PDF
   */
  async generateAccessibilityReport(reportData, language = 'en') {
    try {
      logger.info('Starting modular PDF generation', { analysisId: reportData.analysisId, language });
      console.log('DEBUG: PDFGenerator received language:', language);
      
      // Test translation system
      const testTranslation = this.t('reports:pdf.documentTitle', language);
      console.log('DEBUG: Test translation for documentTitle:', testTranslation);
      console.log('DEBUG: Expected German:', 'Website-Barrierefreiheits-Analysebericht');

      // Set reportData and language for all components
      this.reportData = reportData;
      this.language = language;
      this.executiveSummary.reportData = reportData;
      this.executiveSummary.language = language;
      this.scoreVisualization.reportData = reportData;
      this.scoreVisualization.language = language;
      this.violations.reportData = reportData;
      this.violations.language = language;
      this.colorContrast.reportData = reportData;
      this.colorContrast.language = language;
      this.recommendations.reportData = reportData;
      this.recommendations.language = language;
      this.appendix.reportData = reportData;
      this.appendix.language = language;

      // Create new document
      const doc = this.createDocument(reportData, language);

      // Generate all sections
      this.generateDocumentSections(doc, reportData, language);

      // Return PDF buffer
      return this.generateBuffer(doc);

    } catch (error) {
      logger.error('PDF generation failed:', { 
        error: error.message, 
        analysisId: reportData ? reportData.analysisId : 'unknown',
        language
      });
      throw new Error(`Failed to generate PDF report: ${error.message}`);
    }
  }

  /**
   * Generate all document sections in proper order
   */
  generateDocumentSections(doc, reportData, language = 'en') {
    // 1. Document Header and Branding
    this.addDocumentHeader(doc, reportData, language);
    
    // 2. Executive Summary
    this.executiveSummary.reportData = reportData;
    this.executiveSummary.language = language;
    this.executiveSummary.addExecutiveSummary(doc, reportData, language);
    
    // 3. Score Visualization and Metrics
    this.scoreVisualization.reportData = reportData;
    this.scoreVisualization.language = language;
    this.scoreVisualization.addScoreOverview(doc, reportData, language);
    
    // 4. Priority Violations Analysis
    this.violations.reportData = reportData;
    this.violations.language = language;
    this.violations.addTopViolations(doc, reportData, language);
    
    // 4.5. Color Contrast Analysis (if violations exist)
    if (reportData.colorContrastAnalysis && reportData.colorContrastAnalysis.totalViolations > 0) {
      this.colorContrast.reportData = reportData;
      this.colorContrast.language = language;
      this.colorContrast.addColorContrastAnalysis(doc, reportData, language);
    }
    
    // 5. Strategic Recommendations (starts new page)
    this.recommendations.reportData = reportData;
    this.recommendations.language = language;
    this.recommendations.addRecommendations(doc, reportData, language);
    
    // 6. Detailed Findings (if detailed report)
    if (reportData.reportType === 'detailed') {
      this.addDetailedFindings(doc, reportData, language);
    }
    
    // 7. Technical Appendix (starts new page)
    this.appendix.reportData = reportData;
    this.appendix.language = language;
    this.appendix.addAppendix(doc, reportData, language);
  }

  /**
   * Add detailed findings section for comprehensive reports
   */
  addDetailedFindings(doc, reportData, language = 'en') {
    this.addPage(doc);
    this.addSectionHeader(doc, this.t('reports:pdf.detailedTechnicalAnalysis', language));
    
    // Detailed violations analysis
    this.violations.addDetailedViolations(doc, reportData, language);
    
    // Custom checks results
    if (reportData.customChecks) {
      this.addCustomChecksDetails(doc, reportData.customChecks, language);
    }
    
    // Performance metrics
    if (reportData.performanceMetrics) {
      this.addPerformanceMetrics(doc, reportData.performanceMetrics, language);
    }
  }

  /**
   * Add custom accessibility checks details
   */
  addCustomChecksDetails(doc, customChecks, language = 'en') {
    this.checkPageBreak(doc, 100);
    
    doc.fontSize(14)
       .fillColor(this.textColor)
       .text(this.t('reports:pdf.customChecks.title', language), this.margins.left, doc.y);
    
    doc.y += 25;
    
    // Images analysis
    if (customChecks.images && customChecks.images.length > 0) {
      this.addImageAnalysis(doc, customChecks.images, language);
    }
    
    // Forms analysis
    if (customChecks.forms && customChecks.forms.length > 0) {
      this.addFormAnalysis(doc, customChecks.forms, language);
    }
    
    // Heading structure analysis
    if (customChecks.headings && customChecks.headings.length > 0) {
      this.addHeadingAnalysis(doc, customChecks.headings, language);
    }
    
    // Links analysis
    if (customChecks.links && customChecks.links.length > 0) {
      this.addLinksAnalysis(doc, customChecks.links, language);
    }
  }

  /**
   * Add image accessibility analysis
   */
  addImageAnalysis(doc, images, language = 'en') {
    this.checkPageBreak(doc, 80);
    
    doc.fontSize(12)
       .fillColor(this.textColor)
       .text(this.t('reports:pdf.customChecks.imageAnalysis', language), this.margins.left, doc.y);
    
    doc.y += 20;
    
    const imagesWithoutAlt = images.filter(img => !img.hasAlt && !img.isDecorative);
    const decorativeImages = images.filter(img => img.isDecorative);
    
    this.addContentBox(doc, this.margins.left, doc.y, this.contentWidth, 60, 'white', this.borderColor);
    
    doc.fontSize(10)
       .fillColor(this.textColor)
       .text(`${this.t('reports:pdf.customChecks.totalImages', language)}: ${this.formatNumber(images.length, language)}`, this.margins.left + 20, doc.y + 15)
       .text(`${this.t('reports:pdf.customChecks.imagesWithoutAlt', language)}: ${this.formatNumber(imagesWithoutAlt.length, language)}`, this.margins.left + 20, doc.y + 30)
       .text(`${this.t('reports:pdf.customChecks.decorativeImages', language)}: ${this.formatNumber(decorativeImages.length, language)}`, this.margins.left + 20, doc.y + 45);
    
    doc.y += 80;
  }

  /**
   * Add form accessibility analysis
   */
  addFormAnalysis(doc, forms, language = 'en') {
    this.checkPageBreak(doc, 80);
    
    doc.fontSize(12)
       .fillColor(this.textColor)
       .text(this.t('reports:pdf.customChecks.formAnalysis', language), this.margins.left, doc.y);
    
    doc.y += 20;
    
    const totalInputs = forms.reduce((sum, form) => sum + form.inputs.length, 0);
    const unlabeledInputs = forms.reduce((sum, form) => 
      sum + form.inputs.filter(input => !input.hasLabel && !input.hasAriaLabel).length, 0);
    
    this.addContentBox(doc, this.margins.left, doc.y, this.contentWidth, 60, 'white', this.borderColor);
    
    doc.fontSize(10)
       .fillColor(this.textColor)
       .text(`${this.t('reports:pdf.customChecks.totalForms', language)}: ${this.formatNumber(forms.length, language)}`, this.margins.left + 20, doc.y + 15)
       .text(`${this.t('reports:pdf.customChecks.totalInputs', language)}: ${this.formatNumber(totalInputs, language)}`, this.margins.left + 20, doc.y + 30)
       .text(`${this.t('reports:pdf.customChecks.unlabeledInputs', language)}: ${this.formatNumber(unlabeledInputs, language)}`, this.margins.left + 20, doc.y + 45);
    
    doc.y += 80;
  }

  /**
   * Add heading structure analysis
   */
  addHeadingAnalysis(doc, headings, language = 'en') {
    this.checkPageBreak(doc, 80);
    
    doc.fontSize(12)
       .fillColor(this.textColor)
       .text(this.t('reports:pdf.customChecks.headingAnalysis', language), this.margins.left, doc.y);
    
    doc.y += 20;
    
    const h1Count = headings.filter(h => h.level === 1).length;
    const emptyHeadings = headings.filter(h => h.isEmpty).length;
    
    this.addContentBox(doc, this.margins.left, doc.y, this.contentWidth, 60, 'white', this.borderColor);
    
    doc.fontSize(10)
       .fillColor(this.textColor)
       .text(`${this.t('reports:pdf.customChecks.totalHeadings', language)}: ${this.formatNumber(headings.length, language)}`, this.margins.left + 20, doc.y + 15)
       .text(`${this.t('reports:pdf.customChecks.h1Headings', language)}: ${this.formatNumber(h1Count, language)}`, this.margins.left + 20, doc.y + 30)
       .text(`${this.t('reports:pdf.customChecks.emptyHeadings', language)}: ${this.formatNumber(emptyHeadings, language)}`, this.margins.left + 20, doc.y + 45);
    
    doc.y += 80;
  }

  /**
   * Add links accessibility analysis
   */
  addLinksAnalysis(doc, links, language = 'en') {
    this.checkPageBreak(doc, 80);
    
    doc.fontSize(12)
       .fillColor(this.textColor)
       .text(this.t('reports:pdf.customChecks.linksAnalysis', language), this.margins.left, doc.y);
    
    doc.y += 20;
    
    const emptyLinks = links.filter(link => link.isEmpty);
    const newWindowLinks = links.filter(link => link.opensNewWindow);
    
    this.addContentBox(doc, this.margins.left, doc.y, this.contentWidth, 60, 'white', this.borderColor);
    
    doc.fontSize(10)
       .fillColor(this.textColor)
       .text(`${this.t('reports:pdf.customChecks.totalLinks', language)}: ${this.formatNumber(links.length, language)}`, this.margins.left + 20, doc.y + 15)
       .text(`${this.t('reports:pdf.customChecks.emptyLinks', language)}: ${this.formatNumber(emptyLinks.length, language)}`, this.margins.left + 20, doc.y + 30)
       .text(`${this.t('reports:pdf.customChecks.newWindowLinks', language)}: ${this.formatNumber(newWindowLinks.length, language)}`, this.margins.left + 20, doc.y + 45);
    
    doc.y += 80;
  }

  /**
   * Add performance metrics section
   */
  addPerformanceMetrics(doc, performanceMetrics, language = 'en') {
    this.checkPageBreak(doc, 100);
    
    doc.fontSize(14)
       .fillColor(this.textColor)
       .text(this.t('reports:pdf.performanceMetrics.title', language), this.margins.left, doc.y);
    
    doc.y += 25;
    
    const metrics = [
      { label: this.t('reports:pdf.performanceMetrics.pageLoadTime', language), value: `${Math.round(performanceMetrics.loadTime || 0)}ms` },
      { label: this.t('reports:pdf.performanceMetrics.domContentLoaded', language), value: `${Math.round(performanceMetrics.domContentLoaded || 0)}ms` },
      { label: this.t('reports:pdf.performanceMetrics.firstContentfulPaint', language), value: `${Math.round(performanceMetrics.firstContentfulPaint || 0)}ms` },
      { label: this.t('reports:pdf.performanceMetrics.totalElements', language), value: this.formatNumber(performanceMetrics.totalElements || 0, language) },
      { label: this.t('reports:pdf.performanceMetrics.imageCount', language), value: this.formatNumber(performanceMetrics.imageCount || 0, language) },
      { label: this.t('reports:pdf.performanceMetrics.scriptCount', language), value: this.formatNumber(performanceMetrics.scriptCount || 0, language) }
    ];
    
    let xPos = this.margins.left;
    const metricWidth = 85;
    
    metrics.forEach((metric, index) => {
      if (index > 0 && index % 3 === 0) {
        xPos = this.margins.left;
        doc.y += 60;
      }
      
      this.addMetricCard(doc, xPos, doc.y, metricWidth, 50, metric);
      xPos += metricWidth + 10;
    });
    
    doc.y += 70;
  }

  /**
   * Add individual metric card
   */
  addMetricCard(doc, x, y, width, height, metric) {
    this.addContentBox(doc, x, y, width, height, 'white', this.borderColor);
    
    doc.fontSize(12)
       .fillColor(this.primaryColor)
       .text(`${metric.value}`, x + 5, y + 15, { width: width - 10, align: 'center' });
    
    doc.fontSize(8)
       .fillColor(this.grayColor)
       .text(metric.label, x + 5, y + 35, { width: width - 10, align: 'center' });
  }

  /**
   * Generate final summary page (optional)
   */
  addSummaryPage(doc, reportData) {
    this.addPage(doc);
    this.addSectionHeader(doc, 'Report Summary');
    
    // Key takeaways
    doc.fontSize(12)
       .fillColor(this.textColor)
       .text('Key Takeaways:', this.margins.left, doc.y);
    
    doc.y += 20;
    
    const takeaways = [
      `Overall accessibility score: ${reportData.scores.overall}/100`,
      `${reportData.summary.criticalViolations} critical issues require immediate attention`,
      `${reportData.recommendations.filter(r => r.priority === 'high').length} high-priority recommendations`,
      'Detailed implementation guidance provided for development team'
    ];
    
    takeaways.forEach(takeaway => {
      doc.fontSize(10)
         .fillColor(this.grayColor)
         .text(`• ${takeaway}`, this.margins.left + 20, doc.y);
      doc.y += 15;
    });
    
    doc.y += 30;
    
    // Next steps call-to-action
    this.addContentBox(doc, this.margins.left, doc.y, this.contentWidth, 60, this.backgroundColor, this.primaryColor);
    
    doc.fontSize(12)
       .fillColor(this.textColor)
       .text('Ready to improve your accessibility?', this.margins.left + 20, doc.y + 15)
       .fontSize(10)
       .fillColor(this.grayColor)
       .text('Contact our team for implementation support and ongoing accessibility consulting.', 
             this.margins.left + 20, doc.y + 35);
  }
}

module.exports = new PDFGenerator();