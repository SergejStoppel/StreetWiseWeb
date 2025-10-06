import { Queue } from 'bullmq';
import { config } from '@/config';

export const imageOptimizationQueue = new Queue('performance-image-optimization', {
  connection: {
    host: config.redis.host,
    port: config.redis.port,
  },
});