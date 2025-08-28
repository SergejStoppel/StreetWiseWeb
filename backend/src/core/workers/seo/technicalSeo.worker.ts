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
    let finalUrl = metadata?.finalUrl || metadata?.url || '';
    let responseStatus = null;
    let isHttps = false;
    
    if (headersJson) {
      try {
        const headersPayload = JSON.parse(headersJson);
        const headers = (headersPayload?.headers || {}) as Record<string, string>;
        responseStatus = headersPayload?.status;
        finalUrl = headersPayload?.url || finalUrl;
        isHttps = finalUrl.startsWith('https://');
        
        const xRobots = headers['x-robots-tag'] || headers['X-Robots-Tag'];
        if (xRobots && /noindex|nofollow|none/i.test(xRobots)) {
          issuesToInsert.push({
            rule_key: 'SEO_TEC_02_ROBOTS_TXT_ERRORS',
            severity: 'serious',
            location_path: 'response.headers[x-robots-tag]',
            message: `x-robots-tag contains indexing restrictions: ${xRobots}`,
            fix_suggestion: 'Review x-robots-tag header and remove noindex/nofollow if unintended.'
          });
        }
      } catch (e) {
        logger.warn('Failed parsing headers.json', { error: (e as Error).message });
      }
    }
    
    // Check HTTPS implementation
    if (!isHttps) {
      issuesToInsert.push({
        rule_key: 'SEO_TEC_07_HTTPS_MISSING',
        severity: 'critical',
        location_path: 'URL protocol',
        message: 'Website is not served over HTTPS',
        fix_suggestion: 'Implement SSL certificate and redirect all HTTP traffic to HTTPS for better security and SEO rankings.'
      });
    }

    // 2) Read robots.txt and check for sitemap
    const robotsPath = `${assetPath}/meta/robots.txt`;
    const robotsTxt = await downloadTextFromStorage(robotsPath);
    let hasSitemapInRobots = false;
    
    if (!robotsTxt) {
      issuesToInsert.push({
        rule_key: 'SEO_TEC_01_ROBOTS_TXT_MISSING',
        severity: 'serious',
        location_path: '/robots.txt',
        message: 'robots.txt file is missing',
        fix_suggestion: 'Create a robots.txt file to provide crawl guidance to search engines and declare sitemap location.'
      });
    } else {
      // Check for syntax errors
      if (/Disallow\s*:\s*$/im.test(robotsTxt) || /User-agent\s*:\s*$/im.test(robotsTxt)) {
        issuesToInsert.push({
          rule_key: 'SEO_TEC_02_ROBOTS_TXT_ERRORS',
          severity: 'serious',
          location_path: '/robots.txt',
          message: 'robots.txt contains empty directives',
          fix_suggestion: 'Ensure all directives have proper values or remove empty lines.'
        });
      }
      
      // Check for sitemap declaration
      hasSitemapInRobots = /^sitemap:/im.test(robotsTxt);
      
      // Check for potential crawl blocking issues
      if (/^disallow\s*:\s*\/$|^disallow\s*:\s*\/\*$/im.test(robotsTxt)) {
        issuesToInsert.push({
          rule_key: 'SEO_TEC_02_ROBOTS_TXT_ERRORS',
          severity: 'critical',
          location_path: '/robots.txt',
          message: 'robots.txt appears to block all crawling',
          fix_suggestion: 'Review Disallow directives - blocking all crawling prevents search engine indexing.'
        });
      }
    }
    
    // Try to check for XML sitemap
    try {
      const origin = new URL(finalUrl).origin;
      const sitemapUrl = `${origin}/sitemap.xml`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const sitemapResp = await fetch(sitemapUrl, { signal: controller.signal, headers: { 'User-Agent': 'SiteCraft-Analyzer/1.0' } });
      clearTimeout(timeout);
      
      if (!sitemapResp.ok) {
        issuesToInsert.push({
          rule_key: 'SEO_TEC_03_SITEMAP_MISSING',
          severity: 'serious',
          location_path: '/sitemap.xml',
          message: 'XML sitemap not found at standard location',
          fix_suggestion: hasSitemapInRobots ? 
            'Verify the sitemap URL declared in robots.txt is accessible.' :
            'Create an XML sitemap and declare it in robots.txt to help search engines discover your pages.'
        });
      } else {
        // Basic validation of sitemap content
        const sitemapContent = await sitemapResp.text();
        if (!sitemapContent.includes('<urlset') && !sitemapContent.includes('<sitemapindex')) {
          issuesToInsert.push({
            rule_key: 'SEO_TEC_04_SITEMAP_ERRORS',
            severity: 'moderate',
            location_path: '/sitemap.xml',
            message: 'Sitemap found but does not appear to be valid XML',
            fix_suggestion: 'Ensure your sitemap follows proper XML sitemap format with <urlset> or <sitemapindex> elements.'
          });
        }
      }
    } catch (sitemapError) {
      // Don't report sitemap as missing if we can't check due to network issues
      logger.warn('Could not check sitemap availability', { error: sitemapError.message });
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

      const normalizedFinalUrl = normalizeUrlForCanonical(finalUrl);

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
        if (canonicalHref && normalizedFinalUrl && canonicalHref !== normalizedFinalUrl) {
          issuesToInsert.push({
            rule_key: 'SEO_TEC_06_CANONICAL_SELF_REFERENCE',
            severity: 'moderate',
            location_path: 'head > link[rel="canonical"]',
            message: `Canonical does not self-reference the final URL. canonical=${canonicalHref}, final=${normalizedFinalUrl}`,
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
            rule_key: 'SEO_TEC_02_ROBOTS_TXT_ERRORS',
            severity: 'serious',
            location_path: 'head > meta[name="robots"]',
            message: `Meta robots contains indexing restrictions: ${content}`,
            fix_suggestion: 'Remove noindex/nofollow meta robots directives unless intentionally preventing indexing.'
          });
        }
      }
      
      // Check for mobile viewport meta tag
      const viewportMeta = /<meta\s+[^>]*name=["']viewport["'][^>]*>/i.exec(html)?.[0];
      if (!viewportMeta) {
        issuesToInsert.push({
          rule_key: 'SEO_TEC_08_MOBILE_FRIENDLY',
          severity: 'critical',
          location_path: 'head > meta[name="viewport"]',
          message: 'Mobile viewport meta tag is missing',
          fix_suggestion: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> for proper mobile rendering.'
        });
      } else {
        const viewportContent = /content=["']([^"']+)["']/i.exec(viewportMeta)?.[1] || '';
        if (!viewportContent.includes('width=device-width')) {
          issuesToInsert.push({
            rule_key: 'SEO_TEC_08_MOBILE_FRIENDLY',
            severity: 'moderate',
            location_path: 'head > meta[name="viewport"]',
            message: 'Viewport meta tag missing width=device-width',
            fix_suggestion: 'Include width=device-width in viewport meta tag for proper mobile responsiveness.'
          });
        }
      }
      
      // Check for structured data (JSON-LD, microdata, or RDFa)
      const hasJsonLd = /<script[^>]*type=["']application\/ld\+json["'][^>]*>/i.test(html);
      const hasMicrodata = /itemscope|itemprop|itemtype/i.test(html);
      const hasRdfa = /property=["'][^"']*:[^"']*["']|typeof=/i.test(html);
      
      if (!hasJsonLd && !hasMicrodata && !hasRdfa) {
        issuesToInsert.push({
          rule_key: 'SEO_TEC_09_STRUCTURED_DATA_VALIDATION',
          severity: 'serious',
          location_path: 'HTML document',
          message: 'No structured data found (JSON-LD, microdata, or RDFa)',
          fix_suggestion: 'Add structured data markup using JSON-LD, microdata, or RDFa to help search engines understand your content.'
        });
      } else {
        // Basic validation for JSON-LD
        if (hasJsonLd) {
          const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
          if (jsonLdMatches) {
            for (const match of jsonLdMatches) {
              const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '').trim();
              try {
                JSON.parse(jsonContent);
              } catch (e) {
                issuesToInsert.push({
                  rule_key: 'SEO_TEC_09_STRUCTURED_DATA_VALIDATION',
                  severity: 'moderate',
                  location_path: 'script[type="application/ld+json"]',
                  message: 'Invalid JSON-LD structured data found',
                  fix_suggestion: 'Fix JSON syntax errors in structured data to ensure proper parsing by search engines.'
                });
                break;
              }
            }
          }
        }
      }
      
      // Check for hreflang (basic presence check)
      const hasHreflang = /<link[^>]*hreflang=["'][^"']+["'][^>]*>|<link[^>]*rel=["']alternate["'][^>]*hreflang=/i.test(html);
      if (hasHreflang) {
        // Extract hreflang links for basic validation
        const hreflangMatches = html.match(/<link[^>]*(?:hreflang=["'][^"']+["'][^>]*|rel=["']alternate["'][^>]*hreflang=["'][^"']+["'])[^>]*>/gi) || [];
        const hreflangCodes = new Set<string>();
        let hasErrors = false;
        
        for (const match of hreflangMatches) {
          const hreflang = /hreflang=["']([^"']+)["']/i.exec(match)?.[1];
          const href = /href=["']([^"']+)["']/i.exec(match)?.[1];
          
          if (hreflang && href) {
            if (hreflangCodes.has(hreflang)) {
              hasErrors = true;
              break;
            }
            hreflangCodes.add(hreflang);
            
            // Check for valid language codes
            if (!/^[a-z]{2}(-[A-Z]{2})?$|^x-default$/i.test(hreflang)) {
              hasErrors = true;
              break;
            }
          }
        }
        
        if (hasErrors) {
          issuesToInsert.push({
            rule_key: 'SEO_TEC_10_HREFLANG_ERRORS',
            severity: 'moderate',
            location_path: 'head > link[hreflang]',
            message: 'Hreflang implementation has validation errors',
            fix_suggestion: 'Ensure hreflang codes follow ISO format (e.g., en, en-US) and avoid duplicate entries.'
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


