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
  addRecommendations(doc, reportData) {
    // Temporarily set reportData for footer generation
    this.reportData = reportData;
    this.addPage(doc);
    this.addSectionHeader(doc, 'Strategic Recommendations & Action Plan');
    
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
       .text('Priority Implementation Matrix', this.margins.left, doc.y);
    
    doc.y += 25;
    
    const priorities = [
      { 
        level: 'HIGH', 
        color: this.errorColor, 
        timeframe: 'Immediate (1-2 weeks)', 
        description: 'Critical accessibility barriers' 
      },
      { 
        level: 'MEDIUM', 
        color: this.warningColor, 
        timeframe: 'Short-term (2-4 weeks)', 
        description: 'Important improvements' 
      },
      { 
        level: 'LOW', 
        color: this.successColor, 
        timeframe: 'Long-term (1-3 months)', 
        description: 'Enhancement opportunities' 
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
       .text(`Category: ${recommendation.category}`, x, y + 20);
    
    // Description
    doc.fontSize(10)
       .fillColor(this.textColor)
       .text(recommendation.description, x, y + 35, { width: this.contentWidth - 120, lineGap: 2 });
    
    // Action items
    doc.fontSize(10)
       .fillColor(this.accentColor)
       .text('→ Action Required: ', x, y + 60)
       .fillColor(this.textColor)
       .text(recommendation.action, x + 105, y + 60, { width: this.contentWidth - 225 });
  }

  /**
   * Add implementation timeline with phased approach
   */
  addImplementationTimeline(doc, recommendations) {
    this.addPage(doc);
    this.addSectionHeader(doc, 'Implementation Timeline & Code Examples');
    
    // Timeline phases
    const phases = [
      {
        phase: 'Phase 1: Critical Issues (Week 1-2)',
        items: recommendations.filter(r => r.priority === 'high'),
        color: this.errorColor
      },
      {
        phase: 'Phase 2: Important Improvements (Week 3-6)',
        items: recommendations.filter(r => r.priority === 'medium'),
        color: this.warningColor
      },
      {
        phase: 'Phase 3: Enhancement & Optimization (Month 2-3)',
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
       .text('Common Implementation Examples', this.margins.left, doc.y);
    
    doc.y += 30;
    
    const examples = [
      {
        title: 'Adding Alt Text to Images',
        before: '<img src="logo.png">',
        after: '<img src="logo.png" alt="Company Logo - Home">',
        explanation: 'Provide descriptive alternative text for screen readers'
      },
      {
        title: 'Proper Form Labeling',
        before: '<input type="email" placeholder="Email">',
        after: '<label for="email">Email Address</label>\n<input type="email" id="email" placeholder="email@example.com">',
        explanation: 'Associate labels with form controls for accessibility'
      },
      {
        title: 'Keyboard Navigation Support',
        before: '<div onclick="handleClick()">Click me</div>',
        after: '<button onclick="handleClick()" aria-label="Submit form">Click me</button>',
        explanation: 'Use semantic HTML elements for proper keyboard support'
      },
      {
        title: 'Color Contrast Improvement',
        before: 'color: #999; background: #fff; /* 2.85:1 ratio */',
        after: 'color: #666; background: #fff; /* 4.54:1 ratio */',
        explanation: 'Ensure sufficient contrast for text readability'
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
    this.addCodeSection(doc, 'Before (Inaccessible):', example.before, '#fef2f2', this.errorColor);
    
    // After code section
    this.addCodeSection(doc, 'After (Accessible):', example.after, '#f0fdf4', this.successColor);
    
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
       .text('Implementation Best Practices', this.margins.left, doc.y);
    
    doc.y += 25;
    
    const practices = [
      'Test with actual screen readers (NVDA, JAWS, VoiceOver)',
      'Implement keyboard navigation testing in your workflow',
      'Use automated testing tools as part of CI/CD pipeline',
      'Involve users with disabilities in testing when possible',
      'Document accessibility decisions and patterns',
      'Train development team on accessibility principles'
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
       .text('Recommended Tools & Resources', this.margins.left, doc.y);
    
    doc.y += 25;
    
    const resources = [
      { category: 'Testing Tools', items: ['axe DevTools', 'WAVE Browser Extension', 'Lighthouse Accessibility Audit'] },
      { category: 'Design Tools', items: ['Colour Contrast Analyser', 'Stark (Figma/Sketch)', 'Adobe Color Accessibility'] },
      { category: 'Development', items: ['eslint-plugin-jsx-a11y', 'react-axe', 'Pa11y command line tool'] }
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