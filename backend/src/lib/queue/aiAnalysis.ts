/**
 * AI Analysis Queue
 * Queue for deep AI-powered content analysis
 */

import { Queue } from 'bullmq';
import { config } from '@/config';

export const aiAnalysisQueue = new Queue('ai-analysis', {
  connection: {
    host: config.redis.host,
    port: config.redis.port,
  },
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 20,
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  }
});

export default aiAnalysisQueue;
