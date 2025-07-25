const supabase = require('../config/supabase');

class StorageObject {
  /**
   * Create a new storage object record
   * @param {Object} data - Storage object data
   * @param {string} data.userId - User ID (optional for anonymous)
   * @param {string} data.analysisId - Analysis ID
   * @param {string} data.bucketId - Storage bucket ID
   * @param {string} data.objectPath - Object path in storage
   * @param {number} data.fileSize - File size in bytes
   * @param {string} data.mimeType - MIME type
   * @returns {Promise<Object>} Created storage object
   */
  static async create(data) {
    const { data: result, error } = await supabase
      .from('storage_objects')
      .insert({
        user_id: data.userId || null,
        analysis_id: data.analysisId,
        bucket_id: data.bucketId || 'analysis-screenshots',
        object_path: data.objectPath,
        file_size: data.fileSize || 0,
        mime_type: data.mimeType
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating storage object: ${error.message}`);
    }

    return result;
  }

  /**
   * Get storage objects by analysis ID
   * @param {string} analysisId - Analysis ID
   * @returns {Promise<Array>} Array of storage objects
   */
  static async findByAnalysisId(analysisId) {
    const { data, error } = await supabase
      .from('storage_objects')
      .select('*')
      .eq('analysis_id', analysisId);

    if (error) {
      throw new Error(`Error fetching storage objects: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get storage objects by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of storage objects
   */
  static async findByUserId(userId) {
    const { data, error } = await supabase
      .from('storage_objects')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Error fetching storage objects: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get storage usage by user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Storage usage stats
   */
  static async getStorageUsage(userId) {
    const { data, error } = await supabase
      .from('storage_objects')
      .select('file_size')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Error fetching storage usage: ${error.message}`);
    }

    const totalSize = data.reduce((sum, obj) => sum + (obj.file_size || 0), 0);
    const totalFiles = data.length;

    return {
      totalSize,
      totalFiles,
      averageSize: totalFiles > 0 ? Math.round(totalSize / totalFiles) : 0
    };
  }

  /**
   * Delete storage object record
   * @param {string} objectId - Storage object ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(objectId) {
    const { error } = await supabase
      .from('storage_objects')
      .delete()
      .eq('id', objectId);

    if (error) {
      throw new Error(`Error deleting storage object: ${error.message}`);
    }

    return true;
  }

  /**
   * Cleanup orphaned storage objects
   * @returns {Promise<number>} Number of objects deleted
   */
  static async cleanupOrphaned() {
    const { data, error } = await supabase
      .rpc('cleanup_orphaned_storage');

    if (error) {
      throw new Error(`Error cleaning up orphaned storage: ${error.message}`);
    }

    return data;
  }
}

module.exports = StorageObject;