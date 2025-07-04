import * as cheerio from 'cheerio';
import { ScanResult } from './websiteScanner';

export interface AccessibilityIssue {
  category: 'images' | 'headings' | 'forms' | 'color' | 'navigation' | 'aria' | 'structure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  wcagLevel: 'A' | 'AA' | 'AAA';
  wcagCriteria: string;
  element?: string;
  message: string;
  suggestion: string;
  count?: number;
}

export interface AccessibilityAnalysisResult {
  score: number; // 0-100
  level: 'A' | 'AA' | 'AAA' | 'Non-compliant';
  issues: AccessibilityIssue[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  recommendations: string[];
  wcagCompliance: {
    A: { passed: number; failed: number; percentage: number };
    AA: { passed: number; failed: number; percentage: number };
    AAA: { passed: number; failed: number; percentage: number };
  };
}

export class AccessibilityAnalyzer {
  async analyze(scanResult: ScanResult, htmlContent?: string): Promise<AccessibilityAnalysisResult> {
    const issues: AccessibilityIssue[] = [];

    // Analyze images
    this.analyzeImages(scanResult, issues);

    // Analyze headings
    this.analyzeHeadings(scanResult, issues);

    // Analyze forms
    this.analyzeForms(scanResult, issues);

    // Analyze page structure
    this.analyzePageStructure(scanResult, issues);

    // If HTML content is provided, do deeper analysis
    if (htmlContent) {
      const $ = cheerio.load(htmlContent);
      this.analyzeColorContrast($, issues);
      this.analyzeAriaUsage($, issues);
      this.analyzeKeyboardNavigation($, issues);
    }

    // Calculate scores and compliance
    const result = this.calculateResults(issues);

    return result;
  }

  private analyzeImages(scanResult: ScanResult, issues: AccessibilityIssue[]): void {
    if (!scanResult.images) return;

    const { images } = scanResult;

    // Missing alt text (WCAG 1.1.1 - A)
    if (images.withoutAlt > 0) {
      issues.push({
        category: 'images',
        severity: images.withoutAlt > 5 ? 'critical' : 'high',
        wcagLevel: 'A',
        wcagCriteria: '1.1.1 Non-text Content',
        message: `${images.withoutAlt} images missing alt text`,
        suggestion: 'Add descriptive alt text to all images. Use empty alt="" for decorative images.',
        count: images.withoutAlt
      });
    }

    // Check for potentially decorative images with alt text
    const potentiallyDecorative = images.details.filter(img => 
      img.hasAlt && img.alt && (
        img.alt.toLowerCase().includes('image') ||
        img.alt.toLowerCase().includes('photo') ||
        img.alt.toLowerCase().includes('picture')
      )
    );

    if (potentiallyDecorative.length > 0) {
      issues.push({
        category: 'images',
        severity: 'medium',
        wcagLevel: 'A',
        wcagCriteria: '1.1.1 Non-text Content',
        message: `${potentiallyDecorative.length} images with generic alt text`,
        suggestion: 'Use more descriptive alt text that explains the content and function of the image.',
        count: potentiallyDecorative.length
      });
    }
  }

  private analyzeHeadings(scanResult: ScanResult, issues: AccessibilityIssue[]): void {
    if (!scanResult.headings) return;

    const { headings } = scanResult;

    // Missing H1 (WCAG 1.3.1 - A)
    if (headings.h1.length === 0) {
      issues.push({
        category: 'headings',
        severity: 'high',
        wcagLevel: 'A',
        wcagCriteria: '1.3.1 Info and Relationships',
        message: 'Page is missing an H1 heading',
        suggestion: 'Add a descriptive H1 heading that clearly identifies the main content of the page.'
      });
    }

    // Multiple H1s (best practice)
    if (headings.h1.length > 1) {
      issues.push({
        category: 'headings',
        severity: 'medium',
        wcagLevel: 'A',
        wcagCriteria: '1.3.1 Info and Relationships',
        message: `Multiple H1 headings found (${headings.h1.length})`,
        suggestion: 'Use only one H1 per page to clearly identify the main content.',
        count: headings.h1.length
      });
    }

    // Check heading hierarchy
    const headingSequence = this.getHeadingSequence(headings);
    const hierarchyIssues = this.checkHeadingHierarchy(headingSequence);
    
    if (hierarchyIssues.length > 0) {
      issues.push({
        category: 'headings',
        severity: 'medium',
        wcagLevel: 'A',
        wcagCriteria: '1.3.1 Info and Relationships',
        message: 'Heading hierarchy issues detected',
        suggestion: 'Ensure headings follow proper hierarchy (H1 → H2 → H3) without skipping levels.',
        count: hierarchyIssues.length
      });
    }

    // Empty headings
    const emptyHeadings = Object.values(headings).flat().filter(h => !h.trim());
    if (emptyHeadings.length > 0) {
      issues.push({
        category: 'headings',
        severity: 'high',
        wcagLevel: 'A',
        wcagCriteria: '1.3.1 Info and Relationships',
        message: `${emptyHeadings.length} empty headings found`,
        suggestion: 'Remove empty headings or add descriptive text content.',
        count: emptyHeadings.length
      });
    }
  }

  private analyzeForms(scanResult: ScanResult, issues: AccessibilityIssue[]): void {
    if (!scanResult.forms || scanResult.forms.total === 0) return;

    const { forms } = scanResult;

    // Forms without labels (WCAG 1.3.1 - A, 3.3.2 - A)
    if (forms.withoutLabels > 0) {
      issues.push({
        category: 'forms',
        severity: 'critical',
        wcagLevel: 'A',
        wcagCriteria: '1.3.1 Info and Relationships, 3.3.2 Labels or Instructions',
        message: `${forms.withoutLabels} forms missing proper labels`,
        suggestion: 'Associate labels with form controls using <label for="id"> or aria-label attributes.',
        count: forms.withoutLabels
      });
    }

    // Forms without fieldsets (for complex forms)
    const complexForms = forms.details.filter(form => form.inputs > 5);
    const complexFormsWithoutFieldsets = complexForms.filter(form => !form.hasFieldset);
    
    if (complexFormsWithoutFieldsets.length > 0) {
      issues.push({
        category: 'forms',
        severity: 'medium',
        wcagLevel: 'A',
        wcagCriteria: '1.3.1 Info and Relationships',
        message: `${complexFormsWithoutFieldsets.length} complex forms without fieldsets`,
        suggestion: 'Use <fieldset> and <legend> to group related form controls in complex forms.',
        count: complexFormsWithoutFieldsets.length
      });
    }
  }

  private analyzePageStructure(scanResult: ScanResult, issues: AccessibilityIssue[]): void {
    // Missing title (WCAG 2.4.2 - A)
    if (!scanResult.title || scanResult.title.trim().length === 0) {
      issues.push({
        category: 'structure',
        severity: 'critical',
        wcagLevel: 'A',
        wcagCriteria: '2.4.2 Page Titled',
        message: 'Page is missing a title',
        suggestion: 'Add a descriptive <title> element that identifies the page content.'
      });
    }

    // Title too short or generic
    if (scanResult.title && scanResult.title.trim().length < 10) {
      issues.push({
        category: 'structure',
        severity: 'medium',
        wcagLevel: 'A',
        wcagCriteria: '2.4.2 Page Titled',
        message: 'Page title is too short or generic',
        suggestion: 'Use a descriptive title that clearly identifies the page content and purpose.'
      });
    }

    // Missing meta description (not WCAG but good practice)
    if (!scanResult.description || scanResult.description.trim().length === 0) {
      issues.push({
        category: 'structure',
        severity: 'low',
        wcagLevel: 'AA',
        wcagCriteria: 'Best Practice',
        message: 'Page is missing a meta description',
        suggestion: 'Add a meta description to help users understand page content.'
      });
    }
  }

  private analyzeColorContrast($: cheerio.CheerioAPI, issues: AccessibilityIssue[]): void {
    // This is a simplified check - in a real implementation, you'd need to:
    // 1. Extract computed styles
    // 2. Calculate color contrast ratios
    // 3. Check against WCAG standards (4.5:1 for AA, 7:1 for AAA)
    
    // For now, we'll add a generic recommendation
    issues.push({
      category: 'color',
      severity: 'medium',
      wcagLevel: 'AA',
      wcagCriteria: '1.4.3 Contrast (Minimum)',
      message: 'Color contrast requires manual verification',
      suggestion: 'Ensure text has sufficient contrast ratio (4.5:1 for normal text, 3:1 for large text).'
    });
  }

  private analyzeAriaUsage($: cheerio.CheerioAPI, issues: AccessibilityIssue[]): void {
    // Check for ARIA landmarks
    const landmarks = $('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], main, nav, header, footer').length;
    
    if (landmarks === 0) {
      issues.push({
        category: 'aria',
        severity: 'medium',
        wcagLevel: 'A',
        wcagCriteria: '1.3.1 Info and Relationships',
        message: 'No ARIA landmarks found',
        suggestion: 'Add ARIA landmarks (main, navigation, banner, contentinfo) to improve navigation for screen readers.'
      });
    }

    // Check for ARIA labels without corresponding elements
    const ariaElements = $('[aria-label], [aria-labelledby], [aria-describedby]').length;
    if (ariaElements > 0) {
      // This would need more sophisticated checking in a real implementation
      issues.push({
        category: 'aria',
        severity: 'low',
        wcagLevel: 'A',
        wcagCriteria: '4.1.2 Name, Role, Value',
        message: 'ARIA attributes found - verify proper implementation',
        suggestion: 'Ensure ARIA attributes are properly implemented and provide meaningful information.',
        count: ariaElements
      });
    }
  }

  private analyzeKeyboardNavigation($: cheerio.CheerioAPI, issues: AccessibilityIssue[]): void {
    // Check for interactive elements without proper keyboard support
    const interactiveElements = $('a, button, input, textarea, select').length;
    const elementsWithTabIndex = $('[tabindex]').length;
    
    // Check for positive tabindex values (anti-pattern)
    const positiveTabIndex = $('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])').length;
    
    if (positiveTabIndex > 0) {
      issues.push({
        category: 'navigation',
        severity: 'medium',
        wcagLevel: 'A',
        wcagCriteria: '2.4.3 Focus Order',
        message: `${positiveTabIndex} elements with positive tabindex values`,
        suggestion: 'Avoid positive tabindex values. Use tabindex="0" for focusable elements and tabindex="-1" to remove from tab order.',
        count: positiveTabIndex
      });
    }

    // Generic keyboard navigation recommendation
    if (interactiveElements > 0) {
      issues.push({
        category: 'navigation',
        severity: 'low',
        wcagLevel: 'A',
        wcagCriteria: '2.1.1 Keyboard',
        message: 'Keyboard navigation requires manual testing',
        suggestion: 'Ensure all interactive elements are keyboard accessible and have visible focus indicators.'
      });
    }
  }

  private getHeadingSequence(headings: any): number[] {
    const sequence: number[] = [];
    
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach((tag, index) => {
      const level = index + 1;
      const count = headings[tag]?.length || 0;
      for (let i = 0; i < count; i++) {
        sequence.push(level);
      }
    });
    
    return sequence;
  }

  private checkHeadingHierarchy(sequence: number[]): string[] {
    const issues: string[] = [];
    
    for (let i = 1; i < sequence.length; i++) {
      const current = sequence[i];
      const previous = sequence[i - 1];
      
      // Check if heading level jumps by more than 1
      if (current > previous + 1) {
        issues.push(`Heading level jumps from H${previous} to H${current}`);
      }
    }
    
    return issues;
  }

  private calculateResults(issues: AccessibilityIssue[]): AccessibilityAnalysisResult {
    // Count issues by severity
    const summary = {
      critical: issues.filter(i => i.severity === 'critical').length,
      high: issues.filter(i => i.severity === 'high').length,
      medium: issues.filter(i => i.severity === 'medium').length,
      low: issues.filter(i => i.severity === 'low').length,
      total: issues.length
    };

    // Calculate score (0-100)
    let score = 100;
    score -= summary.critical * 25; // Critical issues: -25 points each
    score -= summary.high * 15;     // High issues: -15 points each
    score -= summary.medium * 8;    // Medium issues: -8 points each
    score -= summary.low * 3;       // Low issues: -3 points each
    score = Math.max(0, score);

    // Determine compliance level
    let level: 'A' | 'AA' | 'AAA' | 'Non-compliant' = 'Non-compliant';
    if (score >= 95 && summary.critical === 0 && summary.high === 0) {
      level = 'AAA';
    } else if (score >= 85 && summary.critical === 0) {
      level = 'AA';
    } else if (score >= 70 && summary.critical <= 1) {
      level = 'A';
    }

    // Calculate WCAG compliance percentages
    const aIssues = issues.filter(i => i.wcagLevel === 'A');
    const aaIssues = issues.filter(i => i.wcagLevel === 'AA');
    const aaaIssues = issues.filter(i => i.wcagLevel === 'AAA');

    const wcagCompliance = {
      A: {
        passed: Math.max(0, 20 - aIssues.length),
        failed: aIssues.length,
        percentage: Math.max(0, ((20 - aIssues.length) / 20) * 100)
      },
      AA: {
        passed: Math.max(0, 15 - aaIssues.length),
        failed: aaIssues.length,
        percentage: Math.max(0, ((15 - aaIssues.length) / 15) * 100)
      },
      AAA: {
        passed: Math.max(0, 10 - aaaIssues.length),
        failed: aaaIssues.length,
        percentage: Math.max(0, ((10 - aaaIssues.length) / 10) * 100)
      }
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(issues, summary);

    return {
      score,
      level,
      issues,
      summary,
      recommendations,
      wcagCompliance
    };
  }

  private generateRecommendations(issues: AccessibilityIssue[], summary: any): string[] {
    const recommendations: string[] = [];

    if (summary.critical > 0) {
      recommendations.push('🚨 Critical: Address missing alt text and form labels immediately - these prevent users from accessing your content.');
    }

    if (summary.high > 0) {
      recommendations.push('⚠️ High Priority: Fix heading structure and missing page titles to improve navigation.');
    }

    if (summary.medium > 0) {
      recommendations.push('📋 Medium Priority: Improve color contrast and ARIA implementation for better usability.');
    }

    if (summary.low > 0) {
      recommendations.push('✅ Low Priority: Polish keyboard navigation and add missing meta descriptions.');
    }

    // General recommendations
    recommendations.push('🔍 Test with screen readers and keyboard-only navigation to verify fixes.');
    recommendations.push('📖 Review WCAG 2.1 guidelines for comprehensive accessibility compliance.');

    return recommendations;
  }
}

export default new AccessibilityAnalyzer();