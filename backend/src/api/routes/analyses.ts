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
 * Helper function to generate signed URLs for screenshots
 * @param screenshots - Array of screenshot objects with storage_bucket and storage_path
 * @returns Array of screenshots with added signed_url field
 */
async function addSignedUrlsToScreenshots(screenshots: any[]) {
  if (!screenshots || screenshots.length === 0) {
    return screenshots;
  }

  const screenshotsWithUrls = await Promise.all(
    screenshots.map(async (screenshot) => {
      try {
        const { data, error } = await supabase.storage
          .from(screenshot.storage_bucket)
          .createSignedUrl(screenshot.storage_path, 3600); // 1 hour expiry

        if (error) {
          logger.error('Failed to generate signed URL for screenshot', {
            error,
            bucket: screenshot.storage_bucket,
            path: screenshot.storage_path
          });
          return screenshot;
        }

        return {
          ...screenshot,
          signed_url: data.signedUrl
        };
      } catch (err) {
        logger.error('Exception generating signed URL', { err });
        return screenshot;
      }
    })
  );

  return screenshotsWithUrls;
}

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
    const { data: existingUsers } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'system@sitecraft.public')
      .limit(1);

    const existingUser = existingUsers?.[0];

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
    const { data: existingWorkspaces } = await supabase
      .from('workspaces')
      .select('id')
      .eq('name', 'Public Analyses')
      .limit(1);

    const existingWorkspace = existingWorkspaces?.[0];

    if (existingWorkspace) {
      publicWorkspace = existingWorkspace;
    } else {
      // Create public workspace with system user as owner
      const { data: newWorkspaces, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          name: 'Public Analyses',
          owner_id: systemUser.id
        })
        .select();

      const newWorkspace = newWorkspaces?.[0];

      if (workspaceError) {
        throw workspaceError;
      }
      publicWorkspace = newWorkspace;
    }

    // Check for existing analysis within last 24 hours (rate limiting for public analyses)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: recentAnalyses, error: recentAnalysisError } = await supabase
      .from('analyses')
      .select(`
        id,
        status,
        created_at,
        websites!inner(url)
      `)
      .eq('websites.url', url)
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!recentAnalysisError && recentAnalyses && recentAnalyses.length > 0) {
      const recentAnalysis = recentAnalyses[0];
      logger.info('Found recent analysis within 24 hours', {
        analysisId: recentAnalysis.id,
        url,
        createdAt: recentAnalysis.created_at
      });

      // Return the existing analysis
      const response: ApiResponse = {
        success: true,
        message: 'This website was recently analyzed. Returning existing analysis to prevent duplicate processing.',
        data: {
          ...recentAnalysis,
          isReused: true,
          originalCreatedAt: recentAnalysis.created_at
        },
        timestamp: new Date().toISOString(),
      };
      return res.status(200).json(response);
    }

    // Create website record with public workspace
    let { data: websites, error: websiteError } = await supabase
      .from('websites')
      .insert({ url, workspace_id: publicWorkspace.id })
      .select();
      
    let website = websites?.[0];

    if (websiteError) {
      // Handle potential duplicate URL error gracefully
      if (websiteError.code === '23505') {
        const { data: existingWebsites, error: existingWebsiteError } = await supabase
          .from('websites')
          .select('id')
          .eq('url', url)
          .eq('workspace_id', publicWorkspace.id)
          .limit(1);
          
        const existingWebsite = existingWebsites?.[0];
        if (existingWebsiteError) throw existingWebsiteError;
        website = existingWebsite;
      } else {
        throw websiteError;
      }
    }

    if (!website || !website.id) {
      logger.error('Website creation/retrieval failed', { website, url });
      return res.status(500).json({
        success: false,
        message: 'Failed to create or retrieve website record',
        timestamp: new Date().toISOString(),
      });
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
          url
        ),
        screenshots (
          id,
          type,
          storage_bucket,
          storage_path,
          url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    // Generate signed URLs for screenshots in each analysis
    const analysesWithSignedUrls = await Promise.all(
      (analyses || []).map(async (analysis) => ({
        ...analysis,
        screenshots: await addSignedUrlsToScreenshots(analysis.screenshots || [])
      }))
    );

    const response: ApiResponse = {
      success: true,
      message: 'Recent analyses retrieved successfully',
      data: analysesWithSignedUrls,
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
          url
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

    // Calculate total issues for summary
    const totalAccessibilityIssues = accessibilityIssues?.length || 0;
    const totalSeoIssues = seoIssues?.length || 0;
    const totalPerformanceIssues = performanceIssues?.length || 0;

    // Improved scoring algorithm that groups similar issues
    const calculateImprovedScore = (issues, type) => {
      if (!issues || issues.length === 0) return 100;
      
      // Group issues primarily by rule for better consolidation
      const groupedIssues = new Map();
      
      issues.forEach(issue => {
        const ruleKey = issue.rules?.rule_key || 'unknown';
        const ruleName = issue.rules?.name || 'Unknown Rule';
        const severity = issue.severity;
        
        // Create a key that groups by rule and severity (not message)
        const groupKey = `${ruleKey}:${severity}`;
        
        if (!groupedIssues.has(groupKey)) {
          groupedIssues.set(groupKey, {
            rule: issue.rules,
            message: issue.message, // Use first message as representative
            severity: issue.severity,
            occurrences: []
          });
        }
        
        groupedIssues.get(groupKey).occurrences.push({
          location: issue.location_path,
          code: issue.code_snippet,
          fix: issue.fix_suggestion,
          message: issue.message // Keep individual messages for each occurrence
        });
      });
      
      // Calculate score based on unique issue groups, not total count
      let totalDeduction = 0;
      
      groupedIssues.forEach(group => {
        const occurrenceCount = group.occurrences.length;
        let baseDeduction;
        
        // Base deduction per unique issue type
        switch (group.severity) {
          case 'critical': baseDeduction = 15; break;
          case 'serious': baseDeduction = 10; break;
          case 'moderate': baseDeduction = 6; break;
          case 'minor': baseDeduction = 3; break;
          default: baseDeduction = 5; break;
        }
        
        // Add small penalty for multiple occurrences (logarithmic to avoid over-penalizing)
        const occurrencePenalty = occurrenceCount > 1 ? Math.log2(occurrenceCount) : 0;
        const totalDeductionForGroup = baseDeduction + occurrencePenalty;
        
        totalDeduction += totalDeductionForGroup;
      });
      
      return Math.max(0, Math.round(100 - totalDeduction));
    };

    const accessibilityScore = calculateImprovedScore(accessibilityIssues, 'accessibility');
    const seoScore = calculateImprovedScore(seoIssues, 'seo');
    const performanceScore = calculateImprovedScore(performanceIssues, 'performance');
    const overallScore = Math.round((accessibilityScore + seoScore + performanceScore) / 3);

    // Update scores in database when we have issues to score (regardless of analysis status)
    // This ensures real-time score updates and allows recalculation when new issues are found
    const shouldUpdateScores = (
      (accessibilityIssues && accessibilityIssues.length > 0) ||
      (seoIssues && seoIssues.length > 0) ||
      (performanceIssues && performanceIssues.length > 0) ||
      analysis.status === 'completed'
    );

    if (shouldUpdateScores) {
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

    // Group issues for better display
    const groupIssues = (issues) => {
      if (!issues || issues.length === 0) return [];
      
      const groupedIssues = new Map();
      
      issues.forEach(issue => {
        const ruleKey = issue.rules?.rule_key || 'unknown';
        const severity = issue.severity;
        
        // Group by rule and severity for better consolidation
        const groupKey = `${ruleKey}:${severity}`;
        
        if (!groupedIssues.has(groupKey)) {
          groupedIssues.set(groupKey, {
            id: groupKey,
            rule: issue.rules,
            message: issue.message, // Use first message as representative
            severity: issue.severity,
            description: issue.rules?.description,
            occurrences: [],
            count: 0
          });
        }
        
        const group = groupedIssues.get(groupKey);
        group.occurrences.push({
          location: issue.location_path,
          code: issue.code_snippet,
          fix: issue.fix_suggestion,
          message: issue.message, // Keep individual messages for each occurrence
          original_issue: issue
        });
        group.count = group.occurrences.length;
      });
      
      return Array.from(groupedIssues.values()).sort((a, b) => {
        const severityOrder = { critical: 4, serious: 3, moderate: 2, minor: 1 };
        return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
      });
    };

    // Generate signed URLs for screenshots
    const screenshotsWithSignedUrls = await addSignedUrlsToScreenshots(analysis.screenshots);

    // Prepare response data
    const responseData = {
      ...analysis,
      screenshots: screenshotsWithSignedUrls,
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
      groupedIssues: {
        accessibility: groupIssues(accessibilityIssues),
        seo: groupIssues(seoIssues),
        performance: groupIssues(performanceIssues)
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

/**
 * @swagger
 * /api/analyses/{id}:
 *   delete:
 *     summary: Delete analysis with all related data and assets
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
 *         description: Analysis deleted successfully
 *       404:
 *         description: Analysis not found
 *       403:
 *         description: Unauthorized to delete this analysis
 */
router.delete('/:id', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    logger.info('Starting analysis deletion', { analysisId: id, userId });

    // First, verify the analysis exists and belongs to the user
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select(`
        *,
        websites (
          id,
          workspace_id,
          workspaces (
            owner_id
          )
        )
      `)
      .eq('id', id)
      .single();

    if (analysisError || !analysis) {
      logger.warn('Analysis not found for deletion', { analysisId: id, error: analysisError });
      const response: ApiResponse = {
        success: false,
        message: 'Analysis not found',
        timestamp: new Date().toISOString(),
      };
      return res.status(404).json(response);
    }

    // Check if user owns the analysis (either directly or through workspace)
    const userOwnsAnalysis = analysis.user_id === userId || 
      analysis.websites?.workspaces?.owner_id === userId;

    if (!userOwnsAnalysis) {
      logger.warn('Unauthorized deletion attempt', { 
        analysisId: id, 
        userId, 
        analysisUserId: analysis.user_id,
        workspaceOwnerId: analysis.websites?.workspaces?.owner_id 
      });
      const response: ApiResponse = {
        success: false,
        message: 'Unauthorized to delete this analysis',
        timestamp: new Date().toISOString(),
      };
      return res.status(403).json(response);
    }

    logger.info('User authorized to delete analysis', { analysisId: id, userId });

    // Get all analysis jobs for this analysis to clean up related data
    const { data: analysisJobs, error: jobsError } = await supabase
      .from('analysis_jobs')
      .select('id')
      .eq('analysis_id', id);

    if (jobsError) {
      logger.error('Failed to get analysis jobs', { error: jobsError, analysisId: id });
    }

    const jobIds = analysisJobs?.map(job => job.id) || [];
    logger.info('Found analysis jobs to clean up', { analysisId: id, jobCount: jobIds.length });

    // Delete related data in correct order (foreign key constraints)
    const deletionSteps = [];

    // 1. Delete accessibility issues
    if (jobIds.length > 0) {
      deletionSteps.push(
        supabase
          .from('accessibility_issues')
          .delete()
          .in('analysis_job_id', jobIds)
      );
    }

    // 2. Delete SEO issues
    if (jobIds.length > 0) {
      deletionSteps.push(
        supabase
          .from('seo_issues')
          .delete()
          .in('analysis_job_id', jobIds)
      );
    }

    // 3. Delete performance issues
    if (jobIds.length > 0) {
      deletionSteps.push(
        supabase
          .from('performance_issues')
          .delete()
          .in('analysis_job_id', jobIds)
      );
    }

    // 4. Delete screenshots and their storage files
    const { data: screenshots } = await supabase
      .from('screenshots')
      .select('storage_bucket, storage_path')
      .eq('analysis_id', id);

    if (screenshots && screenshots.length > 0) {
      logger.info('Deleting screenshots from storage', { 
        analysisId: id, 
        screenshotCount: screenshots.length 
      });

      // Delete files from storage
      for (const screenshot of screenshots) {
        try {
          const { error: storageError } = await supabase.storage
            .from(screenshot.storage_bucket)
            .remove([screenshot.storage_path]);
          
          if (storageError) {
            logger.warn('Failed to delete screenshot from storage', { 
              error: storageError, 
              path: screenshot.storage_path 
            });
          }
        } catch (storageErr) {
          logger.warn('Storage deletion error', { error: storageErr, path: screenshot.storage_path });
        }
      }

      // Delete screenshot records
      deletionSteps.push(
        supabase
          .from('screenshots')
          .delete()
          .eq('analysis_id', id)
      );
    }

    // 5. Delete analysis assets from storage (metadata, etc.)
    if (analysis.websites?.workspace_id) {
      const assetPath = `${analysis.websites.workspace_id}/${id}`;
      
      try {
        // List all files in the analysis folder
        const { data: files, error: listError } = await supabase.storage
          .from('analysis-assets')
          .list(`${analysis.websites.workspace_id}/${id}`);

        if (!listError && files && files.length > 0) {
          const filePaths = files.map(file => `${assetPath}/${file.name}`);
          logger.info('Deleting analysis assets from storage', { 
            analysisId: id, 
            assetCount: filePaths.length 
          });

          const { error: storageError } = await supabase.storage
            .from('analysis-assets')
            .remove(filePaths);

          if (storageError) {
            logger.warn('Failed to delete some analysis assets', { error: storageError });
          }
        }
      } catch (storageErr) {
        logger.warn('Failed to clean up analysis assets', { error: storageErr, assetPath });
      }
    }

    // 6. Delete analysis jobs
    if (jobIds.length > 0) {
      deletionSteps.push(
        supabase
          .from('analysis_jobs')
          .delete()
          .eq('analysis_id', id)
      );
    }

    // 7. Finally, delete the analysis record
    deletionSteps.push(
      supabase
        .from('analyses')
        .delete()
        .eq('id', id)
    );

    // Execute all deletion steps
    logger.info('Executing deletion steps', { analysisId: id, stepCount: deletionSteps.length });
    
    const results = await Promise.allSettled(deletionSteps);
    const failures = results.filter(result => result.status === 'rejected');
    
    if (failures.length > 0) {
      logger.error('Some deletion steps failed', { 
        analysisId: id, 
        failures: failures.map(f => f.reason) 
      });
      // Continue anyway - partial cleanup is better than none
    }

    logger.info('Analysis deletion completed', { 
      analysisId: id, 
      userId,
      stepCount: deletionSteps.length,
      failureCount: failures.length 
    });

    const response: ApiResponse = {
      success: true,
      message: 'Analysis and all related data deleted successfully',
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Error deleting analysis', { 
      error: error.message, 
      analysisId: req.params.id,
      userId: req.user?.id 
    });
    next(error);
  }
});

export default router;