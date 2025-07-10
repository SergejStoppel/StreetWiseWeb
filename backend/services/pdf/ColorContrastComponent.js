/**
 * ColorContrastComponent - Color contrast analysis presentation for PDF reports
 * 
 * This module handles the visual presentation of color contrast analysis including
 * WCAG compliance levels, violation details, and recommendations.
 */

const BasePDFDocument = require('./BasePDFDocument');

class ColorContrastComponent extends BasePDFDocument {
  /**
   * Add color contrast analysis section to PDF
   */
  addColorContrastAnalysis(doc, reportData, language = 'en') {
    this.language = language;
    
    if (!reportData.colorContrastAnalysis) {
      return doc.y;
    }

    const analysis = reportData.colorContrastAnalysis;
    
    this.checkPageBreak(doc, 120);
    this.addSectionHeader(doc, this.t('reports:pdf.colorContrast.sectionTitle', language));
    
    // Add overview summary
    this.addContrastOverview(doc, analysis);
    
    // Add compliance levels if there are violations
    if (analysis.totalViolations > 0) {
      this.addComplianceLevels(doc, analysis);
      this.addViolationDetails(doc, analysis);
    } else {
      this.addNoViolationsMessage(doc);
    }
    
    return doc.y;
  }

  /**
   * Add color contrast overview summary
   */
  addContrastOverview(doc, analysis) {
    const boxHeight = 80;
    this.addContentBox(doc, this.margins.left, doc.y, this.contentWidth, boxHeight, 'white', this.borderColor);
    
    // Summary statistics
    const stats = [
      { 
        label: this.t('reports:pdf.colorContrast.totalViolations', this.language), 
        value: analysis.totalViolations.toString(),
        color: analysis.totalViolations > 0 ? this.dangerColor : this.successColor
      },
      { 
        label: this.t('reports:pdf.colorContrast.aaViolations', this.language), 
        value: analysis.aaViolations.toString(),
        color: analysis.aaViolations > 0 ? this.dangerColor : this.successColor
      },
      { 
        label: this.t('reports:pdf.colorContrast.aaaViolations', this.language), 
        value: (analysis.aaaViolations || 0).toString(),
        color: analysis.aaaViolations > 0 ? this.warningColor : this.successColor
      }
    ];

    let xPos = this.margins.left + 20;
    const statWidth = (this.contentWidth - 60) / 3;

    stats.forEach((stat) => {
      doc.fontSize(16)
         .fillColor(stat.color)
         .text(stat.value, xPos, doc.y + 15, { width: statWidth, align: 'center' });
      
      doc.fontSize(9)
         .fillColor(this.grayColor)
         .text(stat.label, xPos, doc.y + 35, { width: statWidth, align: 'center' });
      
      xPos += statWidth;
    });

    doc.y += boxHeight + 20;
  }

  /**
   * Add WCAG compliance levels visualization
   */
  addComplianceLevels(doc, analysis) {
    this.checkPageBreak(doc, 100);
    
    doc.fontSize(12)
       .fillColor(this.textColor)
       .text(this.t('reports:pdf.colorContrast.complianceLevels', this.language), this.margins.left, doc.y);
    
    doc.y += 20;

    // AA and AAA compliance levels
    const levels = [
      {
        level: 'AA',
        compliance: analysis.summary?.aaComplianceLevel || 0,
        violations: analysis.aaViolations,
        description: this.t('reports:pdf.colorContrast.aaDescription', this.language)
      },
      {
        level: 'AAA',
        compliance: analysis.summary?.aaaComplianceLevel || 0,
        violations: analysis.aaaViolations || 0,
        description: this.t('reports:pdf.colorContrast.aaaDescription', this.language)
      }
    ];

    levels.forEach((level, index) => {
      const xPos = this.margins.left + (index * (this.contentWidth / 2));
      this.addComplianceCard(doc, xPos, doc.y, level);
    });

    doc.y += 80;
  }

  /**
   * Add individual compliance card
   */
  addComplianceCard(doc, x, y, level) {
    const cardWidth = (this.contentWidth / 2) - 10;
    const cardHeight = 70;
    
    // Determine color based on compliance level
    const color = level.compliance >= 90 ? this.successColor : 
                  level.compliance >= 70 ? this.warningColor : this.dangerColor;
    
    this.addContentBox(doc, x, y, cardWidth, cardHeight, 'white', color);
    
    // Compliance percentage
    doc.fontSize(18)
       .fillColor(color)
       .text(`${level.compliance}%`, x + 15, y + 15);
    
    // Level label
    doc.fontSize(12)
       .fillColor(this.textColor)
       .text(`WCAG ${level.level}`, x + 15, y + 40);
    
    // Violations count
    if (level.violations > 0) {
      doc.fontSize(10)
         .fillColor(this.dangerColor)
         .text(`${level.violations} ${this.t('reports:pdf.colorContrast.violationsLabel', this.language)}`, 
               x + 80, y + 20);
    } else {
      doc.fontSize(10)
         .fillColor(this.successColor)
         .text(this.t('reports:pdf.colorContrast.compliant', this.language), x + 80, y + 20);
    }
    
    // Description
    doc.fontSize(8)
       .fillColor(this.grayColor)
       .text(level.description, x + 80, y + 35, { width: cardWidth - 95 });
  }

  /**
   * Add simplified violation summary with actionable guidance
   */
  addViolationDetails(doc, analysis) {
    if (!analysis.violations || analysis.totalViolations === 0) {
      return;
    }

    this.checkPageBreak(doc, 100);
    
    doc.fontSize(12)
       .fillColor(this.textColor)
       .text(this.t('reports:pdf.colorContrast.actionRequired', this.language), this.margins.left, doc.y);
    
    doc.y += 20;

    // Simplified summary instead of repetitive examples
    this.addActionableSummary(doc, analysis);
  }

  /**
   * Add actionable summary with specific guidance
   */
  addActionableSummary(doc, analysis) {
    this.checkPageBreak(doc, 120);
    
    const boxHeight = 100;
    this.addContentBox(doc, this.margins.left, doc.y, this.contentWidth, boxHeight, '#fef9f9', this.dangerColor);
    
    // Main action required
    doc.fontSize(11)
       .fillColor(this.dangerColor)
       .text(this.t('reports:pdf.colorContrast.mainIssue', this.language), this.margins.left + 20, doc.y + 15);
    
    // Critical elements count
    const aaViolations = analysis.aaViolations;
    doc.fontSize(10)
       .fillColor(this.textColor)
       .text(this.t('reports:pdf.colorContrast.elementsToFix', this.language, { count: aaViolations }), 
             this.margins.left + 20, doc.y + 35);
    
    // Specific guidance
    doc.fontSize(9)
       .fillColor(this.textColor)
       .text(this.t('reports:pdf.colorContrast.howToFix', this.language), 
             this.margins.left + 20, doc.y + 50, { width: this.contentWidth - 40 });
    
    // Tool recommendation
    doc.fontSize(8)
       .fillColor(this.grayColor)
       .text(this.t('reports:pdf.colorContrast.toolRecommendation', this.language), 
             this.margins.left + 20, doc.y + 75, { width: this.contentWidth - 40 });
    
    doc.y += boxHeight + 20;
    
    // Add element location guidance
    this.addElementLocationGuidance(doc, analysis);
  }

  /**
   * Add guidance on where to find problematic elements
   */
  addElementLocationGuidance(doc, analysis) {
    this.checkPageBreak(doc, 80);
    
    doc.fontSize(11)
       .fillColor(this.textColor)
       .text(this.t('reports:pdf.colorContrast.whereToLook', this.language), this.margins.left, doc.y);
    
    doc.y += 20;
    
    // Common areas where contrast issues occur
    const commonAreas = [
      this.t('reports:pdf.colorContrast.commonAreas.navigation', this.language),
      this.t('reports:pdf.colorContrast.commonAreas.buttons', this.language),
      this.t('reports:pdf.colorContrast.commonAreas.links', this.language),
      this.t('reports:pdf.colorContrast.commonAreas.text', this.language)
    ];
    
    commonAreas.forEach((area, index) => {
      doc.fontSize(9)
         .fillColor(this.textColor)
         .text(`• ${area}`, this.margins.left + 15, doc.y);
      doc.y += 15;
    });
    
    doc.y += 10;
    
    // Next steps
    this.addContentBox(doc, this.margins.left, doc.y, this.contentWidth, 60, '#f0f9ff', this.infoColor);
    
    doc.fontSize(10)
       .fillColor(this.infoColor)
       .text(this.t('reports:pdf.colorContrast.nextSteps', this.language), this.margins.left + 20, doc.y + 15);
    
    doc.fontSize(9)
       .fillColor(this.textColor)
       .text(this.t('reports:pdf.colorContrast.nextStepsDetails', this.language), 
             this.margins.left + 20, doc.y + 35, { width: this.contentWidth - 40 });
    
    doc.y += 80;
  }

  /**
   * Add message when no color contrast violations are found
   */
  addNoViolationsMessage(doc) {
    this.addContentBox(doc, this.margins.left, doc.y, this.contentWidth, 80, '#f0fdf4', this.successColor);
    
    doc.fontSize(16)
       .fillColor(this.successColor)
       .text(this.t('reports:pdf.colorContrast.noViolationsTitle', this.language), this.margins.left + 20, doc.y + 20);
    
    doc.fontSize(11)
       .fillColor(this.textColor)
       .text(this.t('reports:pdf.colorContrast.noViolationsDescription', this.language), 
             this.margins.left + 20, doc.y + 45, { width: this.contentWidth - 40 });
    
    doc.y += 100;
  }

  /**
   * Add color contrast recommendations
   */
  addColorContrastRecommendations(doc, analysis) {
    if (!analysis.summary?.recommendations || analysis.summary.recommendations.length === 0) {
      return doc.y;
    }

    this.checkPageBreak(doc, 100);
    
    doc.fontSize(12)
       .fillColor(this.textColor)
       .text(this.t('reports:pdf.colorContrast.recommendations', this.language), this.margins.left, doc.y);
    
    doc.y += 20;

    analysis.summary.recommendations.forEach((rec, index) => {
      this.addRecommendationItem(doc, rec, index + 1);
    });

    return doc.y;
  }

  /**
   * Add individual recommendation item
   */
  addRecommendationItem(doc, recommendation, index) {
    this.checkPageBreak(doc, 40);
    
    const priorityColor = recommendation.priority === 'high' ? this.dangerColor : 
                         recommendation.priority === 'medium' ? this.warningColor : this.infoColor;
    
    // Recommendation bullet point
    doc.fontSize(10)
       .fillColor(priorityColor)
       .text(`${index}.`, this.margins.left + 10, doc.y);
    
    // Recommendation text
    doc.fontSize(10)
       .fillColor(this.textColor)
       .text(recommendation.message, this.margins.left + 25, doc.y, { width: this.contentWidth - 35 });
    
    doc.y += 25;
  }
}

module.exports = ColorContrastComponent;