import { Job, Worker } from 'bullmq';
import puppeteer, { Browser, Page } from 'puppeteer';
import * as axe from 'axe-core';
import { config } from '@/config';
import { createLogger } from '@/config/logger';
import { supabase } from '@/config/supabase';
import { AppError } from '@/types';
import { checkAndUpdateAnalysisCompletion } from '@/core/workers/master.worker';
import { getDatabaseRuleKey, mapImpactToSeverity } from './ruleMapping';

const logger = createLogger('keyboard-worker');

interface KeyboardJobData {
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

// Keyboard worker coordinates with other accessibility workers for job completion
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
      .eq('module_id', moduleId);

    if (error) {
      logger.error('Failed to update job status to running', { error, analysisId, moduleId });
    }
  } else if (status === 'completed' || status === 'failed') {
    // Worker completed - check if all accessibility workers are done
    const updateData: any = { 
      completed_at: new Date().toISOString()
    };
    
    if (status === 'failed') {
      updateData.status = 'failed';
      updateData.error_message = errorMessage;
    }
    // Don't set status to completed yet - let master worker coordinate
    
    const { error } = await supabase
      .from('analysis_jobs')
      .update(updateData)
      .eq('analysis_id', analysisId)
      .eq('module_id', moduleId);

    if (error) {
      logger.error(`Failed to update job status to ${status}`, { error, analysisId, moduleId });
    }

    // Check if all accessibility workers are done
    await checkAndUpdateAnalysisCompletion(analysisId, `keyboard-worker-${status}`);
  }
}

async function getRuleId(ruleKey: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('rules')
    .select('id')
    .eq('rule_key', ruleKey)
    .single();

  if (error || !data) {
    logger.warn('Rule not found in database', { ruleKey, error });
    return null;
  }

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
    logger.error('Failed to find Accessibility module', { error: moduleError });
    return null;
  }

  // Get the analysis job ID
  const { data: job, error: jobError } = await supabase
    .from('analysis_jobs')
    .select('id')
    .eq('analysis_id', analysisId)
    .eq('module_id', module.id)
    .single();

  if (jobError || !job) {
    logger.error('Failed to find analysis job', { error: jobError, analysisId, moduleId: module.id });
    return null;
  }

  return {
    moduleId: module.id,
    jobId: job.id
  };
}

async function loadStoredAsset(assetPath: string, filename: string): Promise<string> {
  const fullPath = `${assetPath}/${filename}`;
  
  const { data, error } = await supabase.storage
    .from('analysis-assets')
    .download(fullPath);

  if (error) {
    throw new AppError(`Failed to download stored asset: ${fullPath}`, 500, 'ASSET_DOWNLOAD_ERROR', { error });
  }

  return await data.text();
}

interface KeyboardTestResults {
  axeViolations: AxeViolation[];
  customViolations: Array<{
    ruleKey: string;
    severity: 'minor' | 'moderate' | 'serious' | 'critical';
    message: string;
    elements: string[];
  }>;
}

async function performAdvancedKeyboardTesting(page: Page): Promise<KeyboardTestResults> {
  // Run axe-core keyboard rules first
  const axeResults = await page.evaluate(() => {
    const axeConfig = {
      rules: {
        // Core keyboard navigation rules
        'tabindex': { enabled: true },                        // Positive tabindex issues
        'focus-order-semantics': { enabled: true },           // Logical focus order
        'scrollable-region-focusable': { enabled: true },    // Scrollable regions need keyboard access
        'accesskeys': { enabled: true },                     // Duplicate access keys
        'skip-link': { enabled: true },                      // Skip link functionality
        
        // Note: Keyboard trap detection is handled by custom testing below
      },
      runOnly: [
        'tabindex', 'focus-order-semantics', 'scrollable-region-focusable', 
        'accesskeys', 'skip-link'
      ]
    };
    
    return (globalThis as any).axe.run(globalThis.document, axeConfig);
  });

  // Perform custom keyboard testing beyond what axe-core can detect
  const customViolations = await performCustomKeyboardTests(page);

  return {
    axeViolations: axeResults.violations,
    customViolations
  };
}

async function performCustomKeyboardTests(page: Page): Promise<Array<{
  ruleKey: string;
  severity: 'minor' | 'moderate' | 'serious' | 'critical';
  message: string;
  elements: string[];
}>> {
  const violations = [];

  // Test 1: Keyboard trap detection
  const keyboardTraps = await page.evaluate(() => {
    const focusableElements = Array.from(document.querySelectorAll(
      'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    ));
    
    const traps: string[] = [];
    
    // Simulate tab navigation to detect traps
    // This is a basic implementation - more sophisticated testing would involve actual keyboard events
    focusableElements.forEach((element, index) => {
      const tabIndex = element.getAttribute('tabindex');
      if (tabIndex && parseInt(tabIndex) > 0) {
        // Positive tabindex can create keyboard traps
        traps.push((element as HTMLElement).outerHTML.substring(0, 100));
      }
    });
    
    return traps;
  });

  if (keyboardTraps.length > 0) {
    violations.push({
      ruleKey: 'ACC_KBD_02_KEYBOARD_TRAP',
      severity: 'critical' as const,
      message: 'Potential keyboard trap detected. Elements with positive tabindex values can prevent users from navigating away.',
      elements: keyboardTraps
    });
  }

  // Test 2: Focus visibility testing
  const focusVisibilityIssues = await page.evaluate(() => {
    const focusableElements = Array.from(document.querySelectorAll(
      'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    ));
    
    const issues: string[] = [];
    
    focusableElements.forEach(element => {
      const computedStyle = getComputedStyle(element);
      const focusStyle = getComputedStyle(element, ':focus');
      
      // Check if focus indicator is present
      const hasOutline = focusStyle.outline !== 'none' && focusStyle.outline !== '0px none';
      const hasBorder = focusStyle.borderColor !== computedStyle.borderColor;
      const hasBoxShadow = focusStyle.boxShadow !== 'none' && focusStyle.boxShadow !== computedStyle.boxShadow;
      
      if (!hasOutline && !hasBorder && !hasBoxShadow) {
        issues.push((element as HTMLElement).outerHTML.substring(0, 100));
      }
    });
    
    return issues;
  });

  if (focusVisibilityIssues.length > 0) {
    violations.push({
      ruleKey: 'ACC_KBD_01_FOCUS_VISIBLE',
      severity: 'critical' as const,
      message: 'Elements are missing visible focus indicators, making keyboard navigation difficult for users.',
      elements: focusVisibilityIssues
    });
  }

  // Test 3: Skip link validation
  const skipLinkIssues = await page.evaluate(() => {
    const skipLinks = Array.from(document.querySelectorAll('a[href*="#"]'))
      .filter(link => {
        const text = link.textContent?.toLowerCase() || '';
        return text.includes('skip') || text.includes('jump') || text.includes('main');
      });
      
    const issues: string[] = [];
    
    skipLinks.forEach(link => {
      const href = (link as HTMLAnchorElement).getAttribute('href');
      if (href && href.startsWith('#')) {
        const targetId = href.substring(1);
        const target = document.getElementById(targetId);
        
        if (!target) {
          issues.push((link as HTMLElement).outerHTML.substring(0, 100));
        }
      }
    });
    
    return issues;
  });

  if (skipLinkIssues.length > 0) {
    violations.push({
      ruleKey: 'ACC_STR_09_SKIP_LINK_BROKEN',
      severity: 'serious' as const,
      message: 'Skip links point to non-existent targets, preventing users from bypassing repetitive content.',
      elements: skipLinkIssues
    });
  }

  // Test 4: Keyboard shortcuts conflict detection
  const shortcutConflictViolations = await page.evaluate(() => {
    const violations: string[] = [];
    const elementsWithAccessKeys = document.querySelectorAll('[accesskey]');
    const accessKeys = new Map<string, number>();
    
    elementsWithAccessKeys.forEach(element => {
      const accessKey = element.getAttribute('accesskey')?.toLowerCase();
      if (accessKey) {
        const count = accessKeys.get(accessKey) || 0;
        accessKeys.set(accessKey, count + 1);
        
        if (count > 0) { // Duplicate found
          violations.push(element.outerHTML.substring(0, 100));
        }
      }
    });
    
    return violations;
  });

  if (shortcutConflictViolations.length > 0) {
    violations.push({
      ruleKey: 'ACC_KBD_07_KEYBOARD_SHORTCUTS',
      severity: 'moderate' as const,
      message: 'Duplicate access keys detected - keyboard shortcuts conflict with each other',
      elements: shortcutConflictViolations
    });
  }

  return violations;
}

async function processKeyboardAnalysis(job: Job<KeyboardJobData>) {
  const { analysisId, workspaceId, assetPath } = job.data;
  
  logger.info('Starting keyboard accessibility analysis', { 
    analysisId, 
    workspaceId, 
    assetPath 
  });

  const moduleJobInfo = await getModuleAndJobId(analysisId);
  if (!moduleJobInfo) {
    throw new AppError('Failed to get module and job information', 500, 'MODULE_JOB_ERROR');
  }

  // Update job status to running
  await updateJobStatusCoordinated(analysisId, moduleJobInfo.moduleId, 'keyboard-worker', 'running');

  let browser: Browser | null = null;
  
  try {
    // Load the stored HTML content
    const htmlContent = await loadStoredAsset(assetPath, 'html/index.html');
    
    // Launch browser and create page
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
    
    // Set content
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
    
    // Inject axe-core
    await page.addScriptTag({ path: require.resolve('axe-core') });
    
    // Wait for axe to be available
    await page.waitForFunction(() => typeof (globalThis as any).axe !== 'undefined');

    // Perform keyboard testing
    const testResults = await performAdvancedKeyboardTesting(page);
    
    logger.info('Keyboard analysis complete', {
      axeViolations: testResults.axeViolations.length,
      customViolations: testResults.customViolations.length,
      analysisId
    });

    // Process axe violations
    const axeIssuePromises = [];
    for (const violation of testResults.axeViolations) {
      const dbRuleKey = getDatabaseRuleKey(violation.id);
      
      if (!dbRuleKey) {
        logger.warn('No database rule mapping found for axe rule', { 
          axeRuleId: violation.id 
        });
        continue;
      }

      const ruleId = await getRuleId(dbRuleKey);
      if (!ruleId) {
        logger.warn('Database rule not found', { dbRuleKey });
        continue;
      }

      // Process each node that violated the rule
      for (const node of violation.nodes) {
        const issue = {
          analysis_job_id: moduleJobInfo.jobId,
          rule_id: ruleId,
          severity: mapImpactToSeverity(violation.impact as any),
          location_path: node.target.join(' > '),
          code_snippet: node.html,
          message: node.failureSummary || violation.help,
          fix_suggestion: `${violation.description}\n\nHow to fix:\n${violation.help}\n\nFor more information: ${violation.helpUrl}`
        };

        axeIssuePromises.push(
          supabase
            .from('accessibility_issues')
            .insert([issue])
            .then(({ error }) => {
              if (error) {
                logger.error('Failed to insert axe accessibility issue', { 
                  error, 
                  ruleId: violation.id 
                });
              }
            })
        );
      }
    }

    // Process custom violations
    const customIssuePromises = [];
    for (const violation of testResults.customViolations) {
      const ruleId = await getRuleId(violation.ruleKey);
      if (!ruleId) {
        logger.warn('Database rule not found for custom violation', { ruleKey: violation.ruleKey });
        continue;
      }

      for (const element of violation.elements) {
        const issue = {
          analysis_job_id: moduleJobInfo.jobId,
          rule_id: ruleId,
          severity: violation.severity,
          location_path: 'Custom keyboard test',
          code_snippet: element,
          message: violation.message,
          fix_suggestion: `${violation.message}\n\nThis issue was detected through advanced keyboard navigation testing.`
        };

        customIssuePromises.push(
          supabase
            .from('accessibility_issues')
            .insert([issue])
            .then(({ error }) => {
              if (error) {
                logger.error('Failed to insert custom accessibility issue', { 
                  error, 
                  ruleKey: violation.ruleKey 
                });
              }
            })
        );
      }
    }

    // Wait for all issues to be inserted
    await Promise.all([...axeIssuePromises, ...customIssuePromises]);

    // Update job status to completed
    await updateJobStatusCoordinated(analysisId, moduleJobInfo.moduleId, 'keyboard-worker', 'completed');
    
    logger.info('Keyboard analysis job completed successfully', { analysisId });

  } catch (error) {
    logger.error('Keyboard analysis failed', { error, analysisId });
    
    if (moduleJobInfo) {
      await updateJobStatusCoordinated(
        analysisId, 
        moduleJobInfo.moduleId, 
        'keyboard-worker', 
        'failed', 
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
    
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Create and export the worker
const keyboardWorker = new Worker('accessibility-keyboard', processKeyboardAnalysis, {
  connection: config.redis,
  concurrency: 5,
  limiter: {
    max: 10,
    duration: 10000,
  },
});

keyboardWorker.on('completed', (job) => {
  logger.info('Keyboard analysis job completed', { 
    jobId: job.id, 
    analysisId: job.data?.analysisId 
  });
});

keyboardWorker.on('failed', (job, err) => {
  logger.error('Keyboard analysis job failed', { 
    jobId: job?.id, 
    analysisId: job?.data?.analysisId, 
    error: err.message 
  });
});

keyboardWorker.on('error', (err) => {
  logger.error('Keyboard worker error', { error: err.message });
});

export { keyboardWorker };