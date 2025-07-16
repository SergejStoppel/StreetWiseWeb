/**
 * AI Analysis Service
 * Provides intelligent analysis and context-aware recommendations
 */

const logger = require('../../utils/logger');

class AiAnalysisService {
  constructor() {
    this.name = 'AiAnalysisService';
    this.version = '1.0.0';
    this.isEnabled = true;
  }

  /**
   * Analyze website context and generate AI insights
   * @param {Object} page - Puppeteer page object
   * @param {string} url - The URL being analyzed
   * @param {Object} existingResults - Results from other analyzers
   * @returns {Object} AI analysis results
   */
  async analyze(page, url, existingResults = {}) {
    try {
      logger.info(`Starting AI analysis for ${url}`);

      const results = {
        websiteContext: {},
        recommendations: [],
        customCodeFixes: [],
        businessInsights: [],
        priorityMatrix: {},
        estimatedImpact: {},
        timestamp: new Date().toISOString()
      };

      // Detect website context
      results.websiteContext = await this.detectWebsiteContext(page, url);

      // Generate context-aware recommendations
      results.recommendations = await this.generateRecommendations(existingResults, results.websiteContext);

      // Create custom code fixes
      results.customCodeFixes = await this.generateCustomCodeFixes(existingResults, results.websiteContext);

      // Generate business insights
      results.businessInsights = await this.generateBusinessInsights(existingResults, results.websiteContext);

      // Create priority matrix
      results.priorityMatrix = this.createPriorityMatrix(existingResults);

      // Estimate impact
      results.estimatedImpact = this.estimateImpact(existingResults, results.websiteContext);

      logger.info(`AI analysis completed for ${url}`);
      return results;

    } catch (error) {
      logger.error(`AI analysis failed for ${url}:`, error);
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }

  /**
   * Detect website context and characteristics
   * @param {Object} page - Puppeteer page object
   * @param {string} url - The URL being analyzed
   * @returns {Object} Website context information
   */
  async detectWebsiteContext(page, url) {
    try {
      const context = {
        type: 'unknown',
        industry: 'unknown',
        targetAudience: 'unknown',
        techStack: 'unknown',
        businessModel: 'unknown',
        contentTypes: [],
        primaryFunction: 'unknown',
        userInteractionLevel: 'low',
        complianceRequirements: []
      };

      // Analyze page content and structure
      const pageAnalysis = await page.evaluate(() => {
        const analysis = {
          title: document.title,
          description: '',
          keywords: [],
          headings: [],
          forms: [],
          ecommerce: {
            hasCart: false,
            hasPayment: false,
            hasProducts: false
          },
          cms: {
            framework: 'unknown',
            indicators: []
          },
          interactivity: {
            hasSearch: false,
            hasLogin: false,
            hasComments: false,
            hasUpload: false
          }
        };

        // Get meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) analysis.description = metaDesc.content;

        // Get meta keywords
        const metaKeywords = document.querySelector('meta[name="keywords"]');
        if (metaKeywords) analysis.keywords = metaKeywords.content.split(',').map(k => k.trim());

        // Analyze headings
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        analysis.headings = Array.from(headings).map(h => h.textContent.trim().toLowerCase());

        // Check for e-commerce indicators
        analysis.ecommerce.hasCart = !!(
          document.querySelector('[class*="cart"]') ||
          document.querySelector('[id*="cart"]') ||
          document.querySelector('a[href*="cart"]')
        );

        analysis.ecommerce.hasProducts = !!(
          document.querySelector('[class*="product"]') ||
          document.querySelector('[class*="shop"]') ||
          document.querySelector('[data-product]')
        );

        analysis.ecommerce.hasPayment = !!(
          document.querySelector('[class*="checkout"]') ||
          document.querySelector('[class*="payment"]') ||
          document.querySelector('[action*="payment"]')
        );

        // Check for CMS indicators
        const bodyClass = document.body.className;
        const htmlClass = document.documentElement.className;
        
        if (bodyClass.includes('wp-') || htmlClass.includes('wp-')) {
          analysis.cms.framework = 'wordpress';
          analysis.cms.indicators.push('WordPress classes detected');
        }

        if (document.querySelector('meta[name="generator"]')) {
          const generator = document.querySelector('meta[name="generator"]').content;
          analysis.cms.indicators.push(`Generator: ${generator}`);
          
          if (generator.toLowerCase().includes('wordpress')) analysis.cms.framework = 'wordpress';
          if (generator.toLowerCase().includes('drupal')) analysis.cms.framework = 'drupal';
          if (generator.toLowerCase().includes('joomla')) analysis.cms.framework = 'joomla';
        }

        // Check for React/Vue/Angular
        if (window.React) {
          analysis.cms.framework = 'react';
          analysis.cms.indicators.push('React detected');
        }
        if (window.Vue) {
          analysis.cms.framework = 'vue';
          analysis.cms.indicators.push('Vue detected');
        }
        if (window.angular) {
          analysis.cms.framework = 'angular';
          analysis.cms.indicators.push('Angular detected');
        }

        // Check interactivity
        analysis.interactivity.hasSearch = !!(
          document.querySelector('input[type="search"]') ||
          document.querySelector('[class*="search"]') ||
          document.querySelector('[id*="search"]')
        );

        analysis.interactivity.hasLogin = !!(
          document.querySelector('a[href*="login"]') ||
          document.querySelector('a[href*="signin"]') ||
          document.querySelector('[class*="login"]')
        );

        analysis.interactivity.hasComments = !!(
          document.querySelector('[class*="comment"]') ||
          document.querySelector('[id*="comment"]') ||
          document.querySelector('form[action*="comment"]')
        );

        analysis.interactivity.hasUpload = !!(
          document.querySelector('input[type="file"]') ||
          document.querySelector('[class*="upload"]')
        );

        // Analyze forms
        const forms = document.querySelectorAll('form');
        analysis.forms = Array.from(forms).map(form => ({
          action: form.action,
          method: form.method,
          inputs: form.querySelectorAll('input, textarea, select').length,
          hasValidation: form.querySelector('[required]') !== null
        }));

        return analysis;
      });

      // Determine website type
      context.type = this.determineWebsiteType(pageAnalysis, url);
      
      // Determine industry
      context.industry = this.determineIndustry(pageAnalysis, url);
      
      // Determine target audience
      context.targetAudience = this.determineTargetAudience(pageAnalysis);
      
      // Determine tech stack
      context.techStack = pageAnalysis.cms.framework;
      
      // Determine business model
      context.businessModel = this.determineBusinessModel(pageAnalysis);
      
      // Determine content types
      context.contentTypes = this.determineContentTypes(pageAnalysis);
      
      // Determine primary function
      context.primaryFunction = this.determinePrimaryFunction(pageAnalysis);
      
      // Determine interaction level
      context.userInteractionLevel = this.determineInteractionLevel(pageAnalysis);
      
      // Determine compliance requirements
      context.complianceRequirements = this.determineComplianceRequirements(context, pageAnalysis);

      return context;

    } catch (error) {
      logger.error('Website context detection failed:', error);
      return {
        type: 'unknown',
        industry: 'unknown',
        targetAudience: 'unknown',
        techStack: 'unknown',
        businessModel: 'unknown',
        contentTypes: [],
        primaryFunction: 'unknown',
        userInteractionLevel: 'low',
        complianceRequirements: []
      };
    }
  }

  /**
   * Determine website type based on analysis
   */
  determineWebsiteType(analysis, url) {
    // E-commerce indicators
    if (analysis.ecommerce.hasCart && analysis.ecommerce.hasProducts) {
      return 'ecommerce';
    }

    // Blog indicators
    const blogKeywords = ['blog', 'post', 'article', 'news'];
    if (analysis.headings.some(h => blogKeywords.some(k => h.includes(k)))) {
      return 'blog';
    }

    // Portfolio indicators
    const portfolioKeywords = ['portfolio', 'work', 'project', 'gallery'];
    if (analysis.headings.some(h => portfolioKeywords.some(k => h.includes(k)))) {
      return 'portfolio';
    }

    // SaaS indicators
    const saasKeywords = ['dashboard', 'app', 'software', 'platform', 'service'];
    if (analysis.headings.some(h => saasKeywords.some(k => h.includes(k))) && analysis.interactivity.hasLogin) {
      return 'saas';
    }

    // Corporate indicators
    const corporateKeywords = ['company', 'business', 'services', 'about', 'contact'];
    if (analysis.headings.some(h => corporateKeywords.some(k => h.includes(k)))) {
      return 'corporate';
    }

    // Educational indicators
    const educationKeywords = ['course', 'learn', 'education', 'training', 'tutorial'];
    if (analysis.headings.some(h => educationKeywords.some(k => h.includes(k)))) {
      return 'educational';
    }

    return 'informational';
  }

  /**
   * Determine industry based on content analysis
   */
  determineIndustry(analysis, url) {
    const content = (analysis.title + ' ' + analysis.description + ' ' + analysis.headings.join(' ')).toLowerCase();
    
    const industries = {
      'healthcare': ['health', 'medical', 'doctor', 'hospital', 'patient', 'medicine'],
      'finance': ['bank', 'finance', 'investment', 'loan', 'insurance', 'money'],
      'education': ['school', 'education', 'university', 'course', 'learning', 'student'],
      'ecommerce': ['shop', 'store', 'buy', 'sell', 'product', 'cart'],
      'technology': ['software', 'tech', 'app', 'digital', 'development', 'innovation'],
      'government': ['government', 'public', 'official', 'civic', 'municipal', 'federal'],
      'nonprofit': ['nonprofit', 'charity', 'foundation', 'donate', 'volunteer', 'cause']
    };

    for (const [industry, keywords] of Object.entries(industries)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        return industry;
      }
    }

    return 'general';
  }

  /**
   * Determine target audience
   */
  determineTargetAudience(analysis) {
    const content = (analysis.title + ' ' + analysis.description).toLowerCase();
    
    if (content.includes('senior') || content.includes('elderly')) return 'seniors';
    if (content.includes('student') || content.includes('young')) return 'students';
    if (content.includes('professional') || content.includes('business')) return 'professionals';
    if (content.includes('parent') || content.includes('family')) return 'families';
    
    return 'general';
  }

  /**
   * Determine business model
   */
  determineBusinessModel(analysis) {
    if (analysis.ecommerce.hasCart && analysis.ecommerce.hasProducts) return 'ecommerce';
    if (analysis.interactivity.hasLogin && analysis.forms.length > 0) return 'saas';
    if (analysis.headings.some(h => h.includes('service'))) return 'service';
    if (analysis.headings.some(h => h.includes('blog') || h.includes('content'))) return 'content';
    
    return 'informational';
  }

  /**
   * Determine content types
   */
  determineContentTypes(analysis) {
    const types = [];
    
    if (analysis.headings.some(h => h.includes('blog') || h.includes('article'))) types.push('blog');
    if (analysis.ecommerce.hasProducts) types.push('products');
    if (analysis.headings.some(h => h.includes('service'))) types.push('services');
    if (analysis.headings.some(h => h.includes('about') || h.includes('team'))) types.push('company');
    if (analysis.forms.length > 0) types.push('forms');
    
    return types.length > 0 ? types : ['general'];
  }

  /**
   * Determine primary function
   */
  determinePrimaryFunction(analysis) {
    if (analysis.ecommerce.hasCart) return 'selling';
    if (analysis.interactivity.hasLogin) return 'app';
    if (analysis.forms.length > 2) return 'data-collection';
    if (analysis.headings.some(h => h.includes('news') || h.includes('blog'))) return 'content-publishing';
    
    return 'information';
  }

  /**
   * Determine user interaction level
   */
  determineInteractionLevel(analysis) {
    let score = 0;
    
    if (analysis.interactivity.hasLogin) score += 3;
    if (analysis.interactivity.hasSearch) score += 2;
    if (analysis.interactivity.hasComments) score += 2;
    if (analysis.interactivity.hasUpload) score += 3;
    if (analysis.forms.length > 0) score += analysis.forms.length;
    
    if (score >= 8) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  }

  /**
   * Determine compliance requirements
   */
  determineComplianceRequirements(context, analysis) {
    const requirements = [];
    
    // WCAG is always required
    requirements.push('WCAG 2.1 AA');
    
    // Industry-specific requirements
    if (context.industry === 'healthcare') {
      requirements.push('HIPAA', 'Section 508');
    }
    
    if (context.industry === 'finance') {
      requirements.push('PCI DSS', 'Section 508');
    }
    
    if (context.industry === 'government') {
      requirements.push('Section 508', 'WCAG 2.1 AAA');
    }
    
    if (context.industry === 'education') {
      requirements.push('Section 508', 'ADA');
    }
    
    // E-commerce requirements
    if (analysis.ecommerce.hasCart) {
      requirements.push('ADA', 'Consumer Protection');
    }
    
    return requirements;
  }

  /**
   * Generate context-aware recommendations
   */
  async generateRecommendations(existingResults, context) {
    const recommendations = [];
    
    // High-impact recommendations based on context
    if (context.type === 'ecommerce') {
      recommendations.push({
        id: 'ecommerce_accessibility',
        title: 'E-commerce Accessibility Priority',
        description: 'Focus on product pages, checkout flow, and search functionality for maximum business impact',
        priority: 'high',
        businessImpact: 'Revenue protection and customer retention',
        estimatedROI: '300%',
        timeToImplement: '2-4 weeks'
      });
    }
    
    if (context.industry === 'healthcare') {
      recommendations.push({
        id: 'healthcare_compliance',
        title: 'Healthcare Compliance Focus',
        description: 'Ensure HIPAA compliance and enhanced accessibility for patients with disabilities',
        priority: 'critical',
        businessImpact: 'Legal compliance and patient care',
        estimatedROI: 'Risk mitigation',
        timeToImplement: '3-6 weeks'
      });
    }
    
    if (context.targetAudience === 'seniors') {
      recommendations.push({
        id: 'senior_friendly',
        title: 'Senior-Friendly Design',
        description: 'Implement larger text, higher contrast, and simplified navigation for senior users',
        priority: 'high',
        businessImpact: 'Improved user experience for target demographic',
        estimatedROI: '200%',
        timeToImplement: '1-2 weeks'
      });
    }
    
    return recommendations;
  }

  /**
   * Generate custom code fixes based on detected tech stack
   */
  async generateCustomCodeFixes(existingResults, context) {
    const fixes = [];
    
    // React-specific fixes
    if (context.techStack === 'react') {
      fixes.push({
        id: 'react_alt_text',
        title: 'React Image Alt Text Component',
        description: 'Custom React component for consistent alt text handling',
        code: `const AccessibleImage = ({ src, alt, ...props }) => {
  if (!alt) {
    console.warn('Image missing alt text:', src);
  }
  return <img src={src} alt={alt} {...props} />;
};`,
        language: 'jsx',
        framework: 'react'
      });
    }
    
    // WordPress-specific fixes
    if (context.techStack === 'wordpress') {
      fixes.push({
        id: 'wp_accessibility_filter',
        title: 'WordPress Accessibility Filter',
        description: 'PHP filter to ensure all images have alt text',
        code: `function ensure_image_alt_text($content) {
  return preg_replace('/<img(?![^>]*alt=)([^>]*)>/i', '<img$1 alt="">', $content);
}
add_filter('the_content', 'ensure_image_alt_text');`,
        language: 'php',
        framework: 'wordpress'
      });
    }
    
    return fixes;
  }

  /**
   * Generate business insights
   */
  async generateBusinessInsights(existingResults, context) {
    const insights = [];
    
    // Calculate potential user impact
    const accessibilityScore = existingResults.accessibility?.score || 0;
    const criticalIssues = existingResults.accessibility?.issues?.filter(i => i.severity === 'critical').length || 0;
    
    insights.push({
      type: 'user_impact',
      title: 'Potential User Impact',
      value: `${Math.round((100 - accessibilityScore) * 0.15)}% of users may experience difficulties`,
      explanation: 'Based on accessibility score and disability statistics',
      actionable: true
    });
    
    insights.push({
      type: 'legal_risk',
      title: 'Legal Risk Assessment',
      value: criticalIssues > 5 ? 'High' : criticalIssues > 2 ? 'Medium' : 'Low',
      explanation: 'Risk of accessibility-related legal action',
      actionable: true
    });
    
    if (context.type === 'ecommerce') {
      insights.push({
        type: 'revenue_impact',
        title: 'Potential Revenue Impact',
        value: `$${Math.round(criticalIssues * 1000)}/month in lost sales`,
        explanation: 'Estimated revenue loss from inaccessible checkout and product pages',
        actionable: true
      });
    }
    
    return insights;
  }

  /**
   * Create priority matrix for issues
   */
  createPriorityMatrix(existingResults) {
    const matrix = {
      quickWins: [], // High impact, low effort
      majorProjects: [], // High impact, high effort
      fillIns: [], // Low impact, low effort
      questionable: [] // Low impact, high effort
    };
    
    const allIssues = [
      ...(existingResults.accessibility?.issues || []),
      ...(existingResults.seo?.issues || []),
      ...(existingResults.performance?.issues || [])
    ];
    
    allIssues.forEach(issue => {
      const impact = this.calculateImpactScore(issue);
      const effort = this.calculateEffortScore(issue);
      
      if (impact >= 7 && effort <= 3) {
        matrix.quickWins.push(issue);
      } else if (impact >= 7 && effort > 3) {
        matrix.majorProjects.push(issue);
      } else if (impact < 7 && effort <= 3) {
        matrix.fillIns.push(issue);
      } else {
        matrix.questionable.push(issue);
      }
    });
    
    return matrix;
  }

  /**
   * Calculate impact score for an issue
   */
  calculateImpactScore(issue) {
    let score = 0;
    
    // Severity impact
    const severityScores = { critical: 10, serious: 8, high: 8, moderate: 5, medium: 5, minor: 2, low: 2 };
    score += severityScores[issue.severity] || severityScores[issue.impact] || 0;
    
    // User benefit impact
    if (issue.userBenefit && issue.userBenefit.length > 50) score += 2;
    
    // Business impact
    if (issue.businessImpact === 'high') score += 3;
    else if (issue.businessImpact === 'medium') score += 2;
    else if (issue.businessImpact === 'low') score += 1;
    
    return Math.min(score, 10);
  }

  /**
   * Calculate effort score for an issue
   */
  calculateEffortScore(issue) {
    let score = 0;
    
    // Time-based effort
    const fixTime = issue.estimatedFixTime || 30;
    if (fixTime <= 15) score += 1;
    else if (fixTime <= 60) score += 3;
    else if (fixTime <= 240) score += 6;
    else score += 10;
    
    // Complexity factors
    if (issue.type === 'technical') score += 2;
    if (issue.locations && issue.locations.length > 10) score += 2;
    
    return Math.min(score, 10);
  }

  /**
   * Estimate impact of fixing issues
   */
  estimateImpact(existingResults, context) {
    const impact = {
      accessibilityImprovement: 0,
      seoImprovement: 0,
      performanceImprovement: 0,
      userExperienceImprovement: 0,
      businessImpact: 'medium',
      timeToValue: '2-4 weeks',
      confidenceLevel: 'medium'
    };
    
    // Calculate potential improvements
    const accessibilityIssues = existingResults.accessibility?.issues || [];
    const highImpactIssues = accessibilityIssues.filter(i => 
      i.severity === 'critical' || i.severity === 'serious'
    ).length;
    
    impact.accessibilityImprovement = Math.min(highImpactIssues * 5, 40);
    impact.seoImprovement = Math.min((existingResults.seo?.issues?.length || 0) * 2, 30);
    impact.performanceImprovement = Math.min((existingResults.performance?.issues?.length || 0) * 3, 25);
    impact.userExperienceImprovement = Math.round((impact.accessibilityImprovement + impact.seoImprovement) * 0.8);
    
    // Determine business impact
    if (context.type === 'ecommerce' && highImpactIssues > 5) {
      impact.businessImpact = 'high';
    } else if (context.industry === 'healthcare' && highImpactIssues > 3) {
      impact.businessImpact = 'high';
    }
    
    return impact;
  }

  /**
   * Get service information
   */
  getInfo() {
    return {
      name: this.name,
      version: this.version,
      description: 'AI-powered analysis and context-aware recommendations',
      capabilities: [
        'Website context detection',
        'Industry-specific recommendations',
        'Custom code fixes',
        'Business impact analysis',
        'Priority matrix creation'
      ],
      isEnabled: this.isEnabled
    };
  }
}

module.exports = AiAnalysisService;