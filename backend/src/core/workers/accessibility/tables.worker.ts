/**
 * Tables Analysis Worker  
 * Implements comprehensive table accessibility testing with 5 rules
 * 
 * WCAG Guidelines Covered:
 * - 1.3.1 Info and Relationships
 * - 1.3.2 Meaningful Sequence
 */

import * as puppeteer from 'puppeteer';
import * as axe from 'axe-core';
import { AccessibilityIssue } from '@/types';
import { getDatabaseRuleKey, mapImpactToSeverity } from './ruleMapping';
import { supabase } from '@/config/supabase';

export class TablesAnalysisWorker {
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
   * Run all table accessibility analysis
   */
  async analyze(): Promise<AccessibilityIssue[]> {
    console.log('📊 Starting Enhanced Tables Analysis...');
    
    try {
      // Run axe-core for table-related rules
      await this.runAxeTableRules();
      
      // Run custom table analysis
      await this.analyzeTableHeaders();
      await this.analyzeTableCaptions();
      await this.analyzeTableScope();
      await this.analyzeComplexTables();
      await this.analyzeLayoutTables();
      
      console.log(`✅ Tables Analysis completed. Found ${this.issues.length} issues.`);
      return this.issues;
      
    } catch (error) {
      console.error('❌ Tables Analysis failed:', error);
      throw error;
    }
  }

  /**
   * Run axe-core rules for table accessibility
   */
  private async runAxeTableRules(): Promise<void> {
    // Inject axe-core into the page
    await this.page.addScriptTag({
      path: require.resolve('axe-core')
    });

    // Wait for axe to be available
    await this.page.waitForFunction(() => typeof (globalThis as any).axe !== 'undefined', { timeout: 10000 });
    
    // Table-specific axe rules (only valid ones)
    const tableRules = [
      'table-duplicate-name',
      'table-fake-caption',
      'td-headers-attr',
      'th-has-data-cells'
      // 'layout-table' // Invalid rule - removed
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
      }, tableRules);
      
      // Process violations
      if (results.violations) {
        for (const violation of results.violations) {
          const dbRuleKey = getDatabaseRuleKey(violation.id) || this.mapAxeRuleToCustomRule(violation.id);
          const rule_id = await this.getRuleId(dbRuleKey);
          
          for (const node of violation.nodes) {
            const issue: AccessibilityIssue = {
              id: `tables_${violation.id}_${Date.now()}_${Math.random()}`,
              rule_id: rule_id,
              severity: mapImpactToSeverity(violation.impact as any),
              message: violation.description || violation.help || 'Table accessibility issue detected',
              element_selector: node.target[0] || 'unknown',
              element_html: node.html || '',
              location_path: await this.getElementPath(node.target[0]),
              fix_suggestion: this.getTableFixSuggestion(violation.id),
              wcag_criteria: this.getWCAGCriteria(violation.id).join(', '),
              impact_level: violation.impact || 'moderate',
              detected_at: new Date().toISOString()
            };
            
            this.issues.push(issue);
          }
        }
      }
    } catch (error) {
      console.error('Error running axe table rules:', error);
    }
  }

  /**
   * Analyze table headers
   */
  private async analyzeTableHeaders(): Promise<void> {
    try {
      const headerIssues = await this.page.evaluate(() => {
        const issues: any[] = [];
        const tables = document.querySelectorAll('table');
        
        tables.forEach((table: HTMLTableElement) => {
          // Skip layout tables (those with role="none" or role="presentation")
          const role = table.getAttribute('role');
          if (role === 'none' || role === 'presentation') {
            return;
          }
          
          const thElements = table.querySelectorAll('th');
          const hasHeaders = thElements.length > 0;
          const hasHeaderRow = table.querySelector('thead tr') !== null;
          const firstRowCells = table.querySelector('tr')?.querySelectorAll('td, th');
          
          // ACC_TBL_01_HEADER_MISSING
          if (!hasHeaders && firstRowCells && firstRowCells.length > 1) {
            // This looks like a data table but has no headers
            const hasDataPattern = Array.from(table.querySelectorAll('td')).some((td: HTMLTableCellElement) => {
              const text = td.textContent?.trim() || '';
              return text.length > 0 && !isNaN(Number(text));
            });
            
            if (hasDataPattern) {
              issues.push({
                type: 'ACC_TBL_01_HEADER_MISSING',
                element: table.outerHTML,
                selector: 'table',
                message: 'Data table is missing proper header cells (th elements)'
              });
            }
          }
          
          // Check for empty headers
          thElements.forEach((th: HTMLTableHeaderCellElement) => {
            const text = th.textContent?.trim() || '';
            const hasAriaLabel = th.getAttribute('aria-label');
            
            if (!text && !hasAriaLabel) {
              issues.push({
                type: 'ACC_TBL_01_HEADER_MISSING',
                element: th.outerHTML,
                selector: 'th',
                message: 'Table header cell is empty and has no accessible name'
              });
            }
          });
        });
        
        return issues;
      });
      
      for (const issue of headerIssues) {
        const rule_id = await this.getRuleId(issue.type);
        const accessibilityIssue: AccessibilityIssue = {
          id: `tables_headers_${Date.now()}_${Math.random()}`,
          rule_id: rule_id,
          severity: 'serious',
          message: issue.message,
          element_selector: issue.selector,
          element_html: issue.element,
          location_path: issue.selector,
          fix_suggestion: this.getTableFixSuggestion(issue.type),
          wcag_criteria: this.getWCAGCriteria(issue.type).join(', '),
          impact_level: 'serious',
          detected_at: new Date().toISOString()
        };
        
        this.issues.push(accessibilityIssue);
      }
      
    } catch (error) {
      console.error('Error analyzing table headers:', error);
    }
  }

  /**
   * Analyze table captions
   */
  private async analyzeTableCaptions(): Promise<void> {
    try {
      const captionIssues = await this.page.evaluate(() => {
        const issues: any[] = [];
        const tables = document.querySelectorAll('table');
        
        tables.forEach((table: HTMLTableElement) => {
          // Skip layout tables
          const role = table.getAttribute('role');
          if (role === 'none' || role === 'presentation') {
            return;
          }
          
          const caption = table.querySelector('caption');
          const ariaLabel = table.getAttribute('aria-label');
          const ariaLabelledBy = table.getAttribute('aria-labelledby');
          const hasAccessibleName = caption || ariaLabel || ariaLabelledBy;
          
          // Determine if this looks like a complex data table
          const rowCount = table.querySelectorAll('tr').length;
          const colCount = table.querySelector('tr')?.querySelectorAll('td, th').length || 0;
          const isComplexTable = rowCount > 3 && colCount > 2;
          
          // ACC_TBL_02_CAPTION_MISSING
          if (isComplexTable && !hasAccessibleName) {
            issues.push({
              type: 'ACC_TBL_02_CAPTION_MISSING',
              element: table.outerHTML,
              selector: 'table',
              message: 'Complex data table is missing a caption or accessible name'
            });
          }
        });
        
        return issues;
      });
      
      for (const issue of captionIssues) {
        const rule_id = await this.getRuleId(issue.type);
        const accessibilityIssue: AccessibilityIssue = {
          id: `tables_caption_${Date.now()}_${Math.random()}`,
          rule_id: rule_id,
          severity: 'moderate',
          message: issue.message,
          element_selector: issue.selector,
          element_html: issue.element,
          location_path: issue.selector,
          fix_suggestion: this.getTableFixSuggestion(issue.type),
          wcag_criteria: this.getWCAGCriteria(issue.type).join(', '),
          impact_level: 'moderate',
          detected_at: new Date().toISOString()
        };
        
        this.issues.push(accessibilityIssue);
      }
      
    } catch (error) {
      console.error('Error analyzing table captions:', error);
    }
  }

  /**
   * Analyze table scope attributes
   */
  private async analyzeTableScope(): Promise<void> {
    try {
      const scopeIssues = await this.page.evaluate(() => {
        const issues: any[] = [];
        const tables = document.querySelectorAll('table');
        
        tables.forEach((table: HTMLTableElement) => {
          // Skip layout tables
          const role = table.getAttribute('role');
          if (role === 'none' || role === 'presentation') {
            return;
          }
          
          const thElements = table.querySelectorAll('th');
          const rowCount = table.querySelectorAll('tr').length;
          const colCount = table.querySelector('tr')?.querySelectorAll('td, th').length || 0;
          
          // ACC_TBL_03_SCOPE_MISSING
          if (rowCount > 2 && colCount > 2) { // Complex table
            thElements.forEach((th: HTMLTableHeaderCellElement) => {
              const scope = th.getAttribute('scope');
              const id = th.getAttribute('id');
              
              // Headers in complex tables should have scope or be referenced by headers attribute
              if (!scope && !id) {
                issues.push({
                  type: 'ACC_TBL_03_SCOPE_MISSING',
                  element: th.outerHTML,
                  selector: 'th',
                  message: 'Table header in complex table missing scope attribute'
                });
              }
            });
          }
        });
        
        return issues;
      });
      
      for (const issue of scopeIssues) {
        const rule_id = await this.getRuleId(issue.type);
        const accessibilityIssue: AccessibilityIssue = {
          id: `tables_scope_${Date.now()}_${Math.random()}`,
          rule_id: rule_id,
          severity: 'serious',
          message: issue.message,
          element_selector: issue.selector,
          element_html: issue.element,
          location_path: issue.selector,
          fix_suggestion: this.getTableFixSuggestion(issue.type),
          wcag_criteria: this.getWCAGCriteria(issue.type).join(', '),
          impact_level: 'serious',
          detected_at: new Date().toISOString()
        };
        
        this.issues.push(accessibilityIssue);
      }
      
    } catch (error) {
      console.error('Error analyzing table scope:', error);
    }
  }

  /**
   * Analyze complex table headers
   */
  private async analyzeComplexTables(): Promise<void> {
    try {
      const complexTableIssues = await this.page.evaluate(() => {
        const issues: any[] = [];
        const tables = document.querySelectorAll('table');
        
        tables.forEach((table: HTMLTableElement) => {
          // Skip layout tables
          const role = table.getAttribute('role');
          if (role === 'none' || role === 'presentation') {
            return;
          }
          
          const rowCount = table.querySelectorAll('tr').length;
          const colCount = table.querySelector('tr')?.querySelectorAll('td, th').length || 0;
          
          // Consider complex if has multiple header levels or spans
          const hasSpannedHeaders = table.querySelectorAll('th[colspan], th[rowspan]').length > 0;
          const hasMultipleHeaderRows = table.querySelectorAll('thead tr').length > 1;
          
          if (hasSpannedHeaders || hasMultipleHeaderRows || (rowCount > 5 && colCount > 3)) {
            // ACC_TBL_04_COMPLEX_TABLE_HEADERS
            const thElements = table.querySelectorAll('th');
            const tdElements = table.querySelectorAll('td');
            
            // Check if data cells have proper header associations
            const hasProperAssociations = Array.from(tdElements).every((td: HTMLTableCellElement) => {
              const headers = td.getAttribute('headers');
              const hasHeadersAttr = headers && headers.length > 0;
              
              // For complex tables, data cells should use headers attribute
              return hasHeadersAttr || td.closest('tr')?.querySelector('th');
            });
            
            if (!hasProperAssociations) {
              issues.push({
                type: 'ACC_TBL_04_COMPLEX_TABLE_HEADERS',
                element: table.outerHTML,
                selector: 'table',
                message: 'Complex table data cells not properly associated with headers'
              });
            }
          }
        });
        
        return issues;
      });
      
      for (const issue of complexTableIssues) {
        const rule_id = await this.getRuleId(issue.type);
        const accessibilityIssue: AccessibilityIssue = {
          id: `tables_complex_${Date.now()}_${Math.random()}`,
          rule_id: rule_id,
          severity: 'serious',
          message: issue.message,
          element_selector: issue.selector,
          element_html: issue.element,
          location_path: issue.selector,
          fix_suggestion: this.getTableFixSuggestion(issue.type),
          wcag_criteria: this.getWCAGCriteria(issue.type).join(', '),
          impact_level: 'serious',
          detected_at: new Date().toISOString()
        };
        
        this.issues.push(accessibilityIssue);
      }
      
    } catch (error) {
      console.error('Error analyzing complex tables:', error);
    }
  }

  /**
   * Analyze layout tables
   */
  private async analyzeLayoutTables(): Promise<void> {
    try {
      const layoutTableIssues = await this.page.evaluate(() => {
        const issues: any[] = [];
        const tables = document.querySelectorAll('table');
        
        tables.forEach((table: HTMLTableElement) => {
          const role = table.getAttribute('role');
          const isLayoutTable = role === 'none' || role === 'presentation';
          
          // Heuristics to detect layout tables
          const hasHeaders = table.querySelectorAll('th').length > 0;
          const hasCaption = table.querySelector('caption') !== null;
          const hasSummary = table.getAttribute('summary') !== null;
          
          // If it looks like a layout table but has data table features
          if (!isLayoutTable && hasHeaders) {
            // Check if headers contain typical data table text
            const headerTexts = Array.from(table.querySelectorAll('th')).map((th: HTMLTableHeaderCellElement) => 
              th.textContent?.trim().toLowerCase() || ''
            );
            
            const layoutIndicators = headerTexts.every(text => 
              text === '' || 
              text.includes('spacer') ||
              text.includes('layout') ||
              text.length < 2
            );
            
            if (layoutIndicators) {
              // ACC_TBL_05_LAYOUT_TABLE_HEADERS
              issues.push({
                type: 'ACC_TBL_05_LAYOUT_TABLE_HEADERS',
                element: table.outerHTML,
                selector: 'table',
                message: 'Layout table should not have header cells (th elements)'
              });
            }
          }
        });
        
        return issues;
      });
      
      for (const issue of layoutTableIssues) {
        const rule_id = await this.getRuleId(issue.type);
        const accessibilityIssue: AccessibilityIssue = {
          id: `tables_layout_${Date.now()}_${Math.random()}`,
          rule_id: rule_id,
          severity: 'moderate',
          message: issue.message,
          element_selector: issue.selector,
          element_html: issue.element,
          location_path: issue.selector,
          fix_suggestion: this.getTableFixSuggestion(issue.type),
          wcag_criteria: this.getWCAGCriteria(issue.type).join(', '),
          impact_level: 'moderate',
          detected_at: new Date().toISOString()
        };
        
        this.issues.push(accessibilityIssue);
      }
      
    } catch (error) {
      console.error('Error analyzing layout tables:', error);
    }
  }

  /**
   * Helper methods
   */
  private mapAxeRuleToCustomRule(axeRuleId: string): string {
    const mapping: { [key: string]: string } = {
      'table-duplicate-name': 'ACC_TBL_02_CAPTION_MISSING',
      'table-fake-caption': 'ACC_TBL_02_CAPTION_MISSING', 
      'td-headers-attr': 'ACC_TBL_04_COMPLEX_TABLE_HEADERS',
      'th-has-data-cells': 'ACC_TBL_01_HEADER_MISSING',
      'layout-table': 'ACC_TBL_05_LAYOUT_TABLE_HEADERS'
    };
    
    return mapping[axeRuleId] || 'ACC_TBL_01_HEADER_MISSING';
  }

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

  private getTableFixSuggestion(ruleId: string): string {
    const suggestions: { [key: string]: string } = {
      'ACC_TBL_01_HEADER_MISSING': 'Add <th> elements to identify column and row headers in data tables',
      'ACC_TBL_02_CAPTION_MISSING': 'Add <caption> element or aria-label to describe the table purpose',
      'ACC_TBL_03_SCOPE_MISSING': 'Add scope="col" or scope="row" to header cells in complex tables',
      'ACC_TBL_04_COMPLEX_TABLE_HEADERS': 'Use headers attribute on data cells to associate with proper headers',
      'ACC_TBL_05_LAYOUT_TABLE_HEADERS': 'Remove <th> elements from layout tables or add role="none"',
      'table-duplicate-name': 'Ensure each table has a unique accessible name',
      'td-headers-attr': 'Fix or remove incorrect headers attribute values',
      'th-has-data-cells': 'Ensure header cells are properly associated with data cells',
      'layout-table': 'Add role="none" to tables used for layout purposes'
    };
    
    return suggestions[ruleId] || 'Review table structure and accessibility best practices';
  }

  private getWCAGCriteria(ruleId: string): string[] {
    const criteria: { [key: string]: string[] } = {
      'ACC_TBL_01_HEADER_MISSING': ['1.3.1'],
      'ACC_TBL_02_CAPTION_MISSING': ['1.3.1'],
      'ACC_TBL_03_SCOPE_MISSING': ['1.3.1'],
      'ACC_TBL_04_COMPLEX_TABLE_HEADERS': ['1.3.1'],
      'ACC_TBL_05_LAYOUT_TABLE_HEADERS': ['1.3.1'],
      'table-duplicate-name': ['1.3.1'],
      'td-headers-attr': ['1.3.1'],
      'th-has-data-cells': ['1.3.1'],
      'layout-table': ['1.3.1']
    };
    
    return criteria[ruleId] || ['1.3.1'];
  }
}