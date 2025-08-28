/**
 * Custom Rule Detectors
 * 
 * This file contains custom detection logic for accessibility rules
 * that are not covered by axe-core's built-in rule set.
 * These detectors supplement axe-core to achieve 100% rule coverage.
 */

import { Page } from 'puppeteer';

export interface CustomViolation {
  ruleKey: string;
  severity: 'minor' | 'moderate' | 'serious' | 'critical';
  message: string;
  elements: Array<{
    selector: string;
    html: string;
    context?: string;
  }>;
}

/**
 * Detect form-related custom violations
 */
export async function detectCustomFormViolations(page: Page): Promise<CustomViolation[]> {
  const violations: CustomViolation[] = [];

  // Detect required field indication (ACC_FRM_05_REQUIRED_INDICATION)
  const requiredFieldViolations = await page.evaluate(() => {
    const violations: any[] = [];
    const requiredInputs = document.querySelectorAll('input[required], select[required], textarea[required]');
    
    requiredInputs.forEach(input => {
      const label = document.querySelector(`label[for="${input.id}"]`);
      const hasVisualIndicator = label && (
        label.textContent?.includes('*') ||
        label.textContent?.toLowerCase().includes('required') ||
        label.querySelector('.required') !== null
      );
      
      const hasAriaRequired = input.getAttribute('aria-required') === 'true';
      
      if (!hasVisualIndicator && !hasAriaRequired) {
        violations.push({
          selector: input.id ? `#${input.id}` : input.tagName.toLowerCase(),
          html: (input as HTMLElement).outerHTML.substring(0, 200),
          context: 'Required field without visual or ARIA indication'
        });
      }
    });
    
    return violations;
  });

  if (requiredFieldViolations.length > 0) {
    violations.push({
      ruleKey: 'ACC_FRM_05_REQUIRED_INDICATION',
      severity: 'serious',
      message: 'Required fields must be clearly indicated visually and programmatically',
      elements: requiredFieldViolations
    });
  }

  // Detect form error identification (ACC_FRM_06_ERROR_IDENTIFICATION)
  const errorIdentificationViolations = await page.evaluate(() => {
    const violations: any[] = [];
    const errorMessages = document.querySelectorAll('.error, .error-message, [role="alert"], [aria-invalid="true"]');
    
    errorMessages.forEach(error => {
      const associatedInput = error.getAttribute('aria-describedby') || 
                             error.getAttribute('for') ||
                             error.closest('label')?.getAttribute('for');
      
      if (!associatedInput) {
        violations.push({
          selector: error.id || error.className,
          html: (error as HTMLElement).outerHTML.substring(0, 200),
          context: 'Error message not associated with input field'
        });
      }
    });
    
    return violations;
  });

  if (errorIdentificationViolations.length > 0) {
    violations.push({
      ruleKey: 'ACC_FRM_06_ERROR_IDENTIFICATION',
      severity: 'critical',
      message: 'Form validation errors must be clearly associated with their inputs',
      elements: errorIdentificationViolations
    });
  }

  // Detect missing autocomplete attributes (ACC_FRM_13_AUTOCOMPLETE_MISSING)
  const autocompleteViolations = await page.evaluate(() => {
    const violations: any[] = [];
    const personalDataInputs = document.querySelectorAll(
      'input[type="text"], input[type="email"], input[type="tel"], input[type="password"]'
    );
    
    personalDataInputs.forEach(input => {
      const name = (input as HTMLInputElement).name?.toLowerCase() || '';
      const id = (input as HTMLInputElement).id?.toLowerCase() || '';
      const label = document.querySelector(`label[for="${(input as HTMLInputElement).id}"]`)?.textContent?.toLowerCase() || '';
      
      // Check if this looks like a personal data field
      const personalDataPatterns = [
        'name', 'email', 'phone', 'tel', 'address', 'city', 'state', 'zip', 
        'postal', 'country', 'username', 'password', 'credit', 'card'
      ];
      
      const isPersonalData = personalDataPatterns.some(pattern => 
        name.includes(pattern) || id.includes(pattern) || label.includes(pattern)
      );
      
      if (isPersonalData && !input.getAttribute('autocomplete')) {
        violations.push({
          selector: (input as HTMLInputElement).id ? `#${(input as HTMLInputElement).id}` : input.tagName.toLowerCase(),
          html: (input as HTMLElement).outerHTML.substring(0, 200),
          context: `Personal data field "${name || id}" missing autocomplete attribute`
        });
      }
    });
    
    return violations;
  });

  if (autocompleteViolations.length > 0) {
    violations.push({
      ruleKey: 'ACC_FRM_13_AUTOCOMPLETE_MISSING',
      severity: 'minor',
      message: 'Input fields for personal data should include appropriate autocomplete attributes',
      elements: autocompleteViolations
    });
  }

  return violations;
}

/**
 * Detect media-related custom violations
 */
export async function detectCustomMediaViolations(page: Page): Promise<CustomViolation[]> {
  const violations: CustomViolation[] = [];

  // Detect video caption violations (ACC_MED_01_VIDEO_CAPTIONS)
  const videoCaptionViolations = await page.evaluate(() => {
    const violations: any[] = [];
    const videos = document.querySelectorAll('video');
    
    videos.forEach(video => {
      const hasTrack = video.querySelector('track[kind="captions"], track[kind="subtitles"]');
      const hasAriaLabel = video.getAttribute('aria-label')?.toLowerCase().includes('caption');
      
      if (!hasTrack && !hasAriaLabel) {
        violations.push({
          selector: video.id ? `#${video.id}` : 'video',
          html: video.outerHTML.substring(0, 200),
          context: 'Video element without caption track'
        });
      }
    });
    
    return violations;
  });

  if (videoCaptionViolations.length > 0) {
    violations.push({
      ruleKey: 'ACC_MED_01_VIDEO_CAPTIONS',
      severity: 'critical',
      message: 'Videos must have captions for deaf and hard of hearing users',
      elements: videoCaptionViolations
    });
  }

  // Detect audio transcript violations (ACC_MED_02_AUDIO_TRANSCRIPT)
  const audioTranscriptViolations = await page.evaluate(() => {
    const violations: any[] = [];
    const audioElements = document.querySelectorAll('audio');
    
    audioElements.forEach(audio => {
      // Check for transcript link or aria-describedby
      const parentContainer = audio.closest('div, section, article');
      const hasTranscriptLink = parentContainer?.textContent?.toLowerCase().includes('transcript');
      const hasAriaDescribedby = audio.getAttribute('aria-describedby');
      
      if (!hasTranscriptLink && !hasAriaDescribedby) {
        violations.push({
          selector: audio.id ? `#${audio.id}` : 'audio',
          html: audio.outerHTML.substring(0, 200),
          context: 'Audio element without transcript reference'
        });
      }
    });
    
    return violations;
  });

  if (audioTranscriptViolations.length > 0) {
    violations.push({
      ruleKey: 'ACC_MED_02_AUDIO_TRANSCRIPT',
      severity: 'critical',
      message: 'Audio content must have text transcripts available',
      elements: audioTranscriptViolations
    });
  }

  // Detect decorative image violations (ACC_IMG_02_ALT_TEXT_DECORATIVE)
  const decorativeImageViolations = await page.evaluate(() => {
    const violations: any[] = [];
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
      const alt = img.getAttribute('alt');
      const src = img.getAttribute('src') || '';
      
      // Check if image appears decorative based on common patterns
      const decorativePatterns = [
        'spacer', 'divider', 'separator', 'bullet', 'icon-',
        'decoration', 'ornament', 'background'
      ];
      
      const isLikelyDecorative = decorativePatterns.some(pattern => 
        src.toLowerCase().includes(pattern) || 
        img.className.toLowerCase().includes(pattern)
      );
      
      if (isLikelyDecorative && alt && alt.length > 0) {
        violations.push({
          selector: img.id ? `#${img.id}` : 'img',
          html: img.outerHTML.substring(0, 200),
          context: `Likely decorative image with non-empty alt text: "${alt}"`
        });
      }
    });
    
    return violations;
  });

  if (decorativeImageViolations.length > 0) {
    violations.push({
      ruleKey: 'ACC_IMG_02_ALT_TEXT_DECORATIVE',
      severity: 'serious',
      message: 'Decorative images should have empty alt attributes (alt="")',
      elements: decorativeImageViolations
    });
  }

  return violations;
}

/**
 * Detect color and visual design custom violations
 */
export async function detectCustomColorViolations(page: Page): Promise<CustomViolation[]> {
  const violations: CustomViolation[] = [];

  // Detect color-only meaning violations (ACC_CLR_04_COLOR_ONLY_MEANING)
  const colorOnlyViolations = await page.evaluate(() => {
    const violations: any[] = [];
    
    // Check for common color-only patterns in text
    const colorPatterns = [
      /\b(red|green|blue|yellow|orange|purple|pink)\b/gi,
      /\bcolor(?:ed|s)?\b/gi,
      /\bhighlight(?:ed)?\sin\s\w+/gi
    ];
    
    const textElements = document.querySelectorAll('p, span, div, li');
    textElements.forEach(element => {
      const text = element.textContent || '';
      
      colorPatterns.forEach(pattern => {
        if (pattern.test(text)) {
          // Check if there's additional context beyond color
          const hasIcon = element.querySelector('svg, i, .icon');
          const hasAriaLabel = element.getAttribute('aria-label');
          
          if (!hasIcon && !hasAriaLabel) {
            violations.push({
              selector: element.id ? `#${element.id}` : element.tagName.toLowerCase(),
              html: (element as HTMLElement).outerHTML.substring(0, 200),
              context: `Text appears to convey information using color only: "${text.substring(0, 100)}"`
            });
          }
        }
      });
    });
    
    return violations;
  });

  if (colorOnlyViolations.length > 0) {
    violations.push({
      ruleKey: 'ACC_CLR_04_COLOR_ONLY_MEANING',
      severity: 'serious',
      message: 'Information must not be conveyed using color alone',
      elements: colorOnlyViolations
    });
  }

  // Detect non-text contrast violations (ACC_CLR_03_NON_TEXT_CONTRAST)
  const nonTextContrastViolations = await page.evaluate(() => {
    const violations: any[] = [];
    
    // Check interactive elements for sufficient contrast
    const interactiveElements = document.querySelectorAll(
      'button, input:not([type="hidden"]), select, textarea, [role="button"], [role="checkbox"], [role="radio"]'
    );
    
    interactiveElements.forEach(element => {
      const computedStyle = window.getComputedStyle(element);
      const borderColor = computedStyle.borderColor;
      const backgroundColor = computedStyle.backgroundColor;
      
      // Simple check for very light borders/backgrounds
      if (borderColor === 'rgb(255, 255, 255)' || backgroundColor === 'rgba(0, 0, 0, 0)') {
        violations.push({
          selector: (element as HTMLElement).id ? `#${(element as HTMLElement).id}` : element.tagName.toLowerCase(),
          html: (element as HTMLElement).outerHTML.substring(0, 200),
          context: 'Interactive element may have insufficient visual contrast'
        });
      }
    });
    
    return violations;
  });

  if (nonTextContrastViolations.length > 0) {
    violations.push({
      ruleKey: 'ACC_CLR_03_NON_TEXT_CONTRAST',
      severity: 'serious',
      message: 'UI components must have sufficient contrast (3:1 ratio minimum)',
      elements: nonTextContrastViolations
    });
  }

  return violations;
}

/**
 * Combine all custom detectors
 */
export async function detectAllCustomViolations(page: Page): Promise<CustomViolation[]> {
  const [formViolations, mediaViolations, colorViolations] = await Promise.all([
    detectCustomFormViolations(page),
    detectCustomMediaViolations(page),
    detectCustomColorViolations(page)
  ]);

  return [...formViolations, ...mediaViolations, ...colorViolations];
}