import { Job, Worker } from 'bullmq';
import { config } from '@/config';
import { createLogger } from '@/config/logger';
import { supabase } from '@/config/supabase';
import { AppError } from '@/types';
import { checkAndUpdateAnalysisCompletion } from '@/core/workers/master.worker';

const logger = createLogger('seo-technical-worker');

interface TechnicalSeoJobData {
  analysisId: string;
  workspaceId: string;
  websiteId: string;
  userId: string | null;
  assetPath: string; // `${workspaceId}/${analysisId}`
  metadata: any;
}

type IssueSeverity = 'minor' | 'moderate' | 'serious' | 'critical';

async function getSeoModuleAndJobId(analysisId: string): Promise<{ moduleId: string; jobId: string } | null> {
  const { data: module, error: moduleError } = await supabase
    .from('analysis_modules')
    .select('id')
    .eq('name', 'SEO')
    .single();

  if (moduleError || !module) {
    logger.error('SEO module not found', { error: moduleError });
    return null;
  }

  const { data: job, error: jobError } = await supabase
    .from('analysis_jobs')
    .select('id')
    .eq('analysis_id', analysisId)
    .eq('module_id', module.id)
    .single();

  if (jobError || !job) {
    logger.error('SEO analysis job not found', { error: jobError, analysisId, moduleId: module.id });
    return null;
  }

  return { moduleId: module.id, jobId: job.id };
}

async function updateSeoJobStatus(analysisId: string, moduleId: string, status: 'running' | 'completed' | 'failed', errorMessage?: string) {
  const updateData: any = {
    status,
    ...(status === 'running' ? { started_at: new Date().toISOString() } : {}),
    ...(status === 'completed' || status === 'failed' ? { completed_at: new Date().toISOString() } : {}),
    ...(errorMessage ? { error_message: errorMessage } : {}),
  };

  const { error } = await supabase
    .from('analysis_jobs')
    .update(updateData)
    .eq('analysis_id', analysisId)
    .eq('module_id', moduleId);

  if (error) {
    logger.error('Failed to update SEO job status', { error, analysisId, moduleId, status });
  }
}

async function getRuleId(ruleKey: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('rules')
    .select('id')
    .eq('rule_key', ruleKey)
    .single();

  if (error || !data) {
    logger.warn('Rule not found', { ruleKey, error });
    return null;
  }
  return data.id;
}

function normalizeUrlForCanonical(url: string): string {
  try {
    const u = new URL(url);
    u.hash = '';
    // remove trailing slash unless root
    if (u.pathname !== '/' && u.pathname.endsWith('/')) {
      u.pathname = u.pathname.slice(0, -1);
    }
    return u.toString();
  } catch {
    return url;
  }
}

async function downloadTextFromStorage(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('analysis-assets')
    .download(path);
  if (error || !data) return null;
  const text = await data.text();
  return text;
}

export const technicalSeoWorker = new Worker('seo-technical', async (job: Job<TechnicalSeoJobData>) => {
  const { analysisId, workspaceId, assetPath, metadata } = job.data;
  logger.info('Starting Technical SEO analysis', { analysisId, assetPath });

  let moduleJobInfo: { moduleId: string; jobId: string } | null = null;

  try {
    moduleJobInfo = await getSeoModuleAndJobId(analysisId);
    if (!moduleJobInfo) throw new AppError('Failed to get SEO job info', 500);

    await updateSeoJobStatus(analysisId, moduleJobInfo.moduleId, 'running');

    const issuesToInsert: Array<{
      rule_key: string;
      severity: IssueSeverity;
      location_path?: string;
      code_snippet?: string;
      message?: string;
      fix_suggestion?: string;
    }> = [];

    // 1) Read headers.json → check x-robots-tag
    const headersJsonPath = `${assetPath}/meta/headers.json`;
    const headersJson = await downloadTextFromStorage(headersJsonPath);
    if (headersJson) {
      try {
        const headersPayload = JSON.parse(headersJson);
        const headers = (headersPayload?.headers || {}) as Record<string, string>;
        const xRobots = headers['x-robots-tag'] || headers['X-Robots-Tag'];
        if (xRobots && /noindex|nofollow|none/i.test(xRobots)) {
          // No dedicated seed for x-robots-tag; map to conservative technical rule
          issuesToInsert.push({
            rule_key: 'SEO_TEC_01_ROBOTS_TXT_MISSING', // fallback category; alternatively create dedicated rule later
            severity: 'serious',
            location_path: 'response.headers[x-robots-tag]',
            message: `x-robots-tag suggests indexing restrictions: ${xRobots}`,
            fix_suggestion: 'Review and adjust x-robots-tag header if unintended (e.g., remove noindex/nofollow).'
          });
        }
      } catch (e) {
        logger.warn('Failed parsing headers.json', { error: (e as Error).message });
      }
    }

    // 2) Read robots.txt
    const robotsPath = `${assetPath}/meta/robots.txt`;
    const robotsTxt = await downloadTextFromStorage(robotsPath);
    if (!robotsTxt) {
      issuesToInsert.push({
        rule_key: 'SEO_TEC_01_ROBOTS_TXT_MISSING',
        severity: 'serious',
        location_path: '/robots.txt',
        message: 'robots.txt is missing',
        fix_suggestion: 'Add a robots.txt to declare crawl directives and sitemap location.'
      });
    } else {
      // very light syntax checks
      if (/Disallow\s*:\s*$/im.test(robotsTxt) || /User-agent\s*:\s*$/im.test(robotsTxt)) {
        issuesToInsert.push({
          rule_key: 'SEO_TEC_02_ROBOTS_TXT_ERRORS',
          severity: 'serious',
          location_path: '/robots.txt',
          message: 'robots.txt contains empty directives',
          fix_suggestion: 'Ensure directives have values or remove empty lines.'
        });
      }
    }

    // 3) Read HTML and analyze canonical + meta robots
    const htmlPath = `${assetPath}/html/index.html`;
    const html = await downloadTextFromStorage(htmlPath);
    if (html) {
      // Lightweight parse for canonical and meta robots
      const linkCanonicalMatches = [...html.matchAll(/<link\s+[^>]*rel=["']?canonical["']?[^>]*>/gi)];
      const hrefMatches = linkCanonicalMatches.map(m => {
        const tag = m[0];
        const href = /href=["']([^"']+)["']/i.exec(tag)?.[1];
        return href || null;
      }).filter(Boolean) as string[];

      const finalUrl = normalizeUrlForCanonical(metadata?.finalUrl || metadata?.url || '');

      if (hrefMatches.length === 0) {
        issuesToInsert.push({
          rule_key: 'SEO_TEC_05_CANONICAL_MISSING',
          severity: 'critical',
          location_path: 'head > link[rel="canonical"]',
          message: 'Canonical tag missing',
          fix_suggestion: 'Add a single canonical link tag referencing the preferred, absolute URL.'
        });
      } else {
        if (hrefMatches.length > 1) {
          issuesToInsert.push({
            rule_key: 'SEO_TEC_06_CANONICAL_SELF_REFERENCE',
            severity: 'moderate',
            location_path: 'head > link[rel="canonical"]',
            message: 'Multiple canonical tags found',
            fix_suggestion: 'Keep only one canonical link element per page.'
          });
        }
        const canonicalHref = normalizeUrlForCanonical(hrefMatches[0]);
        if (canonicalHref && finalUrl && canonicalHref !== finalUrl) {
          issuesToInsert.push({
            rule_key: 'SEO_TEC_06_CANONICAL_SELF_REFERENCE',
            severity: 'moderate',
            location_path: 'head > link[rel="canonical"]',
            message: `Canonical does not self-reference the final URL. canonical=${canonicalHref}, final=${finalUrl}`,
            fix_suggestion: 'Update canonical href to point to the final, preferred absolute URL.'
          });
        }

        if (canonicalHref && !/^https?:\/\//i.test(canonicalHref)) {
          issuesToInsert.push({
            rule_key: 'SEO_TEC_06_CANONICAL_SELF_REFERENCE',
            severity: 'moderate',
            location_path: 'head > link[rel="canonical"]',
            message: 'Canonical URL must be absolute',
            fix_suggestion: 'Use an absolute canonical URL including scheme and host.'
          });
        }
      }

      // meta robots
      const metaRobots = /<meta\s+[^>]*name=["']robots["'][^>]*>/i.exec(html)?.[0];
      if (metaRobots) {
        const content = /content=["']([^"']+)["']/i.exec(metaRobots)?.[1] || '';
        if (/noindex|nofollow|none/i.test(content)) {
          issuesToInsert.push({
            rule_key: 'SEO_TEC_01_ROBOTS_TXT_MISSING', // grouping under robots visibility topic
            severity: 'serious',
            location_path: 'head > meta[name="robots"]',
            message: `Meta robots contains restrictive directives: ${content}`,
            fix_suggestion: 'Remove noindex/nofollow unless intentional.'
          });
        }
      }
    } else {
      logger.warn('Rendered HTML not found in storage; skipping canonical/meta checks', { htmlPath });
    }

    // Insert issues
    if (issuesToInsert.length > 0) {
      for (const issue of issuesToInsert) {
        const ruleId = await getRuleId(issue.rule_key);
        if (!ruleId) continue;
        const { error } = await supabase
          .from('seo_issues')
          .insert({
            analysis_job_id: moduleJobInfo.jobId,
            rule_id: ruleId,
            severity: issue.severity,
            location_path: issue.location_path,
            code_snippet: undefined,
            message: issue.message,
            fix_suggestion: issue.fix_suggestion,
          });
        if (error) logger.error('Failed to insert SEO issue', { error, ruleKey: issue.rule_key });
      }
    }

    await updateSeoJobStatus(analysisId, moduleJobInfo.moduleId, 'completed');
    await checkAndUpdateAnalysisCompletion(analysisId);

    logger.info('Technical SEO analysis completed', { analysisId, issueCount: issuesToInsert.length });
    return { success: true, issues: issuesToInsert.length };
  } catch (error: any) {
    logger.error('Technical SEO analysis failed', { error: error?.message || 'Unknown error', analysisId });
    if (moduleJobInfo) {
      await updateSeoJobStatus(analysisId, moduleJobInfo.moduleId, 'failed', error?.message || 'Unknown error');
      await checkAndUpdateAnalysisCompletion(analysisId);
    }
    throw error;
  }
}, {
  connection: {
    host: config.redis.host,
    port: config.redis.port,
  },
  concurrency: 3,
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing seo-technical worker...');
  await technicalSeoWorker.close();
});


