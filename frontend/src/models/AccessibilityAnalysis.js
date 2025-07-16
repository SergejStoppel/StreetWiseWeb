/**
 * Accessibility Analysis Model
 * Handles accessibility-specific analysis data
 */

import { AccessibilityIssue } from './AccessibilityIssue';

export class AccessibilityAnalysis {
  constructor(data = {}) {
    // Core accessibility issues
    this.issues = (data.issues || []).map(issue => 
      issue instanceof AccessibilityIssue ? issue : new AccessibilityIssue(issue)
    );
    
    // WCAG compliance data
    this.wcagCompliance = data.wcagCompliance || {
      levelA: { passed: 0, failed: 0, total: 0 },
      levelAA: { passed: 0, failed: 0, total: 0 },
      levelAAA: { passed: 0, failed: 0, total: 0 }
    };
    
    // Passed audits
    this.passedAudits = data.passedAudits || [];
    
    // Analysis metadata
    this.score = data.score || 0;
    this.totalChecks = data.totalChecks || 0;
    this.timestamp = data.timestamp || new Date().toISOString();
  }

  /**
   * Get issues grouped by severity
   */
  get issuesBySeverity() {
    const groups = {
      critical: [],
      serious: [],
      moderate: [],
      minor: []
    };

    this.issues.forEach(issue => {
      if (groups[issue.severity]) {
        groups[issue.severity].push(issue);
      }
    });

    return groups;
  }

  /**
   * Get issues grouped by category
   */
  get issuesByCategory() {
    const groups = {};
    
    this.issues.forEach(issue => {
      if (!groups[issue.category]) {
        groups[issue.category] = [];
      }
      groups[issue.category].push(issue);
    });

    return groups;
  }

  /**
   * Get critical issues only
   */
  get criticalIssues() {
    return this.issues.filter(issue => issue.severity === 'critical');
  }

  /**
   * Get serious issues only
   */
  get seriousIssues() {
    return this.issues.filter(issue => issue.severity === 'serious');
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
   * Get serious issue count
   */
  get seriousCount() {
    return this.seriousIssues.length;
  }

  /**
   * Get passed audit count
   */
  get passedCount() {
    return this.passedAudits.length;
  }

  /**
   * Get overall WCAG compliance percentage
   */
  get wcagCompliancePercentage() {
    const total = this.wcagCompliance.levelA.total + 
                 this.wcagCompliance.levelAA.total + 
                 this.wcagCompliance.levelAAA.total;
    
    const passed = this.wcagCompliance.levelA.passed + 
                  this.wcagCompliance.levelAA.passed + 
                  this.wcagCompliance.levelAAA.passed;
    
    return total > 0 ? Math.round((passed / total) * 100) : 0;
  }

  /**
   * Get estimated total fix time in minutes
   */
  get estimatedFixTime() {
    return this.issues.reduce((total, issue) => {
      return total + (issue.estimatedFixTime || 0);
    }, 0);
  }

  /**
   * Get issues affecting specific disability groups
   */
  getIssuesByDisabilityGroup(group) {
    return this.issues.filter(issue => 
      issue.disabilityGroups.includes(group)
    );
  }

  /**
   * Get issues by WCAG level
   */
  getIssuesByWcagLevel(level) {
    return this.issues.filter(issue => issue.wcagLevel === level);
  }

  /**
   * Add a new issue
   */
  addIssue(issueData) {
    const issue = issueData instanceof AccessibilityIssue ? 
      issueData : new AccessibilityIssue(issueData);
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
   * Convert to JSON
   */
  toJSON() {
    return {
      issues: this.issues.map(issue => issue.toJSON()),
      wcagCompliance: this.wcagCompliance,
      passedAudits: this.passedAudits,
      score: this.score,
      totalChecks: this.totalChecks,
      timestamp: this.timestamp
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(data) {
    return new AccessibilityAnalysis(data);
  }
}

export default AccessibilityAnalysis;