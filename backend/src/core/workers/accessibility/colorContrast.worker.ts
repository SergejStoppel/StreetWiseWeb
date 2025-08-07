import { Job, Worker } from 'bullmq';
import puppeteer, { Browser, Page } from 'puppeteer';
import * as axe from 'axe-core';
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

async function updateJobStatus(analysisId: string, moduleId: string, status: 'running' | 'completed' | 'failed', errorMessage?: string) {
  const updateData: any = { 
    status,
    ...(status === 'running' ? { started_at: new Date().toISOString() } : {}),
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
      jobError: jobError?.message
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

function mapAxeImpactToSeverity(impact: string): 'minor' | 'moderate' | 'serious' | 'critical' {
  switch (impact) {
    case 'minor':
      return 'minor';
    case 'moderate':
      return 'moderate';
    case 'serious':
      return 'serious';
    case 'critical':
      return 'critical';
    default:
      return 'moderate';
  }
}

async function getTargetUrl(websiteId: string, metadata: any): Promise<string> {
  // Try to get URL from metadata first
  if (metadata?.url) {
    return metadata.url;
  }

  // Otherwise, get from database
  const { data: website, error } = await supabase
    .from('websites')
    .select('url')
    .eq('id', websiteId)
    .single();
    
  if (error || !website) {
    throw new AppError('Website not found', 404);
  }
  
  return website.url;
}

export const colorContrastWorker = new Worker('color-contrast', async (job: Job<ColorContrastJobData>) => {
  const { analysisId, workspaceId, websiteId, metadata } = job.data;
  
  logger.info('Starting color contrast analysis with live DOM', { 
    analysisId, 
    workspaceId
  });

  let moduleJobInfo: { moduleId: string; jobId: string } | null = null;
  let browser: Browser | null = null;

  try {
    // Get module and job IDs
    moduleJobInfo = await getModuleAndJobId(analysisId);
    if (!moduleJobInfo) {
      throw new AppError('Failed to get module and job information', 500);
    }

    // Update job status to running
    await updateJobStatus(analysisId, moduleJobInfo.moduleId, 'running');

    // Get the target URL
    const targetUrl = await getTargetUrl(websiteId, metadata);
    logger.info('Analyzing URL for accessibility', { targetUrl });

    // Launch browser with optimized settings
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote'
      ],
      timeout: 30000
    });

    const page = await browser.newPage();
    
    // Configure page settings
    await page.setDefaultTimeout(15000);
    await page.setDefaultNavigationTimeout(15000);
    
    // Set viewport for desktop analysis
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate to the page
    logger.info('Navigating to target URL for accessibility analysis');
    
    try {
      await page.goto(targetUrl, { 
        waitUntil: 'networkidle2',
        timeout: 20000
      });
    } catch (navigationError) {
      logger.warn('Initial navigation failed, retrying', { 
        error: navigationError.message,
        targetUrl 
      });
      
      // Retry with simpler settings
      await page.goto(targetUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });
      
      // Wait for content to be rendered
      await page.waitForTimeout(3000);
    }

    // Inject axe-core into the page
    logger.info('Injecting axe-core for analysis');
    await page.addScriptTag({
      path: require.resolve('axe-core')
    });

    // Wait for axe to be available
    await page.waitForFunction(() => typeof (window as any).axe !== 'undefined', { timeout: 10000 });
    logger.info('Axe-core loaded successfully');

    // Run axe-core analysis focusing on color contrast
    logger.info('Running axe-core color contrast analysis on live DOM');
    const results = await page.evaluate(() => {
      // Configure axe to only run color contrast rules
      const axeConfig = {
        rules: {
          'color-contrast': { enabled: true },
          'color-contrast-enhanced': { enabled: true },
          'link-in-text-block': { enabled: true }
        },
        runOnly: ['color-contrast', 'color-contrast-enhanced', 'link-in-text-block']
      };

      // Run axe analysis
      return (window as any).axe.run(document, axeConfig);
    });

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
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}, {
  connection: {
    host: config.redis.host,
    port: config.redis.port,
  },
  concurrency: 3, // Can process multiple analyses concurrently
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: 10,
    removeOnFail: 10
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing color contrast worker...');
  await colorContrastWorker.close();
});