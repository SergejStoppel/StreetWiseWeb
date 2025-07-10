/**
 * ExecutiveSummaryComponent - Executive summary and key findings presentation
 * 
 * This module creates the executive summary section of the accessibility report,
 * including key findings boxes, overall scores, metrics highlights, and professional
 * summary text that conveys the business value and importance of the analysis.
 */

const BasePDFDocument = require('./BasePDFDocument');

class ExecutiveSummaryComponent extends BasePDFDocument {
  /**
   * Add the complete executive summary section
   */
  addExecutiveSummary(doc, reportData, language = 'en') {
    this.language = language;
    this.addSectionHeader(doc, this.t('reports:pdf.executiveSummary', language));
    
    // Key findings box with score and metrics
    this.addKeyFindingsBox(doc, reportData);
    
    // Professional summary text
    this.addSummaryText(doc, reportData);
    
    return doc.y;
  }

  /**
   * Add the key findings box with score and important metrics
   */
  addKeyFindingsBox(doc, reportData) {
    const boxY = doc.y;
    const boxHeight = 120;
    
    // Main findings container
    this.addContentBox(doc, this.margins.left, boxY, this.contentWidth, boxHeight, 'white', this.borderColor);
    
    // Score highlight section
    this.addScoreHighlight(doc, reportData, boxY);
    
    // Key metrics section
    this.addKeyMetrics(doc, reportData, boxY);
    
    doc.y = boxY + boxHeight + 20;
  }

  /**
   * Add the prominent score display
   */
  addScoreHighlight(doc, reportData, boxY) {
    const scoreColor = this.getScoreColor(reportData.scores.overall);
    
    doc.fontSize(14)
       .fillColor(this.textColor)
       .text(this.t('reports:pdf.overallScore', this.language), this.margins.left + 20, boxY + 20)
       .fontSize(36)
       .fillColor(scoreColor)
       .text(`${this.formatNumber(reportData.scores.overall, this.language)}`, this.margins.left + 20, boxY + 40)
       .fontSize(14)
       .fillColor(this.grayColor)
       .text('/100', this.margins.left + 90, boxY + 55);
  }

  /**
   * Add key metrics summary
   */
  addKeyMetrics(doc, reportData, boxY) {
    const metricsX = 280;
    
    doc.fontSize(12)
       .fillColor(this.textColor)
       .text(this.t('reports:pdf.keyFindings', this.language), metricsX, boxY + 20)
       .fontSize(10)
       .fillColor(this.grayColor)
       .text(`• ${this.t('reports:pdf.executiveSummaryContent.totalViolationsFound', this.language, { count: this.formatNumber(reportData.summary.totalViolations, this.language) })}`, metricsX, boxY + 40)
       .text(`• ${this.t('reports:pdf.executiveSummaryContent.criticalIssuesFound', this.language, { count: this.formatNumber(reportData.summary.criticalViolations, this.language) })}`, metricsX, boxY + 55)
       .text(`• ${this.t('reports:pdf.executiveSummaryContent.seriousIssuesFound', this.language, { count: this.formatNumber(reportData.summary.seriousViolations, this.language) })}`, metricsX, boxY + 70)
       .text(`• ${this.t('reports:pdf.executiveSummaryContent.wcagCompliance', this.language, { percentage: this.formatNumber(reportData.scores.overall, this.language) })}`, metricsX, boxY + 85);
  }

  /**
   * Add professional summary text with business context
   */
  addSummaryText(doc, reportData) {
    const summary = this.generateProfessionalSummary(reportData);
    
    doc.fontSize(11)
       .fillColor(this.textColor)
       .text(summary, this.margins.left, doc.y, { 
         width: this.contentWidth, 
         align: 'justify', 
         lineGap: 3 
       });
    
    doc.y += 60;
  }

  /**
   * Generate professional summary text based on analysis results
   */
  generateProfessionalSummary(reportData) {
    const score = reportData.scores.overall;
    const violations = reportData.summary.totalViolations;
    const critical = reportData.summary.criticalViolations;

    // Score-based assessment using translations
    if (score >= 75) {
      return this.t('reports:pdf.executiveSummaryContent.summaryHigh', this.language, {
        score: this.formatNumber(score, this.language),
        violations: this.formatNumber(violations, this.language),
        critical: this.formatNumber(critical, this.language)
      });
    } else if (score >= 50) {
      return this.t('reports:pdf.executiveSummaryContent.summaryMedium', this.language, {
        score: this.formatNumber(score, this.language),
        violations: this.formatNumber(violations, this.language),
        critical: this.formatNumber(critical, this.language)
      });
    } else {
      return this.t('reports:pdf.executiveSummaryContent.summaryLow', this.language, {
        score: this.formatNumber(score, this.language),
        violations: this.formatNumber(violations, this.language),
        critical: this.formatNumber(critical, this.language)
      });
    }
  }

  /**
   * Add business impact summary (optional enhanced section)
   */
  addBusinessImpactSummary(doc, reportData) {
    this.checkPageBreak(doc, 100);
    
    // Business impact box
    const impactY = doc.y;
    this.addContentBox(doc, this.margins.left, impactY, this.contentWidth, 80, '#f0f9ff', this.primaryColor);
    
    doc.fontSize(12)
       .fillColor(this.textColor)
       .text(this.t('reports:pdf.executiveSummaryContent.businessImpactTitle', this.language), this.margins.left + 15, impactY + 15)
       .fontSize(10)
       .fillColor(this.grayColor)
       .text(`• ${this.t('reports:pdf.executiveSummaryContent.businessImpactPoint1', this.language)}`, this.margins.left + 20, impactY + 35)
       .text(`• ${this.t('reports:pdf.executiveSummaryContent.businessImpactPoint2', this.language)}`, this.margins.left + 20, impactY + 50)
       .text(`• ${this.t('reports:pdf.executiveSummaryContent.businessImpactPoint3', this.language)}`, this.margins.left + 20, impactY + 65);
    
    doc.y = impactY + 100;
  }

  /**
   * Add urgency indicator based on critical issues
   */
  addUrgencyIndicator(doc, reportData) {
    if (reportData.summary.criticalViolations === 0) return;
    
    const urgencyColor = reportData.summary.criticalViolations > 5 ? this.criticalColor : this.warningColor;
    const urgencyText = reportData.summary.criticalViolations > 5 ? 
      this.t('reports:pdf.executiveSummaryContent.urgentActionRequired', this.language) : 
      this.t('reports:pdf.executiveSummaryContent.attentionNeeded', this.language);
    
    // Urgency banner
    doc.rect(this.margins.left, doc.y, this.contentWidth, 30)
       .fill(urgencyColor);
    
    doc.fontSize(14)
       .fillColor('white')
       .text(`⚠️ ${urgencyText}`, this.margins.left + 15, doc.y + 10);
    
    doc.y += 40;
  }
}

module.exports = ExecutiveSummaryComponent;