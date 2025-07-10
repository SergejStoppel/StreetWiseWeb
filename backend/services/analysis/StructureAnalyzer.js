const logger = require('../../utils/logger');
const AnalysisUtils = require('../utils/AnalysisUtils');

class StructureAnalyzer {
  
  async analyze(page, analysisId) {
    try {
      logger.info('Running structure analysis', { analysisId });
      
      const structureData = await page.evaluate(() => {
        const results = {
          // Basic structural elements
          hasH1: !!document.querySelector('h1'),
          h1Count: document.querySelectorAll('h1').length,
          hasMain: !!document.querySelector('main'),
          hasNav: !!document.querySelector('nav'),
          hasFooter: !!document.querySelector('footer'),
          hasHeader: !!document.querySelector('header'),
          hasSkipLink: !!document.querySelector('a[href^="#"]'),
          
          // Semantic HTML5 elements analysis
          semanticElements: {
            header: document.querySelectorAll('header').length,
            nav: document.querySelectorAll('nav').length,
            main: document.querySelectorAll('main').length,
            section: document.querySelectorAll('section').length,
            article: document.querySelectorAll('article').length,
            aside: document.querySelectorAll('aside').length,
            footer: document.querySelectorAll('footer').length
          },
          
          // Heading hierarchy analysis
          headingHierarchy: (() => {
            const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
            const hierarchy = headings.map((heading, index) => ({
              level: parseInt(heading.tagName.charAt(1)),
              text: heading.textContent.trim().substring(0, 100),
              isEmpty: !heading.textContent.trim(),
              position: index,
              hasId: !!heading.id
            }));
            
            // Check for heading order violations
            const violations = [];
            for (let i = 1; i < hierarchy.length; i++) {
              const current = hierarchy[i];
              const previous = hierarchy[i - 1];
              
              // Check if heading level jumps more than 1 (e.g., H1 -> H3)
              if (current.level > previous.level + 1) {
                violations.push({
                  type: 'heading_skip',
                  message: `Heading level jumps from H${previous.level} to H${current.level}`,
                  position: i,
                  previousLevel: previous.level,
                  currentLevel: current.level
                });
              }
            }
            
            return {
              headings: hierarchy,
              violations,
              hasLogicalOrder: violations.length === 0,
              totalHeadings: hierarchy.length,
              emptyHeadings: hierarchy.filter(h => h.isEmpty).length
            };
          })(),
          
          // ARIA landmarks analysis
          ariaLandmarks: {
            hasMainLandmark: !!document.querySelector('[role="main"], main'),
            hasNavigationLandmark: !!document.querySelector('[role="navigation"], nav'),
            hasBannerLandmark: !!document.querySelector('[role="banner"], header'),
            hasContentinfoLandmark: !!document.querySelector('[role="contentinfo"], footer'),
            hasSearchLandmark: !!document.querySelector('[role="search"]'),
            hasComplementaryLandmark: !!document.querySelector('[role="complementary"], aside'),
            
            // Count ARIA landmarks
            landmarkCounts: {
              main: document.querySelectorAll('[role="main"], main').length,
              navigation: document.querySelectorAll('[role="navigation"], nav').length,
              banner: document.querySelectorAll('[role="banner"], header').length,
              contentinfo: document.querySelectorAll('[role="contentinfo"], footer').length,
              search: document.querySelectorAll('[role="search"]').length,
              complementary: document.querySelectorAll('[role="complementary"], aside').length
            }
          },
          
          // Document structure quality
          documentStructure: {
            hasDoctype: !!document.doctype,
            hasLang: !!document.documentElement.lang,
            langValue: document.documentElement.lang || '',
            hasTitle: !!document.title,
            titleLength: document.title.length,
            hasMetaDescription: !!document.querySelector('meta[name="description"]'),
            hasMetaViewport: !!document.querySelector('meta[name="viewport"]')
          },
          
          // Navigation structure
          navigationStructure: {
            skipLinksCount: document.querySelectorAll('a[href^="#skip"], .skip-link, .sr-only a[href^="#"]').length,
            breadcrumbsPresent: !!document.querySelector('[aria-label*="breadcrumb"], .breadcrumb, nav[aria-label*="Breadcrumb"]'),
            navigationMenuCount: document.querySelectorAll('nav').length,
            hasSearchFunction: !!document.querySelector('input[type="search"], [role="search"]')
          },
          
          // Interactive elements analysis
          interactiveElements: {
            total: document.querySelectorAll('a, button, input, select, textarea, [tabindex], [role="button"], [role="link"]').length,
            buttons: document.querySelectorAll('button, [role="button"]').length,
            links: document.querySelectorAll('a[href], [role="link"]').length,
            formControls: document.querySelectorAll('input, select, textarea').length,
            customControls: document.querySelectorAll('[role="button"], [role="link"], [role="menuitem"], [role="tab"]').length
          },
          
          // Page metrics
          totalElements: document.querySelectorAll('*').length,
          textContent: document.body ? document.body.textContent.trim().length : 0
        };

        return results;
      });

      return structureData;
    } catch (error) {
      logger.error('Structure analysis failed:', { error: error.message, analysisId });
      throw error;
    }
  }

  calculateScore(structureData) {
    if (!structureData) return 0;
    
    let score = 100;
    
    // Check for semantic HTML5 elements
    if (!structureData.hasMain) score -= 15;
    if (!structureData.hasNav) score -= 10;
    if (!structureData.hasHeader) score -= 10;
    if (!structureData.hasFooter) score -= 5;
    
    // Check heading hierarchy
    if (!structureData.hasH1) score -= 20;
    if (structureData.h1Count > 1) score -= 10;
    if (structureData.headingHierarchy?.violations?.length > 0) {
      score -= Math.min(structureData.headingHierarchy.violations.length * 5, 20);
    }
    
    // Check ARIA landmarks
    if (!structureData.ariaLandmarks?.hasMainLandmark) score -= 10;
    if (!structureData.ariaLandmarks?.hasNavigationLandmark) score -= 5;
    
    // Check document structure
    if (!structureData.documentStructure?.hasLang) score -= 10;
    if (!structureData.documentStructure?.hasTitle) score -= 10;
    if (!structureData.documentStructure?.hasMetaDescription) score -= 5;
    
    return Math.max(0, Math.round(score));
  }

  generateRecommendations(structureData, language = 'en') {
    const recommendations = [];
    
    if (!structureData) return recommendations;
    
    // Missing H1 heading
    if (!structureData.hasH1) {
      recommendations.push({
        type: 'structure',
        priority: 'high',
        issue: 'Missing H1 heading',
        description: 'Page should have exactly one H1 heading that describes the main content',
        suggestion: 'Add a clear, descriptive H1 heading to the page'
      });
    }
    
    // Multiple H1 headings
    if (structureData.h1Count > 1) {
      recommendations.push({
        type: 'structure',
        priority: 'medium',
        issue: 'Multiple H1 headings',
        description: `Found ${structureData.h1Count} H1 headings. Each page should have only one H1`,
        suggestion: 'Use only one H1 per page and use H2-H6 for subheadings'
      });
    }
    
    // Missing main landmark
    if (!structureData.hasMain) {
      recommendations.push({
        type: 'structure',
        priority: 'high',
        issue: 'Missing main landmark',
        description: 'Page should have a main element or role="main" to identify primary content',
        suggestion: 'Add a <main> element or role="main" around the primary content area'
      });
    }
    
    // Heading hierarchy violations
    if (structureData.headingHierarchy?.violations?.length > 0) {
      recommendations.push({
        type: 'structure',
        priority: 'medium',
        issue: 'Illogical heading hierarchy',
        description: `Found ${structureData.headingHierarchy.violations.length} heading hierarchy violations`,
        suggestion: 'Ensure headings follow a logical order (H1, H2, H3, etc.) without skipping levels'
      });
    }
    
    // Missing language declaration
    if (!structureData.documentStructure?.hasLang) {
      recommendations.push({
        type: 'structure',
        priority: 'high',
        issue: 'Missing language declaration',
        description: 'HTML element should have a lang attribute to specify the page language',
        suggestion: 'Add lang="en" (or appropriate language code) to the <html> element'
      });
    }
    
    return recommendations;
  }
}

module.exports = StructureAnalyzer;