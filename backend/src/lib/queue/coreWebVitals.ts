import { Queue } from 'bullmq';
import { config } from '@/config';

export const coreWebVitalsQueue = new Queue('performance-core-web-vitals', {
  connection: {
    host: config.redis.host,
    port: config.redis.port,
  },
});