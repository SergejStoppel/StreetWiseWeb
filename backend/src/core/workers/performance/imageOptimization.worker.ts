import { Job, Worker } from 'bullmq';
import { config } from '@/config';
import { createLogger } from '@/config/logger';
import { supabase } from '@/config/supabase';
import { AppError } from '@/types';
import { checkAndUpdateAnalysisCompletion } from '@/core/workers/master.worker';

const logger = createLogger('performance-image-worker');

interface ImageOptimizationJobData {
  analysisId: string;
  workspaceId: string;
  websiteId: string;
  userId: string | null;
  assetPath: string; // `${workspaceId}/${analysisId}`
  metadata: any;
}

type IssueSeverity = 'minor' | 'moderate' | 'serious' | 'critical';

interface ImageMetadata {
  capturedAt: string;
  totalImages: number;
  aboveFoldImages: number;
  belowFoldImages: number;
  lazyLoadedImages: number;
  imagesWithSrcset: number;
  imagesWithDimensions: number;
  oversizedImages: number;
  images: ImageData[];
}

interface ImageData {
  index: number;
  src: string;
  alt: string;
  naturalWidth: number;
  naturalHeight: number;
  renderedWidth: number;
  renderedHeight: number;
  displayWidth: number;
  displayHeight: number;
  hasWidthAttr: boolean;
  hasHeightAttr: boolean;
  widthAttrValue: string | null;
  heightAttrValue: string | null;
  loading: string | null;
  isLazyLoaded: boolean;
  hasSrcset: boolean;
  srcset: string | null;
  hasSizes: boolean;
  sizes: string | null;
  position: 'above-fold' | 'below-fold';
  topOffset: number;
  visible: boolean;
  format: string;
  sizeRatio: number | null;
  isOversized: boolean | null;
}

interface PerformanceIssue {
  rule_key: string;
  severity: IssueSeverity;
  location_path?: string;
  code_snippet?: string;
  message?: string;
  fix_suggestion?: string;
  metric_value?: number;
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

async function updateImageOptimizationJobStatus(
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
    logger.error('Failed to update image optimization job status', { error, analysisId, moduleId, status });
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

/**
 * Analyze oversized images (images larger than needed for display)
 */
function analyzeOversizedImages(imageMetadata: ImageMetadata): PerformanceIssue[] {
  const issues: PerformanceIssue[] = [];

  const oversizedImages = imageMetadata.images.filter(img =>
    img.isOversized && img.naturalWidth > 0 && img.renderedWidth > 0
  );

  if (oversizedImages.length === 0) return issues;

  // Group by severity
  const severelyOversized = oversizedImages.filter(img => img.sizeRatio && img.sizeRatio > 4);
  const moderatelyOversized = oversizedImages.filter(img => img.sizeRatio && img.sizeRatio > 2 && img.sizeRatio <= 4);

  if (severelyOversized.length > 0) {
    const totalWaste = severelyOversized.reduce((sum, img) => sum + (img.sizeRatio || 0), 0);
    const avgWaste = totalWaste / severelyOversized.length;

    issues.push({
      rule_key: 'PERF_IMG_01_OVERSIZED',
      severity: 'serious',
      location_path: `images (${severelyOversized.length} severely oversized)`,
      code_snippet: severelyOversized.slice(0, 3).map(img =>
        `<img src="${img.src.substring(0, 60)}..." width="${img.naturalWidth}" height="${img.naturalHeight}" style="display: ${img.renderedWidth}x${img.renderedHeight}px" />`
      ).join('\n'),
      message: `${severelyOversized.length} images are ${avgWaste.toFixed(1)}x larger than needed`,
      fix_suggestion: `Resize images to match their display size (use 2x for retina displays). Example: For images displayed at ${Math.round(severelyOversized[0]?.renderedWidth || 0)}x${Math.round(severelyOversized[0]?.renderedHeight || 0)}px, use maximum ${Math.round((severelyOversized[0]?.renderedWidth || 0) * 2)}x${Math.round((severelyOversized[0]?.renderedHeight || 0) * 2)}px images. This can reduce page weight by 60-80%.`,
      metric_value: avgWaste
    });
  }

  if (moderatelyOversized.length > 3) {
    issues.push({
      rule_key: 'PERF_IMG_01_OVERSIZED',
      severity: 'moderate',
      location_path: `images (${moderatelyOversized.length} moderately oversized)`,
      message: `${moderatelyOversized.length} images are 2-4x larger than their display size`,
      fix_suggestion: `Resize images to 2x their display dimensions for optimal retina display support without excessive file sizes.`,
      metric_value: moderatelyOversized.length
    });
  }

  return issues;
}

/**
 * Analyze image formats and recommend modern formats
 */
function analyzeImageFormats(imageMetadata: ImageMetadata): PerformanceIssue[] {
  const issues: PerformanceIssue[] = [];

  const outdatedFormats = imageMetadata.images.filter(img =>
    ['jpg', 'jpeg', 'png'].includes(img.format)
  );

  if (outdatedFormats.length > 5) {
    const jpegCount = outdatedFormats.filter(img => ['jpg', 'jpeg'].includes(img.format)).length;
    const pngCount = outdatedFormats.filter(img => img.format === 'png').length;

    issues.push({
      rule_key: 'PERF_IMG_02_FORMAT_OUTDATED',
      severity: 'moderate',
      location_path: `${outdatedFormats.length} images using outdated formats`,
      code_snippet: `JPEG: ${jpegCount} images\nPNG: ${pngCount} images\nTotal: ${outdatedFormats.length} images`,
      message: `${outdatedFormats.length} images could benefit from modern formats (WebP/AVIF)`,
      fix_suggestion: `Convert images to WebP format to reduce file sizes by 25-35% without quality loss. For even better compression, use AVIF format (40-50% reduction). Ensure you provide fallbacks for older browsers:\n\n<picture>\n  <source srcset="image.avif" type="image/avif">\n  <source srcset="image.webp" type="image/webp">\n  <img src="image.jpg" alt="..." />\n</picture>`,
      metric_value: outdatedFormats.length
    });
  }

  return issues;
}

/**
 * Analyze missing width/height attributes (causes CLS)
 */
function analyzeMissingDimensions(imageMetadata: ImageMetadata): PerformanceIssue[] {
  const issues: PerformanceIssue[] = [];

  const missingDimensions = imageMetadata.images.filter(img =>
    !img.hasWidthAttr || !img.hasHeightAttr
  );

  if (missingDimensions.length > 0) {
    const aboveFoldMissing = missingDimensions.filter(img => img.position === 'above-fold');

    if (aboveFoldMissing.length > 0) {
      issues.push({
        rule_key: 'PERF_IMG_03_DIMENSIONS_MISSING',
        severity: 'serious',
        location_path: `${aboveFoldMissing.length} above-fold images`,
        code_snippet: aboveFoldMissing.slice(0, 3).map(img =>
          `<img src="${img.src.substring(0, 50)}..." /> <!-- Missing width/height -->`
        ).join('\n'),
        message: `${aboveFoldMissing.length} above-fold images lack width/height attributes, causing layout shifts (CLS)`,
        fix_suggestion: `Add explicit width and height attributes to prevent Cumulative Layout Shift:\n\n<img src="image.jpg" width="${aboveFoldMissing[0]?.naturalWidth || 800}" height="${aboveFoldMissing[0]?.naturalHeight || 600}" alt="..." />\n\nThis reserves space before the image loads, preventing content jumping. Critical for Core Web Vitals score.`,
        metric_value: aboveFoldMissing.length
      });
    }

    if (missingDimensions.length > aboveFoldMissing.length) {
      const belowFoldMissing = missingDimensions.length - aboveFoldMissing.length;
      issues.push({
        rule_key: 'PERF_IMG_03_DIMENSIONS_MISSING',
        severity: 'moderate',
        location_path: `${belowFoldMissing} below-fold images`,
        message: `${belowFoldMissing} below-fold images lack width/height attributes`,
        fix_suggestion: `Add width/height attributes to all images to improve user experience and prevent layout shifts during scrolling.`,
        metric_value: belowFoldMissing
      });
    }
  }

  return issues;
}

/**
 * Analyze lazy loading implementation
 */
function analyzeLazyLoading(imageMetadata: ImageMetadata): PerformanceIssue[] {
  const issues: PerformanceIssue[] = [];

  // Check for below-fold images that should be lazy loaded
  const belowFoldNotLazy = imageMetadata.images.filter(img =>
    img.position === 'below-fold' && !img.isLazyLoaded
  );

  if (belowFoldNotLazy.length > 3) {
    issues.push({
      rule_key: 'PERF_IMG_04_LAZY_LOADING_MISSING',
      severity: 'moderate',
      location_path: `${belowFoldNotLazy.length} below-fold images`,
      message: `${belowFoldNotLazy.length} below-fold images load immediately instead of being lazy-loaded`,
      fix_suggestion: `Add loading="lazy" attribute to below-the-fold images to improve initial page load:\n\n<img src="image.jpg" loading="lazy" alt="..." />\n\nThis defers image loading until the user scrolls near them, reducing initial page weight and improving LCP (Largest Contentful Paint).`,
      metric_value: belowFoldNotLazy.length
    });
  }

  // Check for incorrectly lazy-loaded above-fold images
  const aboveFoldLazy = imageMetadata.images.filter(img =>
    img.position === 'above-fold' && img.isLazyLoaded
  );

  if (aboveFoldLazy.length > 0) {
    issues.push({
      rule_key: 'PERF_IMG_05_LAZY_LOADING_INCORRECT',
      severity: 'serious',
      location_path: `${aboveFoldLazy.length} above-fold images`,
      message: `${aboveFoldLazy.length} above-fold images are lazy-loaded, delaying LCP`,
      fix_suggestion: `Remove loading="lazy" from above-the-fold images. These should load immediately as they're visible on page load. Lazy loading critical images hurts your Largest Contentful Paint (LCP) score.`,
      metric_value: aboveFoldLazy.length
    });
  }

  return issues;
}

/**
 * Analyze responsive images (srcset/sizes)
 */
function analyzeResponsiveImages(imageMetadata: ImageMetadata): PerformanceIssue[] {
  const issues: PerformanceIssue[] = [];

  const largeImagesWithoutSrcset = imageMetadata.images.filter(img =>
    !img.hasSrcset &&
    img.naturalWidth > 800 &&
    img.renderedWidth < img.naturalWidth * 0.8
  );

  if (largeImagesWithoutSrcset.length > 3) {
    issues.push({
      rule_key: 'PERF_IMG_06_NO_SRCSET',
      severity: 'moderate',
      location_path: `${largeImagesWithoutSrcset.length} large images`,
      message: `${largeImagesWithoutSrcset.length} large images lack responsive image markup (srcset)`,
      fix_suggestion: `Use srcset and sizes attributes to serve appropriately-sized images for different devices:\n\n<img\n  srcset="small.jpg 400w, medium.jpg 800w, large.jpg 1200w"\n  sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"\n  src="medium.jpg"\n  alt="..."\n/>\n\nThis ensures mobile users don't download desktop-sized images, saving bandwidth and improving load times.`,
      metric_value: largeImagesWithoutSrcset.length
    });
  }

  return issues;
}

/**
 * Analyze total page weight from images
 */
function analyzePageWeight(imageMetadata: ImageMetadata): PerformanceIssue[] {
  const issues: PerformanceIssue[] = [];

  // Estimate total image weight based on dimensions and format
  const estimateFileSize = (img: ImageData): number => {
    const pixels = img.naturalWidth * img.naturalHeight;
    const bytesPerPixel = img.format === 'png' ? 3 : 0.5; // Rough estimate
    return pixels * bytesPerPixel;
  };

  const totalEstimatedBytes = imageMetadata.images.reduce((sum, img) =>
    sum + estimateFileSize(img), 0
  );

  const totalMB = totalEstimatedBytes / (1024 * 1024);

  if (totalMB > 5) {
    issues.push({
      rule_key: 'PERF_IMG_07_PAGE_WEIGHT_HIGH',
      severity: totalMB > 10 ? 'serious' : 'moderate',
      location_path: `all images (${imageMetadata.totalImages} total)`,
      message: `Estimated ${totalMB.toFixed(1)}MB of images on page (recommended: <3MB)`,
      fix_suggestion: `Reduce total image weight by:\n• Compressing images (aim for <200KB per image)\n• Converting to WebP/AVIF format\n• Lazy loading below-fold images\n• Using responsive images (srcset)\n• Removing unnecessary images\n\nEach MB of images adds ~1 second to load time on 3G connections.`,
      metric_value: Math.round(totalMB * 10) / 10
    });
  }

  return issues;
}

/**
 * Analyze CLS (Cumulative Layout Shift) risks
 */
function analyzeClsRisks(imageMetadata: ImageMetadata): PerformanceIssue[] {
  const issues: PerformanceIssue[] = [];

  const clsRiskImages = imageMetadata.images.filter(img =>
    img.position === 'above-fold' &&
    (!img.hasWidthAttr || !img.hasHeightAttr) &&
    img.naturalHeight > 100
  );

  if (clsRiskImages.length > 0) {
    issues.push({
      rule_key: 'PERF_IMG_08_CLS_RISK',
      severity: 'critical',
      location_path: `${clsRiskImages.length} above-fold images`,
      message: `${clsRiskImages.length} above-fold images risk causing Cumulative Layout Shift`,
      fix_suggestion: `These images will cause the page to jump when they load. Add width/height attributes immediately:\n\n${clsRiskImages.slice(0, 2).map(img =>
        `<img src="${img.src.substring(img.src.lastIndexOf('/') + 1, img.src.lastIndexOf('/') + 30)}..." width="${img.naturalWidth}" height="${img.naturalHeight}" alt="${img.alt || '...'}" />`
      ).join('\n')}\n\nCLS is a Core Web Vitals metric that affects SEO rankings. Target: CLS < 0.1`,
      metric_value: clsRiskImages.length
    });
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

export const imageOptimizationWorker = new Worker('performance-image-optimization', async (job: Job<ImageOptimizationJobData>) => {
  const { analysisId, workspaceId, assetPath, metadata } = job.data;
  logger.info('Starting Image Optimization analysis', { analysisId, assetPath });

  let moduleJobInfo: { moduleId: string; jobId: string } | null = null;

  try {
    moduleJobInfo = await getPerformanceModuleAndJobId(analysisId);
    if (!moduleJobInfo) throw new AppError('Failed to get Performance job info', 500);

    await updateImageOptimizationJobStatus(analysisId, moduleJobInfo.moduleId, 'running');

    // Load image metadata from storage
    const imageMetadataPath = `${assetPath}/meta/images.json`;
    const imageMetadataJson = await downloadTextFromStorage(imageMetadataPath);

    if (!imageMetadataJson) {
      logger.warn('Image metadata not found, skipping image optimization analysis', { imageMetadataPath });
      await updateImageOptimizationJobStatus(analysisId, moduleJobInfo.moduleId, 'completed');
      await checkAndUpdateAnalysisCompletion(analysisId);
      return { success: true, issues: 0, skipped: true };
    }

    const imageMetadata: ImageMetadata = JSON.parse(imageMetadataJson);

    if (!imageMetadata.images || imageMetadata.images.length === 0) {
      logger.info('No images found on page, skipping analysis', { analysisId });
      await updateImageOptimizationJobStatus(analysisId, moduleJobInfo.moduleId, 'completed');
      await checkAndUpdateAnalysisCompletion(analysisId);
      return { success: true, issues: 0, noImages: true };
    }

    logger.info('Analyzing image optimization opportunities', {
      totalImages: imageMetadata.totalImages,
      oversizedImages: imageMetadata.oversizedImages,
      withoutDimensions: imageMetadata.totalImages - imageMetadata.imagesWithDimensions
    });

    let allIssues: PerformanceIssue[] = [];

    // Run all image analysis functions
    allIssues.push(
      ...analyzeOversizedImages(imageMetadata),
      ...analyzeImageFormats(imageMetadata),
      ...analyzeMissingDimensions(imageMetadata),
      ...analyzeLazyLoading(imageMetadata),
      ...analyzeResponsiveImages(imageMetadata),
      ...analyzePageWeight(imageMetadata),
      ...analyzeClsRisks(imageMetadata)
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
          });

        if (error) {
          logger.error('Failed to insert performance issue', { error, ruleKey: issue.rule_key });
          skippedCount++;
        } else {
          insertedCount++;
        }
      }

      logger.info('Image optimization issue insertion completed', {
        analysisId,
        totalIssues: allIssues.length,
        inserted: insertedCount,
        skipped: skippedCount
      });
    }

    await updateImageOptimizationJobStatus(analysisId, moduleJobInfo.moduleId, 'completed');
    await checkAndUpdateAnalysisCompletion(analysisId);

    logger.info('Image Optimization analysis completed', {
      analysisId,
      totalImages: imageMetadata.totalImages,
      issueCount: allIssues.length
    });

    return { success: true, images: imageMetadata.totalImages, issues: allIssues.length };
  } catch (error: any) {
    logger.error('Image Optimization analysis failed', { error: error?.message || 'Unknown error', analysisId });
    if (moduleJobInfo) {
      await updateImageOptimizationJobStatus(analysisId, moduleJobInfo.moduleId, 'failed', error?.message || 'Unknown error');
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
  logger.info('SIGTERM received, closing performance-image-optimization worker...');
  await imageOptimizationWorker.close();
});
