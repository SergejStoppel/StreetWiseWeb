import express from 'express';
import { ApiResponse } from '@/types';
import { createAnalysis } from '@/lib/db/analysis';
import { masterQueue } from '@/lib/queue/master';
import { supabase } from '@/config/supabase';
import { createLogger } from '@/config/logger';

const router = express.Router();
const logger = createLogger('analyses-route');

/**
 * @swagger
 * /api/analyses:
 *   post:
 *     summary: Start new analysis
 *     tags: [Analyses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               websiteId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Analysis started
 */
router.post('/', async (req, res, next) => {
  try {
    const { websiteId } = req.body;
    // @ts-ignore
    const userId = req.user.id;

    const analysis = await createAnalysis(websiteId, userId);

    // Get workspace ID from user's context (assuming middleware sets req.user.workspaceId)
    // @ts-ignore
    const workspaceId = req.user?.workspaceId || req.headers['x-workspace-id'];

    await masterQueue.add('master-analysis-job', { 
      analysisId: analysis.id,
      workspaceId,
      websiteId, 
      userId 
    });

    const response: ApiResponse = {
      success: true,
      message: 'Analysis started successfully',
      data: analysis,
      timestamp: new Date().toISOString(),
    };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

router.post('/public', async (req, res, next) => {
  try {
    const { url } = req.body;

    // For public analyses, we can create a website record without a workspace
    // or assign it to a generic public workspace. For now, we'll create it without.
    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .insert({ url, workspace_id: null })
      .select()
      .single();

    if (websiteError) {
      // Handle potential duplicate URL error gracefully
      if (websiteError.code === '23505') {
        const { data: existingWebsite, error: existingWebsiteError } = await supabase
          .from('websites')
          .select('id')
          .eq('url', url)
          .is('workspace_id', null)
          .single();
        if (existingWebsiteError) throw existingWebsiteError;
        website = existingWebsite;
      } else {
        throw websiteError;
      }
    }

    const analysis = await createAnalysis(website.id, null); // No user for public analyses

    // Use a default public workspace ID for public analyses
    const publicWorkspaceId = 'public'; // This could be a UUID for a dedicated public workspace

    await masterQueue.add('master-analysis-job', { 
      analysisId: analysis.id,
      workspaceId: publicWorkspaceId,
      websiteId: website.id, 
      userId: null,
      url // Pass the URL for public analyses
    });

    const response: ApiResponse = {
      success: true,
      message: 'Public analysis started successfully',
      data: analysis,
      timestamp: new Date().toISOString(),
    };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/analyses/{id}:
 *   get:
 *     summary: Get analysis status
 *     tags: [Analyses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Analysis status
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    logger.info('Fetching analysis details', { analysisId: id });

    // Fetch analysis with related data
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select(`
        *,
        websites (
          id,
          url,
          name
        ),
        analysis_jobs (
          id,
          module_id,
          status,
          error_message,
          started_at,
          completed_at,
          analysis_modules (
            id,
            name,
            description
          )
        ),
        screenshots (
          id,
          type,
          storage_bucket,
          storage_path,
          url
        )
      `)
      .eq('id', id)
      .single();

    if (analysisError) {
      if (analysisError.code === 'PGRST116') {
        const response: ApiResponse = {
          success: false,
          message: 'Analysis not found',
          timestamp: new Date().toISOString(),
        };
        return res.status(404).json(response);
      }
      throw analysisError;
    }

    // Fetch accessibility issues with rule details
    const { data: accessibilityIssues, error: accessibilityError } = await supabase
      .from('accessibility_issues')
      .select(`
        *,
        rules (
          id,
          rule_key,
          name,
          description,
          default_severity
        )
      `)
      .in('analysis_job_id', analysis.analysis_jobs.map((j: any) => j.id));

    if (accessibilityError) {
      logger.error('Failed to fetch accessibility issues', { error: accessibilityError });
    }

    // Fetch SEO issues with rule details
    const { data: seoIssues, error: seoError } = await supabase
      .from('seo_issues')
      .select(`
        *,
        rules (
          id,
          rule_key,
          name,
          description,
          default_severity
        )
      `)
      .in('analysis_job_id', analysis.analysis_jobs.map((j: any) => j.id));

    if (seoError) {
      logger.error('Failed to fetch SEO issues', { error: seoError });
    }

    // Fetch performance issues with rule details
    const { data: performanceIssues, error: performanceError } = await supabase
      .from('performance_issues')
      .select(`
        *,
        rules (
          id,
          rule_key,
          name,
          description,
          default_severity
        )
      `)
      .in('analysis_job_id', analysis.analysis_jobs.map((j: any) => j.id));

    if (performanceError) {
      logger.error('Failed to fetch performance issues', { error: performanceError });
    }

    // Calculate scores based on issues found
    const totalAccessibilityIssues = accessibilityIssues?.length || 0;
    const totalSeoIssues = seoIssues?.length || 0;
    const totalPerformanceIssues = performanceIssues?.length || 0;

    // Simple scoring algorithm (can be improved)
    const accessibilityScore = Math.max(0, 100 - (totalAccessibilityIssues * 5));
    const seoScore = Math.max(0, 100 - (totalSeoIssues * 5));
    const performanceScore = Math.max(0, 100 - (totalPerformanceIssues * 5));
    const overallScore = Math.round((accessibilityScore + seoScore + performanceScore) / 3);

    // Update scores in database if analysis is completed
    if (analysis.status === 'completed' && !analysis.overall_score) {
      await supabase
        .from('analyses')
        .update({
          overall_score: overallScore,
          accessibility_score: accessibilityScore,
          seo_score: seoScore,
          performance_score: performanceScore
        })
        .eq('id', id);
    }

    // Prepare response data
    const responseData = {
      ...analysis,
      scores: {
        overall: overallScore,
        accessibility: accessibilityScore,
        seo: seoScore,
        performance: performanceScore
      },
      issues: {
        accessibility: accessibilityIssues || [],
        seo: seoIssues || [],
        performance: performanceIssues || []
      },
      summary: {
        totalIssues: totalAccessibilityIssues + totalSeoIssues + totalPerformanceIssues,
        criticalIssues: [
          ...(accessibilityIssues?.filter((i: any) => i.severity === 'critical') || []),
          ...(seoIssues?.filter((i: any) => i.severity === 'critical') || []),
          ...(performanceIssues?.filter((i: any) => i.severity === 'critical') || [])
        ].length,
        highIssues: [
          ...(accessibilityIssues?.filter((i: any) => i.severity === 'high') || []),
          ...(seoIssues?.filter((i: any) => i.severity === 'high') || []),
          ...(performanceIssues?.filter((i: any) => i.severity === 'high') || [])
        ].length
      }
    };

    const response: ApiResponse = {
      success: true,
      message: 'Analysis retrieved successfully',
      data: responseData,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Error fetching analysis', { error: error.message, analysisId: req.params.id });
    next(error);
  }
});

export default router;