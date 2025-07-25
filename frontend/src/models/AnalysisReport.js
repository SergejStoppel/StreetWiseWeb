/**
 * Master Analysis Report Model
 * Represents the complete analysis report structure
 */

import { AccessibilityAnalysis } from './AccessibilityAnalysis';
import { SeoAnalysis } from './SeoAnalysis';
import { PerformanceAnalysis } from './PerformanceAnalysis';
import { AiInsights } from './AiInsights';
import { ReportSummary } from './ReportSummary';

export class AnalysisReport {
  constructor(data = {}) {
    // Core report metadata
    this.id = data.id || this.generateId();
    this.url = data.url || '';
    this.timestamp = data.timestamp || new Date().toISOString();
    this.reportType = data.reportType || 'overview'; // 'overview' | 'detailed'
    
    // Website screenshots
    this.screenshot = data.screenshot || null;
    
    // Analysis sections
    this.accessibility = new AccessibilityAnalysis(data.accessibility || {});
    this.seo = new SeoAnalysis(data.seo || {});
    this.performance = new PerformanceAnalysis(data.performance || {});
    
    // AI-generated insights (only for detailed reports)
    this.aiInsights = data.aiInsights ? new AiInsights(data.aiInsights) : null;
    
    // Overall summary and scoring
    this.summary = new ReportSummary(data.summary || {});
  }

  /**
   * Generate a unique report ID
   */
  generateId() {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get the overall compliance status
   */
  get complianceStatus() {
    const score = this.summary.accessibilityScore;
    if (score >= 95) return 'compliant';
    if (score >= 80) return 'mostly-compliant';
    if (score >= 60) return 'partially-compliant';
    return 'non-compliant';
  }

  /**
   * Get the overall score color based on accessibility score
   */
  get scoreColor() {
    const score = this.summary.accessibilityScore;
    if (score >= 80) return '#10b981'; // Green
    if (score >= 60) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  }

  /**
   * Get total issue count across all categories
   */
  get totalIssueCount() {
    return this.accessibility.issueCount + 
           this.seo.issueCount + 
           this.performance.issueCount;
  }

  /**
   * Get critical issues from all categories
   */
  get criticalIssues() {
    return [
      ...this.accessibility.criticalIssues,
      ...this.seo.criticalIssues,
      ...this.performance.criticalIssues
    ];
  }

  /**
   * Check if this is a premium (detailed) report
   */
  get isPremium() {
    return this.reportType === 'detailed';
  }

  /**
   * Get estimated fix time for all issues
   */
  get estimatedFixTime() {
    return this.accessibility.estimatedFixTime + 
           this.seo.estimatedFixTime + 
           this.performance.estimatedFixTime;
  }

  /**
   * Convert to JSON for storage/transmission
   */
  toJSON() {
    return {
      id: this.id,
      url: this.url,
      timestamp: this.timestamp,
      reportType: this.reportType,
      screenshot: this.screenshot,
      accessibility: this.accessibility.toJSON(),
      seo: this.seo.toJSON(),
      performance: this.performance.toJSON(),
      aiInsights: this.aiInsights ? this.aiInsights.toJSON() : null,
      summary: this.summary.toJSON()
    };
  }

  /**
   * Create from JSON data
   */
  static fromJSON(data) {
    return new AnalysisReport(data);
  }
}

export default AnalysisReport;