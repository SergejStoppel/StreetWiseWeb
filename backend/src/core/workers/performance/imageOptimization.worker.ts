import { Job, Worker } from 'bullmq';
import { config } from '@/config';
import { createLogger } from '@/config/logger';
import { supabase } from '@/config/supabase';
import { AppError } from '@/types';
import { checkAndUpdateAnalysisCompletion } from '@/core/workers/master.worker';
import { JSDOM } from 'jsdom';
import sharp from 'sharp';
import { PerformanceExamplesService } from '@/services/performance/performanceExamples';

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

interface ImageIssue {
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

interface ImageAnalysisResult {
  url: string;
  element: string;
  actualWidth?: number;
  actualHeight?: number;
  renderedWidth?: number;
  renderedHeight?: number;
  hasWidthAttribute: boolean;
  hasHeightAttribute: boolean;
  hasLazyLoading: boolean;
  format?: string;
  fileSize?: number;
  isModernFormat: boolean;
  isOversized: boolean;
  potentialSavings?: number;
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

async function updateImageJobStatus(analysisId: string, moduleId: string, status: 'running' | 'completed' | 'failed', errorMessage?: string) {
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
    logger.error('Failed to update Image Optimization job status', { error, analysisId, moduleId, status });
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

async function downloadImageFromStorage(path: string): Promise<Buffer | null> {
  try {
    const { data, error } = await supabase.storage
      .from('analysis-assets')
      .download(path);
    
    if (error || !data) {
      return null;
    }
    
    return Buffer.from(await data.arrayBuffer());
  } catch (error) {
    logger.warn('Failed to download image from storage', { path, error: error.message });
    return null;
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

async function analyzeImageDimensions(imageBuffer: Buffer): Promise<{ width: number; height: number; format: string; size: number } | null> {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: imageBuffer.length
    };
  } catch (error) {
    logger.warn('Failed to analyze image dimensions', { error: error.message });
    return null;
  }
}

function isModernImageFormat(format: string): boolean {
  return ['webp', 'avif'].includes(format.toLowerCase());
}

function getImageFormatFromUrl(url: string): string {
  const extension = url.split('.').pop()?.toLowerCase() || '';
  const formatMap: { [key: string]: string } = {
    'jpg': 'jpeg',
    'jpeg': 'jpeg',
    'png': 'png',
    'gif': 'gif',
    'webp': 'webp',
    'avif': 'avif',
    'svg': 'svg'
  };
  return formatMap[extension] || 'unknown';
}

async function extractImagesFromHTML(html: string, baseUrl: string): Promise<ImageAnalysisResult[]> {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const images = Array.from(document.querySelectorAll('img'));
  
  const imageResults: ImageAnalysisResult[] = [];
  
  for (const img of images) {
    const src = img.src || img.getAttribute('src') || '';
    if (!src || src.startsWith('data:')) continue; // Skip data URLs
    
    // Resolve relative URLs
    let fullUrl = src;
    try {
      if (!src.startsWith('http')) {
        fullUrl = new URL(src, baseUrl).href;
      }
    } catch {
      continue; // Skip invalid URLs
    }
    
    // Extract attributes
    const widthAttr = img.getAttribute('width');
    const heightAttr = img.getAttribute('height');
    const loading = img.getAttribute('loading');
    const style = img.getAttribute('style') || '';
    
    // Parse rendered dimensions from style or attributes
    let renderedWidth: number | undefined;
    let renderedHeight: number | undefined;
    
    if (widthAttr) renderedWidth = parseInt(widthAttr);
    if (heightAttr) renderedHeight = parseInt(heightAttr);
    
    // Parse CSS dimensions from style attribute
    const widthMatch = style.match(/width:\s*(\d+)px/);
    const heightMatch = style.match(/height:\s*(\d+)px/);
    if (widthMatch) renderedWidth = parseInt(widthMatch[1]);
    if (heightMatch) renderedHeight = parseInt(heightMatch[1]);
    
    const format = getImageFormatFromUrl(fullUrl);
    
    imageResults.push({
      url: fullUrl,
      element: img.outerHTML,
      renderedWidth,
      renderedHeight,
      hasWidthAttribute: !!widthAttr,
      hasHeightAttribute: !!heightAttr,
      hasLazyLoading: loading === 'lazy',
      format,
      isModernFormat: isModernImageFormat(format),
      isOversized: false // Will be determined after getting actual dimensions
    });
  }
  
  return imageResults;
}

async function analyzeImageOptimization(images: ImageAnalysisResult[], assetPath: string): Promise<ImageIssue[]> {
  const issues: ImageIssue[] = [];
  
  // Group issues by type for better reporting
  const unoptimizedFormats: ImageAnalysisResult[] = [];
  const oversizedImages: ImageAnalysisResult[] = [];
  const missingDimensions: ImageAnalysisResult[] = [];
  const nonLazyImages: ImageAnalysisResult[] = [];
  let totalPotentialSavings = 0;
  
  for (const image of images) {
    // Try to get actual image dimensions from downloaded files
    const imageFileName = image.url.split('/').pop()?.split('?')[0] || '';
    const imagePath = `${assetPath}/images/${imageFileName}`;
    const imageBuffer = await downloadImageFromStorage(imagePath);
    
    if (imageBuffer) {
      const dimensions = await analyzeImageDimensions(imageBuffer);
      if (dimensions) {
        image.actualWidth = dimensions.width;
        image.actualHeight = dimensions.height;
        image.fileSize = dimensions.size;
        image.format = dimensions.format;
        image.isModernFormat = isModernImageFormat(dimensions.format);
        
        // Check if image is oversized
        if (image.renderedWidth && image.actualWidth > image.renderedWidth * 1.25) {
          image.isOversized = true;
          // Estimate potential savings (rough calculation)
          const scaleFactor = image.renderedWidth / image.actualWidth;
          image.potentialSavings = Math.round(image.fileSize * (1 - scaleFactor * scaleFactor));
          oversizedImages.push(image);
          totalPotentialSavings += image.potentialSavings;
        }
      }
    }
    
    // Check format optimization
    if (!image.isModernFormat && ['jpeg', 'jpg', 'png'].includes(image.format.toLowerCase())) {
      unoptimizedFormats.push(image);
    }
    
    // Check for missing dimensions
    if (!image.hasWidthAttribute || !image.hasHeightAttribute) {
      missingDimensions.push(image);
    }
    
    // Check for lazy loading (only for below-fold images - simplified check)
    if (!image.hasLazyLoading && images.indexOf(image) > 2) { // Skip first 3 images (likely above fold)
      nonLazyImages.push(image);
    }
  }
  
  // Generate issues based on analysis
  
  // 1. Modern Image Formats
  if (unoptimizedFormats.length > 0) {
    const imageUrls = unoptimizedFormats.slice(0, 5).map(img => img.url);
    const imageFormatExample = PerformanceExamplesService.getImageFormatExamples(imageUrls);
    const estimatedSavings = unoptimizedFormats.reduce((sum, img) => sum + (img.fileSize ? img.fileSize * 0.3 : 50000), 0);
    
    issues.push({
      rule_key: 'PERF_IMG_01_FORMAT_NOT_OPTIMIZED',
      severity: 'moderate',
      location_path: 'Image Optimization',
      resource_url: unoptimizedFormats[0]?.url,
      savings_bytes: Math.round(estimatedSavings),
      improvement_potential: `Save ~${Math.round(estimatedSavings / 1024)}KB with modern formats`,
      code_snippet: unoptimizedFormats.slice(0, 3).map(img => img.element).join('\n\n'),
      message: `${unoptimizedFormats.length} images could use modern formats (WebP/AVIF)`,
      fix_suggestion: `${imageFormatExample.fix_suggestion}\n\n${imageFormatExample.example?.badExample || ''}\n\n${imageFormatExample.example?.goodExample || ''}\n\n💡 ${imageFormatExample.example?.explanation || ''}`
    });
  }
  
  // 2. Oversized Images
  if (oversizedImages.length > 0) {
    const oversizedData = oversizedImages.slice(0, 3).map(img => ({
      url: img.url,
      actualSize: `${img.actualWidth}x${img.actualHeight}`,
      renderedSize: `${img.renderedWidth}x${img.renderedHeight}`,
      wastedBytes: img.potentialSavings || 0
    }));
    
    const imageSizeExample = PerformanceExamplesService.getImageSizeExamples(oversizedData);
    
    issues.push({
      rule_key: 'PERF_IMG_02_OVERSIZED_IMAGES',
      severity: 'moderate',
      location_path: 'Image Sizing',
      resource_url: oversizedImages[0]?.url,
      savings_bytes: totalPotentialSavings,
      improvement_potential: `Save ~${Math.round(totalPotentialSavings / 1024)}KB with proper sizing`,
      code_snippet: oversizedImages.slice(0, 3).map(img => img.element).join('\n\n'),
      message: `${oversizedImages.length} images are larger than their rendered size`,
      fix_suggestion: `${imageSizeExample.fix_suggestion}\n\n${imageSizeExample.example?.badExample || ''}\n\n${imageSizeExample.example?.goodExample || ''}\n\n💡 ${imageSizeExample.example?.explanation || ''}`
    });
  }
  
  // 3. Missing Dimensions (causes layout shift)
  if (missingDimensions.length > 0) {
    issues.push({
      rule_key: 'PERF_IMG_03_MISSING_DIMENSIONS',
      severity: 'serious',
      location_path: 'Layout Stability',
      resource_url: missingDimensions[0]?.url,
      code_snippet: missingDimensions.slice(0, 3).map(img => img.element).join('\n\n'),
      message: `${missingDimensions.length} images lack width/height attributes causing layout shifts`,
      fix_suggestion: `Add width and height attributes to prevent Cumulative Layout Shift (CLS):\n\n❌ Bad:\n<img src="image.jpg" alt="Description">\n\n✅ Good:\n<img src="image.jpg" width="800" height="600" alt="Description">\n\n💡 Why this matters: Images without dimensions cause content to jump when they load, hurting user experience and Core Web Vitals scores.`
    });
  }
  
  // 4. Large File Sizes (general check)
  const largeImages = images.filter(img => img.fileSize && img.fileSize > 500000); // > 500KB
  if (largeImages.length > 0) {
    const totalLargeSize = largeImages.reduce((sum, img) => sum + (img.fileSize || 0), 0);
    
    issues.push({
      rule_key: 'PERF_IMG_04_LARGE_FILE_SIZE',
      severity: 'serious',
      location_path: 'Image Optimization',
      resource_url: largeImages[0]?.url,
      savings_bytes: Math.round(totalLargeSize * 0.6), // Estimate 60% reduction possible
      metric_value: totalLargeSize,
      improvement_potential: `Compress images to save ~${Math.round(totalLargeSize * 0.6 / 1024)}KB`,
      code_snippet: largeImages.slice(0, 3).map(img => `${img.url} (${Math.round((img.fileSize || 0) / 1024)}KB)`).join('\n'),
      message: `${largeImages.length} images are larger than 500KB and slow page loading`,
      fix_suggestion: `Compress large images to improve loading speed:\n\n❌ Problem:\n• Images over 500KB slow loading significantly\n• Uncompressed images waste bandwidth\n• Mobile users especially affected\n\n✅ Solutions:\n• Use image compression tools (TinyPNG, ImageOptim)\n• Set quality to 80-85% for JPEG\n• Use appropriate image dimensions\n• Consider WebP format for better compression\n\n💡 Why this matters: Large images are often the #1 cause of slow page loads. Users abandon sites that take over 3 seconds to load.`
    });
  }
  
  // 5. Missing Lazy Loading (performance optimization)
  if (nonLazyImages.length > 3) { // Only report if significant number
    issues.push({
      rule_key: 'PERF_RES_05_IMAGE_LAZY_LOADING',
      severity: 'moderate',
      location_path: 'Performance Optimization',
      code_snippet: nonLazyImages.slice(0, 3).map(img => img.element).join('\n\n'),
      message: `${nonLazyImages.length} images below the fold should use lazy loading`,
      fix_suggestion: `Implement lazy loading for better initial page performance:\n\n❌ Current:\n<img src="below-fold-image.jpg" alt="Description">\n\n✅ Optimized:\n<img src="below-fold-image.jpg" loading="lazy" alt="Description">\n\n💡 Benefits:\n• Faster initial page load\n• Reduced bandwidth usage\n• Better Core Web Vitals scores\n• Images load as user scrolls down\n\nNote: Don't lazy load above-the-fold images as it can hurt LCP.`
    });
  }
  
  return issues;
}

export const imageOptimizationWorker = new Worker('performance-image-optimization', async (job: Job<ImageOptimizationJobData>) => {
  const { analysisId, workspaceId, assetPath, metadata } = job.data;
  logger.info('Starting Image Optimization analysis', { analysisId, assetPath });

  let moduleJobInfo: { moduleId: string; jobId: string } | null = null;

  try {
    moduleJobInfo = await getPerformanceModuleAndJobId(analysisId);
    if (!moduleJobInfo) throw new AppError('Failed to get Performance job info', 500);

    await updateImageJobStatus(analysisId, moduleJobInfo.moduleId, 'running');

    const finalUrl = metadata?.finalUrl || metadata?.url || '';
    if (!finalUrl) {
      throw new AppError('No URL provided for image analysis', 400);
    }

    // Get HTML content from storage
    const htmlPath = `${assetPath}/html/index.html`;
    const html = await downloadTextFromStorage(htmlPath);
    
    if (!html) {
      logger.warn('No HTML content found, skipping image analysis', { htmlPath });
      await updateImageJobStatus(analysisId, moduleJobInfo.moduleId, 'completed');
      return { success: true, issues: 0, message: 'No HTML content available for image analysis' };
    }

    logger.info('Extracting images from HTML', { url: finalUrl });
    
    // Extract all images from HTML
    const images = await extractImagesFromHTML(html, finalUrl);
    
    if (images.length === 0) {
      logger.info('No images found in HTML', { url: finalUrl });
      await updateImageJobStatus(analysisId, moduleJobInfo.moduleId, 'completed');
      return { success: true, issues: 0, message: 'No images found on page' };
    }

    logger.info('Analyzing image optimization opportunities', { 
      imageCount: images.length,
      url: finalUrl 
    });

    // Analyze image optimization opportunities
    const issues = await analyzeImageOptimization(images, assetPath);

    // Insert image optimization issues
    if (issues.length > 0) {
      let insertedCount = 0;
      let skippedCount = 0;
      
      for (const issue of issues) {
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
          logger.error('Failed to insert Image Optimization issue', { error, ruleKey: issue.rule_key });
          skippedCount++;
        } else {
          insertedCount++;
        }
      }
      
      logger.info('Image optimization issue insertion completed', { 
        analysisId,
        totalIssues: issues.length,
        inserted: insertedCount,
        skipped: skippedCount
      });
    }

    await updateImageJobStatus(analysisId, moduleJobInfo.moduleId, 'completed');
    await checkAndUpdateAnalysisCompletion(analysisId);

    logger.info('Image Optimization analysis completed', { 
      analysisId, 
      issueCount: issues.length,
      imagesAnalyzed: images.length
    });
    
    return { 
      success: true, 
      issues: issues.length,
      imagesAnalyzed: images.length,
      optimizationOpportunities: issues.map(issue => ({
        type: issue.rule_key,
        severity: issue.severity,
        potentialSavings: issue.savings_bytes
      }))
    };
    
  } catch (error: any) {
    logger.error('Image Optimization analysis failed', { error: error?.message || 'Unknown error', analysisId });
    if (moduleJobInfo) {
      await updateImageJobStatus(analysisId, moduleJobInfo.moduleId, 'failed', error?.message || 'Unknown error');
      await checkAndUpdateAnalysisCompletion(analysisId);
    }
    throw error;
  }
}, {
  connection: {
    host: config.redis.host,
    port: config.redis.port,
  },
  concurrency: 3, // Reasonable concurrency for image processing
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing performance-image worker...');
  await imageOptimizationWorker.close();
});