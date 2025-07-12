const logger = require('../../utils/logger');
const AnalysisUtils = require('../utils/AnalysisUtils');

/**
 * MobileAccessibilityAnalyzer - Analyzes mobile-specific accessibility patterns
 * 
 * Validates mobile-friendly navigation patterns and touch device form compatibility
 * following WCAG 2.1 mobile accessibility guidelines and best practices.
 */
class MobileAccessibilityAnalyzer {
  constructor() {
    // Mobile accessibility guidelines
    this.guidelines = {
      // Touch target guidelines (already covered in TouchTargetAnalyzer)
      minTouchTargetSize: 44, // pixels (WCAG 2.5.5)
      
      // Mobile navigation patterns
      maxMainNavigationItems: 7, // Miller's rule for mobile
      recommendedNavigationItems: 5,
      
      // Form field guidelines for mobile
      minFormFieldHeight: 44, // pixels
      maxFormFieldsPerRow: 2, // on mobile screens
      
      // Mobile viewport and responsive design
      mobileBreakpoint: 768, // pixels
      minViewportWidth: 320, // smallest common mobile screen
      
      // Mobile interaction patterns
      maxModalDepth: 2, // nested modals/overlays
      recommendedModalDepth: 1,
      
      // Mobile text and content
      minFontSizeTouch: 16, // pixels for touch interfaces
      maxLineHeightMobile: 1.6, // for mobile readability
      
      // Mobile-specific ARIA patterns
      mobileARIAPatterns: [
        'aria-expanded', // for collapsible content
        'aria-controls', // for drawer/menu controls
        'aria-haspopup', // for mobile menus
        'role="button"', // for touch interactions
        'aria-label' // for icon-only buttons
      ]
    };
  }

  async analyze(page, analysisId) {
    try {
      logger.info('Starting mobile accessibility analysis', { analysisId });

      const mobileData = await page.evaluate((guidelines) => {
        const results = {
          summary: {
            mobileNavigationScore: 100,
            formCompatibilityScore: 100,
            overallScore: 100,
            testFailed: false
          },
          
          navigation: {
            patterns: [],
            menuStructure: null,
            hamburgerMenu: null,
            breadcrumbs: null,
            tabNavigation: null
          },
          
          forms: {
            mobileOptimized: [],
            fieldSizing: [],
            inputTypes: [],
            labelAssociation: []
          },
          
          responsive: {
            hasViewportMeta: false,
            viewportContent: '',
            mediaQueries: [],
            flexibleLayouts: []
          },
          
          touchInteractions: {
            gestureSupport: [],
            orientationSupport: false,
            zoomSupport: true
          },
          
          issues: []
        };

        // Helper function to check if element is visible
        function isElementVisible(element) {
          const style = window.getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          
          return style.display !== 'none' && 
                 style.visibility !== 'hidden' && 
                 style.opacity !== '0' &&
                 rect.width > 0 && 
                 rect.height > 0;
        }

        // Helper function to get element dimensions
        function getElementDimensions(element) {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          
          return {
            width: rect.width,
            height: rect.height,
            fontSize: parseFloat(style.fontSize) || 16,
            padding: {
              top: parseFloat(style.paddingTop) || 0,
              right: parseFloat(style.paddingRight) || 0,
              bottom: parseFloat(style.paddingBottom) || 0,
              left: parseFloat(style.paddingLeft) || 0
            }
          };
        }

        // Check for mobile viewport meta tag
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) {
          results.responsive.hasViewportMeta = true;
          results.responsive.viewportContent = viewportMeta.getAttribute('content') || '';
          
          // Analyze viewport settings
          const content = results.responsive.viewportContent.toLowerCase();
          if (!content.includes('width=device-width')) {
            results.issues.push({
              type: 'viewport_meta',
              severity: 'high',
              message: 'Viewport meta tag missing device-width',
              wcagCriterion: '1.4.10',
              recommendation: 'Add width=device-width to viewport meta tag'
            });
          }
          
          if (content.includes('user-scalable=no') || content.includes('maximum-scale=1')) {
            results.touchInteractions.zoomSupport = false;
            results.issues.push({
              type: 'zoom_disabled',
              severity: 'high',
              message: 'Zoom/pinch disabled - affects accessibility',
              wcagCriterion: '1.4.4',
              recommendation: 'Remove user-scalable=no and allow zoom up to 200%'
            });
          }
        } else {
          results.issues.push({
            type: 'missing_viewport',
            severity: 'high',
            message: 'Missing viewport meta tag for mobile optimization',
            wcagCriterion: '1.4.10',
            recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">'
          });
        }

        try {
          // Analyze mobile navigation patterns
          const navElements = Array.from(document.querySelectorAll('nav, [role="navigation"], .navigation, .navbar, .menu'))
            .filter(isElementVisible);
          
          navElements.forEach(nav => {
            const navItems = Array.from(nav.querySelectorAll('a, button, [role="menuitem"]'))
              .filter(isElementVisible);
            
            const navPattern = {
              element: nav.tagName.toLowerCase(),
              itemCount: navItems.length,
              hasHamburgerPattern: false,
              hasDropdownMenus: false,
              isMobileFriendly: true,
              touchTargetsValid: true
            };
            
            // Check for hamburger menu pattern
            const hamburgerTrigger = nav.querySelector('[aria-label*="menu"], [aria-label*="Menu"], .hamburger, .menu-toggle, [data-toggle="menu"]');
            if (hamburgerTrigger) {
              navPattern.hasHamburgerPattern = true;
              const dims = getElementDimensions(hamburgerTrigger);
              
              if (dims.height < guidelines.minTouchTargetSize || dims.width < guidelines.minTouchTargetSize) {
                navPattern.touchTargetsValid = false;
                results.issues.push({
                  type: 'small_hamburger_button',
                  severity: 'medium',
                  message: 'Hamburger menu button too small for touch',
                  wcagCriterion: '2.5.5',
                  recommendation: `Ensure hamburger button is at least ${guidelines.minTouchTargetSize}x${guidelines.minTouchTargetSize}px`
                });
              }
            }
            
            // Check for dropdown/flyout menus
            const dropdowns = nav.querySelectorAll('[aria-haspopup], .dropdown, .submenu');
            if (dropdowns.length > 0) {
              navPattern.hasDropdownMenus = true;
              
              // Check if dropdowns are mobile-friendly
              Array.from(dropdowns).forEach(dropdown => {
                const hasAriaExpanded = dropdown.hasAttribute('aria-expanded');
                const hasProperRole = dropdown.hasAttribute('role') || dropdown.hasAttribute('aria-haspopup');
                
                if (!hasAriaExpanded || !hasProperRole) {
                  navPattern.isMobileFriendly = false;
                  results.issues.push({
                    type: 'mobile_dropdown_aria',
                    severity: 'medium',
                    message: 'Mobile dropdown menu missing proper ARIA attributes',
                    wcagCriterion: '4.1.2',
                    recommendation: 'Add aria-expanded and proper role attributes to dropdown menus'
                  });
                }
              });
            }
            
            // Check main navigation item count for mobile usability
            if (navItems.length > guidelines.maxMainNavigationItems) {
              navPattern.isMobileFriendly = false;
              results.issues.push({
                type: 'too_many_nav_items',
                severity: 'low',
                message: `${navItems.length} navigation items may be overwhelming on mobile`,
                wcagCriterion: '2.4.3',
                recommendation: `Consider grouping navigation items (recommended: ${guidelines.recommendedNavigationItems} main items)`
              });
            }
            
            // Check touch target sizes for navigation items
            navItems.forEach(item => {
              const dims = getElementDimensions(item);
              if (dims.height < guidelines.minTouchTargetSize) {
                navPattern.touchTargetsValid = false;
              }
            });
            
            results.navigation.patterns.push(navPattern);
          });

          // Analyze form field mobile compatibility
          const formFields = Array.from(document.querySelectorAll('input, select, textarea, button[type="submit"]'))
            .filter(isElementVisible);
          
          formFields.forEach(field => {
            const dims = getElementDimensions(field);
            const fieldType = field.type || field.tagName.toLowerCase();
            
            const fieldInfo = {
              type: fieldType,
              width: dims.width,
              height: dims.height,
              fontSize: dims.fontSize,
              isMobileOptimized: true,
              hasProperInputType: true,
              hasAssociatedLabel: false
            };
            
            // Check field height for touch compatibility
            if (dims.height < guidelines.minFormFieldHeight) {
              fieldInfo.isMobileOptimized = false;
              results.issues.push({
                type: 'small_form_field',
                severity: 'medium',
                message: `${fieldType} field too small for touch interaction`,
                wcagCriterion: '2.5.5',
                recommendation: `Ensure form fields are at least ${guidelines.minFormFieldHeight}px tall`
              });
            }
            
            // Check font size for mobile readability
            if (dims.fontSize < guidelines.minFontSizeTouch) {
              fieldInfo.isMobileOptimized = false;
              results.issues.push({
                type: 'small_field_text',
                severity: 'medium',
                message: 'Form field text too small for mobile',
                wcagCriterion: '1.4.4',
                recommendation: `Use minimum ${guidelines.minFontSizeTouch}px font size for form fields`
              });
            }
            
            // Check for appropriate input types for mobile keyboards
            if (field.tagName.toLowerCase() === 'input') {
              const appropriateTypes = ['email', 'tel', 'url', 'number', 'search', 'password'];
              const currentType = field.type || 'text';
              
              // Check if email fields use email type
              if (field.name && (field.name.includes('email') || field.placeholder?.includes('email')) && currentType !== 'email') {
                fieldInfo.hasProperInputType = false;
                results.issues.push({
                  type: 'input_type_mismatch',
                  severity: 'low',
                  message: 'Email field should use type="email" for mobile keyboard',
                  wcagCriterion: '1.3.5',
                  recommendation: 'Use appropriate input types (email, tel, url) for mobile keyboards'
                });
              }
              
              // Check if phone fields use tel type
              if (field.name && (field.name.includes('phone') || field.name.includes('tel') || field.placeholder?.includes('phone')) && currentType !== 'tel') {
                fieldInfo.hasProperInputType = false;
                results.issues.push({
                  type: 'input_type_mismatch',
                  severity: 'low',
                  message: 'Phone field should use type="tel" for mobile keyboard',
                  wcagCriterion: '1.3.5',
                  recommendation: 'Use type="tel" for phone number fields'
                });
              }
            }
            
            // Check for proper label association
            const fieldId = field.id;
            const label = fieldId ? document.querySelector(`label[for="${fieldId}"]`) : null;
            const ariaLabel = field.getAttribute('aria-label');
            const ariaLabelledBy = field.getAttribute('aria-labelledby');
            
            if (label || ariaLabel || ariaLabelledBy) {
              fieldInfo.hasAssociatedLabel = true;
            } else {
              results.issues.push({
                type: 'unlabeled_form_field',
                severity: 'high',
                message: 'Form field missing accessible label',
                wcagCriterion: '1.3.1',
                recommendation: 'Provide labels for all form fields using <label>, aria-label, or aria-labelledby'
              });
            }
            
            results.forms.mobileOptimized.push(fieldInfo);
          });

          // Check for responsive layout indicators
          const hasFlexbox = Array.from(document.querySelectorAll('*')).some(el => {
            const style = window.getComputedStyle(el);
            return style.display === 'flex' || style.display === 'inline-flex';
          });
          
          const hasGrid = Array.from(document.querySelectorAll('*')).some(el => {
            const style = window.getComputedStyle(el);
            return style.display === 'grid' || style.display === 'inline-grid';
          });
          
          if (hasFlexbox || hasGrid) {
            results.responsive.flexibleLayouts.push({
              hasFlexbox: hasFlexbox,
              hasGrid: hasGrid,
              isResponsive: true
            });
          }

          // Check for orientation change support
          if (typeof window.orientation !== 'undefined' || screen.orientation) {
            results.touchInteractions.orientationSupport = true;
          }

          // Check for gesture/swipe support indicators
          const touchElements = Array.from(document.querySelectorAll('[data-swipe], [data-gesture], .swiper, .carousel'))
            .filter(isElementVisible);
          
          touchElements.forEach(element => {
            results.touchInteractions.gestureSupport.push({
              element: element.tagName.toLowerCase(),
              hasAriaLabel: element.hasAttribute('aria-label'),
              hasInstructions: element.textContent?.includes('swipe') || element.textContent?.includes('slide')
            });
          });

          // Detect common mobile UI patterns
          const mobilePatterns = [
            { selector: '.hamburger, .menu-toggle', name: 'hamburger_menu' },
            { selector: '[data-toggle="modal"], .modal-trigger', name: 'modal_trigger' },
            { selector: '.drawer, .sidebar, .off-canvas', name: 'drawer_navigation' },
            { selector: '.tabs, [role="tablist"]', name: 'tab_navigation' },
            { selector: '.accordion, .collapsible', name: 'accordion_content' }
          ];
          
          mobilePatterns.forEach(pattern => {
            const elements = Array.from(document.querySelectorAll(pattern.selector))
              .filter(isElementVisible);
            
            if (elements.length > 0) {
              elements.forEach(element => {
                const dims = getElementDimensions(element);
                const hasProperAria = element.hasAttribute('aria-expanded') || 
                                     element.hasAttribute('aria-controls') ||
                                     element.hasAttribute('aria-label');
                
                results.navigation.patterns.push({
                  type: pattern.name,
                  element: element.tagName.toLowerCase(),
                  hasProperAria: hasProperAria,
                  touchTargetSize: Math.min(dims.width, dims.height),
                  isAccessible: hasProperAria && dims.height >= guidelines.minTouchTargetSize
                });
                
                if (!hasProperAria) {
                  results.issues.push({
                    type: 'mobile_pattern_aria',
                    severity: 'medium',
                    message: `${pattern.name.replace('_', ' ')} missing ARIA attributes`,
                    wcagCriterion: '4.1.2',
                    recommendation: 'Add appropriate ARIA attributes for mobile UI patterns'
                  });
                }
              });
            }
          });

        } catch (error) {
          results.summary.testFailed = true;
          results.summary.error = error.message;
          logger.error('Mobile accessibility analysis failed in page evaluation:', error.message);
        }

        return results;
      }, this.guidelines);

      // Calculate scores (after page evaluation)
      mobileData.summary.mobileNavigationScore = this.calculateNavigationScore(mobileData);
      mobileData.summary.formCompatibilityScore = this.calculateFormScore(mobileData);
      mobileData.summary.overallScore = this.calculateScore(mobileData);
      
      // Add analyzer metadata
      mobileData.analyzerId = 'MobileAccessibilityAnalyzer';
      mobileData.timestamp = new Date().toISOString();

      logger.info('Mobile accessibility analysis completed', {
        analysisId,
        navigationScore: mobileData.summary.mobileNavigationScore,
        formScore: mobileData.summary.formCompatibilityScore,
        issues: mobileData.issues.length,
        score: mobileData.summary.overallScore
      });

      return mobileData;

    } catch (error) {
      logger.error('Mobile accessibility analysis failed:', { error: error.message, analysisId });
      return {
        summary: {
          testFailed: true,
          error: error.message,
          mobileNavigationScore: 50,
          formCompatibilityScore: 50,
          overallScore: 50
        },
        navigation: { patterns: [] },
        forms: { mobileOptimized: [] },
        responsive: { hasViewportMeta: false },
        touchInteractions: { gestureSupport: [] },
        issues: []
      };
    }
  }

  calculateNavigationScore(analysisData) {
    if (!analysisData || analysisData.summary?.testFailed) return 50;

    let score = 100;
    const { navigation, responsive, issues } = analysisData;

    // Penalty for missing viewport meta tag
    if (!responsive.hasViewportMeta) {
      score -= 25; // Major penalty
    }

    // Penalty for navigation issues
    const navIssues = issues.filter(issue => 
      issue.type.includes('nav') || 
      issue.type.includes('hamburger') || 
      issue.type.includes('dropdown')
    ).length;
    score -= navIssues * 10;

    // Penalty for ARIA issues in mobile patterns
    const ariaIssues = issues.filter(issue => 
      issue.type.includes('aria') || 
      issue.type.includes('pattern')
    ).length;
    score -= ariaIssues * 8;

    // Bonus for good mobile patterns
    const goodPatterns = navigation.patterns.filter(p => p.isAccessible !== false).length;
    if (goodPatterns > 0) {
      score += Math.min(goodPatterns * 5, 15); // Up to 15 bonus points
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  calculateFormScore(analysisData) {
    if (!analysisData || analysisData.summary?.testFailed) return 50;

    let score = 100;
    const { forms, issues } = analysisData;

    // Penalty for form field issues
    const formIssues = issues.filter(issue => 
      issue.type.includes('form') || 
      issue.type.includes('field') || 
      issue.type.includes('input')
    ).length;
    score -= formIssues * 8;

    // Check mobile optimization of form fields
    const totalFields = forms.mobileOptimized.length;
    if (totalFields > 0) {
      const optimizedFields = forms.mobileOptimized.filter(f => f.isMobileOptimized).length;
      const optimizationRatio = optimizedFields / totalFields;
      score = score * optimizationRatio;
    }

    // Penalty for unlabeled fields
    const unlabeledFields = forms.mobileOptimized.filter(f => !f.hasAssociatedLabel).length;
    score -= unlabeledFields * 15; // High penalty for accessibility

    // Bonus for proper input types
    const properInputTypes = forms.mobileOptimized.filter(f => f.hasProperInputType).length;
    if (totalFields > 0 && properInputTypes === totalFields) {
      score += 10; // Bonus for all fields having proper types
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  calculateScore(analysisData) {
    if (!analysisData || analysisData.summary?.testFailed) return 50;

    const navigationScore = this.calculateNavigationScore(analysisData);
    const formScore = this.calculateFormScore(analysisData);

    // Weighted average (navigation is more critical for mobile)
    const overallScore = (navigationScore * 0.6) + (formScore * 0.4);

    // Additional penalties for critical mobile issues
    const { issues, touchInteractions } = analysisData;
    
    let criticalPenalty = 0;
    
    // Major penalty for disabled zoom
    if (!touchInteractions.zoomSupport) {
      criticalPenalty += 20;
    }
    
    // Penalty for high severity issues
    const highSeverityIssues = issues.filter(issue => issue.severity === 'high').length;
    criticalPenalty += highSeverityIssues * 5;

    return Math.max(0, Math.min(100, Math.round(overallScore - criticalPenalty)));
  }

  generateRecommendations(analysisData, language = 'en') {
    const recommendations = [];

    if (!analysisData || analysisData.summary?.testFailed) {
      return recommendations;
    }

    const { summary, navigation, forms, responsive, touchInteractions, issues } = analysisData;

    // Viewport meta tag recommendations
    if (!responsive.hasViewportMeta) {
      recommendations.push({
        type: 'mobile-accessibility',
        priority: 'high',
        issue: 'Missing viewport meta tag',
        description: 'Page lacks proper mobile viewport configuration',
        suggestion: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to the page head',
        wcagCriterion: '1.4.10'
      });
    }

    // Zoom support recommendations
    if (!touchInteractions.zoomSupport) {
      recommendations.push({
        type: 'mobile-accessibility',
        priority: 'high',
        issue: 'Zoom functionality disabled',
        description: 'Users cannot zoom to enlarge content for better readability',
        suggestion: 'Remove user-scalable=no and allow zoom up to 200% for accessibility',
        wcagCriterion: '1.4.4'
      });
    }

    // Navigation recommendations
    const navIssues = issues.filter(issue => 
      issue.type.includes('nav') || issue.type.includes('hamburger')
    ).length;
    
    if (navIssues > 0) {
      recommendations.push({
        type: 'mobile-accessibility',
        priority: 'medium',
        issue: 'Mobile navigation accessibility issues',
        description: `${navIssues} navigation-related issues affect mobile usability`,
        suggestion: 'Ensure hamburger menus and dropdowns have proper ARIA attributes and touch target sizes',
        wcagCriterion: '2.4.3, 2.5.5'
      });
    }

    // Form compatibility recommendations
    const formIssues = issues.filter(issue => 
      issue.type.includes('form') || issue.type.includes('field')
    ).length;
    
    if (formIssues > 0) {
      recommendations.push({
        type: 'mobile-accessibility',
        priority: 'medium',
        issue: 'Form fields not optimized for mobile',
        description: `${formIssues} form-related issues affect mobile usability`,
        suggestion: 'Ensure form fields are large enough for touch, use appropriate input types, and have proper labels',
        wcagCriterion: '1.3.1, 1.3.5, 2.5.5'
      });
    }

    // Input type recommendations
    const improperInputTypes = forms.mobileOptimized.filter(f => !f.hasProperInputType).length;
    if (improperInputTypes > 0) {
      recommendations.push({
        type: 'mobile-accessibility',
        priority: 'low',
        issue: 'Suboptimal mobile keyboard experience',
        description: `${improperInputTypes} fields could use better input types for mobile keyboards`,
        suggestion: 'Use specific input types (email, tel, url) to trigger appropriate mobile keyboards',
        wcagCriterion: '1.3.5'
      });
    }

    // Touch target recommendations
    const smallTouchTargets = issues.filter(issue => 
      issue.type.includes('small_') || issue.wcagCriterion === '2.5.5'
    ).length;
    
    if (smallTouchTargets > 0) {
      recommendations.push({
        type: 'mobile-accessibility',
        priority: 'medium',
        issue: 'Touch targets too small for mobile',
        description: `${smallTouchTargets} elements are too small for comfortable touch interaction`,
        suggestion: 'Ensure all interactive elements are at least 44x44px for touch accessibility',
        wcagCriterion: '2.5.5'
      });
    }

    // Good implementation recognition
    if (summary.overallScore >= 85) {
      recommendations.push({
        type: 'mobile-accessibility',
        priority: 'info',
        issue: 'Good mobile accessibility implementation',
        description: 'Mobile navigation and form patterns follow accessibility best practices',
        suggestion: 'Continue following mobile accessibility guidelines and test with real devices',
        wcagCriterion: '1.4.10, 2.5.5'
      });
    }

    return recommendations;
  }
}

module.exports = MobileAccessibilityAnalyzer;