
import { Queue } from 'bullmq';
import { config } from '@/config';

export const fetcherQueue = new Queue('fetcher', {
  connection: {
    host: config.redis.host,
    port: config.redis.port,
  },
});
