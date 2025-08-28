import { Job, Worker } from 'bullmq';
import { config } from '@/config';
import { createLogger } from '@/config/logger';
import { supabase } from '@/config/supabase';
import { AppError } from '@/types';
import { checkAndUpdateAnalysisCompletion } from '@/core/workers/master.worker';
import { JSDOM } from 'jsdom';
import { AiContentAnalysisService, type PageContentData } from '@/services/analysis/aiContentAnalysis';
import { SeoExamplesService } from '@/services/seo/seoExamples';

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
    const titleExample = SeoExamplesService.getTitleTagExamples(null);
    issues.push({
      rule_key: 'SEO_CON_01_TITLE_TAG_MISSING',
      severity: 'critical',
      location_path: 'head > title',
      code_snippet: titleExample.example?.badExample || '<!-- No title tag -->',
      message: 'Page title tag is missing or empty',
      fix_suggestion: `${titleExample.fix_suggestion}\n\n✅ Good Example:\n${titleExample.example?.goodExample}\n\n💡 Why this matters: ${titleExample.example?.explanation}`
    });
  } else {
    const title = titleElement.textContent.trim();
    
    // SEO_CON_02_TITLE_TAG_LENGTH  
    if (title.length < 30 || title.length > 60) {
      const titleExample = SeoExamplesService.getTitleTagExamples(title, title.length);
      issues.push({
        rule_key: 'SEO_CON_02_TITLE_TAG_LENGTH',
        severity: 'serious',
        location_path: 'head > title',
        code_snippet: `<title>${title}</title>`,
        message: `Title tag length is ${title.length} characters (optimal: 50-60 characters)`,
        fix_suggestion: `${titleExample.fix_suggestion}\n\n❌ Current:\n<title>${title}</title>\n\n✅ Improved Example:\n${titleExample.example?.goodExample}\n\n💡 Why this matters: ${titleExample.example?.explanation}`
      });
    }
  }

  // SEO_CON_04_META_DESC_MISSING
  const metaDescription = dom.querySelector('meta[name="description"]') as HTMLMetaElement;
  if (!metaDescription || !metaDescription.content?.trim()) {
    const descExample = SeoExamplesService.getMetaDescriptionExamples(null);
    issues.push({
      rule_key: 'SEO_CON_04_META_DESC_MISSING',
      severity: 'serious',
      location_path: 'head > meta[name="description"]',
      code_snippet: descExample.example?.badExample || '<!-- No meta description -->',
      message: 'Meta description is missing',
      fix_suggestion: `${descExample.fix_suggestion}\n\n✅ Good Example:\n${descExample.example?.goodExample}\n\n💡 Why this matters: ${descExample.example?.explanation}`
    });
  } else {
    const description = metaDescription.content.trim();
    
    // SEO_CON_05_META_DESC_LENGTH
    if (description.length < 120 || description.length > 160) {
      const descExample = SeoExamplesService.getMetaDescriptionExamples(description, description.length);
      issues.push({
        rule_key: 'SEO_CON_05_META_DESC_LENGTH',
        severity: 'moderate',
        location_path: 'head > meta[name="description"]',
        code_snippet: `<meta name="description" content="${description}">`,
        message: `Meta description length is ${description.length} characters (optimal: 120-160 characters)`,
        fix_suggestion: `${descExample.fix_suggestion}\n\n❌ Current (${description.length} chars):\n<meta name="description" content="${description}">\n\n✅ Improved Example:\n${descExample.example?.goodExample}\n\n💡 Why this matters: ${descExample.example?.explanation}`
      });
    }
  }

  // SEO_CON_07_H1_MISSING & SEO_CON_08_H1_DUPLICATE
  const h1Elements = dom.querySelectorAll('h1');
  if (h1Elements.length === 0) {
    const h1Example = SeoExamplesService.getH1TagExamples(null);
    issues.push({
      rule_key: 'SEO_CON_07_H1_MISSING',
      severity: 'serious',
      location_path: 'body',
      code_snippet: h1Example.example?.badExample || '<!-- No H1 tag found -->',
      message: 'Page is missing an H1 heading tag',
      fix_suggestion: `${h1Example.fix_suggestion}\n\n✅ Good Example:\n${h1Example.example?.goodExample}\n\n💡 Why this matters: ${h1Example.example?.explanation}`
    });
  } else if (h1Elements.length > 1) {
    const currentH1 = h1Elements[0]?.textContent?.trim() || '';
    const h1Example = SeoExamplesService.getH1TagExamples(currentH1, true);
    const allH1s = Array.from(h1Elements).map(el => `<h1>${el.textContent?.trim()}</h1>`).join('\n');
    issues.push({
      rule_key: 'SEO_CON_08_H1_DUPLICATE',
      severity: 'moderate',
      location_path: 'body',
      code_snippet: allH1s,
      message: `Page has ${h1Elements.length} H1 tags (should have exactly one)`,
      fix_suggestion: `${h1Example.fix_suggestion}\n\n❌ Current (${h1Elements.length} H1 tags):\n${allH1s}\n\n✅ Improved Structure:\n${h1Example.example?.goodExample}\n\n💡 Why this matters: ${h1Example.example?.explanation}`
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
        const keywordExample = SeoExamplesService.getKeywordOptimizationExamples(word, density);
        issues.push({
          rule_key: 'SEO_STR_02_KEYWORD_DENSITY',
          severity: 'moderate',
          location_path: 'body',
          code_snippet: keywordExample.example?.badExample || `<!-- Keyword "${word}" overused -->`,
          message: `Keyword over-optimization detected for "${word}" (${density.toFixed(1)}% density, recommended: 1-2%)`,
          fix_suggestion: `${keywordExample.fix_suggestion}\n\n${keywordExample.example?.badExample}\n\n${keywordExample.example?.goodExample}\n\n💡 Why this matters: ${keywordExample.example?.explanation}`
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
    const pageTitle = dom.querySelector('title')?.textContent?.trim();
    const articleExample = SeoExamplesService.getArticleSchemaExamples(pageTitle);
    issues.push({
      rule_key: 'SEO_SCHEMA_03_ARTICLE',
      severity: 'moderate',
      location_path: 'article content',
      code_snippet: articleExample.example?.badExample || '<!-- No Article schema -->',
      message: 'Article schema enhances content appearance in search results',
      fix_suggestion: `${articleExample.fix_suggestion}\n\n❌ Current:\n${articleExample.example?.badExample}\n\n✅ Add this structured data:\n${articleExample.example?.goodExample}\n\n💡 Why this matters: ${articleExample.example?.explanation}`
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
      const readabilityExample = SeoExamplesService.getContentReadabilityExamples(analysis.readabilityScore);
      issues.push({
        rule_key: 'SEO_AI_01_READABILITY',
        severity: 'moderate',
        location_path: 'body content',
        code_snippet: readabilityExample.example?.badExample || '<!-- Complex, hard-to-read content -->',
        message: `Content readability score is ${analysis.readabilityScore}/100 (recommended: 60+)`,
        fix_suggestion: `${readabilityExample.fix_suggestion}\n\n${readabilityExample.example?.badExample}\n\n${readabilityExample.example?.goodExample}\n\n💡 Why this matters: ${readabilityExample.example?.explanation}`
      });
    }
    
    if (analysis.contentRelevance < 70) {
      const title = pageData.title || 'Page Title';
      const contentMismatchExample = SeoExamplesService.getContentTitleMismatchExamples(title, pageData.bodyText.substring(0, 200));
      issues.push({
        rule_key: 'SEO_AI_02_CONTENT_RELEVANCE',
        severity: 'serious',
        location_path: 'content alignment',
        code_snippet: `Title: "${title}"\nContent preview: "${pageData.bodyText.substring(0, 150)}..."`,
        message: `Content relevance to title/meta is ${analysis.contentRelevance}% (recommended: 70%+)`,
        fix_suggestion: `${contentMismatchExample.fix_suggestion}\n\n${contentMismatchExample.example?.badExample}\n\n${contentMismatchExample.example?.goodExample}\n\n💡 Why this matters: ${contentMismatchExample.example?.explanation}`
      });
    }
    
    if (analysis.keywordRelevance < 50) {
      const keywordExample = SeoExamplesService.getKeywordOptimizationExamples('target keyword', 1.5);
      issues.push({
        rule_key: 'SEO_AI_03_KEYWORD_RELEVANCE',
        severity: 'moderate',
        location_path: 'keyword usage',
        code_snippet: keywordExample.example?.badExample || '<!-- Keyword stuffed content -->',
        message: `Keyword relevance score is ${analysis.keywordRelevance}/100 (recommended: 50%+)`,
        fix_suggestion: `${keywordExample.fix_suggestion}\n\n${keywordExample.example?.badExample}\n\n${keywordExample.example?.goodExample}\n\n💡 Why this matters: ${keywordExample.example?.explanation}`
      });
    }
    
    // Add content gaps as suggestions
    if (analysis.contentGaps.length > 0) {
      const contentExample = SeoExamplesService.getContentImprovementExamples(analysis.contentGaps);
      issues.push({
        rule_key: 'SEO_AI_04_CONTENT_GAPS',
        severity: 'minor',
        location_path: 'content strategy',
        code_snippet: contentExample.example?.badExample || '<!-- Weak content example -->',
        message: 'AI analysis identified potential content improvements',
        fix_suggestion: `${contentExample.fix_suggestion}\n\n${contentExample.example?.badExample}\n\n${contentExample.example?.goodExample}\n\n💡 Why this matters: ${contentExample.example?.explanation}`
      });
    }
    
    // Add semantic suggestions if available
    if (analysis.semanticSuggestions.length > 0) {
      const semanticExample = SeoExamplesService.getSemanticKeywordExamples(analysis.semanticSuggestions);
      issues.push({
        rule_key: 'SEO_AI_05_SEMANTIC_OPPORTUNITIES',
        severity: 'minor',
        location_path: 'semantic SEO',
        code_snippet: semanticExample.example?.badExample || '<!-- Limited keyword usage -->',
        message: 'Related semantic keywords could improve content relevance',
        fix_suggestion: `${semanticExample.fix_suggestion}\n\n${semanticExample.example?.badExample}\n\n${semanticExample.example?.goodExample}\n\n💡 Why this matters: ${semanticExample.example?.explanation}`
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


