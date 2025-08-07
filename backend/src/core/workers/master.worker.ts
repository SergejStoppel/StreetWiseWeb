import { Job, Worker, Queue, QueueEvents } from 'bullmq';
import { config } from '@/config';
import { createLogger } from '@/config/logger';
import { supabase } from '@/config/supabase';
import { fetcherQueue } from '@/lib/queue/fetcher';
import { colorContrastQueue } from '@/lib/queue/colorContrast';
import { ariaQueue } from '@/lib/queue/aria';
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
  aria: ariaQueue,
  // TODO: Add other analyzer queues as they are implemented
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

// Map module names to their corresponding workers (only include implemented ones)
// Now supports multiple workers per module
const moduleToWorkerMap = {
  'Fetcher': [], // Handled separately in the fetcher step
  'Accessibility': ['colorContrast', 'aria'], // Multiple workers for accessibility
  // TODO: Add these as workers are implemented
  // 'SEO': ['technicalSeo', 'onPageSeo'],
  // 'Performance': ['coreWebVitals', 'imageOptimization']
};

async function createAnalysisJob(analysisId: string, moduleId: string, workerName?: string) {
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
      workerName,
      errorMessage: error.message,
      errorCode: error.code
    });
    throw error;
  } else {
    logger.info('Created analysis job', {
      analysisId,
      moduleId,
      jobId: data?.[0]?.id,
      workerName
    });
    return data?.[0]?.id;
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
      // Filter modules to only include those with implemented workers
      const implementedModules = modules.filter(module => 
        moduleToWorkerMap.hasOwnProperty(module.name)
      );
      
      logger.info('Creating analysis jobs for implemented modules only', { 
        analysisId,
        totalModules: modules.length,
        implementedModules: implementedModules.length,
        implementedNames: implementedModules.map(m => m.name),
        skippedNames: modules.filter(m => !moduleToWorkerMap.hasOwnProperty(m.name)).map(m => m.name)
      });
      
      for (const module of implementedModules) {
        await createAnalysisJob(analysisId, module.id);
      }
      
      logger.info('Analysis jobs created for implemented modules', { 
        analysisId,
        moduleCount: implementedModules.length 
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

    // Step 3: Enqueue analyzer jobs for implemented modules only
    const analyzerJobPromises = [];
    
    // Get implemented modules again for analyzer enqueuing
    const implementedAnalyzerModules = [];
    
    for (const [moduleName, workerNames] of Object.entries(moduleToWorkerMap)) {
      if (Array.isArray(workerNames) && workerNames.length > 0) {
        for (const workerName of workerNames) {
          if (analyzerQueues[workerName]) {
            implementedAnalyzerModules.push({ moduleName, workerName });
          }
        }
      }
    }
    
    logger.info('Starting to enqueue analyzer jobs for implemented modules', {
      analysisId,
      implementedAnalyzers: implementedAnalyzerModules.map(m => `${m.moduleName}:${m.workerName}`)
    });
    
    for (const { moduleName, workerName } of implementedAnalyzerModules) {
      const queue = analyzerQueues[workerName];
      logger.info(`Enqueuing ${workerName} analyzer for ${moduleName} module`, { analysisId });
      
      try {
        const jobOptions = {
          removeOnComplete: false, // Keep for debugging
          removeOnFail: false,
          attempts: workerName === 'aria' ? 1 : 2, // Reduce ARIA retries
          backoff: {
            type: 'exponential',
            delay: 2000
          }
        };

        const jobPromise = queue.add(`analyze-${workerName}`, {
          analysisId,
          workspaceId,
          websiteId,
          userId,
          assetPath: fetcherResult.assetPath,
          metadata: fetcherResult.metadata
        }, jobOptions);
        
        analyzerJobPromises.push(jobPromise);
        logger.info(`${workerName} analyzer job enqueued for ${moduleName}`, { analysisId });
      } catch (error) {
        logger.error(`Failed to enqueue ${workerName} analyzer for ${moduleName}`, {
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
    const analyzerJobs = jobs.filter(j => (j as any).analysis_modules.name !== 'Fetcher');
    
    if (analyzerJobs.length === 0) {
      logger.warn('No analyzer jobs found for analysis', { analysisId });
      return;
    }
    
    logger.info('Analyzer job status check', {
      analysisId,
      totalJobs: analyzerJobs.length,
      jobStatuses: analyzerJobs.map(job => ({
        module: (job as any).analysis_modules.name,
        status: job.status
      }))
    });
    
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