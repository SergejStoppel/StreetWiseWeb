
import { Queue } from 'bullmq';
import { config } from '@/config';

export const masterQueue = new Queue('master-analysis', {
  connection: {
    host: config.redis.host,
    port: config.redis.port,
  },
});
