import { Queue, Worker } from 'bullmq';
import { config } from '@/config';

/**
 * Keyboard Accessibility Analysis Queue
 * 
 * This queue handles keyboard navigation and accessibility analysis jobs.
 * It works in coordination with other accessibility workers (ARIA and Color Contrast)
 * to provide comprehensive accessibility testing.
 */
export const keyboardQueue = new Queue('accessibility-keyboard', {
  connection: config.redis,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    delay: 1000, // Small delay to ensure other workers have started
  },
});

keyboardQueue.on('error', (err) => {
  console.error('Keyboard queue error:', err);
});

keyboardQueue.on('waiting', (jobId) => {
  console.log(`Keyboard job ${jobId} is waiting`);
});

keyboardQueue.on('active', (job, jobPromise) => {
  console.log(`Keyboard job ${job.id} is now active for analysis ${job.data.analysisId}`);
});

keyboardQueue.on('completed', (job, result) => {
  console.log(`Keyboard job ${job.id} completed for analysis ${job.data.analysisId}`);
});

keyboardQueue.on('failed', (job, err) => {
  console.error(`Keyboard job ${job?.id} failed for analysis ${job?.data?.analysisId}:`, err);
});