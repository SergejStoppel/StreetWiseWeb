const logger = require('../../utils/logger');

class AnalysisUtils {
  
  /**
   * Check if an element is visible on the page
   */
  static isElementVisible(element, computedStyle) {
    if (!element || !computedStyle) return false;
    
    const rect = element.getBoundingClientRect();
    return computedStyle.display !== 'none' && 
           computedStyle.visibility !== 'hidden' && 
           computedStyle.opacity !== '0' &&
           rect.width > 0 && 
           rect.height > 0;
  }

  /**
   * Get element selector string for identification
   */
  static getElementSelector(element) {
    if (!element) return '';
    
    let selector = element.tagName.toLowerCase();
    
    if (element.id) {
      selector += '#' + element.id;
    } else if (element.className) {
      const classes = element.className.trim().split(/\s+/).slice(0, 3); // Limit to first 3 classes
      selector += '.' + classes.join('.');
    }
    
    return selector;
  }

  /**
   * Extract text content from element with length limit
   */
  static getElementText(element, maxLength = 50) {
    if (!element) return '';
    
    return element.textContent?.trim().substring(0, maxLength) || 
           element.value?.substring(0, maxLength) || 
           element.alt?.substring(0, maxLength) || 
           element.title?.substring(0, maxLength) || '';
  }

  /**
   * Check if element has accessible name
   */
  static hasAccessibleName(element) {
    if (!element) return false;
    
    // Check for various ways an element can have an accessible name
    return !!(
      element.getAttribute('aria-label') ||
      element.getAttribute('aria-labelledby') ||
      element.getAttribute('title') ||
      element.textContent?.trim() ||
      element.value ||
      element.alt ||
      (element.tagName.toLowerCase() === 'input' && element.getAttribute('placeholder'))
    );
  }

  /**
   * Get ARIA role of element (explicit or implicit)
   */
  static getElementRole(element) {
    if (!element) return null;
    
    // Explicit role
    const explicitRole = element.getAttribute('role');
    if (explicitRole) return explicitRole;
    
    // Implicit roles based on tag name
    const implicitRoles = {
      'button': 'button',
      'a': element.hasAttribute('href') ? 'link' : null,
      'input': this.getInputRole(element),
      'select': 'combobox',
      'textarea': 'textbox',
      'img': 'img',
      'nav': 'navigation',
      'main': 'main',
      'header': 'banner',
      'footer': 'contentinfo',
      'aside': 'complementary',
      'section': 'region',
      'article': 'article',
      'h1': 'heading',
      'h2': 'heading',
      'h3': 'heading',
      'h4': 'heading',
      'h5': 'heading',
      'h6': 'heading'
    };
    
    return implicitRoles[element.tagName.toLowerCase()] || null;
  }

  /**
   * Get implicit role for input elements based on type
   */
  static getInputRole(inputElement) {
    if (!inputElement || inputElement.tagName.toLowerCase() !== 'input') return null;
    
    const type = inputElement.type?.toLowerCase() || 'text';
    const inputRoles = {
      'button': 'button',
      'submit': 'button',
      'reset': 'button',
      'checkbox': 'checkbox',
      'radio': 'radio',
      'range': 'slider',
      'search': 'searchbox',
      'email': 'textbox',
      'tel': 'textbox',
      'url': 'textbox',
      'text': 'textbox',
      'password': 'textbox',
      'number': 'spinbutton'
    };
    
    return inputRoles[type] || 'textbox';
  }

  /**
   * Check if color is light (for contrast calculations)
   */
  static isLightColor(color) {
    if (!color) return false;
    
    // Parse RGB values from color string
    const rgb = color.match(/\d+/g);
    if (rgb && rgb.length >= 3) {
      const r = parseInt(rgb[0]);
      const g = parseInt(rgb[1]);
      const b = parseInt(rgb[2]);
      
      // Calculate relative luminance
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 125;
    }
    
    return false;
  }

  /**
   * Calculate basic contrast ratio (simplified)
   */
  static calculateContrast(color1, color2) {
    // This is a simplified contrast calculation
    // In a production system, you'd use proper WCAG contrast calculation
    try {
      const rgb1 = this.parseRGB(color1);
      const rgb2 = this.parseRGB(color2);
      
      if (!rgb1 || !rgb2) return 1;
      
      const l1 = this.getLuminance(rgb1);
      const l2 = this.getLuminance(rgb2);
      
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      
      return (lighter + 0.05) / (darker + 0.05);
    } catch (error) {
      logger.error('Contrast calculation failed:', error);
      return 1;
    }
  }

  /**
   * Parse RGB values from color string
   */
  static parseRGB(color) {
    if (!color) return null;
    
    const rgb = color.match(/\d+/g);
    if (rgb && rgb.length >= 3) {
      return {
        r: parseInt(rgb[0]),
        g: parseInt(rgb[1]),
        b: parseInt(rgb[2])
      };
    }
    
    return null;
  }

  /**
   * Calculate relative luminance
   */
  static getLuminance(rgb) {
    const { r, g, b } = rgb;
    
    const normalize = (val) => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    };
    
    return 0.2126 * normalize(r) + 0.7152 * normalize(g) + 0.0722 * normalize(b);
  }

  /**
   * Check if contrast meets WCAG standards
   */
  static meetsContrastStandard(contrast, level = 'AA', isLargeText = false) {
    if (level === 'AAA') {
      return isLargeText ? contrast >= 4.5 : contrast >= 7;
    }
    // AA level
    return isLargeText ? contrast >= 3 : contrast >= 4.5;
  }

  /**
   * Analyze heading hierarchy for logical order
   */
  static analyzeHeadingHierarchy(headings) {
    const violations = [];
    
    for (let i = 1; i < headings.length; i++) {
      const current = headings[i];
      const previous = headings[i - 1];
      
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
    
    return violations;
  }

  /**
   * Check if tab order is logical based on element positions
   */
  static isLogicalTabOrder(tabSequence) {
    if (tabSequence.length < 2) return true;
    
    for (let i = 1; i < tabSequence.length; i++) {
      const current = tabSequence[i];
      const previous = tabSequence[i - 1];
      
      // Skip if elements don't have valid positions
      if (!current.rect || !previous.rect) continue;
      
      // Allow for some flexibility in tab order (elements close vertically)
      const verticalTolerance = 50;
      const isNextRow = current.rect.top > previous.rect.top + verticalTolerance;
      const isSameRow = Math.abs(current.rect.top - previous.rect.top) <= verticalTolerance;
      
      // If moving to next row, that's generally acceptable
      if (isNextRow) continue;
      
      // If same row, should generally go left to right
      if (isSameRow && current.rect.left < previous.rect.left - 20) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Debounce function for performance
   */
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle function for performance
   */
  static throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

module.exports = AnalysisUtils;