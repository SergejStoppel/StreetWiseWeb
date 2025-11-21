/**
 * Instant Scan API Routes
 * Handles quick HTTP-only scans for Tier 1 (free) analysis
 */

import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/config/supabase';
import { createLogger } from '@/config/logger';
import { quotaService } from '@/services/quota/quotaService';
import { quickScanQueue } from '@/lib/queue/quickScan';

const router = Router();
const logger = createLogger('instant-scan-routes');

/**
 * POST /api/instant-scan
 * Start an instant scan (Tier 1 - free)
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id || null;
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    const isGuest = !userId;

    // Check quota (for registered users)
    if (!isGuest) {
      const quotaCheck = await quotaService.canPerformInstantScan(userId, normalizedUrl);

      // If cached result exists, return it
      if (quotaCheck.reason === 'cached') {
        const cached = await quotaService.getCachedAnalysis(userId, normalizedUrl);
        if (cached) {
          logger.info('Returning cached analysis', { userId, url: normalizedUrl, analysisId: cached.id });

          // Fetch full analysis data
          const { data: analysis } = await supabase
            .from('analyses')
            .select('*')
            .eq('id', cached.id)
            .single();

          return res.json({
            success: true,
            data: {
              analysisId: cached.id,
              status: 'completed',
              cached: true,
              analysis
            },
            quota: {
              tier: quotaCheck.quota?.tier || 'free',
              scansRemaining: quotaCheck.scansRemaining,
              resetsAt: quotaCheck.resetsAt
            }
          });
        }
      }

      // Check if quota allows scan
      if (!quotaCheck.canScan) {
        return res.status(429).json({
          success: false,
          error: 'Scan limit reached',
          message: `You've used all ${quotaCheck.quota?.instant_scans_limit} instant scans this month. Limit resets on ${new Date(quotaCheck.resetsAt!).toLocaleDateString()}.`,
          quota: {
            tier: quotaCheck.quota?.tier,
            scansUsed: quotaCheck.quota?.instant_scans_used,
            scansLimit: quotaCheck.quota?.instant_scans_limit,
            resetsAt: quotaCheck.resetsAt
          }
        });
      }
    }

    // Create analysis record
    const analysisId = uuidv4();
    const workspaceId = isGuest ? null : (req as any).user?.workspaceId || null;

    const { error: insertError } = await supabase
      .from('analyses')
      .insert({
        id: analysisId,
        url: normalizedUrl,
        user_id: userId,
        workspace_id: workspaceId,
        status: 'pending',
        analysis_type: 'instant',
        is_guest: isGuest,
        expires_at: isGuest ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null // Guest results expire in 24h
      });

    if (insertError) {
      logger.error('Failed to create analysis record', { error: insertError });
      return res.status(500).json({
        success: false,
        error: 'Failed to start analysis'
      });
    }

    // Queue the quick scan job
    await quickScanQueue.add('quick-scan', {
      analysisId,
      url: normalizedUrl,
      userId,
      workspaceId,
      isGuest
    });

    // Increment quota usage (for registered users)
    if (!isGuest) {
      await quotaService.incrementScanUsage(userId);
    }

    logger.info('Instant scan started', {
      analysisId,
      url: normalizedUrl,
      isGuest,
      userId
    });

    // Get updated quota info
    let quotaInfo = null;
    if (!isGuest) {
      const summary = await quotaService.getQuotaSummary(userId);
      quotaInfo = {
        tier: summary?.tier,
        scansUsed: summary?.scansUsed,
        scansLimit: summary?.scansLimit,
        scansRemaining: summary?.scansRemaining,
        resetsAt: summary?.resetsAt
      };
    }

    res.status(202).json({
      success: true,
      data: {
        analysisId,
        status: 'pending',
        url: normalizedUrl,
        isGuest
      },
      quota: quotaInfo,
      message: isGuest
        ? 'Scan started. Sign up to save your results!'
        : 'Scan started. Results will be available shortly.'
    });

  } catch (error) {
    logger.error('Error starting instant scan', { error: (error as Error).message });
    next(error);
  }
});

/**
 * GET /api/instant-scan/:id
 * Get instant scan results
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || null;

    // Fetch analysis
    const { data: analysis, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !analysis) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found'
      });
    }

    // Check access
    // - Guests can only access their own analyses (via ID)
    // - Registered users can only access their own analyses
    if (analysis.user_id && analysis.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Check if guest analysis has expired
    if (analysis.is_guest && analysis.expires_at && new Date(analysis.expires_at) < new Date()) {
      return res.status(410).json({
        success: false,
        error: 'This analysis has expired. Please run a new scan.',
        message: 'Guest analysis results expire after 24 hours. Sign up to save your results permanently.'
      });
    }

    // If still processing, return status
    if (analysis.status === 'pending' || analysis.status === 'processing') {
      return res.json({
        success: true,
        data: {
          analysisId: id,
          status: analysis.status,
          url: analysis.url
        }
      });
    }

    // Fetch issues (top 3 for preview)
    const [accIssues, seoIssues, perfIssues] = await Promise.all([
      supabase.from('accessibility_issues').select('*').eq('analysis_id', id),
      supabase.from('seo_issues').select('*').eq('analysis_id', id),
      supabase.from('performance_issues').select('*').eq('analysis_id', id)
    ]);

    // Combine and sort all issues
    const allIssues = [
      ...(accIssues.data || []).map(i => ({ ...i, category: 'Accessibility' })),
      ...(seoIssues.data || []).map(i => ({ ...i, category: 'SEO' })),
      ...(perfIssues.data || []).map(i => ({ ...i, category: 'Performance' }))
    ];

    const severityOrder = { critical: 4, serious: 3, moderate: 2, minor: 1 };
    allIssues.sort((a, b) => (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0));

    // Get top 3 issues for preview
    const topIssues = allIssues.slice(0, 3);

    res.json({
      success: true,
      data: {
        analysisId: id,
        status: analysis.status,
        url: analysis.url,
        analysisType: analysis.analysis_type,
        scores: analysis.scores || { overall: 0, accessibility: 0, seo: 0, performance: 0 },
        metadata: analysis.metadata,
        totalIssues: allIssues.length,
        topIssues,
        isGuest: analysis.is_guest,
        createdAt: analysis.created_at,
        completedAt: analysis.completed_at
      },
      upgrade: {
        message: `Found ${allIssues.length} issues. Get the full analysis with AI-powered recommendations.`,
        price: '$49',
        features: [
          'All issues with detailed explanations',
          'AI-powered fix recommendations',
          'Full accessibility audit',
          'Performance deep dive',
          'Priority support'
        ]
      }
    });

  } catch (error) {
    logger.error('Error getting instant scan', { error: (error as Error).message });
    next(error);
  }
});

/**
 * GET /api/instant-scan/:id/poll
 * Poll for scan completion (lightweight endpoint)
 */
router.get('/:id/poll', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('analyses')
      .select('status, scores, metadata')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found'
      });
    }

    res.json({
      success: true,
      data: {
        status: data.status,
        scores: data.scores,
        completed: ['completed', 'completed_with_errors', 'failed'].includes(data.status)
      }
    });

  } catch (error) {
    logger.error('Error polling scan status', { error: (error as Error).message });
    next(error);
  }
});

export default router;
