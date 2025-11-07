import { Job, Worker } from 'bullmq';
import { config } from '@/config';
import { createLogger } from '@/config/logger';
import { supabase } from '@/config/supabase';
import { AppError } from '@/types';
import { checkAndUpdateAnalysisCompletion } from '@/core/workers/master.worker';
import { JSDOM } from 'jsdom';
import { AiContentAnalysisService, type PageContentData } from '@/services/analysis/aiContentAnalysis';

const logger = createLogger('seo-technical-worker');

// Initialize AI Content Analysis Service
const aiContentService = new AiContentAnalysisService();

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

interface SeoIssue {
  rule_key: string;
  severity: IssueSeverity;
  location_path?: string;
  code_snippet?: string;
  message?: string;
  fix_suggestion?: string;
}

// Enhanced SEO Analysis Functions
async function analyzeContentSEO(dom: Document, url: string): Promise<SeoIssue[]> {
  const issues: SeoIssue[] = [];
  
  // SEO_CON_01_TITLE_TAG_MISSING
  const titleElement = dom.querySelector('title');
  if (!titleElement || !titleElement.textContent?.trim()) {
    issues.push({
      rule_key: 'SEO_CON_01_TITLE_TAG_MISSING',
      severity: 'critical',
      location_path: 'head > title',
      code_snippet: '<!-- No title tag found -->',
      message: 'Page title tag is missing or empty',
      fix_suggestion: 'Add a unique, descriptive title tag (50-60 characters) that accurately describes the page content and includes your target keyword. Title tags are crucial for SEO and appear in search results.'
    });
  } else {
    const title = titleElement.textContent.trim();

    // SEO_CON_02_TITLE_TAG_LENGTH
    if (title.length < 30 || title.length > 60) {
      const suggestion = title.length < 30
        ? 'Expand your title tag to be more descriptive and include target keywords. Aim for 50-60 characters to fully utilize search result space.'
        : 'Shorten your title tag to prevent truncation in search results. Keep it under 60 characters to avoid being cut off with "..." in search results.';

      issues.push({
        rule_key: 'SEO_CON_02_TITLE_TAG_LENGTH',
        severity: 'serious',
        location_path: 'head > title',
        code_snippet: `Current title (${title.length} chars):\n<title>${title}</title>`,
        message: `Title tag length is ${title.length} characters (optimal: 50-60 characters)`,
        fix_suggestion: suggestion
      });
    }
  }

  // SEO_CON_04_META_DESC_MISSING
  const metaDescription = dom.querySelector('meta[name="description"]') as HTMLMetaElement;
  if (!metaDescription || !metaDescription.content?.trim()) {
    issues.push({
      rule_key: 'SEO_CON_04_META_DESC_MISSING',
      severity: 'serious',
      location_path: 'head > meta[name="description"]',
      code_snippet: '<!-- No meta description found -->',
      message: 'Meta description is missing',
      fix_suggestion: 'Add a compelling meta description (150-160 characters) that summarizes the page content and encourages clicks. Meta descriptions act as advertising copy in search results and significantly impact click-through rates.'
    });
  } else {
    const description = metaDescription.content.trim();

    // SEO_CON_05_META_DESC_LENGTH
    if (description.length < 120 || description.length > 160) {
      const suggestion = description.length < 120
        ? 'Expand your meta description to better describe the page content. Aim for 150-160 characters to fully utilize the space available in search results and include compelling calls-to-action.'
        : 'Shorten your meta description to prevent truncation. Keep it under 160 characters to avoid being cut off in search results, which can hide important information or calls-to-action.';

      issues.push({
        rule_key: 'SEO_CON_05_META_DESC_LENGTH',
        severity: 'moderate',
        location_path: 'head > meta[name="description"]',
        code_snippet: `Current meta description (${description.length} chars):\n<meta name="description" content="${description}">`,
        message: `Meta description length is ${description.length} characters (optimal: 120-160 characters)`,
        fix_suggestion: suggestion
      });
    }
  }

  // SEO_CON_07_H1_MISSING & SEO_CON_08_H1_DUPLICATE
  const h1Elements = dom.querySelectorAll('h1');
  if (h1Elements.length === 0) {
    issues.push({
      rule_key: 'SEO_CON_07_H1_MISSING',
      severity: 'serious',
      location_path: 'body',
      code_snippet: '<!-- No H1 tag found -->',
      message: 'Page is missing an H1 heading tag',
      fix_suggestion: 'Add a clear, descriptive H1 tag that represents the main topic of the page. Each page should have exactly one H1 tag that helps search engines and users understand the page content. The H1 should include your primary keyword naturally.'
    });
  } else if (h1Elements.length > 1) {
    const allH1s = Array.from(h1Elements).map(el => `<h1>${el.textContent?.trim()}</h1>`).join('\n');
    issues.push({
      rule_key: 'SEO_CON_08_H1_DUPLICATE',
      severity: 'moderate',
      location_path: 'body',
      code_snippet: `Found ${h1Elements.length} H1 tags:\n${allH1s}`,
      message: `Page has ${h1Elements.length} H1 tags (should have exactly one)`,
      fix_suggestion: 'Use only one H1 tag per page. Convert additional H1 tags to H2, H3, etc. to maintain proper heading hierarchy. Multiple H1 tags confuse search engines about the main topic. Use H1 for the page title, then H2-H6 for subsections.'
    });
  }

  return issues;
}

async function analyzeContentStructure(dom: Document, url: string): Promise<SeoIssue[]> {
  const issues: SeoIssue[] = [];
  
  // Get body content for analysis
  const bodyText = dom.body?.textContent || '';
  const wordCount = bodyText.split(/\s+/).filter(word => word.length > 0).length;
  
  // SEO_STR_01_CONTENT_LENGTH
  if (wordCount < 300) {
    issues.push({
      rule_key: 'SEO_STR_01_CONTENT_LENGTH',
      severity: 'moderate',
      location_path: 'body',
      message: `Page has only ${wordCount} words (recommended: 300+ words for better authority)`,
      fix_suggestion: 'Add more valuable, relevant content to establish page authority and improve search rankings.'
    });
  }

  // SEO_STR_02_KEYWORD_DENSITY - Basic keyword stuffing detection
  const title = dom.querySelector('title')?.textContent || '';
  const metaDesc = dom.querySelector('meta[name="description"]')?.getAttribute('content') || '';
  const h1Text = dom.querySelector('h1')?.textContent || '';
  
  if (title || metaDesc || h1Text) {
    // Extract potential keywords from title and check for over-optimization
    const titleWords = title.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    const contentLower = bodyText.toLowerCase();
    
    for (const word of titleWords.slice(0, 3)) { // Check top 3 title words
      const wordRegex = new RegExp(`\\b${word}\\b`, 'g');
      const matches = contentLower.match(wordRegex);
      const density = matches ? (matches.length / wordCount) * 100 : 0;
      
      if (density > 3) { // Over 3% density is typically considered stuffing
        issues.push({
          rule_key: 'SEO_STR_02_KEYWORD_DENSITY',
          severity: 'moderate',
          location_path: 'body',
          code_snippet: `Keyword "${word}" appears ${matches ? matches.length : 0} times in ${wordCount} words (${density.toFixed(1)}% density)`,
          message: `Keyword over-optimization detected for "${word}" (${density.toFixed(1)}% density, recommended: 1-2%)`,
          fix_suggestion: `Use keywords naturally throughout your content without overstuffing:\n• Reduce repetition of "${word}" to achieve 1-2% density\n• Use synonyms and related terms for variety\n• Focus on writing for users, not search engines\n• Let keywords flow naturally in sentences\n\nNatural keyword usage (1-2% density) ranks better than keyword stuffing, which can be penalized.`
        });
        break; // Only report once per page
      }
    }
  }

  // SEO_STR_03_INTERNAL_LINKS
  const internalLinks = Array.from(dom.querySelectorAll('a[href]'))
    .filter(link => {
      const href = link.getAttribute('href');
      return href && (href.startsWith('/') || href.includes(new URL(url).hostname));
    });
    
  if (internalLinks.length < 3) {
    issues.push({
      rule_key: 'SEO_STR_03_INTERNAL_LINKS',
      severity: 'moderate',
      location_path: 'body',
      message: `Page has only ${internalLinks.length} internal links (recommended: 3+ for better site architecture)`,
      fix_suggestion: 'Add relevant internal links to other pages on your site to improve navigation and distribute page authority.'
    });
  }

  // SEO_STR_04_EXTERNAL_LINKS
  const externalLinks = Array.from(dom.querySelectorAll('a[href]'))
    .filter(link => {
      const href = link.getAttribute('href');
      return href && href.startsWith('http') && !href.includes(new URL(url).hostname);
    });

  if (externalLinks.length === 0 && wordCount > 500) {
    issues.push({
      rule_key: 'SEO_STR_04_EXTERNAL_LINKS',
      severity: 'minor',
      location_path: 'body',
      message: 'Page has no external links to authoritative sources',
      fix_suggestion: 'Consider adding links to relevant, authoritative external sources to improve content credibility.'
    });
  }

  return issues;
}

async function analyzeStructuredData(dom: Document, url: string): Promise<SeoIssue[]> {
  const issues: SeoIssue[] = [];
  
  // Check for JSON-LD structured data
  const jsonLdScripts = dom.querySelectorAll('script[type="application/ld+json"]');
  const hasValidStructuredData = Array.from(jsonLdScripts).some(script => {
    try {
      const data = JSON.parse(script.textContent || '');
      return data['@context'] || data['@type'];
    } catch {
      return false;
    }
  });

  // Check for microdata
  const microdataElements = dom.querySelectorAll('[itemscope], [itemtype], [itemprop]');
  
  // SEO_SCHEMA_01_ORGANIZATION
  const hasOrgSchema = Array.from(jsonLdScripts).some(script => {
    try {
      const data = JSON.parse(script.textContent || '');
      return data['@type'] === 'Organization' || 
             (Array.isArray(data) && data.some(item => item['@type'] === 'Organization'));
    } catch {
      return false;
    }
  });

  if (!hasOrgSchema && !dom.querySelector('[itemtype*="Organization"]')) {
    issues.push({
      rule_key: 'SEO_SCHEMA_01_ORGANIZATION',
      severity: 'moderate',
      location_path: 'head > script[type="application/ld+json"]',
      message: 'Organization schema markup is missing',
      fix_suggestion: 'Add Organization schema to help search engines understand your business information and improve brand visibility.'
    });
  }

  // SEO_SCHEMA_02_BREADCRUMB
  const hasBreadcrumbSchema = Array.from(jsonLdScripts).some(script => {
    try {
      const data = JSON.parse(script.textContent || '');
      return data['@type'] === 'BreadcrumbList' ||
             (Array.isArray(data) && data.some(item => item['@type'] === 'BreadcrumbList'));
    } catch {
      return false;
    }
  });

  const hasBreadcrumbElements = dom.querySelector('nav[aria-label*="breadcrumb" i], .breadcrumb, .breadcrumbs');
  
  if (hasBreadcrumbElements && !hasBreadcrumbSchema && !dom.querySelector('[itemtype*="BreadcrumbList"]')) {
    issues.push({
      rule_key: 'SEO_SCHEMA_02_BREADCRUMB',
      severity: 'minor',
      location_path: 'navigation',
      message: 'Breadcrumb navigation exists but lacks structured data markup',
      fix_suggestion: 'Add BreadcrumbList schema markup to your breadcrumb navigation to enhance search result display.'
    });
  }

  // SEO_SCHEMA_03_ARTICLE
  const hasArticleSchema = Array.from(jsonLdScripts).some(script => {
    try {
      const data = JSON.parse(script.textContent || '');
      return data['@type'] === 'Article' || data['@type'] === 'BlogPosting' ||
             (Array.isArray(data) && data.some(item => ['Article', 'BlogPosting'].includes(item['@type'])));
    } catch {
      return false;
    }
  });

  // Check if this looks like an article page
  const bodyText = dom.body?.textContent || '';
  const isArticlePage = dom.querySelector('article') || 
                       dom.querySelector('h1') && bodyText.split(/\s+/).length > 300;

  if (isArticlePage && !hasArticleSchema && !dom.querySelector('[itemtype*="Article"]')) {
    const pageTitle = dom.querySelector('title')?.textContent?.trim() || 'Your Article';
    issues.push({
      rule_key: 'SEO_SCHEMA_03_ARTICLE',
      severity: 'moderate',
      location_path: 'article content',
      code_snippet: '<!-- No Article schema markup found -->',
      message: 'Article schema enhances content appearance in search results',
      fix_suggestion: `Add Article structured data to help search engines understand your content:\n• Include headline: "${pageTitle}"\n• Add author information\n• Specify publish and modified dates\n• Include article description\n• Add featured image URL\n\nArticle schema helps your content appear in Google News, enables rich snippets with author photos and publish dates, and can improve click-through rates by up to 30%.`
    });
  }

  return issues;
}

async function analyzeMobileFriendly(dom: Document): Promise<SeoIssue[]> {
  const issues: SeoIssue[] = [];
  
  // SEO_TEC_08_MOBILE_FRIENDLY
  const viewportMeta = dom.querySelector('meta[name="viewport"]') as HTMLMetaElement;
  
  if (!viewportMeta) {
    issues.push({
      rule_key: 'SEO_TEC_08_MOBILE_FRIENDLY',
      severity: 'critical',
      location_path: 'head > meta[name="viewport"]',
      message: 'Viewport meta tag is missing - page may not be mobile-friendly',
      fix_suggestion: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to ensure proper mobile display.'
    });
  } else {
    const content = viewportMeta.content || '';
    const hasWidthDevice = content.includes('width=device-width');
    const hasInitialScale = content.includes('initial-scale=1');
    
    if (!hasWidthDevice || !hasInitialScale) {
      issues.push({
        rule_key: 'SEO_TEC_08_MOBILE_FRIENDLY',
        severity: 'serious',
        location_path: 'head > meta[name="viewport"]',
        message: 'Viewport meta tag configuration may not be optimal for mobile devices',
        fix_suggestion: 'Update viewport meta tag to include "width=device-width, initial-scale=1" for optimal mobile experience.'
      });
    }
  }

  return issues;
}

async function analyzeContentWithAI(dom: Document, url: string): Promise<SeoIssue[]> {
  const issues: SeoIssue[] = [];
  
  logger.info('Starting AI content analysis', { url });
  
  try {
    // Extract page content for AI analysis
    const title = dom.querySelector('title')?.textContent || '';
    const metaDescription = dom.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const headings = Array.from(dom.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => h.textContent || '');
    const bodyText = dom.body?.textContent || '';
    
    const pageData: PageContentData = {
      title,
      metaDescription,
      headings,
      bodyText,
      url
    };
    
    // Run AI content analysis
    const analysis = await aiContentService.analyzeContent(pageData);
    
    // Generate issues based on AI analysis
    if (analysis.readabilityScore < 60) {
      issues.push({
        rule_key: 'SEO_AI_01_READABILITY',
        severity: 'moderate',
        location_path: 'body content',
        code_snippet: `Current Readability Score: ${analysis.readabilityScore}/100`,
        message: `Content readability score is ${analysis.readabilityScore}/100 (recommended: 60+)`,
        fix_suggestion: `Improve content readability by:\n• Using shorter sentences (under 20 words)\n• Choosing simpler vocabulary\n• Using active voice instead of passive\n• Breaking content into clear paragraphs\n• Adding bullet points and headings\n\nBetter readability keeps visitors engaged longer and helps search engines understand your content.`
      });
    }
    
    if (analysis.contentRelevance < 70) {
      const title = pageData.title || 'Page Title';
      issues.push({
        rule_key: 'SEO_AI_02_CONTENT_RELEVANCE',
        severity: 'serious',
        location_path: 'content alignment',
        code_snippet: `Page Title: "${title}"\n\nFirst 200 chars of content: "${pageData.bodyText.substring(0, 200)}..."`,
        message: `Content relevance to title/meta is ${analysis.contentRelevance}% (recommended: 70%+)`,
        fix_suggestion: `Ensure your page content directly matches and supports your title tag:\n• Use main title keywords in the first paragraph\n• Address what the title promises immediately\n• Maintain consistent topic throughout the page\n• Avoid misleading titles that don't match content\n\nWhen content matches the title, users stay longer and bounce rate decreases.`
      });
    }
    
    if (analysis.keywordRelevance < 50) {
      issues.push({
        rule_key: 'SEO_AI_03_KEYWORD_RELEVANCE',
        severity: 'moderate',
        location_path: 'keyword usage',
        code_snippet: `Current Keyword Relevance: ${analysis.keywordRelevance}/100`,
        message: `Keyword relevance score is ${analysis.keywordRelevance}/100 (recommended: 50%+)`,
        fix_suggestion: `Optimize keyword usage naturally:\n• Aim for 1-2% keyword density (not too high, not too low)\n• Use keywords in title, headings, and first paragraph\n• Include semantic variations and related terms\n• Focus on user value, not keyword stuffing\n• Let keywords flow naturally in sentences\n\nNatural keyword usage (1-2% density) ranks better than keyword stuffing.`
      });
    }
    
    // Add content gaps as suggestions
    if (analysis.contentGaps.length > 0) {
      issues.push({
        rule_key: 'SEO_AI_04_CONTENT_GAPS',
        severity: 'minor',
        location_path: 'content strategy',
        code_snippet: `Identified gaps:\n${analysis.contentGaps.map(gap => `• ${gap}`).join('\n')}`,
        message: 'AI analysis identified potential content improvements',
        fix_suggestion: `Enhance your content with:\n${analysis.contentGaps.map(gap => `• ${gap}`).join('\n')}\n\nComprehensive content increases engagement and conversion rates, while establishing your site as an authority.`
      });
    }
    
    // Add semantic suggestions if available
    if (analysis.semanticSuggestions.length > 0) {
      issues.push({
        rule_key: 'SEO_AI_05_SEMANTIC_OPPORTUNITIES',
        severity: 'minor',
        location_path: 'semantic SEO',
        code_snippet: `Suggested related keywords:\n${analysis.semanticSuggestions.map(keyword => `• ${keyword}`).join('\n')}`,
        message: 'Related semantic keywords could improve content relevance',
        fix_suggestion: `Include these related semantic keywords naturally in your content:\n${analysis.semanticSuggestions.map(keyword => `• ${keyword}`).join('\n')}\n\nSemantic keywords help search engines understand your content context better and capture more search queries.`
      });
    }
    
    logger.info('AI content analysis completed', { 
      analysisId: url,
      readabilityScore: analysis.readabilityScore,
      contentRelevance: analysis.contentRelevance,
      userIntent: analysis.userIntentMatch,
      issuesFound: issues.length
    });
    
  } catch (error) {
    logger.warn('AI content analysis failed, continuing without AI insights', { 
      error: error.message,
      stack: error.stack,
      url: url
    });
    // Don't throw error - AI analysis is optional enhancement
  }
  
  return issues;
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
  logger.info('Starting Enhanced SEO analysis with 25+ rules + AI insights', { analysisId, assetPath });

  let moduleJobInfo: { moduleId: string; jobId: string } | null = null;

  try {
    moduleJobInfo = await getSeoModuleAndJobId(analysisId);
    if (!moduleJobInfo) throw new AppError('Failed to get SEO job info', 500);

    await updateSeoJobStatus(analysisId, moduleJobInfo.moduleId, 'running');

    let allIssues: SeoIssue[] = [];

    // Phase 1: Technical SEO Analysis (existing + enhanced)
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
          allIssues.push({
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
    
    // SEO_TEC_07_HTTPS_MISSING
    if (!isHttps) {
      allIssues.push({
        rule_key: 'SEO_TEC_07_HTTPS_MISSING',
        severity: 'critical',
        location_path: 'URL protocol',
        message: 'Website is not served over HTTPS',
        fix_suggestion: 'Implement SSL certificate and redirect all HTTP traffic to HTTPS for better security and SEO rankings.'
      });
    }

    // Phase 2: Robots.txt Analysis  
    const robotsPath = `${assetPath}/meta/robots.txt`;
    const robotsTxt = await downloadTextFromStorage(robotsPath);
    let hasSitemapInRobots = false;
    
    if (!robotsTxt) {
      allIssues.push({
        rule_key: 'SEO_TEC_01_ROBOTS_TXT_MISSING',
        severity: 'serious',
        location_path: '/robots.txt',
        message: 'robots.txt file is missing',
        fix_suggestion: 'Create a robots.txt file to provide crawl guidance to search engines and declare sitemap location.'
      });
    } else {
      // Check for syntax errors
      if (/Disallow\s*:\s*$/im.test(robotsTxt) || /User-agent\s*:\s*$/im.test(robotsTxt)) {
        allIssues.push({
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
        allIssues.push({
          rule_key: 'SEO_TEC_02_ROBOTS_TXT_ERRORS',
          severity: 'critical',
          location_path: '/robots.txt',
          message: 'robots.txt appears to block all crawling',
          fix_suggestion: 'Review Disallow directives - blocking all crawling prevents search engine indexing.'
        });
      }
    }
    
    // Phase 3: XML Sitemap Check
    try {
      const origin = new URL(finalUrl).origin;
      const sitemapUrl = `${origin}/sitemap.xml`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const sitemapResp = await fetch(sitemapUrl, { signal: controller.signal, headers: { 'User-Agent': 'SiteCraft-Analyzer/1.0' } });
      clearTimeout(timeout);
      
      if (!sitemapResp.ok) {
        allIssues.push({
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
          allIssues.push({
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

    // Phase 4: Enhanced HTML Analysis with JSDOM and All SEO Rules
    const htmlPath = `${assetPath}/html/index.html`;
    const html = await downloadTextFromStorage(htmlPath);
    if (html) {
      // Parse HTML with JSDOM for comprehensive analysis
      const dom = new JSDOM(html);
      const document = dom.window.document;
      
      // Run all enhanced SEO analysis functions in parallel (including AI)
      const [contentIssues, structureIssues, schemaIssues, mobileIssues, aiIssues] = await Promise.all([
        analyzeContentSEO(document, finalUrl),
        analyzeContentStructure(document, finalUrl),
        analyzeStructuredData(document, finalUrl),
        analyzeMobileFriendly(document),
        analyzeContentWithAI(document, finalUrl)
      ]);
      
      // Add all issues from enhanced analysis (including AI)
      allIssues.push(...contentIssues, ...structureIssues, ...schemaIssues, ...mobileIssues, ...aiIssues);
      
      // Lightweight parse for canonical and meta robots (existing logic)
      const linkCanonicalMatches = [...html.matchAll(/<link\s+[^>]*rel=["']?canonical["']?[^>]*>/gi)];
      const hrefMatches = linkCanonicalMatches.map(m => {
        const tag = m[0];
        const href = /href=["']([^"']+)["']/i.exec(tag)?.[1];
        return href || null;
      }).filter(Boolean) as string[];

      const normalizedFinalUrl = normalizeUrlForCanonical(finalUrl);

      if (hrefMatches.length === 0) {
        allIssues.push({
          rule_key: 'SEO_TEC_05_CANONICAL_MISSING',
          severity: 'critical',
          location_path: 'head > link[rel="canonical"]',
          message: 'Canonical tag missing',
          fix_suggestion: 'Add a single canonical link tag referencing the preferred, absolute URL.'
        });
      } else {
        if (hrefMatches.length > 1) {
          allIssues.push({
            rule_key: 'SEO_TEC_06_CANONICAL_SELF_REFERENCE',
            severity: 'moderate',
            location_path: 'head > link[rel="canonical"]',
            message: 'Multiple canonical tags found',
            fix_suggestion: 'Keep only one canonical link element per page.'
          });
        }
        const canonicalHref = normalizeUrlForCanonical(hrefMatches[0]);
        if (canonicalHref && normalizedFinalUrl && canonicalHref !== normalizedFinalUrl) {
          allIssues.push({
            rule_key: 'SEO_TEC_06_CANONICAL_SELF_REFERENCE',
            severity: 'moderate',
            location_path: 'head > link[rel="canonical"]',
            message: `Canonical does not self-reference the final URL. canonical=${canonicalHref}, final=${normalizedFinalUrl}`,
            fix_suggestion: 'Update canonical href to point to the final, preferred absolute URL.'
          });
        }

        if (canonicalHref && !/^https?:\/\//i.test(canonicalHref)) {
          allIssues.push({
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
          allIssues.push({
            rule_key: 'SEO_TEC_02_ROBOTS_TXT_ERRORS',
            severity: 'serious',
            location_path: 'head > meta[name="robots"]',
            message: `Meta robots contains indexing restrictions: ${content}`,
            fix_suggestion: 'Remove noindex/nofollow meta robots directives unless intentionally preventing indexing.'
          });
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
          allIssues.push({
            rule_key: 'SEO_TEC_10_HREFLANG_ERRORS',
            severity: 'moderate',
            location_path: 'head > link[hreflang]',
            message: 'Hreflang implementation has validation errors',
            fix_suggestion: 'Ensure hreflang codes follow ISO format (e.g., en, en-US) and avoid duplicate entries.'
          });
        }
      }
    } else {
      logger.warn('Rendered HTML not found in storage; skipping HTML-based SEO analysis', { htmlPath });
    }

    // Insert all issues found from all analysis phases
    if (allIssues.length > 0) {
      let insertedCount = 0;
      let skippedCount = 0;
      
      for (const issue of allIssues) {
        const ruleId = await getRuleId(issue.rule_key);
        if (!ruleId) {
          logger.warn('Rule not found in database, skipping issue', { 
            ruleKey: issue.rule_key,
            message: issue.message
          });
          skippedCount++;
          continue;
        }
        
        const { error } = await supabase
          .from('seo_issues')
          .insert({
            analysis_job_id: moduleJobInfo.jobId,
            rule_id: ruleId,
            severity: issue.severity,
            location_path: issue.location_path,
            code_snippet: issue.code_snippet,
            message: issue.message,
            fix_suggestion: issue.fix_suggestion,
          });
          
        if (error) {
          logger.error('Failed to insert SEO issue', { error, ruleKey: issue.rule_key });
          skippedCount++;
        } else {
          insertedCount++;
        }
      }
      
      logger.info('SEO issue insertion completed', { 
        analysisId,
        totalIssues: allIssues.length,
        inserted: insertedCount,
        skipped: skippedCount
      });
    }

    await updateSeoJobStatus(analysisId, moduleJobInfo.moduleId, 'completed');
    await checkAndUpdateAnalysisCompletion(analysisId);

    logger.info('Enhanced SEO analysis completed with 25+ rules + AI insights', { analysisId, issueCount: allIssues.length });
    return { success: true, issues: allIssues.length };
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


