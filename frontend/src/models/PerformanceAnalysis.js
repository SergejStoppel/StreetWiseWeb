/**
 * Performance Analysis Model
 * Handles performance-specific analysis data and Core Web Vitals
 */

export class PerformanceIssue {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.type = data.type || 'other'; // 'loading', 'rendering', 'runtime', 'network'
    this.title = data.title || '';
    this.description = data.description || '';
    this.impact = data.impact || 'medium'; // 'high', 'medium', 'low'
    this.metrics = data.metrics || {}; // LCP, FID, CLS, etc.
    this.currentValue = data.currentValue || null;
    this.recommendedValue = data.recommendedValue || null;
    this.suggestions = data.suggestions || [];
    this.userBenefit = data.userBenefit || '';
    this.estimatedFixTime = data.estimatedFixTime || 30; // minutes
    this.savingsEstimate = data.savingsEstimate || null; // bytes or milliseconds
  }

  generateId() {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
   * Check if this is a critical performance issue
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
      metrics: this.metrics,
      currentValue: this.currentValue,
      recommendedValue: this.recommendedValue,
      suggestions: this.suggestions,
      userBenefit: this.userBenefit,
      estimatedFixTime: this.estimatedFixTime,
      savingsEstimate: this.savingsEstimate
    };
  }
}

export class PerformanceAnalysis {
  constructor(data = {}) {
    // Performance issues
    this.issues = (data.issues || []).map(issue => 
      issue instanceof PerformanceIssue ? issue : new PerformanceIssue(issue)
    );
    
    // Core Web Vitals
    this.coreWebVitals = data.coreWebVitals || {
      lcp: { value: 0, score: 0, status: 'unknown' }, // Largest Contentful Paint
      fid: { value: 0, score: 0, status: 'unknown' }, // First Input Delay
      cls: { value: 0, score: 0, status: 'unknown' }, // Cumulative Layout Shift
      fcp: { value: 0, score: 0, status: 'unknown' }, // First Contentful Paint
      ttfb: { value: 0, score: 0, status: 'unknown' } // Time to First Byte
    };
    
    // Performance categories
    this.loadingPerformance = data.loadingPerformance || {
      score: 0,
      opportunities: [],
      diagnostics: []
    };
    
    this.renderingPerformance = data.renderingPerformance || {
      score: 0,
      opportunities: [],
      diagnostics: []
    };
    
    this.networkPerformance = data.networkPerformance || {
      score: 0,
      opportunities: [],
      diagnostics: []
    };
    
    // Overall performance score
    this.score = data.score || 0;
    this.recommendations = data.recommendations || [];
    this.timestamp = data.timestamp || new Date().toISOString();
  }

  /**
   * Get issues grouped by type
   */
  get issuesByType() {
    const groups = {
      loading: [],
      rendering: [],
      runtime: [],
      network: []
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
   * Get critical performance issues
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
   * Get performance score color
   */
  get scoreColor() {
    if (this.score >= 90) return '#10b981'; // Green
    if (this.score >= 50) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  }

  /**
   * Get overall performance status
   */
  get performanceStatus() {
    if (this.score >= 90) return 'fast';
    if (this.score >= 50) return 'average';
    return 'slow';
  }

  /**
   * Get Core Web Vitals status
   */
  get coreWebVitalsStatus() {
    const vitals = this.coreWebVitals;
    const goodCount = Object.values(vitals).filter(v => v.status === 'good').length;
    const totalCount = Object.keys(vitals).length;
    
    if (goodCount === totalCount) return 'good';
    if (goodCount >= totalCount * 0.6) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Get estimated total savings
   */
  get estimatedSavings() {
    return this.issues.reduce((total, issue) => {
      if (issue.savingsEstimate && typeof issue.savingsEstimate === 'number') {
        return total + issue.savingsEstimate;
      }
      return total;
    }, 0);
  }

  /**
   * Get issues by specific type
   */
  getIssuesByType(type) {
    return this.issues.filter(issue => issue.type === type);
  }

  /**
   * Add a new performance issue
   */
  addIssue(issueData) {
    const issue = issueData instanceof PerformanceIssue ? 
      issueData : new PerformanceIssue(issueData);
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
   * Get quick wins (high impact, low effort)
   */
  get quickWins() {
    return this.issues.filter(issue => 
      issue.estimatedFixTime <= 60 && issue.impact === 'high'
    );
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      issues: this.issues.map(issue => issue.toJSON()),
      coreWebVitals: this.coreWebVitals,
      loadingPerformance: this.loadingPerformance,
      renderingPerformance: this.renderingPerformance,
      networkPerformance: this.networkPerformance,
      score: this.score,
      recommendations: this.recommendations,
      timestamp: this.timestamp
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(data) {
    return new PerformanceAnalysis(data);
  }
}

export default PerformanceAnalysis;