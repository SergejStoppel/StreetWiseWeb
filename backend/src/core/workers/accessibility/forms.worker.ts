/**
 * Enhanced Forms Analysis Worker
 * Implements comprehensive form accessibility testing with 15 rules
 * 
 * WCAG Guidelines Covered:
 * - 1.3.1 Info and Relationships
 * - 1.3.5 Identify Input Purpose
 * - 3.2.2 On Input
 * - 3.3.1 Error Identification
 * - 3.3.2 Labels or Instructions
 * - 3.3.3 Error Suggestion
 * - 4.1.2 Name, Role, Value
 */

import * as puppeteer from 'puppeteer';
import * as axe from 'axe-core';
import { AccessibilityIssue } from '@/types';
import { getDatabaseRuleKey, mapImpactToSeverity } from './ruleMapping';
import { supabase } from '@/config/supabase';
import { detectCustomFormViolations } from './customRuleDetectors';

export class FormAnalysisWorker {
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
   * Run all form accessibility analysis
   */
  async analyze(): Promise<AccessibilityIssue[]> {
    console.log('🔍 Starting Enhanced Form Analysis...');
    
    try {
      // Run axe-core for form-related rules
      await this.runAxeFormRules();
      
      // Run custom form analysis
      await this.analyzeFormLabels();
      await this.analyzeRequiredFields();
      await this.analyzeFieldsets();
      await this.analyzeFormErrors();
      await this.analyzeInputPurpose();
      await this.analyzePlaceholderAsLabel();
      await this.analyzeButtonNames();
      await this.analyzeFormInstructions();
      await this.analyzeAutoComplete();
      
      // Run custom form violation detection for rules not covered above
      await this.analyzeCustomFormViolations();
      
      console.log(`✅ Form Analysis completed. Found ${this.issues.length} issues.`);
      return this.issues;
      
    } catch (error) {
      console.error('❌ Form Analysis failed:', error);
      throw error;
    }
  }

  /**
   * Run axe-core rules for form accessibility
   */
  private async runAxeFormRules(): Promise<void> {
    // Inject axe-core into the page
    await this.page.addScriptTag({
      path: require.resolve('axe-core')
    });

    // Wait for axe to be available
    await this.page.waitForFunction(() => typeof (globalThis as any).axe !== 'undefined', { timeout: 10000 });
    
    // Form-specific axe rules (only valid ones)
    const formRules = [
      'label', 
      'label-title-only',
      'form-field-multiple-labels',
      'button-name',
      'input-button-name',
      'aria-input-field-name',
      'aria-toggle-field-name',
      // 'fieldset-legend', // Invalid rule - removed
      'select-name'
      // 'textarea-name' // Invalid rule - removed
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
      }, formRules);
      
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
              id: `form_${violation.id}_${Date.now()}_${Math.random()}`,
              rule_id: ruleId,
              severity: mapImpactToSeverity(violation.impact as any),
              message: violation.description || violation.help || 'Form accessibility issue detected',
              element_selector: node.target[0] || 'unknown',
              element_html: node.html || '',
              location_path: await this.getElementPath(node.target[0]),
              fix_suggestion: this.getFormFixSuggestion(violation.id),
              wcag_criteria: this.getWCAGCriteria(violation.id).join(', '),
              impact_level: violation.impact || 'moderate',
              detected_at: new Date().toISOString()
            };
            
            this.issues.push(issue);
          }
        }
      }
    } catch (error) {
      console.error('Error running axe form rules:', error);
    }
  }

  /**
   * Analyze form labels comprehensively
   */
  private async analyzeFormLabels(): Promise<void> {
    try {
      const labelIssues = await this.page.evaluate(() => {
        const issues: any[] = [];
        const inputs = document.querySelectorAll('input, textarea, select');
        
        inputs.forEach((input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) => {
          if (input.type === 'hidden' || input.type === 'submit' || input.type === 'button') {
            return;
          }
          
          const id = input.id;
          const hasLabel = document.querySelector(`label[for="${id}"]`);
          const hasAriaLabel = input.getAttribute('aria-label');
          const hasAriaLabelledBy = input.getAttribute('aria-labelledby');
          const hasTitle = input.getAttribute('title');
          
          // ACC_FRM_01_LABEL_MISSING
          if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
            issues.push({
              type: 'ACC_FRM_01_LABEL_MISSING',
              element: input.outerHTML,
              selector: input.tagName.toLowerCase() + (id ? `#${id}` : ''),
              message: 'Form input is missing a proper label'
            });
          }
          
          // ACC_FRM_02_LABEL_FOR_ID_MISMATCH  
          if (hasLabel && id) {
            const label = document.querySelector(`label[for="${id}"]`) as HTMLLabelElement;
            if (label && label.getAttribute('for') !== id) {
              issues.push({
                type: 'ACC_FRM_02_LABEL_FOR_ID_MISMATCH',
                element: input.outerHTML,
                selector: input.tagName.toLowerCase() + `#${id}`,
                message: 'Label "for" attribute does not match input ID'
              });
            }
          }
          
          // ACC_FRM_03_LABEL_HIDDEN
          if (hasLabel) {
            const label = document.querySelector(`label[for="${id}"]`) as HTMLLabelElement;
            if (label) {
              const labelStyles = window.getComputedStyle(label);
              if (labelStyles.display === 'none' || 
                  labelStyles.visibility === 'hidden' || 
                  labelStyles.opacity === '0') {
                issues.push({
                  type: 'ACC_FRM_03_LABEL_HIDDEN',
                  element: input.outerHTML,
                  selector: input.tagName.toLowerCase() + (id ? `#${id}` : ''),
                  message: 'Form label is hidden from users'
                });
              }
            }
          }
          
          // ACC_FRM_09_PLACEHOLDER_LABEL
          const placeholder = input.getAttribute('placeholder');
          if (placeholder && !hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
            issues.push({
              type: 'ACC_FRM_09_PLACEHOLDER_LABEL',
              element: input.outerHTML,
              selector: input.tagName.toLowerCase() + (id ? `#${id}` : ''),
              message: 'Placeholder text is being used as the only label'
            });
          }
        });
        
        return issues;
      });
      
      // Convert to AccessibilityIssue format
      for (const issue of labelIssues) {
        const ruleId = await this.getRuleId(issue.type);
        if (!ruleId) {
          console.warn(`Skipping label issue - rule not found in database: ${issue.type}`);
          continue;
        }
        
        const accessibilityIssue: AccessibilityIssue = {
          id: `forms_${issue.type}_${Date.now()}_${Math.random()}`,
          rule_id: ruleId,
          severity: 'serious',
          message: issue.message,
          element_selector: issue.selector,
          element_html: issue.element,
          location_path: issue.selector,
          fix_suggestion: this.getFormFixSuggestion(issue.type),
          wcag_criteria: this.getWCAGCriteria(issue.type).join(', '),
          impact_level: 'serious',
          detected_at: new Date().toISOString()
        };
        
        this.issues.push(accessibilityIssue);
      }
      
    } catch (error) {
      console.error('Error analyzing form labels:', error);
    }
  }

  /**
   * Analyze required field indicators
   */
  private async analyzeRequiredFields(): Promise<void> {
    try {
      const requiredIssues = await this.page.evaluate(() => {
        const issues: any[] = [];
        const requiredInputs = document.querySelectorAll('input[required], textarea[required], select[required]');
        
        requiredInputs.forEach((input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) => {
          const id = input.id;
          const hasAriaRequired = input.getAttribute('aria-required') === 'true';
          const hasRequiredIndicator = input.getAttribute('aria-describedby');
          
          // Check for visual required indicators
          const label = document.querySelector(`label[for="${id}"]`);
          const hasVisualIndicator = label?.textContent?.includes('*') || 
                                   label?.textContent?.includes('required') ||
                                   label?.querySelector('.required');
          
          // ACC_FRM_05_REQUIRED_INDICATION
          if (!hasAriaRequired && !hasVisualIndicator && !hasRequiredIndicator) {
            issues.push({
              type: 'ACC_FRM_05_REQUIRED_INDICATION',
              element: input.outerHTML,
              selector: input.tagName.toLowerCase() + (id ? `#${id}` : ''),
              message: 'Required field is not properly indicated to screen readers'
            });
          }
        });
        
        return issues;
      });
      
      for (const issue of requiredIssues) {
        const ruleId = await this.getRuleId(issue.type);
        if (!ruleId) {
          console.warn(`Skipping required field issue - rule not found in database: ${issue.type}`);
          continue;
        }
        
        const accessibilityIssue: AccessibilityIssue = {
          id: `forms_required_${Date.now()}_${Math.random()}`,
          rule_id: ruleId,
          severity: 'serious',
          message: issue.message,
          element_selector: issue.selector,
          element_html: issue.element,
          location_path: issue.selector,
          fix_suggestion: this.getFormFixSuggestion(issue.type),
          wcag_criteria: this.getWCAGCriteria(issue.type).join(', '),
          impact_level: 'serious',
          detected_at: new Date().toISOString()
        };
        
        this.issues.push(accessibilityIssue);
      }
      
    } catch (error) {
      console.error('Error analyzing required fields:', error);
    }
  }

  /**
   * Analyze fieldsets and legends
   */
  private async analyzeFieldsets(): Promise<void> {
    try {
      const fieldsetIssues = await this.page.evaluate(() => {
        const issues: any[] = [];
        
        // Find groups of related form controls
        const radioGroups = document.querySelectorAll('input[type="radio"]');
        const checkboxGroups = document.querySelectorAll('input[type="checkbox"]');
        
        // Check radio button groups
        const radioNames = new Set();
        radioGroups.forEach((radio: HTMLInputElement) => {
          if (radio.name && !radioNames.has(radio.name)) {
            radioNames.add(radio.name);
            
            const relatedRadios = document.querySelectorAll(`input[type="radio"][name="${radio.name}"]`);
            if (relatedRadios.length > 1) {
              // Check if wrapped in fieldset
              const fieldset = radio.closest('fieldset');
              if (!fieldset) {
                issues.push({
                  type: 'ACC_FRM_04_FIELDSET_LEGEND_MISSING',
                  element: radio.outerHTML,
                  selector: `input[name="${radio.name}"]`,
                  message: `Radio button group "${radio.name}" should be wrapped in a fieldset with legend`
                });
              } else if (!fieldset.querySelector('legend')) {
                issues.push({
                  type: 'ACC_FRM_04_FIELDSET_LEGEND_MISSING',
                  element: fieldset.outerHTML,
                  selector: 'fieldset',
                  message: 'Fieldset is missing a legend element'
                });
              }
            }
          }
        });
        
        return issues;
      });
      
      for (const issue of fieldsetIssues) {
        const ruleId = await this.getRuleId(issue.type);
        if (!ruleId) {
          console.warn(`Skipping fieldset issue - rule not found in database: ${issue.type}`);
          continue;
        }
        
        const accessibilityIssue: AccessibilityIssue = {
          id: `forms_fieldset_${Date.now()}_${Math.random()}`,
          rule_id: ruleId,
          severity: 'moderate',
          message: issue.message,
          element_selector: issue.selector,
          element_html: issue.element,
          location_path: issue.selector,
          fix_suggestion: this.getFormFixSuggestion(issue.type),
          wcag_criteria: this.getWCAGCriteria(issue.type).join(', '),
          impact_level: 'moderate',
          detected_at: new Date().toISOString()
        };
        
        this.issues.push(accessibilityIssue);
      }
      
    } catch (error) {
      console.error('Error analyzing fieldsets:', error);
    }
  }

  /**
   * Analyze form error handling
   */
  private async analyzeFormErrors(): Promise<void> {
    try {
      const errorIssues = await this.page.evaluate(() => {
        const issues: any[] = [];
        
        // Look for error messages and invalid inputs
        const errorMessages = document.querySelectorAll('.error, .invalid, [role="alert"]');
        const invalidInputs = document.querySelectorAll('input:invalid, [aria-invalid="true"]');
        
        // ACC_FRM_06_ERROR_IDENTIFICATION
        invalidInputs.forEach((input: HTMLInputElement) => {
          const id = input.id;
          const hasAriaDescribedby = input.getAttribute('aria-describedby');
          const hasErrorAssociation = hasAriaDescribedby && 
                                     document.querySelector(`#${hasAriaDescribedby}`);
          
          if (!hasErrorAssociation) {
            issues.push({
              type: 'ACC_FRM_06_ERROR_IDENTIFICATION',
              element: input.outerHTML,
              selector: input.tagName.toLowerCase() + (id ? `#${id}` : ''),
              message: 'Form error is not properly associated with the input field'
            });
          }
        });
        
        // ACC_FRM_07_ERROR_SUGGESTION
        errorMessages.forEach((errorMsg: HTMLElement) => {
          const errorText = errorMsg.textContent?.toLowerCase() || '';
          const hasSuggestion = errorText.includes('should') || 
                               errorText.includes('try') ||
                               errorText.includes('format') ||
                               errorText.includes('example');
                               
          if (!hasSuggestion && errorText.length > 0) {
            issues.push({
              type: 'ACC_FRM_07_ERROR_SUGGESTION',
              element: errorMsg.outerHTML,
              selector: errorMsg.tagName.toLowerCase(),
              message: 'Error message does not provide suggestions for fixing the error'
            });
          }
        });
        
        return issues;
      });
      
      for (const issue of errorIssues) {
        const ruleId = await this.getRuleId(issue.type);
        if (!ruleId) {
          console.warn(`Skipping error issue - rule not found in database: ${issue.type}`);
          continue;
        }
        
        const accessibilityIssue: AccessibilityIssue = {
          id: `forms_error_${Date.now()}_${Math.random()}`,
          rule_id: ruleId,
          severity: issue.type === 'ACC_FRM_06_ERROR_IDENTIFICATION' ? 'critical' : 'moderate',
          message: issue.message,
          element_selector: issue.selector,
          element_html: issue.element,
          location_path: issue.selector,
          fix_suggestion: this.getFormFixSuggestion(issue.type),
          wcag_criteria: this.getWCAGCriteria(issue.type).join(', '),
          impact_level: issue.type === 'ACC_FRM_06_ERROR_IDENTIFICATION' ? 'critical' : 'moderate',
          detected_at: new Date().toISOString()
        };
        
        this.issues.push(accessibilityIssue);
      }
      
    } catch (error) {
      console.error('Error analyzing form errors:', error);
    }
  }

  /**
   * Analyze input purpose identification
   */
  private async analyzeInputPurpose(): Promise<void> {
    try {
      const purposeIssues = await this.page.evaluate(() => {
        const issues: any[] = [];
        
        // Common input types that should have autocomplete
        const purposefulInputs = document.querySelectorAll(`
          input[type="email"],
          input[type="tel"], 
          input[name*="phone"],
          input[name*="email"],
          input[name*="address"],
          input[name*="postal"],
          input[name*="zip"],
          input[name*="country"]
        `);
        
        purposefulInputs.forEach((input: HTMLInputElement) => {
          const hasAutocomplete = input.getAttribute('autocomplete');
          const id = input.id;
          
          // ACC_FRM_08_INPUT_PURPOSE
          if (!hasAutocomplete) {
            issues.push({
              type: 'ACC_FRM_08_INPUT_PURPOSE',
              element: input.outerHTML,
              selector: input.tagName.toLowerCase() + (id ? `#${id}` : ''),
              message: 'Input purpose is not identified with autocomplete attribute'
            });
          }
        });
        
        return issues;
      });
      
      for (const issue of purposeIssues) {
        const ruleId = await this.getRuleId(issue.type);
        if (!ruleId) {
          console.warn(`Skipping input purpose issue - rule not found in database: ${issue.type}`);
          continue;
        }
        
        const accessibilityIssue: AccessibilityIssue = {
          id: `forms_purpose_${Date.now()}_${Math.random()}`,
          rule_id: ruleId,
          severity: 'minor',
          message: issue.message,
          element_selector: issue.selector,
          element_html: issue.element,
          location_path: issue.selector,
          fix_suggestion: this.getFormFixSuggestion(issue.type),
          wcag_criteria: this.getWCAGCriteria(issue.type).join(', '),
          impact_level: 'minor',
          detected_at: new Date().toISOString()
        };
        
        this.issues.push(accessibilityIssue);
      }
      
    } catch (error) {
      console.error('Error analyzing input purpose:', error);
    }
  }

  /**
   * Additional form analysis methods would go here...
   * (analyzePlaceholderAsLabel, analyzeButtonNames, analyzeFormInstructions, analyzeAutoComplete)
   */
  private async analyzePlaceholderAsLabel(): Promise<void> {
    try {
      const placeholderIssues = await this.page.evaluate(() => {
        const issues: any[] = [];
        const inputsWithPlaceholder = document.querySelectorAll('input[placeholder], textarea[placeholder]');
        
        inputsWithPlaceholder.forEach((input: HTMLInputElement | HTMLTextAreaElement) => {
          const id = input.id;
          const hasLabel = document.querySelector(`label[for="${id}"]`);
          const hasAriaLabel = input.getAttribute('aria-label');
          const hasAriaLabelledBy = input.getAttribute('aria-labelledby');
          
          // ACC_FRM_09_PLACEHOLDER_LABEL
          if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
            issues.push({
              type: 'ACC_FRM_09_PLACEHOLDER_LABEL',
              element: input.outerHTML,
              selector: input.tagName.toLowerCase() + (id ? `#${id}` : ''),
              message: 'Placeholder text is being used as the only label - screen readers may not announce it consistently'
            });
          }
        });
        
        return issues;
      });
      
      for (const issue of placeholderIssues) {
        const ruleId = await this.getRuleId(issue.type);
        if (!ruleId) continue;
        
        const accessibilityIssue: AccessibilityIssue = {
          id: `forms_placeholder_${Date.now()}_${Math.random()}`,
          rule_id: ruleId,
          severity: 'serious',
          message: issue.message,
          element_selector: issue.selector,
          element_html: issue.element,
          location_path: issue.selector,
          fix_suggestion: this.getFormFixSuggestion(issue.type),
          wcag_criteria: this.getWCAGCriteria(issue.type).join(', '),
          impact_level: 'serious',
          detected_at: new Date().toISOString()
        };
        
        this.issues.push(accessibilityIssue);
      }
    } catch (error) {
      console.error('Error analyzing placeholder labels:', error);
    }
  }

  private async analyzeButtonNames(): Promise<void> {
    try {
      const buttonIssues = await this.page.evaluate(() => {
        const issues: any[] = [];
        const buttons = document.querySelectorAll('button, input[type="submit"], input[type="button"], input[type="reset"]');
        
        buttons.forEach((button: HTMLButtonElement | HTMLInputElement) => {
          const id = button.id;
          const hasText = button.textContent?.trim();
          const hasValue = (button as HTMLInputElement).value?.trim();
          const hasAriaLabel = button.getAttribute('aria-label');
          const hasAriaLabelledBy = button.getAttribute('aria-labelledby');
          const hasTitle = button.getAttribute('title');
          
          // ACC_FRM_10_BUTTON_NAME_MISSING
          if (!hasText && !hasValue && !hasAriaLabel && !hasAriaLabelledBy) {
            issues.push({
              type: 'ACC_FRM_10_BUTTON_NAME_MISSING',
              element: button.outerHTML,
              selector: button.tagName.toLowerCase() + (id ? `#${id}` : ''),
              message: 'Button is missing an accessible name'
            });
          }
          
          // ACC_FRM_11_SUBMIT_BUTTON_GENERIC
          if (button.type === 'submit') {
            const text = hasText || hasValue || hasAriaLabel || '';
            const isGeneric = ['submit', 'button', 'click here', 'go', 'send'].includes(text.toLowerCase().trim());
            
            if (isGeneric) {
              issues.push({
                type: 'ACC_FRM_11_SUBMIT_BUTTON_GENERIC',
                element: button.outerHTML,
                selector: button.tagName.toLowerCase() + (id ? `#${id}` : ''),
                message: 'Submit button has generic text that does not describe its purpose'
              });
            }
          }
        });
        
        return issues;
      });
      
      for (const issue of buttonIssues) {
        const ruleId = await this.getRuleId(issue.type);
        if (!ruleId) continue;
        
        const severity = issue.type === 'ACC_FRM_10_BUTTON_NAME_MISSING' ? 'critical' : 'moderate';
        
        const accessibilityIssue: AccessibilityIssue = {
          id: `forms_button_${issue.type}_${Date.now()}_${Math.random()}`,
          rule_id: ruleId,
          severity: severity,
          message: issue.message,
          element_selector: issue.selector,
          element_html: issue.element,
          location_path: issue.selector,
          fix_suggestion: this.getFormFixSuggestion(issue.type),
          wcag_criteria: this.getWCAGCriteria(issue.type).join(', '),
          impact_level: severity,
          detected_at: new Date().toISOString()
        };
        
        this.issues.push(accessibilityIssue);
      }
    } catch (error) {
      console.error('Error analyzing button names:', error);
    }
  }

  private async analyzeFormInstructions(): Promise<void> {
    try {
      const instructionIssues = await this.page.evaluate(() => {
        const issues: any[] = [];
        const forms = document.querySelectorAll('form');
        
        forms.forEach((form: HTMLFormElement, index) => {
          const formInputs = form.querySelectorAll('input:not([type="hidden"]), textarea, select');
          const hasInstructions = form.querySelector('.instructions, .help-text, [role="group"] p, fieldset legend');
          
          // ACC_FRM_12_FORM_INSTRUCTION_MISSING
          if (formInputs.length > 3 && !hasInstructions) {
            issues.push({
              type: 'ACC_FRM_12_FORM_INSTRUCTION_MISSING',
              element: form.outerHTML.substring(0, 200),
              selector: form.id ? `form#${form.id}` : `form:nth-of-type(${index + 1})`,
              message: 'Complex form is missing general instructions or help text'
            });
          }
          
          // Check for format requirements
          formInputs.forEach((input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) => {
            const inputType = (input as HTMLInputElement).type;
            const needsFormat = ['email', 'tel', 'password', 'date', 'time'].includes(inputType) || 
                              input.pattern || 
                              input.getAttribute('data-format');
            
            const hasFormatInfo = input.getAttribute('aria-describedby') ||
                                input.getAttribute('title') ||
                                input.nextElementSibling?.textContent?.includes('format') ||
                                input.nextElementSibling?.textContent?.includes('example');
                                
            // ACC_FRM_14_INPUT_FORMAT_UNCLEAR
            if (needsFormat && !hasFormatInfo) {
              issues.push({
                type: 'ACC_FRM_14_INPUT_FORMAT_UNCLEAR',
                element: input.outerHTML,
                selector: input.id ? `#${input.id}` : input.tagName.toLowerCase(),
                message: 'Input requires specific format but format requirements are not clearly communicated'
              });
            }
          });
        });
        
        return issues;
      });
      
      for (const issue of instructionIssues) {
        const ruleId = await this.getRuleId(issue.type);
        if (!ruleId) continue;
        
        const accessibilityIssue: AccessibilityIssue = {
          id: `forms_instruction_${issue.type}_${Date.now()}_${Math.random()}`,
          rule_id: ruleId,
          severity: 'moderate',
          message: issue.message,
          element_selector: issue.selector,
          element_html: issue.element,
          location_path: issue.selector,
          fix_suggestion: this.getFormFixSuggestion(issue.type),
          wcag_criteria: this.getWCAGCriteria(issue.type).join(', '),
          impact_level: 'moderate',
          detected_at: new Date().toISOString()
        };
        
        this.issues.push(accessibilityIssue);
      }
    } catch (error) {
      console.error('Error analyzing form instructions:', error);
    }
  }

  private async analyzeAutoComplete(): Promise<void> {
    try {
      const autocompleteIssues = await this.page.evaluate(() => {
        const issues: any[] = [];
        const personalDataInputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="password"]');
        
        personalDataInputs.forEach((input: HTMLInputElement) => {
          const name = input.name?.toLowerCase() || '';
          const id = input.id?.toLowerCase() || '';
          const label = document.querySelector(`label[for="${input.id}"]`)?.textContent?.toLowerCase() || '';
          
          // Define patterns that suggest personal data
          const personalDataMap: { [key: string]: string } = {
            'email': 'email',
            'password': 'current-password',
            'fname|firstname|given.*name': 'given-name',
            'lname|lastname|family.*name|surname': 'family-name', 
            'address.*line.*1|address1|street': 'address-line1',
            'address.*line.*2|address2': 'address-line2',
            'city|town': 'address-level2',
            'state|province|region': 'address-level1',
            'zip|postal.*code|postcode': 'postal-code',
            'country': 'country',
            'phone|tel': 'tel',
            'organization|company': 'organization'
          };
          
          let expectedAutocomplete = null;
          for (const [pattern, autocomplete] of Object.entries(personalDataMap)) {
            const regex = new RegExp(pattern, 'i');
            if (regex.test(name) || regex.test(id) || regex.test(label)) {
              expectedAutocomplete = autocomplete;
              break;
            }
          }
          
          const currentAutocomplete = input.getAttribute('autocomplete');
          
          // ACC_FRM_13_AUTOCOMPLETE_MISSING
          if (expectedAutocomplete && !currentAutocomplete) {
            issues.push({
              type: 'ACC_FRM_13_AUTOCOMPLETE_MISSING',
              element: input.outerHTML,
              selector: input.id ? `#${input.id}` : input.tagName.toLowerCase(),
              message: `Input appears to collect ${expectedAutocomplete.replace('-', ' ')} but is missing autocomplete attribute`
            });
          }
        });
        
        return issues;
      });
      
      for (const issue of autocompleteIssues) {
        const ruleId = await this.getRuleId(issue.type);
        if (!ruleId) continue;
        
        const accessibilityIssue: AccessibilityIssue = {
          id: `forms_autocomplete_${Date.now()}_${Math.random()}`,
          rule_id: ruleId,
          severity: 'minor',
          message: issue.message,
          element_selector: issue.selector,
          element_html: issue.element,
          location_path: issue.selector,
          fix_suggestion: this.getFormFixSuggestion(issue.type),
          wcag_criteria: this.getWCAGCriteria(issue.type).join(', '),
          impact_level: 'minor',
          detected_at: new Date().toISOString()
        };
        
        this.issues.push(accessibilityIssue);
      }
    } catch (error) {
      console.error('Error analyzing autocomplete:', error);
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

  private getFormFixSuggestion(ruleId: string): string {
    const suggestions: { [key: string]: string } = {
      'ACC_FRM_01_LABEL_MISSING': 'Add a <label> element with "for" attribute matching the input ID, or use aria-label attribute',
      'ACC_FRM_02_LABEL_FOR_ID_MISMATCH': 'Ensure the label "for" attribute exactly matches the input "id" attribute',
      'ACC_FRM_03_LABEL_HIDDEN': 'Make the label visible to all users, or use aria-label for screen readers only',
      'ACC_FRM_04_FIELDSET_LEGEND_MISSING': 'Wrap related form controls in <fieldset> with descriptive <legend>',
      'ACC_FRM_05_REQUIRED_INDICATION': 'Add aria-required="true" and visual indicator (*) for required fields',
      'ACC_FRM_06_ERROR_IDENTIFICATION': 'Associate error messages with form fields using aria-describedby',
      'ACC_FRM_07_ERROR_SUGGESTION': 'Include specific suggestions for fixing the error in error messages',
      'ACC_FRM_08_INPUT_PURPOSE': 'Add autocomplete attribute to identify the input purpose',
      'ACC_FRM_09_PLACEHOLDER_LABEL': 'Use placeholder as hint only, provide proper label element',
      'label': 'Add descriptive labels to all form inputs using <label> elements',
      'button-name': 'Ensure all buttons have accessible names through text content or aria-label'
    };
    
    return suggestions[ruleId] || 'Review form accessibility best practices';
  }

  private getWCAGCriteria(ruleId: string): string[] {
    const criteria: { [key: string]: string[] } = {
      'ACC_FRM_01_LABEL_MISSING': ['3.3.2'],
      'ACC_FRM_02_LABEL_FOR_ID_MISMATCH': ['1.3.1'],
      'ACC_FRM_03_LABEL_HIDDEN': ['3.3.2'],
      'ACC_FRM_04_FIELDSET_LEGEND_MISSING': ['1.3.1'],
      'ACC_FRM_05_REQUIRED_INDICATION': ['3.3.2'],
      'ACC_FRM_06_ERROR_IDENTIFICATION': ['3.3.1'],
      'ACC_FRM_07_ERROR_SUGGESTION': ['3.3.3'],
      'ACC_FRM_08_INPUT_PURPOSE': ['1.3.5'],
      'ACC_FRM_09_PLACEHOLDER_LABEL': ['3.3.2'],
      'ACC_FRM_10_BUTTON_NAME_MISSING': ['4.1.2'],
      'ACC_FRM_11_SUBMIT_BUTTON_GENERIC': ['2.4.6'],
      'ACC_FRM_12_FORM_INSTRUCTION_MISSING': ['3.3.2'],
      'ACC_FRM_13_AUTOCOMPLETE_MISSING': ['1.3.5'],
      'ACC_FRM_14_INPUT_FORMAT_UNCLEAR': ['3.3.2'],
      'ACC_FRM_15_CHANGE_OF_CONTEXT': ['3.2.2'],
      'label': ['3.3.2'],
      'button-name': ['4.1.2']
    };
    
    return criteria[ruleId] || ['1.3.1'];
  }

  /**
   * Analyze custom form violations using custom detectors
   */
  private async analyzeCustomFormViolations(): Promise<void> {
    try {
      const customViolations = await detectCustomFormViolations(this.page);
      
      for (const violation of customViolations) {
        const ruleId = await this.getRuleId(violation.ruleKey);
        if (!ruleId) {
          console.warn(`Skipping custom form violation - rule not found in database: ${violation.ruleKey}`);
          continue;
        }
        
        // Process each element that violates the rule
        for (const element of violation.elements) {
          const accessibilityIssue: AccessibilityIssue = {
            id: `forms_custom_${violation.ruleKey}_${Date.now()}_${Math.random()}`,
            rule_id: ruleId,
            severity: violation.severity,
            message: violation.message,
            element_selector: element.selector,
            element_html: element.html,
            location_path: element.selector,
            fix_suggestion: this.getFormFixSuggestion(violation.ruleKey),
            wcag_criteria: this.getWCAGCriteria(violation.ruleKey).join(', '),
            impact_level: violation.severity,
            detected_at: new Date().toISOString()
          };
          
          this.issues.push(accessibilityIssue);
        }
      }
      
    } catch (error) {
      console.error('Error analyzing custom form violations:', error);
    }
  }
}