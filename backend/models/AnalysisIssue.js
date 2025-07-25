const supabase = require('../config/supabase');

class AnalysisIssue {
  /**
   * Create analysis issues in bulk
   * @param {Array} issuesData - Array of issue data
   * @param {string} issuesData[].analysisId - Analysis ID
   * @param {string} issuesData[].issueId - Issue ID from analyzer
   * @param {string} issuesData[].title - Issue title
   * @param {string} issuesData[].description - Issue description
   * @param {string} issuesData[].severity - Issue severity
   * @param {string} issuesData[].category - Issue category
   * @param {Array} issuesData[].wcagCriteria - WCAG criteria
   * @param {Array} issuesData[].elements - Affected elements
   * @param {Object} issuesData[].remediation - Remediation suggestions
   * @returns {Promise<Array>} Created issues
   */
  static async createBulk(issuesData) {
    const { data, error } = await supabase
      .from('analysis_issues')
      .insert(issuesData.map(issue => ({
        analysis_id: issue.analysisId,
        issue_id: issue.issueId,
        title: issue.title,
        description: issue.description,
        severity: issue.severity,
        category: issue.category,
        wcag_criteria: issue.wcagCriteria || [],
        elements: issue.elements || [],
        remediation: issue.remediation || {}
      })))
      .select();

    if (error) {
      throw new Error(`Error creating analysis issues: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a single analysis issue
   * @param {Object} issueData - Issue data
   * @returns {Promise<Object>} Created issue
   */
  static async create(issueData) {
    const { data, error } = await supabase
      .from('analysis_issues')
      .insert({
        analysis_id: issueData.analysisId,
        issue_id: issueData.issueId,
        title: issueData.title,
        description: issueData.description,
        severity: issueData.severity,
        category: issueData.category,
        wcag_criteria: issueData.wcagCriteria || [],
        elements: issueData.elements || [],
        remediation: issueData.remediation || {}
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating analysis issue: ${error.message}`);
    }

    return data;
  }

  /**
   * Get issues by analysis ID
   * @param {string} analysisId - Analysis ID
   * @param {string} userId - User ID (for authorization check)
   * @param {Object} options - Query options
   * @param {string} options.severity - Filter by severity
   * @param {string} options.category - Filter by category
   * @param {number} options.limit - Limit results
   * @param {number} options.offset - Offset for pagination
   * @returns {Promise<Array>} Array of issues
   */
  static async findByAnalysisId(analysisId, userId, options = {}) {
    // First verify user has access to this analysis
    const { data: analysisData, error: analysisError } = await supabase
      .from('analyses')
      .select('id')
      .eq('id', analysisId)
      .eq('user_id', userId)
      .single();

    if (analysisError || !analysisData) {
      throw new Error('Analysis not found or access denied');
    }

    let query = supabase
      .from('analysis_issues')
      .select('*')
      .eq('analysis_id', analysisId)
      .order('created_at', { ascending: false });

    if (options.severity) {
      query = query.eq('severity', options.severity);
    }

    if (options.category) {
      query = query.eq('category', options.category);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error fetching analysis issues: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get issues by user ID (across all analyses)
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @param {string} options.severity - Filter by severity
   * @param {string} options.category - Filter by category
   * @param {number} options.limit - Limit results
   * @param {number} options.offset - Offset for pagination
   * @returns {Promise<Array>} Array of issues
   */
  static async findByUserId(userId, options = {}) {
    let query = supabase
      .from('analysis_issues')
      .select(`
        *,
        analyses!inner (
          id,
          url,
          user_id
        )
      `)
      .eq('analyses.user_id', userId)
      .order('created_at', { ascending: false });

    if (options.severity) {
      query = query.eq('severity', options.severity);
    }

    if (options.category) {
      query = query.eq('category', options.category);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error fetching user issues: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get issue statistics for an analysis
   * @param {string} analysisId - Analysis ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>} Issue statistics
   */
  static async getStatsByAnalysisId(analysisId, userId) {
    // First verify user has access to this analysis
    const { data: analysisData, error: analysisError } = await supabase
      .from('analyses')
      .select('id')
      .eq('id', analysisId)
      .eq('user_id', userId)
      .single();

    if (analysisError || !analysisData) {
      throw new Error('Analysis not found or access denied');
    }

    const { data, error } = await supabase
      .from('analysis_issues')
      .select('severity, category')
      .eq('analysis_id', analysisId);

    if (error) {
      throw new Error(`Error fetching issue statistics: ${error.message}`);
    }

    const stats = {
      total: data.length,
      bySeverity: {
        critical: 0,
        serious: 0,
        moderate: 0,
        minor: 0
      },
      byCategory: {}
    };

    data.forEach(issue => {
      // Count by severity
      if (issue.severity) {
        stats.bySeverity[issue.severity] = (stats.bySeverity[issue.severity] || 0) + 1;
      }

      // Count by category
      if (issue.category) {
        stats.byCategory[issue.category] = (stats.byCategory[issue.category] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Get issue statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Issue statistics
   */
  static async getStatsByUserId(userId) {
    const { data, error } = await supabase
      .from('analysis_issues')
      .select(`
        severity,
        category,
        analyses!inner (
          user_id
        )
      `)
      .eq('analyses.user_id', userId);

    if (error) {
      throw new Error(`Error fetching user issue statistics: ${error.message}`);
    }

    const stats = {
      total: data.length,
      bySeverity: {
        critical: 0,
        serious: 0,
        moderate: 0,
        minor: 0
      },
      byCategory: {}
    };

    data.forEach(issue => {
      // Count by severity
      if (issue.severity) {
        stats.bySeverity[issue.severity] = (stats.bySeverity[issue.severity] || 0) + 1;
      }

      // Count by category
      if (issue.category) {
        stats.byCategory[issue.category] = (stats.byCategory[issue.category] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Delete issues by analysis ID
   * @param {string} analysisId - Analysis ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<boolean>} Success status
   */
  static async deleteByAnalysisId(analysisId, userId) {
    // First verify user has access to this analysis
    const { data: analysisData, error: analysisError } = await supabase
      .from('analyses')
      .select('id')
      .eq('id', analysisId)
      .eq('user_id', userId)
      .single();

    if (analysisError || !analysisData) {
      throw new Error('Analysis not found or access denied');
    }

    const { error } = await supabase
      .from('analysis_issues')
      .delete()
      .eq('analysis_id', analysisId);

    if (error) {
      throw new Error(`Error deleting analysis issues: ${error.message}`);
    }

    return true;
  }

  /**
   * Get common issues across user's analyses
   * @param {string} userId - User ID
   * @param {number} limit - Number of common issues to return
   * @returns {Promise<Array>} Array of common issues with counts
   */
  static async getCommonIssues(userId, limit = 10) {
    const { data, error } = await supabase
      .from('analysis_issues')
      .select(`
        issue_id,
        title,
        severity,
        category,
        analyses!inner (
          user_id
        )
      `)
      .eq('analyses.user_id', userId);

    if (error) {
      throw new Error(`Error fetching common issues: ${error.message}`);
    }

    // Group by issue_id and count occurrences
    const issueGroups = {};
    data.forEach(issue => {
      if (!issueGroups[issue.issue_id]) {
        issueGroups[issue.issue_id] = {
          issue_id: issue.issue_id,
          title: issue.title,
          severity: issue.severity,
          category: issue.category,
          count: 0
        };
      }
      issueGroups[issue.issue_id].count++;
    });

    // Sort by count and return top issues
    return Object.values(issueGroups)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
}

module.exports = AnalysisIssue;