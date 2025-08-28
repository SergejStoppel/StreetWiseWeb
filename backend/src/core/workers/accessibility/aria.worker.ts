import { Job, Worker } from 'bullmq';
import puppeteer, { Browser, Page } from 'puppeteer';
import * as axe from 'axe-core';
import { config } from '@/config';
import { createLogger } from '@/config/logger';
import { supabase } from '@/config/supabase';
import { AppError } from '@/types';
import { checkAndUpdateAnalysisCompletion } from '@/core/workers/master.worker';
import { getDatabaseRuleKey, mapImpactToSeverity, validateRuleMappings } from './ruleMapping';

const logger = createLogger('aria-worker');

interface AriaJobData {
  analysisId: string;
  workspaceId: string;
  websiteId: string;
  userId: string;
  assetPath: string;
  metadata: any;
}

interface AxeViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    html: string;
    target: string[];
    failureSummary?: string;
    any: Array<{
      id: string;
      message: string;
      data: any;
    }>;
  }>;
}

// ARIA worker coordinates with colorContrast worker for job completion
// Only update job status when both workers are done
async function updateJobStatusCoordinated(analysisId: string, moduleId: string, workerName: string, status: 'running' | 'completed' | 'failed', errorMessage?: string) {
  if (status === 'running') {
    // Set job to running when first worker starts
    const { error } = await supabase
      .from('analysis_jobs')
      .update({ 
        status: 'running',
        started_at: new Date().toISOString()
      })
      .eq('analysis_id', analysisId)
      .eq('module_id', moduleId)
      .eq('status', 'pending'); // Only update if still pending

    if (error) {
      logger.info('Job already running or completed by other worker', { analysisId, workerName });
    } else {
      logger.info(`${workerName} worker started job`, { analysisId });
    }
  } else if (status === 'completed' || status === 'failed') {
    // Store worker completion in a separate tracking mechanism
    // For now, just log - the last worker to complete will update job status
    logger.info(`${workerName} worker ${status}`, { analysisId, moduleId });
  }
}

async function getRuleIdFromDatabase(ruleKey: string): Promise<string | null> {
  logger.info(`🔍 DEBUG: Looking up rule in database`, { ruleKey });
  
  const { data, error } = await supabase
    .from('rules')
    .select('id, name, rule_key')
    .eq('rule_key', ruleKey)
    .single();

  if (error || !data) {
    logger.warn(`🔍 DEBUG: Rule not found for key: ${ruleKey}`, { 
      error: error?.message, 
      errorDetails: error?.details,
      errorHint: error?.hint,
      ruleKey 
    });
    return null;
  }

  logger.info(`🔍 DEBUG: Found rule in database`, { 
    ruleKey, 
    ruleId: data.id, 
    ruleName: data.name 
  });

  return data.id;
}

async function getModuleAndJobId(analysisId: string): Promise<{ moduleId: string; jobId: string } | null> {
  // Get the accessibility module ID
  const { data: module, error: moduleError } = await supabase
    .from('analysis_modules')
    .select('id')
    .eq('name', 'Accessibility')
    .single();

  if (moduleError || !module) {
    logger.error('Accessibility module not found', { 
      error: moduleError,
      moduleError: moduleError?.message 
    });
    return null;
  }

  logger.info('Found Accessibility module', { moduleId: module.id });

  // Get the job ID for this analysis and module (shared with colorContrast)
  const { data: job, error: jobError } = await supabase
    .from('analysis_jobs')
    .select('id')
    .eq('analysis_id', analysisId)
    .eq('module_id', module.id)
    .single();

  if (jobError || !job) {
    logger.error('Analysis job not found', { 
      analysisId, 
      moduleId: module.id,
      error: jobError,
      jobError: jobError?.message
    });
    return null;
  }

  logger.info('Found shared analysis job', { 
    analysisId, 
    moduleId: module.id, 
    jobId: job.id 
  });

  return { moduleId: module.id, jobId: job.id };
}

function mapAxeRuleToDbRule(axeRuleId: string): string {
  const mappings: { [key: string]: string } = {
    // Core ARIA role rules
    'aria-allowed-role': 'ACC_ARIA_01_ROLE_INVALID',
    'aria-roles': 'ACC_ARIA_01_ROLE_INVALID',
    'aria-valid-attr': 'ACC_ARIA_03_INVALID_ATTR_VALUE',
    'aria-valid-attr-value': 'ACC_ARIA_03_INVALID_ATTR_VALUE',
    
    // Required attributes
    'aria-required-attr': 'ACC_ARIA_02_REQUIRED_ATTR_MISSING',
    'aria-required-children': 'ACC_ARIA_02_REQUIRED_ATTR_MISSING',
    'aria-required-parent': 'ACC_ARIA_02_REQUIRED_ATTR_MISSING',
    
    // Hidden elements and focus
    'aria-hidden-body': 'ACC_ARIA_05_HIDDEN_FOCUSABLE',
    'aria-hidden-focus': 'ACC_ARIA_05_HIDDEN_FOCUSABLE',
    
    // Note: aria-labelledby, aria-describedby, aria-expanded, aria-controls
    // are not standalone axe-core rules - they are handled by custom detection
    
    // Live regions
    'aria-live-region-missing': 'ACC_ARIA_06_LIVE_REGION_MISSING',
    
    // Form controls and buttons
    'button-name': 'ACC_FRM_10_BUTTON_NAME_MISSING',
    'input-button-name': 'ACC_FRM_10_BUTTON_NAME_MISSING',
    // Link accessible name (no exact rule in seed, reuse closest naming rule)
    'link-name': 'ACC_FRM_10_BUTTON_NAME_MISSING',
    'link-in-text-block': 'ACC_FRM_10_BUTTON_NAME_MISSING', // Links must be distinguishable from text
    'label': 'ACC_FRM_01_LABEL_MISSING',
    'form-field-multiple-labels': 'ACC_FRM_02_LABEL_FOR_ID_MISMATCH',
    'label-title-only': 'ACC_FRM_03_LABEL_HIDDEN',
    
    // Images and media
    'image-alt': 'ACC_IMG_01_ALT_TEXT_MISSING',
    'input-image-alt': 'ACC_IMG_01_ALT_TEXT_MISSING',
    'area-alt': 'ACC_IMG_01_ALT_TEXT_MISSING',
    
    // Document structure
    'document-title': 'ACC_STR_06_PAGE_TITLE_MISSING',
    'frame-title': 'ACC_STR_06_PAGE_TITLE_MISSING',
    'html-has-lang': 'ACC_STR_04_PAGE_LANG_MISSING',
    'html-lang-valid': 'ACC_STR_04_PAGE_LANG_MISSING',
    'valid-lang': 'ACC_STR_05_ELEMENT_LANG_MISSING',
    
    // Heading structure
    'empty-heading': 'ACC_STR_02_NO_H1',
    'heading-order': 'ACC_STR_01_HEADING_ORDER',
    
    // Naming and commands
    'aria-command-name': 'ACC_ARIA_02_REQUIRED_ATTR_MISSING',
    'aria-input-field-name': 'ACC_FRM_01_LABEL_MISSING',
    'aria-meter-name': 'ACC_ARIA_02_REQUIRED_ATTR_MISSING',
    'aria-progressbar-name': 'ACC_ARIA_02_REQUIRED_ATTR_MISSING',
    'aria-toggle-field-name': 'ACC_ARIA_02_REQUIRED_ATTR_MISSING',
    'aria-tooltip-name': 'ACC_ARIA_02_REQUIRED_ATTR_MISSING',
    'aria-roledescription': 'ACC_ARIA_01_ROLE_INVALID',
    
    // Default mapping for unknown rules
    'default': 'ACC_ARIA_01_ROLE_INVALID'
  };

  return mappings[axeRuleId] || mappings['default'];
}

function mapAxeImpactToSeverity(impact: string): 'minor' | 'moderate' | 'serious' | 'critical' {
  switch (impact) {
    case 'critical': return 'critical';
    case 'serious': return 'serious';
    case 'moderate': return 'moderate';
    case 'minor': return 'minor';
    default: return 'moderate';
  }
}

async function getTargetUrl(websiteId: string, metadata: any): Promise<string> {
  // Try to get URL from metadata first
  if (metadata?.url) {
    return metadata.url;
  }

  // Otherwise, get from database
  const { data: website, error } = await supabase
    .from('websites')
    .select('url')
    .eq('id', websiteId)
    .single();
    
  if (error || !website) {
    throw new AppError('Website not found', 404);
  }
  
  return website.url;
}

// Custom detection for ARIA live regions
async function detectLiveRegionViolations(page: Page): Promise<any[]> {
  return await page.evaluate(() => {
    const violations: any[] = [];
    
    // Look for dynamic content areas that should have live regions
    const dynamicElements = document.querySelectorAll('[data-dynamic], [data-live], .notification, .alert, .status, .message, .toast');
    
    dynamicElements.forEach(element => {
      const hasLiveRegion = element.getAttribute('aria-live') || 
                           element.getAttribute('role') === 'alert' ||
                           element.getAttribute('role') === 'status' ||
                           element.getAttribute('role') === 'log';
      
      if (!hasLiveRegion) {
        violations.push({
          selector: (element as HTMLElement).id ? `#${(element as HTMLElement).id}` : element.className,
          html: (element as HTMLElement).outerHTML.substring(0, 200),
          message: 'Dynamic content area missing ARIA live region attributes'
        });
      }
    });
    
    return violations;
  });
}

export async function processAriaAnalysis(job: Job<AriaJobData>) {
  let browser: Browser | null = null;
  let moduleJobInfo: { moduleId: string; jobId: string } | null = null;
  
  try {
    logger.info('🚀 processAriaAnalysis FUNCTION CALLED', { jobId: job.id, jobData: job.data });
    
    const { analysisId, workspaceId, websiteId, userId, assetPath, metadata } = job.data;
    
    logger.info('🔥 ARIA WORKER v2.0 - LIVE DOM VERSION CONFIRMED 🔥', { analysisId, websiteId, version: 'v2.0-live-dom', timestamp: Date.now() });

    // Get module and job IDs for ARIA worker
    moduleJobInfo = await getModuleAndJobId(analysisId);
    if (!moduleJobInfo) {
      throw new AppError('Failed to get ARIA job information', 500);
    }

    await updateJobStatusCoordinated(analysisId, moduleJobInfo.moduleId, 'aria', 'running');

    // Prefer stored HTML if available; fallback to navigating live URL
    const htmlPath = `${assetPath}/html/index.html`;
    let storedHtml: string | null = null;
    try {
      const { data, error } = await supabase.storage
        .from('analysis-assets')
        .download(htmlPath);
      if (!error && data) {
        storedHtml = await (data as any).text();
        logger.info('ARIA worker: Using stored HTML from analysis-assets', { htmlPath, analysisId });
      } else {
        logger.info('ARIA worker: Stored HTML not found, will navigate live', { htmlPath, analysisId });
      }
    } catch (e: any) {
      logger.warn('ARIA worker: Failed to read stored HTML, will navigate live', { error: e?.message, htmlPath, analysisId });
    }

    // Get the target URL for fallback/live mode
    let targetUrl: string | null = null;
    if (!storedHtml) {
      try {
        targetUrl = await getTargetUrl(websiteId, metadata);
        logger.info('ARIA worker: Successfully got target URL', { targetUrl, analysisId });
      } catch (error) {
        logger.error('ARIA worker: Failed to get target URL', { error, websiteId, metadata, analysisId });
        throw error;
      }
    }

    // Launch browser with optimized settings
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote'
      ],
      timeout: 30000
    });

    const page = await browser.newPage();
    
    // Configure page settings
    await page.setDefaultTimeout(15000);
    await page.setDefaultNavigationTimeout(15000);
    
    // Set viewport for desktop analysis
    await page.setViewport({ width: 1920, height: 1080 });
    
    if (storedHtml) {
      logger.info('ARIA worker: Setting stored HTML as page content');
      await page.setContent(storedHtml);
      // small delay to allow any inline scripts/styles to apply
      await page.waitForTimeout(200);
    } else if (targetUrl) {
      // Navigate to the page
      logger.info('Navigating to target URL for ARIA analysis');
      try {
        await page.goto(targetUrl, { 
          waitUntil: 'networkidle2',
          timeout: 20000
        });
      } catch (navigationError: any) {
        logger.warn('Initial navigation failed, retrying', { 
          error: navigationError?.message || 'Unknown navigation error',
          targetUrl 
        });
        // Retry with simpler settings
        await page.goto(targetUrl, { 
          waitUntil: 'domcontentloaded',
          timeout: 15000
        });
        // Wait for content to be rendered
        await page.waitForTimeout(3000);
      }
    }

    // Inject axe-core into the page
    logger.info('Injecting axe-core for ARIA analysis');
    await page.addScriptTag({
      path: require.resolve('axe-core')
    });

    // Wait for axe to be available
    await page.waitForFunction(() => typeof (globalThis as any).axe !== 'undefined', { timeout: 10000 });
    logger.info('Axe-core loaded successfully');

    // Run axe-core analysis focusing on ARIA rules
    logger.info('Running axe-core ARIA analysis on live DOM');
    const results = await page.evaluate(() => {
      // Configure axe to only run ARIA-related rules
      const axeConfig = {
        rules: {
          // Core ARIA rules
          'aria-allowed-attr': { enabled: true },
          'aria-allowed-role': { enabled: true },
          'aria-command-name': { enabled: true },
          'aria-hidden-body': { enabled: true },
          'aria-hidden-focus': { enabled: true },
          'aria-input-field-name': { enabled: true },
          'aria-meter-name': { enabled: true },
          'aria-progressbar-name': { enabled: true },
          'aria-required-attr': { enabled: true },
          'aria-required-children': { enabled: true },
          'aria-required-parent': { enabled: true },
          'aria-roledescription': { enabled: true },
          'aria-roles': { enabled: true },
          'aria-toggle-field-name': { enabled: true },
          'aria-tooltip-name': { enabled: true },
          'aria-valid-attr': { enabled: true },
          'aria-valid-attr-value': { enabled: true },
          
          // Note: aria-labelledby, aria-describedby, aria-expanded, aria-controls 
          // are not standalone axe-core rules - they are handled by custom detection below
          
          // Expanded accessibility rules that are commonly violated
          'button-name': { enabled: true },            // Buttons must have accessible text
          'input-button-name': { enabled: true },      // Input buttons must have accessible text
          'link-name': { enabled: true },              // Links must have accessible text
          'form-field-multiple-labels': { enabled: true }, // Form fields should not have multiple labels
          'label': { enabled: true },                  // Form inputs must have labels
          'label-title-only': { enabled: true },      // Labels should not rely on title alone
          'empty-heading': { enabled: true },          // Headings should not be empty
          'heading-order': { enabled: true },          // Heading levels should increase sequentially
          'image-alt': { enabled: true },              // Images must have alt text
          'input-image-alt': { enabled: true },       // Image inputs must have alt text
          'area-alt': { enabled: true },               // Area elements must have alt text
          'frame-title': { enabled: true },            // Frames must have titles
          'document-title': { enabled: true },         // Documents must have titles
          'html-has-lang': { enabled: true },          // HTML must have lang attribute
          'html-lang-valid': { enabled: true },        // HTML lang must be valid
          'valid-lang': { enabled: true },             // Lang attributes must be valid
          
          // Structural navigation rules - newly activated
          'bypass': { enabled: true },                 // Skip navigation links must be provided
          'landmark-one-main': { enabled: true },      // Documents must have exactly one main landmark
          'landmark-complementary-is-top-level': { enabled: true }, // Complementary landmarks must be top-level
          'landmark-main-is-top-level': { enabled: true }, // Main landmark must be top-level
          'page-has-heading-one': { enabled: true },   // Pages must have H1 heading
          'landmark-unique': { enabled: true },        // Landmarks must have unique names
          
          // List and structure rules - newly activated
          'list': { enabled: true },                   // Lists must be properly structured
          'listitem': { enabled: true },               // List items must be contained in lists
          'definition-list': { enabled: true },        // Definition lists must be properly structured
          
          // Disable rules that other workers handle
          'color-contrast': { enabled: false },
          'color-contrast-enhanced': { enabled: false },
          'link-in-text-block': { enabled: true }
        },
        runOnly: [
          // Core ARIA rules
          'aria-allowed-attr', 'aria-allowed-role', 'aria-command-name', 'aria-hidden-body', 
          'aria-hidden-focus', 'aria-input-field-name', 'aria-meter-name', 'aria-progressbar-name', 
          'aria-required-attr', 'aria-required-children', 'aria-required-parent', 'aria-roledescription', 
          'aria-roles', 'aria-toggle-field-name', 'aria-tooltip-name', 'aria-valid-attr', 'aria-valid-attr-value',
          
          // Note: Invalid rules removed - aria-labelledby, aria-describedby, aria-expanded, aria-controls are not standalone axe rules
          
          // Expanded accessibility rules
          'button-name', 'input-button-name', 'link-name', 'form-field-multiple-labels', 'label', 
          'label-title-only', 'empty-heading', 'heading-order', 'image-alt', 'input-image-alt', 
          'area-alt', 'frame-title', 'document-title', 'html-has-lang', 'html-lang-valid', 'valid-lang',
          
          // Structural navigation rules - newly activated  
          'bypass', 'landmark-one-main', 'landmark-complementary-is-top-level', 'landmark-main-is-top-level',
          'page-has-heading-one', 'landmark-unique',
          
          // List and structure rules - newly activated
          'list', 'listitem', 'definition-list',
          
          // Link visual distinction
          'link-in-text-block'
        ]
      };

      console.log('🔍 DEBUG: Axe config being used:', JSON.stringify(axeConfig, null, 2));

      // Run axe analysis
      return (globalThis as any).axe.run(globalThis.document, axeConfig);
    });

    logger.info('Axe-core ARIA analysis complete', {
      violations: results.violations.length,
      passes: results.passes.length,
      incomplete: results.incomplete.length,
      violationIds: results.violations.map(v => v.id),
      analysisId
    });

    // 🔍 DEBUG: Log all violations found
    results.violations.forEach((violation, index) => {
      logger.info(`🔍 DEBUG: Violation ${index + 1}`, {
        analysisId,
        axeRuleId: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.length,
        description: violation.description,
        help: violation.help
      });
    });

    // Process and store ARIA violations
    let processedCount = 0;
    let skippedCount = 0;
    let insertedCount = 0;
    let errorCount = 0;

    for (const violation of results.violations as AxeViolation[]) {
      logger.info(`🔍 DEBUG: Processing violation`, {
        analysisId,
        axeRuleId: violation.id,
        isAriaRelated: violation.id.includes('aria') || violation.id.includes('role')
      });

      // Process violations that match our expanded rule set
      const allowedRules = [
        // Core ARIA rules
        'aria-allowed-attr', 'aria-allowed-role', 'aria-command-name', 'aria-hidden-body', 
        'aria-hidden-focus', 'aria-input-field-name', 'aria-meter-name', 'aria-progressbar-name', 
        'aria-required-attr', 'aria-required-children', 'aria-required-parent', 'aria-roledescription', 
        'aria-roles', 'aria-toggle-field-name', 'aria-tooltip-name', 'aria-valid-attr', 'aria-valid-attr-value',
        
        // Additional ARIA rules - newly activated (commented out - not available in current axe-core version)
        // 'aria-braillelabel-equivalent', 'aria-text', 'aria-treeitem-name',
        
        // Expanded accessibility rules
        'button-name', 'input-button-name', 'link-name', 'form-field-multiple-labels', 'label', 
        'label-title-only', 'empty-heading', 'heading-order', 'image-alt', 'input-image-alt', 
        'area-alt', 'frame-title', 'document-title', 'html-has-lang', 'html-lang-valid', 'valid-lang',
        
        // Structural navigation rules - newly activated  
        'bypass', 'landmark-one-main', 'landmark-complementary-is-top-level', 'landmark-main-is-top-level',
        'page-has-heading-one', 'landmark-unique',
        
        // List and structure rules - newly activated
        'list', 'listitem', 'definition-list'
      ];
      
      if (!allowedRules.includes(violation.id)) {
        skippedCount++;
        logger.info(`🔍 DEBUG: Skipping violation not in our rule set: ${violation.id}`, { analysisId });
        continue;
      }

      const dbRuleKey = getDatabaseRuleKey(violation.id);
      logger.info(`🔍 DEBUG: Mapped rule`, {
        analysisId,
        axeRuleId: violation.id,
        dbRuleKey
      });

      const ruleId = await getRuleIdFromDatabase(dbRuleKey);

      if (!ruleId) {
        logger.warn(`🔍 DEBUG: Skipping violation - rule not found in database`, {
          analysisId,
          axeRuleId: violation.id,
          dbRuleKey,
          mappedRuleKey: dbRuleKey
        });
        skippedCount++;
        continue;
      }

      logger.info(`🔍 DEBUG: Found rule in database`, {
        analysisId,
        axeRuleId: violation.id,
        dbRuleKey,
        ruleId
      });

      processedCount++;

      for (const node of violation.nodes) {
        const issueData = {
          analysis_job_id: moduleJobInfo.jobId,
          rule_id: ruleId,
          severity: mapAxeImpactToSeverity(violation.impact),
          message: violation.help,
          location_path: node.target.join(' > '),
          code_snippet: node.html.substring(0, 500),
          fix_suggestion: node.failureSummary || violation.description
        };

        logger.info(`🔍 DEBUG: Attempting to insert ARIA issue`, {
          analysisId,
          axeRuleId: violation.id,
          dbRuleKey,
          ruleId,
          jobId: moduleJobInfo.jobId,
          severity: issueData.severity,
          locationPath: issueData.location_path,
          message: issueData.message?.substring(0, 100) + '...'
        });

        const { error: insertError } = await supabase
          .from('accessibility_issues')
          .insert(issueData);

        if (insertError) {
          errorCount++;
          logger.error('🔍 DEBUG: Failed to insert ARIA issue', { 
            error: insertError, 
            errorMessage: insertError.message,
            errorDetails: insertError.details,
            errorHint: insertError.hint,
            ruleKey: dbRuleKey,
            analysisId,
            issueData: {
              ...issueData,
              code_snippet: issueData.code_snippet?.substring(0, 100) + '...'
            }
          });
        } else {
          insertedCount++;
          logger.info(`🔍 DEBUG: Successfully inserted ARIA issue`, {
            analysisId,
            axeRuleId: violation.id,
            dbRuleKey,
            ruleId
          });
        }
      }
    }

    // Detect custom ARIA violations not covered by axe-core
    const liveRegionViolations = await detectLiveRegionViolations(page);
    
    if (liveRegionViolations.length > 0) {
      logger.info('Found ARIA live region violations', { count: liveRegionViolations.length });
      
      // Get rule ID for live region violations
      const liveRegionRuleId = await getRuleIdFromDatabase('ACC_ARIA_06_LIVE_REGION_MISSING');
      
      if (liveRegionRuleId) {
        for (const violation of liveRegionViolations) {
          const issueData = {
            analysis_job_id: moduleJobInfo.jobId,
            rule_id: liveRegionRuleId,
            severity: 'moderate' as const,
            message: violation.message,
            location_path: violation.selector,
            code_snippet: violation.html,
            fix_suggestion: 'Add aria-live="polite" or appropriate role (alert, status) to dynamic content areas'
          };
          
          const { error: insertError } = await supabase
            .from('accessibility_issues')
            .insert(issueData);
            
          if (insertError) {
            logger.error('Failed to insert live region violation', { error: insertError });
          }
        }
      }
    }

    // ARIA worker completed - let colorContrast handle final job status update
    logger.info('🔍 DEBUG: ARIA analysis completed', { 
      analysisId,
      totalViolations: results.violations.length,
      processedCount,
      skippedCount,
      insertedCount,
      errorCount,
      violationsProcessed: results.violations.filter(v => v.id.includes('aria') || v.id.includes('role')).length,
      jobId: moduleJobInfo.jobId,
      moduleId: moduleJobInfo.moduleId
    });
    logger.info('ARIA analysis completed successfully', { analysisId });

    // Check if all jobs are complete
    await checkAndUpdateAnalysisCompletion(analysisId);

  } catch (error: any) {
    const { analysisId: errorAnalysisId, websiteId: errorWebsiteId } = job.data;
    
    logger.error('🚨 ARIA ANALYSIS FAILED AT TOP LEVEL', { 
      error: {
        message: error?.message || 'Unknown error',
        stack: error?.stack,
        name: error?.name,
        statusCode: error?.statusCode,
        isOperational: error?.isOperational
      }, 
      analysisId: errorAnalysisId || 'unknown',
      websiteId: errorWebsiteId || 'unknown',
      jobId: job.id,
      jobData: job.data
    });
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // ARIA worker failed - log but don't fail the entire job
    logger.error('ARIA analysis failed but continuing with other workers (live DOM version)', { 
      analysisId: errorAnalysisId || 'unknown',
      errorMessage,
      errorDetails: error
    });
    
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Create and export the worker
export const ariaWorker = new Worker(
  'aria-analysis',
  processAriaAnalysis,
  {
    connection: config.redis,
    concurrency: 2
  }
);

logger.info('🟢 ARIA WORKER INITIALIZED SUCCESSFULLY', { 
  queueName: 'aria-analysis',
  concurrency: 2,
  timestamp: Date.now()
});

ariaWorker.on('completed', (job) => {
  logger.info('ARIA analysis job completed', { jobId: job.id, analysisId: job.data.analysisId });
});

ariaWorker.on('failed', (job, err) => {
  logger.error('ARIA analysis job failed', { 
    jobId: job?.id, 
    analysisId: job?.data?.analysisId,
    error: err.message 
  });
});

export default ariaWorker;