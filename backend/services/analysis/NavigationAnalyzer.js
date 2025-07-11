const logger = require('../../utils/logger');
const AnalysisUtils = require('../utils/AnalysisUtils');

class NavigationAnalyzer {
  
  async analyze(page, analysisId) {
    try {
      logger.info('Running navigation consistency analysis', { analysisId });
      
      const navigationData = await page.evaluate(() => {
        // Helper functions for analysis
        function analyzeNavStructure(navElement) {
          const structure = {
            hasLists: navElement.querySelectorAll('ul, ol').length > 0,
            hasLinks: navElement.querySelectorAll('a').length,
            hasButtons: navElement.querySelectorAll('button').length,
            hasNestedLists: navElement.querySelectorAll('ul ul, ol ol').length > 0,
            totalItems: navElement.querySelectorAll('li, a, button').length
          };
          
          return structure;
        }
        
        function analyzeBreadcrumbs(breadcrumbElement) {
          const structure = {
            itemCount: breadcrumbElement.querySelectorAll('a, span').length,
            hasStructuredData: !!breadcrumbElement.querySelector('[itemscope], [typeof]'),
            hasAriaLabel: !!breadcrumbElement.getAttribute('aria-label'),
            hasCurrentPage: !!breadcrumbElement.querySelector('[aria-current="page"]'),
            separator: detectBreadcrumbSeparator(breadcrumbElement)
          };
          
          return structure;
        }
        
        function detectBreadcrumbSeparator(element) {
          const text = element.textContent;
          if (text.includes('>')) return '>';
          if (text.includes('/')) return '/';
          if (text.includes('»')) return '»';
          if (text.includes('→')) return '→';
          return 'unknown';
        }
        
        function isElementVisible(element) {
          const style = window.getComputedStyle(element);
          return style.display !== 'none' && 
                 style.visibility !== 'hidden' && 
                 style.opacity !== '0' &&
                 element.offsetWidth > 0 && 
                 element.offsetHeight > 0;
        }
        
        function analyzeNavigationConsistency(primaryNav) {
          const consistency = {
            hasConsistentStructure: true,
            navigationPatterns: [],
            inconsistencies: [],
            score: 100
          };
          
          // Check if primaryNav exists and has querySelectorAll method
          if (!primaryNav || typeof primaryNav.querySelectorAll !== 'function') {
            consistency.hasConsistentStructure = false;
            consistency.score = 0;
            consistency.inconsistencies.push({
              type: 'missing_navigation',
              message: 'Primary navigation element not found or inaccessible'
            });
            return consistency;
          }
          
          // Note: This is a single-page analysis, so we can only check internal consistency
          // For true cross-page consistency, we'd need to analyze multiple pages
          
          // Check for consistent link patterns
          const links = Array.from(primaryNav.querySelectorAll('a'));
          const linkPatterns = links.map(link => ({
            hasText: !!link.textContent.trim(),
            hasTitle: !!link.getAttribute('title'),
            hasAriaLabel: !!link.getAttribute('aria-label'),
            isInternal: link.getAttribute('href')?.startsWith('#') || 
                        link.getAttribute('href')?.startsWith('/') ||
                        link.getAttribute('href')?.includes(window.location.hostname)
          }));
          
          // Check for inconsistent link labeling
          const linksWithoutText = linkPatterns.filter(pattern => !pattern.hasText);
          if (linksWithoutText.length > 0) {
            consistency.inconsistencies.push({
              type: 'inconsistent_labeling',
              message: `Found ${linksWithoutText.length} navigation links without text content`
            });
          }
          
          return consistency;
        }
        
        const results = {
          // Navigation elements detection
          navigationElements: {
            primaryNav: null,
            secondaryNav: null,
            breadcrumbs: null,
            skipLinks: [],
            totalNavElements: 0
          },
          
          // Navigation consistency analysis
          consistencyAnalysis: {
            hasConsistentStructure: false,
            navigationPatterns: [],
            inconsistencies: [],
            score: 0
          },
          
          // Breadcrumb analysis
          breadcrumbAnalysis: {
            hasBreadcrumbs: false,
            breadcrumbType: null,
            breadcrumbStructure: null,
            issues: []
          },
          
          // Skip navigation analysis
          skipNavigationAnalysis: {
            hasSkipLinks: false,
            skipLinkCount: 0,
            skipLinkTargets: [],
            issues: []
          }
        };
        
        // Find navigation elements
        const navElements = Array.from(document.querySelectorAll('nav, [role="navigation"]'));
        results.navigationElements.totalNavElements = navElements.length;
        
        // Analyze primary navigation
        const primaryNav = document.querySelector('nav:first-of-type, [role="navigation"]:first-of-type');
        if (primaryNav) {
          results.navigationElements.primaryNav = {
            tagName: primaryNav.tagName.toLowerCase(),
            hasRole: !!primaryNav.getAttribute('role'),
            hasAriaLabel: !!primaryNav.getAttribute('aria-label'),
            hasAriaLabelledby: !!primaryNav.getAttribute('aria-labelledby'),
            itemCount: primaryNav.querySelectorAll('a, button').length,
            hasNestedLists: primaryNav.querySelectorAll('ul ul, ol ol').length > 0,
            structure: analyzeNavStructure(primaryNav)
          };
        }
        
        // Analyze secondary navigation
        const secondaryNav = document.querySelector('nav:nth-of-type(2), [role="navigation"]:nth-of-type(2)');
        if (secondaryNav) {
          results.navigationElements.secondaryNav = {
            tagName: secondaryNav.tagName.toLowerCase(),
            hasRole: !!secondaryNav.getAttribute('role'),
            hasAriaLabel: !!secondaryNav.getAttribute('aria-label'),
            itemCount: secondaryNav.querySelectorAll('a, button').length,
            structure: analyzeNavStructure(secondaryNav)
          };
        }
        
        // Breadcrumb analysis
        const breadcrumbSelectors = [
          '[aria-label*="breadcrumb" i]',
          '[aria-label*="breadcrumbs" i]',
          '.breadcrumb, .breadcrumbs',
          '.breadcrumb-nav, .breadcrumb-navigation',
          'nav[aria-label*="breadcrumb" i]',
          'ol[role="list"] li a', // Common breadcrumb pattern
          '.path, .nav-path'
        ];
        
        for (const selector of breadcrumbSelectors) {
          const breadcrumbElement = document.querySelector(selector);
          if (breadcrumbElement) {
            results.breadcrumbAnalysis.hasBreadcrumbs = true;
            results.breadcrumbAnalysis.breadcrumbType = selector;
            results.breadcrumbAnalysis.breadcrumbStructure = analyzeBreadcrumbs(breadcrumbElement);
            break;
          }
        }
        
        // Skip navigation analysis
        const skipLinkSelectors = [
          'a[href^="#"]:first-child',
          '.skip-link, .skip-to-content',
          '[href="#main"], [href="#content"]',
          'a[href*="skip"]'
        ];
        
        const skipLinks = [];
        skipLinkSelectors.forEach(selector => {
          const links = Array.from(document.querySelectorAll(selector));
          links.forEach(link => {
            const href = link.getAttribute('href');
            const target = href ? document.querySelector(href) : null;
            
            skipLinks.push({
              text: link.textContent.trim(),
              href: href,
              hasTarget: !!target,
              isVisible: isElementVisible(link),
              isFirstElement: link === document.querySelector('body *:first-child')
            });
          });
        });
        
        results.skipNavigationAnalysis.hasSkipLinks = skipLinks.length > 0;
        results.skipNavigationAnalysis.skipLinkCount = skipLinks.length;
        results.skipNavigationAnalysis.skipLinkTargets = skipLinks;
        
        // Validate skip links
        skipLinks.forEach(skipLink => {
          if (!skipLink.hasTarget) {
            results.skipNavigationAnalysis.issues.push({
              type: 'broken_skip_link',
              message: `Skip link "${skipLink.text}" points to non-existent target "${skipLink.href}"`
            });
          }
          
          if (!skipLink.isVisible && !skipLink.text.toLowerCase().includes('skip')) {
            results.skipNavigationAnalysis.issues.push({
              type: 'hidden_skip_link',
              message: `Skip link "${skipLink.text}" may not be visible to users`
            });
          }
        });
        
        // Navigation consistency analysis
        if (primaryNav) {
          const consistency = analyzeNavigationConsistency(primaryNav);
          results.consistencyAnalysis = consistency;
        }
        
        return results;
      });
      
      // Calculate overall navigation score
      navigationData.overallScore = this.calculateNavigationScore(navigationData);
      
      logger.info('Navigation analysis completed', { 
        analysisId, 
        navElements: navigationData.navigationElements.totalNavElements,
        hasBreadcrumbs: navigationData.breadcrumbAnalysis.hasBreadcrumbs,
        hasSkipLinks: navigationData.skipNavigationAnalysis.hasSkipLinks,
        score: navigationData.overallScore
      });
      
      return navigationData;
      
    } catch (error) {
      logger.error('Navigation analysis failed:', { error: error.message, analysisId });
      return {
        navigationElements: { 
          totalNavElements: 0,
          primaryNav: null,
          secondaryNav: null,
          breadcrumbs: null,
          skipLinks: []
        },
        consistencyAnalysis: { 
          hasConsistentStructure: false,
          navigationPatterns: [],
          inconsistencies: [],
          score: 0 
        },
        breadcrumbAnalysis: { 
          hasBreadcrumbs: false,
          breadcrumbType: null,
          breadcrumbStructure: null,
          issues: []
        },
        skipNavigationAnalysis: { 
          hasSkipLinks: false,
          skipLinkCount: 0,
          skipLinkTargets: [],
          issues: []
        },
        overallScore: 0,
        error: error.message
      };
    }
  }
  
  calculateNavigationScore(navigationData) {
    // Handle error case
    if (!navigationData || navigationData.error) {
      return 0;
    }
    
    let score = 100;
    
    // Primary navigation (40 points)
    if (!navigationData.navigationElements?.primaryNav) {
      score -= 40;
    } else {
      const primaryNav = navigationData.navigationElements.primaryNav;
      if (!primaryNav.hasRole && primaryNav.tagName !== 'nav') score -= 10;
      if (!primaryNav.hasAriaLabel && !primaryNav.hasAriaLabelledby) score -= 10;
      if (primaryNav.itemCount === 0) score -= 20;
    }
    
    // Breadcrumbs (20 points) - Optional but recommended for multi-level sites
    if (!navigationData.breadcrumbAnalysis?.hasBreadcrumbs) {
      score -= 10; // Moderate penalty as breadcrumbs are not always required
    }
    
    // Skip links (25 points)
    if (!navigationData.skipNavigationAnalysis?.hasSkipLinks) {
      score -= 25;
    } else {
      // Penalize broken skip links
      const brokenSkipLinks = navigationData.skipNavigationAnalysis.issues?.filter(
        issue => issue.type === 'broken_skip_link'
      ).length || 0;
      score -= brokenSkipLinks * 10;
    }
    
    // Navigation consistency (15 points)
    if (navigationData.consistencyAnalysis?.inconsistencies?.length > 0) {
      score -= Math.min(navigationData.consistencyAnalysis.inconsistencies.length * 5, 15);
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }
  
  generateRecommendations(navigationData, language = 'en') {
    const recommendations = [];
    
    if (!navigationData || navigationData.error) {
      // Add a generic recommendation if navigation analysis failed
      if (navigationData?.error) {
        recommendations.push({
          type: 'navigation',
          priority: 'high',
          issue: 'Navigation analysis failed',
          description: 'Unable to analyze navigation due to technical issues',
          suggestion: 'Ensure page has proper navigation structure with nav elements or role="navigation"',
          wcagCriterion: '2.4.3'
        });
      }
      return recommendations;
    }
    
    // Missing primary navigation
    if (!navigationData.navigationElements?.primaryNav) {
      recommendations.push({
        type: 'navigation',
        priority: 'high',
        issue: 'Missing primary navigation',
        description: 'Page lacks a primary navigation structure',
        suggestion: 'Add a <nav> element or element with role="navigation" to provide site navigation',
        wcagCriterion: '2.4.3'
      });
    } else {
      const primaryNav = navigationData.navigationElements.primaryNav;
      
      // Missing navigation labels
      if (!primaryNav.hasAriaLabel && !primaryNav.hasAriaLabelledby) {
        recommendations.push({
          type: 'navigation',
          priority: 'medium',
          issue: 'Navigation lacks accessible name',
          description: 'Navigation element should have an accessible name for screen readers',
          suggestion: 'Add aria-label="Main navigation" or aria-labelledby attribute to the nav element',
          wcagCriterion: '2.4.6'
        });
      }
      
      // Empty navigation
      if (primaryNav.itemCount === 0) {
        recommendations.push({
          type: 'navigation',
          priority: 'high',
          issue: 'Empty navigation element',
          description: 'Navigation element contains no interactive elements',
          suggestion: 'Add navigation links or buttons to the navigation element',
          wcagCriterion: '2.4.3'
        });
      }
    }
    
    // Missing skip links
    if (!navigationData.skipNavigationAnalysis?.hasSkipLinks) {
      recommendations.push({
        type: 'navigation',
        priority: 'high',
        issue: 'Missing skip navigation links',
        description: 'Page lacks skip links to help keyboard users navigate efficiently',
        suggestion: 'Add skip links at the beginning of the page (e.g., "Skip to main content")',
        wcagCriterion: '2.4.1'
      });
    } else {
      // Broken skip links
      const brokenSkipLinks = navigationData.skipNavigationAnalysis?.issues?.filter(
        issue => issue.type === 'broken_skip_link'
      ) || [];
      
      brokenSkipLinks.forEach(issue => {
        recommendations.push({
          type: 'navigation',
          priority: 'high',
          issue: 'Broken skip link',
          description: issue.message,
          suggestion: 'Ensure skip link targets exist and have proper IDs',
          wcagCriterion: '2.4.1'
        });
      });
    }
    
    // Missing breadcrumbs (for multi-level sites)
    if (!navigationData.breadcrumbAnalysis?.hasBreadcrumbs && 
        navigationData.navigationElements?.primaryNav?.hasNestedLists) {
      recommendations.push({
        type: 'navigation',
        priority: 'medium',
        issue: 'Missing breadcrumb navigation',
        description: 'Multi-level site would benefit from breadcrumb navigation',
        suggestion: 'Add breadcrumb navigation to help users understand their location in the site hierarchy',
        wcagCriterion: '2.4.8'
      });
    }
    
    // Navigation consistency issues
    if (navigationData.consistencyAnalysis?.inconsistencies?.length > 0) {
      navigationData.consistencyAnalysis.inconsistencies.forEach(inconsistency => {
        recommendations.push({
          type: 'navigation',
          priority: 'medium',
          issue: 'Navigation inconsistency',
          description: inconsistency.message,
          suggestion: 'Ensure navigation elements are consistent across all pages',
          wcagCriterion: '3.2.3'
        });
      });
    }
    
    return recommendations;
  }
}

module.exports = NavigationAnalyzer;