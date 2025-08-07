import express from 'express';
import { supabase } from '@/config/supabase';
import { createLogger } from '@/config/logger';

const router = express.Router();
const logger = createLogger('debug-route');

// Diagnostic endpoint to check analysis pipeline health
router.get('/analysis-pipeline', async (req, res) => {
  try {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      checks: {}
    };

    // Check 1: Analysis modules exist
    const { data: modules, error: modulesError } = await supabase
      .from('analysis_modules')
      .select('id, name, description');

    diagnostics.checks.modules = {
      status: modulesError ? 'error' : 'success',
      error: modulesError?.message,
      data: modules || [],
      count: modules?.length || 0
    };

    // Check 2: Recent analyses
    const { data: analyses, error: analysesError } = await supabase
      .from('analyses')
      .select('id, status, created_at, completed_at')
      .order('created_at', { ascending: false })
      .limit(5);

    diagnostics.checks.recentAnalyses = {
      status: analysesError ? 'error' : 'success',
      error: analysesError?.message,
      data: analyses || [],
      count: analyses?.length || 0
    };

    // Check 3: Analysis jobs for the latest analysis
    if (analyses && analyses.length > 0) {
      const latestAnalysisId = analyses[0].id;
      
      const { data: jobs, error: jobsError } = await supabase
        .from('analysis_jobs')
        .select(`
          id, 
          module_id, 
          status, 
          error_message,
          started_at,
          completed_at,
          analysis_modules (name)
        `)
        .eq('analysis_id', latestAnalysisId);

      diagnostics.checks.latestAnalysisJobs = {
        status: jobsError ? 'error' : 'success',
        error: jobsError?.message,
        analysisId: latestAnalysisId,
        data: jobs || [],
        count: jobs?.length || 0
      };
    }

    // Check 4: Storage bucket access
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    diagnostics.checks.storageBuckets = {
      status: bucketsError ? 'error' : 'success',
      error: bucketsError?.message,
      buckets: buckets?.map(b => b.name) || []
    };

    // Check 5: Sample storage files (if any analyses exist)
    if (analyses && analyses.length > 0) {
      try {
        const { data: files, error: filesError } = await supabase.storage
          .from('analysis-assets')
          .list('', { limit: 10 });

        diagnostics.checks.storageFiles = {
          status: filesError ? 'error' : 'success',
          error: filesError?.message,
          sampleFiles: files?.slice(0, 5).map(f => ({
            name: f.name,
            size: f.metadata?.size,
            lastModified: f.updated_at
          })) || []
        };
      } catch (storageError) {
        diagnostics.checks.storageFiles = {
          status: 'error',
          error: 'Storage access failed: ' + storageError.message
        };
      }
    }

    // Check 6: Rules data
    const { data: rules, error: rulesError } = await supabase
      .from('rules')
      .select('id, rule_key, name, module_id')
      .limit(10);

    diagnostics.checks.sampleRules = {
      status: rulesError ? 'error' : 'success',
      error: rulesError?.message,
      count: rules?.length || 0,
      sample: rules?.slice(0, 3) || []
    };

    // Overall health assessment
    const hasErrors = Object.values(diagnostics.checks).some((check: any) => check.status === 'error');
    diagnostics.overallHealth = hasErrors ? 'unhealthy' : 'healthy';

    res.json({
      success: true,
      data: diagnostics
    });

  } catch (error) {
    logger.error('Debug endpoint error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to run diagnostics',
      error: error.message
    });
  }
});

export default router;