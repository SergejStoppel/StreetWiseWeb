const supabase = require('../config/supabase');

class Analysis {
  /**
   * Create a new analysis
   * @param {Object} analysisData - Analysis data
   * @param {string} analysisData.userId - User ID
   * @param {string} analysisData.projectId - Project ID (optional)
   * @param {string} analysisData.url - URL analyzed
   * @param {string} analysisData.reportType - Report type (overview, detailed, quick)
   * @param {string} analysisData.language - Language (en, de, es)
   * @param {number} analysisData.overallScore - Overall score
   * @param {number} analysisData.accessibilityScore - Accessibility score
   * @param {number} analysisData.seoScore - SEO score
   * @param {number} analysisData.performanceScore - Performance score
   * @param {Object} analysisData.analysisData - Full analysis data
   * @param {Object} analysisData.metadata - Additional metadata
   * @param {string} analysisData.status - Analysis status
   * @returns {Promise<Object>} Created analysis
   */
  static async create(analysisData) {
    const { data, error } = await supabase
      .from('analyses')
      .insert({
        user_id: analysisData.userId,
        project_id: analysisData.projectId,
        url: analysisData.url,
        report_type: analysisData.reportType || 'overview',
        language: analysisData.language || 'en',
        overall_score: analysisData.overallScore,
        accessibility_score: analysisData.accessibilityScore,
        seo_score: analysisData.seoScore,
        performance_score: analysisData.performanceScore,
        analysis_data: analysisData.analysisData,
        metadata: analysisData.metadata || {},
        status: analysisData.status || 'completed'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating analysis: ${error.message}`);
    }

    return data;
  }

  /**
   * Get analysis by ID
   * @param {string} analysisId - Analysis ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object|null>} Analysis or null if not found
   */
  static async findById(analysisId, userId) {
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', analysisId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Analysis not found
      }
      throw new Error(`Error fetching analysis: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all analyses for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @param {string} options.projectId - Filter by project ID
   * @param {number} options.limit - Limit results
   * @param {number} options.offset - Offset for pagination
   * @param {string} options.status - Filter by status
   * @returns {Promise<Array>} Array of analyses
   */
  static async findByUserId(userId, options = {}) {
    let query = supabase
      .from('analyses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options.projectId) {
      query = query.eq('project_id', options.projectId);
    }

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error fetching analyses: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get analyses by project ID
   * @param {string} projectId - Project ID
   * @param {string} userId - User ID (for authorization)
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of analyses
   */
  static async findByProjectId(projectId, userId, options = {}) {
    return this.findByUserId(userId, { ...options, projectId });
  }

  /**
   * Update analysis
   * @param {string} analysisId - Analysis ID
   * @param {string} userId - User ID (for authorization)
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated analysis
   */
  static async update(analysisId, userId, updateData) {
    const { data, error } = await supabase
      .from('analyses')
      .update(updateData)
      .eq('id', analysisId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating analysis: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete analysis
   * @param {string} analysisId - Analysis ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<boolean>} Success status
   */
  static async delete(analysisId, userId) {
    const { error } = await supabase
      .from('analyses')
      .delete()
      .eq('id', analysisId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Error deleting analysis: ${error.message}`);
    }

    return true;
  }

  /**
   * Get analysis count for user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<number>} Analysis count
   */
  static async getCountByUserId(userId, options = {}) {
    let query = supabase
      .from('analyses')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);

    if (options.projectId) {
      query = query.eq('project_id', options.projectId);
    }

    if (options.status) {
      query = query.eq('status', options.status);
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`Error counting analyses: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Search analyses by URL
   * @param {string} userId - User ID
   * @param {string} searchTerm - Search term
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of matching analyses
   */
  static async searchByUrl(userId, searchTerm, options = {}) {
    let query = supabase
      .from('analyses')
      .select('*')
      .eq('user_id', userId)
      .ilike('url', `%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error searching analyses: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get user's recent analyses
   * @param {string} userId - User ID
   * @param {number} limit - Number of recent analyses to fetch
   * @returns {Promise<Array>} Array of recent analyses
   */
  static async getRecent(userId, limit = 10) {
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Error fetching recent analyses: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get analysis statistics for user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Analysis statistics
   */
  static async getStats(userId, options = {}) {
    try {
      // Get all analyses for the user
      const { data: analyses, error } = await supabase
        .from('analyses')
        .select('overall_score, accessibility_score, seo_score, performance_score, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Error fetching analysis stats: ${error.message}`);
      }

      if (!analyses || analyses.length === 0) {
        return {
          totalAnalyses: 0,
          recentAnalyses: 0,
          avgOverallScore: 0,
          avgAccessibilityScore: 0,
          avgSeoScore: 0,
          avgPerformanceScore: 0,
          lastAnalysisDate: null
        };
      }

      // Calculate statistics
      const totalAnalyses = analyses.length;
      const recentAnalyses = analyses.filter(a => {
        const analysisDate = new Date(a.created_at);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return analysisDate >= thirtyDaysAgo;
      }).length;

      const avgOverallScore = Math.round(
        analyses.reduce((sum, a) => sum + (a.overall_score || 0), 0) / totalAnalyses
      );
      const avgAccessibilityScore = Math.round(
        analyses.reduce((sum, a) => sum + (a.accessibility_score || 0), 0) / totalAnalyses
      );
      const avgSeoScore = Math.round(
        analyses.reduce((sum, a) => sum + (a.seo_score || 0), 0) / totalAnalyses
      );
      const avgPerformanceScore = Math.round(
        analyses.reduce((sum, a) => sum + (a.performance_score || 0), 0) / totalAnalyses
      );

      return {
        totalAnalyses,
        recentAnalyses,
        avgOverallScore,
        avgAccessibilityScore,
        avgSeoScore,
        avgPerformanceScore,
        lastAnalysisDate: analyses[0].created_at
      };
    } catch (error) {
      throw new Error(`Error calculating analysis stats: ${error.message}`);
    }
  }
}

module.exports = Analysis;