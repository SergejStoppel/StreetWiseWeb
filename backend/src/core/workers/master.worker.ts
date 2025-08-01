
import { Job, Worker } from 'bullmq';
import { config } from '@/config';
import { createLogger } from '@/config/logger';
import { fetcherQueue } from '@/lib/queue/fetcher';

const logger = createLogger('master-worker');

import { colorContrastQueue } from '@/lib/queue/colorContrast';

export const masterWorker = new Worker('master-analysis', async (job: Job) => {
  logger.info(`Starting master analysis job for analysisId: ${job.data.analysisId}`);

  await fetcherQueue.add('fetch-job', job.data);

  logger.info(`Enqueued fetcher job for analysisId: ${job.data.analysisId}`);

  // This is a simplified approach for now. In a real scenario, we'd wait for the fetcher to complete.
  await colorContrastQueue.add('color-contrast-job', job.data);
}, {
  connection: {
    host: config.redis.host,
    port: config.redis.port,
  },
});
