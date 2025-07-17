/**
 * SEO Analyzer
 * Performs comprehensive SEO analysis for websites
 */

const logger = require('../../utils/logger');

class SeoAnalyzer {
  constructor() {
    this.name = 'SeoAnalyzer';
    this.version = '1.0.0';
  }

  /**
   * Main analyze method
   * @param {Object} page - Puppeteer page object
   * @param {string} url - The URL being analyzed
   * @returns {Object} SEO analysis results
   */
  async analyze(page, url) {
    try {
      logger.info(`Starting SEO analysis for ${url}`);

      const results = {
        score: 0,
        issues: [],
        metaAnalysis: {},
        contentAnalysis: {},
        technicalAnalysis: {},
        recommendations: [],
        timestamp: new Date().toISOString()
      };

      // Run all analysis methods
      const metaAnalysis = await this.analyzeMetaTags(page);
      const contentAnalysis = await this.analyzeContent(page);
      const technicalAnalysis = await this.analyzeTechnical(page, url);
      const structureAnalysis = await this.analyzeStructure(page);

      // Combine all analyses
      results.metaAnalysis = metaAnalysis;
      results.contentAnalysis = contentAnalysis;
      results.technicalAnalysis = technicalAnalysis;
      results.structureAnalysis = structureAnalysis;

      // Collect all issues
      results.issues = [
        ...metaAnalysis.issues,
        ...contentAnalysis.issues,
        ...technicalAnalysis.issues,
        ...structureAnalysis.issues
      ];

      // Calculate overall score
      results.score = this.calculateOverallScore(results);

      // Generate recommendations
      results.recommendations = this.generateRecommendations(results);

      logger.info(`SEO analysis completed for ${url}. Score: ${results.score}%`);
      
      // Debug: Log key SEO data to verify it's different per site
      logger.info('SEO Analysis Debug:', {
        url,
        score: results.score,
        titleScore: results.metaAnalysis?.title?.score || 0,
        descriptionScore: results.metaAnalysis?.description?.score || 0,
        openGraphScore: results.metaAnalysis?.openGraph?.score || 0,
        issuesCount: results.issues?.length || 0,
        titleText: results.metaAnalysis?.title?.text?.substring(0, 50) || 'none',
        descriptionText: results.metaAnalysis?.description?.text?.substring(0, 50) || 'none'
      });
      
      return results;

    } catch (error) {
      logger.error(`SEO analysis failed for ${url}:`, error);
      throw new Error(`SEO analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze meta tags
   * @param {Object} page - Puppeteer page object
   * @returns {Object} Meta tag analysis results
   */
  async analyzeMetaTags(page) {
    const issues = [];
    const analysis = {
      title: { score: 0, issues: [] },
      description: { score: 0, issues: [] },
      keywords: { score: 0, issues: [] },
      openGraph: { score: 0, issues: [] },
      issues: []
    };

    try {
      // Get page title
      const title = await page.evaluate(() => {
        const titleElement = document.querySelector('title');
        return titleElement ? titleElement.textContent.trim() : null;
      });

      // Title analysis
      if (!title) {
        const issue = {
          type: 'meta',
          title: 'Missing Page Title',
          description: 'The page is missing a title tag, which is crucial for SEO.',
          impact: 'high',
          locations: ['<head>'],
          currentValue: 'None',
          recommendedValue: 'Descriptive page title (50-60 characters)',
          explanation: 'Page titles appear in search results and browser tabs. They should be descriptive and unique.',
          userBenefit: 'Helps users understand page content and improves search engine rankings',
          estimatedFixTime: 5
        };
        issues.push(issue);
        analysis.title.issues.push(issue);
      } else {
        analysis.title.score = 100;
        
        // Check title length
        if (title.length > 60) {
          const issue = {
            type: 'meta',
            title: 'Page Title Too Long',
            description: 'Page title exceeds the recommended 60 character limit.',
            impact: 'medium',
            locations: ['<head>'],
            currentValue: title,
            recommendedValue: title.substring(0, 57) + '...',
            explanation: 'Search engines typically display only the first 50-60 characters of a title.',
            userBenefit: 'Ensures full title visibility in search results',
            estimatedFixTime: 5
          };
          issues.push(issue);
          analysis.title.issues.push(issue);
          analysis.title.score = 70;
        } else if (title.length < 30) {
          const issue = {
            type: 'meta',
            title: 'Page Title Too Short',
            description: 'Page title is shorter than recommended (30+ characters).',
            impact: 'medium',
            locations: ['<head>'],
            currentValue: title,
            recommendedValue: 'Expand title to be more descriptive (30-60 characters)',
            explanation: 'Longer titles provide more context and keywords for search engines.',
            userBenefit: 'Better describes page content and improves search visibility',
            estimatedFixTime: 10
          };
          issues.push(issue);
          analysis.title.issues.push(issue);
          analysis.title.score = 70;
        }
      }

      // Get meta description
      const metaDescription = await page.evaluate(() => {
        const metaDesc = document.querySelector('meta[name="description"]');
        return metaDesc ? metaDesc.content.trim() : null;
      });

      // Meta description analysis
      if (!metaDescription) {
        const issue = {
          type: 'meta',
          title: 'Missing Meta Description',
          description: 'The page is missing a meta description tag.',
          impact: 'high',
          locations: ['<head>'],
          currentValue: 'None',
          recommendedValue: 'Compelling description of page content (150-160 characters)',
          explanation: 'Meta descriptions appear in search results and influence click-through rates.',
          userBenefit: 'Provides preview of page content in search results',
          estimatedFixTime: 10
        };
        issues.push(issue);
        analysis.description.issues.push(issue);
      } else {
        analysis.description.score = 100;
        
        // Check meta description length
        if (metaDescription.length > 160) {
          const issue = {
            type: 'meta',
            title: 'Meta Description Too Long',
            description: 'Meta description exceeds the recommended 160 character limit.',
            impact: 'medium',
            locations: ['<head>'],
            currentValue: metaDescription,
            recommendedValue: metaDescription.substring(0, 157) + '...',
            explanation: 'Search engines typically display only the first 150-160 characters.',
            userBenefit: 'Ensures full description visibility in search results',
            estimatedFixTime: 5
          };
          issues.push(issue);
          analysis.description.issues.push(issue);
          analysis.description.score = 70;
        } else if (metaDescription.length < 120) {
          const issue = {
            type: 'meta',
            title: 'Meta Description Too Short',
            description: 'Meta description is shorter than recommended (120+ characters).',
            impact: 'low',
            locations: ['<head>'],
            currentValue: metaDescription,
            recommendedValue: 'Expand description to be more compelling (120-160 characters)',
            explanation: 'Longer descriptions provide more context and can improve click-through rates.',
            userBenefit: 'Better describes page content and attracts more clicks',
            estimatedFixTime: 10
          };
          issues.push(issue);
          analysis.description.issues.push(issue);
          analysis.description.score = 80;
        }
      }

      // Open Graph analysis
      const ogTags = await page.evaluate(() => {
        const tags = {
          title: document.querySelector('meta[property="og:title"]'),
          description: document.querySelector('meta[property="og:description"]'),
          image: document.querySelector('meta[property="og:image"]'),
          url: document.querySelector('meta[property="og:url"]'),
          type: document.querySelector('meta[property="og:type"]')
        };
        
        return Object.entries(tags).reduce((acc, [key, element]) => {
          acc[key] = element ? element.content : null;
          return acc;
        }, {});
      });

      const missingOgTags = Object.entries(ogTags).filter(([key, value]) => !value);
      
      if (missingOgTags.length > 0) {
        const issue = {
          type: 'meta',
          title: 'Missing Open Graph Tags',
          description: `Missing Open Graph tags: ${missingOgTags.map(([key]) => `og:${key}`).join(', ')}`,
          impact: 'medium',
          locations: ['<head>'],
          currentValue: 'Some tags missing',
          recommendedValue: 'Add all essential Open Graph tags',
          explanation: 'Open Graph tags control how your page appears when shared on social media.',
          userBenefit: 'Ensures attractive previews when content is shared on social platforms',
          estimatedFixTime: 15
        };
        issues.push(issue);
        analysis.openGraph.issues.push(issue);
        analysis.openGraph.score = Math.max(0, 100 - (missingOgTags.length * 20));
      } else {
        analysis.openGraph.score = 100;
      }

      analysis.issues = issues;
      return analysis;

    } catch (error) {
      logger.error('Meta tag analysis failed:', error);
      return { issues: [], score: 0 };
    }
  }

  /**
   * Analyze content structure
   * @param {Object} page - Puppeteer page object
   * @returns {Object} Content analysis results
   */
  async analyzeContent(page) {
    const issues = [];
    const analysis = {
      headings: { score: 0, issues: [] },
      images: { score: 0, issues: [] },
      links: { score: 0, issues: [] },
      readability: { score: 0, issues: [] },
      issues: []
    };

    try {
      // Heading analysis
      const headings = await page.evaluate(() => {
        const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        return Array.from(headingElements).map(h => ({
          tag: h.tagName.toLowerCase(),
          text: h.textContent.trim(),
          hasContent: h.textContent.trim().length > 0
        }));
      });

      // Check for H1 tags
      const h1Tags = headings.filter(h => h.tag === 'h1');
      if (h1Tags.length === 0) {
        const issue = {
          type: 'content',
          title: 'Missing H1 Tag',
          description: 'The page is missing an H1 tag, which is important for SEO.',
          impact: 'high',
          locations: ['<body>'],
          currentValue: 'None',
          recommendedValue: 'Add one H1 tag describing the main page topic',
          explanation: 'H1 tags signal the main topic of your page to search engines.',
          userBenefit: 'Helps users and search engines understand the page\'s main purpose',
          estimatedFixTime: 5
        };
        issues.push(issue);
        analysis.headings.issues.push(issue);
        analysis.headings.score = 0;
      } else if (h1Tags.length > 1) {
        const issue = {
          type: 'content',
          title: 'Multiple H1 Tags',
          description: `Found ${h1Tags.length} H1 tags. Each page should have only one H1.`,
          impact: 'medium',
          locations: ['<body>'],
          currentValue: `${h1Tags.length} H1 tags`,
          recommendedValue: '1 H1 tag per page',
          explanation: 'Multiple H1s can confuse search engines about your page\'s main topic.',
          userBenefit: 'Clear content hierarchy helps users understand page structure',
          estimatedFixTime: 10
        };
        issues.push(issue);
        analysis.headings.issues.push(issue);
        analysis.headings.score = 70;
      } else {
        analysis.headings.score = 100;
      }

      // Image analysis for SEO
      const images = await page.evaluate(() => {
        const imgElements = document.querySelectorAll('img');
        return Array.from(imgElements).map(img => ({
          src: img.src,
          alt: img.alt,
          hasAlt: img.hasAttribute('alt'),
          altEmpty: img.alt === '',
          selector: img.tagName.toLowerCase() + (img.id ? `#${img.id}` : '') + (img.className ? `.${img.className.split(' ').join('.')}` : '')
        }));
      });

      const imagesWithoutAlt = images.filter(img => !img.hasAlt || img.altEmpty);
      if (imagesWithoutAlt.length > 0) {
        const issue = {
          type: 'content',
          title: 'Images Missing Alt Text (SEO)',
          description: `${imagesWithoutAlt.length} images are missing alt text, affecting SEO.`,
          impact: 'medium',
          locations: imagesWithoutAlt.map(img => img.selector).slice(0, 5),
          currentValue: `${imagesWithoutAlt.length} images without alt text`,
          recommendedValue: 'Add descriptive alt text to all images',
          explanation: 'Alt text helps search engines understand image content and improves accessibility.',
          userBenefit: 'Better image search visibility and improved accessibility',
          estimatedFixTime: imagesWithoutAlt.length * 2
        };
        issues.push(issue);
        analysis.images.issues.push(issue);
        analysis.images.score = Math.max(0, 100 - (imagesWithoutAlt.length * 10));
      } else {
        analysis.images.score = 100;
      }

      // Link analysis
      const links = await page.evaluate(() => {
        const linkElements = document.querySelectorAll('a[href]');
        return Array.from(linkElements).map(link => ({
          href: link.href,
          text: link.textContent.trim(),
          hasText: link.textContent.trim().length > 0,
          isInternal: link.hostname === window.location.hostname,
          hasTitle: link.hasAttribute('title')
        }));
      });

      const linksWithoutText = links.filter(link => !link.hasText);
      if (linksWithoutText.length > 0) {
        const issue = {
          type: 'content',
          title: 'Links Without Descriptive Text',
          description: `${linksWithoutText.length} links are missing descriptive text.`,
          impact: 'medium',
          locations: linksWithoutText.map(link => link.href).slice(0, 5),
          currentValue: `${linksWithoutText.length} links without text`,
          recommendedValue: 'Add descriptive text to all links',
          explanation: 'Search engines use link text to understand page relationships and context.',
          userBenefit: 'Better navigation context and improved SEO',
          estimatedFixTime: linksWithoutText.length * 3
        };
        issues.push(issue);
        analysis.links.issues.push(issue);
        analysis.links.score = Math.max(0, 100 - (linksWithoutText.length * 15));
      } else {
        analysis.links.score = 100;
      }

      analysis.issues = issues;
      return analysis;

    } catch (error) {
      logger.error('Content analysis failed:', error);
      return { issues: [], score: 0 };
    }
  }

  /**
   * Analyze technical SEO aspects
   * @param {Object} page - Puppeteer page object
   * @param {string} url - The URL being analyzed
   * @returns {Object} Technical analysis results
   */
  async analyzeTechnical(page, url) {
    const issues = [];
    const analysis = {
      canonical: { score: 0, issues: [] },
      schema: { score: 0, issues: [] },
      robots: { score: 0, issues: [] },
      sitemap: { score: 0, issues: [] },
      issues: []
    };

    try {
      // Canonical URL analysis
      const canonicalUrl = await page.evaluate(() => {
        const canonical = document.querySelector('link[rel="canonical"]');
        return canonical ? canonical.href : null;
      });

      if (!canonicalUrl) {
        const issue = {
          type: 'technical',
          title: 'Missing Canonical URL',
          description: 'The page is missing a canonical URL tag.',
          impact: 'medium',
          locations: ['<head>'],
          currentValue: 'None',
          recommendedValue: `<link rel="canonical" href="${url}">`,
          explanation: 'Canonical URLs help prevent duplicate content issues.',
          userBenefit: 'Ensures search engines index the correct version of your page',
          estimatedFixTime: 5
        };
        issues.push(issue);
        analysis.canonical.issues.push(issue);
        analysis.canonical.score = 0;
      } else {
        analysis.canonical.score = 100;
      }

      // Schema markup analysis
      const schemaMarkup = await page.evaluate(() => {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        return Array.from(scripts).map(script => {
          try {
            return JSON.parse(script.textContent);
          } catch (e) {
            return null;
          }
        }).filter(Boolean);
      });

      if (schemaMarkup.length === 0) {
        const issue = {
          type: 'technical',
          title: 'Missing Structured Data',
          description: 'The page lacks structured data markup.',
          impact: 'medium',
          locations: ['<head> or <body>'],
          currentValue: 'None',
          recommendedValue: 'Add relevant JSON-LD structured data',
          explanation: 'Structured data helps search engines understand your content better.',
          userBenefit: 'May enable rich snippets in search results',
          estimatedFixTime: 30
        };
        issues.push(issue);
        analysis.schema.issues.push(issue);
        analysis.schema.score = 0;
      } else {
        analysis.schema.score = 100;
      }

      // Robots meta tag analysis
      const robotsDirectives = await page.evaluate(() => {
        const robotsMeta = document.querySelector('meta[name="robots"]');
        return robotsMeta ? robotsMeta.content : null;
      });

      if (robotsDirectives && robotsDirectives.includes('noindex')) {
        const issue = {
          type: 'technical',
          title: 'Page Set to Noindex',
          description: 'The page has a noindex directive, preventing search engine indexing.',
          impact: 'high',
          locations: ['<head>'],
          currentValue: robotsDirectives,
          recommendedValue: 'Remove noindex directive or use "index, follow"',
          explanation: 'Noindex prevents search engines from including this page in search results.',
          userBenefit: 'Allows page to appear in search results',
          estimatedFixTime: 5
        };
        issues.push(issue);
        analysis.robots.issues.push(issue);
        analysis.robots.score = 0;
      } else {
        analysis.robots.score = 100;
      }

      analysis.issues = issues;
      return analysis;

    } catch (error) {
      logger.error('Technical analysis failed:', error);
      return { issues: [], score: 0 };
    }
  }

  /**
   * Analyze page structure
   * @param {Object} page - Puppeteer page object
   * @returns {Object} Structure analysis results
   */
  async analyzeStructure(page) {
    const issues = [];
    const analysis = {
      hierarchy: { score: 0, issues: [] },
      navigation: { score: 0, issues: [] },
      content: { score: 0, issues: [] },
      issues: []
    };

    try {
      // Check heading hierarchy
      const headings = await page.evaluate(() => {
        const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        return Array.from(headingElements).map(h => ({
          tag: h.tagName.toLowerCase(),
          level: parseInt(h.tagName.charAt(1)),
          text: h.textContent.trim()
        }));
      });

      // Check for heading hierarchy violations
      let lastLevel = 0;
      let hierarchyViolations = 0;
      
      headings.forEach(heading => {
        if (heading.level > lastLevel + 1) {
          hierarchyViolations++;
        }
        lastLevel = heading.level;
      });

      if (hierarchyViolations > 0) {
        const issue = {
          type: 'structure',
          title: 'Heading Hierarchy Violations',
          description: `Found ${hierarchyViolations} heading hierarchy violations.`,
          impact: 'medium',
          locations: ['Throughout page'],
          currentValue: `${hierarchyViolations} violations`,
          recommendedValue: 'Proper heading hierarchy (H1 → H2 → H3, etc.)',
          explanation: 'Proper heading hierarchy helps search engines understand content structure.',
          userBenefit: 'Improves content organization and accessibility',
          estimatedFixTime: hierarchyViolations * 5
        };
        issues.push(issue);
        analysis.hierarchy.issues.push(issue);
        analysis.hierarchy.score = Math.max(0, 100 - (hierarchyViolations * 20));
      } else {
        analysis.hierarchy.score = 100;
      }

      analysis.issues = issues;
      return analysis;

    } catch (error) {
      logger.error('Structure analysis failed:', error);
      return { issues: [], score: 0 };
    }
  }

  /**
   * Calculate overall SEO score
   * @param {Object} results - Analysis results
   * @returns {number} Overall score (0-100)
   */
  calculateOverallScore(results) {
    const categories = [
      results.metaAnalysis,
      results.contentAnalysis,
      results.technicalAnalysis,
      results.structureAnalysis
    ];

    const categoryScores = categories.map(category => {
      if (!category || typeof category !== 'object') return 0;
      
      const subScores = Object.values(category).filter(item => 
        item && typeof item === 'object' && typeof item.score === 'number'
      ).map(item => item.score);
      
      return subScores.length > 0 ? subScores.reduce((a, b) => a + b, 0) / subScores.length : 0;
    });

    const validScores = categoryScores.filter(score => score > 0);
    return validScores.length > 0 ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;
  }

  /**
   * Generate SEO recommendations
   * @param {Object} results - Analysis results
   * @returns {Array} Array of recommendations
   */
  generateRecommendations(results) {
    const recommendations = [];
    const highImpactIssues = results.issues.filter(issue => issue.impact === 'high');
    
    // Priority recommendations based on high impact issues
    if (highImpactIssues.length > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Fix High Impact SEO Issues',
        description: `Address ${highImpactIssues.length} high impact issues that significantly affect SEO performance.`,
        estimatedImpact: 'High',
        estimatedTime: highImpactIssues.reduce((total, issue) => total + issue.estimatedFixTime, 0)
      });
    }

    // Score-based recommendations
    if (results.score < 70) {
      recommendations.push({
        priority: 'high',
        title: 'Improve Overall SEO Score',
        description: `Current SEO score is ${results.score}%. Focus on meta tags, content optimization, and technical improvements.`,
        estimatedImpact: 'High',
        estimatedTime: 120
      });
    }

    return recommendations;
  }

  /**
   * Get analyzer information
   * @returns {Object} Analyzer info
   */
  getInfo() {
    return {
      name: this.name,
      version: this.version,
      description: 'Comprehensive SEO analysis for websites',
      categories: ['Meta Tags', 'Content', 'Technical', 'Structure']
    };
  }
}

module.exports = SeoAnalyzer;