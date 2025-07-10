/**
 * ViolationsComponent - Accessibility violations presentation and analysis
 * 
 * This module handles the visual presentation of accessibility violations including
 * priority-based violation cards, impact indicators, quick fix guidance, and
 * detailed violation analysis with actionable remediation steps.
 */

const BasePDFDocument = require('./BasePDFDocument');

class ViolationsComponent extends BasePDFDocument {
  /**
   * Add the priority violations section
   */
  addTopViolations(doc, reportData, language = 'en') {
    this.language = language;
    this.addSectionHeader(doc, this.t('reports:pdf.violations.priorityIssuesTitle', language));
    
    const violations = this.getFilteredViolations(reportData);
    
    if (violations.length === 0) {
      this.addNoViolationsMessage(doc);
      return doc.y;
    }

    violations.forEach((violation, index) => {
      this.addEnhancedViolationItem(doc, violation, index + 1);
    });

    doc.y += 20;
    return doc.y;
  }

  /**
   * Get filtered and sorted violations for priority display
   */
  getFilteredViolations(reportData) {
    if (!reportData.axeResults || !reportData.axeResults.violations) {
      return reportData.topViolations || [];
    }

    return reportData.axeResults.violations
      .filter(v => v.impact === 'critical' || v.impact === 'serious')
      .sort((a, b) => {
        const impactOrder = { critical: 4, serious: 3, moderate: 2, minor: 1 };
        return impactOrder[b.impact] - impactOrder[a.impact];
      })
      .slice(0, 8);
  }

  /**
   * Add message when no critical violations are found
   */
  addNoViolationsMessage(doc) {
    this.addContentBox(doc, this.margins.left, doc.y, this.contentWidth, 80, '#f0fdf4', this.successColor);
    
    doc.fontSize(16)
       .fillColor(this.successColor)
       .text(this.t('reports:pdf.violations.noCriticalIssuesTitle', this.language), this.margins.left + 20, doc.y + 20)
       .fontSize(11)
       .fillColor(this.textColor)
       .text(this.t('reports:pdf.violations.noCriticalIssuesDescription', this.language), 
             this.margins.left + 20, doc.y + 45);
    
    doc.y += 100;
  }

  /**
   * Add enhanced violation card with visual indicators
   */
  addEnhancedViolationItem(doc, violation, index) {
    this.checkPageBreak(doc, 140);
    
    const impactColor = this.getImpactColor(violation.impact);
    const cardHeight = 120;
    
    // Main violation card
    this.addContentBox(doc, this.margins.left, doc.y, this.contentWidth, cardHeight, 'white', this.borderColor);
    
    // Impact severity strip
    doc.rect(this.margins.left, doc.y, 8, cardHeight)
       .fill(impactColor);
    
    // Priority number indicator
    this.addPriorityIndicator(doc, this.margins.left + 30, doc.y + 25, index, impactColor);
    
    // Violation content
    this.addViolationContent(doc, violation, this.margins.left + 50, doc.y + 15, impactColor);
    
    // Quick fix guidance box
    this.addQuickFixGuidance(doc, violation, doc.y + 85);
    
    doc.y += cardHeight + 15;
  }

  /**
   * Add priority number in a circle
   */
  addPriorityIndicator(doc, x, y, index, color) {
    doc.circle(x, y, 12)
       .fill(color);
    
    doc.fontSize(12)
       .fillColor('white')
       .text(`${index}`, x - 6, y - 6);
  }

  /**
   * Translate Axe-core violation messages
   */
  translateViolation(violation) {
    const ruleId = violation.id;
    
    // Try to get translated version from dashboard namespace (where axe violations are stored)
    let translatedHelp = violation.help;
    let translatedDescription = violation.description;
    
    try {
      const helpKey = `dashboard:violations.axeViolations.${ruleId}`;
      const descKey = `dashboard:violations.axeViolations.${ruleId}-desc`;
      
      const helpTranslation = this.t(helpKey, this.language);
      const descTranslation = this.t(descKey, this.language);
      
      // Use translation if it's different from the key (meaning translation was found)
      if (helpTranslation !== helpKey) {
        translatedHelp = helpTranslation;
      }
      if (descTranslation !== descKey) {
        translatedDescription = descTranslation;
      }
    } catch (error) {
      // If translation fails, use original text
      console.log(`PDF: Translation not found for violation ${ruleId}`);
    }
    
    return {
      ...violation,
      help: translatedHelp,
      description: translatedDescription
    };
  }

  /**
   * Add violation title, impact, and description
   */
  addViolationContent(doc, violation, x, y, impactColor) {
    // Translate the violation before using it
    const translatedViolation = this.translateViolation(violation);
    
    // Violation title
    doc.fontSize(13)
       .fillColor(this.textColor)
       .text(translatedViolation.help, x, y, { width: this.contentWidth - (x - this.margins.left) });
    
    // Impact and affected elements
    const translatedImpact = this.t(`dashboard:violations.impact.${violation.impact}`, this.language) || violation.impact;
    doc.fontSize(9)
       .fillColor(impactColor)
       .text(`${translatedImpact.toUpperCase()} ${this.t('reports:pdf.violations.impactLabel', this.language)}`, x, y + 20);
    
    if (violation.nodes && violation.nodes.length > 0) {
      doc.fontSize(9)
         .fillColor(this.grayColor)
         .text(this.t('reports:pdf.violations.elementsAffected', this.language, { count: violation.nodes.length }), 
               x + 120, y + 20);
    }
    
    // Description
    if (translatedViolation.description) {
      doc.fontSize(10)
         .fillColor(this.grayColor)
         .text(translatedViolation.description, x, y + 35, { 
           width: this.contentWidth - (x - this.margins.left) - 20, 
           lineGap: 2 
         });
    }
  }

  /**
   * Add quick fix guidance box
   */
  addQuickFixGuidance(doc, violation, yPosition) {
    const quickFix = this.getQuickFixGuidance(violation.id);
    if (!quickFix) return;
    
    // Quick fix box
    this.addContentBox(doc, this.margins.left + 20, yPosition, this.contentWidth - 40, 25, '#fef3c7', '#f59e0b');
    
    doc.fontSize(9)
       .fillColor('#92400e')
       .text(this.t('reports:pdf.violations.quickFixLabel', this.language), this.margins.left + 30, yPosition + 7)
       .fillColor(this.textColor)
       .text(quickFix, this.margins.left + 75, yPosition + 7, { width: this.contentWidth - 100 });
  }

  /**
   * Get quick fix guidance for common violations
   */
  getQuickFixGuidance(violationId) {
    const quickFixes = {
      'color-contrast': this.t('reports:pdf.violations.quickFixes.colorContrast', this.language),
      'image-alt': this.t('reports:pdf.violations.quickFixes.imageAlt', this.language),
      'label': this.t('reports:pdf.violations.quickFixes.label', this.language),
      'heading-order': this.t('reports:pdf.violations.quickFixes.headingOrder', this.language),
      'link-name': this.t('reports:pdf.violations.quickFixes.linkName', this.language),
      'button-name': this.t('reports:pdf.violations.quickFixes.buttonName', this.language),
      'focus-order-semantics': this.t('reports:pdf.violations.quickFixes.focusOrder', this.language),
      'keyboard': this.t('reports:pdf.violations.quickFixes.keyboard', this.language),
      'aria-allowed-attr': this.t('reports:pdf.violations.quickFixes.ariaAllowed', this.language),
      'aria-required-attr': this.t('reports:pdf.violations.quickFixes.ariaRequired', this.language)
    };
    
    return quickFixes[violationId] || this.t('reports:pdf.violations.quickFixes.default', this.language);
  }

  /**
   * Add detailed violations analysis for comprehensive reports
   */
  addDetailedViolations(doc, reportData, language = 'en') {
    if (reportData.reportType !== 'detailed') return doc.y;
    this.language = language;
    
    this.checkPageBreak(doc, 100);
    this.addSectionHeader(doc, this.t('reports:pdf.violations.completeAnalysisTitle', language));
    
    if (!reportData.axeResults || !reportData.axeResults.violations.length) {
      this.addNoDetailedViolationsMessage(doc);
      return doc.y;
    }

    reportData.axeResults.violations.forEach((violation, index) => {
      this.addDetailedViolationItem(doc, violation, index + 1);
    });

    return doc.y;
  }

  /**
   * Add message when no detailed violations exist
   */
  addNoDetailedViolationsMessage(doc) {
    doc.fontSize(12)
       .fillColor(this.successColor)
       .text(this.t('reports:pdf.violations.noDetailedViolations', this.language), this.margins.left, doc.y);
    doc.y += 30;
  }

  /**
   * Add detailed violation item with comprehensive information
   */
  addDetailedViolationItem(doc, violation, index) {
    this.checkPageBreak(doc, 100);
    
    // Translate the violation before using it
    const translatedViolation = this.translateViolation(violation);
    
    // Violation header
    doc.fontSize(12)
       .fillColor(this.textColor)
       .text(`${index}. ${violation.id}: ${translatedViolation.help}`, this.margins.left, doc.y);

    doc.y += 15;

    // Description
    if (translatedViolation.description) {
      doc.fontSize(10)
         .fillColor(this.grayColor)
         .text(translatedViolation.description, this.margins.left + 10, doc.y, { width: this.contentWidth - 20 });
      doc.y += 15;
    }

    // Affected elements
    if (violation.nodes && violation.nodes.length > 0) {
      doc.fontSize(10)
         .fillColor(this.textColor)
         .text(this.t('reports:pdf.violations.affectedElementsLabel', this.language, { count: violation.nodes.length }), this.margins.left + 10, doc.y);
      
      // Show first few elements
      violation.nodes.slice(0, 3).forEach(node => {
        doc.y += 12;
        if (node.html) {
          doc.fontSize(9)
             .fillColor(this.grayColor)
             .text(`• ${node.html.substring(0, 100)}...`, this.margins.left + 20, doc.y);
        }
      });
    }

    doc.y += 25;
  }

  /**
   * Add violation summary statistics
   */
  addViolationSummary(doc, reportData, language = 'en') {
    this.language = language;
    this.checkPageBreak(doc, 80);
    
    doc.fontSize(14)
       .fillColor(this.textColor)
       .text(this.t('reports:pdf.violations.summaryByImpactTitle', language), this.margins.left, doc.y);
    
    doc.y += 25;
    
    // Use axe-core data consistently for both summary and violations display
    const summaryData = [
      { level: this.t('reports:pdf.violations.impactLevels.critical', this.language), count: reportData.summary.criticalViolations, color: this.criticalColor },
      { level: this.t('reports:pdf.violations.impactLevels.serious', this.language), count: reportData.summary.seriousViolations, color: this.seriousColor },
      { level: this.t('reports:pdf.violations.impactLevels.moderate', this.language), count: reportData.summary.moderateViolations || 0, color: this.warningColor },
      { level: this.t('reports:pdf.violations.impactLevels.minor', this.language), count: reportData.summary.minorViolations || 0, color: this.lightGrayColor }
    ];
    
    let xPos = this.margins.left;
    summaryData.forEach((item, index) => {
      this.addSummaryItem(doc, xPos, doc.y, item);
      xPos += 130;
    });
    
    doc.y += 60;
  }

  /**
   * Add individual summary item
   */
  addSummaryItem(doc, x, y, item) {
    // Background box
    this.addContentBox(doc, x, y, 120, 40, 'white', item.color);
    
    // Count
    doc.fontSize(16)
       .fillColor(item.color)
       .text(`${item.count}`, x + 10, y + 5);
    
    // Level label
    doc.fontSize(10)
       .fillColor(this.textColor)
       .text(item.level, x + 10, y + 25);
  }
}

module.exports = ViolationsComponent;