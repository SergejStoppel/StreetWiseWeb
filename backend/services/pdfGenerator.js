const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class PDFGenerator {
  constructor() {
    this.primaryColor = '#0ea5e9';
    this.secondaryColor = '#d946ef';
    this.textColor = '#1e293b';
    this.grayColor = '#64748b';
    this.successColor = '#22c55e';
    this.warningColor = '#f59e0b';
    this.errorColor = '#ef4444';
  }

  async generateAccessibilityReport(reportData) {
    try {
      logger.info('Starting PDF generation', { analysisId: reportData.analysisId });

      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        info: {
          Title: `Accessibility Report - ${reportData.url}`,
          Author: 'SiteCraft',
          Subject: 'Website Accessibility Analysis',
          Creator: 'SiteCraft Accessibility Analyzer'
        }
      });

      // Setup document stream
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        logger.info('PDF generation completed', { analysisId: reportData.analysisId });
      });

      // Initialize footer tracking
      this.currentPageNumber = 1;
      this.reportData = reportData;
      
      // Generate PDF content
      this.addHeader(doc, reportData);
      this.addFooterToCurrentPage(doc); // Add footer to first page
      
      this.addExecutiveSummary(doc, reportData);
      this.addScoreOverview(doc, reportData);
      this.addTopViolations(doc, reportData);
      this.addRecommendations(doc, reportData);
      this.addDetailedFindings(doc, reportData);
      this.addAppendix(doc, reportData);

      doc.end();

      return new Promise((resolve, reject) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);
      });

    } catch (error) {
      logger.error('PDF generation failed:', { error: error.message, analysisId: reportData.analysisId });
      throw new Error(`Failed to generate PDF report: ${error.message}`);
    }
  }

  addHeader(doc, reportData) {
    // Company logo and header
    doc.fontSize(24)
       .fillColor(this.primaryColor)
       .text('SiteCraft', 50, 50, { align: 'left' })
       .fontSize(14)
       .fillColor(this.textColor)
       .text('Accessibility Analysis Report', 50, 80)
       .text(`Generated: ${new Date(reportData.timestamp).toLocaleDateString()}`, 400, 80);

    // Website information
    doc.fontSize(18)
       .fillColor(this.textColor)
       .text('Website Analysis', 50, 120)
       .fontSize(12)
       .text(`URL: ${reportData.url}`, 50, 150)
       .text(`Analysis ID: ${reportData.analysisId}`, 50, 170)
       .text(`Report Type: ${reportData.reportType}`, 50, 190);

    // Add horizontal line
    doc.strokeColor('#e2e8f0')
       .lineWidth(1)
       .moveTo(50, 220)
       .lineTo(550, 220)
       .stroke();

    doc.y = 240;
  }

  addExecutiveSummary(doc, reportData) {
    doc.fontSize(16)
       .fillColor(this.textColor)
       .text('Executive Summary', 50, doc.y)
       .fontSize(12)
       .text('', 50, doc.y + 20);

    const scoreColor = this.getScoreColor(reportData.scores.overall);
    
    doc.text(`Overall Accessibility Score: `, { continued: true })
       .fillColor(scoreColor)
       .text(`${reportData.scores.overall}/100`, { continued: false })
       .fillColor(this.textColor);

    doc.y += 20;

    const summary = this.generateExecutiveSummaryText(reportData);
    doc.text(summary, 50, doc.y, { width: 500, align: 'justify' });

    doc.y += 40;
  }

  addScoreOverview(doc, reportData) {
    doc.fontSize(16)
       .fillColor(this.textColor)
       .text('Accessibility Scores', 50, doc.y);

    doc.y += 30;

    // Create score cards
    const scores = [
      { label: 'Overall Score', value: reportData.scores.overall, max: 100 },
      { label: 'WCAG Compliance', value: reportData.scores.accessibility, max: 100 },
      { label: 'Custom Checks', value: reportData.scores.custom, max: 100 }
    ];

    let xPos = 50;
    scores.forEach((score, index) => {
      this.addScoreCard(doc, xPos, doc.y, score);
      xPos += 165;
    });

    doc.y += 100;
  }

  addScoreCard(doc, x, y, score) {
    const cardWidth = 150;
    const cardHeight = 80;
    
    // Card background
    doc.rect(x, y, cardWidth, cardHeight)
       .fillAndStroke('#f8fafc', '#e2e8f0');

    // Score value
    const scoreColor = this.getScoreColor(score.value);
    doc.fontSize(24)
       .fillColor(scoreColor)
       .text(`${score.value}`, x + 10, y + 15, { width: cardWidth - 20, align: 'center' });

    // Score label
    doc.fontSize(10)
       .fillColor(this.grayColor)
       .text(score.label, x + 10, y + 50, { width: cardWidth - 20, align: 'center' });
  }

  addTopViolations(doc, reportData) {
    doc.fontSize(16)
       .fillColor(this.textColor)
       .text('Top Accessibility Violations', 50, doc.y);

    doc.y += 20;

    const violations = reportData.axeResults ? 
      reportData.axeResults.violations.filter(v => v.impact === 'critical' || v.impact === 'serious').slice(0, 10) :
      reportData.topViolations || [];

    if (violations.length === 0) {
      doc.fontSize(12)
         .fillColor(this.successColor)
         .text('✓ No critical or serious accessibility violations found!', 50, doc.y);
      doc.y += 30;
      return;
    }

    violations.forEach((violation, index) => {
      this.addViolationItem(doc, violation, index + 1);
    });

    doc.y += 20;
  }

  addViolationItem(doc, violation, index) {
    // Check if we need a new page
    if (doc.y > 650) {
      doc.addPage();
      this.currentPageNumber++;
      this.addFooterToCurrentPage(doc);
      doc.y = 50;
    }
    
    const impactColor = this.getImpactColor(violation.impact);
    
    doc.fontSize(12)
       .fillColor(this.textColor)
       .text(`${index}. ${violation.help}`, 50, doc.y, { width: 400, continued: true })
       .fillColor(impactColor)
       .text(` (${violation.impact.toUpperCase()})`, { continued: false });

    doc.y += 15;
    
    if (violation.description) {
      doc.fontSize(10)
         .fillColor(this.grayColor)
         .text(violation.description, 60, doc.y, { width: 480 });
      doc.y += 15;
    }

    if (violation.nodes) {
      doc.fontSize(10)
         .fillColor(this.grayColor)
         .text(`Affected elements: ${violation.nodes}`, 60, doc.y);
    }

    doc.y += 20;
  }

  addRecommendations(doc, reportData) {
    doc.addPage();
    this.currentPageNumber++;
    this.addFooterToCurrentPage(doc);
    
    doc.fontSize(16)
       .fillColor(this.textColor)
       .text('Recommendations', 50, 50);

    doc.y = 80;

    reportData.recommendations.forEach((rec, index) => {
      this.addRecommendationItem(doc, rec, index + 1);
    });
  }

  addRecommendationItem(doc, recommendation, index) {
    // Check if we need a new page
    if (doc.y > 680) {
      doc.addPage();
      this.currentPageNumber++;
      this.addFooterToCurrentPage(doc);
      doc.y = 50;
    }
    
    const priorityColor = this.getPriorityColor(recommendation.priority);
    
    doc.fontSize(14)
       .fillColor(this.textColor)
       .text(`${index}. ${recommendation.title}`, 50, doc.y, { continued: true })
       .fontSize(10)
       .fillColor(priorityColor)
       .text(` [${recommendation.priority.toUpperCase()} PRIORITY]`, { continued: false });

    doc.y += 20;

    doc.fontSize(11)
       .fillColor(this.grayColor)
       .text(`Category: ${recommendation.category}`, 60, doc.y);

    doc.y += 15;

    doc.fontSize(11)
       .fillColor(this.textColor)
       .text(recommendation.description, 60, doc.y, { width: 480 });

    doc.y += 15;

    doc.fontSize(11)
       .fillColor(this.textColor)
       .text(`Action Required: ${recommendation.action}`, 60, doc.y, { width: 480 });

    doc.y += 30;
  }

  addDetailedFindings(doc, reportData) {
    if (reportData.reportType !== 'detailed') {
      return;
    }

    doc.addPage();
    this.currentPageNumber++;
    this.addFooterToCurrentPage(doc);
    
    doc.fontSize(16)
       .fillColor(this.textColor)
       .text('Detailed Findings', 50, 50);

    doc.y = 80;

    // Add detailed violation analysis
    if (reportData.axeResults && reportData.axeResults.violations.length > 0) {
      doc.fontSize(14)
         .text('WCAG Violations Analysis', 50, doc.y);
      
      doc.y += 20;

      reportData.axeResults.violations.forEach((violation, index) => {
        this.addDetailedViolation(doc, violation, index + 1);
      });
    }

    // Add custom checks results
    if (reportData.customChecks) {
      doc.addPage();
      this.currentPageNumber++;
      this.addFooterToCurrentPage(doc);
      
      doc.fontSize(14)
         .fillColor(this.textColor)
         .text('Custom Accessibility Checks', 50, 50);
      
      doc.y = 80;
      this.addCustomChecksDetails(doc, reportData.customChecks);
    }
  }

  addDetailedViolation(doc, violation, index) {
    doc.fontSize(12)
       .fillColor(this.textColor)
       .text(`${index}. ${violation.id}: ${violation.help}`, 50, doc.y);

    doc.y += 15;

    if (violation.description) {
      doc.fontSize(10)
         .fillColor(this.grayColor)
         .text(violation.description, 60, doc.y, { width: 480 });
      doc.y += 15;
    }


    if (violation.nodes && violation.nodes.length > 0) {
      doc.fontSize(10)
         .fillColor(this.textColor)
         .text(`Affected elements (${violation.nodes.length}):`, 60, doc.y);
      
      violation.nodes.slice(0, 3).forEach(node => {
        doc.y += 12;
        if (node.html) {
          doc.fontSize(9)
             .fillColor(this.grayColor)
             .text(`• ${node.html.substring(0, 100)}...`, 70, doc.y);
        }
      });
    }

    doc.y += 25;
  }

  addCustomChecksDetails(doc, customChecks) {
    // Images analysis
    if (customChecks.images && customChecks.images.length > 0) {
      doc.fontSize(12)
         .fillColor(this.textColor)
         .text('Image Accessibility', 50, doc.y);
      
      doc.y += 15;
      
      const imagesWithoutAlt = customChecks.images.filter(img => !img.hasAlt);
      doc.fontSize(10)
         .text(`Total images: ${customChecks.images.length}`, 60, doc.y)
         .text(`Images without alt text: ${imagesWithoutAlt.length}`, 60, doc.y + 12);
      
      doc.y += 30;
    }

    // Forms analysis
    if (customChecks.forms && customChecks.forms.length > 0) {
      doc.fontSize(12)
         .fillColor(this.textColor)
         .text('Form Accessibility', 50, doc.y);
      
      doc.y += 15;
      
      const unlabeledInputs = customChecks.forms.reduce((count, form) => 
        count + form.inputs.filter(input => !input.hasLabel).length, 0);
      
      doc.fontSize(10)
         .text(`Total forms: ${customChecks.forms.length}`, 60, doc.y)
         .text(`Inputs without labels: ${unlabeledInputs}`, 60, doc.y + 12);
      
      doc.y += 30;
    }
  }

  addAppendix(doc, reportData) {
    doc.addPage();
    this.currentPageNumber++;
    this.addFooterToCurrentPage(doc);
    
    doc.fontSize(16)
       .fillColor(this.textColor)
       .text('Appendix', 50, 50);

    doc.y = 80;

    // Methodology
    doc.fontSize(14)
       .text('Testing Methodology', 50, doc.y);
    
    doc.y += 20;

    doc.fontSize(11)
       .fillColor(this.textColor)
       .text('This accessibility analysis was performed using:', 50, doc.y)
       .text('• Axe-core accessibility testing engine', 60, doc.y + 15)
       .text('• WCAG 2.1 AA compliance standards', 60, doc.y + 30)
       .text('• Custom accessibility checks', 60, doc.y + 45)
       .text('• Automated browser testing with Puppeteer', 60, doc.y + 60);

    doc.y += 80;

    // Standards reference
    doc.fontSize(14)
       .fillColor(this.textColor)
       .text('Standards Reference', 50, doc.y);
    
    doc.y += 20;

    doc.fontSize(11)
       .text('WCAG 2.1 Level AA Guidelines:', 50, doc.y)
       .text('• Perceivable: Information must be presentable in ways users can perceive', 60, doc.y + 15)
       .text('• Operable: Interface components must be operable', 60, doc.y + 30)
       .text('• Understandable: Information and UI operation must be understandable', 60, doc.y + 45)
       .text('• Robust: Content must be robust enough for various assistive technologies', 60, doc.y + 60);
  }

  addFooterToCurrentPage(doc) {
    const currentY = doc.y;
    
    doc.fontSize(8)
       .fillColor(this.grayColor)
       .text(`SiteCraft Accessibility Report - ${this.reportData.url}`, 50, 750, { width: 400 })
       .text(`Page ${this.currentPageNumber}`, 450, 750, { width: 100, align: 'right' });
    
    // Restore the y position
    doc.y = currentY;
  }

  generateExecutiveSummaryText(reportData) {
    const score = reportData.scores.overall;
    const violations = reportData.summary.totalViolations;
    const critical = reportData.summary.criticalViolations;
    const serious = reportData.summary.seriousViolations;

    let summary = `This website received an overall accessibility score of ${score}/100. `;

    if (score >= 80) {
      summary += 'This indicates good accessibility compliance with minor issues to address.';
    } else if (score >= 60) {
      summary += 'This indicates moderate accessibility compliance with several issues requiring attention.';
    } else {
      summary += 'This indicates significant accessibility issues that require immediate attention.';
    }

    summary += ` The analysis identified ${violations} total accessibility ${violations === 1 ? 'violation' : 'violations'}`;
    
    if (critical > 0) {
      summary += `, including ${critical} critical ${critical === 1 ? 'issue' : 'issues'}`;
    }
    
    if (serious > 0) {
      summary += ` and ${serious} serious ${serious === 1 ? 'issue' : 'issues'}`;
    }

    summary += '. Addressing these issues will improve user experience for people with disabilities and ensure better compliance with accessibility standards.';

    return summary;
  }

  getScoreColor(score) {
    if (score >= 80) return this.successColor;
    if (score >= 60) return this.warningColor;
    return this.errorColor;
  }

  getImpactColor(impact) {
    const colors = {
      critical: this.errorColor,
      serious: '#dc2626',
      moderate: this.warningColor,
      minor: '#64748b'
    };
    return colors[impact] || this.grayColor;
  }

  getPriorityColor(priority) {
    const colors = {
      high: this.errorColor,
      medium: this.warningColor,
      low: this.successColor
    };
    return colors[priority] || this.grayColor;
  }
}

module.exports = new PDFGenerator();