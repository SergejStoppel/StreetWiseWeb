import express from 'express';
import { ApiResponse } from '@/types';
import { createAnalysis } from '@/lib/db/analysis';
import { masterQueue } from '@/lib/queue/master';
import { supabase } from '@/config/supabase';
import { createLogger } from '@/config/logger';
import { authenticateToken, AuthRequest } from '@/api/middleware/auth';

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
router.post('/', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { websiteId, url } = req.body;
    
    // Handle both websiteId (existing flow) and url (new flow from homepage)
    let targetWebsiteId = websiteId;
    const userId = req.user!.id;

    // If URL is provided instead of websiteId, get user's workspace and create/find website
    if (!websiteId && url) {
      // Get user's default workspace
      const { data: userWorkspace, error: workspaceError } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', userId)
        .limit(1)
        .single();

      if (workspaceError || !userWorkspace) {
        return res.status(400).json({
          success: false,
          message: 'User workspace not found. Please contact support.',
          timestamp: new Date().toISOString(),
        });
      }

      // Create or find website in user's workspace
      const { data: website, error: websiteError } = await supabase
        .from('websites')
        .insert({ url, workspace_id: userWorkspace.id })
        .select()
        .single();

      if (websiteError) {
        // Handle potential duplicate URL error
        if (websiteError.code === '23505') {
          const { data: existingWebsite, error: existingError } = await supabase
            .from('websites')
            .select('id')
            .eq('url', url)
            .eq('workspace_id', userWorkspace.id)
            .single();
          
          if (existingError) {
            throw existingError;
          }
          targetWebsiteId = existingWebsite.id;
        } else {
          throw websiteError;
        }
      } else {
        targetWebsiteId = website.id;
      }
    }

    if (!targetWebsiteId) {
      return res.status(400).json({
        success: false,
        message: 'Either websiteId or url must be provided',
        timestamp: new Date().toISOString(),
      });
    }

    const analysis = await createAnalysis(targetWebsiteId, userId);
    logger.info('Analysis created', { 
      analysisId: analysis.id, 
      websiteId: targetWebsiteId,
      userId 
    });

    // Get user's workspace (if not already retrieved for URL flow)
    let workspaceId;
    if (!websiteId && url) {
      // We already have the workspace from URL processing above
      const { data: userWorkspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', userId)
        .limit(1)
        .single();
      workspaceId = userWorkspace.id;
    } else {
      // For websiteId flow, get workspace from the website
      const { data: website } = await supabase
        .from('websites')
        .select('workspace_id')
        .eq('id', targetWebsiteId)
        .single();
      workspaceId = website.workspace_id;
    }

    await masterQueue.add('master-analysis-job', { 
      analysisId: analysis.id,
      workspaceId,
      websiteId: targetWebsiteId, 
      userId,
      url // Pass URL for both authenticated and public analyses
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

    // Get or create a system user and public workspace for unauthenticated analyses
    let publicWorkspace;
    
    // First, get or create a system user for public analyses
    let systemUser;
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'system@sitecraft.public')
      .single();

    if (existingUser) {
      systemUser = existingUser;
    } else {
      // Create system user if it doesn't exist
      const { data: { user }, error: userError } = await supabase.auth.admin.createUser({
        email: 'system@sitecraft.public',
        password: require('crypto').randomBytes(32).toString('hex'),
        email_confirm: true
      });

      if (userError) {
        logger.error('Failed to create system user', { error: userError });
        throw userError;
      }
      systemUser = { id: user.id };
    }

    // Now get or create the public workspace
    const { data: existingWorkspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('name', 'Public Analyses')
      .single();

    if (existingWorkspace) {
      publicWorkspace = existingWorkspace;
    } else {
      // Create public workspace with system user as owner
      const { data: newWorkspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({ 
          name: 'Public Analyses',
          owner_id: systemUser.id
        })
        .select()
        .single();

      if (workspaceError) {
        throw workspaceError;
      }
      publicWorkspace = newWorkspace;
    }

    // Create website record with public workspace
    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .insert({ url, workspace_id: publicWorkspace.id })
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

    await masterQueue.add('master-analysis-job', { 
      analysisId: analysis.id,
      workspaceId: publicWorkspace.id,
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
/**
 * @swagger
 * /api/analyses/recent:
 *   get:
 *     summary: Get recent analyses
 *     tags: [Analyses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Recent analyses
 */
router.get('/recent', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 10;

    // Get user's recent analyses
    const { data: analyses, error } = await supabase
      .from('analyses')
      .select(`
        id,
        status,
        overall_score,
        accessibility_score,
        seo_score,
        performance_score,
        created_at,
        completed_at,
        websites (
          id,
          url,
          name
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Recent analyses retrieved successfully',
      data: analyses || [],
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/analyses/stats:
 *   get:
 *     summary: Get analysis statistics
 *     tags: [Analyses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analysis statistics
 */
router.get('/stats', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;

    // Get analysis counts by status
    const { data: statusCounts, error: statusError } = await supabase
      .from('analyses')
      .select('status')
      .eq('user_id', userId);

    if (statusError) {
      throw statusError;
    }

    // Calculate stats
    const stats = {
      total: statusCounts?.length || 0,
      completed: statusCounts?.filter(a => a.status === 'completed').length || 0,
      processing: statusCounts?.filter(a => a.status === 'processing').length || 0,
      failed: statusCounts?.filter(a => a.status === 'failed').length || 0,
      pending: statusCounts?.filter(a => a.status === 'pending').length || 0
    };

    const response: ApiResponse = {
      success: true,
      message: 'Analysis statistics retrieved successfully',
      data: stats,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    logger.info('GET /:id route called', { analysisId: id, method: req.method, url: req.url });

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
      logger.error('Database error fetching analysis', { 
        error: analysisError, 
        analysisId: id,
        errorCode: analysisError.code 
      });
      
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

    if (!analysis) {
      logger.warn('Analysis not found in database', { analysisId: id });
      const response: ApiResponse = {
        success: false,
        message: 'Analysis not found',
        timestamp: new Date().toISOString(),
      };
      return res.status(404).json(response);
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