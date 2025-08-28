
import { Queue } from 'bullmq';
import { config } from '@/config';

export const colorContrastQueue = new Queue('color-contrast', {
  connection: {
    host: config.redis.host,
    port: config.redis.port,
  },
});
