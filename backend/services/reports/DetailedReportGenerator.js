const logger = require('../../utils/logger');
const supabase = require('../../config/supabase');

/**
 * DetailedReportGenerator - Generates comprehensive paid reports
 * Based on Report_Definitions_for_StreetWiseWeb.md specifications
 */
class DetailedReportGenerator {
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
        .eq('report_type', 'detailed')
        .single();

      if (error) throw error;
      this.reportConfig = data;
      return this.reportConfig;
    } catch (error) {
      logger.error('Failed to load detailed report configuration:', error);
      // Use default configuration if database load fails
      this.reportConfig = this.getDefaultConfiguration();
      return this.reportConfig;
    }
  }

  /**
   * Default configuration for detailed reports
   */
  getDefaultConfiguration() {
    return {
      report_type: 'detailed',
      max_issues_shown: null, // No limit
      includes_ai_insights: true,
      includes_code_snippets: true,
      includes_remediation_steps: true,
      includes_full_screenshots: true,
      includes_seo_analysis: true,
      watermark_enabled: false,
      included_features: {
        accessibility: {
          show_all_issues: true,
          show_wcag_details: true,
          show_affected_elements: true,
          show_disability_impact: true,
          show_code_snippets: true,
          show_remediation_steps: true,
          group_by_wcag_principle: true
        },
        seo: {
          show_all_recommendations: true,
          show_technical_seo: true,
          show_ai_suggestions: true,
          show_competitor_insights: true,
          show_priority_matrix: true
        },
        screenshots: {
          show_desktop_mobile: true,
          show_full_page: true,
          high_resolution: true,
          annotated_issues: true
        },
        ai_insights: {
          enabled: true,
          show_remediation_priority: true,
          show_business_impact: true,
          show_implementation_timeline: true
        },
        export: {
          pdf_enabled: true,
          csv_enabled: true,
          share_link_enabled: true
        }
      }
    };
  }

  /**
   * Generate a detailed report from full analysis data
   * @param {Object} fullAnalysisData - Complete analysis data
   * @param {Object} options - Additional options
   * @returns {Object} Detailed report with comprehensive content
   */
  async generateReport(fullAnalysisData, options = {}) {
    if (!this.reportConfig) {
      await this.loadConfiguration();
    }

    logger.info('Generating detailed report', { 
      analysisId: fullAnalysisData.analysisId,
      url: fullAnalysisData.url 
    });

    try {
      const detailedReport = {
        // Core metadata
        analysisId: fullAnalysisData.analysisId,
        url: fullAnalysisData.url,
        timestamp: fullAnalysisData.timestamp,
        reportType: 'detailed',
        language: fullAnalysisData.language || 'en',

        // Executive Summary & Overall Score
        executiveSummary: this.generateExecutiveSummary(fullAnalysisData),

        // Accessibility Violations (Detailed)
        accessibilityViolations: this.processAccessibilityViolations(fullAnalysisData),

        // SEO Recommendations (Detailed)
        seoRecommendations: this.processSeoRecommendations(fullAnalysisData),

        // AI Insights
        aiInsights: this.processAiInsights(fullAnalysisData),

        // Screenshots (High-res, multiple views)
        screenshots: this.processScreenshots(fullAnalysisData),

        // Overall Recommendations & Next Steps
        recommendations: this.generateRecommendations(fullAnalysisData),

        // Technical appendix
        technicalDetails: this.generateTechnicalDetails(fullAnalysisData),

        // Export options
        exportOptions: {
          pdf: true,
          csv: true,
          shareLink: true
        },

        // Metadata
        metadata: {
          generatedAt: new Date().toISOString(),
          reportVersion: '2.0',
          totalIssuesAnalyzed: fullAnalysisData.violations?.length || 0,
          analysisDepth: 'comprehensive'
        }
      };

      // Log report access
      if (options.userId) {
        await this.logReportAccess(fullAnalysisData.analysisId, options.userId, 'generate');
      }

      return detailedReport;
    } catch (error) {
      logger.error('Failed to generate detailed report:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive executive summary
   */
  generateExecutiveSummary(analysisData) {
    const overallScore = analysisData.summary?.overallScore || 0;
    const complianceStatus = this.getComplianceStatus(overallScore);
    
    return {
      overallHealthScore: Math.round(overallScore),
      complianceStatus: {
        level: complianceStatus.level,
        badge: complianceStatus.badge,
        color: complianceStatus.color,
        message: complianceStatus.message,
        legalRiskAssessment: this.assessLegalRisk(analysisData)
      },
      summaryOfFindings: {
        totalIssues: analysisData.summary?.totalIssues || 0,
        byCategory: {
          accessibility: {
            critical: analysisData.summary?.criticalIssues || 0,
            serious: analysisData.summary?.seriousIssues || 0,
            moderate: analysisData.summary?.moderateIssues || 0,
            minor: analysisData.summary?.minorIssues || 0
          },
          seo: analysisData.seo?.issueCount || 0,
          performance: analysisData.performance?.issueCount || 0
        }
      },
      estimatedEffort: this.calculateEstimatedEffort(analysisData),
      businessImpact: this.assessBusinessImpact(analysisData)
    };
  }

  /**
   * Process all accessibility violations with full details
   */
  processAccessibilityViolations(analysisData) {
    const violations = analysisData.violations || [];
    
    // Group by WCAG principle
    const groupedViolations = this.groupViolationsByWcagPrinciple(violations);
    
    return {
      organization: 'wcag_principle',
      totalViolations: violations.length,
      violationsByPrinciple: Object.entries(groupedViolations).map(([principle, violations]) => ({
        principle,
        violationCount: violations.length,
        violations: violations.map(violation => this.processDetailedViolation(violation))
      }))
    };
  }

  /**
   * Process individual violation with full remediation details
   */
  processDetailedViolation(violation) {
    return {
      issueTitle: violation.help,
      wcagCriteria: this.extractWcagCriteria(violation),
      severity: violation.impact,
      elementsAffected: violation.nodes?.map(node => ({
        html: node.html,
        target: node.target,
        snippet: node.snippet || node.html,
        failureSummary: node.failureSummary
      })) || [],
      disabilityGroupsImpacted: this.identifyImpactedGroups(violation),
      whatThisMeans: violation.description,
      howToFix: {
        codeLocation: this.extractCodeLocation(violation),
        correctCodeExample: this.generateCorrectCode(violation),
        incorrectCodeExample: this.extractIncorrectCode(violation),
        stepByStepInstructions: this.generateRemediationSteps(violation),
        multipleSolutions: this.generateAlternativeSolutions(violation)
      },
      howToTest: this.generateTestingInstructions(violation),
      estimatedFixTime: this.estimateFixTime(violation),
      businessImpact: this.assessViolationBusinessImpact(violation)
    };
  }

  /**
   * Group violations by WCAG principle
   */
  groupViolationsByWcagPrinciple(violations) {
    const principles = {
      perceivable: [],
      operable: [],
      understandable: [],
      robust: []
    };

    violations.forEach(violation => {
      const principle = this.identifyWcagPrinciple(violation);
      if (principles[principle]) {
        principles[principle].push(violation);
      } else {
        principles.robust.push(violation); // Default
      }
    });

    return principles;
  }

  /**
   * Identify WCAG principle from violation
   */
  identifyWcagPrinciple(violation) {
    const tags = violation.tags || [];
    
    if (tags.some(tag => tag.includes('perceivable'))) return 'perceivable';
    if (tags.some(tag => tag.includes('operable'))) return 'operable';
    if (tags.some(tag => tag.includes('understandable'))) return 'understandable';
    if (tags.some(tag => tag.includes('robust'))) return 'robust';
    
    // Map common violations to principles
    const violationPrincipleMap = {
      'image-alt': 'perceivable',
      'color-contrast': 'perceivable',
      'label': 'understandable',
      'button-name': 'operable',
      'link-name': 'operable',
      'heading-order': 'understandable'
    };
    
    return violationPrincipleMap[violation.id] || 'robust';
  }

  /**
   * Extract WCAG criteria information
   */
  extractWcagCriteria(violation) {
    const wcagTags = violation.tags?.filter(tag => tag.includes('wcag')) || [];
    
    return {
      level: wcagTags.find(tag => tag.includes('wcag2a')) ? 'A' : 
             wcagTags.find(tag => tag.includes('wcag2aa')) ? 'AA' : 
             wcagTags.find(tag => tag.includes('wcag2aaa')) ? 'AAA' : 'Unknown',
      criteria: wcagTags.map(tag => {
        const match = tag.match(/wcag(\d+)/);
        return match ? match[1].split('').join('.') : tag;
      }),
      description: violation.description
    };
  }

  /**
   * Identify disability groups impacted by violation
   */
  identifyImpactedGroups(violation) {
    const impactMap = {
      'image-alt': ['Blind', 'Low Vision'],
      'color-contrast': ['Low Vision', 'Color Blind'],
      'label': ['Blind', 'Cognitive'],
      'button-name': ['Blind', 'Motor'],
      'link-name': ['Blind', 'Cognitive'],
      'heading-order': ['Blind', 'Cognitive'],
      'aria-': ['Blind', 'Motor']
    };

    for (const [key, groups] of Object.entries(impactMap)) {
      if (violation.id.includes(key)) {
        return groups;
      }
    }

    return ['All Users'];
  }

  /**
   * Generate remediation steps
   */
  generateRemediationSteps(violation) {
    const steps = [];
    
    switch (violation.id) {
      case 'image-alt':
        steps.push('Locate all images without alt text in your HTML');
        steps.push('Add alt="" for decorative images');
        steps.push('Add descriptive alt text for informational images');
        steps.push('Ensure alt text describes the image purpose, not just appearance');
        break;
      case 'color-contrast':
        steps.push('Identify text with insufficient contrast');
        steps.push('Use a contrast checker tool to verify current contrast ratio');
        steps.push('Adjust either text color or background color');
        steps.push('Aim for 4.5:1 ratio for normal text, 3:1 for large text');
        break;
      default:
        steps.push('Review the affected elements');
        steps.push('Apply the recommended fix');
        steps.push('Test with assistive technology');
        steps.push('Verify the issue is resolved');
    }
    
    return steps;
  }

  /**
   * Process SEO recommendations with full details
   */
  processSeoRecommendations(analysisData) {
    const seoData = analysisData.seo || {};
    const recommendations = this.generateSeoRecommendations(seoData);
    
    return {
      organization: 'category',
      categories: [
        {
          name: 'On-Page SEO',
          recommendations: recommendations.onPage
        },
        {
          name: 'Technical SEO',
          recommendations: recommendations.technical
        },
        {
          name: 'Content SEO',
          recommendations: recommendations.content
        },
        {
          name: 'AI Discoverability',
          recommendations: recommendations.aiDiscoverability
        }
      ],
      priorityMatrix: this.generateSeoPriorityMatrix(recommendations)
    };
  }

  /**
   * Generate SEO recommendations by category
   */
  generateSeoRecommendations(seoData) {
    return {
      onPage: [
        {
          title: 'Optimize Meta Descriptions',
          category: 'On-Page',
          priority: 'High',
          whyItMatters: 'Meta descriptions directly impact click-through rates from search results',
          currentState: seoData.metaDescription || 'Missing',
          recommendedAction: 'Write unique, compelling meta descriptions under 160 characters for each page',
          bestPracticeExample: 'Professional web accessibility testing - Get instant WCAG compliance reports. Free analysis in 60 seconds.',
          tools: ['Yoast SEO', 'Google Search Console'],
          estimatedImpact: 'High',
          implementationTime: '2-4 hours'
        }
      ],
      technical: [
        {
          title: 'Improve Page Load Speed',
          category: 'Technical',
          priority: 'High',
          whyItMatters: 'Page speed is a direct ranking factor and impacts user experience',
          currentState: `${seoData.loadTime || 'Unknown'} seconds`,
          recommendedAction: 'Optimize images, enable caching, minify CSS/JS',
          tools: ['Google PageSpeed Insights', 'GTmetrix'],
          estimatedImpact: 'High',
          implementationTime: '4-8 hours'
        }
      ],
      content: [
        {
          title: 'Add Structured Data',
          category: 'Content',
          priority: 'Medium',
          whyItMatters: 'Helps search engines understand your content and can enable rich snippets',
          recommendedAction: 'Implement Schema.org markup for your business type',
          tools: ['Schema.org', 'Google Structured Data Testing Tool'],
          estimatedImpact: 'Medium',
          implementationTime: '2-3 hours'
        }
      ],
      aiDiscoverability: [
        {
          title: 'Optimize for AI Assistants',
          category: 'AI',
          priority: 'High',
          whyItMatters: 'AI tools increasingly influence how customers find businesses',
          recommendedAction: 'Create clear, factual content that AI can easily parse and summarize',
          bestPracticeExample: 'Include FAQ sections, clear service descriptions, and structured information',
          estimatedImpact: 'Growing',
          implementationTime: '3-5 hours'
        }
      ]
    };
  }

  /**
   * Process AI insights
   */
  processAiInsights(analysisData) {
    const aiData = analysisData.aiInsights || {};
    
    return {
      enabled: true,
      remediationPriority: this.generateAiRemediationPriority(analysisData),
      businessImpactAnalysis: this.generateAiBusinessImpact(analysisData),
      implementationTimeline: this.generateImplementationTimeline(analysisData),
      competitorInsights: aiData.competitorInsights || null,
      customRecommendations: aiData.customRecommendations || []
    };
  }

  /**
   * Generate AI-powered remediation priority
   */
  generateAiRemediationPriority(analysisData) {
    const violations = analysisData.violations || [];
    
    // Sort violations by business impact and ease of fix
    const prioritizedViolations = violations
      .map(v => ({
        violation: v.help,
        impact: v.impact,
        occurrences: v.nodes?.length || 0,
        businessImpact: this.calculateBusinessImpactScore(v),
        effortScore: this.calculateEffortScore(v),
        priority: 0 // Will be calculated
      }))
      .map(v => ({
        ...v,
        priority: (v.businessImpact * 2 + (10 - v.effortScore)) / 3
      }))
      .sort((a, b) => b.priority - a.priority);

    return {
      topPriorities: prioritizedViolations.slice(0, 5),
      quickWins: prioritizedViolations.filter(v => v.effortScore <= 3).slice(0, 5),
      highImpact: prioritizedViolations.filter(v => v.businessImpact >= 8).slice(0, 5)
    };
  }

  /**
   * Generate AI-powered business impact analysis
   */
  generateAiBusinessImpact(analysisData) {
    const violations = analysisData.violations || [];
    const summary = analysisData.summary || {};
    
    // Calculate potential user impact
    const criticalIssues = violations.filter(v => v.impact === 'critical').length;
    const seriousIssues = violations.filter(v => v.impact === 'serious').length;
    
    // Estimate user base affected
    const totalIssues = violations.length;
    const userImpactPercentage = Math.min(100, Math.max(10, totalIssues * 5));
    
    // Business risk assessment
    let riskLevel = 'low';
    let riskScore = 0;
    
    if (criticalIssues > 5 || summary.accessibilityScore < 50) {
      riskLevel = 'high';
      riskScore = 8;
    } else if (criticalIssues > 2 || summary.accessibilityScore < 70) {
      riskLevel = 'medium';
      riskScore = 5;
    } else {
      riskLevel = 'low';
      riskScore = 2;
    }
    
    return {
      potentialUserImpact: {
        affectedUserPercentage: userImpactPercentage,
        disabilityTypes: ['visual', 'motor', 'cognitive', 'auditory'],
        severityDistribution: {
          critical: criticalIssues,
          serious: seriousIssues,
          moderate: violations.filter(v => v.impact === 'moderate').length,
          minor: violations.filter(v => v.impact === 'minor').length
        }
      },
      businessRisks: {
        level: riskLevel,
        score: riskScore,
        legalCompliance: summary.accessibilityScore >= 80 ? 'compliant' : 'at-risk',
        brandReputation: riskLevel === 'high' ? 'at-risk' : 'stable',
        marketAccess: userImpactPercentage > 25 ? 'limited' : 'good'
      },
      financialImpact: {
        estimatedLostRevenue: this.calculateLostRevenue(totalIssues, userImpactPercentage),
        complianceCosts: this.estimateComplianceCosts(totalIssues),
        implementationROI: this.calculateImplementationROI(totalIssues)
      }
    };
  }

  /**
   * Generate implementation timeline with priorities
   */
  generateImplementationTimeline(analysisData) {
    const violations = analysisData.violations || [];
    const totalIssues = violations.length;
    
    // Calculate phases based on violation severity and effort
    const phase1Issues = violations.filter(v => v.impact === 'critical').length;
    const phase2Issues = violations.filter(v => v.impact === 'serious').length;
    const phase3Issues = violations.filter(v => ['moderate', 'minor'].includes(v.impact)).length;
    
    return {
      overview: {
        totalEstimatedDays: Math.min(180, Math.max(30, totalIssues * 2)),
        phases: 3,
        recommendedApproach: 'phased-implementation'
      },
      phases: [
        {
          phase: 1,
          title: 'Critical Issues & Quick Wins',
          duration: Math.min(30, Math.max(7, phase1Issues * 2)),
          priority: 'high',
          issueCount: phase1Issues,
          description: 'Address critical accessibility barriers and implement quick wins',
          milestones: ['Critical barriers removed', 'Basic compliance achieved']
        },
        {
          phase: 2,
          title: 'Serious Issues & UX Improvements',
          duration: Math.min(60, Math.max(14, phase2Issues * 3)),
          priority: 'medium',
          issueCount: phase2Issues,
          description: 'Fix serious usability issues and enhance user experience',
          milestones: ['Major usability improved', 'WCAG AA compliance']
        },
        {
          phase: 3,
          title: 'Remaining Issues & Enhancement',
          duration: Math.min(90, Math.max(14, phase3Issues * 2)),
          priority: 'low',
          issueCount: phase3Issues,
          description: 'Complete remaining issues and implement enhancements',
          milestones: ['Full compliance achieved', 'Enhanced accessibility features']
        }
      ]
    };
  }

  /**
   * Helper: Calculate estimated lost revenue
   */
  calculateLostRevenue(totalIssues, userImpactPercentage) {
    const baseRevenueLoss = Math.min(25, totalIssues * 0.5);
    return {
      percentage: baseRevenueLoss,
      description: `Estimated ${baseRevenueLoss}% revenue loss from accessibility barriers`,
      factors: ['User abandonment', 'Reduced conversion', 'Limited market reach']
    };
  }

  /**
   * Helper: Estimate compliance implementation costs
   */
  estimateComplianceCosts(totalIssues) {
    const developmentHours = Math.min(500, totalIssues * 4);
    const testingHours = Math.min(200, totalIssues * 2);
    
    return {
      developmentHours,
      testingHours,
      totalHours: developmentHours + testingHours,
      estimatedCost: (developmentHours * 75) + (testingHours * 60),
      breakdown: {
        development: developmentHours * 75,
        testing: testingHours * 60,
        audit: 2500
      }
    };
  }

  /**
   * Helper: Calculate implementation ROI
   */
  calculateImplementationROI(totalIssues) {
    const implementationCost = (totalIssues * 4 * 75) + (totalIssues * 2 * 60) + 2500;
    const potentialSavings = implementationCost * 0.3; // Legal risk mitigation
    const revenueIncrease = implementationCost * 0.15; // Market expansion
    
    return {
      investmentRequired: implementationCost,
      potentialBenefits: potentialSavings + revenueIncrease,
      roi: ((potentialSavings + revenueIncrease) / implementationCost) * 100,
      paybackPeriod: '12-18 months'
    };
  }

  /**
   * Process screenshots with annotations
   */
  processScreenshots(analysisData) {
    const screenshots = analysisData.screenshots || {};
    
    return {
      desktop: {
        url: screenshots.desktop,
        resolution: 'high',
        annotations: analysisData.screenshotAnnotations?.desktop || []
      },
      mobile: {
        url: screenshots.mobile,
        resolution: 'high',
        annotations: analysisData.screenshotAnnotations?.mobile || []
      },
      fullPage: screenshots.fullPage || null,
      issueHighlights: this.generateIssueHighlights(analysisData)
    };
  }

  /**
   * Generate overall recommendations
   */
  generateRecommendations(analysisData) {
    return {
      prioritizationMatrix: this.generatePrioritizationMatrix(analysisData),
      implementationRoadmap: this.generateImplementationRoadmap(analysisData),
      ongoingMaintenance: {
        recommendations: [
          'Set up automated accessibility monitoring',
          'Conduct quarterly manual reviews',
          'Train development team on accessibility best practices',
          'Implement accessibility testing in CI/CD pipeline'
        ],
        tools: ['axe DevTools', 'WAVE', 'Lighthouse CI']
      },
      streetWiseWebServices: {
        monitoring: 'Continuous accessibility monitoring with instant alerts',
        implementation: 'Expert remediation services with guaranteed compliance',
        training: 'Team training and ongoing support'
      }
    };
  }

  /**
   * Generate technical details appendix
   */
  generateTechnicalDetails(analysisData) {
    return {
      scanMetadata: {
        scanDate: analysisData.timestamp,
        scanDuration: analysisData.scanDuration || 'N/A',
        pagesCrawled: analysisData.pagesCrawled || 1,
        rulesRun: analysisData.rulesRun || 'WCAG 2.1 AA'
      },
      browserContext: {
        viewport: analysisData.browserContext?.viewport || { width: 1920, height: 1080 },
        userAgent: analysisData.browserContext?.userAgent || 'Chrome/Latest'
      },
      fullViolationData: analysisData.violations,
      glossary: this.getGlossaryTerms()
    };
  }

  /**
   * Helper methods
   */
  
  getComplianceStatus(score) {
    if (score >= 95) {
      return {
        level: 'COMPLIANT',
        badge: 'compliant',
        color: 'green',
        message: 'Your site meets WCAG 2.1 AA standards'
      };
    } else if (score >= 80) {
      return {
        level: 'MOSTLY COMPLIANT',
        badge: 'mostly-compliant',
        color: 'yellow',
        message: 'Your site is close to meeting WCAG 2.1 AA standards'
      };
    } else if (score >= 60) {
      return {
        level: 'PARTIALLY COMPLIANT',
        badge: 'partially-compliant',
        color: 'orange',
        message: 'Your site has significant accessibility gaps'
      };
    } else {
      return {
        level: 'NON-COMPLIANT',
        badge: 'non-compliant',
        color: 'red',
        message: 'Your site does not meet WCAG 2.1 AA standards'
      };
    }
  }

  assessLegalRisk(analysisData) {
    const criticalIssues = analysisData.summary?.criticalIssues || 0;
    
    if (criticalIssues > 10) {
      return {
        level: 'High',
        description: 'Significant risk of accessibility lawsuits'
      };
    } else if (criticalIssues > 5) {
      return {
        level: 'Medium',
        description: 'Moderate risk of legal action'
      };
    } else {
      return {
        level: 'Low',
        description: 'Lower risk but still requires attention'
      };
    }
  }

  calculateEstimatedEffort(analysisData) {
    const totalIssues = analysisData.summary?.totalIssues || 0;
    const hours = Math.ceil(totalIssues * 0.5); // Rough estimate
    
    return {
      totalHours: hours,
      breakdown: {
        accessibility: Math.ceil(hours * 0.7),
        seo: Math.ceil(hours * 0.2),
        testing: Math.ceil(hours * 0.1)
      }
    };
  }

  assessBusinessImpact(analysisData) {
    return {
      potentialLostCustomers: 'Up to 20% of users may be unable to use your site',
      seoImpact: 'Accessibility issues negatively impact search rankings',
      brandReputation: 'Poor accessibility reflects negatively on brand values',
      legalExposure: this.assessLegalRisk(analysisData).description
    };
  }

  calculateBusinessImpactScore(violation) {
    const impactWeights = {
      critical: 10,
      serious: 7,
      moderate: 4,
      minor: 1
    };
    
    const occurrences = violation.nodes?.length || 1;
    const baseScore = impactWeights[violation.impact] || 1;
    
    return Math.min(10, baseScore + Math.log(occurrences));
  }

  calculateEffortScore(violation) {
    const effortMap = {
      'image-alt': 2, // Easy to fix
      'color-contrast': 4, // Moderate
      'label': 3,
      'button-name': 2,
      'link-name': 2,
      'heading-order': 5,
      'aria-': 7 // Complex
    };
    
    for (const [key, score] of Object.entries(effortMap)) {
      if (violation.id.includes(key)) {
        return score;
      }
    }
    
    return 5; // Default moderate effort
  }

  generateCorrectCode(violation) {
    const examples = {
      'image-alt': '<img src="product.jpg" alt="Red leather handbag with gold clasp">',
      'color-contrast': 'color: #1a1a1a; background-color: #ffffff; /* 12.6:1 ratio */',
      'label': '<label for="email">Email Address</label>\n<input type="email" id="email" name="email">',
      'button-name': '<button aria-label="Add to cart">🛒</button>',
      'link-name': '<a href="/products">View our products</a>'
    };
    
    return examples[violation.id] || 'See documentation for specific examples';
  }

  extractIncorrectCode(violation) {
    if (violation.nodes && violation.nodes.length > 0) {
      return violation.nodes[0].html || violation.nodes[0].snippet;
    }
    return 'Code example not available';
  }

  extractCodeLocation(violation) {
    if (violation.nodes && violation.nodes.length > 0) {
      return violation.nodes.map(node => ({
        selector: node.target?.join(' ') || 'Unknown',
        line: node.line || 'Unknown'
      }));
    }
    return [];
  }

  generateAlternativeSolutions(violation) {
    const solutions = {
      'image-alt': [
        'Manual fix: Add alt attributes to each image',
        'Automated: Use image recognition API for suggestions',
        'CMS solution: Require alt text in content management system'
      ],
      'color-contrast': [
        'Use a design system with accessible color palettes',
        'Install browser extension for real-time contrast checking',
        'Use CSS custom properties for centralized color management'
      ]
    };
    
    return solutions[violation.id] || ['Contact our team for customized solutions'];
  }

  generateTestingInstructions(violation) {
    const testingMap = {
      'image-alt': 'Use a screen reader (NVDA/JAWS) to verify images are announced properly',
      'color-contrast': 'Use Chrome DevTools or WAVE to verify contrast ratios',
      'label': 'Navigate form using only keyboard and screen reader',
      'button-name': 'Use screen reader to ensure button purpose is announced',
      'link-name': 'Tab through links to ensure they make sense out of context'
    };
    
    return testingMap[violation.id] || 'Test with assistive technology to verify fix';
  }

  estimateFixTime(violation) {
    const timeMap = {
      'image-alt': '5-10 minutes per image',
      'color-contrast': '15-30 minutes per color combination',
      'label': '5-10 minutes per form field',
      'button-name': '5 minutes per button',
      'link-name': '5 minutes per link'
    };
    
    const occurrences = violation.nodes?.length || 1;
    const baseTime = timeMap[violation.id] || '10-20 minutes';
    
    return {
      perInstance: baseTime,
      total: `${occurrences * 10}-${occurrences * 20} minutes`
    };
  }

  assessViolationBusinessImpact(violation) {
    const impactDescriptions = {
      'image-alt': 'Users cannot understand product images, leading to lost sales',
      'color-contrast': 'Content is unreadable for many users, increasing bounce rate',
      'label': 'Forms cannot be completed, directly impacting conversions',
      'button-name': 'Users cannot take key actions on your site',
      'link-name': 'Navigation is confusing, causing users to leave'
    };
    
    return impactDescriptions[violation.id] || 
      'This issue creates barriers for users and may impact conversions';
  }

  generateSeoPriorityMatrix(recommendations) {
    const allRecommendations = [
      ...recommendations.onPage,
      ...recommendations.technical,
      ...recommendations.content,
      ...recommendations.aiDiscoverability
    ];
    
    return allRecommendations
      .map(rec => ({
        title: rec.title,
        effort: this.calculateSeoEffort(rec),
        impact: this.calculateSeoImpact(rec),
        priority: rec.priority
      }))
      .sort((a, b) => {
        const scoreA = (a.impact * 2) - a.effort;
        const scoreB = (b.impact * 2) - b.effort;
        return scoreB - scoreA;
      });
  }

  calculateSeoEffort(recommendation) {
    const hours = parseInt(recommendation.implementationTime) || 5;
    return Math.min(10, hours / 2);
  }

  calculateSeoImpact(recommendation) {
    const impactMap = {
      'High': 9,
      'Medium': 6,
      'Low': 3
    };
    return impactMap[recommendation.estimatedImpact] || 5;
  }

  generatePrioritizationMatrix(analysisData) {
    // Combine all issues and recommendations
    const allIssues = [];
    
    // Add accessibility issues
    if (analysisData.violations) {
      analysisData.violations.forEach(v => {
        allIssues.push({
          type: 'accessibility',
          title: v.help,
          effort: this.calculateEffortScore(v),
          impact: this.calculateBusinessImpactScore(v),
          priority: v.impact
        });
      });
    }
    
    // Sort by impact/effort ratio
    return allIssues.sort((a, b) => {
      const scoreA = (a.impact * 2) / a.effort;
      const scoreB = (b.impact * 2) / b.effort;
      return scoreB - scoreA;
    }).slice(0, 10);
  }

  generateImplementationRoadmap(analysisData) {
    return {
      phase1: {
        title: 'Critical Fixes (Week 1-2)',
        tasks: ['Fix all critical accessibility violations', 'Update meta descriptions', 'Fix color contrast issues'],
        expectedOutcome: 'Legal compliance and immediate UX improvements'
      },
      phase2: {
        title: 'Major Improvements (Week 3-4)',
        tasks: ['Implement structured data', 'Optimize images', 'Fix all form labels'],
        expectedOutcome: 'Better SEO visibility and user engagement'
      },
      phase3: {
        title: 'Optimization (Month 2)',
        tasks: ['Performance optimization', 'AI discoverability improvements', 'Implement monitoring'],
        expectedOutcome: 'Sustained improvements and future-proofing'
      }
    };
  }

  generateIssueHighlights(analysisData) {
    // This would integrate with screenshot annotation service
    return {
      accessibility: analysisData.violations?.slice(0, 5).map(v => ({
        type: v.id,
        elements: v.nodes?.map(n => n.target) || []
      })) || [],
      seo: []
    };
  }

  getGlossaryTerms() {
    return {
      'WCAG': 'Web Content Accessibility Guidelines - International standards for web accessibility',
      'Screen Reader': 'Software that reads web content aloud for blind users',
      'Alt Text': 'Alternative text description for images',
      'Contrast Ratio': 'Numerical value comparing text and background colors',
      'ARIA': 'Accessible Rich Internet Applications - Technical specifications for accessibility',
      'SEO': 'Search Engine Optimization - Improving visibility in search results',
      'Schema Markup': 'Code that helps search engines understand your content'
    };
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
        p_report_type: 'detailed'
      });
    } catch (error) {
      logger.error('Failed to log report access:', error);
      // Don't throw - logging failure shouldn't break report generation
    }
  }
}

module.exports = DetailedReportGenerator;