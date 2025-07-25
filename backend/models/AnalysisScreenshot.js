const supabase = require('../config/supabase');

class AnalysisScreenshot {
  /**
   * Create screenshot record for an analysis
   * @param {string} analysisId - Analysis ID
   * @param {Object} screenshotData - Screenshot data
   * @param {string} screenshotData.url - Screenshot URL (stored in 'url' column)
   * @param {string} screenshotData.storageObjectId - Storage object ID
   * @param {string} screenshotData.type - Screenshot type (stored in 'type' column: desktop, mobile, tablet, main)
   * @param {Object} screenshotData.metadata - Additional metadata
   * @returns {Promise<Object>} Created screenshot record
   */
  static async create(analysisId, screenshotData) {
    const { data, error } = await supabase
      .from('analysis_screenshots')
      .insert({
        analysis_id: analysisId,
        screenshot_url: screenshotData.url,
        storage_object_id: screenshotData.storageObjectId,
        screenshot_type: screenshotData.type || 'main',
        metadata: screenshotData.metadata || {}
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating analysis screenshot: ${error.message}`);
    }

    return data;
  }

  /**
   * Get screenshots for an analysis
   * @param {string} analysisId - Analysis ID
   * @returns {Promise<Array>} Screenshots array
   */
  static async getByAnalysisId(analysisId) {
    const { data, error } = await supabase
      .from('analysis_screenshots')
      .select('*')
      .eq('analysis_id', analysisId)
      .order('screenshot_type');

    if (error) {
      throw new Error(`Error fetching screenshots: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get screenshots for multiple analyses
   * @param {Array<string>} analysisIds - Array of analysis IDs
   * @returns {Promise<Object>} Map of analysisId to screenshots
   */
  static async getByAnalysisIds(analysisIds) {
    if (!analysisIds || analysisIds.length === 0) {
      return {};
    }

    const { data, error } = await supabase
      .from('analysis_screenshots')
      .select('*')
      .in('analysis_id', analysisIds)
      .order('screenshot_type');

    if (error) {
      throw new Error(`Error fetching screenshots: ${error.message}`);
    }

    // Convert to map for easy lookup
    const screenshotsMap = {};
    data.forEach(record => {
      if (!screenshotsMap[record.analysis_id]) {
        screenshotsMap[record.analysis_id] = [];
      }
      screenshotsMap[record.analysis_id].push(record);
    });

    return screenshotsMap;
  }

  /**
   * Get main screenshot for an analysis
   * @param {string} analysisId - Analysis ID
   * @returns {Promise<Object|null>} Main screenshot or null
   */
  static async getMainScreenshot(analysisId) {
    const { data, error } = await supabase
      .from('analysis_screenshots')
      .select('*')
      .eq('analysis_id', analysisId)
      .eq('screenshot_type', 'main')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No screenshot found
        return null;
      }
      throw new Error(`Error fetching main screenshot: ${error.message}`);
    }

    return data;
  }

  /**
   * Create multiple screenshots for an analysis
   * @param {string} analysisId - Analysis ID
   * @param {Array<Object>} screenshots - Array of screenshot data
   * @returns {Promise<Array>} Created screenshot records
   */
  static async createMultiple(analysisId, screenshots) {
    if (!screenshots || screenshots.length === 0) {
      return [];
    }

    const screenshotRecords = screenshots.map(screenshot => ({
      analysis_id: analysisId,
      screenshot_url: screenshot.url,
      storage_object_id: screenshot.storageObjectId,
      screenshot_type: screenshot.type || 'main',
      metadata: screenshot.metadata || {}
    }));

    const { data, error } = await supabase
      .from('analysis_screenshots')
      .insert(screenshotRecords)
      .select();

    if (error) {
      throw new Error(`Error creating screenshots: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete screenshots for an analysis
   * @param {string} analysisId - Analysis ID
   * @returns {Promise<void>}
   */
  static async deleteByAnalysisId(analysisId) {
    const { error } = await supabase
      .from('analysis_screenshots')
      .delete()
      .eq('analysis_id', analysisId);

    if (error) {
      throw new Error(`Error deleting screenshots: ${error.message}`);
    }
  }
}

module.exports = AnalysisScreenshot;