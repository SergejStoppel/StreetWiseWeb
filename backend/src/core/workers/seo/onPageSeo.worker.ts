import { Job, Worker } from 'bullmq';
import { config } from '@/config';
import { createLogger } from '@/config/logger';
import { supabase } from '@/config/supabase';
import { AppError } from '@/types';
import { checkAndUpdateAnalysisCompletion } from '@/core/workers/master.worker';
import { JSDOM } from 'jsdom';

const logger = createLogger('seo-onpage-worker');

interface OnPageSeoJobData {
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

async function updateOnPageSeoJobStatus(
  analysisId: string,
  moduleId: string,
  status: 'running' | 'completed' | 'failed',
  errorMessage?: string
) {
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
    logger.error('Failed to update On-Page SEO job status', { error, analysisId, moduleId, status });
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

interface SeoIssue {
  rule_key: string;
  severity: IssueSeverity;
  location_path?: string;
  code_snippet?: string;
  message?: string;
  fix_suggestion?: string;
}

/**
 * Analyze title tag optimization
 */
async function analyzeTitleTag(dom: Document, url: string): Promise<SeoIssue[]> {
  const issues: SeoIssue[] = [];
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

    // Check title length
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

    // Check for keyword placement (should appear in first half)
    const titleWords = title.toLowerCase().split(/\s+/);
    if (titleWords.length > 6) {
      const firstHalfLength = Math.ceil(titleWords.length / 2);
      const firstHalfText = titleWords.slice(0, firstHalfLength).join(' ');

      // This is a heuristic check - actual keyword analysis would require user input
      logger.debug('Title structure analyzed', {
        titleLength: title.length,
        wordCount: titleWords.length,
        firstHalf: firstHalfText
      });
    }
  }

  return issues;
}

/**
 * Analyze meta description optimization
 */
async function analyzeMetaDescription(dom: Document): Promise<SeoIssue[]> {
  const issues: SeoIssue[] = [];
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

    // Check description length
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

    // Check for call-to-action words
    const ctaWords = ['learn', 'discover', 'find', 'get', 'try', 'buy', 'download', 'sign up', 'contact', 'explore', 'read'];
    const hasCallToAction = ctaWords.some(word => description.toLowerCase().includes(word));

    if (!hasCallToAction) {
      issues.push({
        rule_key: 'SEO_CON_06_META_DESC_NO_CTA',
        severity: 'minor',
        location_path: 'head > meta[name="description"]',
        code_snippet: `<meta name="description" content="${description}">`,
        message: 'Meta description lacks a clear call-to-action',
        fix_suggestion: 'Include action-oriented words like "Learn", "Discover", "Get", or "Try" to encourage clicks from search results. A compelling call-to-action can increase click-through rates by 20-30%.'
      });
    }
  }

  return issues;
}

/**
 * Analyze heading hierarchy and structure
 */
async function analyzeHeadingStructure(dom: Document): Promise<SeoIssue[]> {
  const issues: SeoIssue[] = [];

  // Check H1
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

  // Check H1 and Title alignment
  if (h1Elements.length === 1) {
    const h1Text = h1Elements[0].textContent?.trim() || '';
    const titleText = dom.querySelector('title')?.textContent?.trim() || '';

    if (h1Text && titleText && h1Text.toLowerCase() !== titleText.toLowerCase()) {
      // Check if they share at least 50% of the words
      const h1Words = h1Text.toLowerCase().split(/\s+/);
      const titleWords = titleText.toLowerCase().split(/\s+/);
      const commonWords = h1Words.filter(word => titleWords.includes(word) && word.length > 3);
      const similarityRatio = commonWords.length / Math.max(h1Words.length, titleWords.length);

      if (similarityRatio < 0.5) {
        issues.push({
          rule_key: 'SEO_CON_09_H1_TITLE_MISMATCH',
          severity: 'minor',
          location_path: 'head > title, body > h1',
          code_snippet: `<title>${titleText}</title>\n...\n<h1>${h1Text}</h1>`,
          message: 'H1 and title tag have different messaging',
          fix_suggestion: 'Consider aligning your H1 and title tag to reinforce the page topic. While they don\'t need to be identical, they should communicate the same core message for better user experience and SEO.'
        });
      }
    }
  }

  // Check heading hierarchy (no skipped levels)
  const headings = Array.from(dom.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  let previousLevel = 0;
  const hierarchyIssues: string[] = [];

  headings.forEach((heading, index) => {
    const currentLevel = parseInt(heading.tagName.substring(1));

    if (previousLevel > 0 && currentLevel > previousLevel + 1) {
      hierarchyIssues.push(`Skipped from H${previousLevel} to H${currentLevel} at position ${index + 1}`);
    }

    previousLevel = currentLevel;
  });

  if (hierarchyIssues.length > 0) {
    issues.push({
      rule_key: 'SEO_CON_10_HEADING_HIERARCHY',
      severity: 'moderate',
      location_path: 'body headings',
      code_snippet: `Issues found:\n${hierarchyIssues.join('\n')}`,
      message: 'Heading hierarchy has skipped levels',
      fix_suggestion: 'Maintain proper heading hierarchy without skipping levels (H1 → H2 → H3, not H1 → H3). This improves accessibility and helps search engines understand your content structure. Use headings in sequential order to create a logical outline.'
    });
  }

  return issues;
}

/**
 * Analyze content quality and optimization
 */
async function analyzeContentQuality(dom: Document, url: string): Promise<SeoIssue[]> {
  const issues: SeoIssue[] = [];

  const bodyText = dom.body?.textContent || '';
  const words = bodyText.split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;

  // Check content length
  if (wordCount < 300) {
    issues.push({
      rule_key: 'SEO_STR_01_CONTENT_LENGTH',
      severity: 'moderate',
      location_path: 'body',
      message: `Page has only ${wordCount} words (recommended: 300+ words for better authority)`,
      fix_suggestion: 'Add more valuable, relevant content to establish page authority and improve search rankings. Longer content (300+ words) tends to rank better in search results. Focus on comprehensively answering user questions and providing unique insights.'
    });
  } else if (wordCount > 2500) {
    issues.push({
      rule_key: 'SEO_CON_11_CONTENT_TOO_LONG',
      severity: 'minor',
      location_path: 'body',
      message: `Page has ${wordCount} words (very long content)`,
      fix_suggestion: 'Consider breaking very long content (2500+ words) into multiple pages or sections with a table of contents. This improves user experience and page load performance while maintaining SEO value.'
    });
  }

  // Check keyword density (basic detection)
  const title = dom.querySelector('title')?.textContent || '';
  const metaDesc = dom.querySelector('meta[name="description"]')?.getAttribute('content') || '';

  if (title) {
    const titleWords = title.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    const contentLower = bodyText.toLowerCase();

    for (const word of titleWords.slice(0, 3)) {
      const wordRegex = new RegExp(`\\b${word}\\b`, 'g');
      const matches = contentLower.match(wordRegex);
      const count = matches ? matches.length : 0;
      const density = (count / wordCount) * 100;

      if (density > 3) {
        issues.push({
          rule_key: 'SEO_STR_02_KEYWORD_DENSITY',
          severity: 'moderate',
          location_path: 'body',
          code_snippet: `Keyword "${word}" appears ${count} times in ${wordCount} words (${density.toFixed(1)}% density)`,
          message: `Keyword over-optimization detected for "${word}" (${density.toFixed(1)}% density, recommended: 1-2%)`,
          fix_suggestion: `Use keywords naturally throughout your content without overstuffing:\n• Reduce repetition of "${word}" to achieve 1-2% density\n• Use synonyms and related terms for variety\n• Focus on writing for users, not search engines\n• Let keywords flow naturally in sentences\n\nNatural keyword usage (1-2% density) ranks better than keyword stuffing, which can be penalized.`
        });
        break;
      }
    }
  }

  // Check for paragraph length (readability)
  const paragraphs = Array.from(dom.querySelectorAll('p'));
  const longParagraphs = paragraphs.filter(p => {
    const pWords = (p.textContent || '').split(/\s+/).filter(w => w.length > 0);
    return pWords.length > 150;
  });

  if (longParagraphs.length > 0) {
    issues.push({
      rule_key: 'SEO_CON_12_PARAGRAPH_LENGTH',
      severity: 'minor',
      location_path: 'body paragraphs',
      message: `Found ${longParagraphs.length} very long paragraphs (150+ words)`,
      fix_suggestion: 'Break long paragraphs into shorter ones (3-5 sentences each) to improve readability. Short paragraphs are easier to scan and keep readers engaged, reducing bounce rate.'
    });
  }

  return issues;
}

/**
 * Analyze internal and external linking
 */
async function analyzeLinkingStructure(dom: Document, url: string): Promise<SeoIssue[]> {
  const issues: SeoIssue[] = [];

  const allLinks = Array.from(dom.querySelectorAll('a[href]'));
  const urlObj = new URL(url);

  // Categorize links
  const internalLinks = allLinks.filter(link => {
    const href = link.getAttribute('href');
    return href && (href.startsWith('/') || href.includes(urlObj.hostname));
  });

  const externalLinks = allLinks.filter(link => {
    const href = link.getAttribute('href');
    return href && href.startsWith('http') && !href.includes(urlObj.hostname);
  });

  // Check internal linking
  if (internalLinks.length < 3) {
    issues.push({
      rule_key: 'SEO_STR_03_INTERNAL_LINKS',
      severity: 'moderate',
      location_path: 'body',
      message: `Page has only ${internalLinks.length} internal links (recommended: 3+ for better site architecture)`,
      fix_suggestion: 'Add relevant internal links to other pages on your site to improve navigation and distribute page authority. Internal linking helps search engines discover content and establishes site hierarchy.'
    });
  }

  // Check external linking
  const bodyText = dom.body?.textContent || '';
  const wordCount = bodyText.split(/\s+/).filter(word => word.length > 0).length;

  if (externalLinks.length === 0 && wordCount > 500) {
    issues.push({
      rule_key: 'SEO_STR_04_EXTERNAL_LINKS',
      severity: 'minor',
      location_path: 'body',
      message: 'Page has no external links to authoritative sources',
      fix_suggestion: 'Consider adding links to relevant, authoritative external sources to improve content credibility and provide additional value to users. Quality outbound links can enhance your content\'s trustworthiness.'
    });
  }

  // Check for broken link patterns (anchors without href, javascript:void, #)
  const emptyLinks = allLinks.filter(link => {
    const href = link.getAttribute('href');
    return !href || href === '#' || href === 'javascript:void(0)' || href === 'javascript:;';
  });

  if (emptyLinks.length > 0) {
    issues.push({
      rule_key: 'SEO_CON_13_EMPTY_LINKS',
      severity: 'minor',
      location_path: 'body links',
      code_snippet: `Found ${emptyLinks.length} links with empty or placeholder hrefs`,
      message: `${emptyLinks.length} links have no meaningful destination`,
      fix_suggestion: 'Replace placeholder links (#, javascript:void(0)) with actual URLs or convert them to buttons. Empty links confuse users and search engines.'
    });
  }

  // Check for link text quality
  const genericLinkTexts = ['click here', 'here', 'read more', 'more', 'link', 'this page'];
  const genericLinks = allLinks.filter(link => {
    const text = (link.textContent || '').trim().toLowerCase();
    return genericLinkTexts.includes(text);
  });

  if (genericLinks.length > 2) {
    issues.push({
      rule_key: 'SEO_CON_14_GENERIC_LINK_TEXT',
      severity: 'minor',
      location_path: 'body links',
      message: `Found ${genericLinks.length} links with generic anchor text`,
      fix_suggestion: 'Use descriptive anchor text instead of generic phrases like "click here" or "read more". Descriptive anchor text helps users understand where the link leads and provides SEO context. Example: "Learn about accessibility testing" instead of "Click here".'
    });
  }

  return issues;
}

/**
 * Analyze image optimization for SEO
 */
async function analyzeImageSEO(dom: Document): Promise<SeoIssue[]> {
  const issues: SeoIssue[] = [];

  const images = Array.from(dom.querySelectorAll('img'));

  if (images.length === 0) {
    return issues; // No images, no issues
  }

  // Check for missing alt attributes
  const imagesWithoutAlt = images.filter(img => !img.hasAttribute('alt'));

  if (imagesWithoutAlt.length > 0) {
    issues.push({
      rule_key: 'SEO_CON_15_IMAGE_ALT_MISSING',
      severity: 'serious',
      location_path: 'body img tags',
      code_snippet: `${imagesWithoutAlt.length} images missing alt attributes`,
      message: `${imagesWithoutAlt.length} images are missing alt text`,
      fix_suggestion: 'Add descriptive alt text to all images. Alt text improves accessibility and helps search engines understand image content. Include relevant keywords naturally where appropriate. Decorative images should have empty alt="" attributes.'
    });
  }

  // Check for empty alt text (excluding decorative images which should be empty)
  const imagesWithEmptyAlt = images.filter(img => {
    const alt = img.getAttribute('alt');
    return alt === '';
  });

  if (imagesWithEmptyAlt.length > images.length * 0.5 && images.length > 3) {
    issues.push({
      rule_key: 'SEO_CON_16_IMAGE_ALT_EMPTY',
      severity: 'moderate',
      location_path: 'body img tags',
      message: `${imagesWithEmptyAlt.length} images have empty alt attributes`,
      fix_suggestion: 'Many images have empty alt text. Only use empty alt="" for purely decorative images. All content images should have descriptive alt text that explains what the image shows and its relevance to the content.'
    });
  }

  // Check for very short alt text (likely not descriptive enough)
  const imagesWithShortAlt = images.filter(img => {
    const alt = img.getAttribute('alt');
    return alt && alt.length > 0 && alt.length < 5;
  });

  if (imagesWithShortAlt.length > 0) {
    issues.push({
      rule_key: 'SEO_CON_17_IMAGE_ALT_SHORT',
      severity: 'minor',
      location_path: 'body img tags',
      message: `${imagesWithShortAlt.length} images have very short alt text`,
      fix_suggestion: 'Alt text should be descriptive (typically 10-125 characters). Very short alt text may not provide enough context for users or search engines. Describe what the image shows and its relevance to the content.'
    });
  }

  return issues;
}

/**
 * Analyze URL structure and readability
 */
async function analyzeURLStructure(url: string): Promise<SeoIssue[]> {
  const issues: SeoIssue[] = [];

  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Check for URL length
    if (url.length > 100) {
      issues.push({
        rule_key: 'SEO_CON_18_URL_TOO_LONG',
        severity: 'minor',
        location_path: 'URL structure',
        code_snippet: `URL length: ${url.length} characters`,
        message: 'URL is very long (100+ characters)',
        fix_suggestion: 'Keep URLs concise and under 100 characters when possible. Shorter URLs are easier to share and remember, and may perform better in search results.'
      });
    }

    // Check for parameters that might indicate session IDs or tracking
    const params = urlObj.searchParams;
    const suspiciousParams = ['sessionid', 'sid', 'phpsessid', 'jsessionid'];

    for (const param of params.keys()) {
      if (suspiciousParams.some(sp => param.toLowerCase().includes(sp))) {
        issues.push({
          rule_key: 'SEO_CON_19_URL_SESSION_ID',
          severity: 'serious',
          location_path: 'URL parameters',
          code_snippet: `Parameter: ${param}`,
          message: 'URL contains session ID in parameters',
          fix_suggestion: 'Remove session IDs from URLs. Session IDs in URLs create duplicate content issues and can expose security vulnerabilities. Use cookies for session management instead.'
        });
        break;
      }
    }

    // Check for underscores (Google recommends hyphens)
    if (pathname.includes('_')) {
      issues.push({
        rule_key: 'SEO_CON_20_URL_UNDERSCORES',
        severity: 'minor',
        location_path: 'URL structure',
        code_snippet: `Path: ${pathname}`,
        message: 'URL contains underscores instead of hyphens',
        fix_suggestion: 'Use hyphens (-) instead of underscores (_) in URLs. Google treats hyphens as word separators but may not treat underscores the same way. Example: /seo-guide/ instead of /seo_guide/'
      });
    }

    // Check for uppercase letters
    if (pathname !== pathname.toLowerCase()) {
      issues.push({
        rule_key: 'SEO_CON_21_URL_UPPERCASE',
        severity: 'minor',
        location_path: 'URL structure',
        code_snippet: `Path: ${pathname}`,
        message: 'URL contains uppercase letters',
        fix_suggestion: 'Use lowercase letters in URLs for consistency and to avoid potential duplicate content issues. URLs are case-sensitive on some servers.'
      });
    }

  } catch (error) {
    logger.warn('Failed to parse URL for structure analysis', { url, error: error.message });
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

export const onPageSeoWorker = new Worker('seo-onpage', async (job: Job<OnPageSeoJobData>) => {
  const { analysisId, workspaceId, assetPath, metadata } = job.data;
  logger.info('Starting On-Page SEO analysis', { analysisId, assetPath });

  let moduleJobInfo: { moduleId: string; jobId: string } | null = null;

  try {
    moduleJobInfo = await getSeoModuleAndJobId(analysisId);
    if (!moduleJobInfo) throw new AppError('Failed to get SEO job info', 500);

    await updateOnPageSeoJobStatus(analysisId, moduleJobInfo.moduleId, 'running');

    let allIssues: SeoIssue[] = [];

    // Get the final URL from metadata
    const finalUrl = metadata?.finalUrl || metadata?.url || '';

    // Load HTML from storage
    const htmlPath = `${assetPath}/html/index.html`;
    const html = await downloadTextFromStorage(htmlPath);

    if (!html) {
      throw new AppError('Rendered HTML not found in storage', 500);
    }

    // Parse HTML with JSDOM
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Run all on-page SEO analysis functions in parallel
    const [
      titleIssues,
      metaDescIssues,
      headingIssues,
      contentIssues,
      linkingIssues,
      imageIssues,
      urlIssues
    ] = await Promise.all([
      analyzeTitleTag(document, finalUrl),
      analyzeMetaDescription(document),
      analyzeHeadingStructure(document),
      analyzeContentQuality(document, finalUrl),
      analyzeLinkingStructure(document, finalUrl),
      analyzeImageSEO(document),
      analyzeURLStructure(finalUrl)
    ]);

    // Combine all issues
    allIssues.push(
      ...titleIssues,
      ...metaDescIssues,
      ...headingIssues,
      ...contentIssues,
      ...linkingIssues,
      ...imageIssues,
      ...urlIssues
    );

    // Insert all issues into database
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

      logger.info('On-Page SEO issue insertion completed', {
        analysisId,
        totalIssues: allIssues.length,
        inserted: insertedCount,
        skipped: skippedCount
      });
    }

    await updateOnPageSeoJobStatus(analysisId, moduleJobInfo.moduleId, 'completed');
    await checkAndUpdateAnalysisCompletion(analysisId);

    logger.info('On-Page SEO analysis completed', { analysisId, issueCount: allIssues.length });
    return { success: true, issues: allIssues.length };
  } catch (error: any) {
    logger.error('On-Page SEO analysis failed', { error: error?.message || 'Unknown error', analysisId });
    if (moduleJobInfo) {
      await updateOnPageSeoJobStatus(analysisId, moduleJobInfo.moduleId, 'failed', error?.message || 'Unknown error');
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
  logger.info('SIGTERM received, closing seo-onpage worker...');
  await onPageSeoWorker.close();
});
