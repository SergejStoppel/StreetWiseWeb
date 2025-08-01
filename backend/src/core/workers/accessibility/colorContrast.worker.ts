
import { Job, Worker } from 'bullmq';
import { config } from '@/config';
import { createLogger } from '@/config/logger';
import { supabase } from '@/config/supabase';
import { AppError } from '@/types';
import * as axe from 'axe-core';

const logger = createLogger('color-contrast-worker');

async function getHtmlContent(analysisId: string, userId: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('analysis_assets')
    .download(`${userId}/${analysisId}/index.html`);

  if (error) {
    throw new AppError('Failed to download HTML content', 500, true, error);
  }

  return data.text();
}

export const colorContrastWorker = new Worker('color-contrast', async (job: Job) => {
  const { analysisId, userId } = job.data;
  logger.info(`Analyzing color contrast for analysisId: ${analysisId}`);

  try {
    const html = await getHtmlContent(analysisId, userId);

    const results = await axe.run(html, {
      runOnly: {
        type: 'rule',
        values: ['color-contrast'],
      },
    });

    const issues = results.violations.map((violation) => ({
      analysis_job_id: job.id,
      rule_id: 'd1b4d42a-2c2c-4b2c-8b2c-2c2c2c2c2c2c', // Replace with actual rule ID from DB
      severity: violation.impact,
      location_path: violation.nodes.map((node) => node.target).join(', '),
      code_snippet: violation.nodes.map((node) => node.html).join('\n'),
      message: violation.help,
      fix_suggestion: violation.helpUrl,
    }));

    if (issues.length > 0) {
      const { error } = await supabase.from('accessibility_issues').insert(issues);
      if (error) {
        throw new AppError('Failed to insert accessibility issues', 500, true, error);
      }
    }

    logger.info(`Successfully analyzed color contrast for analysisId: ${analysisId}`);
  } catch (error) {
    logger.error(`Error analyzing color contrast for analysisId: ${analysisId}`, error);
    throw error;
  }
}, {
  connection: {
    host: config.redis.host,
    port: config.redis.port,
  },
});
