const logger = require('../../utils/logger');
const supabase = require('../../config/supabase');
const FreeReportGenerator = require('./FreeReportGenerator');
const DetailedReportGenerator = require('./DetailedReportGenerator');

/**
 * ReportService - Orchestrates report generation based on user plan and report type
 * Integrates with existing analysis flow and new report generators
 */
class ReportService {
  constructor() {
    this.freeReportGenerator = new FreeReportGenerator();
    this.detailedReportGenerator = new DetailedReportGenerator();
  }

  /**
   * Generate appropriate report based on user plan and request
   * @param {Object} analysisData - Full analysis data from AccessibilityAnalyzer
   * @param {Object} options - Options including user info, report type, etc.
   * @returns {Object} Generated report
   */
  async generateReport(analysisData, options = {}) {
    const { user, requestedReportType = 'overview', language = 'en' } = options;
    
    logger.info('Generating report', {
      analysisId: analysisData.analysisId,
      requestedType: requestedReportType,
      userPlan: user?.plan_type || 'anonymous'
    });

    try {
      // Determine actual report type based on user permissions
      const actualReportType = await this.determineReportType(user, requestedReportType);
      
      // Generate report using appropriate generator
      let report;
      if (actualReportType === 'detailed') {
        report = await this.detailedReportGenerator.generateReport(analysisData, {
          userId: user?.id,
          language
        });
      } else {
        report = await this.freeReportGenerator.generateReport(analysisData, {
          userId: user?.id,
          language
        });
      }

      // Add service metadata
      report.serviceMetadata = {
        actualReportType,
        requestedReportType,
        userPlan: user?.plan_type || 'anonymous',
        accessRestrictions: this.getAccessRestrictions(user, actualReportType),
        upgradeOptions: this.getUpgradeOptions(user, requestedReportType, actualReportType)
      };

      logger.info('Report generated successfully', {
        analysisId: analysisData.analysisId,
        actualType: actualReportType,
        issuesCount: report.executiveSummary?.issueCounts?.total || 0
      });

      return report;
    } catch (error) {
      logger.error('Failed to generate report:', error);
      throw error;
    }
  }

  /**
   * Determine what type of report the user can access
   * @param {Object} user - User object with plan information
   * @param {string} requestedType - Report type requested
   * @returns {string} Actual report type to generate
   */
  async determineReportType(user, requestedType) {
    // Anonymous users always get free reports
    if (!user) {
      logger.info('No user provided, returning free report');
      return 'free';
    }

    logger.info('Determining report type', {
      userId: user.id,
      userPlan: user.plan_type,
      requestedType,
      isDevelopment: process.env.NODE_ENV === 'development' || process.env.APP_ENV === 'development',
      NODE_ENV: process.env.NODE_ENV,
      APP_ENV: process.env.APP_ENV
    });

    // In development, allow detailed reports for authenticated users
    const isDevelopment = process.env.NODE_ENV === 'development' || process.env.APP_ENV === 'development';
    if (isDevelopment && requestedType === 'detailed' && user.id) {
      logger.info('Development mode: allowing detailed report for authenticated user');
      return 'detailed';
    }

    // Check user plan permissions
    const userPlan = user.plan_type || 'free';
    const canAccessDetailed = await this.canUserAccessDetailedReport(user);

    logger.info('Report access check results', {
      userPlan,
      canAccessDetailed,
      requestedType
    });

    if (requestedType === 'detailed' && canAccessDetailed) {
      return 'detailed';
    }

    // Default to free report
    return 'free';
  }

  /**
   * Check if user can access detailed reports
   * @param {Object} user - User object
   * @returns {boolean} Whether user can access detailed reports
   */
  async canUserAccessDetailedReport(user) {
    if (!user) return false;

    const userPlan = user.plan_type || 'free';
    
    // Premium users can always access detailed reports
    if (userPlan === 'premium' || userPlan === 'basic') {
      return true;
    }

    // Check if user has any active subscriptions or purchases
    try {
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('status, plan_type')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) {
        logger.warn('Failed to check user subscriptions:', error);
        return false;
      }

      // User has active subscription
      if (subscriptions && subscriptions.length > 0) {
        return subscriptions.some(sub => sub.plan_type !== 'free');
      }

      // Check for one-time purchases (future implementation)
      // This would check for recent detailed report purchases

      return false;
    } catch (error) {
      logger.error('Error checking user report access:', error);
      return false;
    }
  }

  /**
   * Get access restrictions for the current user/report type
   * @param {Object} user - User object
   * @param {string} reportType - Report type being generated
   * @returns {Object} Access restrictions
   */
  getAccessRestrictions(user, reportType) {
    if (reportType === 'detailed') {
      return {
        hasRestrictions: false,
        message: null
      };
    }

    // Free report restrictions
    return {
      hasRestrictions: true,
      message: 'This free report shows only the top 3 accessibility issues and 1 SEO recommendation.',
      limitations: [
        'Limited to top 3 accessibility issues',
        'Only 1 SEO recommendation shown',
        'No AI-powered insights',
        'No code snippets or detailed remediation steps',
        'Watermarked screenshots'
      ]
    };
  }

  /**
   * Get upgrade options for the user
   * @param {Object} user - User object
   * @param {string} requestedType - Originally requested report type
   * @param {string} actualType - Actually generated report type
   * @returns {Object} Upgrade options
   */
  getUpgradeOptions(user, requestedType, actualType) {
    // If user got what they requested, no upgrade needed
    if (requestedType === actualType) {
      return {
        showUpgradePrompt: false
      };
    }

    // If user requested detailed but got free, show upgrade options
    if (requestedType === 'detailed' && actualType === 'free') {
      return {
        showUpgradePrompt: true,
        reason: 'detailed_report_requested',
        message: 'You requested a detailed report, but this requires a premium account.',
        options: [
          {
            type: 'one_time_purchase',
            title: 'Buy Detailed Report',
            description: 'Get a complete analysis for this website',
            price: '$49',
            action: 'purchase_detailed_report'
          },
          {
            type: 'subscription',
            title: 'Upgrade to Premium',
            description: 'Unlimited detailed reports + ongoing monitoring',
            price: '$99/month',
            action: 'upgrade_to_premium'
          }
        ]
      };
    }

    // Default upgrade prompt for free users
    return {
      showUpgradePrompt: true,
      reason: 'free_report_limitations',
      message: 'Get the complete picture with our detailed analysis.',
      options: [
        {
          type: 'one_time_purchase',
          title: 'Buy Detailed Report',
          description: 'See all issues with step-by-step fixes',
          price: '$49',
          action: 'purchase_detailed_report'
        },
        {
          type: 'consultation',
          title: 'Free Consultation',
          description: 'Talk to our accessibility experts',
          price: 'Free',
          action: 'schedule_consultation'
        }
      ]
    };
  }

  /**
   * Convert new report format to legacy format for backward compatibility
   * @param {Object} newReport - Report from new generators
   * @returns {Object} Report in legacy format
   */
  convertToLegacyFormat(newReport) {
    // This ensures compatibility with existing frontend code
    return {
      analysisId: newReport.analysisId,
      url: newReport.url,
      reportType: newReport.reportType,
      timestamp: newReport.timestamp,
      language: newReport.language,

      // Legacy summary format
      summary: {
        overallScore: newReport.executiveSummary?.overallHealthScore || 0,
        accessibilityScore: newReport.executiveSummary?.overallHealthScore || 0,
        totalIssues: newReport.executiveSummary?.summaryOfFindings?.totalIssues || 0,
        criticalIssues: newReport.executiveSummary?.summaryOfFindings?.byCategory?.accessibility?.critical || 0,
        seriousIssues: newReport.executiveSummary?.summaryOfFindings?.byCategory?.accessibility?.serious || 0,
        moderateIssues: newReport.executiveSummary?.summaryOfFindings?.byCategory?.accessibility?.moderate || 0,
        minorIssues: newReport.executiveSummary?.summaryOfFindings?.byCategory?.accessibility?.minor || 0,
        complianceStatus: newReport.executiveSummary?.complianceStatus?.level || 'UNKNOWN',
        violationCount: newReport.executiveSummary?.summaryOfFindings?.totalIssues || 0
      },

      // Legacy violations format (for free reports, use top issues)
      violations: newReport.reportType === 'free' 
        ? this.convertFreeReportViolations(newReport)
        : this.convertDetailedReportViolations(newReport),

      // Screenshots
      screenshot: newReport.screenshot || newReport.screenshots,

      // AI insights (detailed reports only)
      aiInsights: newReport.aiInsights || null,

      // SEO data
      seo: newReport.seoRecommendations || newReport.topSeoImprovement,

      // Metadata
      metadata: {
        ...newReport.metadata,
        hasScreenshots: !!(newReport.screenshot || newReport.screenshots),
        hasSeoAnalysis: !!(newReport.seoRecommendations || newReport.topSeoImprovement),
        hasAiInsights: !!newReport.aiInsights,
        generatedWith: 'ReportService v2.0'
      },

      // Service metadata for frontend
      serviceMetadata: newReport.serviceMetadata
    };
  }

  /**
   * Convert free report violations to legacy format
   */
  convertFreeReportViolations(freeReport) {
    if (!freeReport.topAccessibilityIssues?.issues) return [];

    return freeReport.topAccessibilityIssues.issues.map((issue, index) => ({
      id: `free-issue-${index}`,
      help: issue.title,
      description: issue.whyItMatters,
      impact: index === 0 ? 'critical' : index === 1 ? 'serious' : 'moderate',
      nodes: Array(issue.elementsAffected).fill({
        html: 'Details available in detailed report',
        target: ['(hidden in free report)']
      }),
      tags: ['free-report'],
      helpUrl: '#upgrade-for-details'
    }));
  }

  /**
   * Convert detailed report violations to legacy format
   */
  convertDetailedReportViolations(detailedReport) {
    if (!detailedReport.accessibilityViolations?.violationsByPrinciple) return [];

    const allViolations = [];
    
    detailedReport.accessibilityViolations.violationsByPrinciple.forEach(principle => {
      principle.violations.forEach(violation => {
        allViolations.push({
          id: violation.issueTitle.toLowerCase().replace(/\s+/g, '-'),
          help: violation.issueTitle,
          description: violation.whatThisMeans,
          impact: violation.severity,
          nodes: violation.elementsAffected.map(element => ({
            html: element.html,
            target: element.target,
            snippet: element.snippet,
            failureSummary: element.failureSummary
          })),
          tags: [`wcag-${principle.principle}`, 'detailed-report'],
          helpUrl: violation.howToFix?.codeLocation?.[0]?.line || '#',
          // Additional detailed report data
          remediation: violation.howToFix,
          testingInstructions: violation.howToTest,
          estimatedFixTime: violation.estimatedFixTime,
          businessImpact: violation.businessImpact
        });
      });
    });

    return allViolations;
  }

  /**
   * Track report generation for analytics
   * @param {Object} reportData - Report generation data
   */
  async trackReportGeneration(reportData) {
    try {
      await supabase.rpc('log_report_access', {
        p_analysis_id: reportData.analysisId,
        p_user_id: reportData.userId || null,
        p_access_type: 'generate',
        p_report_type: reportData.actualReportType
      });
    } catch (error) {
      logger.error('Failed to track report generation:', error);
      // Don't throw - tracking failure shouldn't break report generation
    }
  }
}

module.exports = ReportService;