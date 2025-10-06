import { Job, Worker } from 'bullmq';
import { config } from '@/config';
import { createLogger } from '@/config/logger';
import { supabase } from '@/config/supabase';
import { AppError } from '@/types';
import { checkAndUpdateAnalysisCompletion } from '@/core/workers/master.worker';
import lighthouse from 'lighthouse';
import puppeteer from 'puppeteer';
import { PerformanceExamplesService } from '@/services/performance/performanceExamples';

const logger = createLogger('performance-cwv-worker');

interface CoreWebVitalsJobData {
  analysisId: string;
  workspaceId: string;
  websiteId: string;
  userId: string | null;
  assetPath: string; // `${workspaceId}/${analysisId}`
  metadata: any;
}

type IssueSeverity = 'minor' | 'moderate' | 'serious' | 'critical';

interface PerformanceIssue {
  rule_key: string;
  severity: IssueSeverity;
  location_path?: string;
  code_snippet?: string;
  message?: string;
  fix_suggestion?: string;
  metric_value?: number;
  improvement_potential?: string;
  resource_url?: string;
  savings_bytes?: number;
  savings_ms?: number;
}

async function getPerformanceModuleAndJobId(analysisId: string): Promise<{ moduleId: string; jobId: string } | null> {
  const { data: module, error: moduleError } = await supabase
    .from('analysis_modules')
    .select('id')
    .eq('name', 'Performance')
    .single();

  if (moduleError || !module) {
    logger.error('Performance module not found', { error: moduleError });
    return null;
  }

  const { data: job, error: jobError } = await supabase
    .from('analysis_jobs')
    .select('id')
    .eq('analysis_id', analysisId)
    .eq('module_id', module.id)
    .single();

  if (jobError || !job) {
    logger.error('Performance analysis job not found', { error: jobError, analysisId, moduleId: module.id });
    return null;
  }

  return { moduleId: module.id, jobId: job.id };
}

async function updatePerformanceJobStatus(analysisId: string, moduleId: string, status: 'running' | 'completed' | 'failed', errorMessage?: string) {
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
    logger.error('Failed to update Performance job status', { error, analysisId, moduleId, status });
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

async function runLighthouseAnalysis(url: string): Promise<any> {
  let browser: any = null;
  
  try {
    logger.info('Starting Lighthouse analysis', { url });
    
    // Launch Puppeteer browser with performance optimizations
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-gpu',
        '--remote-debugging-port=9222'
      ]
    });

    // Get debugging port
    const browserWSEndpoint = browser.wsEndpoint();
    const debuggingPort = browserWSEndpoint.match(/:(\d+)\//)?.[1];
    
    if (!debuggingPort) {
      throw new Error('Could not extract debugging port from browser');
    }

    // Configure Lighthouse options for performance analysis
    const options = {
      logLevel: 'error',
      output: 'json',
      onlyCategories: ['performance'],
      port: parseInt(debuggingPort),
      disableStorageReset: false,
      maxWaitForFcp: 60 * 1000, // 60 seconds
      maxWaitForLoad: 90 * 1000, // 90 seconds
      emulatedFormFactor: 'desktop', // Can be changed to 'mobile' as needed
      throttling: {
        rttMs: 40,
        throughputKbps: 10 * 1024,
        cpuSlowdownMultiplier: 1
      }
    };

    // Run Lighthouse audit
    const runnerResult = await lighthouse(url, options);
    
    if (!runnerResult || !runnerResult.report) {
      throw new Error('Lighthouse returned empty result');
    }

    const report = JSON.parse(runnerResult.report);
    logger.info('Lighthouse analysis completed successfully', { 
      url,
      performanceScore: report.categories?.performance?.score 
    });
    
    return report;
    
  } catch (error) {
    logger.error('Lighthouse analysis failed', { 
      error: error.message,
      stack: error.stack,
      url 
    });
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function analyzeCoreWebVitals(lighthouseReport: any, url: string): Promise<PerformanceIssue[]> {
  const issues: PerformanceIssue[] = [];
  const audits = lighthouseReport.audits || {};
  
  // Extract Core Web Vitals metrics
  const lcp = audits['largest-contentful-paint']?.numericValue / 1000 || null; // Convert to seconds
  const cls = audits['cumulative-layout-shift']?.numericValue || null;
  const tbt = audits['total-blocking-time']?.numericValue || null; // Already in ms
  const fcp = audits['first-contentful-paint']?.numericValue / 1000 || null; // Convert to seconds

  logger.info('Core Web Vitals extracted', { url, lcp, cls, tbt, fcp });

  // Analyze LCP (Largest Contentful Paint)
  if (lcp !== null) {
    if (lcp > 4) {
      const lcpExample = PerformanceExamplesService.getLCPExamples(lcp);
      issues.push({
        rule_key: 'PERF_CWV_01_LCP_POOR',
        severity: 'critical',
        location_path: 'Core Web Vitals',
        metric_value: lcp,
        improvement_potential: `Improve by ${(lcp - 2.5).toFixed(1)}s`,
        message: `LCP is ${lcp.toFixed(2)}s (poor - should be ≤2.5s)`,
        fix_suggestion: `${lcpExample.fix_suggestion}\n\n${lcpExample.example?.badExample || ''}\n\n${lcpExample.example?.goodExample || ''}\n\n💡 ${lcpExample.example?.explanation || ''}`
      });
    } else if (lcp > 2.5) {
      const lcpExample = PerformanceExamplesService.getLCPExamples(lcp);
      issues.push({
        rule_key: 'PERF_CWV_02_LCP_NEEDS_IMPROVEMENT',
        severity: 'serious',
        location_path: 'Core Web Vitals',
        metric_value: lcp,
        improvement_potential: `Improve by ${(lcp - 2.5).toFixed(1)}s`,
        message: `LCP is ${lcp.toFixed(2)}s (needs improvement - should be ≤2.5s)`,
        fix_suggestion: `${lcpExample.fix_suggestion}\n\n${lcpExample.example?.badExample || ''}\n\n${lcpExample.example?.goodExample || ''}\n\n💡 ${lcpExample.example?.explanation || ''}`
      });
    }
  }

  // Analyze CLS (Cumulative Layout Shift)
  if (cls !== null) {
    if (cls > 0.25) {
      const clsExample = PerformanceExamplesService.getCLSExamples(cls);
      issues.push({
        rule_key: 'PERF_CWV_03_CLS_POOR',
        severity: 'serious',
        location_path: 'Layout Stability',
        metric_value: cls,
        improvement_potential: `Reduce by ${(cls - 0.1).toFixed(2)}`,
        message: `CLS is ${cls.toFixed(3)} (poor - should be ≤0.1)`,
        fix_suggestion: `${clsExample.fix_suggestion}\n\n${clsExample.example?.badExample || ''}\n\n${clsExample.example?.goodExample || ''}\n\n💡 ${clsExample.example?.explanation || ''}`
      });
    } else if (cls > 0.1) {
      const clsExample = PerformanceExamplesService.getCLSExamples(cls);
      issues.push({
        rule_key: 'PERF_CWV_04_CLS_NEEDS_IMPROVEMENT',
        severity: 'moderate',
        location_path: 'Layout Stability',
        metric_value: cls,
        improvement_potential: `Reduce by ${(cls - 0.1).toFixed(2)}`,
        message: `CLS is ${cls.toFixed(3)} (needs improvement - should be ≤0.1)`,
        fix_suggestion: `${clsExample.fix_suggestion}\n\n${clsExample.example?.badExample || ''}\n\n${clsExample.example?.goodExample || ''}\n\n💡 ${clsExample.example?.explanation || ''}`
      });
    }
  }

  // Analyze TBT (Total Blocking Time)
  if (tbt !== null) {
    if (tbt > 600) {
      const tbtExample = PerformanceExamplesService.getTBTExamples(tbt);
      issues.push({
        rule_key: 'PERF_CWV_05_TBT_POOR',
        severity: 'critical',
        location_path: 'JavaScript Execution',
        metric_value: tbt,
        improvement_potential: `Save ${(tbt - 200).toFixed(0)}ms`,
        savings_ms: Math.round(tbt - 200),
        message: `TBT is ${Math.round(tbt)}ms (poor - should be ≤200ms)`,
        fix_suggestion: `${tbtExample.fix_suggestion}\n\n${tbtExample.example?.badExample || ''}\n\n${tbtExample.example?.goodExample || ''}\n\n💡 ${tbtExample.example?.explanation || ''}`
      });
    } else if (tbt > 200) {
      const tbtExample = PerformanceExamplesService.getTBTExamples(tbt);
      issues.push({
        rule_key: 'PERF_CWV_06_TBT_NEEDS_IMPROVEMENT',
        severity: 'serious',
        location_path: 'JavaScript Execution',
        metric_value: tbt,
        improvement_potential: `Save ${(tbt - 200).toFixed(0)}ms`,
        savings_ms: Math.round(tbt - 200),
        message: `TBT is ${Math.round(tbt)}ms (needs improvement - should be ≤200ms)`,
        fix_suggestion: `${tbtExample.fix_suggestion}\n\n${tbtExample.example?.badExample || ''}\n\n${tbtExample.example?.goodExample || ''}\n\n💡 ${tbtExample.example?.explanation || ''}`
      });
    }
  }

  return issues;
}

async function analyzeResourceOptimization(lighthouseReport: any, url: string): Promise<PerformanceIssue[]> {
  const issues: PerformanceIssue[] = [];
  const audits = lighthouseReport.audits || {};

  // Analyze render-blocking resources
  const renderBlockingAudit = audits['render-blocking-resources'];
  if (renderBlockingAudit?.score < 1 && renderBlockingAudit?.details?.items?.length > 0) {
    const blockingResources = renderBlockingAudit.details.items.map((item: any) => item.url).slice(0, 5);
    const totalWastedMs = renderBlockingAudit.details.items.reduce((sum: number, item: any) => sum + (item.wastedMs || 0), 0);
    
    const renderBlockingExample = PerformanceExamplesService.getRenderBlockingExamples(blockingResources);
    issues.push({
      rule_key: 'PERF_RES_01_RENDER_BLOCKING',
      severity: 'serious',
      location_path: 'Resource Loading',
      savings_ms: Math.round(totalWastedMs),
      improvement_potential: `Save ${Math.round(totalWastedMs)}ms`,
      code_snippet: blockingResources.join('\n'),
      message: `${blockingResources.length} render-blocking resources delay page rendering`,
      fix_suggestion: `${renderBlockingExample.fix_suggestion}\n\n${renderBlockingExample.example?.badExample || ''}\n\n${renderBlockingExample.example?.goodExample || ''}\n\n💡 ${renderBlockingExample.example?.explanation || ''}`
    });
  }

  // Analyze unused code
  const unusedCssAudit = audits['unused-css-rules'];
  const unusedJsAudit = audits['unused-javascript'];
  
  if (unusedCssAudit?.details?.overallSavingsBytes > 50000 || unusedJsAudit?.details?.overallSavingsBytes > 100000) {
    const totalUnusedBytes = (unusedCssAudit?.details?.overallSavingsBytes || 0) + (unusedJsAudit?.details?.overallSavingsBytes || 0);
    const totalCodeBytes = totalUnusedBytes / 0.7; // Estimate total if 70% is unused
    const unusedPercent = Math.round((totalUnusedBytes / totalCodeBytes) * 100);
    
    const unusedCodeExample = PerformanceExamplesService.getUnusedCodeExamples(unusedPercent, totalUnusedBytes);
    issues.push({
      rule_key: 'PERF_RES_02_UNUSED_CODE',
      severity: 'moderate',
      location_path: 'Code Optimization',
      savings_bytes: totalUnusedBytes,
      improvement_potential: `Save ${(totalUnusedBytes / 1024).toFixed(0)}KB`,
      message: `${(totalUnusedBytes / 1024).toFixed(0)}KB of unused CSS/JavaScript code`,
      fix_suggestion: `${unusedCodeExample.fix_suggestion}\n\n${unusedCodeExample.example?.badExample || ''}\n\n${unusedCodeExample.example?.goodExample || ''}\n\n💡 ${unusedCodeExample.example?.explanation || ''}`
    });
  }

  // Analyze image optimization
  const modernImageAudit = audits['modern-image-formats'];
  if (modernImageAudit?.score < 1 && modernImageAudit?.details?.items?.length > 0) {
    const unoptimizedImages = modernImageAudit.details.items.map((item: any) => item.url).slice(0, 5);
    const totalImageSavings = modernImageAudit.details.items.reduce((sum: number, item: any) => sum + (item.wastedBytes || 0), 0);
    
    const imageFormatExample = PerformanceExamplesService.getImageFormatExamples(unoptimizedImages);
    issues.push({
      rule_key: 'PERF_IMG_01_FORMAT_NOT_OPTIMIZED',
      severity: 'moderate',
      location_path: 'Image Optimization',
      savings_bytes: totalImageSavings,
      improvement_potential: `Save ${(totalImageSavings / 1024).toFixed(0)}KB`,
      code_snippet: unoptimizedImages.join('\n'),
      message: `${unoptimizedImages.length} images could use modern formats (WebP/AVIF)`,
      fix_suggestion: `${imageFormatExample.fix_suggestion}\n\n${imageFormatExample.example?.badExample || ''}\n\n${imageFormatExample.example?.goodExample || ''}\n\n💡 ${imageFormatExample.example?.explanation || ''}`
    });
  }

  // Analyze oversized images
  const oversizedImageAudit = audits['uses-responsive-images'];
  if (oversizedImageAudit?.score < 1 && oversizedImageAudit?.details?.items?.length > 0) {
    const oversizedImages = oversizedImageAudit.details.items.map((item: any) => ({
      url: item.url,
      actualSize: `${Math.round(item.totalBytes / 1024)}KB`,
      renderedSize: `${Math.round(item.wastedBytes / 1024)}KB potential savings`,
      wastedBytes: item.wastedBytes
    })).slice(0, 3);
    
    const imageSizeExample = PerformanceExamplesService.getImageSizeExamples(oversizedImages);
    const totalWasted = oversizedImages.reduce((sum, img) => sum + img.wastedBytes, 0);
    
    issues.push({
      rule_key: 'PERF_IMG_02_OVERSIZED_IMAGES',
      severity: 'moderate',
      location_path: 'Image Sizing',
      savings_bytes: totalWasted,
      improvement_potential: `Save ${(totalWasted / 1024).toFixed(0)}KB`,
      message: `${oversizedImages.length} images are larger than needed for display size`,
      fix_suggestion: `${imageSizeExample.fix_suggestion}\n\n${imageSizeExample.example?.badExample || ''}\n\n${imageSizeExample.example?.goodExample || ''}\n\n💡 ${imageSizeExample.example?.explanation || ''}`
    });
  }

  // Analyze caching
  const cacheAudit = audits['uses-long-cache-ttl'];
  if (cacheAudit?.score < 0.9) {
    const uncachedResources = cacheAudit?.details?.items?.map((item: any) => item.url).slice(0, 3) || [];
    
    const cacheExample = PerformanceExamplesService.getCacheExamples(uncachedResources);
    issues.push({
      rule_key: 'PERF_CACHE_01_INEFFICIENT',
      severity: 'moderate',
      location_path: 'Resource Caching',
      message: 'Static resources lack efficient caching policies',
      fix_suggestion: `${cacheExample.fix_suggestion}\n\n${cacheExample.example?.badExample || ''}\n\n${cacheExample.example?.goodExample || ''}\n\n💡 ${cacheExample.example?.explanation || ''}`
    });
  }

  return issues;
}

async function storePerformanceMetrics(analysisId: string, lighthouseReport: any): Promise<void> {
  const audits = lighthouseReport.audits || {};
  
  // Extract Core Web Vitals
  const lcp = audits['largest-contentful-paint']?.numericValue / 1000 || null;
  const cls = audits['cumulative-layout-shift']?.numericValue || null;
  const tbt = audits['total-blocking-time']?.numericValue || null;
  const fcp = audits['first-contentful-paint']?.numericValue / 1000 || null;

  // Store metrics in analyses table
  const { error } = await supabase
    .from('analyses')
    .update({
      lcp_value: lcp,
      cls_value: cls,
      tbt_value: tbt,
      fcp_value: fcp,
      performance_data: lighthouseReport // Store full report for detailed analysis
    })
    .eq('id', analysisId);

  if (error) {
    logger.error('Failed to store performance metrics', { error, analysisId });
    throw new AppError('Failed to store performance metrics', 500);
  }

  logger.info('Performance metrics stored successfully', { analysisId, lcp, cls, tbt, fcp });
}

export const coreWebVitalsWorker = new Worker('performance-core-web-vitals', async (job: Job<CoreWebVitalsJobData>) => {
  const { analysisId, workspaceId, assetPath, metadata } = job.data;
  logger.info('Starting Core Web Vitals analysis', { analysisId, assetPath });

  let moduleJobInfo: { moduleId: string; jobId: string } | null = null;

  try {
    moduleJobInfo = await getPerformanceModuleAndJobId(analysisId);
    if (!moduleJobInfo) throw new AppError('Failed to get Performance job info', 500);

    await updatePerformanceJobStatus(analysisId, moduleJobInfo.moduleId, 'running');

    const finalUrl = metadata?.finalUrl || metadata?.url || '';
    if (!finalUrl) {
      throw new AppError('No URL provided for performance analysis', 400);
    }

    logger.info('Running Lighthouse analysis', { url: finalUrl });
    
    // Run Lighthouse analysis
    const lighthouseReport = await runLighthouseAnalysis(finalUrl);
    
    // Store performance metrics in database
    await storePerformanceMetrics(analysisId, lighthouseReport);

    // Analyze Core Web Vitals and generate issues
    const [cwvIssues, resourceIssues] = await Promise.all([
      analyzeCoreWebVitals(lighthouseReport, finalUrl),
      analyzeResourceOptimization(lighthouseReport, finalUrl)
    ]);

    const allIssues = [...cwvIssues, ...resourceIssues];

    // Insert performance issues
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
          .from('performance_issues')
          .insert({
            analysis_job_id: moduleJobInfo.jobId,
            rule_id: ruleId,
            severity: issue.severity,
            location_path: issue.location_path,
            code_snippet: issue.code_snippet,
            message: issue.message,
            fix_suggestion: issue.fix_suggestion,
            metric_value: issue.metric_value,
            improvement_potential: issue.improvement_potential,
            resource_url: issue.resource_url,
            savings_bytes: issue.savings_bytes,
            savings_ms: issue.savings_ms,
          });
          
        if (error) {
          logger.error('Failed to insert Performance issue', { error, ruleKey: issue.rule_key });
          skippedCount++;
        } else {
          insertedCount++;
        }
      }
      
      logger.info('Performance issue insertion completed', { 
        analysisId,
        totalIssues: allIssues.length,
        inserted: insertedCount,
        skipped: skippedCount
      });
    }

    await updatePerformanceJobStatus(analysisId, moduleJobInfo.moduleId, 'completed');
    await checkAndUpdateAnalysisCompletion(analysisId);

    const performanceScore = lighthouseReport.categories?.performance?.score * 100 || 0;
    logger.info('Core Web Vitals analysis completed', { 
      analysisId, 
      issueCount: allIssues.length,
      performanceScore
    });
    
    return { 
      success: true, 
      issues: allIssues.length, 
      performanceScore,
      metrics: {
        lcp: lighthouseReport.audits?.['largest-contentful-paint']?.numericValue / 1000,
        cls: lighthouseReport.audits?.['cumulative-layout-shift']?.numericValue,
        tbt: lighthouseReport.audits?.['total-blocking-time']?.numericValue,
        fcp: lighthouseReport.audits?.['first-contentful-paint']?.numericValue / 1000
      }
    };
    
  } catch (error: any) {
    logger.error('Core Web Vitals analysis failed', { error: error?.message || 'Unknown error', analysisId });
    if (moduleJobInfo) {
      await updatePerformanceJobStatus(analysisId, moduleJobInfo.moduleId, 'failed', error?.message || 'Unknown error');
      await checkAndUpdateAnalysisCompletion(analysisId);
    }
    throw error;
  }
}, {
  connection: {
    host: config.redis.host,
    port: config.redis.port,
  },
  concurrency: 2, // Lower concurrency due to Chrome instances
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing performance-cwv worker...');
  await coreWebVitalsWorker.close();
});