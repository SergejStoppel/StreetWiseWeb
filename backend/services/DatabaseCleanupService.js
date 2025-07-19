const supabase = require('../config/supabase');
const logger = require('../utils/logger');

class DatabaseCleanupService {
  /**
   * Perform daily cleanup operations
   * @returns {Promise<Object>} Cleanup results
   */
  static async performDailyCleanup() {
    try {
      logger.info('Starting daily database cleanup...');

      const results = {
        anonymousAnalysesDeleted: 0,
        orphanedStorageDeleted: 0,
        materialized_view_refreshed: false,
        errors: []
      };

      // 1. Delete old anonymous analyses
      try {
        const { data: anonymousDeleted, error } = await supabase
          .rpc('cleanup_anonymous_analyses', { p_days_old: 30 });

        if (error) {
          throw error;
        }

        results.anonymousAnalysesDeleted = anonymousDeleted || 0;
        logger.info(`Deleted ${results.anonymousAnalysesDeleted} old anonymous analyses`);
      } catch (error) {
        const errorMsg = `Failed to cleanup anonymous analyses: ${error.message}`;
        logger.error(errorMsg);
        results.errors.push(errorMsg);
      }

      // 2. Cleanup orphaned storage objects
      try {
        const { data: orphanedDeleted, error } = await supabase
          .rpc('cleanup_orphaned_storage');

        if (error) {
          throw error;
        }

        results.orphanedStorageDeleted = orphanedDeleted || 0;
        logger.info(`Deleted ${results.orphanedStorageDeleted} orphaned storage objects`);
      } catch (error) {
        const errorMsg = `Failed to cleanup orphaned storage: ${error.message}`;
        logger.error(errorMsg);
        results.errors.push(errorMsg);
      }

      // 3. Refresh materialized views
      try {
        const { error } = await supabase
          .rpc('refresh_dashboard_stats');

        if (error) {
          throw error;
        }

        results.materialized_view_refreshed = true;
        logger.info('Refreshed dashboard materialized view');
      } catch (error) {
        const errorMsg = `Failed to refresh materialized view: ${error.message}`;
        logger.error(errorMsg);
        results.errors.push(errorMsg);
      }

      logger.info('Daily cleanup completed', results);
      return results;

    } catch (error) {
      logger.error('Daily cleanup failed:', error);
      throw new Error(`Daily cleanup failed: ${error.message}`);
    }
  }

  /**
   * Cleanup data for a specific user (before deletion)
   * @param {string} userId - User ID to cleanup
   * @returns {Promise<Object>} Cleanup results
   */
  static async cleanupUserData(userId) {
    try {
      logger.info(`Starting cleanup for user ${userId}`);

      const results = {
        analysesDeleted: 0,
        projectsDeleted: 0,
        storageObjectsDeleted: 0,
        storageFilesDeleted: 0,
        errors: []
      };

      // Count data before deletion
      const { data: analyses } = await supabase
        .from('analyses')
        .select('id')
        .eq('user_id', userId);

      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', userId);

      const { data: storageObjects } = await supabase
        .from('storage_objects')
        .select('object_path')
        .eq('user_id', userId);

      results.analysesDeleted = analyses?.length || 0;
      results.projectsDeleted = projects?.length || 0;
      results.storageObjectsDeleted = storageObjects?.length || 0;

      // Delete actual storage files
      if (storageObjects && storageObjects.length > 0) {
        try {
          const filePaths = storageObjects.map(obj => obj.object_path);
          const { error: storageError } = await supabase.storage
            .from('analysis-screenshots')
            .remove(filePaths);

          if (storageError) {
            logger.warn('Some storage files could not be deleted:', storageError);
            results.errors.push(`Storage deletion warning: ${storageError.message}`);
          } else {
            results.storageFilesDeleted = filePaths.length;
          }
        } catch (storageError) {
          const errorMsg = `Failed to delete storage files: ${storageError.message}`;
          logger.error(errorMsg);
          results.errors.push(errorMsg);
        }
      }

      // The actual database records will be deleted by CASCADE when user is deleted
      logger.info(`User ${userId} cleanup prepared`, results);
      return results;

    } catch (error) {
      logger.error(`User cleanup failed for ${userId}:`, error);
      throw new Error(`User cleanup failed: ${error.message}`);
    }
  }

  /**
   * Test CASCADE deletion without actually deleting
   * @param {string} userId - User ID to test
   * @returns {Promise<Object>} Test results
   */
  static async testCascadeDeletion(userId) {
    try {
      const results = {
        userProfile: null,
        projects: [],
        analyses: [],
        analysisIssues: [],
        usageLogs: [],
        storageObjects: [],
        analysisSummaries: [],
        totalRecords: 0
      };

      // Get user profile
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      results.userProfile = userProfile;

      // Get projects
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId);

      results.projects = projects || [];

      // Get analyses
      const { data: analyses } = await supabase
        .from('analyses')
        .select('id, url, created_at, status')
        .eq('user_id', userId);

      results.analyses = analyses || [];

      // Get analysis issues for user's analyses
      if (analyses && analyses.length > 0) {
        const analysisIds = analyses.map(a => a.id);
        
        const { data: analysisIssues } = await supabase
          .from('analysis_issues')
          .select('id, analysis_id, title, severity')
          .in('analysis_id', analysisIds);

        results.analysisIssues = analysisIssues || [];

        const { data: analysisSummaries } = await supabase
          .from('analysis_summaries')
          .select('*')
          .in('analysis_id', analysisIds);

        results.analysisSummaries = analysisSummaries || [];
      }

      // Get usage logs
      const { data: usageLogs } = await supabase
        .from('usage_logs')
        .select('*')
        .eq('user_id', userId);

      results.usageLogs = usageLogs || [];

      // Get storage objects
      const { data: storageObjects } = await supabase
        .from('storage_objects')
        .select('*')
        .eq('user_id', userId);

      results.storageObjects = storageObjects || [];

      // Calculate totals
      results.totalRecords = 
        (results.userProfile ? 1 : 0) +
        results.projects.length +
        results.analyses.length +
        results.analysisIssues.length +
        results.usageLogs.length +
        results.storageObjects.length +
        results.analysisSummaries.length;

      logger.info(`CASCADE deletion test for user ${userId}:`, {
        userProfile: !!results.userProfile,
        projects: results.projects.length,
        analyses: results.analyses.length,
        analysisIssues: results.analysisIssues.length,
        usageLogs: results.usageLogs.length,
        storageObjects: results.storageObjects.length,
        analysisSummaries: results.analysisSummaries.length,
        totalRecords: results.totalRecords
      });

      return results;

    } catch (error) {
      logger.error(`CASCADE deletion test failed for ${userId}:`, error);
      throw new Error(`CASCADE deletion test failed: ${error.message}`);
    }
  }

  /**
   * Get cleanup statistics
   * @returns {Promise<Object>} Cleanup statistics
   */
  static async getCleanupStats() {
    try {
      const stats = {
        anonymousAnalyses: 0,
        oldAnalyses: 0,
        orphanedStorage: 0,
        totalStorageUsage: 0,
        lastCleanup: null
      };

      // Count anonymous analyses
      const { data: anonymousAnalyses } = await supabase
        .from('analyses')
        .select('id', { count: 'exact' })
        .eq('is_anonymous', true);

      stats.anonymousAnalyses = anonymousAnalyses || 0;

      // Count old analyses (30+ days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const { data: oldAnalyses } = await supabase
        .from('analyses')
        .select('id', { count: 'exact' })
        .eq('is_anonymous', true)
        .lt('created_at', thirtyDaysAgo.toISOString());

      stats.oldAnalyses = oldAnalyses || 0;

      // Count total storage usage
      const { data: storageObjects } = await supabase
        .from('storage_objects')
        .select('file_size');

      if (storageObjects) {
        stats.totalStorageUsage = storageObjects.reduce((sum, obj) => sum + (obj.file_size || 0), 0);
      }

      // Get last cleanup log
      const { data: lastCleanup } = await supabase
        .from('deletion_logs')
        .select('deleted_at, metadata')
        .contains('data_types', ['cleanup_job'])
        .order('deleted_at', { ascending: false })
        .limit(1)
        .single();

      if (lastCleanup) {
        stats.lastCleanup = {
          date: lastCleanup.deleted_at,
          details: lastCleanup.metadata
        };
      }

      return stats;

    } catch (error) {
      logger.error('Failed to get cleanup stats:', error);
      throw new Error(`Failed to get cleanup stats: ${error.message}`);
    }
  }
}

module.exports = DatabaseCleanupService;