/**
 * Quota API Routes
 * Handles user quota checking and management
 */

import { Router, Request, Response, NextFunction } from 'express';
import { quotaService } from '@/services/quota/quotaService';
import { createLogger } from '@/config/logger';

const router = Router();
const logger = createLogger('quota-routes');

/**
 * GET /api/quota
 * Get current user's quota information
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(200).json({
        success: true,
        data: {
          tier: 'guest',
          scansUsed: 0,
          scansLimit: 0,
          scansRemaining: 'unlimited',
          message: 'Guest users can scan but results are not saved. Sign up to save your results.'
        }
      });
    }

    const summary = await quotaService.getQuotaSummary(userId);

    if (!summary) {
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve quota information'
      });
    }

    res.json({
      success: true,
      data: {
        tier: summary.tier,
        scansUsed: summary.scansUsed,
        scansLimit: summary.scansLimit,
        scansRemaining: summary.scansRemaining,
        resetsAt: summary.resetsAt,
        stats: {
          totalInstantScans: summary.totalInstantScans,
          totalDeepAnalyses: summary.totalDeepAnalyses
        }
      }
    });

  } catch (error) {
    logger.error('Error getting quota', { error: (error as Error).message });
    next(error);
  }
});

/**
 * GET /api/quota/check
 * Check if user can perform a scan for a specific URL
 */
router.get('/check', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id || null;
    const url = req.query.url as string;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    const result = await quotaService.canPerformInstantScan(userId, url);

    // Check if there's a cached result
    let cachedAnalysisId: string | null = null;
    if (userId && result.reason === 'cached') {
      const cached = await quotaService.getCachedAnalysis(userId, url);
      cachedAnalysisId = cached?.id || null;
    }

    res.json({
      success: true,
      data: {
        canScan: result.canScan,
        reason: result.reason,
        scansRemaining: result.scansRemaining,
        resetsAt: result.resetsAt,
        cachedAnalysisId,
        tier: result.quota?.tier || 'guest'
      }
    });

  } catch (error) {
    logger.error('Error checking quota', { error: (error as Error).message });
    next(error);
  }
});

/**
 * POST /api/quota/admin/set-tester
 * Set a user as tester (admin only - should be protected)
 * For now, accepts user email to set as tester
 */
router.post('/admin/set-tester', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Add proper admin authentication
    const { userId, email } = req.body;

    let targetUserId = userId;

    // If email provided, look up user ID
    if (email && !userId) {
      // This would need admin access to auth.users
      // For now, require userId directly
      return res.status(400).json({
        success: false,
        error: 'Please provide userId directly. Email lookup requires admin setup.'
      });
    }

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    const quota = await quotaService.setAsTester(targetUserId);

    if (!quota) {
      return res.status(500).json({
        success: false,
        error: 'Failed to set user as tester'
      });
    }

    logger.info('User set as tester via admin API', { targetUserId });

    res.json({
      success: true,
      message: 'User set as tester successfully',
      data: {
        userId: targetUserId,
        tier: quota.tier,
        scansLimit: quota.instant_scans_limit
      }
    });

  } catch (error) {
    logger.error('Error setting tester', { error: (error as Error).message });
    next(error);
  }
});

export default router;
