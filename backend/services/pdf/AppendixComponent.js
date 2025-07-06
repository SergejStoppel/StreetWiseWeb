/**
 * AppendixComponent - Technical appendix and reference materials
 * 
 * This module creates the technical appendix including methodology documentation,
 * WCAG guidelines reference, legal compliance information, and professional
 * resources. It provides comprehensive background information for technical teams.
 */

const BasePDFDocument = require('./BasePDFDocument');

class AppendixComponent extends BasePDFDocument {
  /**
   * Add the complete appendix section
   */
  addAppendix(doc, reportData) {
    // Temporarily set reportData for footer generation
    this.reportData = reportData;
    this.addPage(doc);
    this.addSectionHeader(doc, 'Appendix & Technical Reference');
    
    // Testing methodology
    this.addMethodologySection(doc);
    
    // WCAG guidelines reference
    this.addWCAGReference(doc);
    
    // Legal compliance information
    this.addComplianceInfo(doc);
    
    // Next steps and resources
    this.addResourcesSection(doc);
    
    return doc.y;
  }

  /**
   * Add testing methodology and tools documentation
   */
  addMethodologySection(doc) {
    doc.fontSize(14)
       .fillColor(this.textColor)
       .text('Testing Methodology & Tools', this.margins.left, doc.y);
    
    doc.y += 25;

    // Professional methodology description
    this.addContentBox(doc, this.margins.left, doc.y, this.contentWidth, 120, 'white', this.borderColor);

    doc.fontSize(11)
       .fillColor(this.textColor)
       .text('Our comprehensive accessibility analysis employs industry-leading tools and methodologies:', 
             this.margins.left + 20, doc.y + 15);

    const tools = [
      '• Axe-core v4.7+ - Deque Systems\' accessibility testing engine',
      '• WCAG 2.1 Level AA compliance validation',
      '• Automated browser testing with Puppeteer',
      '• Custom heuristic evaluation for usability',
      '• Color contrast analysis and measurement',
      '• Keyboard navigation pathway testing',
      '• Screen reader compatibility assessment'
    ];

    tools.forEach((tool, index) => {
      doc.fontSize(10)
         .fillColor(this.grayColor)
         .text(tool, this.margins.left + 30, doc.y + 35 + (index * 12));
    });

    doc.y += 140;
  }

  /**
   * Add comprehensive WCAG 2.1 guidelines reference
   */
  addWCAGReference(doc) {
    doc.fontSize(14)
       .fillColor(this.textColor)
       .text('WCAG 2.1 Level AA Guidelines Reference', this.margins.left, doc.y);
    
    doc.y += 25;

    const principles = [
      {
        title: 'Perceivable',
        description: 'Information and UI components must be presentable to users in ways they can perceive',
        guidelines: [
          'Text alternatives for images and non-text content',
          'Captions and alternatives for multimedia',
          'Content can be presented without losing meaning',
          'Sufficient color contrast between text and background'
        ]
      },
      {
        title: 'Operable', 
        description: 'User interface components and navigation must be operable',
        guidelines: [
          'All functionality available via keyboard',
          'Users have enough time to read content',
          'Content does not cause seizures or physical reactions',
          'Users can navigate and find content'
        ]
      },
      {
        title: 'Understandable',
        description: 'Information and the operation of user interface must be understandable',
        guidelines: [
          'Text is readable and understandable',
          'Web pages appear and operate predictably',
          'Users are helped to avoid and correct mistakes'
        ]
      },
      {
        title: 'Robust',
        description: 'Content must be robust enough for interpretation by assistive technologies',
        guidelines: [
          'Maximize compatibility with assistive technologies',
          'Valid, semantic HTML markup',
          'Future-proof accessibility implementations'
        ]
      }
    ];

    principles.forEach((principle, index) => {
      this.addWCAGPrinciple(doc, principle);
    });
  }

  /**
   * Add individual WCAG principle with guidelines
   */
  addWCAGPrinciple(doc, principle) {
    this.checkPageBreak(doc, 100);

    // Principle header
    doc.rect(this.margins.left, doc.y, this.contentWidth, 25)
       .fill(this.primaryColor);
    
    doc.fontSize(12)
       .fillColor('white')
       .text(principle.title, this.margins.left + 15, doc.y + 8);

    doc.y += 35;

    // Description
    doc.fontSize(10)
       .fillColor(this.textColor)
       .text(principle.description, this.margins.left + 20, doc.y);

    doc.y += 20;

    // Guidelines
    principle.guidelines.forEach(guideline => {
      doc.fontSize(9)
         .fillColor(this.grayColor)
         .text(`• ${guideline}`, this.margins.left + 30, doc.y);
      doc.y += 12;
    });

    doc.y += 10;
  }

  /**
   * Add legal compliance and standards information
   */
  addComplianceInfo(doc) {
    this.checkPageBreak(doc, 120);

    doc.fontSize(14)
       .fillColor(this.textColor)
       .text('Legal Compliance & Standards', this.margins.left, doc.y);
    
    doc.y += 25;

    // Legal considerations box
    this.addContentBox(doc, this.margins.left, doc.y, this.contentWidth, 100, '#fef3c7', this.warningColor);

    doc.fontSize(11)
       .fillColor(this.textColor)
       .text('Important Legal Considerations:', this.margins.left + 20, doc.y + 15);

    const legalPoints = [
      'Americans with Disabilities Act (ADA) compliance requirements',
      'Section 508 federal accessibility standards',
      'European Accessibility Act (EAA) for EU businesses',
      'WCAG 2.1 AA as the recognized international standard'
    ];

    legalPoints.forEach((point, index) => {
      doc.fontSize(10)
         .fillColor(this.grayColor)
         .text(`• ${point}`, this.margins.left + 30, doc.y + 35 + (index * 15));
    });

    doc.y += 120;

    // Additional compliance information
    this.addComplianceDetails(doc);
  }

  /**
   * Add detailed compliance information
   */
  addComplianceDetails(doc) {
    const complianceInfo = [
      {
        standard: 'ADA Title III',
        description: 'Applies to businesses open to the public, requiring accessible websites for equal access'
      },
      {
        standard: 'Section 508',
        description: 'Federal agencies must ensure electronic information is accessible to people with disabilities'
      },
      {
        standard: 'EN 301 549',
        description: 'European standard for ICT accessibility requirements in public procurement'
      },
      {
        standard: 'AODA',
        description: 'Accessibility for Ontarians with Disabilities Act - applies to Ontario businesses'
      }
    ];

    complianceInfo.forEach(info => {
      this.checkPageBreak(doc, 40);
      
      doc.fontSize(11)
         .fillColor(this.textColor)
         .text(info.standard, this.margins.left + 20, doc.y)
         .fontSize(9)
         .fillColor(this.grayColor)
         .text(info.description, this.margins.left + 30, doc.y + 15, { width: this.contentWidth - 60 });
      
      doc.y += 35;
    });
  }

  /**
   * Add professional resources and next steps
   */
  addResourcesSection(doc) {
    this.checkPageBreak(doc, 150);

    doc.fontSize(14)
       .fillColor(this.textColor)
       .text('Recommended Resources & Next Steps', this.margins.left, doc.y);
    
    doc.y += 25;

    // Professional development resources
    this.addProfessionalResources(doc);
    
    // Testing tools and resources
    this.addTestingResources(doc);
    
    // Contact information
    this.addContactInfo(doc);
  }

  /**
   * Add professional development resources
   */
  addProfessionalResources(doc) {
    const resources = [
      'WebAIM (webaim.org) - Comprehensive accessibility training and resources',
      'A11y Project (a11yproject.com) - Community-driven accessibility checklist',
      'Deque University - Professional accessibility training courses',
      'IAAP Certification - International Association of Accessibility Professionals',
      'MDN Accessibility Docs - Mozilla Developer Network accessibility guide'
    ];

    doc.fontSize(11)
       .fillColor(this.textColor)
       .text('Professional Development Resources:', this.margins.left, doc.y);

    doc.y += 20;

    resources.forEach(resource => {
      doc.fontSize(10)
         .fillColor(this.grayColor)
         .text(`• ${resource}`, this.margins.left + 20, doc.y);
      doc.y += 15;
    });

    doc.y += 10;
  }

  /**
   * Add testing tools and resources
   */
  addTestingResources(doc) {
    doc.fontSize(11)
       .fillColor(this.textColor)
       .text('Testing Tools & Software:', this.margins.left, doc.y);

    doc.y += 20;

    const testingTools = [
      'Color Contrast Analyzer - Free desktop application for contrast testing',
      'NVDA Screen Reader - Free screen reader for Windows testing',
      'VoiceOver - Built-in macOS screen reader for testing',
      'Chrome DevTools Accessibility Panel - Built-in browser testing tools',
      'axe DevTools Browser Extension - Browser-based accessibility testing'
    ];

    testingTools.forEach(tool => {
      doc.fontSize(10)
         .fillColor(this.grayColor)
         .text(`• ${tool}`, this.margins.left + 20, doc.y);
      doc.y += 15;
    });

    doc.y += 20;
  }

  /**
   * Add contact and support information
   */
  addContactInfo(doc) {
    // Contact information box
    this.addContentBox(doc, this.margins.left, doc.y, this.contentWidth, 80, this.backgroundColor, this.borderColor);

    doc.fontSize(12)
       .fillColor(this.textColor)
       .text('Questions about this report?', this.margins.left + 20, doc.y + 15)
       .fontSize(10)
       .fillColor(this.grayColor)
       .text('Contact our accessibility experts for implementation support, training, and consulting services.', 
             this.margins.left + 20, doc.y + 35)
       .text('We provide ongoing support to help your team achieve and maintain accessibility compliance.', 
             this.margins.left + 20, doc.y + 55);

    doc.y += 100;
  }

  /**
   * Add technical specifications section
   */
  addTechnicalSpecs(doc, reportData) {
    this.checkPageBreak(doc, 100);

    doc.fontSize(14)
       .fillColor(this.textColor)
       .text('Technical Specifications', this.margins.left, doc.y);
    
    doc.y += 25;

    const specs = [
      { label: 'Analysis Engine', value: 'Axe-core v4.7+' },
      { label: 'Browser Engine', value: 'Chromium (Puppeteer)' },
      { label: 'Standards Compliance', value: 'WCAG 2.1 Level AA' },
      { label: 'Report Generation', value: new Date().toLocaleDateString() },
      { label: 'Analysis Scope', value: 'Single page automated scan' },
      { label: 'Manual Testing', value: 'Heuristic evaluation included' }
    ];

    specs.forEach(spec => {
      doc.fontSize(10)
         .fillColor(this.textColor)
         .text(`${spec.label}:`, this.margins.left + 20, doc.y)
         .fillColor(this.grayColor)
         .text(spec.value, this.margins.left + 150, doc.y);
      doc.y += 15;
    });

    doc.y += 20;
  }

  /**
   * Add glossary of accessibility terms
   */
  addGlossary(doc) {
    this.checkPageBreak(doc, 150);

    doc.fontSize(14)
       .fillColor(this.textColor)
       .text('Accessibility Glossary', this.margins.left, doc.y);
    
    doc.y += 25;

    const terms = [
      { term: 'Alt Text', definition: 'Alternative text that describes images for screen readers' },
      { term: 'ARIA', definition: 'Accessible Rich Internet Applications - attributes that enhance HTML semantics' },
      { term: 'Focus Management', definition: 'Controlling where keyboard focus moves through interactive elements' },
      { term: 'Screen Reader', definition: 'Assistive technology that reads web content aloud for blind users' },
      { term: 'Semantic HTML', definition: 'HTML that uses meaningful elements to describe content structure' },
      { term: 'Skip Links', definition: 'Hidden links that allow keyboard users to skip to main content' }
    ];

    terms.forEach(item => {
      this.checkPageBreak(doc, 25);
      
      doc.fontSize(10)
         .fillColor(this.textColor)
         .text(item.term, this.margins.left + 20, doc.y)
         .fontSize(9)
         .fillColor(this.grayColor)
         .text(item.definition, this.margins.left + 30, doc.y + 12, { width: this.contentWidth - 60 });
      
      doc.y += 30;
    });
  }
}

module.exports = AppendixComponent;