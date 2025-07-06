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
  addTopViolations(doc, reportData) {
    this.addSectionHeader(doc, 'Priority Issues - Immediate Action Required');
    
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
       .text('🎉 Excellent! No Critical Issues Found', this.margins.left + 20, doc.y + 20)
       .fontSize(11)
       .fillColor(this.textColor)
       .text('Your website meets the highest accessibility standards for critical and serious violations.', 
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
   * Add violation title, impact, and description
   */
  addViolationContent(doc, violation, x, y, impactColor) {
    // Violation title
    doc.fontSize(13)
       .fillColor(this.textColor)
       .text(violation.help, x, y, { width: this.contentWidth - (x - this.margins.left) });
    
    // Impact and affected elements
    doc.fontSize(9)
       .fillColor(impactColor)
       .text(`${violation.impact.toUpperCase()} IMPACT`, x, y + 20);
    
    if (violation.nodes && violation.nodes.length > 0) {
      doc.fontSize(9)
         .fillColor(this.grayColor)
         .text(`${violation.nodes.length} element${violation.nodes.length !== 1 ? 's' : ''} affected`, 
               x + 120, y + 20);
    }
    
    // Description
    if (violation.description) {
      doc.fontSize(10)
         .fillColor(this.grayColor)
         .text(violation.description, x, y + 35, { 
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
       .text('💡 Quick Fix: ', this.margins.left + 30, yPosition + 7)
       .fillColor(this.textColor)
       .text(quickFix, this.margins.left + 75, yPosition + 7, { width: this.contentWidth - 100 });
  }

  /**
   * Get quick fix guidance for common violations
   */
  getQuickFixGuidance(violationId) {
    const quickFixes = {
      'color-contrast': 'Increase text color contrast to meet 4.5:1 ratio for normal text, 3:1 for large text',
      'image-alt': 'Add descriptive alt attributes to images: <img src="..." alt="Clear description">',
      'label': 'Associate labels with form inputs: <label for="email">Email</label><input id="email">',
      'heading-order': 'Use headings in logical order: h1 > h2 > h3, don\'t skip levels',
      'link-name': 'Provide descriptive link text or aria-label for meaningful context',
      'button-name': 'Add text content or aria-label to buttons for screen readers',
      'focus-order-semantics': 'Ensure interactive elements have proper focus indicators and logical tab order',
      'keyboard': 'Make all interactive elements accessible via keyboard navigation',
      'aria-allowed-attr': 'Use only valid ARIA attributes according to element roles',
      'aria-required-attr': 'Add required ARIA attributes for proper accessibility semantics'
    };
    
    return quickFixes[violationId] || 'Review WCAG guidelines for specific implementation details';
  }

  /**
   * Add detailed violations analysis for comprehensive reports
   */
  addDetailedViolations(doc, reportData) {
    if (reportData.reportType !== 'detailed') return doc.y;
    
    this.checkPageBreak(doc, 100);
    this.addSectionHeader(doc, 'Complete Violations Analysis');
    
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
       .text('✓ No accessibility violations detected in detailed analysis!', this.margins.left, doc.y);
    doc.y += 30;
  }

  /**
   * Add detailed violation item with comprehensive information
   */
  addDetailedViolationItem(doc, violation, index) {
    this.checkPageBreak(doc, 100);
    
    // Violation header
    doc.fontSize(12)
       .fillColor(this.textColor)
       .text(`${index}. ${violation.id}: ${violation.help}`, this.margins.left, doc.y);

    doc.y += 15;

    // Description
    if (violation.description) {
      doc.fontSize(10)
         .fillColor(this.grayColor)
         .text(violation.description, this.margins.left + 10, doc.y, { width: this.contentWidth - 20 });
      doc.y += 15;
    }

    // Affected elements
    if (violation.nodes && violation.nodes.length > 0) {
      doc.fontSize(10)
         .fillColor(this.textColor)
         .text(`Affected elements (${violation.nodes.length}):`, this.margins.left + 10, doc.y);
      
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
  addViolationSummary(doc, reportData) {
    this.checkPageBreak(doc, 80);
    
    doc.fontSize(14)
       .fillColor(this.textColor)
       .text('Violation Summary by Impact Level', this.margins.left, doc.y);
    
    doc.y += 25;
    
    const summaryData = [
      { level: 'Critical', count: reportData.summary.criticalViolations, color: this.criticalColor },
      { level: 'Serious', count: reportData.summary.seriousViolations, color: this.seriousColor },
      { level: 'Moderate', count: reportData.summary.moderateViolations || 0, color: this.warningColor },
      { level: 'Minor', count: reportData.summary.minorViolations || 0, color: this.lightGrayColor }
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