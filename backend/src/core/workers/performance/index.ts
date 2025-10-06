/**
 * Performance Analysis Workers
 * Coordinates Core Web Vitals and Image Optimization analysis
 */

import { createLogger } from '@/config/logger';
import { coreWebVitalsWorker } from './coreWebVitals.worker';
import { imageOptimizationWorker } from './imageOptimization.worker';

const logger = createLogger('performance-workers');

// Export workers for external access
export { coreWebVitalsWorker, imageOptimizationWorker };

// Worker coordination and management
export class PerformanceWorkerManager {
  private static instance: PerformanceWorkerManager;
  
  private constructor() {
    this.setupWorkerEventHandlers();
  }
  
  public static getInstance(): PerformanceWorkerManager {
    if (!PerformanceWorkerManager.instance) {
      PerformanceWorkerManager.instance = new PerformanceWorkerManager();
    }
    return PerformanceWorkerManager.instance;
  }
  
  private setupWorkerEventHandlers(): void {
    // Core Web Vitals Worker Events
    coreWebVitalsWorker.on('completed', (job) => {
      logger.info('Core Web Vitals analysis completed', {
        jobId: job.id,
        analysisId: job.data.analysisId,
        result: job.returnvalue
      });
    });
    
    coreWebVitalsWorker.on('failed', (job, err) => {
      logger.error('Core Web Vitals analysis failed', {
        jobId: job?.id,
        analysisId: job?.data?.analysisId,
        error: err.message
      });
    });
    
    // Image Optimization Worker Events
    imageOptimizationWorker.on('completed', (job) => {
      logger.info('Image optimization analysis completed', {
        jobId: job.id,
        analysisId: job.data.analysisId,
        result: job.returnvalue
      });
    });
    
    imageOptimizationWorker.on('failed', (job, err) => {
      logger.error('Image optimization analysis failed', {
        jobId: job?.id,
        analysisId: job?.data?.analysisId,
        error: err.message
      });
    });
    
    logger.info('Performance worker event handlers initialized');
  }
  
  public async getWorkerStats() {
    const [cwvStats, imageStats] = await Promise.all([
      coreWebVitalsWorker.getJobs(['waiting', 'active', 'completed', 'failed']),
      imageOptimizationWorker.getJobs(['waiting', 'active', 'completed', 'failed'])
    ]);
    
    return {
      coreWebVitals: {
        waiting: cwvStats.filter(j => j.opts.jobId && j.opts.delay === undefined).length,
        active: cwvStats.filter(j => j.processedOn && !j.finishedOn).length,
        completed: cwvStats.filter(j => j.finishedOn && !j.failedReason).length,
        failed: cwvStats.filter(j => j.failedReason).length
      },
      imageOptimization: {
        waiting: imageStats.filter(j => j.opts.jobId && j.opts.delay === undefined).length,
        active: imageStats.filter(j => j.processedOn && !j.finishedOn).length,
        completed: imageStats.filter(j => j.finishedOn && !j.failedReason).length,
        failed: imageStats.filter(j => j.failedReason).length
      }
    };
  }
  
  public async shutdown(): Promise<void> {
    logger.info('Shutting down performance workers...');
    
    await Promise.all([
      coreWebVitalsWorker.close(),
      imageOptimizationWorker.close()
    ]);
    
    logger.info('Performance workers shutdown complete');
  }
}

// Initialize worker manager
const workerManager = PerformanceWorkerManager.getInstance();

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down performance workers...');
  await workerManager.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down performance workers...');
  await workerManager.shutdown();
  process.exit(0);
});

// Export worker manager for external use
export default workerManager;