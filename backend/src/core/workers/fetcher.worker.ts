
import { Job, Worker } from 'bullmq';
import puppeteer from 'puppeteer';
import { config } from '@/config';
import { createLogger } from '@/config/logger';
import { supabase } from '@/config/supabase';
import { AppError } from '@/types';

const logger = createLogger('fetcher-worker');

async function updateAnalysisStatus(analysisId: string, status: 'processing' | 'completed' | 'failed') {
  const { error } = await supabase
    .from('analyses')
    .update({ status })
    .eq('id', analysisId);

  if (error) {
    throw new AppError('Failed to update analysis status', 500, true, error);
  }
}

export const fetcherWorker = new Worker('fetcher', async (job: Job) => {
  const { analysisId, websiteId, userId } = job.data;
  logger.info(`Fetching content for analysisId: ${analysisId}`);

  await updateAnalysisStatus(analysisId, 'processing');

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    const website = await supabase.from('websites').select('url').eq('id', websiteId).single();
    if (!website.data) throw new AppError('Website not found', 404);

    await page.goto(website.data.url, { waitUntil: 'networkidle2' });

    const html = await page.content();
    const screenshot = await page.screenshot({ type: 'jpeg' });

    const htmlPath = `${userId}/${analysisId}/index.html`;
    const screenshotPath = `${userId}/${analysisId}/screenshot.jpg`;

    await supabase.storage.from('analysis_assets').upload(htmlPath, html);
    await supabase.storage.from('analysis_assets').upload(screenshotPath, screenshot);

    await supabase.from('screenshots').insert([
      { analysis_id: analysisId, type: 'desktop', storage_bucket: 'analysis_assets', storage_path: screenshotPath, url: '' }
    ]);

    await updateAnalysisStatus(analysisId, 'completed');

    logger.info(`Successfully fetched content for analysisId: ${analysisId}`);
  } catch (error) {
    logger.error(`Error fetching content for analysisId: ${analysisId}`, error);
    await updateAnalysisStatus(analysisId, 'failed');
    throw error;
  } finally {
    await browser.close();
  }
}, {
  connection: {
    host: config.redis.host,
    port: config.redis.port,
  },
});
