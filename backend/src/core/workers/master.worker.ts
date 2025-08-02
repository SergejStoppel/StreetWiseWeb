import { Job, Worker, Queue } from 'bullmq';
import { config } from '@/config';
import { createLogger } from '@/config/logger';
import { supabase } from '@/config/supabase';
import { fetcherQueue } from '@/lib/queue/fetcher';
import { colorContrastQueue } from '@/lib/queue/colorContrast';
import { AppError } from '@/types';

const logger = createLogger('master-worker');

interface MasterJobData {
  analysisId: string;
  workspaceId: string;
  websiteId: string;
  userId: string;
  url?: string; // For public analyses
}

interface FetcherResult {
  success: boolean;
  assetPath: string;
  metadata: any;
}

// Queue instances for all analyzer workers
const analyzerQueues = {
  colorContrast: colorContrastQueue,
  // TODO: Add other analyzer queues as they are implemented
  // aria: ariaQueue,
  // forms: formsQueue,
  // keyboard: keyboardQueue,
  // altText: altTextQueue,
  // technicalSeo: technicalSeoQueue,
  // onPageSeo: onPageSeoQueue,
  // metaTags: metaTagsQueue,
  // structuredData: structuredDataQueue,
  // imageOptimization: imageOptimizationQueue,
  // coreWebVitals: coreWebVitalsQueue,
  // resourceLoading: resourceLoadingQueue,
  // aiSummary: aiSummaryQueue
};

async function createAnalysisJob(analysisId: string, moduleId: string) {
  const { error } = await supabase
    .from('analysis_jobs')
    .insert([{
      analysis_id: analysisId,
      module_id: moduleId,
      status: 'pending'
    }]);

  if (error) {
    logger.error('Failed to create analysis job record', { error, analysisId, moduleId });
  }
}

async function waitForFetcherCompletion(fetcherJobId: string): Promise<FetcherResult> {
  const fetcherJob = await fetcherQueue.getJob(fetcherJobId);
  
  if (!fetcherJob) {
    throw new AppError('Fetcher job not found', 500);
  }

  // Wait for the fetcher job to complete
  const result = await fetcherJob.waitUntilFinished(fetcherQueue.events);
  
  if (!result || !result.success) {
    throw new AppError('Fetcher job failed', 500);
  }

  return result as FetcherResult;
}

export const masterWorker = new Worker('master-analysis', async (job: Job<MasterJobData>) => {
  const { analysisId, workspaceId, websiteId, userId, url } = job.data;
  
  logger.info('Starting master analysis job', { 
    analysisId, 
    workspaceId, 
    websiteId,
    userId,
    hasUrl: !!url 
  });

  try {
    // Step 1: Create analysis job records for all modules
    const { data: modules } = await supabase
      .from('analysis_modules')
      .select('id, name');

    if (modules) {
      for (const module of modules) {
        await createAnalysisJob(analysisId, module.id);
      }
    }

    // Step 2: Enqueue fetcher job and wait for completion
    logger.info('Enqueuing fetcher job', { analysisId });
    
    const fetcherJob = await fetcherQueue.add('fetch-website', {
      analysisId,
      workspaceId,
      websiteId,
      userId,
      url
    }, {
      removeOnComplete: false, // Keep job for debugging
      removeOnFail: false
    });

    logger.info('Waiting for fetcher to complete', { 
      analysisId, 
      fetcherJobId: fetcherJob.id 
    });

    // Wait for fetcher to complete and get the asset path
    let fetcherResult: FetcherResult;
    try {
      fetcherResult = await waitForFetcherCompletion(fetcherJob.id!);
    } catch (error) {
      logger.error('Fetcher job failed', { 
        error: error.message, 
        analysisId,
        fetcherJobId: fetcherJob.id 
      });
      
      // Update analysis status to failed
      await supabase
        .from('analyses')
        .update({ status: 'failed' })
        .eq('id', analysisId);
        
      throw error;
    }

    logger.info('Fetcher completed successfully', { 
      analysisId, 
      assetPath: fetcherResult.assetPath 
    });

    // Step 3: Enqueue all analyzer jobs in parallel
    const analyzerJobPromises = [];
    
    for (const [analyzerName, queue] of Object.entries(analyzerQueues)) {
      logger.info(`Enqueuing ${analyzerName} analyzer`, { analysisId });
      
      const jobPromise = queue.add(`analyze-${analyzerName}`, {
        analysisId,
        workspaceId,
        websiteId,
        userId,
        assetPath: fetcherResult.assetPath,
        metadata: fetcherResult.metadata
      });
      
      analyzerJobPromises.push(jobPromise);
    }

    // Wait for all analyzer jobs to be enqueued
    await Promise.all(analyzerJobPromises);

    logger.info('All analyzer jobs enqueued successfully', { 
      analysisId,
      analyzerCount: analyzerJobPromises.length 
    });

    // Note: We don't wait for analyzers to complete here
    // Each analyzer will update its own status and the analysis status
    // will be updated by a separate process or the final AI summary worker

    return {
      success: true,
      analysisId,
      assetPath: fetcherResult.assetPath,
      analyzersEnqueued: Object.keys(analyzerQueues).length
    };

  } catch (error) {
    logger.error('Error in master worker', { 
      error: error.message,
      stack: error.stack,
      analysisId,
      workspaceId 
    });
    
    // Update analysis status to failed
    await supabase
      .from('analyses')
      .update({ status: 'failed' })
      .eq('id', analysisId);
    
    throw error;
  }
}, {
  connection: {
    host: config.redis.host,
    port: config.redis.port,
  },
  concurrency: 10, // Can handle multiple analyses concurrently
});

// Monitor for completed analyses to update overall status
masterWorker.on('completed', async (job) => {
  const { analysisId } = job.data;
  
  // Check if all analyzer jobs are complete
  const { data: jobs } = await supabase
    .from('analysis_jobs')
    .select('status')
    .eq('analysis_id', analysisId);
    
  if (jobs) {
    const allComplete = jobs.every(j => j.status === 'completed' || j.status === 'failed');
    const hasFailures = jobs.some(j => j.status === 'failed');
    
    if (allComplete) {
      const finalStatus = hasFailures ? 'completed_with_errors' : 'completed';
      
      await supabase
        .from('analyses')
        .update({ 
          status: finalStatus,
          completed_at: new Date().toISOString()
        })
        .eq('id', analysisId);
        
      logger.info('Analysis completed', { analysisId, finalStatus });
    }
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing master worker...');
  await masterWorker.close();
});