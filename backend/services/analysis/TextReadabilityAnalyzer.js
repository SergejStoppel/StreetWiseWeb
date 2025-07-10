/**
 * Text Readability Analyzer Module
 * 
 * Comprehensive WCAG 2.1 text readability analysis including:
 * - Text sizing and zoom behavior (200% zoom test)
 * - Font size requirements and relative units
 * - Line height and text spacing compliance
 * - Typography accessibility standards
 * - Responsive text behavior
 */

const logger = require('../../utils/logger');

class TextReadabilityAnalyzer {
  constructor() {
    // WCAG 2.1 text readability requirements
    this.READABILITY_STANDARDS = {
      minFontSize: 12, // pixels - minimum recommended
      minLineHeight: 1.5, // multiplier of font size
      minParagraphSpacing: 1.5, // em units
      maxZoomLevel: 200, // percentage
      preferredUnits: ['em', 'rem', '%', 'vw', 'vh'], // relative units
      avoidedUnits: ['px'], // fixed units (context-dependent)
      maxLineLength: 80 // characters for optimal readability
    };

    // Font categories for analysis
    this.FONT_CATEGORIES = {
      serif: ['serif', 'times', 'georgia', 'book antiqua'],
      sansSerif: ['sans-serif', 'arial', 'helvetica', 'verdana', 'calibri'],
      monospace: ['monospace', 'courier', 'consolas'],
      decorative: ['script', 'fantasy', 'brush script', 'comic sans']
    };
  }

  /**
   * Analyze text readability across the page
   * @param {Object} page - Puppeteer page instance
   * @param {string} analysisId - Analysis ID for logging
   * @returns {Object} Comprehensive text readability analysis
   */
  async analyze(page, analysisId) {
    try {
      logger.info('Starting text readability analysis', { analysisId });

      // Get baseline text metrics
      const baselineMetrics = await this.getBaselineTextMetrics(page);
      
      // Test zoom behavior
      const zoomBehavior = await this.testZoomBehavior(page, analysisId);
      
      // Analyze typography choices
      const typographyAnalysis = await this.analyzeTypography(page);
      
      // Check text spacing and layout
      const spacingAnalysis = await this.analyzeTextSpacing(page);
      
      // Test responsive text behavior
      const responsiveAnalysis = await this.testResponsiveText(page);

      const analysis = {
        analysisId,
        timestamp: new Date().toISOString(),
        baselineMetrics,
        zoomBehavior,
        typography: typographyAnalysis,
        spacing: spacingAnalysis,
        responsive: responsiveAnalysis,
        summary: this.generateSummary({
          baselineMetrics,
          zoomBehavior,
          typographyAnalysis,
          spacingAnalysis,
          responsiveAnalysis
        })
      };

      logger.info('Text readability analysis completed', {
        analysisId,
        issues: analysis.summary.totalIssues,
        score: analysis.summary.score
      });

      return analysis;
    } catch (error) {
      logger.error('Text readability analysis failed', { error: error.message, analysisId });
      return this.getEmptyAnalysis(analysisId);
    }
  }

  /**
   * Get baseline text metrics from the page
   * @param {Object} page - Puppeteer page instance
   * @returns {Object} Baseline text metrics
   */
  async getBaselineTextMetrics(page) {
    return await page.evaluate(() => {
      const metrics = {
        totalTextElements: 0,
        fontSizes: [],
        lineHeights: [],
        fontFamilies: [],
        textElements: []
      };

      // Find all text-containing elements
      const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, a, li, td, th, label, button');
      
      textElements.forEach((element) => {
        const text = element.textContent?.trim();
        if (!text || text.length === 0) return;

        const computedStyle = window.getComputedStyle(element);
        const fontSize = parseFloat(computedStyle.fontSize);
        const lineHeight = computedStyle.lineHeight;
        const fontFamily = computedStyle.fontFamily;
        
        // Calculate line height ratio
        let lineHeightRatio = 1.2; // default
        if (lineHeight !== 'normal') {
          const lineHeightPx = parseFloat(lineHeight);
          if (lineHeightPx && fontSize) {
            lineHeightRatio = lineHeightPx / fontSize;
          }
        }

        const elementData = {
          tagName: element.tagName.toLowerCase(),
          fontSize: fontSize,
          lineHeight: lineHeightRatio,
          fontFamily: fontFamily.toLowerCase(),
          textLength: text.length,
          hasFixedSize: computedStyle.fontSize.includes('px'),
          hasRelativeSize: computedStyle.fontSize.includes('em') || 
                          computedStyle.fontSize.includes('rem') ||
                          computedStyle.fontSize.includes('%'),
          textAlign: computedStyle.textAlign,
          element: element
        };

        metrics.textElements.push(elementData);
        metrics.fontSizes.push(fontSize);
        metrics.lineHeights.push(lineHeightRatio);
        metrics.fontFamilies.push(fontFamily.toLowerCase());
        metrics.totalTextElements++;
      });

      return metrics;
    });
  }

  /**
   * Test zoom behavior up to 200%
   * @param {Object} page - Puppeteer page instance
   * @param {string} analysisId - Analysis ID for logging
   * @returns {Object} Zoom behavior analysis
   */
  async testZoomBehavior(page, analysisId) {
    try {
      // Get original viewport and page dimensions
      const originalViewport = page.viewport();
      const originalMetrics = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        documentHeight: document.documentElement.scrollHeight,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth
      }));

      // Test at 200% zoom (simulate by adjusting viewport size, avoid changing deviceScaleFactor)
      await page.setViewport({
        width: Math.round(originalViewport.width / 2),
        height: Math.round(originalViewport.height / 2),
        deviceScaleFactor: originalViewport.deviceScaleFactor || 1
      });

      // Wait for layout to stabilize
      await page.waitForTimeout(1000);

      const zoomedMetrics = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        documentHeight: document.documentElement.scrollHeight,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth,
        textReadability: Array.from(document.querySelectorAll('p, h1, h2, h3, h4, h5, h6')).map(el => {
          const style = window.getComputedStyle(el);
          return {
            fontSize: parseFloat(style.fontSize),
            isVisible: el.offsetWidth > 0 && el.offsetHeight > 0,
            isClipped: el.scrollWidth > el.clientWidth
          };
        })
      }));

      // Restore original viewport
      await page.setViewport(originalViewport);

      return {
        originalMetrics,
        zoomedMetrics,
        zoomCompliance: {
          hasHorizontalScrollAt200: zoomedMetrics.hasHorizontalScroll,
          textRemainsReadable: zoomedMetrics.textReadability.every(t => t.isVisible && !t.isClipped),
          layoutBreaks: zoomedMetrics.hasHorizontalScroll || 
                       zoomedMetrics.textReadability.some(t => t.isClipped)
        }
      };
    } catch (error) {
      logger.warn('Zoom behavior test failed', { error: error.message, analysisId });
      return {
        zoomCompliance: {
          hasHorizontalScrollAt200: false,
          textRemainsReadable: true,
          layoutBreaks: false
        },
        testFailed: true
      };
    }
  }

  /**
   * Analyze typography choices for accessibility
   * @param {Object} page - Puppeteer page instance
   * @returns {Object} Typography analysis
   */
  async analyzeTypography(page) {
    return await page.evaluate((fontCategories) => {
      const analysis = {
        fontUsage: {},
        decorativeFontsInBody: [],
        smallFontSizes: [],
        largeLineLength: [],
        justifiedText: [],
        poorContrast: []
      };

      // Analyze font families
      const allElements = document.querySelectorAll('*');
      const fontFamilies = new Set();
      
      allElements.forEach(element => {
        const style = window.getComputedStyle(element);
        const fontFamily = style.fontFamily.toLowerCase();
        fontFamilies.add(fontFamily);
        
        // Check for decorative fonts in body text
        if (['p', 'div', 'span', 'article', 'section'].includes(element.tagName.toLowerCase())) {
          const text = element.textContent?.trim();
          if (text && text.length > 50) { // Substantial body text
            for (const decorativeFont of fontCategories.decorative) {
              if (fontFamily.includes(decorativeFont)) {
                analysis.decorativeFontsInBody.push({
                  element: element.tagName,
                  fontFamily: fontFamily,
                  textLength: text.length
                });
                break;
              }
            }
          }
        }

        // Check font sizes
        const fontSize = parseFloat(style.fontSize);
        if (fontSize && fontSize < 12 && element.textContent?.trim()) {
          analysis.smallFontSizes.push({
            element: element.tagName,
            fontSize: fontSize,
            text: element.textContent.substring(0, 100)
          });
        }

        // Check for justified text
        if (style.textAlign === 'justify' && element.textContent?.trim().length > 100) {
          analysis.justifiedText.push({
            element: element.tagName,
            textLength: element.textContent.trim().length
          });
        }

        // Check line length for readability
        if (['p', 'div'].includes(element.tagName.toLowerCase())) {
          const text = element.textContent?.trim();
          if (text && text.length > 80) {
            const averageCharWidth = 8; // approximate
            const elementWidth = element.offsetWidth;
            const estimatedCharsPerLine = elementWidth / averageCharWidth;
            
            if (estimatedCharsPerLine > 80) {
              analysis.largeLineLength.push({
                element: element.tagName,
                estimatedCharsPerLine: Math.round(estimatedCharsPerLine),
                textLength: text.length
              });
            }
          }
        }
      });

      // Categorize fonts
      fontFamilies.forEach(family => {
        for (const [category, fonts] of Object.entries(fontCategories)) {
          if (fonts.some(font => family.includes(font))) {
            analysis.fontUsage[category] = (analysis.fontUsage[category] || 0) + 1;
            break;
          }
        }
      });

      return analysis;
    }, this.FONT_CATEGORIES);
  }

  /**
   * Analyze text spacing and layout
   * @param {Object} page - Puppeteer page instance
   * @returns {Object} Text spacing analysis
   */
  async analyzeTextSpacing(page) {
    return await page.evaluate(() => {
      const analysis = {
        lineHeightIssues: [],
        paragraphSpacingIssues: [],
        letterSpacingIssues: [],
        wordSpacingIssues: []
      };

      // Check paragraphs for spacing issues
      const paragraphs = document.querySelectorAll('p');
      paragraphs.forEach((p, index) => {
        const style = window.getComputedStyle(p);
        const fontSize = parseFloat(style.fontSize);
        const lineHeight = style.lineHeight;
        
        // Check line height
        if (lineHeight !== 'normal') {
          const lineHeightPx = parseFloat(lineHeight);
          const lineHeightRatio = lineHeightPx / fontSize;
          
          if (lineHeightRatio < 1.5) {
            analysis.lineHeightIssues.push({
              index,
              fontSize,
              lineHeight: lineHeightRatio,
              recommended: 1.5
            });
          }
        }

        // Check paragraph spacing
        const marginTop = parseFloat(style.marginTop);
        const marginBottom = parseFloat(style.marginBottom);
        const totalMargin = marginTop + marginBottom;
        const recommendedSpacing = fontSize * 1.5;
        
        if (totalMargin < recommendedSpacing) {
          analysis.paragraphSpacingIssues.push({
            index,
            currentSpacing: totalMargin,
            recommendedSpacing,
            fontSize
          });
        }

        // Check letter and word spacing if modified
        const letterSpacing = style.letterSpacing;
        const wordSpacing = style.wordSpacing;
        
        if (letterSpacing !== 'normal' && parseFloat(letterSpacing) < 0) {
          analysis.letterSpacingIssues.push({
            index,
            letterSpacing: parseFloat(letterSpacing)
          });
        }
        
        if (wordSpacing !== 'normal' && parseFloat(wordSpacing) < 0) {
          analysis.wordSpacingIssues.push({
            index,
            wordSpacing: parseFloat(wordSpacing)
          });
        }
      });

      return analysis;
    });
  }

  /**
   * Test responsive text behavior
   * @param {Object} page - Puppeteer page instance
   * @returns {Object} Responsive text analysis
   */
  async testResponsiveText(page) {
    try {
      const originalViewport = page.viewport();
      const responsiveSizes = [320, 768, 1024, 1200]; // Mobile, tablet, small desktop, large desktop
      const results = [];

      for (const width of responsiveSizes) {
        await page.setViewport({
          width,
          height: originalViewport.height,
          deviceScaleFactor: originalViewport.deviceScaleFactor
        });

        await page.waitForTimeout(500); // Let layout settle

        const metrics = await page.evaluate(() => {
          const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
          return Array.from(textElements).map(el => {
            const style = window.getComputedStyle(el);
            return {
              fontSize: parseFloat(style.fontSize),
              isVisible: el.offsetWidth > 0 && el.offsetHeight > 0,
              width: el.offsetWidth,
              overflow: el.scrollWidth > el.clientWidth
            };
          });
        });

        results.push({
          viewportWidth: width,
          textMetrics: metrics,
          hasOverflow: metrics.some(m => m.overflow),
          averageFontSize: metrics.reduce((sum, m) => sum + m.fontSize, 0) / metrics.length
        });
      }

      // Restore original viewport
      await page.setViewport(originalViewport);

      return {
        responsiveBreakpoints: results,
        hasResponsiveIssues: results.some(r => r.hasOverflow),
        fontSizeConsistency: this.checkFontSizeConsistency(results)
      };
    } catch (error) {
      return {
        responsiveBreakpoints: [],
        hasResponsiveIssues: false,
        fontSizeConsistency: true,
        testFailed: true
      };
    }
  }

  /**
   * Check font size consistency across breakpoints
   * @param {Array} results - Responsive test results
   * @returns {boolean} Whether font sizes are consistent
   */
  checkFontSizeConsistency(results) {
    if (results.length < 2) return true;

    const baseFontSize = results[0].averageFontSize;
    return results.every(result => {
      const difference = Math.abs(result.averageFontSize - baseFontSize);
      return difference < 2; // Allow 2px variance
    });
  }

  /**
   * Calculate readability score
   * @param {Object} analysisData - Complete analysis data
   * @returns {number} Score from 0-100
   */
  calculateScore(analysisData) {
    if (!analysisData || analysisData.summary?.testFailed) return 50;

    let score = 100;
    const { summary } = analysisData;

    // Zoom behavior penalties
    if (summary.zoomIssues > 0) {
      score -= Math.min(summary.zoomIssues * 15, 30);
    }

    // Typography penalties
    score -= Math.min(summary.decorativeFontIssues * 10, 20);
    score -= Math.min(summary.smallFontIssues * 5, 15);
    score -= Math.min(summary.justifiedTextIssues * 3, 10);

    // Spacing penalties
    score -= Math.min(summary.lineHeightIssues * 5, 20);
    score -= Math.min(summary.spacingIssues * 3, 15);

    // Responsive penalties
    if (summary.responsiveIssues > 0) {
      score -= Math.min(summary.responsiveIssues * 8, 20);
    }

    return Math.max(score, 0);
  }

  /**
   * Generate recommendations for text readability improvements
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
        title: 'Text Readability Analysis Incomplete',
        description: 'Unable to complete text readability analysis. Manual review recommended.'
      }];
    }

    const { summary } = analysisData;

    // Zoom behavior recommendations
    if (summary.zoomIssues > 0) {
      recommendations.push({
        type: 'zoom_behavior',
        priority: 'high',
        title: 'Text Not Readable at 200% Zoom',
        description: `${summary.zoomIssues} text elements become unreadable or cause layout issues at 200% zoom. Use relative units (em, rem, %) instead of fixed pixels.`,
        impact: 'Users who need magnification cannot access content effectively.'
      });
    }

    // Typography recommendations
    if (summary.decorativeFontIssues > 0) {
      recommendations.push({
        type: 'decorative_fonts',
        priority: 'high',
        title: 'Decorative Fonts in Body Text',
        description: `${summary.decorativeFontIssues} instances of decorative fonts found in body text. Use simple, readable fonts for substantial content.`,
        impact: 'Decorative fonts can be difficult to read for users with dyslexia or visual processing disorders.'
      });
    }

    if (summary.smallFontIssues > 0) {
      recommendations.push({
        type: 'small_fonts',
        priority: 'medium',
        title: 'Text Too Small',
        description: `${summary.smallFontIssues} text elements have font sizes below 12px. Increase font sizes for better readability.`,
        impact: 'Small text is difficult to read for users with visual impairments.'
      });
    }

    // Spacing recommendations
    if (summary.lineHeightIssues > 0) {
      recommendations.push({
        type: 'line_height',
        priority: 'medium',
        title: 'Insufficient Line Height',
        description: `${summary.lineHeightIssues} text elements have line height below 1.5x font size. Increase line-height for better readability.`,
        impact: 'Tight line spacing makes text difficult to read for users with dyslexia or cognitive disabilities.'
      });
    }

    if (summary.spacingIssues > 0) {
      recommendations.push({
        type: 'text_spacing',
        priority: 'medium',
        title: 'Poor Text Spacing',
        description: `${summary.spacingIssues} spacing issues found. Ensure adequate paragraph spacing and avoid negative letter/word spacing.`,
        impact: 'Poor spacing affects reading comprehension and visual processing.'
      });
    }

    // Responsive recommendations
    if (summary.responsiveIssues > 0) {
      recommendations.push({
        type: 'responsive_text',
        priority: 'medium',
        title: 'Text Not Fully Responsive',
        description: `Text overflow or inconsistencies detected across ${summary.responsiveIssues} screen sizes. Ensure text adapts properly to all viewport sizes.`,
        impact: 'Text that doesn\'t adapt to different screen sizes creates accessibility barriers on mobile devices.'
      });
    }

    return recommendations.slice(0, 10); // Limit recommendations
  }

  /**
   * Generate summary of text readability analysis
   * @param {Object} analysisData - All analysis data
   * @returns {Object} Summary object
   */
  generateSummary(analysisData) {
    const {
      baselineMetrics,
      zoomBehavior,
      typographyAnalysis,
      spacingAnalysis,
      responsiveAnalysis
    } = analysisData;

    const summary = {
      totalTextElements: (baselineMetrics && baselineMetrics.totalTextElements) || 0,
      zoomIssues: (zoomBehavior && zoomBehavior.zoomCompliance && zoomBehavior.zoomCompliance.layoutBreaks) ? 1 : 0,
      decorativeFontIssues: (typographyAnalysis && typographyAnalysis.decorativeFontsInBody && typographyAnalysis.decorativeFontsInBody.length) || 0,
      smallFontIssues: (typographyAnalysis && typographyAnalysis.smallFontSizes && typographyAnalysis.smallFontSizes.length) || 0,
      justifiedTextIssues: (typographyAnalysis && typographyAnalysis.justifiedText && typographyAnalysis.justifiedText.length) || 0,
      lineHeightIssues: (spacingAnalysis && spacingAnalysis.lineHeightIssues && spacingAnalysis.lineHeightIssues.length) || 0,
      spacingIssues: ((spacingAnalysis && spacingAnalysis.paragraphSpacingIssues && spacingAnalysis.paragraphSpacingIssues.length) || 0) + 
                    ((spacingAnalysis && spacingAnalysis.letterSpacingIssues && spacingAnalysis.letterSpacingIssues.length) || 0) + 
                    ((spacingAnalysis && spacingAnalysis.wordSpacingIssues && spacingAnalysis.wordSpacingIssues.length) || 0),
      responsiveIssues: (responsiveAnalysis && responsiveAnalysis.hasResponsiveIssues) ? 1 : 0
    };

    summary.totalIssues = summary.zoomIssues + summary.decorativeFontIssues + 
                         summary.smallFontIssues + summary.justifiedTextIssues +
                         summary.lineHeightIssues + summary.spacingIssues + 
                         summary.responsiveIssues;

    summary.score = this.calculateScore({ summary });

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
      baselineMetrics: { totalTextElements: 0 },
      zoomBehavior: { zoomCompliance: { layoutBreaks: false } },
      typography: {},
      spacing: {},
      responsive: {},
      summary: {
        totalTextElements: 0,
        totalIssues: 0,
        score: 50,
        testFailed: true
      }
    };
  }
}

module.exports = TextReadabilityAnalyzer;