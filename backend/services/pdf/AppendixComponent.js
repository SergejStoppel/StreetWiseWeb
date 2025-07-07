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
  addAppendix(doc, reportData, language = 'en') {
    // Temporarily set reportData for footer generation
    this.reportData = reportData;
    this.language = language;
    this.addPage(doc);
    this.addSectionHeader(doc, this.t('reports:pdf.appendix.title', language));
    
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
       .text(this.t('reports:pdf.appendix.methodology.title', this.language), this.margins.left, doc.y);
    
    doc.y += 25;

    // Professional methodology description
    this.addContentBox(doc, this.margins.left, doc.y, this.contentWidth, 120, 'white', this.borderColor);

    doc.fontSize(11)
       .fillColor(this.textColor)
       .text(this.t('reports:pdf.appendix.methodology.description', this.language), 
             this.margins.left + 20, doc.y + 15);

    const tools = [
      this.t('reports:pdf.appendix.methodology.tools.axeCore', this.language),
      this.t('reports:pdf.appendix.methodology.tools.wcagValidation', this.language),
      this.t('reports:pdf.appendix.methodology.tools.browserTesting', this.language),
      this.t('reports:pdf.appendix.methodology.tools.heuristicEvaluation', this.language),
      this.t('reports:pdf.appendix.methodology.tools.colorContrast', this.language),
      this.t('reports:pdf.appendix.methodology.tools.keyboardTesting', this.language),
      this.t('reports:pdf.appendix.methodology.tools.screenReaderTesting', this.language)
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
       .text(this.t('reports:pdf.appendix.wcag.title', this.language), this.margins.left, doc.y);
    
    doc.y += 25;

    const principles = [
      {
        title: this.t('reports:pdf.appendix.wcag.principles.perceivable.title', this.language),
        description: this.t('reports:pdf.appendix.wcag.principles.perceivable.description', this.language),
        guidelines: [
          this.t('reports:pdf.appendix.wcag.principles.perceivable.guidelines.textAlternatives', this.language),
          this.t('reports:pdf.appendix.wcag.principles.perceivable.guidelines.multimedia', this.language),
          this.t('reports:pdf.appendix.wcag.principles.perceivable.guidelines.adaptable', this.language),
          this.t('reports:pdf.appendix.wcag.principles.perceivable.guidelines.distinguishable', this.language)
        ]
      },
      {
        title: this.t('reports:pdf.appendix.wcag.principles.operable.title', this.language), 
        description: this.t('reports:pdf.appendix.wcag.principles.operable.description', this.language),
        guidelines: [
          this.t('reports:pdf.appendix.wcag.principles.operable.guidelines.keyboard', this.language),
          this.t('reports:pdf.appendix.wcag.principles.operable.guidelines.timing', this.language),
          this.t('reports:pdf.appendix.wcag.principles.operable.guidelines.seizures', this.language),
          this.t('reports:pdf.appendix.wcag.principles.operable.guidelines.navigable', this.language)
        ]
      },
      {
        title: this.t('reports:pdf.appendix.wcag.principles.understandable.title', this.language),
        description: this.t('reports:pdf.appendix.wcag.principles.understandable.description', this.language),
        guidelines: [
          this.t('reports:pdf.appendix.wcag.principles.understandable.guidelines.readable', this.language),
          this.t('reports:pdf.appendix.wcag.principles.understandable.guidelines.predictable', this.language),
          this.t('reports:pdf.appendix.wcag.principles.understandable.guidelines.inputAssistance', this.language)
        ]
      },
      {
        title: this.t('reports:pdf.appendix.wcag.principles.robust.title', this.language),
        description: this.t('reports:pdf.appendix.wcag.principles.robust.description', this.language),
        guidelines: [
          this.t('reports:pdf.appendix.wcag.principles.robust.guidelines.compatible', this.language),
          this.t('reports:pdf.appendix.wcag.principles.robust.guidelines.semantic', this.language),
          this.t('reports:pdf.appendix.wcag.principles.robust.guidelines.futureProof', this.language)
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
       .text(this.t('reports:pdf.appendix.compliance.title', this.language), this.margins.left, doc.y);
    
    doc.y += 25;

    // Legal considerations box
    this.addContentBox(doc, this.margins.left, doc.y, this.contentWidth, 100, '#fef3c7', this.warningColor);

    doc.fontSize(11)
       .fillColor(this.textColor)
       .text(this.t('reports:pdf.appendix.compliance.importantConsiderations', this.language), this.margins.left + 20, doc.y + 15);

    const legalPoints = [
      this.t('reports:pdf.appendix.compliance.points.ada', this.language),
      this.t('reports:pdf.appendix.compliance.points.section508', this.language),
      this.t('reports:pdf.appendix.compliance.points.eaa', this.language),
      this.t('reports:pdf.appendix.compliance.points.wcag', this.language)
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
        description: this.t('reports:pdf.appendix.compliance.standards.ada.description', this.language)
      },
      {
        standard: 'Section 508',
        description: this.t('reports:pdf.appendix.compliance.standards.section508.description', this.language)
      },
      {
        standard: 'EN 301 549',
        description: this.t('reports:pdf.appendix.compliance.standards.en301549.description', this.language)
      },
      {
        standard: 'AODA',
        description: this.t('reports:pdf.appendix.compliance.standards.aoda.description', this.language)
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
       .text(this.t('reports:pdf.appendix.resources.title', this.language), this.margins.left, doc.y);
    
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
      this.t('reports:pdf.appendix.resources.professional.webaim', this.language),
      this.t('reports:pdf.appendix.resources.professional.a11yProject', this.language),
      this.t('reports:pdf.appendix.resources.professional.dequeUniversity', this.language),
      this.t('reports:pdf.appendix.resources.professional.iaap', this.language),
      this.t('reports:pdf.appendix.resources.professional.mdn', this.language)
    ];

    doc.fontSize(11)
       .fillColor(this.textColor)
       .text(this.t('reports:pdf.appendix.resources.professionalTitle', this.language), this.margins.left, doc.y);

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
       .text(this.t('reports:pdf.appendix.resources.testingTitle', this.language), this.margins.left, doc.y);

    doc.y += 20;

    const testingTools = [
      this.t('reports:pdf.appendix.resources.testing.colorContrast', this.language),
      this.t('reports:pdf.appendix.resources.testing.nvda', this.language),
      this.t('reports:pdf.appendix.resources.testing.voiceOver', this.language),
      this.t('reports:pdf.appendix.resources.testing.chromeDevTools', this.language),
      this.t('reports:pdf.appendix.resources.testing.axeDevTools', this.language)
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
       .text(this.t('reports:pdf.appendix.contact.title', this.language), this.margins.left + 20, doc.y + 15)
       .fontSize(10)
       .fillColor(this.grayColor)
       .text(this.t('reports:pdf.appendix.contact.description1', this.language), 
             this.margins.left + 20, doc.y + 35)
       .text(this.t('reports:pdf.appendix.contact.description2', this.language), 
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
       .text(this.t('reports:pdf.appendix.techSpecs.title', this.language), this.margins.left, doc.y);
    
    doc.y += 25;

    const specs = [
      { label: this.t('reports:pdf.appendix.techSpecs.analysisEngine', this.language), value: 'Axe-core v4.7+' },
      { label: this.t('reports:pdf.appendix.techSpecs.browserEngine', this.language), value: 'Chromium (Puppeteer)' },
      { label: this.t('reports:pdf.appendix.techSpecs.standardsCompliance', this.language), value: 'WCAG 2.1 Level AA' },
      { label: this.t('reports:pdf.appendix.techSpecs.reportGeneration', this.language), value: new Date().toLocaleDateString() },
      { label: this.t('reports:pdf.appendix.techSpecs.analysisScope', this.language), value: this.t('reports:pdf.appendix.techSpecs.analysisScopeValue', this.language) },
      { label: this.t('reports:pdf.appendix.techSpecs.manualTesting', this.language), value: this.t('reports:pdf.appendix.techSpecs.manualTestingValue', this.language) }
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
       .text(this.t('reports:pdf.appendix.glossary.title', this.language), this.margins.left, doc.y);
    
    doc.y += 25;

    const terms = [
      { term: this.t('reports:pdf.appendix.glossary.terms.altText.term', this.language), definition: this.t('reports:pdf.appendix.glossary.terms.altText.definition', this.language) },
      { term: this.t('reports:pdf.appendix.glossary.terms.aria.term', this.language), definition: this.t('reports:pdf.appendix.glossary.terms.aria.definition', this.language) },
      { term: this.t('reports:pdf.appendix.glossary.terms.focusManagement.term', this.language), definition: this.t('reports:pdf.appendix.glossary.terms.focusManagement.definition', this.language) },
      { term: this.t('reports:pdf.appendix.glossary.terms.screenReader.term', this.language), definition: this.t('reports:pdf.appendix.glossary.terms.screenReader.definition', this.language) },
      { term: this.t('reports:pdf.appendix.glossary.terms.semanticHtml.term', this.language), definition: this.t('reports:pdf.appendix.glossary.terms.semanticHtml.definition', this.language) },
      { term: this.t('reports:pdf.appendix.glossary.terms.skipLinks.term', this.language), definition: this.t('reports:pdf.appendix.glossary.terms.skipLinks.definition', this.language) }
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