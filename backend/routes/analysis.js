const express = require('express');
const Analysis = require('../models/Analysis');
const { extractUser, requireAuth } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/analysis - Get user's analysis history
router.get('/', extractUser, requireAuth, async (req, res) => {
  try {
    const { limit = 10, offset = 0, projectId, status } = req.query;
    
    const analyses = await Analysis.findByUserId(req.user.id, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      projectId,
      status
    });
    
    res.json({
      success: true,
      data: analyses,
      meta: {
        count: analyses.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
    
  } catch (error) {
    logger.error('Failed to fetch user analyses:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Unable to fetch analysis history'
    });
  }
});

// GET /api/analysis/recent - Get user's recent analyses
router.get('/recent', extractUser, requireAuth, async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    const analyses = await Analysis.getRecent(req.user.id, parseInt(limit));
    
    res.json({
      success: true,
      data: analyses
    });
    
  } catch (error) {
    logger.error('Failed to fetch recent analyses:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Unable to fetch recent analyses'
    });
  }
});

// GET /api/analysis/stats - Get user's analysis statistics
router.get('/stats', extractUser, requireAuth, async (req, res) => {
  try {
    const stats = await Analysis.getStats(req.user.id);
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    logger.error('Failed to fetch analysis stats:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Unable to fetch analysis statistics'
    });
  }
});

// GET /api/analysis/:id - Get specific analysis by ID
router.get('/:id', extractUser, requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const analysis = await Analysis.findById(id, req.user.id);
    
    console.log('📸 API: Retrieved analysis with screenshot data:', {
      analysisId: id,
      hasScreenshot: !!analysis?.screenshot,
      screenshot: analysis?.screenshot,
      screenshotType: typeof analysis?.screenshot,
      userId: analysis?.userId,
      analysisKeys: analysis ? Object.keys(analysis) : 'null'
    });
    
    if (!analysis) {
      return res.status(404).json({
        error: 'Analysis not found',
        message: 'The requested analysis was not found'
      });
    }
    
    res.json({
      success: true,
      data: analysis
    });
    
  } catch (error) {
    logger.error('Failed to fetch analysis:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Unable to fetch analysis'
    });
  }
});

// DELETE /api/analysis/:id - Delete specific analysis
router.delete('/:id', extractUser, requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const success = await Analysis.delete(id, req.user.id);
    
    if (!success) {
      return res.status(404).json({
        error: 'Analysis not found',
        message: 'The requested analysis was not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Analysis deleted successfully'
    });
    
  } catch (error) {
    logger.error('Failed to delete analysis:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Unable to delete analysis'
    });
  }
});

// GET /api/analysis/search/:term - Search analyses by URL
router.get('/search/:term', extractUser, requireAuth, async (req, res) => {
  try {
    const { term } = req.params;
    const { limit = 10 } = req.query;
    
    const analyses = await Analysis.searchByUrl(req.user.id, term, {
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      data: analyses
    });
    
  } catch (error) {
    logger.error('Failed to search analyses:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Unable to search analyses'
    });
  }
});

module.exports = router;