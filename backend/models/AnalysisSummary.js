const supabase = require('../config/supabase');

class AnalysisSummary {
  /**
   * Create or update analysis summary
   * @param {string} analysisId - Analysis ID
   * @param {Object} summaryData - Summary data
   * @returns {Promise<Object>} Created or updated summary
   */
  static async createOrUpdate(analysisId, summaryData) {
    const { data, error } = await supabase
      .from('analysis_summaries')
      .upsert({
        analysis_id: analysisId,
        total_issues: summaryData.totalIssues || 0,
        critical_issues: summaryData.criticalIssues || 0,
        serious_issues: summaryData.seriousIssues || 0,
        moderate_issues: summaryData.moderateIssues || 0,
        minor_issues: summaryData.minorIssues || 0,
        images_without_alt: summaryData.imagesWithoutAlt || 0,
        forms_without_labels: summaryData.formsWithoutLabels || 0,
        color_contrast_violations: summaryData.colorContrastViolations || 0,
        wcag_level: summaryData.wcagLevel || null,
        compliance_percentage: summaryData.compliancePercentage || 0
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating analysis summary: ${error.message}`);
    }

    return data;
  }

  /**
   * Get summary by analysis ID
   * @param {string} analysisId - Analysis ID
   * @returns {Promise<Object|null>} Summary or null if not found
   */
  static async findByAnalysisId(analysisId) {
    const { data, error } = await supabase
      .from('analysis_summaries')
      .select('*')
      .eq('analysis_id', analysisId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Summary not found
      }
      throw new Error(`Error fetching analysis summary: ${error.message}`);
    }

    return data;
  }

  /**
   * Get summaries for multiple analyses
   * @param {Array<string>} analysisIds - Array of analysis IDs
   * @returns {Promise<Array>} Array of summaries
   */
  static async findByAnalysisIds(analysisIds) {
    if (!analysisIds || analysisIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('analysis_summaries')
      .select('*')
      .in('analysis_id', analysisIds);

    if (error) {
      throw new Error(`Error fetching analysis summaries: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get user's analysis summaries with pagination
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of summaries
   */
  static async findByUserId(userId, options = {}) {
    let query = supabase
      .from('analysis_summaries')
      .select(`
        *,
        analyses!inner(
          id,
          url,
          created_at,
          report_type,
          overall_score,
          accessibility_score,
          seo_score,
          performance_score
        )
      `)
      .eq('analyses.user_id', userId)
      .order('analyses.created_at', { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error fetching user analysis summaries: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get aggregate statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Aggregate statistics
   */
  static async getUserStats(userId) {
    const { data, error } = await supabase
      .from('analysis_summaries')
      .select(`
        total_issues,
        critical_issues,
        serious_issues,
        moderate_issues,
        minor_issues,
        compliance_percentage,
        analyses!inner(user_id, created_at)
      `)
      .eq('analyses.user_id', userId);

    if (error) {
      throw new Error(`Error fetching user stats: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return {
        totalAnalyses: 0,
        avgTotalIssues: 0,
        avgCriticalIssues: 0,
        avgCompliancePercentage: 0,
        mostCommonIssueType: null
      };
    }

    const totalAnalyses = data.length;
    const avgTotalIssues = Math.round(
      data.reduce((sum, item) => sum + item.total_issues, 0) / totalAnalyses
    );
    const avgCriticalIssues = Math.round(
      data.reduce((sum, item) => sum + item.critical_issues, 0) / totalAnalyses
    );
    const avgCompliancePercentage = Math.round(
      data.reduce((sum, item) => sum + (item.compliance_percentage || 0), 0) / totalAnalyses
    );

    // Determine most common issue type
    const issueCounts = data.reduce((acc, item) => {
      acc.critical += item.critical_issues;
      acc.serious += item.serious_issues;
      acc.moderate += item.moderate_issues;
      acc.minor += item.minor_issues;
      return acc;
    }, { critical: 0, serious: 0, moderate: 0, minor: 0 });

    const mostCommonIssueType = Object.entries(issueCounts)
      .sort(([,a], [,b]) => b - a)[0][0];

    return {
      totalAnalyses,
      avgTotalIssues,
      avgCriticalIssues,
      avgCompliancePercentage,
      mostCommonIssueType
    };
  }

  /**
   * Delete summary
   * @param {string} analysisId - Analysis ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(analysisId) {
    const { error } = await supabase
      .from('analysis_summaries')
      .delete()
      .eq('analysis_id', analysisId);

    if (error) {
      throw new Error(`Error deleting analysis summary: ${error.message}`);
    }

    return true;
  }
}

module.exports = AnalysisSummary;