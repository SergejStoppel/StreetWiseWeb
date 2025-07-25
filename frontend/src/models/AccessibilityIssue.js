/**
 * AccessibilityIssue Model
 * Standardized data structure for accessibility issues
 */

export class AccessibilityIssue {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.title = data.title || '';
    this.description = data.description || '';
    this.severity = data.severity || 'moderate'; // critical, serious, moderate, minor
    this.category = data.category || 'general'; // forms, images, navigation, etc.
    this.wcagCriteria = data.wcagCriteria || [];
    this.elements = data.elements || [];
    this.codeExamples = data.codeExamples || [];
    this.remediation = data.remediation || {};
    this.metadata = data.metadata || {};
    this.timestamp = data.timestamp || new Date().toISOString();
    
    // Enhanced properties
    this.userBenefit = data.userBenefit || '';
    this.estimatedFixTime = data.estimatedFixTime || 30; // minutes
    this.businessImpact = data.businessImpact || 'medium';
    this.testingInstructions = data.testingInstructions || '';
    this.relatedIssues = data.relatedIssues || [];
  }

  generateId() {
    return `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Getters for computed properties
  get elementCount() {
    return this.elements.length;
  }

  get disabilityGroups() {
    const groups = new Set();
    this.wcagCriteria.forEach(criterion => {
      if (criterion.disabilityGroups) {
        criterion.disabilityGroups.forEach(group => groups.add(group));
      }
    });
    return Array.from(groups);
  }

  get wcagLevel() {
    const levels = this.wcagCriteria.map(c => c.level).filter(Boolean);
    if (levels.includes('AAA')) return 'AAA';
    if (levels.includes('AA')) return 'AA';
    if (levels.includes('A')) return 'A';
    return 'Unknown';
  }

  get severityScore() {
    const scores = {
      critical: 4,
      serious: 3,
      moderate: 2,
      minor: 1
    };
    return scores[this.severity] || 0;
  }

  // Methods
  addElement(element) {
    this.elements.push({
      selector: element.selector,
      html: element.html,
      domPath: element.domPath,
      context: element.context,
      position: element.position
    });
  }

  addCodeExample(example) {
    this.codeExamples.push({
      type: example.type, // 'incorrect', 'correct', 'context'
      language: example.language || 'html',
      code: example.code,
      description: example.description,
      lineNumbers: example.lineNumbers
    });
  }

  addWcagCriterion(criterion) {
    this.wcagCriteria.push({
      id: criterion.id,
      title: criterion.title,
      level: criterion.level,
      guideline: criterion.guideline,
      successCriteria: criterion.successCriteria,
      disabilityGroups: criterion.disabilityGroups,
      techniques: criterion.techniques || []
    });
  }

  setRemediation(remediation) {
    this.remediation = {
      summary: remediation.summary,
      steps: remediation.steps || [],
      timeEstimate: remediation.timeEstimate,
      difficulty: remediation.difficulty,
      tools: remediation.tools || [],
      resources: remediation.resources || []
    };
  }

  // Validation
  isValid() {
    return !!(this.title && this.description && this.severity && this.elements.length > 0);
  }

  // Serialization
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      severity: this.severity,
      category: this.category,
      wcagCriteria: this.wcagCriteria,
      elements: this.elements,
      codeExamples: this.codeExamples,
      remediation: this.remediation,
      metadata: this.metadata,
      timestamp: this.timestamp,
      userBenefit: this.userBenefit,
      estimatedFixTime: this.estimatedFixTime,
      businessImpact: this.businessImpact,
      testingInstructions: this.testingInstructions,
      relatedIssues: this.relatedIssues
    };
  }

  // Create from existing data
  static fromJSON(json) {
    return new AccessibilityIssue(json);
  }

  // Factory methods for common issue types
  static createImageIssue(elements, missingAlt = true) {
    return new AccessibilityIssue({
      title: missingAlt ? 'Images Missing Alt Text' : 'Images with Poor Alt Text',
      description: missingAlt 
        ? 'Images without alternative text are invisible to screen readers'
        : 'Images have alt text that doesn\'t adequately describe the content',
      severity: 'critical',
      category: 'images',
      elements: elements,
      wcagCriteria: [{
        id: '1.1.1',
        title: 'Non-text Content',
        level: 'A',
        guideline: 'Perceivable',
        disabilityGroups: ['Blind', 'Low Vision']
      }]
    });
  }

  static createFormIssue(elements) {
    return new AccessibilityIssue({
      title: 'Form Fields Without Labels',
      description: 'Form fields without proper labels make it impossible for screen reader users to understand what information is required',
      severity: 'critical',
      category: 'forms',
      elements: elements,
      wcagCriteria: [{
        id: '1.3.1',
        title: 'Info and Relationships',
        level: 'A',
        guideline: 'Perceivable',
        disabilityGroups: ['Blind', 'Cognitive']
      }]
    });
  }

  static createColorContrastIssue(elements) {
    return new AccessibilityIssue({
      title: 'Color Contrast Issues',
      description: 'Poor color contrast makes text difficult to read for users with visual impairments',
      severity: 'serious',
      category: 'color',
      elements: elements,
      wcagCriteria: [{
        id: '1.4.3',
        title: 'Contrast (Minimum)',
        level: 'AA',
        guideline: 'Perceivable',
        disabilityGroups: ['Low Vision', 'Color Blind']
      }]
    });
  }

  static createKeyboardIssue(elements) {
    return new AccessibilityIssue({
      title: 'Keyboard Navigation Issues',
      description: 'Elements cannot be accessed or operated using only a keyboard',
      severity: 'critical',
      category: 'keyboard',
      elements: elements,
      wcagCriteria: [{
        id: '2.1.1',
        title: 'Keyboard',
        level: 'A',
        guideline: 'Operable',
        disabilityGroups: ['Motor', 'Blind']
      }]
    });
  }
}

export default AccessibilityIssue;