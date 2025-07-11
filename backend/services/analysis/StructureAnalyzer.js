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
          
          // Language attribute validation (WCAG 3.1.1)
          languageValidation: (() => {
            const htmlElement = document.documentElement;
            const langAttr = htmlElement.getAttribute('lang');
            const xmlLangAttr = htmlElement.getAttribute('xml:lang');
            
            // Common valid language codes (ISO 639-1)
            const validLanguageCodes = [
              'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 
              'ar', 'hi', 'nl', 'sv', 'no', 'da', 'fi', 'pl', 'tr', 'el',
              'he', 'th', 'vi', 'id', 'ms', 'cs', 'hu', 'ro', 'uk', 'bg'
            ];
            
            // Check if language code is valid (basic validation)
            const isValidLangCode = (code) => {
              if (!code) return false;
              // Extract primary language code (e.g., "en-US" -> "en")
              const primaryCode = code.split('-')[0].toLowerCase();
              // Check if it's a 2-letter code and in our valid list
              return (primaryCode.length === 2 && validLanguageCodes.includes(primaryCode));
              // TODO: Add proper 3-letter ISO 639-2 code validation in the future
            };
            
            const issues = [];
            
            // Check if lang attribute exists
            if (!langAttr) {
              issues.push({
                type: 'missing_lang',
                severity: 'critical',
                message: 'The html element is missing the lang attribute',
                element: 'html'
              });
            } else if (!isValidLangCode(langAttr)) {
              issues.push({
                type: 'invalid_lang',
                severity: 'serious',
                message: `The lang attribute value "${langAttr}" is not a valid language code`,
                element: 'html',
                currentValue: langAttr
              });
            }
            
            // Check for xml:lang if present (for XHTML compatibility)
            if (xmlLangAttr && xmlLangAttr !== langAttr) {
              issues.push({
                type: 'mismatched_lang',
                severity: 'moderate',
                message: 'The xml:lang attribute does not match the lang attribute',
                element: 'html',
                langValue: langAttr,
                xmlLangValue: xmlLangAttr
              });
            }
            
            // Check for language changes in the document
            const elementsWithLang = document.querySelectorAll('[lang]:not(html)');
            const langChanges = Array.from(elementsWithLang).map(el => ({
              tag: el.tagName.toLowerCase(),
              lang: el.getAttribute('lang'),
              text: el.textContent.substring(0, 50) + '...',
              isValid: isValidLangCode(el.getAttribute('lang'))
            }));
            
            // Find invalid language codes in content
            langChanges.forEach((change, index) => {
              if (!change.isValid) {
                issues.push({
                  type: 'invalid_content_lang',
                  severity: 'moderate',
                  message: `Invalid language code "${change.lang}" on ${change.tag} element`,
                  element: change.tag,
                  langValue: change.lang
                });
              }
            });
            
            return {
              hasLangAttribute: !!langAttr,
              langValue: langAttr || '',
              isValidLangCode: langAttr ? isValidLangCode(langAttr) : false,
              hasXmlLang: !!xmlLangAttr,
              xmlLangValue: xmlLangAttr || '',
              langMatchesXmlLang: !xmlLangAttr || langAttr === xmlLangAttr,
              contentLanguageChanges: langChanges,
              issues: issues,
              score: issues.length === 0 ? 100 : Math.max(0, 100 - (issues.filter(i => i.severity === 'critical').length * 50) - (issues.filter(i => i.severity === 'serious').length * 25) - (issues.filter(i => i.severity === 'moderate').length * 10))
            };
          })(),
          
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
    if (!structureData.documentStructure?.hasTitle) score -= 10;
    if (!structureData.documentStructure?.hasMetaDescription) score -= 5;
    
    // Language validation score (use the calculated score from languageValidation)
    if (structureData.languageValidation) {
      const langScore = structureData.languageValidation.score;
      // Convert language score to impact on overall score (max 15 point deduction)
      const langDeduction = Math.round((100 - langScore) * 0.15);
      score -= langDeduction;
    } else if (!structureData.documentStructure?.hasLang) {
      // Fallback to old logic if languageValidation not available
      score -= 10;
    }
    
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
    
    // Language attribute validation recommendations
    if (structureData.languageValidation && structureData.languageValidation.issues.length > 0) {
      structureData.languageValidation.issues.forEach(issue => {
        let priority = 'medium';
        let suggestion = '';
        
        switch(issue.type) {
          case 'missing_lang':
            priority = 'high';
            suggestion = 'Add lang="en" (or appropriate language code) to the <html> element. Example: <html lang="en">';
            break;
          case 'invalid_lang':
            priority = 'high';
            suggestion = `Change the lang attribute to a valid language code. For example, use "en" for English, "es" for Spanish, "fr" for French, etc.`;
            break;
          case 'mismatched_lang':
            priority = 'medium';
            suggestion = `Ensure the xml:lang attribute matches the lang attribute, or remove the xml:lang attribute if not needed.`;
            break;
          case 'invalid_content_lang':
            priority = 'medium';
            suggestion = `Use a valid language code for the lang attribute on the ${issue.element} element.`;
            break;
        }
        
        recommendations.push({
          type: 'structure',
          priority: priority,
          issue: issue.message,
          description: 'WCAG 3.1.1 requires that the primary language of the page be programmatically determinable',
          suggestion: suggestion,
          element: issue.element,
          wcagCriterion: '3.1.1'
        });
      });
    }
    
    return recommendations;
  }
}

module.exports = StructureAnalyzer;