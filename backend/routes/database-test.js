const express = require('express');
const { extractUser } = require('../middleware/auth');
const DatabaseCleanupService = require('../services/DatabaseCleanupService');
const AnalysisSummary = require('../models/AnalysisSummary');
const StorageObject = require('../models/StorageObject');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/database-test/cleanup-stats - Get cleanup statistics
router.get('/cleanup-stats', extractUser, async (req, res) => {
  try {
    const stats = await DatabaseCleanupService.getCleanupStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get cleanup stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get cleanup statistics'
    });
  }
});

// POST /api/database-test/test-cascade/:userId - Test what would be deleted for a user
router.post('/test-cascade/:userId', extractUser, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Only allow testing own user data or if superuser
    if (req.user?.id !== userId && !req.user?.is_superuser) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Can only test cascade deletion for your own account'
      });
    }
    
    const testResults = await DatabaseCleanupService.testCascadeDeletion(userId);
    
    res.json({
      success: true,
      data: testResults,
      message: `Found ${testResults.totalRecords} records that would be deleted`
    });
  } catch (error) {
    logger.error('Failed to test cascade deletion:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to test cascade deletion'
    });
  }
});

// POST /api/database-test/daily-cleanup - Run daily cleanup (admin only)
router.post('/daily-cleanup', extractUser, async (req, res) => {
  try {
    // Only allow for admin users
    if (!req.user?.is_superuser) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }
    
    const results = await DatabaseCleanupService.performDailyCleanup();
    
    res.json({
      success: true,
      data: results,
      message: 'Daily cleanup completed'
    });
  } catch (error) {
    logger.error('Failed to perform daily cleanup:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to perform daily cleanup'
    });
  }
});

// GET /api/database-test/user-summaries/:userId - Get user's analysis summaries
router.get('/user-summaries/:userId', extractUser, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Only allow accessing own data
    if (req.user?.id !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Can only access your own analysis summaries'
      });
    }
    
    const summaries = await AnalysisSummary.findByUserId(userId, {
      limit: parseInt(req.query.limit) || 10,
      offset: parseInt(req.query.offset) || 0
    });
    
    res.json({
      success: true,
      data: summaries
    });
  } catch (error) {
    logger.error('Failed to get user summaries:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get analysis summaries'
    });
  }
});

// GET /api/database-test/storage-usage/:userId - Get user's storage usage
router.get('/storage-usage/:userId', extractUser, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Only allow accessing own data
    if (req.user?.id !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Can only access your own storage usage'
      });
    }
    
    const usage = await StorageObject.getStorageUsage(userId);
    const objects = await StorageObject.findByUserId(userId);
    
    res.json({
      success: true,
      data: {
        usage,
        objects: objects.slice(0, 10), // Latest 10 objects
        totalObjects: objects.length
      }
    });
  } catch (error) {
    logger.error('Failed to get storage usage:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get storage usage'
    });
  }
});

// GET /api/database-test/materialized-view-status - Check materialized view status
router.get('/materialized-view-status', extractUser, async (req, res) => {
  try {
    const supabase = require('../config/supabase');
    
    // Check if materialized view exists and has data
    const { data, error } = await supabase
      .from('user_dashboard_stats')
      .select('user_id', { count: 'exact' })
      .limit(1);
    
    if (error) {
      return res.json({
        success: false,
        data: {
          exists: false,
          error: error.message,
          recordCount: 0
        }
      });
    }
    
    const { count } = await supabase
      .from('user_dashboard_stats')
      .select('*', { count: 'exact', head: true });
    
    res.json({
      success: true,
      data: {
        exists: true,
        recordCount: count || 0,
        lastRefresh: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to check materialized view status:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to check materialized view status'
    });
  }
});

module.exports = router;