const logger = require('../../utils/logger');
const AnalysisUtils = require('../utils/AnalysisUtils');

/**
 * ContentStructureAnalyzer - Analyzes content structure for readability and accessibility
 * 
 * Validates content organization, white space usage, and content chunk sizes
 * following WCAG 2.1 guidelines for content presentation and readability.
 */
class ContentStructureAnalyzer {
  constructor() {
    // Optimal content structure guidelines
    this.guidelines = {
      // Line length recommendations (characters)
      optimalLineLength: { min: 45, max: 75 },
      acceptableLineLength: { min: 25, max: 100 },
      
      // Paragraph guidelines
      optimalParagraphLength: { min: 3, max: 8 }, // sentences
      maxParagraphLength: 12, // sentences
      
      // White space requirements
      minLineHeight: 1.5,
      optimalLineHeight: { min: 1.5, max: 2.0 },
      
      // Content chunk guidelines
      maxContentChunkSize: 500, // words before break needed
      minWhiteSpaceBetweenSections: 16, // pixels
      
      // Heading structure
      maxHeadingNestingDepth: 6,
      minContentBetweenHeadings: 50 // characters
    };
  }

  async analyze(page, analysisId) {
    try {
      logger.info('Starting content structure analysis', { analysisId });

      const structureData = await page.evaluate((guidelines) => {
        const results = {
          summary: {
            totalParagraphs: 0,
            totalHeadings: 0,
            averageLineLength: 0,
            averageParagraphLength: 0,
            whiteSpaceScore: 0,
            contentChunkScore: 0,
            lineHeightScore: 0,
            overallScore: 100,
            testFailed: false
          },
          
          content: {
            paragraphs: [],
            headings: [],
            textBlocks: [],
            contentChunks: []
          },
          
          whiteSpace: {
            lineHeights: [],
            sectionSpacing: [],
            inadequateSpacing: []
          },
          
          issues: []
        };

        // Helper function to get text content and metrics
        function getTextMetrics(element) {
          const text = element.textContent?.trim() || '';
          const words = text.split(/\s+/).filter(w => w.length > 0);
          const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
          const lines = text.split('\n').filter(l => l.trim().length > 0);
          
          return {
            text: text.substring(0, 200), // Truncate for storage
            wordCount: words.length,
            sentenceCount: sentences.length,
            characterCount: text.length,
            lineCount: Math.max(lines.length, 1),
            averageLineLength: text.length / Math.max(lines.length, 1)
          };
        }

        // Helper function to get computed styles
        function getElementSpacing(element) {
          const style = window.getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          
          return {
            lineHeight: parseFloat(style.lineHeight) || 0,
            fontSize: parseFloat(style.fontSize) || 16,
            marginTop: parseFloat(style.marginTop) || 0,
            marginBottom: parseFloat(style.marginBottom) || 0,
            paddingTop: parseFloat(style.paddingTop) || 0,
            paddingBottom: parseFloat(style.paddingBottom) || 0,
            width: rect.width,
            height: rect.height
          };
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

        try {
          // Analyze paragraphs
          const paragraphs = Array.from(document.querySelectorAll('p, .paragraph, .content p, article p'))
            .filter(isElementVisible);
          
          results.summary.totalParagraphs = paragraphs.length;
          
          let totalLineLength = 0;
          let totalParagraphLength = 0;
          
          paragraphs.forEach(p => {
            const metrics = getTextMetrics(p);
            const spacing = getElementSpacing(p);
            
            if (metrics.wordCount > 0) {
              const paragraphInfo = {
                wordCount: metrics.wordCount,
                sentenceCount: metrics.sentenceCount,
                characterCount: metrics.characterCount,
                averageLineLength: metrics.averageLineLength,
                lineHeight: spacing.lineHeight / spacing.fontSize, // Relative line height
                marginBottom: spacing.marginBottom,
                hasAdequateSpacing: spacing.marginBottom >= guidelines.minWhiteSpaceBetweenSections / 2
              };
              
              results.content.paragraphs.push(paragraphInfo);
              totalLineLength += metrics.averageLineLength;
              totalParagraphLength += metrics.sentenceCount;
              
              // Check line height
              const relativeLineHeight = spacing.lineHeight / spacing.fontSize;
              if (relativeLineHeight > 0) {
                results.whiteSpace.lineHeights.push({
                  element: 'paragraph',
                  lineHeight: relativeLineHeight,
                  fontSize: spacing.fontSize,
                  isAdequate: relativeLineHeight >= guidelines.minLineHeight
                });
              }
              
              // Check for overly long paragraphs
              if (metrics.sentenceCount > guidelines.maxParagraphLength) {
                results.issues.push({
                  type: 'long_paragraph',
                  severity: 'medium',
                  message: `Paragraph with ${metrics.sentenceCount} sentences exceeds recommended length`,
                  wcagCriterion: '3.1.5',
                  recommendation: `Break into smaller paragraphs (max ${guidelines.maxParagraphLength} sentences)`
                });
              }
              
              // Check line length
              if (metrics.averageLineLength > guidelines.acceptableLineLength.max) {
                results.issues.push({
                  type: 'long_lines',
                  severity: 'medium',
                  message: `Average line length of ${Math.round(metrics.averageLineLength)} characters is too long`,
                  wcagCriterion: '1.4.8',
                  recommendation: `Keep line length between ${guidelines.optimalLineLength.min}-${guidelines.optimalLineLength.max} characters`
                });
              }
            }
          });
          
          // Calculate average metrics
          if (results.summary.totalParagraphs > 0) {
            results.summary.averageLineLength = totalLineLength / results.summary.totalParagraphs;
            results.summary.averageParagraphLength = totalParagraphLength / results.summary.totalParagraphs;
          }

          // Analyze headings structure
          const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
            .filter(isElementVisible);
          
          results.summary.totalHeadings = headings.length;
          
          let previousLevel = 0;
          headings.forEach((heading, index) => {
            const level = parseInt(heading.tagName.charAt(1));
            const metrics = getTextMetrics(heading);
            const spacing = getElementSpacing(heading);
            
            const headingInfo = {
              level: level,
              text: metrics.text,
              characterCount: metrics.characterCount,
              hasAdequateSpacing: spacing.marginTop >= guidelines.minWhiteSpaceBetweenSections,
              skipLevel: level > previousLevel + 1 && previousLevel > 0
            };
            
            results.content.headings.push(headingInfo);
            
            // Check for heading level skipping
            if (headingInfo.skipLevel) {
              results.issues.push({
                type: 'heading_level_skip',
                severity: 'medium',
                message: `Heading level jumps from h${previousLevel} to h${level}`,
                wcagCriterion: '1.3.1',
                recommendation: 'Use sequential heading levels (h1, h2, h3, etc.)'
              });
            }
            
            previousLevel = level;
          });

          // Analyze content chunks and white space
          const contentSections = Array.from(document.querySelectorAll('section, article, .content, .post, .entry, main'))
            .filter(isElementVisible);
          
          contentSections.forEach(section => {
            const metrics = getTextMetrics(section);
            const spacing = getElementSpacing(section);
            
            if (metrics.wordCount > 0) {
              const chunkInfo = {
                wordCount: metrics.wordCount,
                characterCount: metrics.characterCount,
                isLargeChunk: metrics.wordCount > guidelines.maxContentChunkSize,
                hasAdequateSpacing: spacing.marginBottom >= guidelines.minWhiteSpaceBetweenSections
              };
              
              results.content.contentChunks.push(chunkInfo);
              
              // Check for overly large content chunks
              if (chunkInfo.isLargeChunk) {
                results.issues.push({
                  type: 'large_content_chunk',
                  severity: 'low',
                  message: `Content section with ${metrics.wordCount} words is very long`,
                  wcagCriterion: '3.1.5',
                  recommendation: `Break large content into smaller sections (max ${guidelines.maxContentChunkSize} words)`
                });
              }
              
              // Track section spacing
              results.whiteSpace.sectionSpacing.push({
                wordCount: metrics.wordCount,
                spacing: spacing.marginBottom,
                isAdequate: chunkInfo.hasAdequateSpacing
              });
            }
          });

          // Check overall text blocks for readability
          const textBlocks = Array.from(document.querySelectorAll('div, span, li'))
            .filter(el => {
              const text = el.textContent?.trim() || '';
              return isElementVisible(el) && text.length > 50 && !el.querySelector('p, h1, h2, h3, h4, h5, h6');
            });
          
          textBlocks.forEach(block => {
            const metrics = getTextMetrics(block);
            const spacing = getElementSpacing(block);
            
            if (metrics.wordCount >= 10) {
              const blockInfo = {
                wordCount: metrics.wordCount,
                averageLineLength: metrics.averageLineLength,
                lineHeight: spacing.lineHeight / spacing.fontSize,
                isReadable: metrics.averageLineLength <= guidelines.acceptableLineLength.max &&
                           spacing.lineHeight / spacing.fontSize >= guidelines.minLineHeight
              };
              
              results.content.textBlocks.push(blockInfo);
              
              // Check for poor formatting in text blocks
              if (!blockInfo.isReadable) {
                if (metrics.averageLineLength > guidelines.acceptableLineLength.max) {
                  results.issues.push({
                    type: 'unformatted_text_block',
                    severity: 'medium',
                    message: 'Large text block without proper paragraph formatting',
                    wcagCriterion: '1.4.8',
                    recommendation: 'Break text into proper paragraphs with adequate spacing'
                  });
                }
              }
            }
          });

        } catch (error) {
          results.summary.testFailed = true;
          results.summary.error = error.message;
          logger.error('Content structure analysis failed in page evaluation:', error.message);
        }

        return results;
      }, this.guidelines);

      // Calculate scores (after page evaluation)
      structureData.summary.whiteSpaceScore = this.calculateWhiteSpaceScore(structureData);
      structureData.summary.contentChunkScore = this.calculateContentChunkScore(structureData);
      structureData.summary.lineHeightScore = this.calculateLineHeightScore(structureData);
      structureData.summary.overallScore = this.calculateScore(structureData);
      
      // Add analyzer metadata
      structureData.analyzerId = 'ContentStructureAnalyzer';
      structureData.timestamp = new Date().toISOString();

      logger.info('Content structure analysis completed', {
        analysisId,
        totalParagraphs: structureData.summary.totalParagraphs,
        totalHeadings: structureData.summary.totalHeadings,
        issues: structureData.issues.length,
        score: structureData.summary.overallScore
      });

      return structureData;

    } catch (error) {
      logger.error('Content structure analysis failed:', { error: error.message, analysisId });
      return {
        summary: {
          testFailed: true,
          error: error.message,
          totalParagraphs: 0,
          totalHeadings: 0,
          overallScore: 50
        },
        content: { paragraphs: [], headings: [], textBlocks: [], contentChunks: [] },
        whiteSpace: { lineHeights: [], sectionSpacing: [], inadequateSpacing: [] },
        issues: []
      };
    }
  }

  calculateWhiteSpaceScore(analysisData) {
    if (!analysisData || analysisData.summary?.testFailed) return 50;

    let score = 100;
    const { whiteSpace } = analysisData;

    // Check line heights
    const inadequateLineHeights = whiteSpace.lineHeights.filter(lh => !lh.isAdequate).length;
    const totalLineHeights = whiteSpace.lineHeights.length;
    
    if (totalLineHeights > 0) {
      const lineHeightRatio = inadequateLineHeights / totalLineHeights;
      score -= lineHeightRatio * 30; // Up to 30 points penalty
    }

    // Check section spacing
    const inadequateSpacing = whiteSpace.sectionSpacing.filter(s => !s.isAdequate).length;
    const totalSpacing = whiteSpace.sectionSpacing.length;
    
    if (totalSpacing > 0) {
      const spacingRatio = inadequateSpacing / totalSpacing;
      score -= spacingRatio * 25; // Up to 25 points penalty
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  calculateContentChunkScore(analysisData) {
    if (!analysisData || analysisData.summary?.testFailed) return 50;

    let score = 100;
    const { content, summary } = analysisData;

    // Check paragraph lengths
    const longParagraphs = content.paragraphs.filter(p => p.sentenceCount > this.guidelines.maxParagraphLength).length;
    if (content.paragraphs.length > 0) {
      const longParaRatio = longParagraphs / content.paragraphs.length;
      score -= longParaRatio * 25; // Up to 25 points penalty
    }

    // Check content chunk sizes
    const largeChunks = content.contentChunks.filter(c => c.isLargeChunk).length;
    if (content.contentChunks.length > 0) {
      const largeChunkRatio = largeChunks / content.contentChunks.length;
      score -= largeChunkRatio * 20; // Up to 20 points penalty
    }

    // Check average line length
    if (summary.averageLineLength > this.guidelines.acceptableLineLength.max) {
      score -= 15; // 15 points penalty for long lines
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  calculateLineHeightScore(analysisData) {
    if (!analysisData || analysisData.summary?.testFailed) return 50;

    let score = 100;
    const { whiteSpace } = analysisData;

    if (whiteSpace.lineHeights.length === 0) return 80; // Neutral score if no data

    const adequateLineHeights = whiteSpace.lineHeights.filter(lh => lh.isAdequate).length;
    const totalLineHeights = whiteSpace.lineHeights.length;
    
    const adequacyRatio = adequateLineHeights / totalLineHeights;
    score = adequacyRatio * 100;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  calculateScore(analysisData) {
    if (!analysisData || analysisData.summary?.testFailed) return 50;

    const whiteSpaceScore = this.calculateWhiteSpaceScore(analysisData);
    const contentChunkScore = this.calculateContentChunkScore(analysisData);
    const lineHeightScore = this.calculateLineHeightScore(analysisData);

    // Weighted average
    const overallScore = (
      whiteSpaceScore * 0.4 +
      contentChunkScore * 0.4 +
      lineHeightScore * 0.2
    );

    return Math.max(0, Math.min(100, Math.round(overallScore)));
  }

  generateRecommendations(analysisData, language = 'en') {
    const recommendations = [];

    if (!analysisData || analysisData.summary?.testFailed) {
      return recommendations;
    }

    const { summary, content, whiteSpace, issues } = analysisData;

    // White space recommendations
    const inadequateLineHeights = whiteSpace.lineHeights.filter(lh => !lh.isAdequate).length;
    if (inadequateLineHeights > 0) {
      recommendations.push({
        type: 'content-structure',
        priority: 'medium',
        issue: 'Inadequate line height for readability',
        description: `${inadequateLineHeights} elements have line height below 1.5`,
        suggestion: 'Set line-height to at least 1.5 for better readability (WCAG 1.4.8)',
        wcagCriterion: '1.4.8'
      });
    }

    // Content chunk recommendations
    const largeChunks = content.contentChunks.filter(c => c.isLargeChunk).length;
    if (largeChunks > 0) {
      recommendations.push({
        type: 'content-structure',
        priority: 'low',
        issue: 'Large content chunks affect readability',
        description: `${largeChunks} content sections exceed ${this.guidelines.maxContentChunkSize} words`,
        suggestion: 'Break large content into smaller, digestible sections with clear headings',
        wcagCriterion: '3.1.5'
      });
    }

    // Line length recommendations
    if (summary.averageLineLength > this.guidelines.acceptableLineLength.max) {
      recommendations.push({
        type: 'content-structure',
        priority: 'medium',
        issue: 'Line length exceeds readability guidelines',
        description: `Average line length of ${Math.round(summary.averageLineLength)} characters is too long`,
        suggestion: `Keep line length between ${this.guidelines.optimalLineLength.min}-${this.guidelines.optimalLineLength.max} characters`,
        wcagCriterion: '1.4.8'
      });
    }

    // Paragraph structure recommendations
    const longParagraphs = content.paragraphs.filter(p => p.sentenceCount > this.guidelines.maxParagraphLength).length;
    if (longParagraphs > 0) {
      recommendations.push({
        type: 'content-structure',
        priority: 'medium',
        issue: 'Long paragraphs reduce readability',
        description: `${longParagraphs} paragraphs exceed recommended length`,
        suggestion: `Break paragraphs into smaller chunks (max ${this.guidelines.maxParagraphLength} sentences)`,
        wcagCriterion: '3.1.5'
      });
    }

    // Section spacing recommendations
    const inadequateSpacing = whiteSpace.sectionSpacing.filter(s => !s.isAdequate).length;
    if (inadequateSpacing > 0) {
      recommendations.push({
        type: 'content-structure',
        priority: 'low',
        issue: 'Insufficient spacing between content sections',
        description: `${inadequateSpacing} sections lack adequate spacing`,
        suggestion: 'Add sufficient margin/padding between content sections for visual separation',
        wcagCriterion: '1.4.8'
      });
    }

    // Good structure recognition
    if (summary.overallScore >= 80) {
      recommendations.push({
        type: 'content-structure',
        priority: 'info',
        issue: 'Good content structure implementation',
        description: 'Content is well-structured with appropriate spacing and chunk sizes',
        suggestion: 'Continue following content accessibility best practices',
        wcagCriterion: '1.4.8, 3.1.5'
      });
    }

    return recommendations;
  }
}

module.exports = ContentStructureAnalyzer;