/**
 * FreeReportSummary Model
 * Represents the structure of free MVP reports
 * Based on Report_Definitions_for_StreetWiseWeb.md specifications
 */

export class FreeReportSummary {
  constructor(data = {}) {
    // Core metadata
    this.analysisId = data.analysisId || '';
    this.url = data.url || '';
    this.timestamp = data.timestamp || new Date().toISOString();
    this.reportType = 'free';
    this.language = data.language || 'en';

    // Executive Summary
    this.executiveSummary = new ExecutiveSummary(data.executiveSummary || {});

    // Top 3 Critical Accessibility Issues
    this.topAccessibilityIssues = new TopAccessibilityIssues(data.topAccessibilityIssues || {});

    // Most Important SEO Improvement
    this.topSeoImprovement = new TopSeoImprovement(data.topSeoImprovement || {});

    // Call to Action
    this.callToAction = new CallToAction(data.callToAction || {});

    // Basic screenshot (watermarked)
    this.screenshot = data.screenshot || null;

    // Disclaimer
    this.disclaimer = data.disclaimer || '';

    // Service metadata for upgrade prompts
    this.serviceMetadata = data.serviceMetadata || {};

    // Metadata
    this.metadata = data.metadata || {};
  }

  /**
   * Get compliance status color and styling
   */
  getComplianceStatusStyling() {
    const status = this.executiveSummary.complianceStatus.level;
    
    const stylingMap = {
      'HEALTHY': {
        color: '#10b981', // Green
        backgroundColor: '#d1fae5',
        borderColor: '#10b981',
        iconClass: 'check-circle'
      },
      'NEEDS IMPROVEMENT': {
        color: '#f59e0b', // Yellow
        backgroundColor: '#fef3c7',
        borderColor: '#f59e0b',
        iconClass: 'warning'
      },
      'NOT COMPLIANT': {
        color: '#ef4444', // Red
        backgroundColor: '#fee2e2',
        borderColor: '#ef4444',
        iconClass: 'x-circle'
      }
    };

    return stylingMap[status] || stylingMap['NOT COMPLIANT'];
  }

  /**
   * Check if there are upgrade prompts to show
   */
  get hasUpgradePrompts() {
    return this.metadata.upgradePrompts && this.metadata.upgradePrompts.length > 0;
  }

  /**
   * Get formatted issue count for display
   */
  get formattedIssueCounts() {
    const counts = this.executiveSummary.issueCounts;
    return {
      total: counts.total || 0,
      critical: counts.critical || 0,
      serious: counts.serious || 0,
      criticalAndSerious: (counts.critical || 0) + (counts.serious || 0)
    };
  }

  /**
   * Get upgrade prompts for display
   */
  getUpgradePrompts() {
    return this.metadata.upgradePrompts || [];
  }

  /**
   * Convert to JSON for storage/transmission
   */
  toJSON() {
    return {
      analysisId: this.analysisId,
      url: this.url,
      timestamp: this.timestamp,
      reportType: this.reportType,
      language: this.language,
      executiveSummary: this.executiveSummary.toJSON(),
      topAccessibilityIssues: this.topAccessibilityIssues.toJSON(),
      topSeoImprovement: this.topSeoImprovement.toJSON(),
      callToAction: this.callToAction.toJSON(),
      screenshot: this.screenshot,
      disclaimer: this.disclaimer,
      serviceMetadata: this.serviceMetadata,
      metadata: this.metadata
    };
  }

  /**
   * Create from JSON data
   */
  static fromJSON(data) {
    return new FreeReportSummary(data);
  }
}

/**
 * Executive Summary section
 */
class ExecutiveSummary {
  constructor(data = {}) {
    this.headline = data.headline || "Your Website's Snapshot: How Healthy Is It?";
    this.overallScore = data.overallScore || 0;
    this.complianceStatus = new ComplianceStatus(data.complianceStatus || {});
    this.keyTakeaway = data.keyTakeaway || '';
    this.issueCounts = data.issueCounts || {};
  }

  toJSON() {
    return {
      headline: this.headline,
      overallScore: this.overallScore,
      complianceStatus: this.complianceStatus.toJSON(),
      keyTakeaway: this.keyTakeaway,
      issueCounts: this.issueCounts
    };
  }
}

/**
 * Compliance Status
 */
class ComplianceStatus {
  constructor(data = {}) {
    this.level = data.level || 'NOT COMPLIANT';
    this.badge = data.badge || 'not-compliant';
    this.color = data.color || 'red';
    this.message = data.message || '';
  }

  toJSON() {
    return {
      level: this.level,
      badge: this.badge,
      color: this.color,
      message: this.message
    };
  }
}

/**
 * Top 3 Accessibility Issues
 */
class TopAccessibilityIssues {
  constructor(data = {}) {
    this.headline = data.headline || "Urgent: Your Top 3 Accessibility Roadblocks";
    this.issues = (data.issues || []).map(issue => new AccessibilityIssue(issue));
  }

  get issueCount() {
    return this.issues.length;
  }

  toJSON() {
    return {
      headline: this.headline,
      issues: this.issues.map(issue => issue.toJSON())
    };
  }
}

/**
 * Individual Accessibility Issue
 */
class AccessibilityIssue {
  constructor(data = {}) {
    this.title = data.title || '';
    this.whyItMatters = data.whyItMatters || '';
    this.elementsAffected = data.elementsAffected || 0;
    this.wcagReference = data.wcagReference || null;
    this.suggestedNextStep = data.suggestedNextStep || '';
    this.severity = data.severity || 'unknown';
  }

  get severityColor() {
    const colorMap = {
      critical: '#ef4444',
      serious: '#f59e0b',
      moderate: '#10b981',
      minor: '#6b7280'
    };
    return colorMap[this.severity] || colorMap.moderate;
  }

  toJSON() {
    return {
      title: this.title,
      whyItMatters: this.whyItMatters,
      elementsAffected: this.elementsAffected,
      wcagReference: this.wcagReference,
      suggestedNextStep: this.suggestedNextStep,
      severity: this.severity
    };
  }
}

/**
 * Top SEO Improvement
 */
class TopSeoImprovement {
  constructor(data = {}) {
    this.headline = data.headline || "Your #1 Opportunity to Get More Customers from Google & AI";
    this.issue = new SeoIssue(data.issue || {});
  }

  toJSON() {
    return {
      headline: this.headline,
      issue: this.issue.toJSON()
    };
  }
}

/**
 * SEO Issue
 */
class SeoIssue {
  constructor(data = {}) {
    this.title = data.title || '';
    this.whyItMatters = data.whyItMatters || '';
    this.suggestedNextStep = data.suggestedNextStep || '';
    this.priority = data.priority || 'medium';
  }

  get priorityColor() {
    const colorMap = {
      high: '#ef4444',
      medium: '#f59e0b',
      low: '#10b981'
    };
    return colorMap[this.priority] || colorMap.medium;
  }

  toJSON() {
    return {
      title: this.title,
      whyItMatters: this.whyItMatters,
      suggestedNextStep: this.suggestedNextStep,
      priority: this.priority
    };
  }
}

/**
 * Call to Action section
 */
class CallToAction {
  constructor(data = {}) {
    this.headline = data.headline || "Ready for a Healthier, More Profitable Website?";
    this.content = data.content || '';
    this.primaryCTA = new CTAButton(data.primaryCTA || {});
    this.secondaryCTA = new CTAButton(data.secondaryCTA || {});
  }

  toJSON() {
    return {
      headline: this.headline,
      content: this.content,
      primaryCTA: this.primaryCTA.toJSON(),
      secondaryCTA: this.secondaryCTA.toJSON()
    };
  }
}

/**
 * CTA Button
 */
class CTAButton {
  constructor(data = {}) {
    this.text = data.text || '';
    this.action = data.action || '';
    this.highlight = data.highlight || false;
  }

  toJSON() {
    return {
      text: this.text,
      action: this.action,
      highlight: this.highlight
    };
  }
}

export default FreeReportSummary;