import { Job, Worker } from 'bullmq';
import puppeteer, { Browser, Page } from 'puppeteer';
import { config } from '@/config';
import { createLogger } from '@/config/logger';
import { supabase } from '@/config/supabase';
import { AppError } from '@/types';
import { checkAndUpdateAnalysisCompletion } from '@/core/workers/master.worker';

const logger = createLogger('media-worker');

interface MediaJobData {
  analysisId: string;
  workspaceId: string;
  websiteId: string;
  userId: string;
  assetPath: string;
  metadata: any;
}

interface MediaElement {
  type: 'video' | 'audio' | 'iframe';
  src?: string;
  element: string;
  hasCaptions?: boolean;
  hasSubtitles?: boolean;
  hasControls?: boolean;
  hasTranscript?: boolean;
  title?: string;
  alt?: string;
}

interface MediaViolation {
  ruleKey: string;
  severity: 'minor' | 'moderate' | 'serious' | 'critical';
  message: string;
  element: string;
  fixSuggestion: string;
}

// Media worker coordinates with other accessibility workers for job completion
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
    await checkAndUpdateAnalysisCompletion(analysisId, `media-worker-${status}`);
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

async function detectMediaElements(page: Page): Promise<MediaElement[]> {
  return await page.evaluate(() => {
    const mediaElements: MediaElement[] = [];
    
    // Detect video elements
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      const tracks = video.querySelectorAll('track');
      const captionTracks = Array.from(tracks).filter(track => 
        track.getAttribute('kind') === 'captions' || track.getAttribute('kind') === 'subtitles'
      );
      
      mediaElements.push({
        type: 'video',
        src: video.src || video.currentSrc,
        element: video.outerHTML,
        hasControls: video.hasAttribute('controls'),
        hasCaptions: captionTracks.some(track => track.getAttribute('kind') === 'captions'),
        hasSubtitles: captionTracks.some(track => track.getAttribute('kind') === 'subtitles')
      });
    });
    
    // Detect audio elements
    const audios = document.querySelectorAll('audio');
    audios.forEach(audio => {
      mediaElements.push({
        type: 'audio',
        src: audio.src || audio.currentSrc,
        element: audio.outerHTML,
        hasControls: audio.hasAttribute('controls'),
        hasTranscript: false // Will be detected separately
      });
    });
    
    // Detect embedded video (YouTube, Vimeo, etc.)
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      const src = iframe.src || '';
      const isVideoEmbed = src.includes('youtube.com') || 
                          src.includes('youtu.be') || 
                          src.includes('vimeo.com') || 
                          src.includes('dailymotion.com') ||
                          src.includes('twitch.tv');
      
      if (isVideoEmbed) {
        mediaElements.push({
          type: 'iframe',
          src: iframe.src,
          element: iframe.outerHTML,
          title: iframe.title || ''
        });
      }
    });
    
    return mediaElements;
  });
}

async function detectTranscriptsNearAudio(page: Page, audioElement: MediaElement): Promise<boolean> {
  // Look for transcript links or text near audio elements
  return await page.evaluate((audioHtml) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = audioHtml;
    const audio = tempDiv.querySelector('audio');
    
    if (!audio) return false;
    
    // Find the actual audio element in the document
    const allAudios = document.querySelectorAll('audio');
    let targetAudio = null;
    
    for (const docAudio of allAudios) {
      if (docAudio.outerHTML === audioHtml) {
        targetAudio = docAudio;
        break;
      }
    }
    
    if (!targetAudio) return false;
    
    // Look for transcript indicators within 200px of the audio element
    const audioRect = targetAudio.getBoundingClientRect();
    const transcriptKeywords = [
      'transcript', 'text version', 'audio description', 
      'read text', 'text alternative', 'written version'
    ];
    
    const allElements = document.querySelectorAll('a, p, div, span');
    
    for (const element of allElements) {
      const elementRect = element.getBoundingClientRect();
      const distance = Math.sqrt(
        Math.pow(elementRect.left - audioRect.left, 2) + 
        Math.pow(elementRect.top - audioRect.top, 2)
      );
      
      if (distance < 200) {
        const text = element.textContent?.toLowerCase() || '';
        if (transcriptKeywords.some(keyword => text.includes(keyword))) {
          return true;
        }
      }
    }
    
    return false;
  }, audioElement.element);
}

async function analyzeEmbeddedVideoAccessibility(element: MediaElement): Promise<MediaViolation[]> {
  const violations: MediaViolation[] = [];
  
  // Check for iframe title
  if (!element.title || element.title.trim().length === 0) {
    violations.push({
      ruleKey: 'ACC_MED_01_VIDEO_CAPTIONS', // Reusing closest rule
      severity: 'serious',
      message: 'Embedded video iframe missing descriptive title attribute',
      element: element.element,
      fixSuggestion: 'Add a descriptive title attribute to the iframe that explains the video content. Example: <iframe title="Product demonstration video" src="..."></iframe>'
    });
  }
  
  // For YouTube videos, we can check if captions are likely available
  if (element.src?.includes('youtube.com') || element.src?.includes('youtu.be')) {
    // YouTube videos should be assumed to need manual caption verification
    // We can't automatically detect if captions are enabled from the embed code
    violations.push({
      ruleKey: 'ACC_MED_01_VIDEO_CAPTIONS',
      severity: 'moderate',
      message: 'YouTube video embed detected - verify captions are available and enabled',
      element: element.element,
      fixSuggestion: 'Ensure captions are available for the YouTube video. Add cc_load_policy=1 to the embed URL to enable captions by default. Example: https://youtube.com/embed/VIDEO_ID?cc_load_policy=1'
    });
  }
  
  return violations;
}

async function performMediaAnalysis(page: Page): Promise<MediaViolation[]> {
  const violations: MediaViolation[] = [];
  
  // Detect all media elements on the page
  const mediaElements = await detectMediaElements(page);
  
  logger.info('Media elements detected', {
    totalElements: mediaElements.length,
    videos: mediaElements.filter(e => e.type === 'video').length,
    audios: mediaElements.filter(e => e.type === 'audio').length,
    embeds: mediaElements.filter(e => e.type === 'iframe').length
  });
  
  // Analyze each media element
  for (const element of mediaElements) {
    if (element.type === 'video') {
      // Check for video captions
      if (!element.hasCaptions && !element.hasSubtitles) {
        violations.push({
          ruleKey: 'ACC_MED_01_VIDEO_CAPTIONS',
          severity: 'critical',
          message: 'Video element missing captions or subtitles for deaf and hard of hearing users',
          element: element.element,
          fixSuggestion: 'Add caption or subtitle tracks to the video element. Use <track kind="captions" src="captions.vtt" srclang="en" label="English Captions"> or <track kind="subtitles" src="subtitles.vtt" srclang="en" label="English Subtitles">. Captions include sound effects and music, while subtitles only include dialogue.'
        });
      }
      
      // Check for video controls
      if (!element.hasControls) {
        violations.push({
          ruleKey: 'ACC_MED_01_VIDEO_CAPTIONS', // Reusing closest rule for controls
          severity: 'serious',
          message: 'Video element missing controls attribute, preventing user control of playback',
          element: element.element,
          fixSuggestion: 'Add the controls attribute to the video element: <video controls>. This allows users to play, pause, adjust volume, and access captions.'
        });
      }
    } 
    else if (element.type === 'audio') {
      // Check for audio transcripts
      const hasNearbyTranscript = await detectTranscriptsNearAudio(page, element);
      
      if (!hasNearbyTranscript) {
        violations.push({
          ruleKey: 'ACC_MED_02_AUDIO_TRANSCRIPT',
          severity: 'critical',
          message: 'Audio content missing text transcript for deaf and hard of hearing users',
          element: element.element,
          fixSuggestion: 'Provide a text transcript of the audio content. Link to or display the transcript near the audio element. The transcript should include all spoken content, sound effects, and music descriptions.'
        });
      }
      
      // Check for audio controls
      if (!element.hasControls) {
        violations.push({
          ruleKey: 'ACC_MED_02_AUDIO_TRANSCRIPT', // Reusing closest rule for controls
          severity: 'serious',
          message: 'Audio element missing controls attribute, preventing user control of playback',
          element: element.element,
          fixSuggestion: 'Add the controls attribute to the audio element: <audio controls>. This allows users to play, pause, and adjust volume.'
        });
      }
    }
    else if (element.type === 'iframe') {
      // Analyze embedded videos
      const embedViolations = await analyzeEmbeddedVideoAccessibility(element);
      violations.push(...embedViolations);
    }
  }
  
  // Additional check: Look for decorative images that might actually be complex images needing descriptions
  const complexImageViolations = await page.evaluate(() => {
    const violations: MediaViolation[] = [];
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
      const alt = img.getAttribute('alt') || '';
      const src = img.src || '';
      const hasLongDesc = img.hasAttribute('longdesc') || 
                         document.querySelector(`[aria-describedby="${img.id}"]`) !== null;
      
      // Detect potentially complex images (charts, graphs, infographics)
      const complexImageIndicators = [
        'chart', 'graph', 'diagram', 'infographic', 'flowchart', 
        'timeline', 'map', 'plot', 'data', 'statistics'
      ];
      
      const isLikelyComplex = complexImageIndicators.some(indicator => 
        src.toLowerCase().includes(indicator) || 
        alt.toLowerCase().includes(indicator) ||
        img.className.toLowerCase().includes(indicator)
      );
      
      if (isLikelyComplex && !hasLongDesc && alt.length < 50) {
        violations.push({
          ruleKey: 'ACC_IMG_04_COMPLEX_IMAGE_DESC',
          severity: 'serious',
          message: 'Complex image (chart, graph, or diagram) may need detailed description beyond alt text',
          element: img.outerHTML.substring(0, 200),
          fixSuggestion: 'Complex images like charts or graphs should have detailed descriptions in addition to alt text. Use longdesc attribute, aria-describedby, or provide description in surrounding text. The description should convey the same information as the visual.'
        });
      }
    });
    
    return violations;
  });
  
  violations.push(...complexImageViolations);
  
  return violations;
}

async function processMediaAnalysis(job: Job<MediaJobData>) {
  const { analysisId, workspaceId, assetPath } = job.data;
  
  logger.info('Starting media accessibility analysis', { 
    analysisId, 
    workspaceId, 
    assetPath 
  });

  const moduleJobInfo = await getModuleAndJobId(analysisId);
  if (!moduleJobInfo) {
    throw new AppError('Failed to get module and job information', 500, 'MODULE_JOB_ERROR');
  }

  // Update job status to running
  await updateJobStatusCoordinated(analysisId, moduleJobInfo.moduleId, 'media-worker', 'running');

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
    
    // Set content and wait for media elements to load
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
    
    // Give media elements time to initialize
    await page.waitForTimeout(2000);
    
    // Perform media accessibility analysis
    const violations = await performMediaAnalysis(page);
    
    logger.info('Media analysis complete', {
      violationsFound: violations.length,
      analysisId
    });

    // Store violations in database
    const issuePromises = [];
    for (const violation of violations) {
      const ruleId = await getRuleId(violation.ruleKey);
      
      if (!ruleId) {
        logger.warn('Database rule not found for media violation', { ruleKey: violation.ruleKey });
        continue;
      }

      const issue = {
        analysis_job_id: moduleJobInfo.jobId,
        rule_id: ruleId,
        severity: violation.severity,
        location_path: 'Media element',
        code_snippet: violation.element,
        message: violation.message,
        fix_suggestion: violation.fixSuggestion
      };

      issuePromises.push(
        supabase
          .from('accessibility_issues')
          .insert([issue])
          .then(({ error }) => {
            if (error) {
              logger.error('Failed to insert media accessibility issue', { 
                error, 
                ruleKey: violation.ruleKey 
              });
            }
          })
      );
    }

    // Wait for all issues to be inserted
    await Promise.all(issuePromises);

    // Update job status to completed
    await updateJobStatusCoordinated(analysisId, moduleJobInfo.moduleId, 'media-worker', 'completed');
    
    logger.info('Media analysis job completed successfully', { analysisId });

  } catch (error) {
    logger.error('Media analysis failed', { error, analysisId });
    
    if (moduleJobInfo) {
      await updateJobStatusCoordinated(
        analysisId, 
        moduleJobInfo.moduleId, 
        'media-worker', 
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
const mediaWorker = new Worker('accessibility-media', processMediaAnalysis, {
  connection: config.redis,
  concurrency: 5,
  limiter: {
    max: 10,
    duration: 10000,
  },
});

mediaWorker.on('completed', (job) => {
  logger.info('Media analysis job completed', { 
    jobId: job.id, 
    analysisId: job.data?.analysisId 
  });
});

mediaWorker.on('failed', (job, err) => {
  logger.error('Media analysis job failed', { 
    jobId: job?.id, 
    analysisId: job?.data?.analysisId, 
    error: err.message 
  });
});

mediaWorker.on('error', (err) => {
  logger.error('Media worker error', { error: err.message });
});

export { mediaWorker };