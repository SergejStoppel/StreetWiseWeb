import { Job, Worker } from 'bullmq';
import * as axe from 'axe-core';
import { JSDOM } from 'jsdom';
import { config } from '@/config';
import { createLogger } from '@/config/logger';
import { supabase } from '@/config/supabase';
import { AppError } from '@/types';
import { checkAndUpdateAnalysisCompletion } from '@/core/workers/master.worker';

const logger = createLogger('color-contrast-worker');

interface ColorContrastJobData {
  analysisId: string;
  workspaceId: string;
  websiteId: string;
  userId: string;
  assetPath: string;
  metadata: any;
}

interface AxeViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    html: string;
    target: string[];
    failureSummary?: string;
    any: Array<{
      id: string;
      message: string;
      data: any;
    }>;
  }>;
}

async function updateJobStatus(analysisId: string, moduleId: string, status: 'processing' | 'completed' | 'failed', errorMessage?: string) {
  const updateData: any = { 
    status,
    ...(status === 'processing' ? { started_at: new Date().toISOString() } : {}),
    ...(status === 'completed' || status === 'failed' ? { completed_at: new Date().toISOString() } : {}),
    ...(errorMessage ? { error_message: errorMessage } : {})
  };

  const { error } = await supabase
    .from('analysis_jobs')
    .update(updateData)
    .eq('analysis_id', analysisId)
    .eq('module_id', moduleId);

  if (error) {
    logger.error('Failed to update job status', { error, analysisId, moduleId, status });
  }
}

async function getRuleId(ruleKey: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('rules')
    .select('id')
    .eq('rule_key', ruleKey)
    .single();

  if (error || !data) {
    logger.warn('Rule not found in database', { ruleKey, error });
    return null;
  }

  return data.id;
}

async function getModuleAndJobId(analysisId: string): Promise<{ moduleId: string; jobId: string } | null> {
  // Get the accessibility module ID
  const { data: module, error: moduleError } = await supabase
    .from('analysis_modules')
    .select('id')
    .eq('name', 'Accessibility')
    .single();

  if (moduleError || !module) {
    logger.error('Accessibility module not found', { 
      error: moduleError,
      moduleError: moduleError?.message 
    });
    return null;
  }

  logger.info('Found Accessibility module', { moduleId: module.id });

  // Get the job ID for this analysis and module
  const { data: job, error: jobError } = await supabase
    .from('analysis_jobs')
    .select('id')
    .eq('analysis_id', analysisId)
    .eq('module_id', module.id)
    .single();

  if (jobError || !job) {
    logger.error('Analysis job not found', { 
      analysisId, 
      moduleId: module.id,
      error: jobError,
      jobError: jobError?.message,
      code: jobError?.code
    });
    
    // Let's also check what jobs exist for this analysis
    const { data: allJobs } = await supabase
      .from('analysis_jobs')
      .select('id, module_id, status')
      .eq('analysis_id', analysisId);
      
    logger.error('All jobs for this analysis', {
      analysisId,
      jobCount: allJobs?.length || 0,
      jobs: allJobs
    });
    
    return null;
  }

  logger.info('Found analysis job', { 
    analysisId, 
    moduleId: module.id, 
    jobId: job.id 
  });

  return { moduleId: module.id, jobId: job.id };
}

function mapAxeImpactToSeverity(impact: string): 'low' | 'medium' | 'high' | 'critical' {
  switch (impact) {
    case 'minor':
      return 'low';
    case 'moderate':
      return 'medium';
    case 'serious':
      return 'high';
    case 'critical':
      return 'critical';
    default:
      return 'medium';
  }
}

async function downloadHtmlFromStorage(workspaceId: string, analysisId: string): Promise<string> {
  const htmlPath = `${workspaceId}/${analysisId}/html/index.html`;
  
  const { data, error } = await supabase.storage
    .from('analysis_assets')
    .download(htmlPath);

  if (error || !data) {
    throw new AppError('Failed to download HTML from storage', 500, true, error);
  }

  // Convert blob to text
  const text = await data.text();
  return text;
}

export const colorContrastWorker = new Worker('color-contrast', async (job: Job<ColorContrastJobData>) => {
  const { analysisId, workspaceId, assetPath, metadata } = job.data;
  
  logger.info('Starting color contrast analysis', { 
    analysisId, 
    workspaceId,
    assetPath 
  });

  let moduleJobInfo: { moduleId: string; jobId: string } | null = null;

  try {
    // Get module and job IDs
    moduleJobInfo = await getModuleAndJobId(analysisId);
    if (!moduleJobInfo) {
      throw new AppError('Failed to get module and job information', 500);
    }

    // Update job status to processing
    await updateJobStatus(analysisId, moduleJobInfo.moduleId, 'processing');

    // Download HTML from storage
    logger.info('Downloading HTML from storage', { workspaceId, analysisId });
    const html = await downloadHtmlFromStorage(workspaceId, analysisId);

    // Create virtual DOM for axe-core
    const dom = new JSDOM(html, {
      url: metadata?.url || 'http://localhost',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    const { window } = dom;
    const { document } = window;

    // Configure axe-core to only run color contrast rules
    const axeConfig = {
      rules: {
        'color-contrast': { enabled: true },
        'color-contrast-enhanced': { enabled: true }
      },
      runOnly: ['color-contrast', 'color-contrast-enhanced']
    };

    // Run axe-core analysis
    logger.info('Running axe-core color contrast analysis');
    const results = await axe.run(document.documentElement, axeConfig);

    logger.info('Axe-core analysis complete', {
      violations: results.violations.length,
      passes: results.passes.length,
      incomplete: results.incomplete.length
    });

    // Process violations and store in database
    const issuePromises = [];

    for (const violation of results.violations as AxeViolation[]) {
      // Get the rule ID from our database
      const ruleId = await getRuleId(violation.id);
      
      if (!ruleId) {
        logger.warn('Skipping violation - rule not found in database', { 
          ruleKey: violation.id 
        });
        continue;
      }

      // Process each node that violated the rule
      for (const node of violation.nodes) {
        const issue = {
          analysis_job_id: moduleJobInfo.jobId,
          rule_id: ruleId,
          severity: mapAxeImpactToSeverity(violation.impact),
          location_path: node.target.join(' > '),
          code_snippet: node.html,
          message: node.failureSummary || violation.help,
          fix_suggestion: `${violation.description}\n\nHow to fix:\n${violation.help}\n\nFor more information: ${violation.helpUrl}`
        };

        issuePromises.push(
          supabase
            .from('accessibility_issues')
            .insert([issue])
            .then(({ error }) => {
              if (error) {
                logger.error('Failed to insert accessibility issue', { 
                  error, 
                  ruleId: violation.id 
                });
              }
            })
        );
      }
    }

    // Wait for all issues to be inserted
    await Promise.all(issuePromises);

    // Update job status to completed
    await updateJobStatus(analysisId, moduleJobInfo.moduleId, 'completed');

    logger.info('Color contrast analysis completed successfully', {
      analysisId,
      violationsFound: results.violations.length,
      issuesCreated: issuePromises.length
    });

    // Check if all analysis jobs are complete
    await checkAndUpdateAnalysisCompletion(analysisId);

    // Clean up
    dom.window.close();

    return {
      success: true,
      violationsFound: results.violations.length,
      passesFound: results.passes.length,
      incompleteFound: results.incomplete.length
    };

  } catch (error) {
    logger.error('Error in color contrast worker', {
      error: error.message,
      stack: error.stack,
      analysisId,
      workspaceId
    });

    // Update job status to failed
    if (moduleJobInfo) {
      await updateJobStatus(analysisId, moduleJobInfo.moduleId, 'failed', error.message);
    }

    // Check if all analysis jobs are complete (even with failures)
    await checkAndUpdateAnalysisCompletion(analysisId);

    throw error;
  }
}, {
  connection: {
    host: config.redis.host,
    port: config.redis.port,
  },
  concurrency: 5, // Can process multiple analyses concurrently
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing color contrast worker...');
  await colorContrastWorker.close();
});