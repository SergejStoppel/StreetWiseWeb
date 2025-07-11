const logger = require('../../utils/logger');
const AnalysisUtils = require('../utils/AnalysisUtils');

class FormAnalyzer {
  
  async analyze(page, analysisId) {
    try {
      logger.info('Running form analysis', { analysisId });
      
      const formData = await page.evaluate(() => {
        const results = {
          // Basic form statistics
          totalForms: document.querySelectorAll('form').length,
          totalFormControls: document.querySelectorAll('input, select, textarea, button').length,
          
          // Form controls analysis
          formControls: (() => {
            const controls = Array.from(document.querySelectorAll('input, select, textarea'));
            const controlsData = {
              total: controls.length,
              withLabels: 0,
              withoutLabels: 0,
              withPlaceholder: 0,
              withAriaLabel: 0,
              withAriaLabelledby: 0,
              withTitle: 0,
              required: 0,
              requiredWithoutIndicator: 0,
              withErrorAssociation: 0,
              byType: {}
            };
            
            const labelAssociations = [];
            const unlabeledControls = [];
            
            controls.forEach((control, index) => {
              const tagName = control.tagName.toLowerCase();
              const type = control.type || 'text';
              const id = control.id;
              const name = control.name;
              
              // Count by type
              controlsData.byType[type] = (controlsData.byType[type] || 0) + 1;
              
              // Check for labels
              let hasLabel = false;
              let labelText = '';
              let labelMethod = '';
              
              // Method 1: Label with for attribute
              if (id) {
                const label = document.querySelector(`label[for="${id}"]`);
                if (label) {
                  hasLabel = true;
                  labelText = label.textContent.trim();
                  labelMethod = 'for-attribute';
                }
              }
              
              // Method 2: Wrapped in label
              if (!hasLabel) {
                const parentLabel = control.closest('label');
                if (parentLabel) {
                  hasLabel = true;
                  labelText = parentLabel.textContent.trim();
                  labelMethod = 'wrapped';
                }
              }
              
              // Method 3: aria-label
              if (!hasLabel && control.getAttribute('aria-label')) {
                hasLabel = true;
                labelText = control.getAttribute('aria-label');
                labelMethod = 'aria-label';
                controlsData.withAriaLabel++;
              }
              
              // Method 4: aria-labelledby
              if (!hasLabel && control.getAttribute('aria-labelledby')) {
                const ids = control.getAttribute('aria-labelledby').split(/\s+/);
                const labelElements = ids.map(id => document.getElementById(id)).filter(el => el);
                if (labelElements.length > 0) {
                  hasLabel = true;
                  labelText = labelElements.map(el => el.textContent.trim()).join(' ');
                  labelMethod = 'aria-labelledby';
                  controlsData.withAriaLabelledby++;
                }
              }
              
              // Method 5: title attribute (fallback)
              if (!hasLabel && control.getAttribute('title')) {
                hasLabel = true;
                labelText = control.getAttribute('title');
                labelMethod = 'title';
                controlsData.withTitle++;
              }
              
              // Count placeholders
              if (control.getAttribute('placeholder')) {
                controlsData.withPlaceholder++;
              }
              
              // Count required fields
              if (control.hasAttribute('required') || control.getAttribute('aria-required') === 'true') {
                controlsData.required++;
                
                // Check if required field has visual indicator
                const hasRequiredIndicator = !!(
                  labelText.includes('*') ||
                  control.getAttribute('aria-label')?.includes('required') ||
                  control.getAttribute('aria-labelledby') && 
                  document.querySelector(`#${control.getAttribute('aria-labelledby')}`)?.textContent.includes('*')
                );
                
                if (!hasRequiredIndicator) {
                  controlsData.requiredWithoutIndicator++;
                }
              }
              
              // Check for error association
              if (control.getAttribute('aria-describedby') || control.getAttribute('aria-invalid')) {
                controlsData.withErrorAssociation++;
              }
              
              if (hasLabel) {
                controlsData.withLabels++;
                labelAssociations.push({
                  controlType: `${tagName}[type="${type}"]`,
                  labelMethod,
                  labelText: labelText.substring(0, 50),
                  hasId: !!id,
                  hasName: !!name
                });
              } else {
                controlsData.withoutLabels++;
                unlabeledControls.push({
                  tagName,
                  type,
                  id: id || '',
                  name: name || '',
                  placeholder: control.getAttribute('placeholder') || '',
                  selector: control.id ? `#${control.id}` : 
                           control.className ? `.${control.className.split(' ')[0]}` : 
                           `${tagName}[type="${type}"]`
                });
              }
            });
            
            controlsData.labelAssociations = labelAssociations;
            controlsData.unlabeledControls = unlabeledControls;
            
            return controlsData;
          })(),
          
          // Fieldset and legend analysis
          fieldsets: (() => {
            const fieldsets = Array.from(document.querySelectorAll('fieldset'));
            return {
              total: fieldsets.length,
              withLegend: fieldsets.filter(fs => fs.querySelector('legend')).length,
              withoutLegend: fieldsets.filter(fs => !fs.querySelector('legend')).length,
              details: fieldsets.map(fs => ({
                hasLegend: !!fs.querySelector('legend'),
                legendText: fs.querySelector('legend')?.textContent.trim().substring(0, 50) || '',
                controlCount: fs.querySelectorAll('input, select, textarea').length
              }))
            };
          })(),
          
          // Button analysis
          buttons: (() => {
            const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"], input[type="reset"]'));
            const buttonData = {
              total: buttons.length,
              withText: 0,
              withAriaLabel: 0,
              withTitle: 0,
              withoutAccessibleName: 0,
              submitButtons: 0,
              resetButtons: 0,
              byType: {}
            };
            
            const inaccessibleButtons = [];
            
            buttons.forEach(button => {
              const tagName = button.tagName.toLowerCase();
              const type = button.type || 'button';
              
              buttonData.byType[type] = (buttonData.byType[type] || 0) + 1;
              
              if (type === 'submit') buttonData.submitButtons++;
              if (type === 'reset') buttonData.resetButtons++;
              
              let hasAccessibleName = false;
              
              // Check for accessible name
              if (button.textContent?.trim()) {
                hasAccessibleName = true;
                buttonData.withText++;
              }
              
              if (button.getAttribute('aria-label')) {
                hasAccessibleName = true;
                buttonData.withAriaLabel++;
              }
              
              if (button.getAttribute('title')) {
                hasAccessibleName = true;
                buttonData.withTitle++;
              }
              
              if (button.value && ['submit', 'button', 'reset'].includes(type)) {
                hasAccessibleName = true;
              }
              
              if (!hasAccessibleName) {
                buttonData.withoutAccessibleName++;
                inaccessibleButtons.push({
                  tagName,
                  type,
                  id: button.id || '',
                  className: button.className || '',
                  selector: button.id ? `#${button.id}` : 
                           button.className ? `.${button.className.split(' ')[0]}` : 
                           `${tagName}[type="${type}"]`
                });
              }
            });
            
            buttonData.inaccessibleButtons = inaccessibleButtons;
            return buttonData;
          })(),
          
          // Comprehensive error handling analysis (WCAG 3.3.1, 3.3.2, 3.3.3)
          errorHandling: (() => {
            const errorData = {
              // Basic error element detection
              errorElementsFound: 0,
              controlsWithAriaInvalid: 0,
              controlsWithAriaDescribedby: 0,
              alertRoles: 0,
              formsWithValidation: 0,
              
              // WCAG 3.3.1 - Error Identification
              errorIdentification: {
                controlsWithErrors: 0,
                controlsWithClearErrorMessages: 0,
                controlsWithProperErrorAssociation: 0,
                issues: []
              },
              
              // WCAG 3.3.2 - Labels or Instructions
              labelsAndInstructions: {
                controlsWithInstructions: 0,
                controlsWithFormatHints: 0,
                controlsWithExamples: 0,
                issues: []
              },
              
              // WCAG 3.3.3 - Error Suggestion
              errorSuggestion: {
                controlsWithSuggestions: 0,
                controlsWithCorrectiveText: 0,
                issues: []
              },
              
              // Error prevention analysis
              errorPrevention: {
                formsWithConfirmation: 0,
                formsWithReviewStep: 0,
                controlsWithRealTimeValidation: 0,
                issues: []
              }
            };
            
            // Find all error-related elements
            const errorSelectors = [
              '.error', '.invalid', '.field-error', '.form-error',
              '.error-message', '.validation-error', '.help-block.error',
              '[role="alert"]', '[aria-invalid="true"]', '.alert-danger',
              '.is-invalid', '.has-error'
            ];
            
            const errorElements = Array.from(document.querySelectorAll(errorSelectors.join(', ')));
            errorData.errorElementsFound = errorElements.length;
            
            // Analyze form controls for error handling
            const formControls = Array.from(document.querySelectorAll('input, select, textarea'));
            
            formControls.forEach((control, index) => {
              const controlId = control.id || `control-${index}`;
              const controlType = control.type || control.tagName.toLowerCase();
              
              // Check for aria-invalid
              if (control.getAttribute('aria-invalid') === 'true') {
                errorData.controlsWithAriaInvalid++;
                errorData.errorIdentification.controlsWithErrors++;
                
                // Check if error is properly described
                const describedBy = control.getAttribute('aria-describedby');
                if (describedBy) {
                  const errorElement = document.getElementById(describedBy);
                  if (errorElement) {
                    errorData.errorIdentification.controlsWithProperErrorAssociation++;
                    
                    // Check if error message is clear and helpful
                    const errorText = errorElement.textContent.trim();
                    if (errorText.length > 5 && !errorText.toLowerCase().includes('error')) {
                      errorData.errorIdentification.controlsWithClearErrorMessages++;
                    }
                    
                    // Check if error suggests correction
                    const suggestionKeywords = ['try', 'should', 'must', 'example', 'format', 'use'];
                    if (suggestionKeywords.some(keyword => errorText.toLowerCase().includes(keyword))) {
                      errorData.errorSuggestion.controlsWithSuggestions++;
                    }
                  } else {
                    errorData.errorIdentification.issues.push({
                      type: 'missing_error_element',
                      control: controlId,
                      message: `Control references error element '${describedBy}' that doesn't exist`
                    });
                  }
                } else {
                  errorData.errorIdentification.issues.push({
                    type: 'missing_error_association',
                    control: controlId,
                    message: 'Control marked as invalid but no error message associated'
                  });
                }
              }
              
              // Check for aria-describedby (instructions/hints)
              if (control.getAttribute('aria-describedby')) {
                errorData.controlsWithAriaDescribedby++;
                errorData.labelsAndInstructions.controlsWithInstructions++;
                
                const describedBy = control.getAttribute('aria-describedby');
                const descriptionElement = document.getElementById(describedBy);
                if (descriptionElement) {
                  const descText = descriptionElement.textContent.trim();
                  
                  // Check for format hints
                  const formatKeywords = ['format', 'example', 'pattern', 'must be', 'should be', 'yyyy-mm-dd', '@'];
                  if (formatKeywords.some(keyword => descText.toLowerCase().includes(keyword))) {
                    errorData.labelsAndInstructions.controlsWithFormatHints++;
                  }
                  
                  // Check for examples
                  if (descText.includes('example') || descText.includes('e.g.') || descText.includes('Ex:')) {
                    errorData.labelsAndInstructions.controlsWithExamples++;
                  }
                }
              }
              
              // Check for real-time validation
              if (control.getAttribute('oninput') || control.getAttribute('onblur') || 
                  control.getAttribute('onchange') || control.classList.contains('validate')) {
                errorData.errorPrevention.controlsWithRealTimeValidation++;
              }
              
              // Check for missing instructions on complex inputs
              if (['email', 'password', 'tel', 'url', 'date'].includes(controlType)) {
                if (!control.getAttribute('aria-describedby') && 
                    !control.getAttribute('placeholder') && 
                    !control.getAttribute('title')) {
                  errorData.labelsAndInstructions.issues.push({
                    type: 'missing_instructions',
                    control: controlId,
                    controlType: controlType,
                    message: `${controlType} input lacks format instructions or examples`
                  });
                }
              }
            });
            
            // Analyze forms for error prevention
            const forms = Array.from(document.querySelectorAll('form'));
            forms.forEach((form, index) => {
              const formId = form.id || `form-${index}`;
              
              // Check for validation
              if (form.getAttribute('novalidate') === null && 
                  (form.querySelector('[required]') || form.querySelector('[pattern]'))) {
                errorData.formsWithValidation++;
              }
              
              // Check for confirmation patterns
              if (form.querySelector('input[type="password"]') && 
                  form.querySelectorAll('input[type="password"]').length > 1) {
                errorData.errorPrevention.formsWithConfirmation++;
              }
              
              // Check for review/preview steps
              if (form.querySelector('.review, .preview, .summary') || 
                  form.querySelector('input[type="submit"][value*="review"]') ||
                  form.querySelector('button[type="submit"]')?.textContent.toLowerCase().includes('review')) {
                errorData.errorPrevention.formsWithReviewStep++;
              }
              
              // Check for critical form without confirmation
              const isCriticalForm = form.querySelector('input[type="password"]') || 
                                   form.querySelector('input[name*="delete"]') ||
                                   form.querySelector('input[name*="remove"]') ||
                                   form.action.includes('delete') ||
                                   form.action.includes('remove');
              
              if (isCriticalForm && !form.querySelector('.confirm, .confirmation') && 
                  !form.querySelector('input[type="checkbox"][required]')) {
                errorData.errorPrevention.issues.push({
                  type: 'missing_confirmation',
                  form: formId,
                  message: 'Critical form action lacks confirmation mechanism'
                });
              }
            });
            
            // Count alert roles
            errorData.alertRoles = document.querySelectorAll('[role="alert"]').length;
            
            // Calculate score based on error handling completeness
            const totalControls = formControls.length;
            const totalForms = forms.length;
            
            if (totalControls > 0) {
              const errorScore = Math.round(
                ((errorData.errorIdentification.controlsWithProperErrorAssociation / Math.max(errorData.errorIdentification.controlsWithErrors, 1)) * 25) +
                ((errorData.labelsAndInstructions.controlsWithInstructions / totalControls) * 25) +
                ((errorData.errorSuggestion.controlsWithSuggestions / Math.max(errorData.errorIdentification.controlsWithErrors, 1)) * 25) +
                ((errorData.errorPrevention.controlsWithRealTimeValidation / totalControls) * 25)
              );
              
              errorData.overallScore = Math.max(0, Math.min(100, errorScore));
            } else {
              errorData.overallScore = 100; // No forms = no error handling issues
            }
            
            // Generate issues summary
            errorData.totalIssues = 
              errorData.errorIdentification.issues.length +
              errorData.labelsAndInstructions.issues.length +
              errorData.errorSuggestion.issues.length +
              errorData.errorPrevention.issues.length;
            
            return errorData;
          })(),
          
          // Input types and accessibility
          inputTypes: (() => {
            const inputs = Array.from(document.querySelectorAll('input'));
            const typeAnalysis = {};
            
            inputs.forEach(input => {
              const type = input.type || 'text';
              if (!typeAnalysis[type]) {
                typeAnalysis[type] = {
                  count: 0,
                  withLabels: 0,
                  withPlaceholder: 0,
                  withAutocomplete: 0,
                  required: 0
                };
              }
              
              typeAnalysis[type].count++;
              
              // Check for labels (simplified check)
              if (input.id && document.querySelector(`label[for="${input.id}"]`) ||
                  input.closest('label') ||
                  input.getAttribute('aria-label') ||
                  input.getAttribute('aria-labelledby')) {
                typeAnalysis[type].withLabels++;
              }
              
              if (input.getAttribute('placeholder')) {
                typeAnalysis[type].withPlaceholder++;
              }
              
              if (input.getAttribute('autocomplete')) {
                typeAnalysis[type].withAutocomplete++;
              }
              
              if (input.hasAttribute('required')) {
                typeAnalysis[type].required++;
              }
            });
            
            return typeAnalysis;
          })()
        };

        return results;
      });

      return formData;
    } catch (error) {
      logger.error('Form analysis failed:', { error: error.message, analysisId });
      throw error;
    }
  }

  calculateScore(formData) {
    if (!formData || formData.totalFormControls === 0) return 100; // No forms to evaluate
    
    let score = 100;
    
    // Penalize unlabeled form controls heavily
    if (formData.formControls?.withoutLabels > 0) {
      const unlabeledPercentage = (formData.formControls.withoutLabels / formData.formControls.total) * 100;
      score -= Math.min(unlabeledPercentage * 2, 40); // Up to 40 points off
    }
    
    // Penalize required fields without indicators
    if (formData.formControls?.requiredWithoutIndicator > 0) {
      score -= Math.min(formData.formControls.requiredWithoutIndicator * 8, 25);
    }
    
    // Penalize fieldsets without legends
    if (formData.fieldsets?.withoutLegend > 0) {
      score -= Math.min(formData.fieldsets.withoutLegend * 10, 20);
    }
    
    // Penalize buttons without accessible names
    if (formData.buttons?.withoutAccessibleName > 0) {
      score -= Math.min(formData.buttons.withoutAccessibleName * 12, 30);
    }
    
    // Slight penalty for over-reliance on placeholders
    if (formData.formControls?.withPlaceholder > formData.formControls?.withLabels * 0.5) {
      score -= 5;
    }
    
    // Error handling score impact
    if (formData.errorHandling) {
      const errorHandling = formData.errorHandling;
      
      // Penalize missing error identification
      if (errorHandling.errorIdentification.issues.length > 0) {
        score -= Math.min(errorHandling.errorIdentification.issues.length * 10, 25);
      }
      
      // Penalize missing instructions
      if (errorHandling.labelsAndInstructions.issues.length > 0) {
        score -= Math.min(errorHandling.labelsAndInstructions.issues.length * 5, 15);
      }
      
      // Penalize missing error suggestions
      if (errorHandling.errorIdentification.controlsWithErrors > 0 && 
          errorHandling.errorSuggestion.controlsWithSuggestions === 0) {
        score -= 10;
      }
      
      // Penalize missing error prevention
      if (errorHandling.errorPrevention.issues.length > 0) {
        score -= Math.min(errorHandling.errorPrevention.issues.length * 8, 20);
      }
      
      // Bonus for good error handling
      if (errorHandling.overallScore > 80) {
        score += 5;
      }
    }
    
    return Math.max(0, Math.round(score));
  }

  generateRecommendations(formData, language = 'en') {
    const recommendations = [];
    
    if (!formData || formData.totalFormControls === 0) return recommendations;
    
    // Unlabeled form controls
    if (formData.formControls?.withoutLabels > 0) {
      recommendations.push({
        type: 'form',
        priority: 'high',
        issue: 'Unlabeled form controls',
        description: `Found ${formData.formControls.withoutLabels} form controls without proper labels`,
        suggestion: 'Add <label> elements or aria-label attributes to all form controls'
      });
    }
    
    // Required fields without visual indicators
    if (formData.formControls?.requiredWithoutIndicator > 0) {
      recommendations.push({
        type: 'form',
        priority: 'high',
        issue: 'Required fields without indicators',
        description: `Found ${formData.formControls.requiredWithoutIndicator} required fields without visual indicators`,
        suggestion: 'Add asterisks (*) or "required" text to visually indicate required fields'
      });
    }
    
    // Fieldsets without legends
    if (formData.fieldsets?.withoutLegend > 0) {
      recommendations.push({
        type: 'form',
        priority: 'medium',
        issue: 'Fieldsets without legends',
        description: `Found ${formData.fieldsets.withoutLegend} fieldsets without legend elements`,
        suggestion: 'Add <legend> elements to describe the purpose of each fieldset'
      });
    }
    
    // Buttons without accessible names
    if (formData.buttons?.withoutAccessibleName > 0) {
      recommendations.push({
        type: 'form',
        priority: 'high',
        issue: 'Buttons without accessible names',
        description: `Found ${formData.buttons.withoutAccessibleName} buttons without accessible names`,
        suggestion: 'Add text content, aria-label, or value attributes to all buttons'
      });
    }
    
    // Over-reliance on placeholders
    if (formData.formControls?.withPlaceholder > formData.formControls?.withLabels) {
      recommendations.push({
        type: 'form',
        priority: 'medium',
        issue: 'Over-reliance on placeholder text',
        description: 'More form controls use placeholders than proper labels',
        suggestion: 'Use proper labels instead of relying solely on placeholder text'
      });
    }
    
    // Error handling recommendations
    if (formData.errorHandling) {
      const errorHandling = formData.errorHandling;
      
      // Missing error identification (WCAG 3.3.1)
      if (errorHandling.errorIdentification.issues.length > 0) {
        errorHandling.errorIdentification.issues.forEach(issue => {
          recommendations.push({
            type: 'form',
            priority: 'high',
            issue: 'Error identification issue',
            description: issue.message,
            suggestion: issue.type === 'missing_error_association' ? 
              'Add aria-describedby attribute to associate error messages with form controls' :
              'Ensure error elements referenced by aria-describedby actually exist',
            wcagCriterion: '3.3.1'
          });
        });
      }
      
      // Missing instructions (WCAG 3.3.2)
      if (errorHandling.labelsAndInstructions.issues.length > 0) {
        errorHandling.labelsAndInstructions.issues.forEach(issue => {
          recommendations.push({
            type: 'form',
            priority: 'medium',
            issue: 'Missing input instructions',
            description: issue.message,
            suggestion: 'Add aria-describedby with format instructions, examples, or helpful hints',
            wcagCriterion: '3.3.2'
          });
        });
      }
      
      // Missing error suggestions (WCAG 3.3.3)
      if (errorHandling.errorIdentification.controlsWithErrors > 0 && 
          errorHandling.errorSuggestion.controlsWithSuggestions === 0) {
        recommendations.push({
          type: 'form',
          priority: 'high',
          issue: 'Error messages lack suggestions',
          description: 'Form controls have errors but error messages don\'t suggest how to fix them',
          suggestion: 'Include specific suggestions in error messages (e.g., "Use format: name@example.com")',
          wcagCriterion: '3.3.3'
        });
      }
      
      // Missing error prevention
      if (errorHandling.errorPrevention.issues.length > 0) {
        errorHandling.errorPrevention.issues.forEach(issue => {
          recommendations.push({
            type: 'form',
            priority: 'medium',
            issue: 'Missing error prevention',
            description: issue.message,
            suggestion: 'Add confirmation mechanisms for critical actions (checkboxes, confirmation dialogs)',
            wcagCriterion: '3.3.4'
          });
        });
      }
      
      // No validation mechanisms
      if (formData.totalForms > 0 && errorHandling.formsWithValidation === 0) {
        recommendations.push({
          type: 'form',
          priority: 'medium',
          issue: 'No form validation detected',
          description: 'Forms should provide validation and error handling',
          suggestion: 'Implement client-side validation with proper error messaging'
        });
      }
    }
    
    // Forms without submit buttons
    if (formData.totalForms > 0 && formData.buttons?.submitButtons === 0) {
      recommendations.push({
        type: 'form',
        priority: 'medium',
        issue: 'No submit buttons found',
        description: 'Forms should have clearly identifiable submit buttons',
        suggestion: 'Add submit buttons with clear, descriptive text'
      });
    }
    
    return recommendations;
  }
}

module.exports = FormAnalyzer;