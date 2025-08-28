import { Queue } from 'bullmq';
import { config } from '@/config';

export const technicalSeoQueue = new Queue('seo-technical', {
  connection: {
    host: config.redis.host,
    port: config.redis.port,
  },
});

export default technicalSeoQueue;


