/**
 * AI-Powered Content Analysis Service
 * Provides semantic analysis and content quality insights for SEO
 */

export interface ContentAnalysisResult {
  readabilityScore: number;
  contentRelevance: number;
  keywordRelevance: number;
  semanticSuggestions: string[];
  contentGaps: string[];
  userIntentMatch: 'informational' | 'transactional' | 'navigational' | 'unknown';
}

export interface PageContentData {
  title: string;
  metaDescription: string;
  headings: string[];
  bodyText: string;
  url: string;
}

export class AiContentAnalysisService {
  
  /**
   * Analyze content quality and provide SEO insights
   */
  async analyzeContent(pageData: PageContentData): Promise<ContentAnalysisResult> {
    try {
      const result: ContentAnalysisResult = {
        readabilityScore: await this.calculateReadabilityScore(pageData.bodyText),
        contentRelevance: await this.analyzeContentRelevance(pageData),
        keywordRelevance: await this.analyzeKeywordRelevance(pageData),
        semanticSuggestions: await this.generateSemanticSuggestions(pageData),
        contentGaps: await this.identifyContentGaps(pageData),
        userIntentMatch: await this.detectUserIntent(pageData)
      };

      return result;
    } catch (error) {
      console.error('AI Content Analysis failed:', error);
      // Return safe defaults if AI analysis fails
      return this.getDefaultAnalysis();
    }
  }

  /**
   * Calculate readability score using simple algorithms
   * (Can be enhanced with AI models later)
   */
  private async calculateReadabilityScore(text: string): Promise<number> {
    // Simple Flesch Reading Ease approximation
    const sentences = text.split(/[.!?]+/).length;
    const words = text.split(/\s+/).length;
    const syllables = this.countSyllables(text);
    
    if (sentences === 0 || words === 0) return 0;
    
    const avgWordsPerSentence = words / sentences;
    const avgSyllablesPerWord = syllables / words;
    
    const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    
    // Convert to 0-100 scale where higher is better
    return Math.max(0, Math.min(100, Math.round(fleschScore)));
  }

  /**
   * Analyze how well content matches title and meta description
   */
  private async analyzeContentRelevance(pageData: PageContentData): Promise<number> {
    const { title, metaDescription, bodyText, headings } = pageData;
    
    // Extract key terms from title and meta description
    const titleWords = this.extractKeyTerms(title);
    const metaWords = this.extractKeyTerms(metaDescription);
    const contentWords = this.extractKeyTerms(bodyText);
    const headingWords = this.extractKeyTerms(headings.join(' '));
    
    // Calculate relevance based on term overlap
    const titleRelevance = this.calculateTermOverlap(titleWords, contentWords);
    const metaRelevance = this.calculateTermOverlap(metaWords, contentWords);
    const headingRelevance = this.calculateTermOverlap(titleWords, headingWords);
    
    // Weighted average
    const relevance = (titleRelevance * 0.4) + (metaRelevance * 0.3) + (headingRelevance * 0.3);
    
    return Math.round(relevance * 100);
  }

  /**
   * Analyze keyword usage and density
   */
  private async analyzeKeywordRelevance(pageData: PageContentData): Promise<number> {
    const { title, bodyText } = pageData;
    
    // Extract primary keywords from title (first 3 meaningful words)
    const primaryKeywords = this.extractKeyTerms(title).slice(0, 3);
    
    if (primaryKeywords.length === 0) return 0;
    
    let relevanceScore = 0;
    const contentLower = bodyText.toLowerCase();
    const totalWords = bodyText.split(/\s+/).length;
    
    primaryKeywords.forEach(keyword => {
      const keywordRegex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'g');
      const matches = contentLower.match(keywordRegex) || [];
      const density = (matches.length / totalWords) * 100;
      
      // Optimal density is 1-2%
      if (density >= 1 && density <= 2) {
        relevanceScore += 100;
      } else if (density >= 0.5 && density <= 3) {
        relevanceScore += 70;
      } else if (density > 0) {
        relevanceScore += 40;
      }
    });
    
    return Math.round(relevanceScore / primaryKeywords.length);
  }

  /**
   * Generate semantic keyword suggestions
   */
  private async generateSemanticSuggestions(pageData: PageContentData): Promise<string[]> {
    const suggestions: string[] = [];
    
    // Simple semantic expansion based on content analysis
    const mainTerms = this.extractKeyTerms(pageData.title);
    
    // Add common semantic variations (this would be enhanced with AI)
    mainTerms.forEach(term => {
      if (term.toLowerCase().includes('guide')) {
        suggestions.push('tutorial', 'how-to', 'step-by-step');
      }
      if (term.toLowerCase().includes('best')) {
        suggestions.push('top', 'recommended', 'quality');
      }
      if (term.toLowerCase().includes('review')) {
        suggestions.push('comparison', 'analysis', 'evaluation');
      }
    });
    
    return Array.from(new Set(suggestions)).slice(0, 5);
  }

  /**
   * Identify potential content gaps
   */
  private async identifyContentGaps(pageData: PageContentData): Promise<string[]> {
    const gaps: string[] = [];
    
    // Check for common missing elements
    if (!pageData.bodyText.toLowerCase().includes('benefit')) {
      gaps.push('Consider adding benefits or value propositions');
    }
    
    if (!pageData.bodyText.toLowerCase().includes('how') && !pageData.bodyText.toLowerCase().includes('step')) {
      gaps.push('Consider adding how-to or step-by-step information');
    }
    
    if (pageData.bodyText.length < 300) {
      gaps.push('Content length is below recommended minimum for SEO authority');
    }
    
    if (pageData.headings.length < 2) {
      gaps.push('Consider adding more headings to improve content structure');
    }
    
    return gaps.slice(0, 3);
  }

  /**
   * Detect user intent from content
   */
  private async detectUserIntent(pageData: PageContentData): Promise<'informational' | 'transactional' | 'navigational' | 'unknown'> {
    const content = `${pageData.title} ${pageData.metaDescription} ${pageData.bodyText}`.toLowerCase();
    
    // Transactional intent keywords
    if (content.match(/buy|purchase|order|cart|checkout|price|cost|sale|deal/)) {
      return 'transactional';
    }
    
    // Navigational intent keywords
    if (content.match(/login|contact|about|home|dashboard|account/)) {
      return 'navigational';
    }
    
    // Informational intent keywords
    if (content.match(/what|how|why|guide|tutorial|learn|information|tips|help/)) {
      return 'informational';
    }
    
    return 'unknown';
  }

  /**
   * Helper: Extract meaningful terms from text
   */
  private extractKeyTerms(text: string): string[] {
    if (!text) return [];
    
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should']);
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 10); // Limit to top 10 terms
  }

  /**
   * Helper: Calculate overlap between two sets of terms
   */
  private calculateTermOverlap(terms1: string[], terms2: string[]): number {
    if (terms1.length === 0 || terms2.length === 0) return 0;
    
    const set2 = new Set(terms2);
    const overlap = terms1.filter(term => set2.has(term)).length;
    
    return overlap / terms1.length;
  }

  /**
   * Helper: Count syllables in text (approximate)
   */
  private countSyllables(text: string): number {
    return text
      .toLowerCase()
      .replace(/[^a-z]/g, '')
      .replace(/[aeiou]{2,}/g, 'a') // Replace multiple vowels with single
      .match(/[aeiou]/g)?.length || 1;
  }

  /**
   * Helper: Return default analysis if AI fails
   */
  private getDefaultAnalysis(): ContentAnalysisResult {
    return {
      readabilityScore: 50,
      contentRelevance: 50,
      keywordRelevance: 50,
      semanticSuggestions: [],
      contentGaps: [],
      userIntentMatch: 'unknown'
    };
  }
}

export default AiContentAnalysisService;