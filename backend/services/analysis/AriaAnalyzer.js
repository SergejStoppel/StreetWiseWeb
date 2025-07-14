const logger = require('../../utils/logger');
const AnalysisUtils = require('../utils/AnalysisUtils');

class AriaAnalyzer {
  
  async analyze(page, analysisId) {
    try {
      logger.info('Running ARIA analysis', { analysisId });
      
      const ariaData = await page.evaluate(() => {
        const results = {
          // ARIA landmarks analysis
          landmarks: {
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
          
          // ARIA labels and descriptions
          ariaLabels: (() => {
            const elementsWithAriaLabel = Array.from(document.querySelectorAll('[aria-label]'));
            const elementsWithAriaLabelledby = Array.from(document.querySelectorAll('[aria-labelledby]'));
            const elementsWithAriaDescribedby = Array.from(document.querySelectorAll('[aria-describedby]'));
            
            return {
              withAriaLabel: elementsWithAriaLabel.length,
              withAriaLabelledby: elementsWithAriaLabelledby.length,
              withAriaDescribedby: elementsWithAriaDescribedby.length,
              emptyAriaLabels: elementsWithAriaLabel.filter(el => !el.getAttribute('aria-label').trim()).length,
              invalidLabelledby: elementsWithAriaLabelledby.filter(el => {
                const ids = el.getAttribute('aria-labelledby').split(/\s+/);
                return ids.some(id => !document.getElementById(id));
              }).length,
              invalidDescribedby: elementsWithAriaDescribedby.filter(el => {
                const ids = el.getAttribute('aria-describedby').split(/\s+/);
                return ids.some(id => !document.getElementById(id));
              }).length
            };
          })(),
          
          // ARIA roles analysis
          ariaRoles: (() => {
            const elementsWithRole = Array.from(document.querySelectorAll('[role]'));
            const roleUsage = {};
            const invalidRoles = [];
            
            // Valid ARIA roles (subset of most common ones)
            const validRoles = [
              'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
              'cell', 'checkbox', 'columnheader', 'combobox', 'complementary',
              'contentinfo', 'dialog', 'directory', 'document', 'feed', 'figure',
              'form', 'grid', 'gridcell', 'group', 'heading', 'img', 'link',
              'list', 'listbox', 'listitem', 'log', 'main', 'marquee', 'math',
              'menu', 'menubar', 'menuitem', 'menuitemcheckbox', 'menuitemradio',
              'navigation', 'none', 'note', 'option', 'presentation', 'progressbar',
              'radio', 'radiogroup', 'region', 'row', 'rowgroup', 'rowheader',
              'scrollbar', 'search', 'searchbox', 'separator', 'slider', 'spinbutton',
              'status', 'switch', 'tab', 'table', 'tablist', 'tabpanel', 'term',
              'textbox', 'timer', 'toolbar', 'tooltip', 'tree', 'treegrid',
              'treeitem'
            ];
            
            elementsWithRole.forEach(element => {
              const role = element.getAttribute('role');
              if (role) {
                roleUsage[role] = (roleUsage[role] || 0) + 1;
                if (!validRoles.includes(role)) {
                  invalidRoles.push({
                    role,
                    element: element.tagName.toLowerCase(),
                    selector: element.id ? `#${element.id}` : element.className ? `.${element.className.split(' ')[0]}` : element.tagName.toLowerCase()
                  });
                }
              }
            });
            
            return {
              totalWithRole: elementsWithRole.length,
              roleUsage,
              invalidRoles,
              uniqueRoles: Object.keys(roleUsage).length
            };
          })(),
          
          // ARIA states and properties
          ariaStates: (() => {
            const ariaAttributes = [
              'aria-expanded', 'aria-selected', 'aria-checked', 'aria-pressed',
              'aria-disabled', 'aria-hidden', 'aria-invalid', 'aria-required',
              'aria-readonly', 'aria-live', 'aria-atomic', 'aria-relevant',
              'aria-busy', 'aria-grabbed', 'aria-dropeffect', 'aria-haspopup',
              'aria-level', 'aria-multiline', 'aria-multiselectable', 'aria-orientation',
              'aria-sort', 'aria-valuemin', 'aria-valuemax', 'aria-valuenow',
              'aria-valuetext', 'aria-controls', 'aria-flowto', 'aria-owns'
            ];
            
            const stateUsage = {};
            const invalidStates = [];
            
            ariaAttributes.forEach(attr => {
              const elements = document.querySelectorAll(`[${attr}]`);
              if (elements.length > 0) {
                stateUsage[attr] = elements.length;
                
                // Check for invalid boolean values
                if (['aria-expanded', 'aria-selected', 'aria-checked', 'aria-pressed', 'aria-disabled', 'aria-hidden', 'aria-invalid', 'aria-required', 'aria-readonly'].includes(attr)) {
                  elements.forEach(el => {
                    const value = el.getAttribute(attr);
                    if (!['true', 'false'].includes(value)) {
                      invalidStates.push({
                        attribute: attr,
                        value,
                        element: el.tagName.toLowerCase()
                      });
                    }
                  });
                }
              }
            });
            
            return {
              stateUsage,
              invalidStates,
              totalAriaAttributes: Object.values(stateUsage).reduce((sum, count) => sum + count, 0)
            };
          })(),
          
          // Live regions
          liveRegions: (() => {
            const liveElements = Array.from(document.querySelectorAll('[aria-live]'));
            const statusElements = Array.from(document.querySelectorAll('[role="status"]'));
            const alertElements = Array.from(document.querySelectorAll('[role="alert"]'));
            const logElements = Array.from(document.querySelectorAll('[role="log"]'));
            
            return {
              ariaLive: liveElements.length,
              statusRole: statusElements.length,
              alertRole: alertElements.length,
              logRole: logElements.length,
              total: liveElements.length + statusElements.length + alertElements.length + logElements.length,
              politeRegions: liveElements.filter(el => el.getAttribute('aria-live') === 'polite').length,
              assertiveRegions: liveElements.filter(el => el.getAttribute('aria-live') === 'assertive').length
            };
          })(),
          
          // Hidden content analysis
          hiddenContent: (() => {
            const ariaHiddenElements = Array.from(document.querySelectorAll('[aria-hidden="true"]'));
            const visuallyHiddenElements = Array.from(document.querySelectorAll('.sr-only, .visually-hidden, .screen-reader-only'));
            const hiddenElements = Array.from(document.querySelectorAll('[hidden]'));
            
            // Check for interactive elements that are aria-hidden (accessibility issue)
            const hiddenInteractiveElements = ariaHiddenElements.filter(el => {
              return el.matches('a, button, input, select, textarea, [tabindex], [role="button"], [role="link"]');
            });
            
            return {
              ariaHidden: ariaHiddenElements.length,
              visuallyHidden: visuallyHiddenElements.length,
              htmlHidden: hiddenElements.length,
              hiddenInteractive: hiddenInteractiveElements.length,
              hiddenInteractiveElements: hiddenInteractiveElements.map(el => ({
                tagName: el.tagName.toLowerCase(),
                type: el.type || '',
                role: el.getAttribute('role') || '',
                text: el.textContent?.trim().substring(0, 50) || ''
              }))
            };
          })()
        };

        return results;
      });

      return ariaData;
    } catch (error) {
      logger.error('ARIA analysis failed:', { error: error.message, analysisId });
      throw error;
    }
  }

  calculateScore(ariaData) {
    if (!ariaData) return 0;
    
    let score = 100;
    
    // Check ARIA landmarks
    if (!ariaData.landmarks?.hasMainLandmark) score -= 15;
    if (!ariaData.landmarks?.hasNavigationLandmark) score -= 10;
    if (!ariaData.landmarks?.hasBannerLandmark) score -= 5;
    
    // Check ARIA labels
    if (ariaData.ariaLabels?.emptyAriaLabels > 0) {
      score -= Math.min(ariaData.ariaLabels.emptyAriaLabels * 5, 15);
    }
    if (ariaData.ariaLabels?.invalidLabelledby > 0) {
      score -= Math.min(ariaData.ariaLabels.invalidLabelledby * 8, 20);
    }
    if (ariaData.ariaLabels?.invalidDescribedby > 0) {
      score -= Math.min(ariaData.ariaLabels.invalidDescribedby * 5, 15);
    }
    
    // Check ARIA roles
    if (ariaData.ariaRoles?.invalidRoles?.length > 0) {
      score -= Math.min(ariaData.ariaRoles.invalidRoles.length * 10, 25);
    }
    
    // Check ARIA states
    if (ariaData.ariaStates?.invalidStates?.length > 0) {
      score -= Math.min(ariaData.ariaStates.invalidStates.length * 5, 20);
    }
    
    // Check hidden interactive elements (major accessibility issue)
    if (ariaData.hiddenContent?.hiddenInteractive > 0) {
      score -= Math.min(ariaData.hiddenContent.hiddenInteractive * 15, 30);
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  generateRecommendations(ariaData, language = 'en') {
    const recommendations = [];
    
    if (!ariaData) return recommendations;
    
    // Missing ARIA landmarks
    if (!ariaData.landmarks?.hasMainLandmark) {
      recommendations.push({
        type: 'aria',
        priority: 'high',
        issue: 'Missing main landmark',
        description: 'Page should have a main landmark to identify primary content',
        suggestion: 'Add role="main" or use a <main> element to mark the primary content area'
      });
    }
    
    if (!ariaData.landmarks?.hasNavigationLandmark) {
      recommendations.push({
        type: 'aria',
        priority: 'medium',
        issue: 'Missing navigation landmark',
        description: 'Page should have navigation landmarks for better screen reader navigation',
        suggestion: 'Add role="navigation" or use <nav> elements for navigation areas'
      });
    }
    
    // Empty ARIA labels
    if (ariaData.ariaLabels?.emptyAriaLabels > 0) {
      recommendations.push({
        type: 'aria',
        priority: 'high',
        issue: 'Empty ARIA labels',
        description: `Found ${ariaData.ariaLabels.emptyAriaLabels} elements with empty aria-label attributes`,
        suggestion: 'Provide meaningful aria-label text or remove empty aria-label attributes'
      });
    }
    
    // Invalid labelledby references
    if (ariaData.ariaLabels?.invalidLabelledby > 0) {
      recommendations.push({
        type: 'aria',
        priority: 'high',
        issue: 'Invalid aria-labelledby references',
        description: `Found ${ariaData.ariaLabels.invalidLabelledby} elements with aria-labelledby pointing to non-existent IDs`,
        suggestion: 'Ensure all aria-labelledby attributes reference valid element IDs'
      });
    }
    
    // Invalid roles
    if (ariaData.ariaRoles?.invalidRoles?.length > 0) {
      recommendations.push({
        type: 'aria',
        priority: 'medium',
        issue: 'Invalid ARIA roles',
        description: `Found ${ariaData.ariaRoles.invalidRoles.length} elements with invalid ARIA roles`,
        suggestion: 'Use only valid ARIA roles as defined in the ARIA specification'
      });
    }
    
    // Invalid ARIA states
    if (ariaData.ariaStates?.invalidStates?.length > 0) {
      recommendations.push({
        type: 'aria',
        priority: 'medium',
        issue: 'Invalid ARIA state values',
        description: `Found ${ariaData.ariaStates.invalidStates.length} elements with invalid ARIA state values`,
        suggestion: 'Boolean ARIA attributes should use "true" or "false" values only'
      });
    }
    
    // Hidden interactive elements
    if (ariaData.hiddenContent?.hiddenInteractive > 0) {
      recommendations.push({
        type: 'aria',
        priority: 'high',
        issue: 'Hidden interactive elements',
        description: `Found ${ariaData.hiddenContent.hiddenInteractive} interactive elements that are hidden with aria-hidden="true"`,
        suggestion: 'Remove aria-hidden="true" from interactive elements or make them non-interactive'
      });
    }
    
    // No live regions (if dynamic content is detected)
    if (ariaData.liveRegions?.total === 0) {
      recommendations.push({
        type: 'aria',
        priority: 'low',
        issue: 'No live regions detected',
        description: 'Consider using ARIA live regions for dynamic content updates',
        suggestion: 'Add aria-live, role="status", or role="alert" to elements that update dynamically'
      });
    }
    
    return recommendations;
  }
}

module.exports = AriaAnalyzer;