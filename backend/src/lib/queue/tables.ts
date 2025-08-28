import { Queue } from 'bullmq';
import { config } from '@/config';

export const tablesQueue = new Queue('tables-analysis', {
  connection: {
    host: config.redis.host,
    port: config.redis.port,
  },
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 100,
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});