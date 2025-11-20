import { Queue } from 'bullmq';
import { config } from '@/config';

export const onPageSeoQueue = new Queue('seo-onpage', {
  connection: {
    host: config.redis.host,
    port: config.redis.port,
  },
});

export default onPageSeoQueue;
