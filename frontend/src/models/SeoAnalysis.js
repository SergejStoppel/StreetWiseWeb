/**
 * SEO Analysis Model
 * Handles SEO-specific analysis data and issues
 */

export class SeoIssue {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.type = data.type || 'other'; // 'meta', 'content', 'technical', 'structure'
    this.title = data.title || '';
    this.description = data.description || '';
    this.impact = data.impact || 'medium'; // 'high', 'medium', 'low'
    this.locations = data.locations || [];
    this.currentValue = data.currentValue || null;
    this.recommendedValue = data.recommendedValue || null;
    this.explanation = data.explanation || '';
    this.userBenefit = data.userBenefit || '';
    this.estimatedFixTime = data.estimatedFixTime || 15; // minutes
    this.codeExample = data.codeExample || null;
  }

  generateId() {
    return `seo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get severity level based on impact
   */
  get severity() {
    switch (this.impact) {
      case 'high': return 'serious';
      case 'medium': return 'moderate';
      case 'low': return 'minor';
      default: return 'moderate';
    }
  }

  /**
   * Check if this is a critical SEO issue
   */
  get isCritical() {
    return this.impact === 'high';
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      title: this.title,
      description: this.description,
      impact: this.impact,
      locations: this.locations,
      currentValue: this.currentValue,
      recommendedValue: this.recommendedValue,
      explanation: this.explanation,
      userBenefit: this.userBenefit,
      estimatedFixTime: this.estimatedFixTime,
      codeExample: this.codeExample
    };
  }
}

export class SeoAnalysis {
  constructor(data = {}) {
    // SEO issues
    this.issues = (data.issues || []).map(issue => 
      issue instanceof SeoIssue ? issue : new SeoIssue(issue)
    );
    
    // SEO categories analysis
    this.metaAnalysis = data.metaAnalysis || {
      title: { score: 0, issues: [] },
      description: { score: 0, issues: [] },
      keywords: { score: 0, issues: [] },
      openGraph: { score: 0, issues: [] }
    };
    
    this.contentAnalysis = data.contentAnalysis || {
      headings: { score: 0, issues: [] },
      images: { score: 0, issues: [] },
      links: { score: 0, issues: [] },
      readability: { score: 0, issues: [] }
    };
    
    this.technicalAnalysis = data.technicalAnalysis || {
      siteSpeed: { score: 0, issues: [] },
      mobileFriendly: { score: 0, issues: [] },
      crawlability: { score: 0, issues: [] },
      indexability: { score: 0, issues: [] }
    };
    
    // Overall SEO score
    this.score = data.score || 0;
    this.recommendations = data.recommendations || [];
    this.timestamp = data.timestamp || new Date().toISOString();
  }

  /**
   * Get issues grouped by type
   */
  get issuesByType() {
    const groups = {
      meta: [],
      content: [],
      technical: [],
      structure: []
    };

    this.issues.forEach(issue => {
      if (groups[issue.type]) {
        groups[issue.type].push(issue);
      }
    });

    return groups;
  }

  /**
   * Get issues grouped by impact
   */
  get issuesByImpact() {
    const groups = {
      high: [],
      medium: [],
      low: []
    };

    this.issues.forEach(issue => {
      if (groups[issue.impact]) {
        groups[issue.impact].push(issue);
      }
    });

    return groups;
  }

  /**
   * Get critical SEO issues
   */
  get criticalIssues() {
    return this.issues.filter(issue => issue.isCritical);
  }

  /**
   * Get total issue count
   */
  get issueCount() {
    return this.issues.length;
  }

  /**
   * Get critical issue count
   */
  get criticalCount() {
    return this.criticalIssues.length;
  }

  /**
   * Get estimated total fix time
   */
  get estimatedFixTime() {
    return this.issues.reduce((total, issue) => {
      return total + (issue.estimatedFixTime || 0);
    }, 0);
  }

  /**
   * Get SEO score color
   */
  get scoreColor() {
    if (this.score >= 80) return '#10b981'; // Green
    if (this.score >= 60) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  }

  /**
   * Get overall SEO health status
   */
  get healthStatus() {
    if (this.score >= 90) return 'excellent';
    if (this.score >= 80) return 'good';
    if (this.score >= 60) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Get issues by specific type
   */
  getIssuesByType(type) {
    return this.issues.filter(issue => issue.type === type);
  }

  /**
   * Add a new SEO issue
   */
  addIssue(issueData) {
    const issue = issueData instanceof SeoIssue ? 
      issueData : new SeoIssue(issueData);
    this.issues.push(issue);
    return issue;
  }

  /**
   * Remove an issue by ID
   */
  removeIssue(issueId) {
    this.issues = this.issues.filter(issue => issue.id !== issueId);
  }

  /**
   * Get issue by ID
   */
  getIssueById(issueId) {
    return this.issues.find(issue => issue.id === issueId);
  }

  /**
   * Get quick win opportunities (low effort, high impact)
   */
  get quickWins() {
    return this.issues.filter(issue => 
      issue.estimatedFixTime <= 30 && issue.impact === 'high'
    );
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      issues: this.issues.map(issue => issue.toJSON()),
      metaAnalysis: this.metaAnalysis,
      contentAnalysis: this.contentAnalysis,
      technicalAnalysis: this.technicalAnalysis,
      score: this.score,
      recommendations: this.recommendations,
      timestamp: this.timestamp
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(data) {
    return new SeoAnalysis(data);
  }
}

export default SeoAnalysis;