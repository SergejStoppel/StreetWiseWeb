const logger = require('../../utils/logger');
const AnalysisUtils = require('../utils/AnalysisUtils');

/**
 * KeyboardShortcutAnalyzer - Analyzes keyboard shortcuts and access keys for conflicts
 * 
 * Validates that access keys and keyboard shortcuts don't conflict with browser
 * or assistive technology shortcuts, following WCAG 2.1 guidelines.
 */
class KeyboardShortcutAnalyzer {
  constructor() {
    // Common browser and AT shortcuts that should not be overridden
    this.reservedShortcuts = {
      // Browser navigation shortcuts
      'f': 'Find in page',
      'h': 'History',
      'l': 'Address bar',
      'r': 'Refresh',
      't': 'New tab',
      'w': 'Close tab',
      'd': 'Bookmark page',
      'e': 'Search bar',
      'n': 'New window',
      'o': 'Open file',
      's': 'Save page',
      'p': 'Print',
      'u': 'View source',
      'y': 'Redo',
      'z': 'Undo',
      'a': 'Select all',
      'c': 'Copy',
      'v': 'Paste',
      'x': 'Cut',
      'b': 'Bookmarks',
      'j': 'Downloads',
      'k': 'Search',
      'm': 'Minimize',
      'q': 'Quit',
      '1': 'Switch to tab 1',
      '2': 'Switch to tab 2',
      '3': 'Switch to tab 3',
      '4': 'Switch to tab 4',
      '5': 'Switch to tab 5',
      '6': 'Switch to tab 6',
      '7': 'Switch to tab 7',
      '8': 'Switch to tab 8',
      '9': 'Switch to tab 9',
      '0': 'Switch to last tab',
      
      // Screen reader shortcuts (NVDA, JAWS, etc.)
      'space': 'Activate virtual cursor',
      'enter': 'Activate element',
      'tab': 'Next focusable element',
      'shift+tab': 'Previous focusable element',
      'arrow': 'Navigation',
      'home': 'Start of content',
      'end': 'End of content',
      'pageup': 'Previous page/section',
      'pagedown': 'Next page/section',
      'escape': 'Exit mode/cancel',
      'f1': 'Help',
      'f2': 'Rename/edit',
      'f3': 'Find next',
      'f4': 'Close',
      'f5': 'Refresh',
      'f6': 'Navigate frames',
      'f7': 'Spelling check',
      'f8': 'Column header',
      'f9': 'Row header',
      'f10': 'Menu bar',
      'f11': 'Full screen',
      'f12': 'Developer tools'
    };
  }

  async analyze(page, analysisId) {
    try {
      logger.info('Starting keyboard shortcut analysis', { analysisId });

      const shortcutData = await page.evaluate((reservedShortcuts) => {
        const results = {
          summary: {
            totalAccessKeys: 0,
            conflictingAccessKeys: 0,
            duplicateAccessKeys: 0,
            validAccessKeys: 0,
            reservedConflicts: 0,
            score: 100,
            testFailed: false
          },
          
          accessKeys: {
            all: [],
            conflicts: [],
            duplicates: [],
            reserved: [],
            valid: []
          },
          
          shortcuts: {
            detected: [],
            conflicts: []
          },
          
          issues: []
        };

        // Helper function to get element identifier
        function getElementIdentifier(element) {
          if (element.id) return `#${element.id}`;
          if (element.className) return `.${element.className.split(' ')[0]}`;
          if (element.getAttribute('aria-label')) return `[aria-label="${element.getAttribute('aria-label')}"]`;
          if (element.textContent) return element.textContent.trim().substring(0, 30);
          return element.tagName.toLowerCase();
        }

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

        // Find all elements with access keys
        const elementsWithAccessKeys = Array.from(document.querySelectorAll('[accesskey]'));
        results.summary.totalAccessKeys = elementsWithAccessKeys.length;

        // Track access key usage
        const accessKeyMap = {};
        
        elementsWithAccessKeys.forEach(element => {
          const accessKey = element.getAttribute('accesskey');
          if (!accessKey) return;
          
          const normalizedKey = accessKey.toLowerCase().trim();
          const elementInfo = {
            element: getElementIdentifier(element),
            accessKey: normalizedKey,
            tagName: element.tagName.toLowerCase(),
            isVisible: isElementVisible(element),
            text: element.textContent?.trim().substring(0, 50) || '',
            hasLabel: !!(element.getAttribute('aria-label') || element.textContent?.trim())
          };

          results.accessKeys.all.push(elementInfo);

          // Check for duplicates
          if (accessKeyMap[normalizedKey]) {
            accessKeyMap[normalizedKey].push(elementInfo);
            if (accessKeyMap[normalizedKey].length === 2) {
              // First time we detect this duplicate
              results.summary.duplicateAccessKeys++;
              results.accessKeys.duplicates.push({
                accessKey: normalizedKey,
                elements: accessKeyMap[normalizedKey]
              });
            } else {
              // Add to existing duplicate entry
              const duplicateEntry = results.accessKeys.duplicates.find(d => d.accessKey === normalizedKey);
              if (duplicateEntry) {
                duplicateEntry.elements.push(elementInfo);
              }
            }
          } else {
            accessKeyMap[normalizedKey] = [elementInfo];
          }

          // Check against reserved shortcuts
          if (reservedShortcuts[normalizedKey]) {
            results.summary.reservedConflicts++;
            results.accessKeys.reserved.push({
              ...elementInfo,
              conflictsWith: reservedShortcuts[normalizedKey]
            });
            results.accessKeys.conflicts.push(elementInfo);
          } else {
            results.accessKeys.valid.push(elementInfo);
            results.summary.validAccessKeys++;
          }
        });

        // Check for JavaScript keyboard event listeners that might conflict
        const elementsWithKeyboardListeners = Array.from(document.querySelectorAll('*')).filter(el => {
          // Check for inline event handlers
          return el.getAttribute('onkeydown') || 
                 el.getAttribute('onkeyup') || 
                 el.getAttribute('onkeypress') ||
                 // Check if element has event listeners (this is limited in scope)
                 (el._events && (el._events.keydown || el._events.keyup || el._events.keypress));
        });

        elementsWithKeyboardListeners.forEach(element => {
          const shortcutInfo = {
            element: getElementIdentifier(element),
            tagName: element.tagName.toLowerCase(),
            hasKeydown: !!element.getAttribute('onkeydown'),
            hasKeyup: !!element.getAttribute('onkeyup'),
            hasKeypress: !!element.getAttribute('onkeypress'),
            isVisible: isElementVisible(element)
          };
          results.shortcuts.detected.push(shortcutInfo);
        });

        // Calculate conflicts
        results.summary.conflictingAccessKeys = results.accessKeys.conflicts.length;

        // Generate issues
        if (results.summary.duplicateAccessKeys > 0) {
          results.issues.push({
            type: 'duplicate_access_keys',
            severity: 'high',
            message: `Found ${results.summary.duplicateAccessKeys} duplicate access keys`,
            wcagCriterion: '2.1.1',
            elements: results.accessKeys.duplicates.slice(0, 5)
          });
        }

        if (results.summary.reservedConflicts > 0) {
          results.issues.push({
            type: 'reserved_shortcut_conflicts',
            severity: 'high', 
            message: `Found ${results.summary.reservedConflicts} access keys that conflict with browser/AT shortcuts`,
            wcagCriterion: '2.1.1',
            elements: results.accessKeys.reserved.slice(0, 5)
          });
        }

        if (results.shortcuts.detected.length > 5) {
          results.issues.push({
            type: 'excessive_keyboard_handlers',
            severity: 'medium',
            message: `Found ${results.shortcuts.detected.length} elements with keyboard event handlers`,
            wcagCriterion: '2.1.1',
            note: 'Ensure custom keyboard shortcuts don\'t interfere with assistive technology'
          });
        }

        // Check for missing access keys on important elements
        const importantElements = Array.from(document.querySelectorAll('button[type="submit"], .primary-button, .main-nav a, .skip-link'));
        const elementsWithoutAccessKeys = importantElements.filter(el => !el.getAttribute('accesskey') && isElementVisible(el));
        
        if (elementsWithoutAccessKeys.length > 0) {
          results.issues.push({
            type: 'missing_access_keys',
            severity: 'low',
            message: `${elementsWithoutAccessKeys.length} important elements could benefit from access keys`,
            wcagCriterion: '2.1.1',
            suggestion: 'Consider adding access keys to primary navigation and action buttons'
          });
        }

        return results;
      }, this.reservedShortcuts);

      // Calculate score (after page evaluation)
      shortcutData.summary.score = this.calculateScore(shortcutData);
      
      // Add analyzer metadata
      shortcutData.analyzerId = 'KeyboardShortcutAnalyzer';
      shortcutData.timestamp = new Date().toISOString();

      logger.info('Keyboard shortcut analysis completed', {
        analysisId,
        totalAccessKeys: shortcutData.summary.totalAccessKeys,
        conflicts: shortcutData.summary.conflictingAccessKeys,
        score: shortcutData.summary.score
      });

      return shortcutData;

    } catch (error) {
      logger.error('Keyboard shortcut analysis failed:', { error: error.message, analysisId });
      return {
        summary: {
          testFailed: true,
          error: error.message,
          totalAccessKeys: 0,
          conflictingAccessKeys: 0,
          score: 50
        },
        accessKeys: { all: [], conflicts: [], duplicates: [], reserved: [], valid: [] },
        shortcuts: { detected: [], conflicts: [] },
        issues: []
      };
    }
  }

  calculateScore(analysisData) {
    if (!analysisData || analysisData.summary?.testFailed) return 50;

    let score = 100;
    const { summary } = analysisData;

    // No access keys = perfect score (nothing to conflict)
    if (summary.totalAccessKeys === 0) return 100;

    // Heavy penalty for conflicts with reserved shortcuts
    if (summary.reservedConflicts > 0) {
      score -= summary.reservedConflicts * 20; // 20 points per conflict
    }

    // Penalty for duplicate access keys
    if (summary.duplicateAccessKeys > 0) {
      score -= summary.duplicateAccessKeys * 15; // 15 points per duplicate
    }

    // Minor penalty for too many keyboard handlers
    const detectedHandlers = analysisData.shortcuts?.detected?.length || 0;
    if (detectedHandlers > 10) {
      score -= Math.min((detectedHandlers - 10) * 2, 20); // Up to 20 points
    }

    // Bonus for having some access keys (but not too many)
    if (summary.totalAccessKeys > 0 && summary.totalAccessKeys <= 10 && summary.conflictingAccessKeys === 0) {
      score += 5;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  generateRecommendations(analysisData, language = 'en') {
    const recommendations = [];

    if (!analysisData || analysisData.summary?.testFailed) {
      return recommendations;
    }

    const { summary, accessKeys, shortcuts, issues } = analysisData;

    // Reserved shortcut conflicts
    if (summary.reservedConflicts > 0) {
      recommendations.push({
        type: 'keyboard-shortcuts',
        priority: 'high',
        issue: 'Access keys conflict with browser shortcuts',
        description: `${summary.reservedConflicts} access keys conflict with standard browser or assistive technology shortcuts`,
        suggestion: 'Use different access keys that don\'t interfere with browser functionality (avoid A-Z, 0-9, F1-F12)',
        wcagCriterion: '2.1.1',
        affectedElements: accessKeys.reserved.slice(0, 3).map(ak => `${ak.element} (accesskey="${ak.accessKey}")`)
      });
    }

    // Duplicate access keys
    if (summary.duplicateAccessKeys > 0) {
      recommendations.push({
        type: 'keyboard-shortcuts',
        priority: 'high',
        issue: 'Duplicate access keys detected',
        description: `${summary.duplicateAccessKeys} access keys are used by multiple elements`,
        suggestion: 'Ensure each access key is unique across the page to prevent conflicts',
        wcagCriterion: '2.1.1',
        affectedElements: accessKeys.duplicates.slice(0, 3).map(dup => `accesskey="${dup.accessKey}" used by ${dup.elements.length} elements`)
      });
    }

    // Too many keyboard handlers
    const handlerCount = shortcuts.detected?.length || 0;
    if (handlerCount > 10) {
      recommendations.push({
        type: 'keyboard-shortcuts',
        priority: 'medium',
        issue: 'Excessive keyboard event handlers',
        description: `${handlerCount} elements have custom keyboard event handlers`,
        suggestion: 'Review custom keyboard shortcuts to ensure they don\'t interfere with assistive technology navigation',
        wcagCriterion: '2.1.1'
      });
    }

    // No access keys (suggestion for improvement)
    if (summary.totalAccessKeys === 0) {
      recommendations.push({
        type: 'keyboard-shortcuts',
        priority: 'low',
        issue: 'No access keys provided',
        description: 'Consider adding access keys to important navigation and action elements',
        suggestion: 'Add accesskey attributes to primary buttons and navigation links using safe key combinations',
        wcagCriterion: '2.1.1'
      });
    }

    // Good implementation
    if (summary.totalAccessKeys > 0 && summary.conflictingAccessKeys === 0 && summary.duplicateAccessKeys === 0) {
      recommendations.push({
        type: 'keyboard-shortcuts',
        priority: 'info',
        issue: 'Good keyboard shortcut implementation',
        description: 'Access keys are properly implemented without conflicts',
        suggestion: 'Continue following keyboard accessibility best practices',
        wcagCriterion: '2.1.1'
      });
    }

    return recommendations;
  }
}

module.exports = KeyboardShortcutAnalyzer;