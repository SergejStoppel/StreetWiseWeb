const logger = require('../../utils/logger');
const supabase = require('../../config/supabase');

/**
 * FreeReportGenerator - Generates MVP free reports with limited content
 * Based on Report_Definitions_for_StreetWiseWeb.md specifications
 */
class FreeReportGenerator {
  constructor() {
    this.reportConfig = null;
  }

  /**
   * Load report configuration from database
   */
  async loadConfiguration() {
    try {
      const { data, error } = await supabase
        .from('report_configurations')
        .select('*')
        .eq('report_type', 'free')
        .single();

      if (error) throw error;
      this.reportConfig = data;
      return this.reportConfig;
    } catch (error) {
      logger.error('Failed to load free report configuration:', error);
      // Use default configuration if database load fails
      this.reportConfig = this.getDefaultConfiguration();
      return this.reportConfig;
    }
  }

  /**
   * Default configuration for free reports
   */
  getDefaultConfiguration() {
    return {
      report_type: 'free',
      max_issues_shown: 3,
      includes_ai_insights: false,
      includes_code_snippets: false,
      includes_remediation_steps: false,
      includes_full_screenshots: false,
      includes_seo_analysis: false,
      watermark_enabled: true,
      included_features: {
        accessibility: {
          show_top_issues: true,
          max_issues: 3,
          show_summary_only: true,
          show_wcag_references: false,
          show_issue_count: true,
          show_affected_elements: false
        },
        seo: {
          show_top_issue: true,
          max_issues: 1,
          show_basic_recommendation: true,
          show_technical_details: false
        },
        screenshots: {
          show_main_only: true,
          max_resolution: 'thumbnail',
          watermark: true
        },
        cta: {
          show_upgrade_prompts: true,
          highlight_premium_features: true
        }
      }
    };
  }

  /**
   * Generate a free report from full analysis data
   * @param {Object} fullAnalysisData - Complete analysis data
   * @param {Object} options - Additional options
   * @returns {Object} Free report with limited content
   */
  async generateReport(fullAnalysisData, options = {}) {
    if (!this.reportConfig) {
      await this.loadConfiguration();
    }

    logger.info('Generating free report', { 
      analysisId: fullAnalysisData.analysisId,
      url: fullAnalysisData.url 
    });

    try {
      const freeReport = {
        // Core metadata
        analysisId: fullAnalysisData.analysisId,
        url: fullAnalysisData.url,
        timestamp: fullAnalysisData.timestamp,
        reportType: 'free',
        language: fullAnalysisData.language || 'en',

        // Executive Summary / Overall Health Score
        executiveSummary: this.generateExecutiveSummary(fullAnalysisData),

        // Top 3 Critical Accessibility Issues
        topAccessibilityIssues: this.extractTopAccessibilityIssues(fullAnalysisData),

        // Most Important SEO Improvement
        topSeoImprovement: this.extractTopSeoImprovement(fullAnalysisData),

        // Call to Action
        callToAction: this.generateCallToAction(fullAnalysisData),

        // Basic screenshot (watermarked)
        screenshot: this.processScreenshot(fullAnalysisData.screenshot),

        // Disclaimer
        disclaimer: this.getDisclaimer(),

        // Metadata for tracking
        metadata: {
          generatedAt: new Date().toISOString(),
          reportVersion: '1.0',
          upgradePrompts: this.getUpgradePrompts(fullAnalysisData)
        }
      };

      // Log report access
      if (options.userId) {
        await this.logReportAccess(fullAnalysisData.analysisId, options.userId, 'generate');
      }

      return freeReport;
    } catch (error) {
      logger.error('Failed to generate free report:', error);
      throw error;
    }
  }

  /**
   * Generate executive summary with overall health score
   */
  generateExecutiveSummary(analysisData) {
    const overallScore = analysisData.summary?.overallScore || 0;
    const complianceStatus = this.getComplianceStatus(overallScore);
    const keyTakeaway = this.generateKeyTakeaway(analysisData);

    return {
      headline: "Your Website's Snapshot: How Healthy Is It?",
      overallScore: Math.round(overallScore),
      complianceStatus: {
        level: complianceStatus.level,
        badge: complianceStatus.badge,
        color: complianceStatus.color,
        message: complianceStatus.message
      },
      keyTakeaway,
      // Show totals but not details
      issueCounts: {
        total: analysisData.summary?.totalIssues || 0,
        critical: analysisData.summary?.criticalIssues || 0,
        serious: analysisData.summary?.seriousIssues || 0
      }
    };
  }

  /**
   * Determine compliance status based on score
   */
  getComplianceStatus(score) {
    if (score >= 90) {
      return {
        level: 'HEALTHY',
        badge: 'healthy',
        color: 'green',
        message: 'Your site meets most accessibility standards'
      };
    } else if (score >= 70) {
      return {
        level: 'NEEDS IMPROVEMENT',
        badge: 'needs-improvement',
        color: 'yellow',
        message: 'Your site has some accessibility issues that need attention'
      };
    } else {
      return {
        level: 'NOT COMPLIANT',
        badge: 'not-compliant',
        color: 'red',
        message: 'Your site may be at risk of accessibility lawsuits and is losing potential customers'
      };
    }
  }

  /**
   * Generate key takeaway message
   */
  generateKeyTakeaway(analysisData) {
    const criticalCount = analysisData.summary?.criticalIssues || 0;
    const totalIssues = analysisData.summary?.totalIssues || 0;

    if (criticalCount > 5) {
      return `Your website has ${criticalCount} critical accessibility issues that are preventing many users from accessing your content.`;
    } else if (totalIssues > 20) {
      return `With ${totalIssues} total issues found, your website needs significant improvements to be fully accessible.`;
    } else if (totalIssues > 0) {
      return `Your website has ${totalIssues} accessibility issues that could be impacting your user experience and SEO.`;
    } else {
      return 'Your website appears to be in good health with minimal accessibility issues.';
    }
  }

  /**
   * Extract top 3 critical accessibility issues
   */
  extractTopAccessibilityIssues(analysisData) {
    const violations = analysisData.violations || [];
    
    // Sort by severity and impact
    const sortedViolations = violations
      .filter(v => v.impact === 'critical' || v.impact === 'serious')
      .sort((a, b) => {
        const impactOrder = { critical: 0, serious: 1, moderate: 2, minor: 3 };
        return (impactOrder[a.impact] || 4) - (impactOrder[b.impact] || 4);
      })
      .slice(0, 3);

    return {
      headline: "Urgent: Your Top 3 Accessibility Roadblocks",
      issues: sortedViolations.map(violation => ({
        title: this.simplifyViolationTitle(violation),
        whyItMatters: this.generateImpactDescription(violation),
        elementsAffected: violation.nodes?.length || 0,
        wcagReference: this.simplifyWcagReference(violation),
        suggestedNextStep: "Contact us to learn how to fix this quickly.",
        // Hide technical details
        _premium: {
          description: violation.description,
          helpUrl: violation.helpUrl,
          nodes: violation.nodes
        }
      }))
    };
  }

  /**
   * Simplify violation titles for non-technical audience
   */
  simplifyViolationTitle(violation) {
    const titleMap = {
      'image-alt': 'Missing Image Descriptions',
      'color-contrast': 'Hard-to-Read Text',
      'label': 'Unlabeled Form Fields',
      'button-name': 'Unnamed Buttons',
      'link-name': 'Unclear Links',
      'heading-order': 'Confusing Page Structure',
      'aria-valid-attr': 'Technical Accessibility Errors',
      'duplicate-id': 'Page Code Issues'
    };

    return titleMap[violation.id] || violation.help || 'Accessibility Issue';
  }

  /**
   * Generate business-focused impact description
   */
  generateImpactDescription(violation) {
    const impactMap = {
      'image-alt': 'This means visually impaired visitors can\'t understand your images, potentially leading to lost sales and legal issues.',
      'color-contrast': 'Visitors with vision problems can\'t read your content, causing them to leave your site immediately.',
      'label': 'Users can\'t complete your forms, directly impacting conversions and customer inquiries.',
      'button-name': 'Screen reader users can\'t interact with your buttons, preventing them from taking important actions.',
      'link-name': 'Users don\'t know where your links go, creating confusion and reducing engagement.'
    };

    return impactMap[violation.id] || 
      'This issue prevents some users from fully accessing your website, potentially reducing your customer base.';
  }

  /**
   * Simplify WCAG references
   */
  simplifyWcagReference(violation) {
    if (!violation.tags || violation.tags.length === 0) return null;

    const wcagTag = violation.tags.find(tag => tag.includes('wcag'));
    if (!wcagTag) return null;

    // Map WCAG principles to simple explanations
    if (wcagTag.includes('wcag2a')) {
      return '(WCAG: Basic accessibility requirement)';
    } else if (wcagTag.includes('wcag2aa')) {
      return '(WCAG: Standard accessibility requirement)';
    }

    return '(WCAG: Accessibility standard)';
  }

  /**
   * Extract most important SEO improvement
   */
  extractTopSeoImprovement(analysisData) {
    const seoData = analysisData.seo || {};
    
    // Prioritize SEO issues
    const topIssue = this.findMostImportantSeoIssue(seoData);

    return {
      headline: "Your #1 Opportunity to Get More Customers from Google & AI",
      issue: {
        title: topIssue.title,
        whyItMatters: topIssue.impact,
        suggestedNextStep: "Let's discuss how to boost your online visibility.",
        // Hide detailed recommendations
        _premium: topIssue.details
      }
    };
  }

  /**
   * Find most important SEO issue
   */
  findMostImportantSeoIssue(seoData) {
    // Priority order for SEO issues
    if (!seoData.metaDescription || seoData.metaDescription.length === 0) {
      return {
        title: "Missing Page Description",
        impact: "Search engines and AI tools don't know what your page is about, so they won't show it to potential customers.",
        details: { type: 'missing_meta_description' }
      };
    }

    if (!seoData.title || seoData.title.length < 10) {
      return {
        title: "Poor Page Title",
        impact: "Your page title doesn't grab attention in search results, causing people to skip over your site.",
        details: { type: 'poor_title', current: seoData.title }
      };
    }

    if (!seoData.headings?.h1 || seoData.headings.h1.length === 0) {
      return {
        title: "Missing Main Heading",
        impact: "Search engines can't understand your page structure, lowering your rankings.",
        details: { type: 'missing_h1' }
      };
    }

    // Default improvement
    return {
      title: "Website Not Optimized for AI",
      impact: "AI tools like ChatGPT might not accurately represent your business to potential customers.",
      details: { type: 'ai_optimization' }
    };
  }

  /**
   * Generate call to action section
   */
  generateCallToAction(analysisData) {
    return {
      headline: "Ready for a Healthier, More Profitable Website?",
      content: "Your free report is just the beginning. To get a complete picture of your website's health, understand every issue, and get step-by-step guidance on how to fix them, consider our Detailed Website Analysis Report.",
      primaryCTA: {
        text: "Get Your Detailed Website Analysis Report",
        action: "upgrade_to_detailed",
        highlight: true
      },
      secondaryCTA: {
        text: "Schedule a Free Consultation",
        action: "schedule_consultation"
      }
    };
  }

  /**
   * Process screenshot with watermark for free reports
   */
  processScreenshot(screenshot) {
    if (!screenshot) return null;

    return {
      url: screenshot.desktop || screenshot.mobile || screenshot,
      type: 'thumbnail',
      watermarked: true,
      caption: 'Website preview - Full resolution available in detailed report'
    };
  }

  /**
   * Get disclaimer text
   */
  getDisclaimer() {
    return "This report provides a high-level overview based on automated scanning and is not a substitute for a full, professional audit. For comprehensive analysis and legal compliance, please refer to our Detailed Website Analysis Report.";
  }

  /**
   * Generate upgrade prompts based on issues found
   */
  getUpgradePrompts(analysisData) {
    const prompts = [];
    const totalIssues = analysisData.summary?.totalIssues || 0;
    const criticalIssues = analysisData.summary?.criticalIssues || 0;

    if (criticalIssues > 3) {
      prompts.push({
        type: 'critical_issues',
        message: `You have ${criticalIssues - 3} more critical issues not shown in this free report.`,
        cta: 'See all critical issues'
      });
    }

    if (totalIssues > 10) {
      prompts.push({
        type: 'hidden_issues',
        message: `${totalIssues - 3} additional issues found. Detailed report includes all issues with fixes.`,
        cta: 'View complete analysis'
      });
    }

    if (analysisData.aiInsights) {
      prompts.push({
        type: 'ai_insights',
        message: 'AI-powered recommendations available in detailed report.',
        cta: 'Get AI insights'
      });
    }

    return prompts;
  }

  /**
   * Log report access for analytics
   */
  async logReportAccess(analysisId, userId, accessType) {
    try {
      await supabase.rpc('log_report_access', {
        p_analysis_id: analysisId,
        p_user_id: userId,
        p_access_type: accessType,
        p_report_type: 'free'
      });
    } catch (error) {
      logger.error('Failed to log report access:', error);
      // Don't throw - logging failure shouldn't break report generation
    }
  }
}

module.exports = FreeReportGenerator;