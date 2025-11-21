/**
 * Quick Scan Queue
 * Fast HTTP-only analysis queue for instant scans
 */

import { Queue } from 'bullmq';
import { config } from '@/config';

export const quickScanQueue = new Queue('quick-scan', {
  connection: {
    host: config.redis.host,
    port: config.redis.port,
  },
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50,      // Keep last 50 failed jobs
    attempts: 2,           // Quick retry
    backoff: {
      type: 'fixed',
      delay: 1000
    }
  }
});

export default quickScanQueue;
