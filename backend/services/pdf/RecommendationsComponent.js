/**
 * RecommendationsComponent - Strategic recommendations and implementation timeline
 * 
 * This module creates professional recommendations sections including priority matrices,
 * implementation timelines, code examples, and actionable guidance for development teams.
 * It provides clear roadmaps for accessibility improvements with realistic timeframes.
 */

const BasePDFDocument = require('./BasePDFDocument');

class RecommendationsComponent extends BasePDFDocument {
  /**
   * Add the complete recommendations section
   */
  addRecommendations(doc, reportData, language = 'en') {
    // Temporarily set reportData for footer generation
    this.reportData = reportData;
    this.language = language;
    this.addPage(doc);
    this.addSectionHeader(doc, this.t('reports:pdf.recommendations.strategicRecommendationsTitle', language));
    
    // Priority matrix explanation
    this.addPriorityMatrix(doc);
    
    // Individual recommendations
    reportData.recommendations.forEach((rec, index) => {
      this.addEnhancedRecommendationItem(doc, rec, index + 1);
    });
    
    // Implementation timeline
    this.addImplementationTimeline(doc, reportData.recommendations);
    
    return doc.y;
  }

  /**
   * Add priority matrix legend and explanation
   */
  addPriorityMatrix(doc) {
    doc.fontSize(14)
       .fillColor(this.textColor)
       .text(this.t('reports:pdf.recommendations.priorityMatrixTitle', this.language), this.margins.left, doc.y);
    
    doc.y += 25;
    
    const priorities = [
      { 
        level: this.t('reports:pdf.recommendations.priorityLevels.high', this.language), 
        color: this.errorColor, 
        timeframe: this.t('reports:pdf.recommendations.timeframes.immediate', this.language), 
        description: this.t('reports:pdf.recommendations.descriptions.critical', this.language) 
      },
      { 
        level: this.t('reports:pdf.recommendations.priorityLevels.medium', this.language), 
        color: this.warningColor, 
        timeframe: this.t('reports:pdf.recommendations.timeframes.shortTerm', this.language), 
        description: this.t('reports:pdf.recommendations.descriptions.important', this.language) 
      },
      { 
        level: this.t('reports:pdf.recommendations.priorityLevels.low', this.language), 
        color: this.successColor, 
        timeframe: this.t('reports:pdf.recommendations.timeframes.longTerm', this.language), 
        description: this.t('reports:pdf.recommendations.descriptions.enhancement', this.language) 
      }
    ];
    
    priorities.forEach((priority, index) => {
      const y = doc.y + (index * 25);
      
      // Priority color indicator
      doc.rect(this.margins.left + 20, y, 15, 15)
         .fill(priority.color);
      
      doc.fontSize(11)
         .fillColor(this.textColor)
         .text(priority.level, this.margins.left + 45, y + 3)
         .fontSize(9)
         .fillColor(this.grayColor)
         .text(priority.timeframe, this.margins.left + 90, y + 3)
         .text(priority.description, this.margins.left + 200, y + 3);
    });
    
    doc.y += 90;
  }

  /**
   * Add enhanced recommendation item with visual priority indicators
   */
  addEnhancedRecommendationItem(doc, recommendation, index) {
    this.checkPageBreak(doc, 120);
    
    const priorityColor = this.getPriorityColor(recommendation.priority);
    const cardHeight = 100;
    
    // Recommendation card
    this.addContentBox(doc, this.margins.left, doc.y, this.contentWidth, cardHeight, 'white', this.borderColor);
    
    // Priority indicator strip
    doc.rect(this.margins.left, doc.y, 8, cardHeight)
       .fill(priorityColor);
    
    // Priority badge
    this.addPriorityBadge(doc, this.contentWidth - 80, doc.y + 10, recommendation.priority, priorityColor);
    
    // Recommendation content
    this.addRecommendationContent(doc, recommendation, index, this.margins.left + 20, doc.y + 15);
    
    doc.y += cardHeight + 15;
  }

  /**
   * Add priority badge in top right corner
   */
  addPriorityBadge(doc, x, y, priority, color) {
    doc.rect(x, y, 80, 20)
       .fill(color);
    
    doc.fontSize(9)
       .fillColor('white')
       .text(priority.toUpperCase(), x + 10, y + 7, { width: 60, align: 'center' });
  }

  /**
   * Add recommendation content (title, description, action)
   */
  addRecommendationContent(doc, recommendation, index, x, y) {
    // Title
    doc.fontSize(13)
       .fillColor(this.textColor)
       .text(`${index}. ${recommendation.title}`, x, y, { width: this.contentWidth - 120 });
    
    // Category
    doc.fontSize(9)
       .fillColor(this.grayColor)
       .text(`${this.t('reports:pdf.recommendations.categoryLabel', this.language)}: ${recommendation.category}`, x, y + 20);
    
    // Description
    doc.fontSize(10)
       .fillColor(this.textColor)
       .text(recommendation.description, x, y + 35, { width: this.contentWidth - 120, lineGap: 2 });
    
    // Action items
    doc.fontSize(10)
       .fillColor(this.accentColor)
       .text(this.t('reports:pdf.recommendations.actionRequiredLabel', this.language), x, y + 60)
       .fillColor(this.textColor)
       .text(recommendation.action, x + 105, y + 60, { width: this.contentWidth - 225 });
  }

  /**
   * Add implementation timeline with phased approach
   */
  addImplementationTimeline(doc, recommendations) {
    this.addPage(doc);
    this.addSectionHeader(doc, this.t('reports:pdf.recommendations.implementationTimelineTitle', this.language));
    
    // Timeline phases
    const phases = [
      {
        phase: this.t('reports:pdf.recommendations.phases.phase1', this.language),
        items: recommendations.filter(r => r.priority === 'high'),
        color: this.errorColor
      },
      {
        phase: this.t('reports:pdf.recommendations.phases.phase2', this.language),
        items: recommendations.filter(r => r.priority === 'medium'),
        color: this.warningColor
      },
      {
        phase: this.t('reports:pdf.recommendations.phases.phase3', this.language),
        items: recommendations.filter(r => r.priority === 'low'),
        color: this.successColor
      }
    ];
    
    phases.forEach((phase, index) => {
      if (phase.items.length > 0) {
        this.addTimelinePhase(doc, phase, index + 1);
      }
    });
    
    // Add code examples section
    this.addCodeExamples(doc);
  }

  /**
   * Add individual timeline phase
   */
  addTimelinePhase(doc, phase, phaseNumber) {
    this.checkPageBreak(doc, 100);
    
    // Phase header
    doc.rect(this.margins.left, doc.y, this.contentWidth, 30)
       .fill(phase.color);
    
    doc.fontSize(14)
       .fillColor('white')
       .text(phase.phase, this.margins.left + 15, doc.y + 10);
    
    doc.y += 40;
    
    // Phase items
    phase.items.forEach((item, index) => {
      doc.fontSize(11)
         .fillColor(this.textColor)
         .text(`• ${item.title}`, this.margins.left + 20, doc.y)
         .fontSize(9)
         .fillColor(this.grayColor)
         .text(`${item.category}`, this.margins.left + 30, doc.y + 15);
      
      doc.y += 30;
    });
    
    doc.y += 10;
  }

  /**
   * Add practical code examples section
   */
  addCodeExamples(doc) {
    doc.fontSize(16)
       .fillColor(this.textColor)
       .text(this.t('reports:pdf.recommendations.codeExamplesTitle', this.language), this.margins.left, doc.y);
    
    doc.y += 30;
    
    const examples = [
      {
        title: this.t('reports:pdf.recommendations.examples.imageAlt.title', this.language),
        before: '<img src="logo.png">',
        after: '<img src="logo.png" alt="Company Logo - Home">',
        explanation: this.t('reports:pdf.recommendations.examples.imageAlt.explanation', this.language)
      },
      {
        title: this.t('reports:pdf.recommendations.examples.formLabeling.title', this.language),
        before: '<input type="email" placeholder="Email">',
        after: '<label for="email">Email Address</label>\n<input type="email" id="email" placeholder="email@example.com">',
        explanation: this.t('reports:pdf.recommendations.examples.formLabeling.explanation', this.language)
      },
      {
        title: this.t('reports:pdf.recommendations.examples.keyboardNav.title', this.language),
        before: '<div onclick="handleClick()">Click me</div>',
        after: '<button onclick="handleClick()" aria-label="Submit form">Click me</button>',
        explanation: this.t('reports:pdf.recommendations.examples.keyboardNav.explanation', this.language)
      },
      {
        title: this.t('reports:pdf.recommendations.examples.colorContrast.title', this.language),
        before: 'color: #999; background: #fff; /* 2.85:1 ratio */',
        after: 'color: #666; background: #fff; /* 4.54:1 ratio */',
        explanation: this.t('reports:pdf.recommendations.examples.colorContrast.explanation', this.language)
      }
    ];
    
    examples.forEach((example, index) => {
      this.addCodeExample(doc, example, index + 1);
    });
  }

  /**
   * Add individual code example with before/after comparison
   */
  addCodeExample(doc, example, index) {
    this.checkPageBreak(doc, 140);
    
    // Example title
    doc.fontSize(12)
       .fillColor(this.textColor)
       .text(`${index}. ${example.title}`, this.margins.left, doc.y);
    
    doc.y += 20;
    
    // Before code section
    this.addCodeSection(doc, this.t('reports:pdf.recommendations.codeLabels.before', this.language), example.before, '#fef2f2', this.errorColor);
    
    // After code section
    this.addCodeSection(doc, this.t('reports:pdf.recommendations.codeLabels.after', this.language), example.after, '#f0fdf4', this.successColor);
    
    // Explanation
    doc.fontSize(9)
       .fillColor(this.grayColor)
       .text(`💡 ${example.explanation}`, this.margins.left + 20, doc.y);
    
    doc.y += 25;
  }

  /**
   * Add code section with syntax highlighting background
   */
  addCodeSection(doc, label, code, bgColor, borderColor) {
    // Section label
    doc.fontSize(10)
       .fillColor(this.grayColor)
       .text(label, this.margins.left + 20, doc.y);
    
    doc.y += 15;
    
    // Calculate code box height based on content
    const lines = code.split('\n');
    const boxHeight = Math.max(25, lines.length * 12 + 10);
    
    // Code background
    this.addContentBox(doc, this.margins.left + 20, doc.y, this.contentWidth - 40, boxHeight, bgColor, borderColor);
    
    // Code text
    doc.fontSize(9)
       .fillColor(this.textColor)
       .text(code, this.margins.left + 30, doc.y + 8, { width: this.contentWidth - 60 });
    
    doc.y += boxHeight + 10;
  }

  /**
   * Add implementation best practices section
   */
  addBestPractices(doc) {
    this.checkPageBreak(doc, 120);
    
    doc.fontSize(14)
       .fillColor(this.textColor)
       .text(this.t('reports:pdf.recommendations.bestPracticesTitle', this.language), this.margins.left, doc.y);
    
    doc.y += 25;
    
    const practices = [
      this.t('reports:pdf.recommendations.bestPractices.screenReaders', this.language),
      this.t('reports:pdf.recommendations.bestPractices.keyboardTesting', this.language),
      this.t('reports:pdf.recommendations.bestPractices.automatedTesting', this.language),
      this.t('reports:pdf.recommendations.bestPractices.userTesting', this.language),
      this.t('reports:pdf.recommendations.bestPractices.documentation', this.language),
      this.t('reports:pdf.recommendations.bestPractices.training', this.language)
    ];
    
    practices.forEach(practice => {
      doc.fontSize(10)
         .fillColor(this.grayColor)
         .text(`• ${practice}`, this.margins.left + 20, doc.y);
      doc.y += 15;
    });
    
    doc.y += 20;
  }

  /**
   * Add resource recommendations
   */
  addResourceRecommendations(doc) {
    this.checkPageBreak(doc, 100);
    
    doc.fontSize(14)
       .fillColor(this.textColor)
       .text(this.t('reports:pdf.recommendations.resourcesTitle', this.language), this.margins.left, doc.y);
    
    doc.y += 25;
    
    const resources = [
      { category: this.t('reports:pdf.recommendations.resourceCategories.testing', this.language), items: ['axe DevTools', 'WAVE Browser Extension', 'Lighthouse Accessibility Audit'] },
      { category: this.t('reports:pdf.recommendations.resourceCategories.design', this.language), items: ['Colour Contrast Analyser', 'Stark (Figma/Sketch)', 'Adobe Color Accessibility'] },
      { category: this.t('reports:pdf.recommendations.resourceCategories.development', this.language), items: ['eslint-plugin-jsx-a11y', 'react-axe', 'Pa11y command line tool'] }
    ];
    
    resources.forEach(resource => {
      doc.fontSize(11)
         .fillColor(this.textColor)
         .text(resource.category, this.margins.left + 10, doc.y);
      
      doc.y += 15;
      
      resource.items.forEach(item => {
        doc.fontSize(9)
           .fillColor(this.grayColor)
           .text(`• ${item}`, this.margins.left + 20, doc.y);
        doc.y += 12;
      });
      
      doc.y += 10;
    });
  }
}

module.exports = RecommendationsComponent;