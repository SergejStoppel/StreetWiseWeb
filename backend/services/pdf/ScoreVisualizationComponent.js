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
  addScoreOverview(doc, reportData, language = 'en') {
    this.language = language;
    this.addSectionHeader(doc, this.t('reports:pdf.scoreVisualization.accessibilityScoreBreakdown', language));
    
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
    // Single unified accessibility score
    const score = { 
      label: this.t('reports:pdf.scoreVisualization.scoreCards.wcagCompliance', this.language), 
      value: reportData.scores.overall, 
      description: this.t('reports:pdf.scoreVisualization.scoreCards.wcagDescription', this.language),
      category: 'accessibility'
    };

    // Center the single score card
    const cardWidth = 150;
    const xPos = this.margins.left + (this.contentWidth - cardWidth) / 2;
    
    this.addEnhancedScoreCard(doc, xPos, doc.y, score);

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
       .text(this.t('reports:pdf.scoreVisualization.scoreInterpretation', this.language), this.margins.left, doc.y);
    
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
    if (score >= 90) return this.t('reports:pdf.scoreVisualization.performanceRatings.excellent', this.language);
    if (score >= 80) return this.t('reports:pdf.scoreVisualization.performanceRatings.good', this.language);
    if (score >= 70) return this.t('reports:pdf.scoreVisualization.performanceRatings.fair', this.language);
    if (score >= 60) return this.t('reports:pdf.scoreVisualization.performanceRatings.needsWork', this.language);
    return this.t('reports:pdf.scoreVisualization.performanceRatings.critical', this.language);
  }

  /**
   * Get detailed score interpretation
   */
  getScoreInterpretation(score) {
    if (score >= 90) {
      return {
        title: this.t('reports:pdf.scoreVisualization.interpretations.excellentTitle', this.language),
        description: this.t('reports:pdf.scoreVisualization.interpretations.excellentDescription', this.language),
        bgColor: '#f0fdf4',
        borderColor: this.successColor
      };
    } else if (score >= 80) {
      return {
        title: this.t('reports:pdf.scoreVisualization.interpretations.goodTitle', this.language),
        description: this.t('reports:pdf.scoreVisualization.interpretations.goodDescription', this.language),
        bgColor: '#fefce8',
        borderColor: this.warningColor
      };
    } else if (score >= 60) {
      return {
        title: this.t('reports:pdf.scoreVisualization.interpretations.moderateTitle', this.language),
        description: this.t('reports:pdf.scoreVisualization.interpretations.moderateDescription', this.language),
        bgColor: '#fef2f2',
        borderColor: this.errorColor
      };
    } else {
      return {
        title: this.t('reports:pdf.scoreVisualization.interpretations.poorTitle', this.language),
        description: this.t('reports:pdf.scoreVisualization.interpretations.poorDescription', this.language),
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
       .text(this.t('reports:pdf.scoreVisualization.detailedMetricsBreakdown', this.language), this.margins.left, doc.y);
    
    doc.y += 25;
    
    // Metrics grid
    const metrics = [
      { label: this.t('reports:pdf.scoreVisualization.metrics.totalIssues', this.language), value: this.formatNumber(reportData.summary.totalViolations, this.language), color: this.grayColor },
      { label: this.t('reports:pdf.scoreVisualization.metrics.critical', this.language), value: this.formatNumber(reportData.summary.criticalViolations, this.language), color: this.criticalColor },
      { label: this.t('reports:pdf.scoreVisualization.metrics.serious', this.language), value: this.formatNumber(reportData.summary.seriousViolations, this.language), color: this.seriousColor },
      { label: this.t('reports:pdf.scoreVisualization.metrics.moderate', this.language), value: this.formatNumber(reportData.summary.moderateViolations, this.language), color: this.warningColor },
      { label: this.t('reports:pdf.scoreVisualization.metrics.minor', this.language), value: this.formatNumber(reportData.summary.minorViolations, this.language), color: this.lightGrayColor },
      { label: this.t('reports:pdf.scoreVisualization.metrics.imagesWithoutAlt', this.language), value: this.formatNumber(reportData.summary.imagesWithoutAlt, this.language), color: this.errorColor }
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
    // Single unified accessibility score
    const score = { 
      label: this.t('reports:pdf.scoreVisualization.scoreCards.wcagCompliance', this.language), 
      value: reportData.scores.overall 
    };
    
    this.addProgressBar(doc, this.margins.left, doc.y, score);
    doc.y += 45;
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