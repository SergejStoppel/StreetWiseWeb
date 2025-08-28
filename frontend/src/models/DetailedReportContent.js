/**
 * DetailedReportContent Model
 * Represents the structure of comprehensive paid reports
 * Based on Report_Definitions_for_StreetWiseWeb.md specifications
 */

export class DetailedReportContent {
  constructor(data = {}) {
    // Core metadata
    this.analysisId = data.analysisId || '';
    this.url = data.url || '';
    this.timestamp = data.timestamp || new Date().toISOString();
    this.reportType = 'detailed';
    this.language = data.language || 'en';

    // Executive Summary & Overall Score
    this.executiveSummary = new DetailedExecutiveSummary(data.executiveSummary || {});

    // Accessibility Violations (Detailed)
    this.accessibilityViolations = new AccessibilityViolations(data.accessibilityViolations || {});

    // SEO Recommendations (Detailed)
    this.seoRecommendations = new SeoRecommendations(data.seoRecommendations || {});

    // AI Insights
    this.aiInsights = new AiInsights(data.aiInsights || {});

    // Screenshots (High-res, multiple views)
    this.screenshots = new Screenshots(data.screenshots || {});

    // Overall Recommendations & Next Steps
    this.recommendations = new OverallRecommendations(data.recommendations || {});

    // Technical appendix
    this.technicalDetails = data.technicalDetails || {};

    // Export options
    this.exportOptions = data.exportOptions || {};

    // Service metadata
    this.serviceMetadata = data.serviceMetadata || {};

    // Metadata
    this.metadata = data.metadata || {};
  }

  /**
   * Get total issue count across all categories
   */
  get totalIssueCount() {
    return this.executiveSummary?.summaryOfFindings?.totalIssues || 0;
  }

  /**
   * Get critical issues across all categories
   */
  get criticalIssueCount() {
    const accessibilityCount = this.executiveSummary?.summaryOfFindings?.byCategory?.accessibility?.critical || 0;
    return accessibilityCount; // Add other categories when available
  }

  /**
   * Get compliance status styling information
   */
  getComplianceStatusStyling() {
    const status = this.executiveSummary?.complianceStatus?.level || 'NON-COMPLIANT';
    
    const stylingMap = {
      'COMPLIANT': {
        color: '#10b981',
        backgroundColor: '#d1fae5',
        borderColor: '#10b981',
        iconClass: 'check-circle'
      },
      'MOSTLY COMPLIANT': {
        color: '#059669',
        backgroundColor: '#d1fae5',
        borderColor: '#059669',
        iconClass: 'check-circle'
      },
      'PARTIALLY COMPLIANT': {
        color: '#f59e0b',
        backgroundColor: '#fef3c7',
        borderColor: '#f59e0b',
        iconClass: 'warning'
      },
      'NON-COMPLIANT': {
        color: '#ef4444',
        backgroundColor: '#fee2e2',
        borderColor: '#ef4444',
        iconClass: 'x-circle'
      }
    };

    return stylingMap[status] || stylingMap['NON-COMPLIANT'];
  }

  /**
   * Get violations grouped by WCAG principle
   */
  getViolationsByPrinciple() {
    return this.accessibilityViolations?.violationsByPrinciple || [];
  }

  /**
   * Get SEO recommendations by category
   */
  getSeoRecommendationsByCategory() {
    return this.seoRecommendations?.categories || [];
  }

  /**
   * Get prioritized action items
   */
  getPrioritizedActions() {
    return this.recommendations?.prioritizationMatrix || [];
  }

  /**
   * Get implementation roadmap phases
   */
  getImplementationPhases() {
    const roadmap = this.recommendations?.implementationRoadmap || {};
    return [
      roadmap.phase1,
      roadmap.phase2,
      roadmap.phase3
    ].filter(phase => phase);
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
      accessibilityViolations: this.accessibilityViolations.toJSON(),
      seoRecommendations: this.seoRecommendations.toJSON(),
      aiInsights: this.aiInsights.toJSON(),
      screenshots: this.screenshots.toJSON(),
      recommendations: this.recommendations,
      technicalDetails: this.technicalDetails,
      exportOptions: this.exportOptions,
      serviceMetadata: this.serviceMetadata,
      metadata: this.metadata
    };
  }

  /**
   * Create from JSON data
   */
  static fromJSON(data) {
    return new DetailedReportContent(data);
  }
}

/**
 * Detailed Executive Summary
 */
class DetailedExecutiveSummary {
  constructor(data = {}) {
    this.overallHealthScore = data.overallHealthScore || 0;
    this.complianceStatus = new DetailedComplianceStatus(data.complianceStatus || {});
    this.summaryOfFindings = new SummaryOfFindings(data.summaryOfFindings || {});
    this.estimatedEffort = new EstimatedEffort(data.estimatedEffort || {});
    this.businessImpact = new BusinessImpact(data.businessImpact || {});
  }

  toJSON() {
    return {
      overallHealthScore: this.overallHealthScore,
      complianceStatus: this.complianceStatus.toJSON(),
      summaryOfFindings: this.summaryOfFindings.toJSON(),
      estimatedEffort: this.estimatedEffort.toJSON(),
      businessImpact: this.businessImpact.toJSON()
    };
  }
}

/**
 * Detailed Compliance Status
 */
class DetailedComplianceStatus {
  constructor(data = {}) {
    this.level = data.level || 'NON-COMPLIANT';
    this.badge = data.badge || 'non-compliant';
    this.color = data.color || 'red';
    this.message = data.message || '';
    this.legalRiskAssessment = new LegalRiskAssessment(data.legalRiskAssessment || {});
  }

  toJSON() {
    return {
      level: this.level,
      badge: this.badge,
      color: this.color,
      message: this.message,
      legalRiskAssessment: this.legalRiskAssessment.toJSON()
    };
  }
}

/**
 * Legal Risk Assessment
 */
class LegalRiskAssessment {
  constructor(data = {}) {
    this.level = data.level || 'Medium';
    this.description = data.description || '';
  }

  get riskColor() {
    const colorMap = {
      'High': '#ef4444',
      'Medium': '#f59e0b',
      'Low': '#10b981'
    };
    return colorMap[this.level] || colorMap.Medium;
  }

  toJSON() {
    return {
      level: this.level,
      description: this.description
    };
  }
}

/**
 * Summary of Findings
 */
class SummaryOfFindings {
  constructor(data = {}) {
    this.totalIssues = data.totalIssues || 0;
    this.byCategory = data.byCategory || {};
  }

  toJSON() {
    return {
      totalIssues: this.totalIssues,
      byCategory: this.byCategory
    };
  }
}

/**
 * Estimated Effort
 */
class EstimatedEffort {
  constructor(data = {}) {
    this.totalHours = data.totalHours || 0;
    this.breakdown = data.breakdown || {};
  }

  toJSON() {
    return {
      totalHours: this.totalHours,
      breakdown: this.breakdown
    };
  }
}

/**
 * Business Impact
 */
class BusinessImpact {
  constructor(data = {}) {
    this.potentialLostCustomers = data.potentialLostCustomers || '';
    this.seoImpact = data.seoImpact || '';
    this.brandReputation = data.brandReputation || '';
    this.legalExposure = data.legalExposure || '';
  }

  toJSON() {
    return {
      potentialLostCustomers: this.potentialLostCustomers,
      seoImpact: this.seoImpact,
      brandReputation: this.brandReputation,
      legalExposure: this.legalExposure
    };
  }
}

/**
 * Accessibility Violations
 */
class AccessibilityViolations {
  constructor(data = {}) {
    this.organization = data.organization || 'wcag_principle';
    this.totalViolations = data.totalViolations || 0;
    this.violationsByPrinciple = (data.violationsByPrinciple || []).map(
      principle => new ViolationsByPrinciple(principle)
    );
  }

  toJSON() {
    return {
      organization: this.organization,
      totalViolations: this.totalViolations,
      violationsByPrinciple: this.violationsByPrinciple.map(p => p.toJSON())
    };
  }
}

/**
 * Violations by WCAG Principle
 */
class ViolationsByPrinciple {
  constructor(data = {}) {
    this.principle = data.principle || '';
    this.violationCount = data.violationCount || 0;
    this.violations = (data.violations || []).map(v => new DetailedViolation(v));
  }

  get principleDisplayName() {
    const nameMap = {
      'perceivable': 'Perceivable',
      'operable': 'Operable',
      'understandable': 'Understandable',
      'robust': 'Robust'
    };
    return nameMap[this.principle] || this.principle;
  }

  get principleDescription() {
    const descMap = {
      'perceivable': 'Information must be presentable to users in ways they can perceive',
      'operable': 'User interface components must be operable',
      'understandable': 'Information and UI operation must be understandable',
      'robust': 'Content must be robust enough for various assistive technologies'
    };
    return descMap[this.principle] || '';
  }

  toJSON() {
    return {
      principle: this.principle,
      violationCount: this.violationCount,
      violations: this.violations.map(v => v.toJSON())
    };
  }
}

/**
 * Detailed Violation
 */
class DetailedViolation {
  constructor(data = {}) {
    this.issueTitle = data.issueTitle || '';
    this.wcagCriteria = new WcagCriteria(data.wcagCriteria || {});
    this.severity = data.severity || 'moderate';
    this.elementsAffected = data.elementsAffected || [];
    this.disabilityGroupsImpacted = data.disabilityGroupsImpacted || [];
    this.whatThisMeans = data.whatThisMeans || '';
    this.howToFix = new HowToFix(data.howToFix || {});
    this.howToTest = data.howToTest || '';
    this.estimatedFixTime = data.estimatedFixTime || {};
    this.businessImpact = data.businessImpact || '';
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

  get severityIcon() {
    const iconMap = {
      critical: 'exclamation-triangle',
      serious: 'warning',
      moderate: 'info-circle',
      minor: 'info'
    };
    return iconMap[this.severity] || iconMap.moderate;
  }

  toJSON() {
    return {
      issueTitle: this.issueTitle,
      wcagCriteria: this.wcagCriteria.toJSON(),
      severity: this.severity,
      elementsAffected: this.elementsAffected,
      disabilityGroupsImpacted: this.disabilityGroupsImpacted,
      whatThisMeans: this.whatThisMeans,
      howToFix: this.howToFix.toJSON(),
      howToTest: this.howToTest,
      estimatedFixTime: this.estimatedFixTime,
      businessImpact: this.businessImpact
    };
  }
}

/**
 * WCAG Criteria
 */
class WcagCriteria {
  constructor(data = {}) {
    this.level = data.level || 'AA';
    this.criteria = data.criteria || [];
    this.description = data.description || '';
  }

  get levelColor() {
    const colorMap = {
      'A': '#10b981',
      'AA': '#f59e0b',
      'AAA': '#ef4444'
    };
    return colorMap[this.level] || colorMap.AA;
  }

  toJSON() {
    return {
      level: this.level,
      criteria: this.criteria,
      description: this.description
    };
  }
}

/**
 * How to Fix
 */
class HowToFix {
  constructor(data = {}) {
    this.codeLocation = data.codeLocation || [];
    this.correctCodeExample = data.correctCodeExample || '';
    this.incorrectCodeExample = data.incorrectCodeExample || '';
    this.stepByStepInstructions = data.stepByStepInstructions || [];
    this.multipleSolutions = data.multipleSolutions || [];
  }

  toJSON() {
    return {
      codeLocation: this.codeLocation,
      correctCodeExample: this.correctCodeExample,
      incorrectCodeExample: this.incorrectCodeExample,
      stepByStepInstructions: this.stepByStepInstructions,
      multipleSolutions: this.multipleSolutions
    };
  }
}

/**
 * SEO Recommendations
 */
class SeoRecommendations {
  constructor(data = {}) {
    this.organization = data.organization || 'category';
    this.categories = (data.categories || []).map(cat => new SeoCategory(cat));
    this.priorityMatrix = data.priorityMatrix || [];
  }

  toJSON() {
    return {
      organization: this.organization,
      categories: this.categories.map(cat => cat.toJSON()),
      priorityMatrix: this.priorityMatrix
    };
  }
}

/**
 * SEO Category
 */
class SeoCategory {
  constructor(data = {}) {
    this.name = data.name || '';
    this.recommendations = (data.recommendations || []).map(rec => new SeoRecommendation(rec));
  }

  toJSON() {
    return {
      name: this.name,
      recommendations: this.recommendations.map(rec => rec.toJSON())
    };
  }
}

/**
 * SEO Recommendation
 */
class SeoRecommendation {
  constructor(data = {}) {
    this.title = data.title || '';
    this.category = data.category || '';
    this.priority = data.priority || 'Medium';
    this.whyItMatters = data.whyItMatters || '';
    this.currentState = data.currentState || '';
    this.recommendedAction = data.recommendedAction || '';
    this.bestPracticeExample = data.bestPracticeExample || '';
    this.tools = data.tools || [];
    this.estimatedImpact = data.estimatedImpact || 'Medium';
    this.implementationTime = data.implementationTime || '';
  }

  get priorityColor() {
    const colorMap = {
      'High': '#ef4444',
      'Medium': '#f59e0b',
      'Low': '#10b981'
    };
    return colorMap[this.priority] || colorMap.Medium;
  }

  toJSON() {
    return {
      title: this.title,
      category: this.category,
      priority: this.priority,
      whyItMatters: this.whyItMatters,
      currentState: this.currentState,
      recommendedAction: this.recommendedAction,
      bestPracticeExample: this.bestPracticeExample,
      tools: this.tools,
      estimatedImpact: this.estimatedImpact,
      implementationTime: this.implementationTime
    };
  }
}

/**
 * AI Insights
 */
class AiInsights {
  constructor(data = {}) {
    this.enabled = data.enabled || false;
    this.remediationPriority = data.remediationPriority || {};
    this.businessImpactAnalysis = data.businessImpactAnalysis || {};
    this.implementationTimeline = data.implementationTimeline || {};
    this.competitorInsights = data.competitorInsights || null;
    this.customRecommendations = data.customRecommendations || [];
  }

  toJSON() {
    return {
      enabled: this.enabled,
      remediationPriority: this.remediationPriority,
      businessImpactAnalysis: this.businessImpactAnalysis,
      implementationTimeline: this.implementationTimeline,
      competitorInsights: this.competitorInsights,
      customRecommendations: this.customRecommendations
    };
  }
}

/**
 * Screenshots
 */
class Screenshots {
  constructor(data = {}) {
    this.desktop = data.desktop || null;
    this.mobile = data.mobile || null;
    this.fullPage = data.fullPage || null;
    this.issueHighlights = data.issueHighlights || {};
  }

  toJSON() {
    return {
      desktop: this.desktop,
      mobile: this.mobile,
      fullPage: this.fullPage,
      issueHighlights: this.issueHighlights
    };
  }
}

/**
 * Overall Recommendations
 */
class OverallRecommendations {
  constructor(data = {}) {
    this.prioritizationMatrix = data.prioritizationMatrix || [];
    this.implementationRoadmap = data.implementationRoadmap || {};
    this.ongoingMaintenance = data.ongoingMaintenance || {};
    this.streetWiseWebServices = data.streetWiseWebServices || {};
  }
}

export default DetailedReportContent;