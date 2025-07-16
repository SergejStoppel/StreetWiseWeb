/**
 * AI Insights Model
 * Handles AI-generated insights and recommendations
 */

export class AiRecommendation {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.title = data.title || '';
    this.description = data.description || '';
    this.priority = data.priority || 'medium'; // 'high', 'medium', 'low'
    this.category = data.category || 'other'; // 'accessibility', 'seo', 'performance', 'business'
    this.impact = data.impact || '';
    this.effort = data.effort || 'medium'; // 'low', 'medium', 'high'
    this.roiEstimate = data.roiEstimate || null;
    this.implementationSteps = data.implementationSteps || [];
    this.codeExample = data.codeExample || null;
    this.businessJustification = data.businessJustification || '';
    this.estimatedTimeToImplement = data.estimatedTimeToImplement || 0; // hours
  }

  generateId() {
    return `ai_rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get effort level as number (for sorting)
   */
  get effortLevel() {
    switch (this.effort) {
      case 'low': return 1;
      case 'medium': return 2;
      case 'high': return 3;
      default: return 2;
    }
  }

  /**
   * Get priority level as number (for sorting)
   */
  get priorityLevel() {
    switch (this.priority) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 2;
    }
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      priority: this.priority,
      category: this.category,
      impact: this.impact,
      effort: this.effort,
      roiEstimate: this.roiEstimate,
      implementationSteps: this.implementationSteps,
      codeExample: this.codeExample,
      businessJustification: this.businessJustification,
      estimatedTimeToImplement: this.estimatedTimeToImplement
    };
  }
}

export class AiInsights {
  constructor(data = {}) {
    // Executive summary
    this.executiveSummary = data.executiveSummary || '';
    
    // Website context detected by AI
    this.websiteContext = data.websiteContext || {
      type: 'unknown', // 'ecommerce', 'blog', 'saas', 'portfolio', 'corporate'
      industry: 'unknown',
      targetAudience: 'unknown',
      techStack: 'unknown',
      businessModel: 'unknown'
    };
    
    // AI-generated recommendations
    this.recommendations = (data.recommendations || []).map(rec => 
      rec instanceof AiRecommendation ? rec : new AiRecommendation(rec)
    );
    
    // Prioritized action items
    this.prioritizedActions = data.prioritizedActions || [];
    
    // Industry-specific insights
    this.industryInsights = data.industryInsights || {
      competitorComparison: '',
      industryStandards: '',
      specificRequirements: []
    };
    
    // Implementation roadmap
    this.implementationRoadmap = data.implementationRoadmap || {
      phase1: { title: '', items: [], duration: '' },
      phase2: { title: '', items: [], duration: '' },
      phase3: { title: '', items: [], duration: '' }
    };
    
    // Custom code fixes
    this.customCodeFixes = data.customCodeFixes || [];
    
    // Business impact analysis
    this.businessImpact = data.businessImpact || {
      userExperienceImpact: '',
      seoImpact: '',
      legalComplianceImpact: '',
      brandImpact: '',
      revenueImpact: ''
    };
    
    // Generation metadata
    this.generationTimestamp = data.generationTimestamp || new Date().toISOString();
    this.aiModel = data.aiModel || 'unknown';
    this.confidence = data.confidence || 0.8; // 0-1 scale
  }

  /**
   * Get recommendations grouped by category
   */
  get recommendationsByCategory() {
    const groups = {
      accessibility: [],
      seo: [],
      performance: [],
      business: [],
      other: []
    };

    this.recommendations.forEach(rec => {
      if (groups[rec.category]) {
        groups[rec.category].push(rec);
      }
    });

    return groups;
  }

  /**
   * Get recommendations grouped by priority
   */
  get recommendationsByPriority() {
    const groups = {
      high: [],
      medium: [],
      low: []
    };

    this.recommendations.forEach(rec => {
      if (groups[rec.priority]) {
        groups[rec.priority].push(rec);
      }
    });

    return groups;
  }

  /**
   * Get high priority recommendations
   */
  get highPriorityRecommendations() {
    return this.recommendations.filter(rec => rec.priority === 'high');
  }

  /**
   * Get quick wins (high impact, low effort)
   */
  get quickWins() {
    return this.recommendations.filter(rec => 
      rec.priority === 'high' && rec.effort === 'low'
    );
  }

  /**
   * Get total estimated implementation time
   */
  get totalImplementationTime() {
    return this.recommendations.reduce((total, rec) => {
      return total + (rec.estimatedTimeToImplement || 0);
    }, 0);
  }

  /**
   * Get recommendations sorted by priority and effort
   */
  get sortedRecommendations() {
    return [...this.recommendations].sort((a, b) => {
      // First sort by priority (high to low)
      if (a.priorityLevel !== b.priorityLevel) {
        return b.priorityLevel - a.priorityLevel;
      }
      // Then by effort (low to high)
      return a.effortLevel - b.effortLevel;
    });
  }

  /**
   * Check if insights are for a specific website type
   */
  isWebsiteType(type) {
    return this.websiteContext.type === type;
  }

  /**
   * Check if insights are for a specific industry
   */
  isIndustry(industry) {
    return this.websiteContext.industry === industry;
  }

  /**
   * Add a new recommendation
   */
  addRecommendation(recData) {
    const rec = recData instanceof AiRecommendation ? 
      recData : new AiRecommendation(recData);
    this.recommendations.push(rec);
    return rec;
  }

  /**
   * Remove a recommendation by ID
   */
  removeRecommendation(recId) {
    this.recommendations = this.recommendations.filter(rec => rec.id !== recId);
  }

  /**
   * Get recommendation by ID
   */
  getRecommendationById(recId) {
    return this.recommendations.find(rec => rec.id === recId);
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      executiveSummary: this.executiveSummary,
      websiteContext: this.websiteContext,
      recommendations: this.recommendations.map(rec => rec.toJSON()),
      prioritizedActions: this.prioritizedActions,
      industryInsights: this.industryInsights,
      implementationRoadmap: this.implementationRoadmap,
      customCodeFixes: this.customCodeFixes,
      businessImpact: this.businessImpact,
      generationTimestamp: this.generationTimestamp,
      aiModel: this.aiModel,
      confidence: this.confidence
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(data) {
    return new AiInsights(data);
  }
}

export default AiInsights;