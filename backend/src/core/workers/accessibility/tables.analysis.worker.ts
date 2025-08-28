/**
 * Tables Analysis BullMQ Worker
 * Consumes jobs from tables-analysis queue and runs TablesAnalysisWorker
 */

import { Job, Worker } from 'bullmq';
import puppeteer from 'puppeteer';
import { config } from '@/config';
import { createLogger } from '@/config/logger';
import { supabase } from '@/config/supabase';
import { TablesAnalysisWorker } from './tables.worker';
import { checkAndUpdateAnalysisCompletion } from '../master.worker';

const logger = createLogger('tables-analysis-worker');

interface TablesJobData {
  analysisId: string;
  workspaceId: string;
  websiteId: string;
  userId: string;
  assetPath: string;
  metadata: any;
}

async function processTablesAnalysis(job: Job<TablesJobData>) {
  const { analysisId, workspaceId, websiteId, userId, assetPath, metadata } = job.data;
  
  logger.info('Starting tables analysis', { 
    analysisId, 
    workspaceId, 
    websiteId,
    assetPath 
  });

  let browser: puppeteer.Browser | null = null;
  let page: puppeteer.Page | null = null;
  let analysisJobId: string | null = null;

  try {
    // Get the module and job ID
    const { data: module } = await supabase
      .from('analysis_modules')
      .select('id')
      .eq('name', 'Accessibility')
      .single();

    if (module) {
      // Get the specific job ID for this analysis
      const { data: analysisJob } = await supabase
        .from('analysis_jobs')
        .select('id')
        .eq('analysis_id', analysisId)
        .eq('module_id', module.id)
        .single();

      if (analysisJob) {
        analysisJobId = analysisJob.id;
        
        // Update job status to processing
        await supabase
          .from('analysis_jobs')
          .update({ 
            status: 'processing',
            started_at: new Date().toISOString()
          })
          .eq('id', analysisJobId);
      }
    }

    // Launch browser and load the saved HTML
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    page = await browser.newPage();
    
    // Load the HTML content from Supabase Storage
    const htmlPath = `${assetPath}/html/index.html`;
    let storedHtml: string | null = null;
    
    try {
      const { data, error } = await supabase.storage
        .from('analysis-assets')
        .download(htmlPath);
      
      if (!error && data) {
        storedHtml = await (data as any).text();
        logger.info('Retrieved HTML from storage for tables analysis', { analysisId, htmlPath });
      } else {
        logger.warn('Failed to retrieve HTML from storage', { error, analysisId, htmlPath });
      }
    } catch (error) {
      logger.error('Error downloading HTML from storage', { error, analysisId, htmlPath });
    }
    
    // Load content into page
    if (storedHtml) {
      await page.setContent(storedHtml, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      logger.info('HTML content loaded for tables analysis', { analysisId });
    } else {
      throw new Error('Unable to load HTML content for analysis');
    }

    // Run tables accessibility analysis
    const tablesWorker = new TablesAnalysisWorker(page);
    const issues = await tablesWorker.analyze();

    logger.info('Tables analysis completed', { 
      analysisId, 
      issuesFound: issues.length 
    });

    // Store issues in database
    if (issues.length > 0 && analysisJobId) {
      const { error: insertError } = await supabase
        .from('accessibility_issues')
        .insert(
          issues.map(issue => ({
            analysis_job_id: analysisJobId,
            rule_id: issue.rule_id,
            severity: issue.severity,
            message: issue.message,
            location_path: issue.element_selector,  // CSS selector
            code_snippet: issue.element_html,        // HTML content
            dom_path: issue.location_path,           // DOM hierarchy path
            wcag_criteria: issue.wcag_criteria,      // WCAG criteria
            fix_suggestion: issue.fix_suggestion
          }))
        );

      if (insertError) {
        logger.error('Failed to store tables analysis issues', {
          error: insertError,
          analysisId,
          issuesCount: issues.length
        });
        throw insertError;
      }
    }

    // Update job status to completed
    if (analysisJobId) {
      await supabase
        .from('analysis_jobs')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', analysisJobId);
    }

    logger.info('Tables analysis job completed successfully', { 
      analysisId,
      issuesStored: issues.length 
    });

    // Check if all analysis jobs are complete
    await checkAndUpdateAnalysisCompletion(analysisId);

    return {
      success: true,
      analysisId,
      issuesFound: issues.length
    };

  } catch (error) {
    logger.error('Tables analysis job failed', { 
      error: error.message,
      stack: error.stack,
      analysisId 
    });

    // Update job status to failed
    if (analysisJobId) {
      await supabase
        .from('analysis_jobs')
        .update({ 
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', analysisJobId);
    } else {
      // If we don't have a job ID, try to get it to update the status
      const { data: module } = await supabase
        .from('analysis_modules')
        .select('id')
        .eq('name', 'Accessibility')
        .single();
        
      if (module) {
        const { data: analysisJob } = await supabase
          .from('analysis_jobs')
          .select('id')
          .eq('analysis_id', analysisId)
          .eq('module_id', module.id)
          .single();
          
        if (analysisJob) {
          await supabase
            .from('analysis_jobs')
            .update({ 
              status: 'failed',
              error_message: error.message,
              completed_at: new Date().toISOString()
            })
            .eq('id', analysisJob.id);
        }
      }
    }

    throw error;
  } finally {
    // Cleanup
    if (page) {
      await page.close();
    }
    if (browser) {
      await browser.close();
    }
  }
}

// Create and export the worker
export const tablesAnalysisWorker = new Worker(
  'tables-analysis',
  processTablesAnalysis,
  {
    connection: config.redis,
    concurrency: 2,
    removeOnComplete: 20,
    removeOnFail: 50,
  }
);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing tables analysis worker...');
  await tablesAnalysisWorker.close();
});