/**
 * Color Contrast Analyzer Module
 * 
 * Provides comprehensive WCAG 2.1 color contrast analysis including:
 * - AA and AAA compliance levels (4.5:1, 3:1, 7:1 ratios)
 * - Text size considerations (normal vs large text)
 * - Interactive element contrast requirements
 * - Integration with axe-core for consistent violation reporting
 */

const logger = require('../../utils/logger');

class ColorContrastAnalyzer {
  constructor() {
    // WCAG 2.1 contrast ratio requirements
    this.CONTRAST_REQUIREMENTS = {
      AA: {
        normalText: 4.5,    // 4.5:1 for normal text
        largeText: 3.0,     // 3:1 for large text (18pt+ or 14pt+ bold)
        uiComponents: 3.0   // 3:1 for UI components and graphical objects
      },
      AAA: {
        normalText: 7.0,    // 7:1 for normal text
        largeText: 4.5,     // 4.5:1 for large text
        uiComponents: 3.0   // Same as AA for UI components
      }
    };

    // Font size thresholds for large text (in pixels)
    this.LARGE_TEXT_THRESHOLDS = {
      regular: 24,  // 18pt = ~24px
      bold: 19      // 14pt = ~19px
    };
  }

  /**
   * Analyze color contrast violations using axe-core results
   * @param {Object} axeResults - Results from axe-core analysis
   * @param {Object} customColorData - Additional color samples from page evaluation
   * @param {string} analysisId - Analysis ID for logging
   * @returns {Object} Comprehensive color contrast analysis
   */
  analyzeColorContrast(axeResults, customColorData, analysisId) {
    try {
      logger.info('Starting color contrast analysis', { analysisId });

      // Extract axe-core color contrast violations
      const axeColorViolations = this.extractAxeColorViolations(axeResults);
      
      // Analyze custom color samples for additional insights
      const customAnalysis = this.analyzeCustomColorSamples(customColorData);
      
      // Combine and categorize findings
      const analysis = this.combineColorAnalysis(axeColorViolations, customAnalysis, analysisId);

      logger.info('Color contrast analysis completed', {
        analysisId,
        totalViolations: analysis.totalViolations,
        aaViolations: analysis.aaViolations,
        aaaViolations: analysis.aaaViolations
      });

      return analysis;
    } catch (error) {
      logger.error('Color contrast analysis failed', { error: error.message, analysisId });
      return this.getEmptyAnalysis();
    }
  }

  /**
   * Extract color contrast violations from axe-core results
   * @param {Object} axeResults - Axe-core analysis results
   * @returns {Object} Processed color contrast violations
   */
  extractAxeColorViolations(axeResults) {
    const colorViolations = axeResults.violations.filter(v => 
      v.id === 'color-contrast' || 
      v.id === 'color-contrast-enhanced'
    );

    const processedViolations = {
      colorContrast: [],
      colorContrastEnhanced: [],
      totalElements: 0
    };

    colorViolations.forEach(violation => {
      const processedNodes = violation.nodes.map(node => ({
        target: node.target,
        html: node.html.substring(0, 200), // Truncate for readability
        impact: violation.impact,
        message: node.failureSummary || violation.description,
        contrastRatio: this.extractContrastRatio(node.any || node.all),
        expectedRatio: this.getExpectedRatio(violation.id),
        wcagLevel: violation.id === 'color-contrast-enhanced' ? 'AAA' : 'AA'
      }));

      if (violation.id === 'color-contrast') {
        processedViolations.colorContrast = processedNodes;
      } else if (violation.id === 'color-contrast-enhanced') {
        processedViolations.colorContrastEnhanced = processedNodes;
      }

      processedViolations.totalElements += processedNodes.length;
    });

    return processedViolations;
  }

  /**
   * Extract contrast ratio from axe-core node data
   * @param {Array} checkData - Axe check data array
   * @returns {number|null} Contrast ratio or null if not found
   */
  extractContrastRatio(checkData) {
    if (!checkData || !Array.isArray(checkData)) return null;

    for (const check of checkData) {
      if (check.data && typeof check.data.contrastRatio === 'number') {
        return check.data.contrastRatio;
      }
    }
    return null;
  }

  /**
   * Get expected contrast ratio based on violation type
   * @param {string} violationId - Axe violation ID
   * @returns {number} Expected contrast ratio
   */
  getExpectedRatio(violationId) {
    switch (violationId) {
      case 'color-contrast':
        return 4.5; // AA standard for normal text
      case 'color-contrast-enhanced':
        return 7.0; // AAA standard for normal text
      default:
        return 4.5;
    }
  }

  /**
   * Analyze custom color samples for additional insights
   * @param {Array} colorSamples - Color samples from page evaluation
   * @returns {Object} Analysis of color samples
   */
  analyzeCustomColorSamples(colorSamples) {
    if (!colorSamples || !Array.isArray(colorSamples)) {
      return { 
        samplesAnalyzed: 0, 
        potentialIssues: [],
        colorCombinations: [] 
      };
    }

    const analysis = {
      samplesAnalyzed: colorSamples.length,
      potentialIssues: [],
      colorCombinations: [],
      statistics: {
        belowAA: 0,
        belowAAA: 0,
        compliant: 0
      }
    };

    colorSamples.forEach((sample, index) => {
      const contrastRatio = this.calculateContrastRatio(sample.color, sample.backgroundColor);
      const isLargeText = this.isLargeText(sample.fontSize, sample.fontWeight);
      
      const aaCompliant = this.checkAACompliance(contrastRatio, isLargeText);
      const aaaCompliant = this.checkAAACompliance(contrastRatio, isLargeText);

      const combination = {
        index,
        foreground: sample.color,
        background: sample.backgroundColor,
        contrastRatio: Math.round(contrastRatio * 100) / 100,
        fontSize: sample.fontSize,
        fontWeight: sample.fontWeight,
        isLargeText,
        aaCompliant,
        aaaCompliant,
        requiredAA: isLargeText ? this.CONTRAST_REQUIREMENTS.AA.largeText : this.CONTRAST_REQUIREMENTS.AA.normalText,
        requiredAAA: isLargeText ? this.CONTRAST_REQUIREMENTS.AAA.largeText : this.CONTRAST_REQUIREMENTS.AAA.normalText
      };

      analysis.colorCombinations.push(combination);

      // Update statistics
      if (!aaCompliant) {
        analysis.statistics.belowAA++;
        analysis.potentialIssues.push({
          type: 'aa_violation',
          contrastRatio,
          required: combination.requiredAA,
          sample: combination
        });
      } else if (!aaaCompliant) {
        analysis.statistics.belowAAA++;
      } else {
        analysis.statistics.compliant++;
      }
    });

    return analysis;
  }

  /**
   * Calculate contrast ratio between two colors
   * @param {string} foreground - Foreground color (CSS format)
   * @param {string} background - Background color (CSS format)
   * @returns {number} Contrast ratio
   */
  calculateContrastRatio(foreground, background) {
    try {
      const fgLuminance = this.getRelativeLuminance(foreground);
      const bgLuminance = this.getRelativeLuminance(background);
      
      const lighter = Math.max(fgLuminance, bgLuminance);
      const darker = Math.min(fgLuminance, bgLuminance);
      
      return (lighter + 0.05) / (darker + 0.05);
    } catch (error) {
      // If color parsing fails, return a low ratio to flag for review
      return 1.0;
    }
  }

  /**
   * Calculate relative luminance of a color
   * @param {string} color - Color in CSS format
   * @returns {number} Relative luminance (0-1)
   */
  getRelativeLuminance(color) {
    // Parse RGB values from CSS color
    const rgb = this.parseColor(color);
    if (!rgb) return 0;

    // Convert to relative luminance using WCAG formula
    const rsRGB = rgb.r / 255;
    const gsRGB = rgb.g / 255;
    const bsRGB = rgb.b / 255;

    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Parse CSS color string to RGB values
   * @param {string} color - CSS color string
   * @returns {Object|null} RGB values or null if parsing fails
   */
  parseColor(color) {
    // Handle rgb() and rgba() formats
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1]),
        g: parseInt(rgbMatch[2]),
        b: parseInt(rgbMatch[3])
      };
    }

    // Handle hex colors
    const hexMatch = color.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (hexMatch) {
      return {
        r: parseInt(hexMatch[1], 16),
        g: parseInt(hexMatch[2], 16),
        b: parseInt(hexMatch[3], 16)
      };
    }

    // Handle 3-digit hex
    const hex3Match = color.match(/^#([a-f\d])([a-f\d])([a-f\d])$/i);
    if (hex3Match) {
      return {
        r: parseInt(hex3Match[1] + hex3Match[1], 16),
        g: parseInt(hex3Match[2] + hex3Match[2], 16),
        b: parseInt(hex3Match[3] + hex3Match[3], 16)
      };
    }

    return null;
  }

  /**
   * Check if text qualifies as large text
   * @param {string} fontSize - Font size (CSS format)
   * @param {string} fontWeight - Font weight
   * @returns {boolean} True if large text
   */
  isLargeText(fontSize, fontWeight) {
    const sizeInPx = this.parseFontSize(fontSize);
    const isBold = this.isBoldFont(fontWeight);

    return sizeInPx >= this.LARGE_TEXT_THRESHOLDS.regular || 
           (isBold && sizeInPx >= this.LARGE_TEXT_THRESHOLDS.bold);
  }

  /**
   * Parse font size to pixels
   * @param {string} fontSize - CSS font size
   * @returns {number} Size in pixels
   */
  parseFontSize(fontSize) {
    if (!fontSize) return 16; // Default browser font size

    const pxMatch = fontSize.match(/(\d+(?:\.\d+)?)px/);
    if (pxMatch) return parseFloat(pxMatch[1]);

    const ptMatch = fontSize.match(/(\d+(?:\.\d+)?)pt/);
    if (ptMatch) return parseFloat(ptMatch[1]) * 1.33; // Convert pt to px

    const emMatch = fontSize.match(/(\d+(?:\.\d+)?)em/);
    if (emMatch) return parseFloat(emMatch[1]) * 16; // Assume 16px base

    return 16; // Default fallback
  }

  /**
   * Check if font weight qualifies as bold
   * @param {string} fontWeight - CSS font weight
   * @returns {boolean} True if bold
   */
  isBoldFont(fontWeight) {
    if (!fontWeight) return false;
    
    const numericWeight = parseInt(fontWeight);
    return numericWeight >= 700 || 
           fontWeight.toLowerCase().includes('bold') ||
           fontWeight.toLowerCase().includes('bolder');
  }

  /**
   * Check AA compliance for contrast ratio
   * @param {number} ratio - Contrast ratio
   * @param {boolean} isLargeText - Whether text is large
   * @returns {boolean} True if AA compliant
   */
  checkAACompliance(ratio, isLargeText) {
    const required = isLargeText ? 
      this.CONTRAST_REQUIREMENTS.AA.largeText : 
      this.CONTRAST_REQUIREMENTS.AA.normalText;
    return ratio >= required;
  }

  /**
   * Check AAA compliance for contrast ratio
   * @param {number} ratio - Contrast ratio
   * @param {boolean} isLargeText - Whether text is large
   * @returns {boolean} True if AAA compliant
   */
  checkAAACompliance(ratio, isLargeText) {
    const required = isLargeText ? 
      this.CONTRAST_REQUIREMENTS.AAA.largeText : 
      this.CONTRAST_REQUIREMENTS.AAA.normalText;
    return ratio >= required;
  }

  /**
   * Combine axe-core and custom analysis results
   * @param {Object} axeViolations - Axe-core color violations
   * @param {Object} customAnalysis - Custom color analysis
   * @param {string} analysisId - Analysis ID
   * @returns {Object} Combined analysis results
   */
  combineColorAnalysis(axeViolations, customAnalysis, analysisId) {
    return {
      analysisId,
      dataSource: 'axe-core-enhanced',
      totalViolations: axeViolations.totalElements,
      aaViolations: axeViolations.colorContrast.length,
      aaaViolations: axeViolations.colorContrastEnhanced.length,
      
      // Axe-core violations (primary source of truth)
      violations: {
        colorContrast: axeViolations.colorContrast,
        colorContrastEnhanced: axeViolations.colorContrastEnhanced
      },
      
      // Additional insights from custom analysis
      insights: {
        samplesAnalyzed: customAnalysis.samplesAnalyzed,
        statistics: customAnalysis.statistics,
        potentialIssues: customAnalysis.potentialIssues.slice(0, 10), // Limit for report size
        colorCombinations: customAnalysis.colorCombinations.slice(0, 20)
      },
      
      // Summary for reporting
      summary: {
        hasColorContrastIssues: axeViolations.totalElements > 0,
        aaComplianceLevel: this.calculateComplianceLevel(axeViolations.colorContrast.length, customAnalysis.samplesAnalyzed),
        aaaComplianceLevel: this.calculateComplianceLevel(axeViolations.colorContrastEnhanced.length, customAnalysis.samplesAnalyzed),
        recommendations: this.generateColorContrastRecommendations(axeViolations, customAnalysis)
      }
    };
  }

  /**
   * Calculate compliance level percentage
   * @param {number} violations - Number of violations
   * @param {number} totalSamples - Total samples analyzed
   * @returns {number} Compliance percentage
   */
  calculateComplianceLevel(violations, totalSamples) {
    if (totalSamples === 0) return 100;
    return Math.max(0, Math.round(((totalSamples - violations) / totalSamples) * 100));
  }

  /**
   * Generate specific recommendations for color contrast issues
   * @param {Object} axeViolations - Axe violations
   * @param {Object} customAnalysis - Custom analysis
   * @returns {Array} Array of recommendations
   */
  generateColorContrastRecommendations(axeViolations, customAnalysis) {
    const recommendations = [];

    if (axeViolations.colorContrast.length > 0) {
      recommendations.push({
        type: 'aa_compliance',
        priority: 'high',
        count: axeViolations.colorContrast.length,
        message: `${axeViolations.colorContrast.length} elements fail AA color contrast requirements (4.5:1 for normal text, 3:1 for large text)`
      });
    }

    if (axeViolations.colorContrastEnhanced.length > 0) {
      recommendations.push({
        type: 'aaa_compliance',
        priority: 'medium',
        count: axeViolations.colorContrastEnhanced.length,
        message: `${axeViolations.colorContrastEnhanced.length} elements fail AAA color contrast requirements (7:1 for normal text, 4.5:1 for large text)`
      });
    }

    if (customAnalysis.statistics.belowAA > 0) {
      recommendations.push({
        type: 'potential_issues',
        priority: 'medium',
        count: customAnalysis.statistics.belowAA,
        message: `${customAnalysis.statistics.belowAA} additional color combinations may not meet accessibility standards`
      });
    }

    return recommendations;
  }

  /**
   * Get empty analysis object for error cases
   * @returns {Object} Empty analysis structure
   */
  getEmptyAnalysis() {
    return {
      dataSource: 'axe-core-enhanced',
      totalViolations: 0,
      aaViolations: 0,
      aaaViolations: 0,
      violations: {
        colorContrast: [],
        colorContrastEnhanced: []
      },
      insights: {
        samplesAnalyzed: 0,
        statistics: { belowAA: 0, belowAAA: 0, compliant: 0 },
        potentialIssues: [],
        colorCombinations: []
      },
      summary: {
        hasColorContrastIssues: false,
        aaComplianceLevel: 100,
        aaaComplianceLevel: 100,
        recommendations: []
      }
    };
  }
}

module.exports = new ColorContrastAnalyzer();