import { supabase } from '../config/supabase';
import { createLogger } from '../config/logger';

const logger = createLogger('insert-missing-rules');

async function insertMissingRules() {
  try {
    logger.info('Starting to insert missing rules...');

    // Get Accessibility module ID
    const { data: accessibilityModule, error: moduleError } = await supabase
      .from('analysis_modules')
      .select('id')
      .eq('name', 'Accessibility')
      .single();

    if (moduleError || !accessibilityModule) {
      throw new Error(`Failed to get Accessibility module: ${moduleError?.message}`);
    }

    logger.info('Found Accessibility module', { moduleId: accessibilityModule.id });

    // Check which rules already exist
    const { data: existingRules } = await supabase
      .from('rules')
      .select('rule_key')
      .eq('module_id', accessibilityModule.id)
      .in('rule_key', ['color-contrast', 'color-contrast-enhanced', 'link-in-text-block']);

    const existingRuleKeys = existingRules?.map(r => r.rule_key) || [];
    logger.info('Existing rules found', { existingRuleKeys });

    // Define the rules to insert
    const rulesToInsert = [
      {
        rule_key: 'color-contrast',
        name: 'Color Contrast (Minimum)',
        description: 'Text must have sufficient contrast against background (WCAG AA)',
        default_severity: 'critical'
      },
      {
        rule_key: 'color-contrast-enhanced',
        name: 'Color Contrast (Enhanced)',
        description: 'Text must have enhanced contrast against background (WCAG AAA)',
        default_severity: 'serious'
      },
      {
        rule_key: 'link-in-text-block',
        name: 'Links in Text Block',
        description: 'Links must have sufficient color contrast to be distinguishable from surrounding text',
        default_severity: 'serious'
      }
    ].filter(rule => !existingRuleKeys.includes(rule.rule_key));

    if (rulesToInsert.length === 0) {
      logger.info('All rules already exist, nothing to insert');
      return;
    }

    logger.info('Inserting new rules', { count: rulesToInsert.length, rules: rulesToInsert.map(r => r.rule_key) });

    // Insert the missing rules
    const rulesWithModuleId = rulesToInsert.map(rule => ({
      ...rule,
      module_id: accessibilityModule.id
    }));

    const { data: insertedRules, error: insertError } = await supabase
      .from('rules')
      .insert(rulesWithModuleId)
      .select();

    if (insertError) {
      throw new Error(`Failed to insert rules: ${insertError.message}`);
    }

    logger.info('Successfully inserted rules', { insertedCount: insertedRules?.length });

    // Get compliance standards for mapping
    const { data: standards } = await supabase
      .from('compliance_standards')
      .select('id, name')
      .in('name', ['WCAG 2.1 AA', 'WCAG 2.1 AAA', 'Section 508']);

    if (standards && standards.length > 0) {
      logger.info('Mapping rules to compliance standards...');

      // Get all our color contrast rules
      const { data: colorContrastRules } = await supabase
        .from('rules')
        .select('id, rule_key')
        .eq('module_id', accessibilityModule.id)
        .in('rule_key', ['color-contrast', 'color-contrast-enhanced', 'link-in-text-block']);

      if (colorContrastRules) {
        const mappings = [];

        for (const standard of standards) {
          for (const rule of colorContrastRules) {
            // Map all rules to WCAG AA and AAA
            if (standard.name === 'WCAG 2.1 AA' || standard.name === 'WCAG 2.1 AAA') {
              mappings.push({
                standard_id: standard.id,
                rule_id: rule.id
              });
            }
            // Map only basic contrast rules to Section 508
            else if (standard.name === 'Section 508' && ['color-contrast', 'link-in-text-block'].includes(rule.rule_key)) {
              mappings.push({
                standard_id: standard.id,
                rule_id: rule.id
              });
            }
          }
        }

        if (mappings.length > 0) {
          // Use upsert to avoid conflicts
          const { error: mappingError } = await supabase
            .from('standard_rules_mapping')
            .upsert(mappings, { onConflict: 'standard_id,rule_id' });

          if (mappingError) {
            logger.warn('Failed to insert some standard mappings', { error: mappingError.message });
          } else {
            logger.info('Successfully mapped rules to standards', { mappingCount: mappings.length });
          }
        }
      }
    }

    logger.info('Missing rules insertion completed successfully');
  } catch (error) {
    logger.error('Failed to insert missing rules', { error: error.message });
    throw error;
  }
}

// Run the script if called directly
if (require.main === module) {
  insertMissingRules()
    .then(() => {
      logger.info('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Script failed', { error: error.message });
      process.exit(1);
    });
}

export default insertMissingRules;