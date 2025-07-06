/**
 * ScoreVisualizationComponent - Score cards and accessibility metrics visualization
 * 
 * This module handles the creation of professional score visualizations including
 * enhanced score cards with circular indicators, performance ratings, score interpretation
 * guides, and visual performance metrics that help users understand their accessibility standing.
 */

const BasePDFDocument = require('./BasePDFDocument');

class ScoreVisualizationComponent extends BasePDFDocument {
  /**
   * Add the complete score overview section
   */
  addScoreOverview(doc, reportData) {
    this.addSectionHeader(doc, 'Accessibility Score Breakdown');
    
    // Enhanced score visualization cards
    this.addScoreCards(doc, reportData);
    
    // Score interpretation guide
    this.addScoreInterpretation(doc, reportData.scores.overall);
    
    return doc.y;
  }

  /**
   * Add enhanced score cards with visual indicators
   */
  addScoreCards(doc, reportData) {
    const scores = [
      { 
        label: 'Overall Score', 
        value: reportData.scores.overall, 
        description: 'Combined accessibility rating',
        category: 'overall'
      },
      { 
        label: 'WCAG Compliance', 
        value: reportData.scores.accessibility, 
        description: 'Standards compliance rating',
        category: 'wcag'
      },
      { 
        label: 'Custom Checks', 
        value: reportData.scores.custom, 
        description: 'Additional quality metrics',
        category: 'custom'
      }
    ];

    let xPos = this.margins.left;
    const cardSpacing = 170;
    
    scores.forEach((score, index) => {
      this.addEnhancedScoreCard(doc, xPos, doc.y, score);
      xPos += cardSpacing;
    });

    doc.y += 140;
  }

  /**
   * Create an enhanced score card with circular indicator
   */
  addEnhancedScoreCard(doc, x, y, score) {
    const cardWidth = 160;
    const cardHeight = 120;
    
    // Card background with subtle shadow effect
    this.addContentBox(doc, x, y, cardWidth, cardHeight, 'white', this.borderColor);
    
    // Header strip with score color
    const scoreColor = this.getScoreColor(score.value);
    doc.rect(x, y, cardWidth, 8)
       .fill(scoreColor);

    // Score value with circular background
    const centerX = x + cardWidth / 2;
    doc.circle(centerX, y + 40, 25)
       .fill(this.backgroundColor)
       .stroke(scoreColor);
    
    // Score number
    doc.fontSize(20)
       .fillColor(scoreColor)
       .text(`${score.value}`, x + 10, y + 30, { width: cardWidth - 20, align: 'center' });
    
    // "/100" indicator
    doc.fontSize(10)
       .fillColor(this.grayColor)
       .text('/100', x + 10, y + 50, { width: cardWidth - 20, align: 'center' });

    // Score label
    doc.fontSize(11)
       .fillColor(this.textColor)
       .text(score.label, x + 10, y + 70, { width: cardWidth - 20, align: 'center' });
    
    // Description
    doc.fontSize(8)
       .fillColor(this.grayColor)
       .text(score.description, x + 10, y + 85, { width: cardWidth - 20, align: 'center' });
    
    // Performance indicator
    const performance = this.getPerformanceText(score.value);
    const perfColor = this.getScoreColor(score.value);
    doc.fontSize(9)
       .fillColor(perfColor)
       .text(performance, x + 10, y + 100, { width: cardWidth - 20, align: 'center' });
  }

  /**
   * Add score interpretation guide
   */
  addScoreInterpretation(doc, overallScore) {
    doc.fontSize(14)
       .fillColor(this.textColor)
       .text('Score Interpretation', this.margins.left, doc.y);
    
    doc.y += 20;
    
    const interpretation = this.getScoreInterpretation(overallScore);
    
    // Interpretation box
    this.addContentBox(doc, this.margins.left, doc.y, this.contentWidth, 60, 
                      interpretation.bgColor, interpretation.borderColor);
    
    doc.fontSize(12)
       .fillColor(this.textColor)
       .text(interpretation.title, this.margins.left + 20, doc.y + 15)
       .fontSize(10)
       .fillColor(this.grayColor)
       .text(interpretation.description, this.margins.left + 20, doc.y + 35, { width: this.contentWidth - 40 });
    
    doc.y += 80;
  }

  /**
   * Get performance text based on score
   */
  getPerformanceText(score) {
    if (score >= 90) return 'EXCELLENT';
    if (score >= 80) return 'GOOD';
    if (score >= 70) return 'FAIR';
    if (score >= 60) return 'NEEDS WORK';
    return 'CRITICAL';
  }

  /**
   * Get detailed score interpretation
   */
  getScoreInterpretation(score) {
    if (score >= 90) {
      return {
        title: 'Excellent Accessibility - Industry Leading',
        description: 'Your website demonstrates exceptional accessibility standards and serves as a model for inclusive design.',
        bgColor: '#f0fdf4',
        borderColor: this.successColor
      };
    } else if (score >= 80) {
      return {
        title: 'Good Accessibility - Above Average',
        description: 'Your website meets most accessibility standards with room for optimization to achieve excellence.',
        bgColor: '#fefce8',
        borderColor: this.warningColor
      };
    } else if (score >= 60) {
      return {
        title: 'Moderate Accessibility - Improvement Needed',
        description: 'Your website has accessibility foundations but requires attention to critical issues for full compliance.',
        bgColor: '#fef2f2',
        borderColor: this.errorColor
      };
    } else {
      return {
        title: 'Poor Accessibility - Immediate Action Required',
        description: 'Your website has significant accessibility barriers that prevent users with disabilities from accessing content.',
        bgColor: '#fef2f2',
        borderColor: this.criticalColor
      };
    }
  }

  /**
   * Add detailed metrics breakdown (optional enhanced view)
   */
  addDetailedMetrics(doc, reportData) {
    this.checkPageBreak(doc, 150);
    
    doc.fontSize(14)
       .fillColor(this.textColor)
       .text('Detailed Metrics Breakdown', this.margins.left, doc.y);
    
    doc.y += 25;
    
    // Metrics grid
    const metrics = [
      { label: 'Total Issues', value: reportData.summary.totalViolations, color: this.grayColor },
      { label: 'Critical', value: reportData.summary.criticalViolations, color: this.criticalColor },
      { label: 'Serious', value: reportData.summary.seriousViolations, color: this.seriousColor },
      { label: 'Moderate', value: reportData.summary.moderateViolations, color: this.warningColor },
      { label: 'Minor', value: reportData.summary.minorViolations, color: this.lightGrayColor },
      { label: 'Images w/o Alt', value: reportData.summary.imagesWithoutAlt, color: this.errorColor }
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
    // Card background
    this.addContentBox(doc, x, y, width, height, 'white', this.borderColor);
    
    // Metric value
    doc.fontSize(18)
       .fillColor(metric.color)
       .text(`${metric.value}`, x + 5, y + 10, { width: width - 10, align: 'center' });
    
    // Metric label
    doc.fontSize(8)
       .fillColor(this.grayColor)
       .text(metric.label, x + 5, y + 35, { width: width - 10, align: 'center' });
  }

  /**
   * Add progress bars for visual score representation
   */
  addProgressBars(doc, reportData) {
    const scores = [
      { label: 'Overall', value: reportData.scores.overall },
      { label: 'WCAG Compliance', value: reportData.scores.accessibility },
      { label: 'Custom Checks', value: reportData.scores.custom }
    ];
    
    scores.forEach((score, index) => {
      this.addProgressBar(doc, this.margins.left, doc.y + (index * 25), score);
    });
    
    doc.y += scores.length * 25 + 20;
  }

  /**
   * Add individual progress bar
   */
  addProgressBar(doc, x, y, score) {
    const barWidth = 200;
    const barHeight = 12;
    const fillWidth = (score.value / 100) * barWidth;
    const color = this.getScoreColor(score.value);
    
    // Background bar
    doc.rect(x + 100, y, barWidth, barHeight)
       .fill('#e5e7eb');
    
    // Progress fill
    doc.rect(x + 100, y, fillWidth, barHeight)
       .fill(color);
    
    // Label and value
    doc.fontSize(10)
       .fillColor(this.textColor)
       .text(score.label, x, y + 2)
       .text(`${score.value}%`, x + 310, y + 2);
  }
}

module.exports = ScoreVisualizationComponent;