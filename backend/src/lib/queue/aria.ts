import { Queue } from 'bullmq';
import { config } from '@/config';

export const ariaQueue = new Queue('aria-analysis', {
  connection: config.redis,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export default ariaQueue;