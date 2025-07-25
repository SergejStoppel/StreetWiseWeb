/**
 * WCAG Criteria Model and Lookup
 * Comprehensive WCAG 2.1 success criteria mapping
 */

export class WcagCriterion {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.level = data.level; // A, AA, AAA
    this.guideline = data.guideline;
    this.principle = data.principle;
    this.description = data.description;
    this.disabilityGroups = data.disabilityGroups || [];
    this.techniques = data.techniques || [];
    this.failures = data.failures || [];
    this.resources = data.resources || [];
  }

  get url() {
    return `https://www.w3.org/WAI/WCAG21/Understanding/${this.id.replace('.', '-')}.html`;
  }

  get shortDescription() {
    return this.description.split('.')[0] + '.';
  }
}

// WCAG 2.1 Success Criteria Database
export const WCAG_CRITERIA = {
  // Principle 1: Perceivable
  '1.1.1': new WcagCriterion({
    id: '1.1.1',
    title: 'Non-text Content',
    level: 'A',
    guideline: 'Text Alternatives',
    principle: 'Perceivable',
    description: 'All non-text content that is presented to the user has a text alternative that serves the equivalent purpose.',
    disabilityGroups: ['Blind', 'Low Vision', 'Deaf-blind'],
    techniques: ['H37', 'H36', 'H24'],
    failures: ['F65', 'F30', 'F38']
  }),

  '1.2.1': new WcagCriterion({
    id: '1.2.1',
    title: 'Audio-only and Video-only (Prerecorded)',
    level: 'A',
    guideline: 'Time-based Media',
    principle: 'Perceivable',
    description: 'For prerecorded audio-only and prerecorded video-only media, alternatives are provided.',
    disabilityGroups: ['Blind', 'Deaf', 'Deaf-blind'],
    techniques: ['G158', 'G159', 'G166'],
    failures: ['F30', 'F67']
  }),

  '1.3.1': new WcagCriterion({
    id: '1.3.1',
    title: 'Info and Relationships',
    level: 'A',
    guideline: 'Adaptable',
    principle: 'Perceivable',
    description: 'Information, structure, and relationships conveyed through presentation can be programmatically determined.',
    disabilityGroups: ['Blind', 'Cognitive', 'Motor'],
    techniques: ['H42', 'H43', 'H44', 'H51', 'H71'],
    failures: ['F2', 'F43', 'F68', 'F87']
  }),

  '1.4.1': new WcagCriterion({
    id: '1.4.1',
    title: 'Use of Color',
    level: 'A',
    guideline: 'Distinguishable',
    principle: 'Perceivable',
    description: 'Color is not used as the only visual means of conveying information.',
    disabilityGroups: ['Color Blind', 'Low Vision', 'Blind'],
    techniques: ['G14', 'G205', 'G182'],
    failures: ['F13', 'F73', 'F81']
  }),

  '1.4.3': new WcagCriterion({
    id: '1.4.3',
    title: 'Contrast (Minimum)',
    level: 'AA',
    guideline: 'Distinguishable',
    principle: 'Perceivable',
    description: 'Text and images have a contrast ratio of at least 4.5:1 (3:1 for large text).',
    disabilityGroups: ['Low Vision', 'Color Blind'],
    techniques: ['G18', 'G145', 'G174'],
    failures: ['F24', 'F83']
  }),

  // Principle 2: Operable
  '2.1.1': new WcagCriterion({
    id: '2.1.1',
    title: 'Keyboard',
    level: 'A',
    guideline: 'Keyboard Accessible',
    principle: 'Operable',
    description: 'All functionality is available from a keyboard.',
    disabilityGroups: ['Motor', 'Blind', 'Low Vision'],
    techniques: ['G202', 'H91', 'SCR20'],
    failures: ['F54', 'F55', 'F42']
  }),

  '2.1.2': new WcagCriterion({
    id: '2.1.2',
    title: 'No Keyboard Trap',
    level: 'A',
    guideline: 'Keyboard Accessible',
    principle: 'Operable',
    description: 'Keyboard focus can be moved away from any component using standard navigation.',
    disabilityGroups: ['Motor', 'Blind'],
    techniques: ['G21', 'SCR20'],
    failures: ['F10']
  }),

  '2.4.1': new WcagCriterion({
    id: '2.4.1',
    title: 'Bypass Blocks',
    level: 'A',
    guideline: 'Navigable',
    principle: 'Operable',
    description: 'A mechanism is available to bypass blocks of content that are repeated.',
    disabilityGroups: ['Blind', 'Motor'],
    techniques: ['G1', 'G123', 'G124'],
    failures: ['F44']
  }),

  '2.4.2': new WcagCriterion({
    id: '2.4.2',
    title: 'Page Titled',
    level: 'A',
    guideline: 'Navigable',
    principle: 'Operable',
    description: 'Web pages have titles that describe topic or purpose.',
    disabilityGroups: ['Blind', 'Cognitive'],
    techniques: ['G88', 'H25'],
    failures: ['F25']
  }),

  '2.4.3': new WcagCriterion({
    id: '2.4.3',
    title: 'Focus Order',
    level: 'A',
    guideline: 'Navigable',
    principle: 'Operable',
    description: 'Components receive focus in an order that preserves meaning and operability.',
    disabilityGroups: ['Blind', 'Motor', 'Cognitive'],
    techniques: ['G59', 'H4', 'C27'],
    failures: ['F44', 'F85']
  }),

  '2.4.4': new WcagCriterion({
    id: '2.4.4',
    title: 'Link Purpose (In Context)',
    level: 'A',
    guideline: 'Navigable',
    principle: 'Operable',
    description: 'The purpose of each link can be determined from the link text alone or together with context.',
    disabilityGroups: ['Blind', 'Cognitive'],
    techniques: ['G91', 'H30', 'H24'],
    failures: ['F63', 'F89']
  }),

  // Principle 3: Understandable
  '3.1.1': new WcagCriterion({
    id: '3.1.1',
    title: 'Language of Page',
    level: 'A',
    guideline: 'Readable',
    principle: 'Understandable',
    description: 'The default human language of each web page can be programmatically determined.',
    disabilityGroups: ['Blind', 'Cognitive'],
    techniques: ['H57'],
    failures: ['F12']
  }),

  '3.2.1': new WcagCriterion({
    id: '3.2.1',
    title: 'On Focus',
    level: 'A',
    guideline: 'Predictable',
    principle: 'Understandable',
    description: 'When any component receives focus, it does not initiate a change of context.',
    disabilityGroups: ['Blind', 'Motor', 'Cognitive'],
    techniques: ['G107'],
    failures: ['F55']
  }),

  '3.3.1': new WcagCriterion({
    id: '3.3.1',
    title: 'Error Identification',
    level: 'A',
    guideline: 'Input Assistance',
    principle: 'Understandable',
    description: 'Input errors are automatically detected and described to the user in text.',
    disabilityGroups: ['Blind', 'Cognitive'],
    techniques: ['G83', 'G85', 'SCR18'],
    failures: ['F82']
  }),

  '3.3.2': new WcagCriterion({
    id: '3.3.2',
    title: 'Labels or Instructions',
    level: 'A',
    guideline: 'Input Assistance',
    principle: 'Understandable',
    description: 'Labels or instructions are provided when content requires user input.',
    disabilityGroups: ['Blind', 'Cognitive'],
    techniques: ['G131', 'G89', 'G184'],
    failures: ['F82']
  }),

  // Principle 4: Robust
  '4.1.1': new WcagCriterion({
    id: '4.1.1',
    title: 'Parsing',
    level: 'A',
    guideline: 'Compatible',
    principle: 'Robust',
    description: 'Content implemented using markup languages has complete start/end tags and proper nesting.',
    disabilityGroups: ['Blind', 'Motor'],
    techniques: ['G134', 'G192', 'H88'],
    failures: ['F70', 'F77']
  }),

  '4.1.2': new WcagCriterion({
    id: '4.1.2',
    title: 'Name, Role, Value',
    level: 'A',
    guideline: 'Compatible',
    principle: 'Robust',
    description: 'UI components have accessible names, roles, and values that can be programmatically determined.',
    disabilityGroups: ['Blind', 'Motor'],
    techniques: ['G108', 'H91', 'H44'],
    failures: ['F59', 'F15', 'F20']
  })
};

// Utility functions
export const WcagLookup = {
  getCriterion: (id) => WCAG_CRITERIA[id],
  
  getCriteriaByLevel: (level) => {
    return Object.values(WCAG_CRITERIA).filter(c => c.level === level);
  },
  
  getCriteriaByDisabilityGroup: (group) => {
    return Object.values(WCAG_CRITERIA).filter(c => 
      c.disabilityGroups.includes(group)
    );
  },
  
  getCriteriaByPrinciple: (principle) => {
    return Object.values(WCAG_CRITERIA).filter(c => c.principle === principle);
  },
  
  getAllCriteria: () => Object.values(WCAG_CRITERIA),
  
  getDisabilityGroups: () => {
    const groups = new Set();
    Object.values(WCAG_CRITERIA).forEach(criterion => {
      criterion.disabilityGroups.forEach(group => groups.add(group));
    });
    return Array.from(groups).sort();
  }
};

export default WcagLookup;