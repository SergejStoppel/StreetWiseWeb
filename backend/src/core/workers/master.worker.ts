import { Job, Worker, Queue, QueueEvents } from 'bullmq';
import { config } from '@/config';
import { createLogger } from '@/config/logger';
import { supabase } from '@/config/supabase';
import { fetcherQueue } from '@/lib/queue/fetcher';
import { colorContrastQueue } from '@/lib/queue/colorContrast';
import { AppError } from '@/types';

const logger = createLogger('master-worker');

// Create queue events for job completion monitoring
const fetcherQueueEvents = new QueueEvents('fetcher', {
  connection: {
    host: config.redis.host,
    port: config.redis.port,
  },
});

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
  const { data, error } = await supabase
    .from('analysis_jobs')
    .insert([{
      analysis_id: analysisId,
      module_id: moduleId,
      status: 'pending'
    }])
    .select();

  if (error) {
    logger.error('Failed to create analysis job record', { 
      error, 
      analysisId, 
      moduleId,
      errorMessage: error.message,
      errorCode: error.code
    });
  } else {
    logger.info('Created analysis job', {
      analysisId,
      moduleId,
      jobId: data?.[0]?.id
    });
  }
}

async function waitForFetcherCompletion(fetcherJobId: string): Promise<FetcherResult> {
  const fetcherJob = await fetcherQueue.getJob(fetcherJobId);
  
  if (!fetcherJob) {
    throw new AppError('Fetcher job not found', 500);
  }

  logger.info('Waiting for fetcher job completion', { fetcherJobId });

  // Wait for the fetcher job to complete with timeout
  const result = await Promise.race([
    fetcherJob.waitUntilFinished(fetcherQueueEvents),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Fetcher job timeout - took longer than 3 minutes')), 180000)
    )
  ]);
  
  logger.info('Fetcher job completed', { fetcherJobId, success: result?.success });
  
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
    const { data: modules, error: modulesError } = await supabase
      .from('analysis_modules')
      .select('id, name');

    if (modulesError) {
      logger.error('Failed to fetch analysis modules', { 
        error: modulesError,
        errorMessage: modulesError.message 
      });
      throw new Error('Failed to fetch analysis modules');
    }

    logger.info('Fetched analysis modules', { 
      moduleCount: modules?.length || 0,
      modules: modules?.map(m => ({ id: m.id, name: m.name }))
    });

    if (modules) {
      logger.info('Creating analysis jobs for all modules', { 
        analysisId,
        moduleCount: modules.length 
      });
      
      for (const module of modules) {
        await createAnalysisJob(analysisId, module.id);
      }
      
      logger.info('All analysis jobs created successfully', { 
        analysisId,
        moduleCount: modules.length 
      });
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
      assetPath: fetcherResult.assetPath,
      metadata: fetcherResult.metadata 
    });

    // Step 3: Enqueue all analyzer jobs in parallel
    const analyzerJobPromises = [];
    
    logger.info('Starting to enqueue analyzer jobs', {
      analysisId,
      availableAnalyzers: Object.keys(analyzerQueues)
    });
    
    for (const [analyzerName, queue] of Object.entries(analyzerQueues)) {
      logger.info(`Enqueuing ${analyzerName} analyzer`, { analysisId });
      
      try {
        const jobPromise = queue.add(`analyze-${analyzerName}`, {
          analysisId,
          workspaceId,
          websiteId,
          userId,
          assetPath: fetcherResult.assetPath,
          metadata: fetcherResult.metadata
        }, {
          removeOnComplete: false, // Keep for debugging
          removeOnFail: false,
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 2000
          }
        });
        
        analyzerJobPromises.push(jobPromise);
        logger.info(`${analyzerName} analyzer job enqueued`, { analysisId });
      } catch (error) {
        logger.error(`Failed to enqueue ${analyzerName} analyzer`, {
          error: error.message,
          analysisId
        });
        // Continue with other analyzers
      }
    }

    // Wait for all analyzer jobs to be enqueued
    const enqueuedJobs = await Promise.allSettled(analyzerJobPromises);
    const successfulJobs = enqueuedJobs.filter(result => result.status === 'fulfilled').length;
    const failedJobs = enqueuedJobs.filter(result => result.status === 'rejected').length;

    logger.info('Analyzer job enqueuing completed', { 
      analysisId,
      totalAttempted: analyzerJobPromises.length,
      successful: successfulJobs,
      failed: failedJobs
    });

    if (successfulJobs === 0) {
      throw new AppError('Failed to enqueue any analyzer jobs', 500);
    }

    // Update analysis status to processing (analyzers are now running)
    await supabase
      .from('analyses')
      .update({ status: 'processing' })
      .eq('id', analysisId);

    // Note: We don't wait for analyzers to complete here
    // Each analyzer will update its own status and the analysis status
    // will be updated by monitoring the analyzer job completions

    logger.info('Master worker completed successfully', {
      analysisId,
      assetPath: fetcherResult.assetPath,
      analyzersEnqueued: successfulJobs
    });

    return {
      success: true,
      analysisId,
      assetPath: fetcherResult.assetPath,
      analyzersEnqueued: successfulJobs
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

// Analysis completion monitoring will be handled by analyzer workers
// Each analyzer worker will check if all jobs are complete after finishing
export async function checkAndUpdateAnalysisCompletion(analysisId: string) {
  logger.info('Checking analysis completion status', { analysisId });
  
  // Check if all analyzer jobs are complete
  const { data: jobs } = await supabase
    .from('analysis_jobs')
    .select('status, analysis_modules!inner(name)')
    .eq('analysis_id', analysisId);
    
  if (jobs && jobs.length > 0) {
    // Exclude fetcher jobs from completion check (fetcher completes before analyzers)
    const analyzerJobs = jobs.filter(j => j.analysis_modules.name !== 'Fetcher');
    
    if (analyzerJobs.length === 0) {
      logger.warn('No analyzer jobs found for analysis', { analysisId });
      return;
    }
    
    const allComplete = analyzerJobs.every(j => j.status === 'completed' || j.status === 'failed');
    const hasFailures = analyzerJobs.some(j => j.status === 'failed');
    
    if (allComplete) {
      const finalStatus = hasFailures ? 'completed_with_errors' : 'completed';
      
      await supabase
        .from('analyses')
        .update({ 
          status: finalStatus,
          completed_at: new Date().toISOString()
        })
        .eq('id', analysisId);
        
      logger.info('Analysis completed', { 
        analysisId, 
        finalStatus,
        totalJobs: jobs.length,
        analyzerJobs: analyzerJobs.length,
        completedJobs: analyzerJobs.filter(j => j.status === 'completed').length,
        failedJobs: analyzerJobs.filter(j => j.status === 'failed').length
      });
    }
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing master worker...');
  await Promise.all([
    masterWorker.close(),
    fetcherQueueEvents.close()
  ]);
});