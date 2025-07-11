/**
 * Focus Management Analyzer Module
 * 
 * Comprehensive WCAG 2.1 focus management analysis including:
 * - Focus indicator visibility and contrast
 * - Focus traps in modals and dialogs
 * - Logical focus flow and tab order
 * - Skip links and bypass mechanisms
 * - Dynamic content focus management
 * - Custom focus handling patterns
 */

const logger = require('../../utils/logger');

class FocusManagementAnalyzer {
  constructor() {
    // Focus indicator requirements
    this.FOCUS_REQUIREMENTS = {
      minContrastRatio: 3.0, // WCAG 2.1 AA requirement for focus indicators
      minThickness: 2, // pixels - minimum outline thickness
      focusableElements: [
        'a[href]', 'button', 'input', 'textarea', 'select',
        '[tabindex]:not([tabindex="-1"])', '[contenteditable="true"]',
        'summary', 'iframe', 'embed', 'object'
      ],
      skipLinkRequirements: {
        maxDistanceFromTop: 3, // Should be within first few focusable elements
        shouldBeVisible: true,
        targetShouldExist: true
      }
    };

    // Focus trap indicators
    this.FOCUS_TRAP_SELECTORS = {
      modals: ['.modal', '.dialog', '[role="dialog"]', '[role="alertdialog"]'],
      overlays: ['.overlay', '.popup', '.tooltip', '[aria-live]'],
      menus: ['.menu', '.dropdown', '[role="menu"]', '[role="listbox"]']
    };

    // Dynamic content selectors
    this.DYNAMIC_CONTENT_SELECTORS = [
      '.tab-panel', '[role="tabpanel"]', '.accordion-content',
      '.carousel-item', '.slider-item', '[aria-expanded]'
    ];
  }

  /**
   * Analyze focus management across the page
   * @param {Object} page - Puppeteer page instance
   * @param {string} analysisId - Analysis ID for logging
   * @returns {Object} Comprehensive focus management analysis
   */
  async analyze(page, analysisId) {
    try {
      logger.info('Starting focus management analysis', { analysisId });

      // Test focus indicators
      const focusIndicatorAnalysis = await this.analyzeFocusIndicators(page);
      
      // Check for focus traps
      const focusTrapAnalysis = await this.analyzeFocusTraps(page);
      
      // Test logical focus flow
      const focusFlowAnalysis = await this.analyzeFocusFlow(page);
      
      // Check skip links and bypass mechanisms
      const skipLinkAnalysis = await this.analyzeSkipLinks(page);
      
      // Test dynamic content focus management
      const dynamicFocusAnalysis = await this.analyzeDynamicFocus(page);
      
      // Check custom focus handling
      const customFocusAnalysis = await this.analyzeCustomFocusHandling(page);

      const analysis = {
        analysisId,
        timestamp: new Date().toISOString(),
        focusIndicators: focusIndicatorAnalysis,
        focusTraps: focusTrapAnalysis,
        focusFlow: focusFlowAnalysis,
        skipLinks: skipLinkAnalysis,
        dynamicFocus: dynamicFocusAnalysis,
        customFocus: customFocusAnalysis,
        summary: this.generateSummary({
          focusIndicatorAnalysis,
          focusTrapAnalysis,
          focusFlowAnalysis,
          skipLinkAnalysis,
          dynamicFocusAnalysis,
          customFocusAnalysis
        })
      };

      logger.info('Focus management analysis completed', {
        analysisId,
        totalFocusableElements: analysis.summary.totalFocusableElements,
        issues: analysis.summary.totalIssues,
        score: analysis.summary.score
      });

      return analysis;
    } catch (error) {
      logger.error('Focus management analysis failed', { error: error.message, analysisId });
      return this.getEmptyAnalysis(analysisId);
    }
  }

  /**
   * Analyze focus indicators for visibility and compliance
   * @param {Object} page - Puppeteer page instance
   * @returns {Object} Focus indicator analysis results
   */
  async analyzeFocusIndicators(page) {
    return await page.evaluate((requirements) => {
      const analysis = {
        totalFocusableElements: 0,
        elementsWithVisibleFocus: 0,
        elementsWithoutVisibleFocus: [],
        poorFocusIndicators: [],
        goodFocusIndicators: [],
        defaultBrowserFocus: 0,
        customFocusStyles: 0
      };

      // Get all focusable elements
      const focusableElements = document.querySelectorAll(
        requirements.focusableElements.join(', ')
      );

      focusableElements.forEach((element, index) => {
        analysis.totalFocusableElements++;

        // Temporarily focus the element to check its focus styles
        const originalTabIndex = element.tabIndex;
        const originalStyle = element.style.cssText;
        
        try {
          element.focus();
          
          const computedStyle = window.getComputedStyle(element);
          const pseudoElementStyle = window.getComputedStyle(element, ':focus');
          
          const focusData = {
            index,
            tagName: element.tagName,
            type: element.type || '',
            id: element.id || '',
            className: element.className || '',
            hasCustomFocusStyle: false,
            focusIndicator: {
              outline: computedStyle.outline,
              outlineOffset: computedStyle.outlineOffset,
              boxShadow: computedStyle.boxShadow,
              borderColor: computedStyle.borderColor,
              backgroundColor: computedStyle.backgroundColor
            }
          };

          // Check for custom focus styles
          const hasOutline = computedStyle.outline !== 'none' && 
                           computedStyle.outline !== '0px none';
          const hasBoxShadow = computedStyle.boxShadow !== 'none' && 
                             computedStyle.boxShadow !== '';
          const hasBorderChange = computedStyle.borderColor !== 'initial';
          const hasBackgroundChange = computedStyle.backgroundColor !== 'initial';

          focusData.hasCustomFocusStyle = hasOutline || hasBoxShadow || 
                                        hasBorderChange || hasBackgroundChange;

          if (focusData.hasCustomFocusStyle) {
            analysis.customFocusStyles++;
            
            // Evaluate focus indicator quality
            const indicatorQuality = this.evaluateFocusIndicatorQuality(focusData.focusIndicator);
            
            if (indicatorQuality.isGood) {
              analysis.goodFocusIndicators.push(focusData);
              analysis.elementsWithVisibleFocus++;
            } else {
              analysis.poorFocusIndicators.push({
                ...focusData,
                issues: indicatorQuality.issues
              });
            }
          } else {
            // Using default browser focus
            analysis.defaultBrowserFocus++;
            
            // Check if default focus is visible
            if (computedStyle.outline !== 'none') {
              analysis.elementsWithVisibleFocus++;
            } else {
              analysis.elementsWithoutVisibleFocus.push({
                ...focusData,
                issue: 'no_visible_focus_indicator'
              });
            }
          }
        } catch (error) {
          // Error focusing element, likely not actually focusable
        } finally {
          // Restore original state
          element.blur();
          element.style.cssText = originalStyle;
        }
      });

      return analysis;

      // Helper function for focus indicator quality evaluation
      function evaluateFocusIndicatorQuality(indicator) {
        const issues = [];
        let isGood = true;

        // Check outline
        if (indicator.outline && indicator.outline !== 'none') {
          const outlineMatch = indicator.outline.match(/(\d+(?:\.\d+)?px)/);
          if (outlineMatch) {
            const thickness = parseFloat(outlineMatch[1]);
            if (thickness < requirements.minThickness) {
              issues.push('outline_too_thin');
              isGood = false;
            }
          }
        }

        // Check for sufficient visual distinction
        if (!indicator.outline || indicator.outline === 'none') {
          if (!indicator.boxShadow || indicator.boxShadow === 'none') {
            if (!indicator.borderColor || indicator.borderColor === 'initial') {
              issues.push('insufficient_visual_distinction');
              isGood = false;
            }
          }
        }

        return { isGood, issues };
      }
    }, this.FOCUS_REQUIREMENTS);
  }

  /**
   * Analyze focus traps in modals and interactive components
   * @param {Object} page - Puppeteer page instance
   * @returns {Object} Focus trap analysis results
   */
  async analyzeFocusTraps(page) {
    return await page.evaluate((trapSelectors) => {
      const analysis = {
        potentialFocusTraps: [],
        modalElements: [],
        menuElements: [],
        issues: []
      };

      // Check for modal elements
      const modals = document.querySelectorAll(trapSelectors.modals.join(', '));
      modals.forEach((modal, index) => {
        const modalData = {
          index,
          element: modal.tagName,
          id: modal.id || '',
          className: modal.className || '',
          isVisible: modal.offsetWidth > 0 && modal.offsetHeight > 0,
          hasTabIndex: modal.hasAttribute('tabindex'),
          ariaModal: modal.getAttribute('aria-modal'),
          focusableChildren: modal.querySelectorAll('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])').length,
          hasCloseButton: !!modal.querySelector('[aria-label*="close"], [title*="close"], .close, .modal-close'),
          trapImplementation: 'unknown'
        };

        // Check if modal implements focus trapping
        if (modalData.isVisible && modalData.focusableChildren > 0) {
          // Look for common focus trap patterns
          const hasKeydownListener = modal.hasAttribute('data-focus-trap') || 
                                   modal.querySelector('[data-focus-trap]');
          const hasTabIndexManagement = Array.from(modal.querySelectorAll('*')).some(el => 
            el.hasAttribute('tabindex') && el.getAttribute('tabindex') === '-1'
          );

          if (hasKeydownListener) {
            modalData.trapImplementation = 'detected';
          } else if (hasTabIndexManagement) {
            modalData.trapImplementation = 'partial';
          } else {
            modalData.trapImplementation = 'missing';
            analysis.issues.push({
              type: 'missing_focus_trap',
              element: modalData,
              message: 'Modal lacks focus trap implementation'
            });
          }
        }

        analysis.modalElements.push(modalData);
      });

      // Check menu elements for focus management
      const menus = document.querySelectorAll(trapSelectors.menus.join(', '));
      menus.forEach((menu, index) => {
        const menuData = {
          index,
          element: menu.tagName,
          role: menu.getAttribute('role'),
          isVisible: menu.offsetWidth > 0 && menu.offsetHeight > 0,
          focusableChildren: menu.querySelectorAll('a, button, [role="menuitem"], [role="option"]').length,
          hasArrowKeySupport: 'unknown', // Would need runtime testing
          hasEscapeHandling: 'unknown'
        };

        if (menuData.isVisible && menuData.focusableChildren > 1) {
          analysis.menuElements.push(menuData);
        }
      });

      return analysis;
    }, this.FOCUS_TRAP_SELECTORS);
  }

  /**
   * Analyze logical focus flow and tab order
   * @param {Object} page - Puppeteer page instance
   * @returns {Object} Focus flow analysis results
   */
  async analyzeFocusFlow(page) {
    return await page.evaluate(() => {
      const analysis = {
        tabOrderIssues: [],
        logicalFlowIssues: [],
        customTabIndexElements: [],
        totalFocusableElements: 0,
        focusOrder: []
      };

      // Get all focusable elements in DOM order
      const focusableElements = document.querySelectorAll(`
        a[href], button, input, textarea, select, details,
        [tabindex]:not([tabindex="-1"]), [contenteditable="true"],
        summary, iframe, embed, object
      `);

      const elementsData = [];

      focusableElements.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0 && 
                         window.getComputedStyle(element).visibility !== 'hidden';

        if (isVisible) {
          const elementData = {
            index,
            element: element,
            tagName: element.tagName,
            id: element.id || '',
            tabIndex: element.tabIndex,
            hasCustomTabIndex: element.hasAttribute('tabindex'),
            position: {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height
            },
            visualOrder: null // Will be calculated
          };

          elementsData.push(elementData);
          analysis.totalFocusableElements++;

          // Track custom tabindex usage
          if (elementData.hasCustomTabIndex && elementData.tabIndex !== 0) {
            analysis.customTabIndexElements.push({
              element: elementData.tagName,
              id: elementData.id,
              tabIndex: elementData.tabIndex,
              position: elementData.position
            });
          }
        }
      });

      // Sort elements by visual position (top to bottom, left to right)
      const visuallySorted = [...elementsData].sort((a, b) => {
        const rowDiff = Math.abs(a.position.top - b.position.top);
        if (rowDiff < 10) { // Same row (within 10px)
          return a.position.left - b.position.left;
        }
        return a.position.top - b.position.top;
      });

      visuallySorted.forEach((element, visualIndex) => {
        element.visualOrder = visualIndex;
      });

      // Check for tab order issues
      for (let i = 0; i < elementsData.length - 1; i++) {
        const current = elementsData[i];
        const next = elementsData[i + 1];

        // Check if DOM order matches visual order
        const visualOrderDiff = Math.abs(current.visualOrder - next.visualOrder);
        if (visualOrderDiff > 2) { // Allow some tolerance
          analysis.logicalFlowIssues.push({
            type: 'visual_dom_order_mismatch',
            currentElement: {
              tag: current.tagName,
              id: current.id,
              domIndex: i,
              visualOrder: current.visualOrder
            },
            nextElement: {
              tag: next.tagName,
              id: next.id,
              domIndex: i + 1,
              visualOrder: next.visualOrder
            }
          });
        }

        // Check for problematic custom tabindex usage
        if (current.hasCustomTabIndex && current.tabIndex > 0) {
          if (next.hasCustomTabIndex && next.tabIndex > 0) {
            if (current.tabIndex >= next.tabIndex) {
              analysis.tabOrderIssues.push({
                type: 'incorrect_tabindex_sequence',
                element1: { tag: current.tagName, id: current.id, tabIndex: current.tabIndex },
                element2: { tag: next.tagName, id: next.id, tabIndex: next.tabIndex }
              });
            }
          }
        }
      }

      // Create focus order map
      analysis.focusOrder = elementsData.map(el => ({
        tag: el.tagName,
        id: el.id,
        tabIndex: el.tabIndex,
        domOrder: el.index,
        visualOrder: el.visualOrder
      }));

      return analysis;
    });
  }

  /**
   * Analyze skip links and bypass mechanisms
   * @param {Object} page - Puppeteer page instance
   * @returns {Object} Skip link analysis results
   */
  async analyzeSkipLinks(page) {
    return await page.evaluate((requirements) => {
      const analysis = {
        skipLinks: [],
        bypassMechanisms: [],
        issues: [],
        hasMainSkipLink: false
      };

      // Look for skip links
      const potentialSkipLinks = document.querySelectorAll(`
        a[href^="#"], a[href^="#main"], a[href^="#content"],
        a[class*="skip"], a[id*="skip"], a[title*="skip"]
      `);

      potentialSkipLinks.forEach((link, index) => {
        const linkText = link.textContent?.trim().toLowerCase() || '';
        const href = link.getAttribute('href') || '';
        const isSkipLink = linkText.includes('skip') || 
                          linkText.includes('jump') ||
                          href.includes('main') ||
                          href.includes('content');

        if (isSkipLink) {
          const target = href ? document.querySelector(href) : null;
          const isVisible = link.offsetWidth > 0 && link.offsetHeight > 0;
          const parentStyle = window.getComputedStyle(link.parentElement || link);
          
          const skipLinkData = {
            index,
            text: link.textContent?.trim(),
            href: href,
            hasTarget: !!target,
            targetId: target?.id || '',
            isVisible: isVisible,
            isVisuallyHidden: parentStyle.position === 'absolute' && 
                             (parentStyle.left === '-9999px' || 
                              parentStyle.top === '-9999px' ||
                              parentStyle.clip === 'rect(0, 0, 0, 0)'),
            tabIndex: link.tabIndex,
            position: this.getElementPosition(link)
          };

          // Check if this is the main content skip link
          if (href.includes('main') || href.includes('content') || 
              linkText.includes('main') || linkText.includes('content')) {
            analysis.hasMainSkipLink = true;
          }

          // Validate skip link
          if (!skipLinkData.hasTarget) {
            analysis.issues.push({
              type: 'skip_link_missing_target',
              link: skipLinkData,
              message: `Skip link "${skipLinkData.text}" points to non-existent target "${href}"`
            });
          }

          if (skipLinkData.position.domOrder > requirements.skipLinkRequirements.maxDistanceFromTop) {
            analysis.issues.push({
              type: 'skip_link_not_early',
              link: skipLinkData,
              message: `Skip link should be among the first focusable elements on the page`
            });
          }

          analysis.skipLinks.push(skipLinkData);
        }
      });

      // Look for other bypass mechanisms
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const landmarks = document.querySelectorAll('[role="navigation"], nav, [role="main"], main, [role="banner"], header');

      analysis.bypassMechanisms = {
        headingCount: headings.length,
        landmarkCount: landmarks.length,
        hasHeadingStructure: headings.length > 0,
        hasLandmarks: landmarks.length > 0
      };

      // Check for issues
      if (!analysis.hasMainSkipLink && headings.length > 5) {
        analysis.issues.push({
          type: 'missing_main_skip_link',
          message: 'Page has substantial content but no skip link to main content'
        });
      }

      return analysis;

      // Helper function
      function getElementPosition(element) {
        const focusableElements = document.querySelectorAll(`
          a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])
        `);
        
        return Array.from(focusableElements).indexOf(element);
      }
    }, this.FOCUS_REQUIREMENTS);
  }

  /**
   * Analyze dynamic content focus management
   * @param {Object} page - Puppeteer page instance
   * @returns {Object} Dynamic focus analysis results
   */
  async analyzeDynamicFocus(page) {
    return await page.evaluate((selectors) => {
      const analysis = {
        dynamicElements: [],
        expandableElements: [],
        tabPanels: [],
        issues: []
      };

      // Check expandable elements
      const expandableElements = document.querySelectorAll('[aria-expanded]');
      expandableElements.forEach((element, index) => {
        const isExpanded = element.getAttribute('aria-expanded') === 'true';
        const controls = element.getAttribute('aria-controls');
        const controlledElement = controls ? document.getElementById(controls) : null;

        const expandableData = {
          index,
          element: element.tagName,
          id: element.id || '',
          isExpanded: isExpanded,
          controls: controls,
          hasControlledElement: !!controlledElement,
          controlledElementVisible: controlledElement ? 
            (controlledElement.offsetWidth > 0 && controlledElement.offsetHeight > 0) : false
        };

        if (isExpanded && !expandableData.controlledElementVisible) {
          analysis.issues.push({
            type: 'expanded_content_not_visible',
            element: expandableData,
            message: 'Element marked as expanded but controlled content is not visible'
          });
        }

        analysis.expandableElements.push(expandableData);
      });

      // Check tab panels
      const tabPanels = document.querySelectorAll('[role="tabpanel"]');
      const tabs = document.querySelectorAll('[role="tab"]');
      
      tabPanels.forEach((panel, index) => {
        const isVisible = panel.offsetWidth > 0 && panel.offsetHeight > 0;
        const ariaLabelledby = panel.getAttribute('aria-labelledby');
        const associatedTab = ariaLabelledby ? document.getElementById(ariaLabelledby) : null;
        const tabSelected = associatedTab ? associatedTab.getAttribute('aria-selected') === 'true' : false;

        const panelData = {
          index,
          id: panel.id || '',
          isVisible: isVisible,
          hasLabel: !!ariaLabelledby,
          associatedTabSelected: tabSelected,
          focusableChildren: panel.querySelectorAll(`
            a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])
          `).length
        };

        if (panelData.isVisible && !panelData.associatedTabSelected) {
          analysis.issues.push({
            type: 'visible_panel_unselected_tab',
            panel: panelData,
            message: 'Tab panel is visible but associated tab is not selected'
          });
        }

        analysis.tabPanels.push(panelData);
      });

      // Check for dynamic content containers
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element, index) => {
          const isVisible = element.offsetWidth > 0 && element.offsetHeight > 0;
          analysis.dynamicElements.push({
            selector: selector,
            index: index,
            isVisible: isVisible,
            hasTabIndex: element.hasAttribute('tabindex'),
            focusableChildren: element.querySelectorAll(`
              a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])
            `).length
          });
        });
      });

      return analysis;
    }, this.DYNAMIC_CONTENT_SELECTORS);
  }

  /**
   * Analyze custom focus handling patterns
   * @param {Object} page - Puppeteer page instance
   * @returns {Object} Custom focus analysis results
   */
  async analyzeCustomFocusHandling(page) {
    return await page.evaluate(() => {
      const analysis = {
        elementsWithEventListeners: 0,
        customKeyHandlers: [],
        accessibilityFeatures: {
          roving: [],
          gridNavigation: [],
          menuNavigation: []
        },
        potentialIssues: []
      };

      // Look for elements with custom key handling
      const interactiveElements = document.querySelectorAll(`
        [role="button"], [role="tab"], [role="menuitem"], [role="option"],
        [role="gridcell"], [role="treeitem"], [tabindex], div[onclick], span[onclick]
      `);

      interactiveElements.forEach((element, index) => {
        // Check for event listeners (limited detection)
        const hasOnClick = element.hasAttribute('onclick') || element.onclick;
        const hasKeyHandlers = element.hasAttribute('onkeydown') || 
                              element.hasAttribute('onkeyup') || 
                              element.hasAttribute('onkeypress');

        if (hasOnClick || hasKeyHandlers) {
          analysis.elementsWithEventListeners++;

          const role = element.getAttribute('role');
          const tabIndex = element.getAttribute('tabindex');

          // Detect potential accessibility patterns
          if (role === 'tab' && tabIndex !== null) {
            analysis.accessibilityFeatures.roving.push({
              element: element.tagName,
              id: element.id || '',
              role: role
            });
          } else if (role === 'gridcell') {
            analysis.accessibilityFeatures.gridNavigation.push({
              element: element.tagName,
              id: element.id || '',
              role: role
            });
          } else if (['menuitem', 'option'].includes(role)) {
            analysis.accessibilityFeatures.menuNavigation.push({
              element: element.tagName,
              id: element.id || '',
              role: role
            });
          }

          // Check for potential issues
          if (hasOnClick && !element.hasAttribute('role') && 
              !['BUTTON', 'A', 'INPUT'].includes(element.tagName)) {
            analysis.potentialIssues.push({
              type: 'clickable_without_role',
              element: element.tagName,
              id: element.id || '',
              message: 'Clickable element lacks appropriate role or semantic meaning'
            });
          }

          if (hasKeyHandlers && tabIndex === null && 
              !['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName)) {
            analysis.potentialIssues.push({
              type: 'key_handler_not_focusable',
              element: element.tagName,
              id: element.id || '',
              message: 'Element handles keyboard events but is not focusable'
            });
          }
        }
      });

      return analysis;
    });
  }

  /**
   * Calculate focus management score
   * @param {Object} analysisData - Complete analysis data
   * @returns {number} Score from 0-100
   */
  calculateScore(analysisData) {
    if (!analysisData || analysisData.summary?.testFailed) return 50;

    let score = 100;
    const { summary } = analysisData;

    // Focus indicator penalties (highest priority)
    score -= Math.min(summary.elementsWithoutFocus * 8, 40);
    score -= Math.min(summary.poorFocusIndicators * 5, 20);

    // Focus trap penalties
    score -= Math.min(summary.missingFocusTraps * 15, 30);

    // Focus flow penalties
    score -= Math.min(summary.tabOrderIssues * 10, 25);
    score -= Math.min(summary.logicalFlowIssues * 6, 20);

    // Skip link penalties
    score -= Math.min(summary.skipLinkIssues * 12, 25);

    // Dynamic focus penalties
    score -= Math.min(summary.dynamicFocusIssues * 8, 20);

    // Custom focus handling penalties
    score -= Math.min(summary.customFocusIssues * 5, 15);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate recommendations for focus management improvements
   * @param {Object} analysisData - Analysis data
   * @param {string} language - Language for recommendations
   * @returns {Array} Array of recommendation objects
   */
  generateRecommendations(analysisData, language = 'en') {
    const recommendations = [];

    if (!analysisData || analysisData.summary?.testFailed) {
      return [{
        type: 'analysis_failed',
        priority: 'medium',
        title: 'Focus Management Analysis Incomplete',
        description: 'Unable to complete focus management analysis. Manual review recommended.'
      }];
    }

    const { summary } = analysisData;

    // Focus indicators (highest priority)
    if (summary.elementsWithoutFocus > 0) {
      recommendations.push({
        type: 'missing_focus_indicators',
        priority: 'high',
        title: 'Missing Focus Indicators',
        description: `${summary.elementsWithoutFocus} interactive elements lack visible focus indicators. Add custom focus styles with sufficient contrast.`,
        impact: 'Keyboard users cannot see which element has focus, making navigation impossible.'
      });
    }

    if (summary.poorFocusIndicators > 0) {
      recommendations.push({
        type: 'poor_focus_indicators',
        priority: 'high',
        title: 'Poor Quality Focus Indicators',
        description: `${summary.poorFocusIndicators} elements have focus indicators that are too thin or lack sufficient contrast. Improve focus styling.`,
        impact: 'Weak focus indicators are difficult to see for users with visual impairments.'
      });
    }

    // Focus traps
    if (summary.missingFocusTraps > 0) {
      recommendations.push({
        type: 'missing_focus_traps',
        priority: 'high',
        title: 'Missing Focus Traps in Modals',
        description: `${summary.missingFocusTraps} modal dialogs lack proper focus trap implementation. Implement focus management to keep focus within the modal.`,
        impact: 'Users can tab out of modal dialogs, losing context and breaking the user experience.'
      });
    }

    // Tab order and flow
    if (summary.tabOrderIssues > 0) {
      recommendations.push({
        type: 'tab_order_issues',
        priority: 'medium',
        title: 'Tab Order Problems',
        description: `${summary.tabOrderIssues} issues found with tab order. Review custom tabindex values and ensure logical sequence.`,
        impact: 'Illogical tab order confuses keyboard users and disrupts navigation flow.'
      });
    }

    if (summary.logicalFlowIssues > 0) {
      recommendations.push({
        type: 'logical_flow_issues',
        priority: 'medium',
        title: 'Focus Flow Issues',
        description: `${summary.logicalFlowIssues} elements have focus order that doesn't match visual layout. Ensure DOM order matches visual order.`,
        impact: 'Focus jumping around the page unexpectedly confuses users and breaks mental models.'
      });
    }

    // Skip links
    if (summary.skipLinkIssues > 0) {
      recommendations.push({
        type: 'skip_link_issues',
        priority: 'medium',
        title: 'Skip Link Problems',
        description: `${summary.skipLinkIssues} issues found with skip links. Ensure skip links point to existing targets and are positioned early in tab order.`,
        impact: 'Broken or missing skip links force keyboard users to navigate through all content.'
      });
    }

    // Dynamic content focus
    if (summary.dynamicFocusIssues > 0) {
      recommendations.push({
        type: 'dynamic_focus_issues',
        priority: 'medium',
        title: 'Dynamic Content Focus Issues',
        description: `${summary.dynamicFocusIssues} issues found with focus management in dynamic content. Ensure focus is properly managed when content changes.`,
        impact: 'Users lose track of their position when content updates without proper focus management.'
      });
    }

    // Custom focus handling
    if (summary.customFocusIssues > 0) {
      recommendations.push({
        type: 'custom_focus_issues',
        priority: 'low',
        title: 'Custom Focus Handling Issues',
        description: `${summary.customFocusIssues} elements have custom interaction patterns that may not be fully accessible. Review keyboard handling implementation.`,
        impact: 'Custom widgets may not work properly with assistive technologies or keyboard navigation.'
      });
    }

    return recommendations.slice(0, 10); // Limit recommendations
  }

  /**
   * Generate summary of focus management analysis
   * @param {Object} analysisData - All analysis data
   * @returns {Object} Summary object
   */
  generateSummary(analysisData) {
    const {
      focusIndicatorAnalysis,
      focusTrapAnalysis,
      focusFlowAnalysis,
      skipLinkAnalysis,
      dynamicFocusAnalysis,
      customFocusAnalysis
    } = analysisData;

    const summary = {
      totalFocusableElements: focusIndicatorAnalysis.totalFocusableElements || 0,
      elementsWithoutFocus: focusIndicatorAnalysis.elementsWithoutVisibleFocus?.length || 0,
      poorFocusIndicators: focusIndicatorAnalysis.poorFocusIndicators?.length || 0,
      missingFocusTraps: focusTrapAnalysis.issues?.filter(issue => 
        issue.type === 'missing_focus_trap').length || 0,
      tabOrderIssues: focusFlowAnalysis.tabOrderIssues?.length || 0,
      logicalFlowIssues: focusFlowAnalysis.logicalFlowIssues?.length || 0,
      skipLinkIssues: skipLinkAnalysis.issues?.length || 0,
      dynamicFocusIssues: dynamicFocusAnalysis.issues?.length || 0,
      customFocusIssues: customFocusAnalysis.potentialIssues?.length || 0,
      hasSkipLinks: skipLinkAnalysis.skipLinks?.length > 0,
      customFocusStyles: focusIndicatorAnalysis.customFocusStyles || 0
    };

    summary.totalIssues = summary.elementsWithoutFocus + summary.poorFocusIndicators +
                         summary.missingFocusTraps + summary.tabOrderIssues +
                         summary.logicalFlowIssues + summary.skipLinkIssues +
                         summary.dynamicFocusIssues + summary.customFocusIssues;

    summary.score = this.calculateScore({ summary });

    // Additional metrics
    summary.focusIndicatorCoverage = summary.totalFocusableElements > 0 ?
      Math.round(((summary.totalFocusableElements - summary.elementsWithoutFocus) / 
                  summary.totalFocusableElements) * 100) : 100;

    return summary;
  }

  /**
   * Get empty analysis object for error cases
   * @param {string} analysisId - Analysis ID
   * @returns {Object} Empty analysis structure
   */
  getEmptyAnalysis(analysisId) {
    return {
      analysisId,
      timestamp: new Date().toISOString(),
      focusIndicators: { totalFocusableElements: 0 },
      focusTraps: { issues: [] },
      focusFlow: { tabOrderIssues: [], logicalFlowIssues: [] },
      skipLinks: { issues: [], skipLinks: [] },
      dynamicFocus: { issues: [] },
      customFocus: { potentialIssues: [] },
      summary: {
        totalFocusableElements: 0,
        totalIssues: 0,
        score: 50,
        testFailed: true
      }
    };
  }
}

module.exports = FocusManagementAnalyzer;