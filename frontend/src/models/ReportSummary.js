/**
 * Report Summary Model
 * Handles overall report summary and scoring
 */

export class ReportSummary {
  constructor(data = {}) {
    // Overall scores
    this.accessibilityScore = data.accessibilityScore || 0;
    this.seoScore = data.seoScore || 0;
    this.performanceScore = data.performanceScore || 0;
    this.overallScore = data.overallScore || this.calculateOverallScore();
    
    // WCAG compliance
    this.isWcagCompliant = data.isWcagCompliant || false;
    this.wcagLevel = data.wcagLevel || 'A'; // A, AA, AAA
    this.compliancePercentage = data.compliancePercentage || 0;
    
    // Issue counts
    this.totalIssues = data.totalIssues || 0;
    this.criticalIssues = data.criticalIssues || 0;
    this.seriousIssues = data.seriousIssues || 0;
    this.moderateIssues = data.moderateIssues || 0;
    this.minorIssues = data.minorIssues || 0;
    
    // Audit results
    this.totalAudits = data.totalAudits || 0;
    this.passedAudits = data.passedAudits || 0;
    this.failedAudits = data.failedAudits || 0;
    this.manualAudits = data.manualAudits || 0;
    
    // Estimated metrics
    this.estimatedFixTime = data.estimatedFixTime || 0; // minutes
    this.estimatedCost = data.estimatedCost || 0; // dollars
    this.businessRisk = data.businessRisk || 'low'; // low, medium, high
    
    // Improvement tracking
    this.improvementPotential = data.improvementPotential || 0; // percentage
    this.quickWinsCount = data.quickWinsCount || 0;
    this.longTermIssuesCount = data.longTermIssuesCount || 0;
    
    // Metadata
    this.lastUpdated = data.lastUpdated || new Date().toISOString();
    this.analysisDepth = data.analysisDepth || 'basic'; // basic, comprehensive, premium
  }

  /**
   * Calculate overall score from individual scores
   */
  calculateOverallScore() {
    // Weighted average: accessibility 50%, SEO 30%, performance 20%
    return Math.round(
      (this.accessibilityScore * 0.5) + 
      (this.seoScore * 0.3) + 
      (this.performanceScore * 0.2)
    );
  }

  /**
   * Get overall compliance status
   */
  get complianceStatus() {
    if (this.accessibilityScore >= 95 && this.isWcagCompliant) return 'compliant';
    if (this.accessibilityScore >= 80) return 'mostly-compliant';
    if (this.accessibilityScore >= 60) return 'partially-compliant';
    return 'non-compliant';
  }

  /**
   * Get overall score color
   */
  get overallScoreColor() {
    if (this.overallScore >= 90) return '#10b981'; // Green
    if (this.overallScore >= 70) return '#f59e0b'; // Yellow
    if (this.overallScore >= 50) return '#f97316'; // Orange
    return '#ef4444'; // Red
  }

  /**
   * Get accessibility score color
   */
  get accessibilityScoreColor() {
    if (this.accessibilityScore >= 90) return '#10b981'; // Green
    if (this.accessibilityScore >= 70) return '#f59e0b'; // Yellow
    if (this.accessibilityScore >= 50) return '#f97316'; // Orange
    return '#ef4444'; // Red
  }

  /**
   * Get SEO score color
   */
  get seoScoreColor() {
    if (this.seoScore >= 90) return '#10b981'; // Green
    if (this.seoScore >= 70) return '#f59e0b'; // Yellow
    if (this.seoScore >= 50) return '#f97316'; // Orange
    return '#ef4444'; // Red
  }

  /**
   * Get performance score color
   */
  get performanceScoreColor() {
    if (this.performanceScore >= 90) return '#10b981'; // Green
    if (this.performanceScore >= 50) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  }

  /**
   * Get business risk level
   */
  get businessRiskLevel() {
    if (this.criticalIssues >= 10 || this.accessibilityScore < 60) return 'high';
    if (this.criticalIssues >= 5 || this.accessibilityScore < 80) return 'medium';
    return 'low';
  }

  /**
   * Get business risk color
   */
  get businessRiskColor() {
    switch (this.businessRisk) {
      case 'high': return '#ef4444'; // Red
      case 'medium': return '#f59e0b'; // Yellow
      case 'low': return '#10b981'; // Green
      default: return '#6b7280'; // Gray
    }
  }

  /**
   * Get audit success rate
   */
  get auditSuccessRate() {
    return this.totalAudits > 0 ? 
      Math.round((this.passedAudits / this.totalAudits) * 100) : 0;
  }

  /**
   * Get priority recommendations count
   */
  get priorityRecommendationsCount() {
    return this.criticalIssues + this.seriousIssues;
  }

  /**
   * Calculate improvement potential
   */
  get calculatedImprovementPotential() {
    const maxPossibleScore = 100;
    const currentScore = this.overallScore;
    return Math.round(((maxPossibleScore - currentScore) / maxPossibleScore) * 100);
  }

  /**
   * Get estimated fix time in human readable format
   */
  get estimatedFixTimeFormatted() {
    if (this.estimatedFixTime < 60) {
      return `${this.estimatedFixTime} minutes`;
    } else if (this.estimatedFixTime < 480) {
      return `${Math.round(this.estimatedFixTime / 60)} hours`;
    } else {
      return `${Math.round(this.estimatedFixTime / 480)} days`;
    }
  }

  /**
   * Check if report shows excellent accessibility
   */
  get hasExcellentAccessibility() {
    return this.accessibilityScore >= 95 && this.criticalIssues === 0;
  }

  /**
   * Check if report needs immediate attention
   */
  get needsImmediateAttention() {
    return this.criticalIssues > 0 || this.accessibilityScore < 60;
  }

  /**
   * Get grade based on overall score
   */
  get grade() {
    if (this.overallScore >= 90) return 'A';
    if (this.overallScore >= 80) return 'B';
    if (this.overallScore >= 70) return 'C';
    if (this.overallScore >= 60) return 'D';
    return 'F';
  }

  /**
   * Update scores and recalculate
   */
  updateScores(scores) {
    this.accessibilityScore = scores.accessibility || this.accessibilityScore;
    this.seoScore = scores.seo || this.seoScore;
    this.performanceScore = scores.performance || this.performanceScore;
    this.overallScore = this.calculateOverallScore();
    this.lastUpdated = new Date().toISOString();
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      accessibilityScore: this.accessibilityScore,
      seoScore: this.seoScore,
      performanceScore: this.performanceScore,
      overallScore: this.overallScore,
      isWcagCompliant: this.isWcagCompliant,
      wcagLevel: this.wcagLevel,
      compliancePercentage: this.compliancePercentage,
      totalIssues: this.totalIssues,
      criticalIssues: this.criticalIssues,
      seriousIssues: this.seriousIssues,
      moderateIssues: this.moderateIssues,
      minorIssues: this.minorIssues,
      totalAudits: this.totalAudits,
      passedAudits: this.passedAudits,
      failedAudits: this.failedAudits,
      manualAudits: this.manualAudits,
      estimatedFixTime: this.estimatedFixTime,
      estimatedCost: this.estimatedCost,
      businessRisk: this.businessRisk,
      improvementPotential: this.improvementPotential,
      quickWinsCount: this.quickWinsCount,
      longTermIssuesCount: this.longTermIssuesCount,
      lastUpdated: this.lastUpdated,
      analysisDepth: this.analysisDepth
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(data) {
    return new ReportSummary(data);
  }
}

export default ReportSummary;