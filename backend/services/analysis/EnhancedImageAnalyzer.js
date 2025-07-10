/**
 * Enhanced Image Analyzer Module
 * 
 * Comprehensive WCAG 2.1 image accessibility analysis including:
 * - Decorative vs informative image detection
 * - Complex image description requirements
 * - Image text detection and alternatives
 * - SVG accessibility analysis
 * - Image map accessibility
 * - Responsive image accessibility
 */

const logger = require('../../utils/logger');

class EnhancedImageAnalyzer {
  constructor() {
    // Image classification patterns
    this.DECORATIVE_PATTERNS = {
      contextual: [
        '.icon', '.logo', '.decoration', '.bg-image', '.hero-bg',
        '.pattern', '.border', '.divider', '.ornament'
      ],
      attributes: [
        'aria-hidden="true"', 'role="presentation"', 'role="img"'
      ],
      sizing: {
        maxWidth: 32,
        maxHeight: 32,
        minAspectRatio: 0.5,
        maxAspectRatio: 2.0
      }
    };

    // Complex image indicators
    this.COMPLEX_IMAGE_INDICATORS = {
      types: ['chart', 'graph', 'diagram', 'infographic', 'map', 'plot'],
      minDimensions: { width: 200, height: 150 },
      aspectRatios: [16/9, 4/3, 3/2], // Common chart ratios
      contexts: ['data', 'statistics', 'analysis', 'comparison']
    };

    // Alt text quality patterns - use strings for serialization
    this.ALT_TEXT_PATTERNS = {
      meaningless: [
        '^\\.+$', '^\\.\\.\\.$', '^image$', '^photo$', '^picture$', '^img$', 
        '^graphic$', '^logo$', '^icon$', '^\\d+$', '^untitled',
        '^dsc_?\\d+', '^img_?\\d+', '^screenshot', '^[a-z0-9_-]{1,3}$',
        '^(jpeg|jpg|png|gif|svg|webp)$', '\\.(jpg|jpeg|png|gif|svg|webp|bmp)$',
        '^\\s*$' // Empty or whitespace only
      ],
      tooShort: 3,
      tooLong: 250,
      // Optional indicators of good alt text (English examples only)
      // Not required - alt text in other languages is also valid
      goodIndicators: [
        'shows?', 'displays?', 'illustrates?', 'depicts?',
        'contains?', 'represents?', 'chart', 'graph'
      ]
    };
  }

  /**
   * Analyze images across the page for accessibility
   * @param {Object} page - Puppeteer page instance
   * @param {string} analysisId - Analysis ID for logging
   * @returns {Object} Comprehensive image accessibility analysis
   */
  async analyze(page, analysisId) {
    try {
      logger.info('Starting enhanced image analysis', { analysisId });

      // Get all images and their context
      const imageAnalysis = await this.analyzeAllImages(page);
      
      // Analyze SVG accessibility
      const svgAnalysis = await this.analyzeSVGAccessibility(page);
      
      // Check image maps
      const imageMapAnalysis = await this.analyzeImageMaps(page);
      
      // Analyze responsive images
      const responsiveAnalysis = await this.analyzeResponsiveImages(page);
      
      // Check for images of text
      const textImageAnalysis = await this.analyzeImagesOfText(page);

      const analysis = {
        analysisId,
        timestamp: new Date().toISOString(),
        images: imageAnalysis,
        svg: svgAnalysis,
        imageMaps: imageMapAnalysis,
        responsive: responsiveAnalysis,
        textImages: textImageAnalysis,
        summary: this.generateSummary({
          imageAnalysis,
          svgAnalysis,
          imageMapAnalysis,
          responsiveAnalysis,
          textImageAnalysis
        })
      };

      logger.info('Enhanced image analysis completed', {
        analysisId,
        totalImages: analysis.summary.totalImages,
        issues: analysis.summary.totalIssues,
        score: analysis.summary.score
      });

      return analysis;
    } catch (error) {
      logger.error('Enhanced image analysis failed', { error: error.message, analysisId });
      return this.getEmptyAnalysis(analysisId);
    }
  }

  /**
   * Analyze all images on the page
   * @param {Object} page - Puppeteer page instance
   * @returns {Object} Image analysis results
   */
  async analyzeAllImages(page) {
    return await page.evaluate((patterns) => {
      const analysis = {
        totalImages: 0,
        informativeImages: [],
        decorativeImages: [],
        problematicImages: [],
        missingAlt: [],
        meaninglessAlt: [],
        complexImages: [],
        goodAltText: []
      };

      const images = document.querySelectorAll('img');
      
      images.forEach((img, index) => {
        const imageData = {
          index,
          src: img.src,
          alt: img.alt || '',
          hasAlt: img.hasAttribute('alt'),
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
          displayWidth: img.offsetWidth,
          displayHeight: img.offsetHeight,
          isVisible: img.offsetWidth > 0 && img.offsetHeight > 0,
          className: img.className,
          parentContext: img.parentElement?.tagName || '',
          ariaHidden: img.getAttribute('aria-hidden') === 'true',
          role: img.getAttribute('role'),
          title: img.title || '',
          longDesc: img.getAttribute('longdesc') || '',
          loading: img.loading
        };

        // Determine if image is decorative
        imageData.isDecorative = isDecorativeImage(imageData, patterns);
        
        // Determine if image is complex
        imageData.isComplex = isComplexImage(imageData, patterns);
        
        // Analyze alt text quality
        imageData.altTextQuality = analyzeAltTextQuality(imageData.alt, patterns);
        
        // Check context clues
        imageData.contextClues = getImageContextClues(img);

        analysis.totalImages++;

        // Categorize images
        if (!imageData.hasAlt && !imageData.ariaHidden) {
          analysis.missingAlt.push(imageData);
        } else if (imageData.isDecorative) {
          if (imageData.alt !== '' && !imageData.ariaHidden) {
            analysis.problematicImages.push({
              ...imageData,
              issue: 'decorative_with_alt',
              suggestion: 'Use alt="" or aria-hidden="true" for decorative images'
            });
          } else {
            analysis.decorativeImages.push(imageData);
          }
        } else {
          // Informative image
          if (!imageData.hasAlt || (!imageData.alt && !imageData.title)) {
            analysis.missingAlt.push(imageData);
          } else if (imageData.altTextQuality.isMeaningless) {
            analysis.meaninglessAlt.push(imageData);
          } else if (imageData.altTextQuality.isGood) {
            analysis.goodAltText.push(imageData);
          }
          // If alt text exists but isn't explicitly meaningless or good,
          // we accept it as valid (could be descriptive in another language)
          
          if (imageData.isComplex && !imageData.longDesc) {
            analysis.complexImages.push({
              ...imageData,
              needsLongDescription: true,
              suggestion: 'Complex images need detailed descriptions via longdesc or adjacent text'
            });
          }
          
          analysis.informativeImages.push(imageData);
        }
      });

      return analysis;

      // Helper functions (embedded in evaluate context)
      function isDecorativeImage(imageData, patterns) {
        // Check explicit decorative markers
        if (imageData.ariaHidden || imageData.role === 'presentation') {
          return true;
        }
        
        // Check size (very small images are likely decorative)
        if (imageData.width <= patterns.decorative.sizing.maxWidth && 
            imageData.height <= patterns.decorative.sizing.maxHeight) {
          return true;
        }
        
        // Check class names for decorative indicators
        const className = imageData.className.toLowerCase();
        for (const pattern of patterns.decorative.contextual) {
          if (className.includes(pattern.replace('.', ''))) {
            return true;
          }
        }
        
        // Check if parent has decorative context
        const parentClass = imageData.parentContext.toLowerCase();
        if (['header', 'footer', 'nav'].includes(parentClass) && 
            imageData.width <= 100 && imageData.height <= 100) {
          return true;
        }
        
        return false;
      }
      
      function isComplexImage(imageData, patterns) {
        // Check dimensions
        if (imageData.width >= patterns.complex.minDimensions.width && 
            imageData.height >= patterns.complex.minDimensions.height) {
          
          // Check aspect ratio (charts often have specific ratios)
          const aspectRatio = imageData.width / imageData.height;
          if (patterns.complex.aspectRatios.some(ratio => 
              Math.abs(aspectRatio - ratio) < 0.2)) {
            return true;
          }
        }
        
        // Check filename for complex image indicators
        const src = imageData.src.toLowerCase();
        for (const type of patterns.complex.types) {
          if (src.includes(type)) {
            return true;
          }
        }
        
        // Check alt text for complex indicators
        const altText = imageData.alt.toLowerCase();
        for (const context of patterns.complex.contexts) {
          if (altText.includes(context)) {
            return true;
          }
        }
        
        return false;
      }
      
      function analyzeAltTextQuality(altText, patterns) {
        if (!altText) {
          return { isMeaningless: false, isGood: false, isEmpty: true };
        }
        
        const trimmed = altText.trim();
        const trimmedLower = trimmed.toLowerCase();
        
        // Check for meaningless patterns (patterns are strings, not regex)
        const isMeaningless = patterns.altText.meaningless.some(pattern => {
          const regex = new RegExp(pattern, 'i');
          return regex.test(trimmed);
        }) || trimmed.length < patterns.altText.tooShort;
        
        // Check for good indicators (English-specific, optional)
        // Alt text can be good without these indicators (e.g., in other languages)
        const isGood = patterns.altText.goodIndicators.some(pattern => {
          const regex = new RegExp(pattern, 'i');
          return regex.test(trimmed);
        }) && trimmed.length >= 10 && trimmed.length <= patterns.altText.tooLong;
        
        return {
          isMeaningless,
          isGood,
          isEmpty: false,
          length: trimmed.length,
          tooLong: trimmed.length > patterns.altText.tooLong
        };
      }
      
      function getImageContextClues(img) {
        const clues = {
          inLink: !!img.closest('a'),
          inButton: !!img.closest('button'),
          inFigure: !!img.closest('figure'),
          hasCaption: !!img.closest('figure')?.querySelector('figcaption'),
          inHeader: !!img.closest('header'),
          inNav: !!img.closest('nav'),
          inMain: !!img.closest('main'),
          nearbyText: ''
        };
        
        // Get nearby text for context
        const parent = img.parentElement;
        if (parent) {
          clues.nearbyText = parent.textContent?.trim().substring(0, 100) || '';
        }
        
        return clues;
      }
    }, {
      decorative: this.DECORATIVE_PATTERNS,
      complex: this.COMPLEX_IMAGE_INDICATORS,
      altText: this.ALT_TEXT_PATTERNS
    });
  }

  /**
   * Analyze SVG accessibility
   * @param {Object} page - Puppeteer page instance
   * @returns {Object} SVG analysis results
   */
  async analyzeSVGAccessibility(page) {
    return await page.evaluate(() => {
      const analysis = {
        totalSVGs: 0,
        decorativeSVGs: [],
        informativeSVGs: [],
        problematicSVGs: []
      };

      const svgs = document.querySelectorAll('svg');
      
      svgs.forEach((svg, index) => {
        const svgData = {
          index,
          hasTitle: !!svg.querySelector('title'),
          hasDesc: !!svg.querySelector('desc'),
          hasAriaLabel: !!svg.getAttribute('aria-label'),
          hasAriaLabelledby: !!svg.getAttribute('aria-labelledby'),
          hasAriaDescribedby: !!svg.getAttribute('aria-describedby'),
          ariaHidden: svg.getAttribute('aria-hidden') === 'true',
          role: svg.getAttribute('role'),
          focusable: svg.getAttribute('focusable') !== 'false',
          width: svg.getAttribute('width') || svg.getBoundingClientRect().width,
          height: svg.getAttribute('height') || svg.getBoundingClientRect().height,
          hasInteractiveElements: !!svg.querySelector('a, button, [onclick], [tabindex]'),
          className: svg.className.baseVal || ''
        };

        analysis.totalSVGs++;

        // Determine if decorative
        if (svgData.ariaHidden || svgData.role === 'presentation') {
          analysis.decorativeSVGs.push(svgData);
        } else {
          // Informative SVG
          analysis.informativeSVGs.push(svgData);
          
          // Check for accessibility issues
          if (!svgData.hasTitle && !svgData.hasAriaLabel && !svgData.hasAriaLabelledby) {
            analysis.problematicSVGs.push({
              ...svgData,
              issue: 'missing_accessible_name',
              suggestion: 'Add <title>, aria-label, or aria-labelledby to provide accessible name'
            });
          }
          
          if (svgData.hasInteractiveElements && svgData.focusable) {
            analysis.problematicSVGs.push({
              ...svgData,
              issue: 'interactive_svg_focus',
              suggestion: 'Ensure interactive SVG elements have proper focus management'
            });
          }
        }
      });

      return analysis;
    });
  }

  /**
   * Analyze image maps accessibility
   * @param {Object} page - Puppeteer page instance
   * @returns {Object} Image map analysis results
   */
  async analyzeImageMaps(page) {
    return await page.evaluate(() => {
      const analysis = {
        totalImageMaps: 0,
        imageMaps: []
      };

      const maps = document.querySelectorAll('map');
      
      maps.forEach((map, index) => {
        const areas = map.querySelectorAll('area');
        const mapData = {
          index,
          name: map.getAttribute('name'),
          totalAreas: areas.length,
          areasWithAlt: 0,
          areasWithoutAlt: 0,
          areas: []
        };

        areas.forEach((area, areaIndex) => {
          const areaData = {
            index: areaIndex,
            alt: area.getAttribute('alt'),
            href: area.getAttribute('href'),
            shape: area.getAttribute('shape'),
            coords: area.getAttribute('coords'),
            hasAlt: area.hasAttribute('alt')
          };

          if (areaData.hasAlt) {
            mapData.areasWithAlt++;
          } else {
            mapData.areasWithoutAlt++;
          }

          mapData.areas.push(areaData);
        });

        analysis.totalImageMaps++;
        analysis.imageMaps.push(mapData);
      });

      return analysis;
    });
  }

  /**
   * Analyze responsive images accessibility
   * @param {Object} page - Puppeteer page instance
   * @returns {Object} Responsive image analysis results
   */
  async analyzeResponsiveImages(page) {
    return await page.evaluate(() => {
      const analysis = {
        totalResponsiveImages: 0,
        pictureElements: [],
        srcsetImages: [],
        issues: []
      };

      // Analyze <picture> elements
      const pictures = document.querySelectorAll('picture');
      pictures.forEach((picture, index) => {
        const img = picture.querySelector('img');
        const sources = picture.querySelectorAll('source');
        
        const pictureData = {
          index,
          hasImg: !!img,
          imgAlt: img?.getAttribute('alt') || '',
          totalSources: sources.length,
          sourcesWithMedia: 0
        };

        sources.forEach(source => {
          if (source.getAttribute('media')) {
            pictureData.sourcesWithMedia++;
          }
        });

        if (!pictureData.hasImg) {
          analysis.issues.push({
            type: 'picture_missing_img',
            element: pictureData,
            message: 'Picture element missing fallback img element'
          });
        }

        analysis.pictureElements.push(pictureData);
        analysis.totalResponsiveImages++;
      });

      // Analyze images with srcset
      const srcsetImages = document.querySelectorAll('img[srcset]');
      srcsetImages.forEach((img, index) => {
        const imageData = {
          index,
          srcset: img.getAttribute('srcset'),
          sizes: img.getAttribute('sizes'),
          alt: img.getAttribute('alt'),
          hasSizes: !!img.getAttribute('sizes'),
          srcsetEntries: img.getAttribute('srcset')?.split(',').length || 0
        };

        if (imageData.srcsetEntries > 1 && !imageData.hasSizes) {
          analysis.issues.push({
            type: 'srcset_missing_sizes',
            element: imageData,
            message: 'Images with multiple srcset entries should include sizes attribute'
          });
        }

        analysis.srcsetImages.push(imageData);
        analysis.totalResponsiveImages++;
      });

      return analysis;
    });
  }

  /**
   * Analyze images of text
   * @param {Object} page - Puppeteer page instance
   * @returns {Object} Text image analysis results
   */
  async analyzeImagesOfText(page) {
    return await page.evaluate(() => {
      const analysis = {
        suspectedTextImages: [],
        totalSuspected: 0
      };

      const images = document.querySelectorAll('img');
      
      images.forEach((img, index) => {
        const src = img.src.toLowerCase();
        const alt = (img.alt || '').toLowerCase();
        const className = img.className.toLowerCase();
        
        // Heuristics for detecting images of text
        const textIndicators = [
          src.includes('text'),
          src.includes('heading'),
          src.includes('title'),
          src.includes('button'),
          src.includes('label'),
          alt.length > 20 && /^[a-z\s]+$/i.test(alt), // Long alphabetic alt text
          className.includes('text'),
          className.includes('heading'),
          className.includes('button')
        ];

        const suspicionScore = textIndicators.filter(Boolean).length;
        
        if (suspicionScore >= 2) {
          analysis.suspectedTextImages.push({
            index,
            src: img.src,
            alt: img.alt,
            suspicionScore,
            width: img.offsetWidth,
            height: img.offsetHeight,
            suggestion: 'Consider using real text with CSS styling instead of images of text'
          });
        }
      });

      analysis.totalSuspected = analysis.suspectedTextImages.length;
      return analysis;
    });
  }

  /**
   * Calculate image accessibility score
   * @param {Object} analysisData - Complete analysis data
   * @returns {number} Score from 0-100
   */
  calculateScore(analysisData) {
    if (!analysisData || analysisData.summary?.testFailed) return 50;

    let score = 100;
    const { summary } = analysisData;

    // Missing alt text penalties (highest priority)
    score -= Math.min(summary.missingAltCount * 15, 40);

    // Meaningless alt text penalties
    score -= Math.min(summary.meaninglessAltCount * 10, 30);

    // Complex images without descriptions
    score -= Math.min(summary.complexImagesWithoutDesc * 12, 25);

    // SVG accessibility issues
    score -= Math.min(summary.svgIssues * 8, 20);

    // Decorative images with alt text (should be empty)
    score -= Math.min(summary.decorativeWithAlt * 5, 15);

    // Image map issues
    score -= Math.min(summary.imageMapIssues * 10, 15);

    // Suspected text images
    score -= Math.min(summary.suspectedTextImages * 6, 15);

    return Math.max(score, 0);
  }

  /**
   * Generate recommendations for image accessibility improvements
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
        title: 'Image Analysis Incomplete',
        description: 'Unable to complete image accessibility analysis. Manual review recommended.'
      }];
    }

    const { summary } = analysisData;

    // Missing alt text (highest priority)
    if (summary.missingAltCount > 0) {
      recommendations.push({
        type: 'missing_alt_text',
        priority: 'high',
        title: 'Images Missing Alt Text',
        description: `${summary.missingAltCount} images are missing alt text. Add descriptive alt attributes to all informative images.`,
        impact: 'Screen reader users cannot understand the content or purpose of these images.'
      });
    }

    // Meaningless alt text
    if (summary.meaninglessAltCount > 0) {
      recommendations.push({
        type: 'meaningless_alt_text',
        priority: 'high',
        title: 'Images with Meaningless Alt Text',
        description: `${summary.meaninglessAltCount} images have meaningless alt text (like "image", "photo", or filenames). Provide descriptive alternatives.`,
        impact: 'Poor alt text provides no useful information to screen reader users.'
      });
    }

    // Complex images without descriptions
    if (summary.complexImagesWithoutDesc > 0) {
      recommendations.push({
        type: 'complex_images_no_desc',
        priority: 'high',
        title: 'Complex Images Need Detailed Descriptions',
        description: `${summary.complexImagesWithoutDesc} complex images (charts, graphs, diagrams) lack detailed descriptions. Add longdesc attributes or adjacent explanatory text.`,
        impact: 'Users cannot access the detailed information conveyed by complex visual content.'
      });
    }

    // SVG accessibility
    if (summary.svgIssues > 0) {
      recommendations.push({
        type: 'svg_accessibility',
        priority: 'medium',
        title: 'SVG Accessibility Issues',
        description: `${summary.svgIssues} SVG elements lack proper accessibility features. Add <title>, aria-label, or aria-labelledby attributes.`,
        impact: 'SVG content may not be accessible to assistive technologies.'
      });
    }

    // Decorative images with alt text
    if (summary.decorativeWithAlt > 0) {
      recommendations.push({
        type: 'decorative_with_alt',
        priority: 'medium',
        title: 'Decorative Images with Alt Text',
        description: `${summary.decorativeWithAlt} decorative images have unnecessary alt text. Use alt="" or aria-hidden="true" for purely decorative images.`,
        impact: 'Screen readers announce unnecessary decorative content, creating noise for users.'
      });
    }

    // Image maps
    if (summary.imageMapIssues > 0) {
      recommendations.push({
        type: 'image_map_issues',
        priority: 'medium',
        title: 'Image Map Accessibility Issues',
        description: `${summary.imageMapIssues} image map areas are missing alt text. Each clickable area must have descriptive alt text.`,
        impact: 'Users cannot understand the purpose of interactive image map regions.'
      });
    }

    // Text images
    if (summary.suspectedTextImages > 0) {
      recommendations.push({
        type: 'text_images',
        priority: 'low',
        title: 'Suspected Images of Text',
        description: `${summary.suspectedTextImages} images appear to contain text. Consider using real text with CSS styling instead.`,
        impact: 'Images of text cannot be resized, translated, or customized by users with visual needs.'
      });
    }

    return recommendations.slice(0, 10); // Limit recommendations
  }

  /**
   * Generate summary of image accessibility analysis
   * @param {Object} analysisData - All analysis data
   * @returns {Object} Summary object
   */
  generateSummary(analysisData) {
    const {
      imageAnalysis,
      svgAnalysis,
      imageMapAnalysis,
      responsiveAnalysis,
      textImageAnalysis
    } = analysisData;

    const summary = {
      totalImages: imageAnalysis.totalImages || 0,
      missingAltCount: imageAnalysis.missingAlt?.length || 0,
      meaninglessAltCount: imageAnalysis.meaninglessAlt?.length || 0,
      decorativeWithAlt: imageAnalysis.problematicImages?.filter(img => 
        img.issue === 'decorative_with_alt').length || 0,
      complexImagesWithoutDesc: imageAnalysis.complexImages?.length || 0,
      totalSVGs: svgAnalysis.totalSVGs || 0,
      svgIssues: svgAnalysis.problematicSVGs?.length || 0,
      imageMapIssues: imageMapAnalysis.imageMaps?.reduce((total, map) => 
        total + map.areasWithoutAlt, 0) || 0,
      suspectedTextImages: textImageAnalysis.totalSuspected || 0,
      goodAltTextCount: imageAnalysis.goodAltText?.length || 0
    };

    summary.totalIssues = summary.missingAltCount + summary.meaninglessAltCount + 
                         summary.decorativeWithAlt + summary.complexImagesWithoutDesc +
                         summary.svgIssues + summary.imageMapIssues + 
                         summary.suspectedTextImages;

    summary.score = this.calculateScore({ summary });
    
    // Additional metrics
    summary.complianceRate = summary.totalImages > 0 ? 
      Math.round(((summary.totalImages - summary.totalIssues) / summary.totalImages) * 100) : 100;

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
      images: { totalImages: 0 },
      svg: { totalSVGs: 0 },
      imageMaps: { totalImageMaps: 0 },
      responsive: { totalResponsiveImages: 0 },
      textImages: { totalSuspected: 0 },
      summary: {
        totalImages: 0,
        totalIssues: 0,
        score: 50,
        testFailed: true
      }
    };
  }
}

module.exports = EnhancedImageAnalyzer;