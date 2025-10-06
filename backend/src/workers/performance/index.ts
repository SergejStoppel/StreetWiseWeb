/**
 * Performance Workers Entry Point
 * Starts both Core Web Vitals and Image Optimization workers
 */

import { createLogger } from '@/config/logger';

// Import the actual workers from core/workers/performance
import { coreWebVitalsWorker, imageOptimizationWorker } from '@/core/workers/performance';

const logger = createLogger('performance-workers-entry');

logger.info('Starting Performance Analysis Workers...');
logger.info('✓ Core Web Vitals Worker ready');
logger.info('✓ Image Optimization Worker ready');
logger.info('Performance workers are now listening for jobs');

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down performance workers...');
  
  await Promise.all([
    coreWebVitalsWorker.close(),
    imageOptimizationWorker.close()
  ]);
  
  logger.info('Performance workers shutdown complete');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down performance workers...');
  
  await Promise.all([
    coreWebVitalsWorker.close(),
    imageOptimizationWorker.close()
  ]);
  
  logger.info('Performance workers shutdown complete');
  process.exit(0);
});

// Keep the process alive
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception in performance workers:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});