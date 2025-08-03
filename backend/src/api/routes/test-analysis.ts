import express from 'express';
import { supabase } from '@/config/supabase';
import { createLogger } from '@/config/logger';

const router = express.Router();
const logger = createLogger('test-analysis');

// Test endpoint to check latest analysis details
router.get('/latest', async (req, res) => {
  try {
    // Get the most recent analysis
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select(`
        id,
        status,
        created_at,
        completed_at,
        websites (url),
        analysis_jobs (
          id,
          module_id,
          status,
          error_message,
          started_at,
          completed_at,
          analysis_modules (name)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (analysisError) {
      return res.status(404).json({
        success: false,
        message: 'No analysis found',
        error: analysisError.message
      });
    }

    // Get issues for this analysis
    const jobIds = analysis.analysis_jobs.map(job => job.id);
    
    const [accessibilityIssues, seoIssues, performanceIssues] = await Promise.all([
      supabase
        .from('accessibility_issues')
        .select('*')
        .in('analysis_job_id', jobIds),
      supabase
        .from('seo_issues')
        .select('*')
        .in('analysis_job_id', jobIds),
      supabase
        .from('performance_issues')
        .select('*')
        .in('analysis_job_id', jobIds)
    ]);

    // Check storage assets
    const assetPath = `${analysis.id}`;
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('analysis_assets')
      .list(assetPath, { limit: 100 });

    const result = {
      analysis: {
        id: analysis.id,
        status: analysis.status,
        url: analysis.websites?.url,
        created_at: analysis.created_at,
        completed_at: analysis.completed_at
      },
      jobs: analysis.analysis_jobs.map(job => ({
        module: job.analysis_modules?.name,
        status: job.status,
        error: job.error_message,
        started_at: job.started_at,
        completed_at: job.completed_at
      })),
      issues: {
        accessibility: {
          count: accessibilityIssues.data?.length || 0,
          error: accessibilityIssues.error?.message
        },
        seo: {
          count: seoIssues.data?.length || 0,
          error: seoIssues.error?.message
        },
        performance: {
          count: performanceIssues.data?.length || 0,
          error: performanceIssues.error?.message
        }
      },
      storage: {
        files: storageFiles?.map(f => ({
          name: f.name,
          size: f.metadata?.size,
          updated_at: f.updated_at
        })) || [],
        error: storageError?.message
      }
    };

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Test analysis endpoint error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get analysis details',
      error: error.message
    });
  }
});

export default router;