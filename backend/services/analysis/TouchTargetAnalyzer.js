const logger = require('../../utils/logger');
const AnalysisUtils = require('../utils/AnalysisUtils');

/**
 * TouchTargetAnalyzer - Analyzes touch target sizes for WCAG 2.5.5 compliance
 * 
 * Validates that interactive elements have adequate size (44x44px minimum) and spacing
 * for users with motor impairments and touch device users.
 */
class TouchTargetAnalyzer {
  constructor() {
    this.MIN_TARGET_SIZE = 44; // WCAG 2.5.5 minimum target size in pixels
    this.MIN_TARGET_SPACING = 8; // Recommended minimum spacing between targets
  }

  async analyze(page, analysisId) {
    try {
      logger.info('Starting touch target analysis', { analysisId });

      const touchTargetData = await page.evaluate((MIN_SIZE, MIN_SPACING) => {
        const results = {
          summary: {
            totalInteractiveElements: 0,
            elementsAnalyzed: 0,
            smallTargets: 0,
            adequateTargets: 0,
            overlappingTargets: 0,
            closelySpacedTargets: 0,
            targetsByType: {},
            averageTargetSize: 0,
            smallestTarget: null,
            testFailed: false
          },
          
          targets: {
            small: [],
            overlapping: [],
            closelySpaced: [],
            adequate: []
          },
          
          issues: []
        };

        // Helper function to get element's clickable area
        function getClickableArea(element) {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          
          // Include padding in clickable area
          const paddingTop = parseFloat(style.paddingTop) || 0;
          const paddingBottom = parseFloat(style.paddingBottom) || 0;
          const paddingLeft = parseFloat(style.paddingLeft) || 0;
          const paddingRight = parseFloat(style.paddingRight) || 0;
          
          return {
            width: rect.width,
            height: rect.height,
            // Effective clickable dimensions including padding
            effectiveWidth: rect.width,
            effectiveHeight: rect.height,
            top: rect.top,
            bottom: rect.bottom,
            left: rect.left,
            right: rect.right,
            x: rect.x,
            y: rect.y
          };
        }

        // Helper function to check if two rectangles overlap
        function doRectanglesOverlap(rect1, rect2) {
          return !(rect1.right < rect2.left || 
                   rect1.left > rect2.right || 
                   rect1.bottom < rect2.top || 
                   rect1.top > rect2.bottom);
        }

        // Helper function to calculate distance between two rectangles
        function getDistanceBetweenRects(rect1, rect2) {
          // If overlapping, distance is 0
          if (doRectanglesOverlap(rect1, rect2)) {
            return 0;
          }
          
          // Calculate minimum distance
          const dx = Math.max(0, Math.max(rect1.left - rect2.right, rect2.left - rect1.right));
          const dy = Math.max(0, Math.max(rect1.top - rect2.bottom, rect2.top - rect1.bottom));
          
          return Math.sqrt(dx * dx + dy * dy);
        }

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
                 rect.height > 0 &&
                 (rect.top < window.innerHeight && rect.bottom > 0) &&
                 (rect.left < window.innerWidth && rect.right > 0);
        }

        // Helper function to check if element is interactive
        function isInteractive(element) {
          const tagName = element.tagName.toLowerCase();
          const role = element.getAttribute('role');
          
          // Check for interactive tags
          if (['a', 'button', 'input', 'select', 'textarea', 'summary'].includes(tagName)) {
            return true;
          }
          
          // Check for interactive roles
          if (['button', 'link', 'checkbox', 'radio', 'slider', 'tab', 'menuitem'].includes(role)) {
            return true;
          }
          
          // Check for click handlers
          if (element.onclick || element.getAttribute('onclick')) {
            return true;
          }
          
          // Check for contenteditable
          if (element.contentEditable === 'true') {
            return true;
          }
          
          return false;
        }

        // Find all interactive elements
        const interactiveSelectors = [
          'a[href]',
          'button',
          'input:not([type="hidden"])',
          'select',
          'textarea',
          '[role="button"]',
          '[role="link"]',
          '[role="checkbox"]',
          '[role="radio"]',
          '[role="slider"]',
          '[role="tab"]',
          '[role="menuitem"]',
          '[onclick]',
          '[contenteditable="true"]',
          'summary'
        ];

        const allInteractiveElements = Array.from(
          document.querySelectorAll(interactiveSelectors.join(', '))
        );

        // Filter to visible elements only
        const visibleElements = allInteractiveElements.filter(isElementVisible);
        results.summary.totalInteractiveElements = visibleElements.length;

        // Analyze each element
        const elementData = [];
        visibleElements.forEach((element, index) => {
          const area = getClickableArea(element);
          const tagName = element.tagName.toLowerCase();
          const type = element.type || element.getAttribute('role') || tagName;
          
          // Track by type
          results.summary.targetsByType[type] = (results.summary.targetsByType[type] || 0) + 1;
          
          const data = {
            index,
            element,
            tagName,
            type,
            identifier: getElementIdentifier(element),
            area,
            width: area.effectiveWidth,
            height: area.effectiveHeight,
            size: Math.min(area.effectiveWidth, area.effectiveHeight),
            isSmall: area.effectiveWidth < MIN_SIZE || area.effectiveHeight < MIN_SIZE,
            text: element.textContent?.trim().substring(0, 50) || '',
            hasAriaLabel: !!element.getAttribute('aria-label'),
            isIconButton: !element.textContent?.trim() && (
              !!element.querySelector('svg') || 
              !!element.querySelector('i') ||
              !!element.querySelector('img')
            )
          };
          
          elementData.push(data);
          results.summary.elementsAnalyzed++;
        });

        // Check for small targets
        elementData.forEach(data => {
          if (data.isSmall) {
            results.summary.smallTargets++;
            results.targets.small.push({
              identifier: data.identifier,
              tagName: data.tagName,
              type: data.type,
              text: data.text,
              width: Math.round(data.width),
              height: Math.round(data.height),
              minimumSize: MIN_SIZE,
              deficit: {
                width: Math.max(0, MIN_SIZE - data.width),
                height: Math.max(0, MIN_SIZE - data.height)
              },
              isIconButton: data.isIconButton,
              hasAriaLabel: data.hasAriaLabel
            });
            
            // Track smallest target
            if (!results.summary.smallestTarget || data.size < results.summary.smallestTarget.size) {
              results.summary.smallestTarget = {
                identifier: data.identifier,
                size: Math.round(data.size),
                width: Math.round(data.width),
                height: Math.round(data.height)
              };
            }
          } else {
            results.summary.adequateTargets++;
            // Optionally track adequate targets (limited to prevent large data)
            if (results.targets.adequate.length < 10) {
              results.targets.adequate.push({
                identifier: data.identifier,
                width: Math.round(data.width),
                height: Math.round(data.height)
              });
            }
          }
        });

        // Check for overlapping and closely spaced targets
        for (let i = 0; i < elementData.length; i++) {
          for (let j = i + 1; j < elementData.length; j++) {
            const elem1 = elementData[i];
            const elem2 = elementData[j];
            
            // Skip if elements are parent/child
            if (elem1.element.contains(elem2.element) || elem2.element.contains(elem1.element)) {
              continue;
            }
            
            const distance = getDistanceBetweenRects(elem1.area, elem2.area);
            
            if (distance === 0 && doRectanglesOverlap(elem1.area, elem2.area)) {
              // Overlapping targets
              results.summary.overlappingTargets++;
              results.targets.overlapping.push({
                element1: elem1.identifier,
                element2: elem2.identifier,
                overlap: true
              });
            } else if (distance > 0 && distance < MIN_SPACING) {
              // Closely spaced targets
              results.summary.closelySpacedTargets++;
              if (results.targets.closelySpaced.length < 20) { // Limit to prevent large data
                results.targets.closelySpaced.push({
                  element1: elem1.identifier,
                  element2: elem2.identifier,
                  distance: Math.round(distance),
                  minimumSpacing: MIN_SPACING
                });
              }
            }
          }
        }

        // Calculate average target size
        if (elementData.length > 0) {
          const totalSize = elementData.reduce((sum, data) => sum + data.size, 0);
          results.summary.averageTargetSize = Math.round(totalSize / elementData.length);
        }

        // Generate issues
        if (results.summary.smallTargets > 0) {
          results.issues.push({
            type: 'small_targets',
            severity: 'high',
            message: `Found ${results.summary.smallTargets} interactive elements smaller than ${MIN_SIZE}x${MIN_SIZE}px`,
            wcagCriterion: '2.5.5',
            elements: results.targets.small.slice(0, 5) // Limit to first 5
          });
        }

        if (results.summary.overlappingTargets > 0) {
          results.issues.push({
            type: 'overlapping_targets',
            severity: 'high',
            message: `Found ${results.summary.overlappingTargets} overlapping interactive elements`,
            wcagCriterion: '2.5.5',
            elements: results.targets.overlapping.slice(0, 5)
          });
        }

        if (results.summary.closelySpacedTargets > 0) {
          results.issues.push({
            type: 'closely_spaced_targets',
            severity: 'medium',
            message: `Found ${results.summary.closelySpacedTargets} interactive elements spaced less than ${MIN_SPACING}px apart`,
            wcagCriterion: '2.5.5',
            elements: results.targets.closelySpaced.slice(0, 5)
          });
        }

        // Check for icon buttons without labels
        const unlabeledIcons = results.targets.small.filter(t => t.isIconButton && !t.hasAriaLabel);
        if (unlabeledIcons.length > 0) {
          results.issues.push({
            type: 'small_icon_buttons',
            severity: 'high',
            message: `Found ${unlabeledIcons.length} small icon buttons without accessible labels`,
            wcagCriterion: '2.5.5',
            elements: unlabeledIcons.slice(0, 5)
          });
        }

        return results;
      }, this.MIN_TARGET_SIZE, this.MIN_TARGET_SPACING);

      // Calculate score (after page evaluation)
      touchTargetData.summary.score = this.calculateScore(touchTargetData);
      
      // Add analyzer metadata
      touchTargetData.analyzerId = 'TouchTargetAnalyzer';
      touchTargetData.timestamp = new Date().toISOString();

      logger.info('Touch target analysis completed', {
        analysisId,
        totalElements: touchTargetData.summary.totalInteractiveElements,
        smallTargets: touchTargetData.summary.smallTargets,
        score: touchTargetData.summary.score
      });

      return touchTargetData;

    } catch (error) {
      logger.error('Touch target analysis failed:', { error: error.message, analysisId });
      return {
        summary: {
          testFailed: true,
          error: error.message,
          totalInteractiveElements: 0,
          smallTargets: 0,
          score: 0
        },
        targets: { small: [], overlapping: [], closelySpaced: [], adequate: [] },
        issues: []
      };
    }
  }

  calculateScore(analysisData) {
    if (!analysisData || analysisData.summary?.testFailed) return 50;

    let score = 100;
    const { summary } = analysisData;

    // No interactive elements = perfect score (nothing to fail)
    if (summary.totalInteractiveElements === 0) return 100;

    // Calculate percentage of small targets
    const smallTargetPercentage = (summary.smallTargets / summary.elementsAnalyzed) * 100;
    
    // Heavy penalty for small targets (up to 60 points)
    score -= Math.min(smallTargetPercentage * 2, 60);

    // Penalty for overlapping targets (up to 20 points)
    if (summary.overlappingTargets > 0) {
      score -= Math.min(summary.overlappingTargets * 10, 20);
    }

    // Penalty for closely spaced targets (up to 10 points)
    if (summary.closelySpacedTargets > 0) {
      score -= Math.min(summary.closelySpacedTargets * 2, 10);
    }

    // Bonus for good average size
    if (summary.averageTargetSize >= 48) {
      score += 5;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  generateRecommendations(analysisData, language = 'en') {
    const recommendations = [];

    if (!analysisData || analysisData.summary?.testFailed) {
      return recommendations;
    }

    const { summary, targets, issues } = analysisData;

    // Small targets recommendation
    if (summary.smallTargets > 0) {
      recommendations.push({
        type: 'touch-target',
        priority: 'high',
        issue: 'Touch targets too small',
        description: `${summary.smallTargets} interactive elements are smaller than the minimum 44x44px requirement`,
        suggestion: 'Increase the size of buttons, links, and form controls to at least 44x44 pixels for better touch accessibility',
        wcagCriterion: '2.5.5',
        affectedElements: targets.small.slice(0, 3).map(t => t.identifier)
      });

      // Specific recommendation for icon buttons
      const smallIconButtons = targets.small.filter(t => t.isIconButton);
      if (smallIconButtons.length > 0) {
        recommendations.push({
          type: 'touch-target',
          priority: 'high',
          issue: 'Small icon buttons',
          description: `${smallIconButtons.length} icon buttons are too small for reliable touch interaction`,
          suggestion: 'Consider using larger icons, adding padding, or providing text labels alongside icons',
          wcagCriterion: '2.5.5',
          affectedElements: smallIconButtons.slice(0, 3).map(t => t.identifier)
        });
      }
    }

    // Overlapping targets recommendation
    if (summary.overlappingTargets > 0) {
      recommendations.push({
        type: 'touch-target',
        priority: 'high',
        issue: 'Overlapping interactive elements',
        description: 'Some interactive elements overlap, making it difficult to accurately select the intended target',
        suggestion: 'Ensure interactive elements do not overlap and have clear boundaries',
        wcagCriterion: '2.5.5',
        affectedElements: targets.overlapping.slice(0, 3).map(t => `${t.element1} and ${t.element2}`)
      });
    }

    // Closely spaced targets recommendation
    if (summary.closelySpacedTargets > 0) {
      recommendations.push({
        type: 'touch-target',
        priority: 'medium',
        issue: 'Insufficient spacing between targets',
        description: `${summary.closelySpacedTargets} pairs of interactive elements are too close together`,
        suggestion: 'Add at least 8px spacing between adjacent interactive elements to prevent accidental activation',
        wcagCriterion: '2.5.5',
        affectedElements: targets.closelySpaced.slice(0, 3).map(t => `${t.element1} and ${t.element2}`)
      });
    }

    // Mobile-specific recommendations
    if (summary.smallTargets > summary.totalInteractiveElements * 0.3) {
      recommendations.push({
        type: 'touch-target',
        priority: 'high',
        issue: 'Poor mobile accessibility',
        description: 'More than 30% of interactive elements are too small for comfortable mobile use',
        suggestion: 'Consider implementing a mobile-first design approach with larger touch targets',
        wcagCriterion: '2.5.5'
      });
    }

    // Positive feedback
    if (summary.smallTargets === 0 && summary.overlappingTargets === 0) {
      recommendations.push({
        type: 'touch-target',
        priority: 'info',
        issue: 'Excellent touch accessibility',
        description: 'All interactive elements meet or exceed the minimum touch target size requirements',
        suggestion: 'Continue following touch-friendly design practices',
        wcagCriterion: '2.5.5'
      });
    }

    return recommendations;
  }
}

module.exports = TouchTargetAnalyzer;