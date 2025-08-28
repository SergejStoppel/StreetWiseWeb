/**
 * Enhanced Structure Analysis Worker
 * Implements comprehensive content structure and navigation testing with 12 rules
 * 
 * WCAG Guidelines Covered:
 * - 1.3.1 Info and Relationships
 * - 2.4.1 Bypass Blocks
 * - 2.4.2 Page Titled
 * - 2.4.3 Focus Order
 * - 2.4.6 Headings and Labels
 * - 3.1.1 Language of Page
 * - 3.1.2 Language of Parts
 */

import * as puppeteer from 'puppeteer';
import * as axe from 'axe-core';
import { AccessibilityIssue } from '@/types';
import { getDatabaseRuleKey, mapImpactToSeverity } from './ruleMapping';
import { supabase } from '@/config/supabase';

export class StructureAnalysisWorker {
  private page: puppeteer.Page;
  private issues: AccessibilityIssue[] = [];
  private ruleIdCache: Map<string, string | null> = new Map();

  constructor(page: puppeteer.Page) {
    this.page = page;
  }

  /**
   * Get rule ID from database by rule key
   */
  private async getRuleId(ruleKey: string): Promise<string | null> {
    // Check cache first
    if (this.ruleIdCache.has(ruleKey)) {
      return this.ruleIdCache.get(ruleKey) || null;
    }

    const { data, error } = await supabase
      .from('rules')
      .select('id')
      .eq('rule_key', ruleKey)
      .single();

    if (error || !data) {
      console.warn(`Rule not found for key: ${ruleKey}`, error);
      this.ruleIdCache.set(ruleKey, null);
      return null;
    }

    this.ruleIdCache.set(ruleKey, data.id);
    return data.id;
  }

  /**
   * Run all structure accessibility analysis
   */
  async analyze(): Promise<AccessibilityIssue[]> {
    console.log('🏗️ Starting Enhanced Structure Analysis...');
    
    try {
      // Run axe-core for structure-related rules
      await this.runAxeStructureRules();
      
      // Run custom structure analysis
      await this.analyzeHeadingStructure();
      await this.analyzePageTitle();
      await this.analyzeLanguageAttributes();
      await this.analyzeSkipLinks();
      await this.analyzeLandmarks();
      await this.analyzeListStructure();
      
      console.log(`✅ Structure Analysis completed. Found ${this.issues.length} issues.`);
      return this.issues;
      
    } catch (error) {
      console.error('❌ Structure Analysis failed:', error);
      throw error;
    }
  }

  /**
   * Run axe-core rules for structure accessibility
   */
  private async runAxeStructureRules(): Promise<void> {
    // Inject axe-core into the page
    await this.page.addScriptTag({
      path: require.resolve('axe-core')
    });

    // Wait for axe to be available
    await this.page.waitForFunction(() => typeof (globalThis as any).axe !== 'undefined', { timeout: 10000 });
    
    // Structure-specific axe rules
    const structureRules = [
      'heading-order',
      'empty-heading',
      'document-title',
      'html-has-lang',
      'html-lang-valid',
      'valid-lang',
      'bypass',
      'landmark-one-main',
      'landmark-complementary-is-top-level',
      'landmark-main-is-top-level',
      'landmark-unique',
      'page-has-heading-one',
      'list',
      'listitem',
      'definition-list'
    ];
    
    try {
      const results = await this.page.evaluate((rules) => {
        const axeConfig = {
          runOnly: {
            type: 'rule',
            values: rules
          }
        };
        return (globalThis as any).axe.run(globalThis.document, axeConfig);
      }, structureRules);
      
      // Process violations
      if (results.violations) {
        for (const violation of results.violations) {
          const dbRuleKey = getDatabaseRuleKey(violation.id);
          if (!dbRuleKey) continue;
          
          const ruleId = await this.getRuleId(dbRuleKey);
          if (!ruleId) {
            console.warn(`Skipping violation - rule not found in database: ${dbRuleKey}`);
            continue;
          }
          
          for (const node of violation.nodes) {
            const issue: AccessibilityIssue = {
              id: `structure_${violation.id}_${Date.now()}_${Math.random()}`,
              rule_id: ruleId,
              severity: mapImpactToSeverity(violation.impact as any),
              message: violation.description || violation.help || 'Structure accessibility issue detected',
              element_selector: node.target[0] || 'unknown',
              element_html: node.html || '',
              location_path: await this.getElementPath(node.target[0]),
              fix_suggestion: this.getStructureFixSuggestion(violation.id),
              wcag_criteria: this.getWCAGCriteria(violation.id).join(', '),
              impact_level: violation.impact || 'moderate',
              detected_at: new Date().toISOString()
            };
            
            this.issues.push(issue);
          }
        }
      }
    } catch (error) {
      console.error('Error running axe structure rules:', error);
    }
  }

  /**
   * Analyze heading structure comprehensively
   */
  private async analyzeHeadingStructure(): Promise<void> {
    try {
      const headingIssues = await this.page.evaluate(() => {
        const issues: any[] = [];
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        
        if (headings.length === 0) {
          return issues;
        }
        
        // Check for H1 presence and uniqueness
        const h1Elements = headings.filter(h => h.tagName === 'H1');
        
        // ACC_STR_02_NO_H1
        if (h1Elements.length === 0) {
          issues.push({
            type: 'ACC_STR_02_NO_H1',
            element: '<html>',
            selector: 'html',
            message: 'Page is missing an H1 heading'
          });
        }
        
        // ACC_STR_03_MULTIPLE_H1
        if (h1Elements.length > 1) {
          h1Elements.slice(1).forEach((h1: HTMLElement) => {
            issues.push({
              type: 'ACC_STR_03_MULTIPLE_H1',
              element: h1.outerHTML,
              selector: 'h1',
              message: 'Page has multiple H1 headings'
            });
          });
        }
        
        // ACC_STR_01_HEADING_ORDER - Check heading hierarchy
        let previousLevel = 0;
        headings.forEach((heading: HTMLElement) => {
          const currentLevel = parseInt(heading.tagName.charAt(1));
          
          if (previousLevel > 0 && currentLevel > previousLevel + 1) {
            issues.push({
              type: 'ACC_STR_01_HEADING_ORDER',
              element: heading.outerHTML,
              selector: heading.tagName.toLowerCase(),
              message: `Heading level ${currentLevel} follows H${previousLevel}, skipping levels`
            });
          }
          
          previousLevel = currentLevel;
        });
        
        return issues;
      });
      
      for (const issue of headingIssues) {
        const ruleId = await this.getRuleId(issue.type);
        if (!ruleId) {
          console.warn(`Skipping heading issue - rule not found in database: ${issue.type}`);
          continue;
        }
        
        const accessibilityIssue: AccessibilityIssue = {
          id: `structure_heading_${Date.now()}_${Math.random()}`,
          rule_id: ruleId,
          severity: issue.type === 'ACC_STR_02_NO_H1' ? 'serious' : 'moderate',
          message: issue.message,
          element_selector: issue.selector,
          element_html: issue.element,
          location_path: issue.selector,
          fix_suggestion: this.getStructureFixSuggestion(issue.type),
          wcag_criteria: this.getWCAGCriteria(issue.type).join(', '),
          impact_level: issue.type === 'ACC_STR_02_NO_H1' ? 'serious' : 'moderate',
          detected_at: new Date().toISOString()
        };
        
        this.issues.push(accessibilityIssue);
      }
      
    } catch (error) {
      console.error('Error analyzing heading structure:', error);
    }
  }

  /**
   * Analyze page title
   */
  private async analyzePageTitle(): Promise<void> {
    try {
      const titleIssues = await this.page.evaluate(() => {
        const issues: any[] = [];
        const title = document.querySelector('title');
        
        // ACC_STR_06_PAGE_TITLE_MISSING
        if (!title || !title.textContent?.trim()) {
          issues.push({
            type: 'ACC_STR_06_PAGE_TITLE_MISSING',
            element: title ? title.outerHTML : '<head>',
            selector: 'title',
            message: 'Page is missing a title element'
          });
        } else {
          const titleText = title.textContent.trim();
          
          // ACC_STR_07_PAGE_TITLE_UNINFORMATIVE
          const uninformativePatterns = [
            /^(page|document|untitled|new page)$/i,
            /^(welcome|home)$/i,
            /^.{1,3}$/,  // Very short titles
          ];
          
          if (uninformativePatterns.some(pattern => pattern.test(titleText))) {
            issues.push({
              type: 'ACC_STR_07_PAGE_TITLE_UNINFORMATIVE',
              element: title.outerHTML,
              selector: 'title',
              message: 'Page title is not descriptive or informative'
            });
          }
        }
        
        return issues;
      });
      
      for (const issue of titleIssues) {
        const ruleId = await this.getRuleId(issue.type);
        if (!ruleId) {
          console.warn(`Skipping title issue - rule not found in database: ${issue.type}`);
          continue;
        }

        const accessibilityIssue: AccessibilityIssue = {
          id: `structure_title_${Date.now()}_${Math.random()}`,
          rule_id: ruleId,
          severity: issue.type === 'ACC_STR_06_PAGE_TITLE_MISSING' ? 'critical' : 'moderate',
          message: issue.message,
          element_selector: issue.selector,
          element_html: issue.element,
          location_path: issue.selector,
          fix_suggestion: this.getStructureFixSuggestion(issue.type),
          wcag_criteria: this.getWCAGCriteria(issue.type).join(', '),
          impact_level: issue.type === 'ACC_STR_06_PAGE_TITLE_MISSING' ? 'critical' : 'moderate',
          detected_at: new Date().toISOString()
        };
        
        this.issues.push(accessibilityIssue);
      }
      
    } catch (error) {
      console.error('Error analyzing page title:', error);
    }
  }

  /**
   * Analyze language attributes
   */
  private async analyzeLanguageAttributes(): Promise<void> {
    try {
      const languageIssues = await this.page.evaluate(() => {
        const issues: any[] = [];
        const html = document.documentElement;
        
        // ACC_STR_04_PAGE_LANG_MISSING
        if (!html.getAttribute('lang')) {
          issues.push({
            type: 'ACC_STR_04_PAGE_LANG_MISSING',
            element: '<html>',
            selector: 'html',
            message: 'HTML element is missing lang attribute'
          });
        }
        
        // ACC_STR_05_ELEMENT_LANG_MISSING
        // Find elements with text in different languages
        const elementsWithForeignText = document.querySelectorAll('[lang]');
        const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
        
        textElements.forEach((element: HTMLElement) => {
          const text = element.textContent?.trim() || '';
          // Simple heuristic for non-English content (this could be enhanced)
          const hasNonEnglishChars = /[àáâãäåæçèéêëìíîïñòóôõöøùúûüýÿ]|[α-ωΑ-Ω]|[а-яА-Я]|[一-龯]/.test(text);
          
          if (hasNonEnglishChars && !element.getAttribute('lang') && !element.closest('[lang]')) {
            issues.push({
              type: 'ACC_STR_05_ELEMENT_LANG_MISSING',
              element: element.outerHTML,
              selector: element.tagName.toLowerCase(),
              message: 'Element contains non-English text but missing lang attribute'
            });
          }
        });
        
        return issues;
      });
      
      for (const issue of languageIssues) {
        const ruleId = await this.getRuleId(issue.type);
        if (!ruleId) {
          console.warn(`Skipping language issue - rule not found in database: ${issue.type}`);
          continue;
        }

        const accessibilityIssue: AccessibilityIssue = {
          id: `structure_lang_${Date.now()}_${Math.random()}`,
          rule_id: ruleId,
          severity: issue.type === 'ACC_STR_04_PAGE_LANG_MISSING' ? 'critical' : 'minor',
          message: issue.message,
          element_selector: issue.selector,
          element_html: issue.element,
          location_path: issue.selector,
          fix_suggestion: this.getStructureFixSuggestion(issue.type),
          wcag_criteria: this.getWCAGCriteria(issue.type).join(', '),
          impact_level: issue.type === 'ACC_STR_04_PAGE_LANG_MISSING' ? 'critical' : 'minor',
          detected_at: new Date().toISOString()
        };
        
        this.issues.push(accessibilityIssue);
      }
      
    } catch (error) {
      console.error('Error analyzing language attributes:', error);
    }
  }

  /**
   * Analyze skip links
   */
  private async analyzeSkipLinks(): Promise<void> {
    try {
      const skipLinkIssues = await this.page.evaluate(() => {
        const issues: any[] = [];
        
        // Look for skip links
        const skipLinks = Array.from(document.querySelectorAll('a[href^="#"]'))
          .filter((link: HTMLAnchorElement) => {
            const text = link.textContent?.toLowerCase() || '';
            return text.includes('skip') || text.includes('jump');
          });
        
        // ACC_STR_08_SKIP_LINK_MISSING
        if (skipLinks.length === 0) {
          issues.push({
            type: 'ACC_STR_08_SKIP_LINK_MISSING',
            element: '<body>',
            selector: 'body',
            message: 'Page is missing skip navigation links'
          });
        } else {
          // ACC_STR_09_SKIP_LINK_BROKEN
          skipLinks.forEach((link: HTMLAnchorElement) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
              const targetId = href.substring(1);
              const target = document.getElementById(targetId);
              
              if (!target) {
                issues.push({
                  type: 'ACC_STR_09_SKIP_LINK_BROKEN',
                  element: link.outerHTML,
                  selector: 'a[href="' + href + '"]',
                  message: `Skip link target "${targetId}" does not exist`
                });
              }
            }
          });
        }
        
        return issues;
      });
      
      for (const issue of skipLinkIssues) {
        const ruleId = await this.getRuleId(issue.type);
        if (!ruleId) {
          console.warn(`Skipping skip link issue - rule not found in database: ${issue.type}`);
          continue;
        }

        const accessibilityIssue: AccessibilityIssue = {
          id: `structure_skip_${Date.now()}_${Math.random()}`,
          rule_id: ruleId,
          severity: 'moderate',
          message: issue.message,
          element_selector: issue.selector,
          element_html: issue.element,
          location_path: issue.selector,
          fix_suggestion: this.getStructureFixSuggestion(issue.type),
          wcag_criteria: this.getWCAGCriteria(issue.type).join(', '),
          impact_level: 'moderate',
          detected_at: new Date().toISOString()
        };
        
        this.issues.push(accessibilityIssue);
      }
      
    } catch (error) {
      console.error('Error analyzing skip links:', error);
    }
  }

  /**
   * Analyze landmarks
   */
  private async analyzeLandmarks(): Promise<void> {
    try {
      const landmarkIssues = await this.page.evaluate(() => {
        const issues: any[] = [];
        
        // Check for main landmark
        const mainElements = document.querySelectorAll('main, [role="main"]');
        const navElements = document.querySelectorAll('nav, [role="navigation"]');
        const bannerElements = document.querySelectorAll('header, [role="banner"]');
        const contentinfoElements = document.querySelectorAll('footer, [role="contentinfo"]');
        
        // ACC_STR_10_LANDMARK_MISSING
        if (mainElements.length === 0) {
          issues.push({
            type: 'ACC_STR_10_LANDMARK_MISSING',
            element: '<body>',
            selector: 'body',
            message: 'Page is missing a main landmark'
          });
        }
        
        // ACC_STR_11_LANDMARK_DUPLICATE - Check for duplicate landmark labels
        const landmarkGroups = [
          { elements: navElements, type: 'navigation' },
          { elements: bannerElements, type: 'banner' },
          { elements: contentinfoElements, type: 'contentinfo' }
        ];
        
        landmarkGroups.forEach(group => {
          if (group.elements.length > 1) {
            const hasDistinctLabels = Array.from(group.elements).every((element: HTMLElement) => {
              return element.getAttribute('aria-label') || 
                     element.getAttribute('aria-labelledby') ||
                     element.textContent?.trim();
            });
            
            if (!hasDistinctLabels) {
              group.elements.forEach((element: HTMLElement, index) => {
                if (index > 0) { // Skip first one
                  issues.push({
                    type: 'ACC_STR_11_LANDMARK_DUPLICATE',
                    element: element.outerHTML,
                    selector: element.tagName.toLowerCase(),
                    message: `Duplicate ${group.type} landmark needs distinct label`
                  });
                }
              });
            }
          }
        });
        
        return issues;
      });
      
      for (const issue of landmarkIssues) {
        const ruleId = await this.getRuleId(issue.type);
        if (!ruleId) {
          console.warn(`Skipping landmark issue - rule not found in database: ${issue.type}`);
          continue;
        }

        const accessibilityIssue: AccessibilityIssue = {
          id: `structure_landmark_${Date.now()}_${Math.random()}`,
          rule_id: ruleId,
          severity: issue.type === 'ACC_STR_10_LANDMARK_MISSING' ? 'moderate' : 'minor',
          message: issue.message,
          element_selector: issue.selector,
          element_html: issue.element,
          location_path: issue.selector,
          fix_suggestion: this.getStructureFixSuggestion(issue.type),
          wcag_criteria: this.getWCAGCriteria(issue.type).join(', '),
          impact_level: issue.type === 'ACC_STR_10_LANDMARK_MISSING' ? 'moderate' : 'minor',
          detected_at: new Date().toISOString()
        };
        
        this.issues.push(accessibilityIssue);
      }
      
    } catch (error) {
      console.error('Error analyzing landmarks:', error);
    }
  }

  /**
   * Analyze list structure
   */
  private async analyzeListStructure(): Promise<void> {
    try {
      const listIssues = await this.page.evaluate(() => {
        const issues: any[] = [];
        
        // Check for proper list structure
        const lists = document.querySelectorAll('ul, ol, dl');
        
        lists.forEach((list: HTMLElement) => {
          if (list.tagName === 'UL' || list.tagName === 'OL') {
            const directChildren = Array.from(list.children);
            const invalidChildren = directChildren.filter(child => child.tagName !== 'LI');
            
            if (invalidChildren.length > 0) {
              issues.push({
                type: 'ACC_STR_12_LIST_STRUCTURE_INVALID',
                element: list.outerHTML,
                selector: list.tagName.toLowerCase(),
                message: `${list.tagName} contains non-LI elements as direct children`
              });
            }
          } else if (list.tagName === 'DL') {
            const directChildren = Array.from(list.children);
            const validChildren = directChildren.filter(child => 
              child.tagName === 'DT' || child.tagName === 'DD'
            );
            
            if (validChildren.length !== directChildren.length) {
              issues.push({
                type: 'ACC_STR_12_LIST_STRUCTURE_INVALID',
                element: list.outerHTML,
                selector: 'dl',
                message: 'DL contains elements other than DT and DD as direct children'
              });
            }
          }
        });
        
        // Check for orphaned list items
        const orphanedLIs = document.querySelectorAll('li:not(ul > li):not(ol > li)');
        orphanedLIs.forEach((li: HTMLElement) => {
          issues.push({
            type: 'ACC_STR_12_LIST_STRUCTURE_INVALID',
            element: li.outerHTML,
            selector: 'li',
            message: 'LI element is not a direct child of UL or OL'
          });
        });
        
        return issues;
      });
      
      for (const issue of listIssues) {
        const ruleId = await this.getRuleId(issue.type);
        if (!ruleId) {
          console.warn(`Skipping list issue - rule not found in database: ${issue.type}`);
          continue;
        }

        const accessibilityIssue: AccessibilityIssue = {
          id: `structure_list_${Date.now()}_${Math.random()}`,
          rule_id: ruleId,
          severity: 'minor',
          message: issue.message,
          element_selector: issue.selector,
          element_html: issue.element,
          location_path: issue.selector,
          fix_suggestion: this.getStructureFixSuggestion(issue.type),
          wcag_criteria: this.getWCAGCriteria(issue.type).join(', '),
          impact_level: 'minor',
          detected_at: new Date().toISOString()
        };
        
        this.issues.push(accessibilityIssue);
      }
      
    } catch (error) {
      console.error('Error analyzing list structure:', error);
    }
  }

  /**
   * Helper methods
   */
  private async getElementPath(selector: string): Promise<string> {
    try {
      return await this.page.evaluate((sel) => {
        const element = document.querySelector(sel);
        if (!element) return sel;
        
        const path = [];
        let current = element;
        
        while (current && current !== document.body) {
          let selector = current.tagName.toLowerCase();
          if (current.id) {
            selector += `#${current.id}`;
            path.unshift(selector);
            break;
          } else if (current.className) {
            const classes = current.className.split(' ').filter(c => c).slice(0, 2);
            if (classes.length > 0) {
              selector += `.${classes.join('.')}`;
            }
          }
          path.unshift(selector);
          current = current.parentElement;
        }
        
        return path.join(' > ');
      }, selector);
    } catch {
      return selector;
    }
  }

  private getStructureFixSuggestion(ruleId: string): string {
    const suggestions: { [key: string]: string } = {
      'ACC_STR_01_HEADING_ORDER': 'Use headings in logical order (H1→H2→H3) without skipping levels',
      'ACC_STR_02_NO_H1': 'Add a unique H1 heading that describes the main content of the page',
      'ACC_STR_03_MULTIPLE_H1': 'Use only one H1 per page, use H2-H6 for subheadings',
      'ACC_STR_04_PAGE_LANG_MISSING': 'Add lang attribute to HTML element (e.g., <html lang="en">)',
      'ACC_STR_05_ELEMENT_LANG_MISSING': 'Add lang attribute to elements with non-English text',
      'ACC_STR_06_PAGE_TITLE_MISSING': 'Add a descriptive <title> element in the document head',
      'ACC_STR_07_PAGE_TITLE_UNINFORMATIVE': 'Make the page title specific and descriptive of the page content',
      'ACC_STR_08_SKIP_LINK_MISSING': 'Add skip navigation links at the beginning of the page',
      'ACC_STR_09_SKIP_LINK_BROKEN': 'Ensure skip link targets exist and are focusable',
      'ACC_STR_10_LANDMARK_MISSING': 'Add a main element or role="main" to identify the main content',
      'ACC_STR_11_LANDMARK_DUPLICATE': 'Provide unique labels for multiple landmarks of the same type',
      'ACC_STR_12_LIST_STRUCTURE_INVALID': 'Ensure proper list structure: UL/OL contain only LI elements',
      'heading-order': 'Use headings in sequential order without skipping levels',
      'document-title': 'Provide a descriptive page title',
      'html-has-lang': 'Add lang attribute to the html element'
    };
    
    return suggestions[ruleId] || 'Review content structure and navigation best practices';
  }

  private getWCAGCriteria(ruleId: string): string[] {
    const criteria: { [key: string]: string[] } = {
      'ACC_STR_01_HEADING_ORDER': ['1.3.1', '2.4.6'],
      'ACC_STR_02_NO_H1': ['2.4.6'],
      'ACC_STR_03_MULTIPLE_H1': ['2.4.6'],
      'ACC_STR_04_PAGE_LANG_MISSING': ['3.1.1'],
      'ACC_STR_05_ELEMENT_LANG_MISSING': ['3.1.2'],
      'ACC_STR_06_PAGE_TITLE_MISSING': ['2.4.2'],
      'ACC_STR_07_PAGE_TITLE_UNINFORMATIVE': ['2.4.2'],
      'ACC_STR_08_SKIP_LINK_MISSING': ['2.4.1'],
      'ACC_STR_09_SKIP_LINK_BROKEN': ['2.4.1'],
      'ACC_STR_10_LANDMARK_MISSING': ['1.3.1'],
      'ACC_STR_11_LANDMARK_DUPLICATE': ['2.4.6'],
      'ACC_STR_12_LIST_STRUCTURE_INVALID': ['1.3.1'],
      'heading-order': ['1.3.1', '2.4.6'],
      'document-title': ['2.4.2'],
      'html-has-lang': ['3.1.1']
    };
    
    return criteria[ruleId] || ['1.3.1'];
  }
}