const logger = require('../../utils/logger');
const AnalysisUtils = require('../utils/AnalysisUtils');

class KeyboardAnalyzer {
  
  async analyze(page, analysisId) {
    try {
      logger.info('Running keyboard analysis', { analysisId });
      
      const keyboardData = await page.evaluate(() => {
        const results = {
          // Interactive elements analysis
          interactiveElements: (() => {
            const selectors = [
              'a[href]', 'button', 'input:not([type="hidden"])', 'select', 'textarea',
              '[tabindex]:not([tabindex="-1"])', '[role="button"]', '[role="link"]',
              '[role="menuitem"]', '[role="tab"]', '[onclick]'
            ];
            
            const elements = Array.from(document.querySelectorAll(selectors.join(', ')));
            const elementData = {
              total: elements.length,
              focusable: 0,
              withTabindex: 0,
              withNegativeTabindex: 0,
              withPositiveTabindex: 0,
              withZeroTabindex: 0,
              withoutTabindex: 0,
              customInteractive: 0,
              potentiallyInaccessible: []
            };
            
            elements.forEach(element => {
              const tagName = element.tagName.toLowerCase();
              const tabindex = element.getAttribute('tabindex');
              const role = element.getAttribute('role');
              
              // Check if element is focusable
              const isFocusable = element.offsetWidth > 0 && element.offsetHeight > 0 && 
                                 getComputedStyle(element).visibility !== 'hidden' &&
                                 !element.disabled;
              
              if (isFocusable) {
                elementData.focusable++;
              }
              
              // Analyze tabindex usage
              if (tabindex !== null) {
                elementData.withTabindex++;
                const tabindexValue = parseInt(tabindex);
                
                if (tabindexValue < 0) {
                  elementData.withNegativeTabindex++;
                } else if (tabindexValue === 0) {
                  elementData.withZeroTabindex++;
                } else if (tabindexValue > 0) {
                  elementData.withPositiveTabindex++;
                }
              } else {
                elementData.withoutTabindex++;
              }
              
              // Check for custom interactive elements
              if (role && ['button', 'link', 'menuitem', 'tab'].includes(role) && 
                  !['button', 'a', 'input', 'select', 'textarea'].includes(tagName)) {
                elementData.customInteractive++;
                
                // Check if custom interactive element has proper keyboard support
                if (!tabindex && tagName !== 'button' && tagName !== 'a') {
                  elementData.potentiallyInaccessible.push({
                    tagName,
                    role,
                    issue: 'Custom interactive element may not be keyboard accessible',
                    selector: element.id ? `#${element.id}` : 
                             element.className ? `.${element.className.split(' ')[0]}` : 
                             `${tagName}[role="${role}"]`
                  });
                }
              }
              
              // Check for onclick without keyboard support
              if (element.hasAttribute('onclick') && 
                  !['button', 'a', 'input'].includes(tagName) && 
                  !tabindex) {
                elementData.potentiallyInaccessible.push({
                  tagName,
                  role: role || 'none',
                  issue: 'Element with onclick may not be keyboard accessible',
                  selector: element.id ? `#${element.id}` : 
                           element.className ? `.${element.className.split(' ')[0]}` : 
                           tagName
                });
              }
            });
            
            return elementData;
          })(),
          
          // Skip links analysis
          skipLinks: (() => {
            const skipSelectors = [
              'a[href^="#skip"]', 'a[href^="#main"]', 'a[href^="#content"]',
              '.skip-link', '.skip-to-content', '.sr-only a[href^="#"]'
            ];
            
            const skipLinks = Array.from(document.querySelectorAll(skipSelectors.join(', ')));
            const skipData = {
              total: skipLinks.length,
              visible: 0,
              hidden: 0,
              workingLinks: 0,
              brokenLinks: 0,
              details: []
            };
            
            skipLinks.forEach(link => {
              const href = link.getAttribute('href');
              const target = href ? document.querySelector(href) : null;
              const isVisible = link.offsetWidth > 0 && link.offsetHeight > 0;
              const computedStyle = getComputedStyle(link);
              const isVisuallyHidden = computedStyle.position === 'absolute' && 
                                     (computedStyle.left === '-9999px' || computedStyle.left === '-10000px') ||
                                     computedStyle.clip === 'rect(0, 0, 0, 0)';
              
              const linkInfo = {
                text: link.textContent.trim(),
                href,
                hasTarget: !!target,
                isVisible: isVisible && !isVisuallyHidden,
                isHidden: !isVisible || isVisuallyHidden
              };
              
              if (linkInfo.isVisible) {
                skipData.visible++;
              } else {
                skipData.hidden++;
              }
              
              if (target) {
                skipData.workingLinks++;
              } else {
                skipData.brokenLinks++;
              }
              
              skipData.details.push(linkInfo);
            });
            
            return skipData;
          })(),
          
          // Focus management analysis
          focusManagement: (() => {
            const focusableSelectors = [
              'a[href]', 'button:not([disabled])', 'input:not([disabled]):not([type="hidden"])',
              'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])'
            ];
            
            const focusableElements = Array.from(document.querySelectorAll(focusableSelectors.join(', ')));
            const focusData = {
              totalFocusableElements: focusableElements.length,
              elementsWithFocusStyles: 0,
              elementsWithoutFocusStyles: 0,
              customFocusIndicators: 0,
              potentialFocusTraps: 0,
              modalDialogs: document.querySelectorAll('[role="dialog"], [role="alertdialog"], .modal').length
            };
            
            // This is a simplified check - in a real implementation, you'd need to 
            // actually focus elements and check computed styles
            focusableElements.forEach(element => {
              // Check for focus-related CSS (simplified)
              const styles = getComputedStyle(element);
              const hasCustomOutline = styles.outline !== 'none' && styles.outline !== '0px';
              const hasBoxShadow = styles.boxShadow !== 'none';
              const hasBorder = styles.border !== 'none';
              
              if (hasCustomOutline || hasBoxShadow || hasBorder) {
                focusData.elementsWithFocusStyles++;
              } else {
                focusData.elementsWithoutFocusStyles++;
              }
            });
            
            return focusData;
          })(),
          
          // ARIA and keyboard interaction
          ariaKeyboardSupport: (() => {
            const ariaElements = Array.from(document.querySelectorAll('[role]'));
            const keyboardData = {
              totalAriaElements: ariaElements.length,
              interactiveAriaElements: 0,
              expandableElements: document.querySelectorAll('[aria-expanded]').length,
              pressableElements: document.querySelectorAll('[aria-pressed]').length,
              selectedElements: document.querySelectorAll('[aria-selected]').length,
              checkedElements: document.querySelectorAll('[aria-checked]').length,
              hasPopupElements: document.querySelectorAll('[aria-haspopup]').length,
              controlsElements: document.querySelectorAll('[aria-controls]').length
            };
            
            // Count interactive ARIA elements
            const interactiveRoles = [
              'button', 'link', 'menuitem', 'tab', 'option', 'checkbox', 'radio',
              'slider', 'spinbutton', 'switch', 'textbox', 'combobox'
            ];
            
            ariaElements.forEach(element => {
              const role = element.getAttribute('role');
              if (interactiveRoles.includes(role)) {
                keyboardData.interactiveAriaElements++;
              }
            });
            
            return keyboardData;
          })()
        };

        return results;
      });

      // Perform actual keyboard navigation test
      const tabNavigationTest = await this.performTabNavigationTest(page);
      keyboardData.tabNavigationTest = tabNavigationTest;

      return keyboardData;
    } catch (error) {
      logger.error('Keyboard analysis failed:', { error: error.message, analysisId });
      throw error;
    }
  }

  async performTabNavigationTest(page) {
    try {
      logger.info('Performing tab navigation test');
      
      const navigationResult = await page.evaluate(async () => {
        const tabSequence = [];
        const issues = [];
        let currentElement = document.activeElement || document.body;
        
        // Reset focus to start
        if (document.body) {
          document.body.focus();
        }
        
        const maxTabs = 20; // Limit to prevent infinite loops
        let tabCount = 0;
        const visitedElements = new Set();
        
        // Simulate tab navigation
        while (tabCount < maxTabs) {
          // Simulate Tab key press
          const tabEvent = new KeyboardEvent('keydown', {
            key: 'Tab',
            code: 'Tab',
            keyCode: 9,
            bubbles: true,
            cancelable: true
          });
          
          document.dispatchEvent(tabEvent);
          
          // Small delay to allow focus changes
          await new Promise(resolve => setTimeout(resolve, 10));
          
          const newActiveElement = document.activeElement;
          
          if (!newActiveElement || newActiveElement === document.body) {
            break;
          }
          
          // Check for focus loops
          const elementKey = newActiveElement.tagName + (newActiveElement.id || '') + (newActiveElement.className || '');
          if (visitedElements.has(elementKey)) {
            break;
          }
          visitedElements.add(elementKey);
          
          const rect = newActiveElement.getBoundingClientRect();
          const computedStyle = getComputedStyle(newActiveElement);
          
          const elementInfo = {
            tagName: newActiveElement.tagName.toLowerCase(),
            type: newActiveElement.type || '',
            role: newActiveElement.getAttribute('role') || '',
            tabindex: newActiveElement.getAttribute('tabindex') || '',
            id: newActiveElement.id || '',
            className: newActiveElement.className || '',
            text: newActiveElement.textContent?.trim().substring(0, 50) || '',
            isVisible: rect.width > 0 && rect.height > 0 && computedStyle.visibility !== 'hidden',
            hasOutline: computedStyle.outline !== 'none' && computedStyle.outline !== '0px',
            rect: {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height
            }
          };
          
          tabSequence.push(elementInfo);
          
          // Check for accessibility issues
          if (!elementInfo.isVisible) {
            issues.push({
              type: 'hidden_focusable',
              message: 'Focusable element is not visible',
              element: elementInfo.tagName,
              position: tabCount
            });
          }
          
          if (!elementInfo.hasOutline && computedStyle.outline !== 'none') {
            issues.push({
              type: 'no_focus_indicator',
              message: 'Element lacks visible focus indicator',
              element: elementInfo.tagName,
              position: tabCount
            });
          }
          
          currentElement = newActiveElement;
          tabCount++;
        }
        
        // Check tab order logic
        const isLogicalOrder = this.isLogicalTabOrder ? this.isLogicalTabOrder(tabSequence) : true;
        
        return {
          tabSequence,
          issues,
          totalFocusableFound: tabSequence.length,
          hasLogicalOrder: isLogicalOrder,
          focusTraps: issues.filter(issue => issue.type === 'focus_trap').length,
          hiddenFocusableElements: issues.filter(issue => issue.type === 'hidden_focusable').length,
          elementsWithoutFocusIndicator: issues.filter(issue => issue.type === 'no_focus_indicator').length
        };
      });
      
      return navigationResult;
    } catch (error) {
      logger.error('Tab navigation test failed:', error);
      return {
        tabSequence: [],
        issues: [],
        totalFocusableFound: 0,
        hasLogicalOrder: true,
        focusTraps: 0,
        hiddenFocusableElements: 0,
        elementsWithoutFocusIndicator: 0,
        error: error.message
      };
    }
  }

  calculateScore(keyboardData) {
    if (!keyboardData) return 0;
    
    let score = 100;
    
    // Penalize elements without keyboard accessibility
    if (keyboardData.interactiveElements?.potentiallyInaccessible?.length > 0) {
      score -= Math.min(keyboardData.interactiveElements.potentiallyInaccessible.length * 10, 30);
    }
    
    // Penalize positive tabindex usage (anti-pattern)
    if (keyboardData.interactiveElements?.withPositiveTabindex > 0) {
      score -= Math.min(keyboardData.interactiveElements.withPositiveTabindex * 8, 25);
    }
    
    // Penalize missing skip links
    if (keyboardData.skipLinks?.total === 0) {
      score -= 15;
    }
    
    // Penalize broken skip links
    if (keyboardData.skipLinks?.brokenLinks > 0) {
      score -= Math.min(keyboardData.skipLinks.brokenLinks * 10, 20);
    }
    
    // Penalize elements without focus indicators
    if (keyboardData.tabNavigationTest?.elementsWithoutFocusIndicator > 0) {
      score -= Math.min(keyboardData.tabNavigationTest.elementsWithoutFocusIndicator * 5, 20);
    }
    
    // Penalize hidden focusable elements
    if (keyboardData.tabNavigationTest?.hiddenFocusableElements > 0) {
      score -= Math.min(keyboardData.tabNavigationTest.hiddenFocusableElements * 8, 25);
    }
    
    // Penalize illogical tab order
    if (keyboardData.tabNavigationTest?.hasLogicalOrder === false) {
      score -= 15;
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  generateRecommendations(keyboardData, language = 'en') {
    const recommendations = [];
    
    if (!keyboardData) return recommendations;
    
    // Potentially inaccessible interactive elements
    if (keyboardData.interactiveElements?.potentiallyInaccessible?.length > 0) {
      recommendations.push({
        type: 'keyboard',
        priority: 'high',
        issue: 'Interactive elements may not be keyboard accessible',
        description: `Found ${keyboardData.interactiveElements.potentiallyInaccessible.length} interactive elements that may not be reachable via keyboard`,
        suggestion: 'Add tabindex="0" to custom interactive elements and ensure they respond to Enter/Space keys'
      });
    }
    
    // Positive tabindex usage
    if (keyboardData.interactiveElements?.withPositiveTabindex > 0) {
      recommendations.push({
        type: 'keyboard',
        priority: 'medium',
        issue: 'Positive tabindex values detected',
        description: `Found ${keyboardData.interactiveElements.withPositiveTabindex} elements with positive tabindex values`,
        suggestion: 'Avoid positive tabindex values. Use tabindex="0" or restructure HTML for logical tab order'
      });
    }
    
    // Missing skip links
    if (keyboardData.skipLinks?.total === 0) {
      recommendations.push({
        type: 'keyboard',
        priority: 'high',
        issue: 'No skip links found',
        description: 'Page lacks skip navigation links for keyboard users',
        suggestion: 'Add "Skip to main content" links at the beginning of the page'
      });
    }
    
    // Broken skip links
    if (keyboardData.skipLinks?.brokenLinks > 0) {
      recommendations.push({
        type: 'keyboard',
        priority: 'high',
        issue: 'Broken skip links',
        description: `Found ${keyboardData.skipLinks.brokenLinks} skip links pointing to non-existent targets`,
        suggestion: 'Ensure all skip links point to valid page anchors'
      });
    }
    
    // Elements without focus indicators
    if (keyboardData.tabNavigationTest?.elementsWithoutFocusIndicator > 0) {
      recommendations.push({
        type: 'keyboard',
        priority: 'medium',
        issue: 'Elements without focus indicators',
        description: `Found ${keyboardData.tabNavigationTest.elementsWithoutFocusIndicator} focusable elements without visible focus indicators`,
        suggestion: 'Ensure all focusable elements have clear, visible focus indicators'
      });
    }
    
    // Hidden focusable elements
    if (keyboardData.tabNavigationTest?.hiddenFocusableElements > 0) {
      recommendations.push({
        type: 'keyboard',
        priority: 'high',
        issue: 'Hidden focusable elements',
        description: `Found ${keyboardData.tabNavigationTest.hiddenFocusableElements} focusable elements that are not visible`,
        suggestion: 'Remove tabindex from hidden elements or ensure they become visible when focused'
      });
    }
    
    // Illogical tab order
    if (keyboardData.tabNavigationTest?.hasLogicalOrder === false) {
      recommendations.push({
        type: 'keyboard',
        priority: 'medium',
        issue: 'Illogical tab order',
        description: 'Tab navigation does not follow a logical sequence',
        suggestion: 'Restructure HTML or use tabindex to create a logical tab sequence'
      });
    }
    
    // No ARIA keyboard support for interactive elements
    if (keyboardData.ariaKeyboardSupport?.interactiveAriaElements > 0 && 
        keyboardData.interactiveElements?.customInteractive > 0) {
      recommendations.push({
        type: 'keyboard',
        priority: 'medium',
        issue: 'Custom interactive elements need keyboard event handlers',
        description: 'Custom ARIA interactive elements should handle keyboard events',
        suggestion: 'Add keydown event listeners for Enter and Space keys to custom interactive elements'
      });
    }
    
    return recommendations;
  }
}

module.exports = KeyboardAnalyzer;