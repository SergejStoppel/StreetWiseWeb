/**
 * Quick Scan Worker
 * Fast HTTP-only analysis for instant scans (Tier 1)
 *
 * Features:
 * - No Puppeteer required (fast startup)
 * - HTTP requests only
 * - Returns top 3 most important issues
 * - Completes in ~10-30 seconds
 */

import { Job, Worker } from 'bullmq';
import { config } from '@/config';
import { createLogger } from '@/config/logger';
import { supabase } from '@/config/supabase';
import axios from 'axios';
import * as cheerio from 'cheerio';

const logger = createLogger('quick-scan-worker');

interface QuickScanJobData {
  analysisId: string;
  url: string;
  userId: string | null;
  workspaceId: string | null;
  isGuest: boolean;
}

interface QuickScanIssue {
  rule_key: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  category: string;
  title: string;
  message: string;
  location_path: string;
  fix_suggestion: string;
}

interface QuickScanResult {
  success: boolean;
  url: string;
  score: number;
  issues: QuickScanIssue[];
  topIssues: QuickScanIssue[];
  metadata: {
    title: string;
    description: string;
    scanDuration: number;
  };
}

// Severity weights for scoring
const SEVERITY_WEIGHTS = {
  critical: 25,
  serious: 15,
  moderate: 8,
  minor: 3
};

// Severity order for sorting
const SEVERITY_ORDER = {
  critical: 4,
  serious: 3,
  moderate: 2,
  minor: 1
};

/**
 * Main quick scan function
 */
async function performQuickScan(url: string): Promise<QuickScanResult> {
  const startTime = Date.now();
  const issues: QuickScanIssue[] = [];

  try {
    // Normalize URL
    const normalizedUrl = normalizeUrl(url);

    // Fetch HTML content
    const { html, statusCode, headers, finalUrl } = await fetchPage(normalizedUrl);

    if (!html) {
      throw new Error('Failed to fetch page content');
    }

    // Parse HTML
    const $ = cheerio.load(html);

    // Run all quick checks
    issues.push(...checkMetaTags($, finalUrl));
    issues.push(...checkHeadings($));
    issues.push(...checkImages($));
    issues.push(...checkLinks($, finalUrl));
    issues.push(...checkStructuredData($));
    issues.push(...await checkRobotsTxt(finalUrl));
    issues.push(...await checkSitemap(finalUrl));
    issues.push(...checkMobileViewport($));
    issues.push(...checkCanonical($, finalUrl));
    issues.push(...checkLanguage($));

    // Calculate score
    const score = calculateScore(issues);

    // Sort issues by severity and get top 3
    const sortedIssues = issues.sort((a, b) =>
      SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]
    );
    const topIssues = sortedIssues.slice(0, 3);

    // Extract metadata
    const title = $('title').text().trim() || 'Untitled Page';
    const description = $('meta[name="description"]').attr('content') || '';

    const scanDuration = Date.now() - startTime;

    logger.info('Quick scan completed', {
      url: finalUrl,
      issuesFound: issues.length,
      score,
      duration: scanDuration
    });

    return {
      success: true,
      url: finalUrl,
      score,
      issues: sortedIssues,
      topIssues,
      metadata: {
        title,
        description,
        scanDuration
      }
    };

  } catch (error) {
    logger.error('Quick scan failed', { url, error: (error as Error).message });

    return {
      success: false,
      url,
      score: 0,
      issues: [{
        rule_key: 'SCAN_ERROR',
        severity: 'critical',
        category: 'Error',
        title: 'Scan Failed',
        message: `Could not scan this website: ${(error as Error).message}`,
        location_path: url,
        fix_suggestion: 'Please verify the URL is correct and the website is accessible.'
      }],
      topIssues: [],
      metadata: {
        title: 'Scan Error',
        description: '',
        scanDuration: Date.now() - startTime
      }
    };
  }
}

/**
 * Fetch page content via HTTP
 */
async function fetchPage(url: string): Promise<{
  html: string;
  statusCode: number;
  headers: Record<string, string>;
  finalUrl: string;
}> {
  const response = await axios.get(url, {
    timeout: 30000,
    maxRedirects: 5,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; SiteCraftBot/1.0; +https://sitecraft.io/bot)',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9'
    },
    validateStatus: () => true // Accept all status codes
  });

  return {
    html: response.data,
    statusCode: response.status,
    headers: response.headers as Record<string, string>,
    finalUrl: response.request?.res?.responseUrl || url
  };
}

/**
 * Check meta tags (title, description)
 */
function checkMetaTags($: cheerio.CheerioAPI, url: string): QuickScanIssue[] {
  const issues: QuickScanIssue[] = [];

  // Title check
  const title = $('title').text().trim();
  if (!title) {
    issues.push({
      rule_key: 'SEO_TITLE_MISSING',
      severity: 'critical',
      category: 'SEO',
      title: 'Page Title Missing',
      message: 'This page has no title tag, which is critical for SEO and user experience.',
      location_path: 'head > title',
      fix_suggestion: 'Add a unique, descriptive <title> tag (50-60 characters) that includes your primary keyword.'
    });
  } else if (title.length < 30) {
    issues.push({
      rule_key: 'SEO_TITLE_SHORT',
      severity: 'moderate',
      category: 'SEO',
      title: 'Page Title Too Short',
      message: `Title is only ${title.length} characters. Recommended: 50-60 characters.`,
      location_path: 'head > title',
      fix_suggestion: 'Expand your title to include more descriptive keywords while staying under 60 characters.'
    });
  } else if (title.length > 60) {
    issues.push({
      rule_key: 'SEO_TITLE_LONG',
      severity: 'minor',
      category: 'SEO',
      title: 'Page Title Too Long',
      message: `Title is ${title.length} characters and may be truncated in search results.`,
      location_path: 'head > title',
      fix_suggestion: 'Shorten your title to under 60 characters to prevent truncation in search results.'
    });
  }

  // Meta description check
  const description = $('meta[name="description"]').attr('content')?.trim();
  if (!description) {
    issues.push({
      rule_key: 'SEO_DESC_MISSING',
      severity: 'serious',
      category: 'SEO',
      title: 'Meta Description Missing',
      message: 'No meta description found. Search engines may generate one from page content.',
      location_path: 'head > meta[name="description"]',
      fix_suggestion: 'Add a compelling meta description (150-160 characters) that summarizes the page and includes a call-to-action.'
    });
  } else if (description.length < 70) {
    issues.push({
      rule_key: 'SEO_DESC_SHORT',
      severity: 'moderate',
      category: 'SEO',
      title: 'Meta Description Too Short',
      message: `Description is only ${description.length} characters. Recommended: 150-160 characters.`,
      location_path: 'head > meta[name="description"]',
      fix_suggestion: 'Expand your meta description to fully utilize the available space in search results.'
    });
  }

  return issues;
}

/**
 * Check heading structure
 */
function checkHeadings($: cheerio.CheerioAPI): QuickScanIssue[] {
  const issues: QuickScanIssue[] = [];

  const h1Tags = $('h1');
  if (h1Tags.length === 0) {
    issues.push({
      rule_key: 'SEO_H1_MISSING',
      severity: 'serious',
      category: 'SEO',
      title: 'H1 Heading Missing',
      message: 'No H1 heading found. Every page should have exactly one H1 tag.',
      location_path: 'body > h1',
      fix_suggestion: 'Add a single H1 tag that clearly describes the main topic of the page.'
    });
  } else if (h1Tags.length > 1) {
    issues.push({
      rule_key: 'SEO_H1_MULTIPLE',
      severity: 'moderate',
      category: 'SEO',
      title: 'Multiple H1 Headings',
      message: `Found ${h1Tags.length} H1 tags. Best practice is to have exactly one.`,
      location_path: 'body > h1',
      fix_suggestion: 'Keep only one H1 tag and convert others to H2 or lower heading levels.'
    });
  }

  return issues;
}

/**
 * Check images for alt text
 */
function checkImages($: cheerio.CheerioAPI): QuickScanIssue[] {
  const issues: QuickScanIssue[] = [];

  const images = $('img');
  const imagesWithoutAlt = images.filter((_, el) => {
    const alt = $(el).attr('alt');
    return alt === undefined || alt === null;
  });

  if (imagesWithoutAlt.length > 0) {
    const severity = imagesWithoutAlt.length > 5 ? 'serious' : 'moderate';
    issues.push({
      rule_key: 'ACC_IMG_ALT_MISSING',
      severity,
      category: 'Accessibility',
      title: 'Images Missing Alt Text',
      message: `${imagesWithoutAlt.length} image(s) are missing alt attributes, affecting accessibility and SEO.`,
      location_path: 'img[alt]',
      fix_suggestion: 'Add descriptive alt text to all images. Use empty alt="" for decorative images only.'
    });
  }

  return issues;
}

/**
 * Check for broken or problematic links
 */
function checkLinks($: cheerio.CheerioAPI, baseUrl: string): QuickScanIssue[] {
  const issues: QuickScanIssue[] = [];

  const links = $('a[href]');
  let emptyHrefs = 0;
  let hashOnlyLinks = 0;

  links.each((_, el) => {
    const href = $(el).attr('href')?.trim();
    if (!href || href === '') {
      emptyHrefs++;
    } else if (href === '#') {
      hashOnlyLinks++;
    }
  });

  if (emptyHrefs > 0) {
    issues.push({
      rule_key: 'ACC_LINK_EMPTY',
      severity: 'serious',
      category: 'Accessibility',
      title: 'Empty Link Destinations',
      message: `${emptyHrefs} link(s) have empty or missing href attributes.`,
      location_path: 'a[href=""]',
      fix_suggestion: 'Ensure all links have valid href attributes pointing to actual destinations.'
    });
  }

  return issues;
}

/**
 * Check for structured data
 */
function checkStructuredData($: cheerio.CheerioAPI): QuickScanIssue[] {
  const issues: QuickScanIssue[] = [];

  const jsonLd = $('script[type="application/ld+json"]');
  const microdata = $('[itemscope]');

  if (jsonLd.length === 0 && microdata.length === 0) {
    issues.push({
      rule_key: 'SEO_SCHEMA_MISSING',
      severity: 'moderate',
      category: 'SEO',
      title: 'No Structured Data Found',
      message: 'No JSON-LD or Microdata structured data detected.',
      location_path: 'head > script[type="application/ld+json"]',
      fix_suggestion: 'Add structured data (Schema.org) to help search engines understand your content better.'
    });
  }

  return issues;
}

/**
 * Check robots.txt
 */
async function checkRobotsTxt(url: string): Promise<QuickScanIssue[]> {
  const issues: QuickScanIssue[] = [];

  try {
    const robotsUrl = new URL('/robots.txt', url).toString();
    const response = await axios.get(robotsUrl, {
      timeout: 10000,
      validateStatus: () => true
    });

    if (response.status === 404) {
      issues.push({
        rule_key: 'SEO_ROBOTS_MISSING',
        severity: 'moderate',
        category: 'SEO',
        title: 'robots.txt Not Found',
        message: 'No robots.txt file found. This file helps control search engine crawling.',
        location_path: '/robots.txt',
        fix_suggestion: 'Create a robots.txt file to guide search engine crawlers on which pages to index.'
      });
    } else if (response.status === 200) {
      const content = response.data.toString();
      if (content.includes('Disallow: /') && !content.includes('Disallow: / ')) {
        // Check if it's blocking everything
        if (content.match(/Disallow:\s*\/\s*$/m)) {
          issues.push({
            rule_key: 'SEO_ROBOTS_BLOCKING',
            severity: 'critical',
            category: 'SEO',
            title: 'robots.txt Blocking All Crawlers',
            message: 'Your robots.txt appears to be blocking all search engine crawlers.',
            location_path: '/robots.txt',
            fix_suggestion: 'Review your robots.txt to ensure you\'re not accidentally blocking search engines.'
          });
        }
      }
    }
  } catch (error) {
    // Silently ignore robots.txt fetch errors
  }

  return issues;
}

/**
 * Check sitemap
 */
async function checkSitemap(url: string): Promise<QuickScanIssue[]> {
  const issues: QuickScanIssue[] = [];

  try {
    const sitemapUrl = new URL('/sitemap.xml', url).toString();
    const response = await axios.get(sitemapUrl, {
      timeout: 10000,
      validateStatus: () => true
    });

    if (response.status === 404) {
      issues.push({
        rule_key: 'SEO_SITEMAP_MISSING',
        severity: 'serious',
        category: 'SEO',
        title: 'XML Sitemap Missing',
        message: 'No sitemap.xml found. Sitemaps help search engines discover your pages.',
        location_path: '/sitemap.xml',
        fix_suggestion: 'Create and submit an XML sitemap to help search engines index your content.'
      });
    }
  } catch (error) {
    // Silently ignore sitemap fetch errors
  }

  return issues;
}

/**
 * Check mobile viewport
 */
function checkMobileViewport($: cheerio.CheerioAPI): QuickScanIssue[] {
  const issues: QuickScanIssue[] = [];

  const viewport = $('meta[name="viewport"]');
  if (viewport.length === 0) {
    issues.push({
      rule_key: 'SEO_VIEWPORT_MISSING',
      severity: 'critical',
      category: 'Performance',
      title: 'Mobile Viewport Not Set',
      message: 'No viewport meta tag found. This page may not display correctly on mobile devices.',
      location_path: 'head > meta[name="viewport"]',
      fix_suggestion: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> for mobile support.'
    });
  }

  return issues;
}

/**
 * Check canonical URL
 */
function checkCanonical($: cheerio.CheerioAPI, url: string): QuickScanIssue[] {
  const issues: QuickScanIssue[] = [];

  const canonical = $('link[rel="canonical"]').attr('href');
  if (!canonical) {
    issues.push({
      rule_key: 'SEO_CANONICAL_MISSING',
      severity: 'moderate',
      category: 'SEO',
      title: 'Canonical URL Not Set',
      message: 'No canonical link found. This can lead to duplicate content issues.',
      location_path: 'head > link[rel="canonical"]',
      fix_suggestion: 'Add a canonical link to specify the preferred URL for this page.'
    });
  }

  return issues;
}

/**
 * Check language declaration
 */
function checkLanguage($: cheerio.CheerioAPI): QuickScanIssue[] {
  const issues: QuickScanIssue[] = [];

  const lang = $('html').attr('lang');
  if (!lang) {
    issues.push({
      rule_key: 'ACC_LANG_MISSING',
      severity: 'serious',
      category: 'Accessibility',
      title: 'Page Language Not Set',
      message: 'The <html> tag is missing a lang attribute, affecting accessibility.',
      location_path: 'html[lang]',
      fix_suggestion: 'Add lang="en" (or appropriate language code) to the <html> tag.'
    });
  }

  return issues;
}

/**
 * Calculate overall score
 */
function calculateScore(issues: QuickScanIssue[]): number {
  let deductions = 0;

  for (const issue of issues) {
    deductions += SEVERITY_WEIGHTS[issue.severity] || 0;
  }

  // Start at 100, deduct for issues, minimum 0
  return Math.max(0, Math.min(100, 100 - deductions));
}

/**
 * Normalize URL
 */
function normalizeUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url;
}

/**
 * Create the BullMQ worker
 */
export const quickScanWorker = new Worker('quick-scan', async (job: Job<QuickScanJobData>) => {
  const { analysisId, url, userId, workspaceId, isGuest } = job.data;

  logger.info('Starting quick scan job', { analysisId, url, isGuest });

  try {
    // Update analysis status to processing
    await supabase
      .from('analyses')
      .update({ status: 'processing' })
      .eq('id', analysisId);

    // Perform the quick scan
    const result = await performQuickScan(url);

    // Store results
    if (result.success) {
      // Update analysis with results
      await supabase
        .from('analyses')
        .update({
          status: 'completed',
          url: result.url,
          scores: {
            overall: result.score,
            accessibility: calculateCategoryScore(result.issues, 'Accessibility'),
            seo: calculateCategoryScore(result.issues, 'SEO'),
            performance: calculateCategoryScore(result.issues, 'Performance')
          },
          metadata: result.metadata,
          completed_at: new Date().toISOString()
        })
        .eq('id', analysisId);

      // Store issues (for registered users only)
      if (!isGuest && userId) {
        for (const issue of result.issues) {
          const table = issue.category === 'Accessibility' ? 'accessibility_issues'
            : issue.category === 'Performance' ? 'performance_issues'
            : 'seo_issues';

          await supabase.from(table).insert({
            analysis_id: analysisId,
            rule_key: issue.rule_key,
            severity: issue.severity,
            message: issue.message,
            location_path: issue.location_path,
            fix_suggestion: issue.fix_suggestion
          });
        }
      }
    } else {
      await supabase
        .from('analyses')
        .update({
          status: 'failed',
          metadata: { error: result.issues[0]?.message || 'Unknown error' }
        })
        .eq('id', analysisId);
    }

    logger.info('Quick scan completed', {
      analysisId,
      success: result.success,
      score: result.score,
      issueCount: result.issues.length
    });

    return result;

  } catch (error) {
    logger.error('Quick scan job failed', {
      analysisId,
      error: (error as Error).message
    });

    await supabase
      .from('analyses')
      .update({
        status: 'failed',
        metadata: { error: (error as Error).message }
      })
      .eq('id', analysisId);

    throw error;
  }
}, {
  connection: {
    host: config.redis.host,
    port: config.redis.port,
  },
  concurrency: 10, // Can handle many concurrent quick scans
});

/**
 * Calculate score for a specific category
 */
function calculateCategoryScore(issues: QuickScanIssue[], category: string): number {
  const categoryIssues = issues.filter(i => i.category === category);
  let deductions = 0;

  for (const issue of categoryIssues) {
    deductions += SEVERITY_WEIGHTS[issue.severity] || 0;
  }

  return Math.max(0, Math.min(100, 100 - deductions));
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Shutting down quick scan worker...');
  await quickScanWorker.close();
});

export default quickScanWorker;
