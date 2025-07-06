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
  addExecutiveSummary(doc, reportData) {
    this.addSectionHeader(doc, 'Executive Summary');
    
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
       .text('Overall Accessibility Score:', this.margins.left + 20, boxY + 20)
       .fontSize(36)
       .fillColor(scoreColor)
       .text(`${reportData.scores.overall}`, this.margins.left + 20, boxY + 40)
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
       .text('Key Findings:', metricsX, boxY + 20)
       .fontSize(10)
       .fillColor(this.grayColor)
       .text(`• ${reportData.summary.totalViolations} total violations found`, metricsX, boxY + 40)
       .text(`• ${reportData.summary.criticalViolations} critical issues`, metricsX, boxY + 55)
       .text(`• ${reportData.summary.seriousViolations} serious issues`, metricsX, boxY + 70)
       .text(`• WCAG 2.1 AA compliance: ${reportData.scores.accessibility}%`, metricsX, boxY + 85);
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
    const serious = reportData.summary.seriousViolations;

    let summary = `This comprehensive accessibility analysis evaluated your website against WCAG 2.1 AA standards and industry best practices. `;

    // Score-based assessment
    if (score >= 90) {
      summary += 'Your website demonstrates excellent accessibility compliance with only minor optimizations needed. ';
    } else if (score >= 80) {
      summary += 'Your website shows good accessibility foundations with some important improvements required. ';
    } else if (score >= 60) {
      summary += 'Your website has moderate accessibility compliance but requires significant attention to critical issues. ';
    } else {
      summary += 'Your website has substantial accessibility barriers that pose significant challenges for users with disabilities. ';
    }

    // Violations summary
    summary += `Our analysis identified ${violations} accessibility ${violations === 1 ? 'violation' : 'violations'} across your site. `;
    
    if (critical > 0) {
      summary += `${critical} critical ${critical === 1 ? 'issue requires' : 'issues require'} immediate remediation as ${critical === 1 ? 'it directly impacts' : 'they directly impact'} user access. `;
    }
    
    if (serious > 0) {
      summary += `Additionally, ${serious} serious ${serious === 1 ? 'issue needs' : 'issues need'} prompt attention to ensure full compliance. `;
    }

    // Value proposition
    summary += 'This report provides detailed implementation guidance, code examples, and prioritized action items to help your development team efficiently address these accessibility barriers and create an inclusive user experience for all visitors.';

    return summary;
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
       .text('Business Impact & Benefits', this.margins.left + 15, impactY + 15)
       .fontSize(10)
       .fillColor(this.grayColor)
       .text('• Improved user experience for 15% of the population with disabilities', this.margins.left + 20, impactY + 35)
       .text('• Enhanced SEO performance through better semantic markup', this.margins.left + 20, impactY + 50)
       .text('• Reduced legal compliance risk and ADA lawsuit exposure', this.margins.left + 20, impactY + 65);
    
    doc.y = impactY + 100;
  }

  /**
   * Add urgency indicator based on critical issues
   */
  addUrgencyIndicator(doc, reportData) {
    if (reportData.summary.criticalViolations === 0) return;
    
    const urgencyColor = reportData.summary.criticalViolations > 5 ? this.criticalColor : this.warningColor;
    const urgencyText = reportData.summary.criticalViolations > 5 ? 'URGENT ACTION REQUIRED' : 'ATTENTION NEEDED';
    
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