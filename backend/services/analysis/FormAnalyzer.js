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
          
          // Error handling analysis
          errorHandling: (() => {
            const errorElements = Array.from(document.querySelectorAll('.error, .invalid, [role="alert"], [aria-invalid="true"]'));
            const errorData = {
              errorElementsFound: errorElements.length,
              controlsWithAriaInvalid: document.querySelectorAll('[aria-invalid="true"]').length,
              controlsWithAriaDescribedby: document.querySelectorAll('input[aria-describedby], select[aria-describedby], textarea[aria-describedby]').length,
              alertRoles: document.querySelectorAll('[role="alert"]').length
            };
            
            // Check for form validation patterns
            const formsWithValidation = Array.from(document.querySelectorAll('form')).filter(form => {
              return form.getAttribute('novalidate') !== null || 
                     form.querySelector('[required]') || 
                     form.querySelector('[pattern]') ||
                     form.querySelector('[aria-invalid]');
            });
            
            errorData.formsWithValidation = formsWithValidation.length;
            
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
    
    // No error handling mechanisms
    if (formData.totalForms > 0 && formData.errorHandling?.formsWithValidation === 0) {
      recommendations.push({
        type: 'form',
        priority: 'medium',
        issue: 'No form validation detected',
        description: 'Forms should provide validation and error handling',
        suggestion: 'Implement client-side validation with proper error messaging'
      });
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