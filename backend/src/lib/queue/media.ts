import { Queue } from 'bullmq';
import { config } from '@/config';

/**
 * Media Accessibility Analysis Queue
 * 
 * This queue handles media (video, audio, embedded content) accessibility analysis jobs.
 * It works in coordination with other accessibility workers (ARIA, Color Contrast, Keyboard)
 * to provide comprehensive accessibility testing.
 */
export const mediaQueue = new Queue('accessibility-media', {
  connection: config.redis,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    delay: 1500, // Small delay to ensure other workers have started
  },
});

mediaQueue.on('error', (err) => {
  console.error('Media queue error:', err);
});

mediaQueue.on('waiting', (jobId) => {
  console.log(`Media job ${jobId} is waiting`);
});

mediaQueue.on('active', (job, jobPromise) => {
  console.log(`Media job ${job.id} is now active for analysis ${job.data.analysisId}`);
});

mediaQueue.on('completed', (job, result) => {
  console.log(`Media job ${job.id} completed for analysis ${job.data.analysisId}`);
});

mediaQueue.on('failed', (job, err) => {
  console.error(`Media job ${job?.id} failed for analysis ${job?.data?.analysisId}:`, err);
});