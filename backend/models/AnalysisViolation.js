const supabase = require('../config/supabase');

class AnalysisViolation {
  /**
   * Create violations for an analysis
   * @param {string} analysisId - Analysis ID
   * @param {Array} violations - Array of violations
   * @returns {Promise<Object>} Created violation record
   */
  static async create(analysisId, violations) {
    if (!violations || violations.length === 0) {
      return null;
    }

    const { data, error } = await supabase
      .from('analysis_violations')
      .insert({
        analysis_id: analysisId,
        violations: violations
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating analysis violations: ${error.message}`);
    }

    return data;
  }

  /**
   * Get violations for an analysis
   * @param {string} analysisId - Analysis ID
   * @returns {Promise<Array>} Violations array
   */
  static async getByAnalysisId(analysisId) {
    const { data, error } = await supabase
      .from('analysis_violations')
      .select('violations')
      .eq('analysis_id', analysisId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No violations found
        return [];
      }
      throw new Error(`Error fetching violations: ${error.message}`);
    }

    return data?.violations || [];
  }

  /**
   * Get violations for multiple analyses
   * @param {Array<string>} analysisIds - Array of analysis IDs
   * @returns {Promise<Object>} Map of analysisId to violations
   */
  static async getByAnalysisIds(analysisIds) {
    if (!analysisIds || analysisIds.length === 0) {
      return {};
    }

    const { data, error } = await supabase
      .from('analysis_violations')
      .select('analysis_id, violations')
      .in('analysis_id', analysisIds);

    if (error) {
      throw new Error(`Error fetching violations: ${error.message}`);
    }

    // Convert to map for easy lookup
    const violationsMap = {};
    data.forEach(record => {
      violationsMap[record.analysis_id] = record.violations || [];
    });

    return violationsMap;
  }

  /**
   * Update violations for an analysis
   * @param {string} analysisId - Analysis ID
   * @param {Array} violations - Updated violations
   * @returns {Promise<Object>} Updated violation record
   */
  static async update(analysisId, violations) {
    const { data, error } = await supabase
      .from('analysis_violations')
      .update({ violations })
      .eq('analysis_id', analysisId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating violations: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete violations for an analysis
   * @param {string} analysisId - Analysis ID
   * @returns {Promise<void>}
   */
  static async delete(analysisId) {
    const { error } = await supabase
      .from('analysis_violations')
      .delete()
      .eq('analysis_id', analysisId);

    if (error) {
      throw new Error(`Error deleting violations: ${error.message}`);
    }
  }
}

module.exports = AnalysisViolation;