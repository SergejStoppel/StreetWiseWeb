/**
 * Utility to extract or generate analysis ID for database storage
 */

/**
 * Extract analysis ID from report data or generate a new one
 * @param {Object} report - Analysis report object
 * @returns {string} Analysis ID
 */
function getAnalysisId(report) {
  // If report already has an analysisId, use it
  if (report.analysisId) {
    return report.analysisId;
  }
  
  // If report has metadata with id, use it
  if (report.metadata && report.metadata.id) {
    return report.metadata.id;
  }
  
  // Generate a new UUID-like ID
  return generateAnalysisId();
}

/**
 * Generate a new analysis ID
 * @returns {string} New analysis ID
 */
function generateAnalysisId() {
  return 'analysis_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

module.exports = {
  getAnalysisId,
  generateAnalysisId
};