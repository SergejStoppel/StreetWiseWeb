/**
 * Rule Mapping Utility
 * Maps axe-core rule IDs to SiteCraft database rule keys
 */

export interface RuleMapping {
  [axeRuleId: string]: string;
}

/**
 * Maps axe-core rule IDs to database rule keys for accurate violation reporting
 * This ensures violations found by axe-core are properly stored with the correct rule references
 */
export const AXE_TO_DATABASE_MAPPING: RuleMapping = {
  // ====================================
  // ARIA RULES MAPPING
  // ====================================
  
  // Core ARIA attribute rules
  'aria-allowed-attr': 'ACC_ARIA_02_REQUIRED_ATTR_MISSING',
  'aria-allowed-role': 'ACC_ARIA_01_ROLE_INVALID',
  'aria-command-name': 'ACC_FRM_10_BUTTON_NAME_MISSING',
  'aria-hidden-body': 'ACC_ARIA_05_HIDDEN_FOCUSABLE',
  'aria-hidden-focus': 'ACC_ARIA_05_HIDDEN_FOCUSABLE',
  'aria-input-field-name': 'ACC_FRM_01_LABEL_MISSING',
  'aria-meter-name': 'ACC_ARIA_02_REQUIRED_ATTR_MISSING',
  'aria-progressbar-name': 'ACC_ARIA_02_REQUIRED_ATTR_MISSING',
  'aria-required-attr': 'ACC_ARIA_02_REQUIRED_ATTR_MISSING',
  'aria-required-children': 'ACC_ARIA_02_REQUIRED_ATTR_MISSING',
  'aria-required-parent': 'ACC_ARIA_02_REQUIRED_ATTR_MISSING',
  'aria-roledescription': 'ACC_ARIA_03_INVALID_ATTR_VALUE',
  'aria-roles': 'ACC_ARIA_01_ROLE_INVALID',
  'aria-toggle-field-name': 'ACC_ARIA_09_EXPANDED_MISSING',
  'aria-tooltip-name': 'ACC_ARIA_02_REQUIRED_ATTR_MISSING',
  'aria-valid-attr': 'ACC_ARIA_02_REQUIRED_ATTR_MISSING',
  'aria-valid-attr-value': 'ACC_ARIA_03_INVALID_ATTR_VALUE',
  
  // Newly activated ARIA rules
  'aria-braillelabel-equivalent': 'ACC_ARIA_07_LABELLEDBY_MISSING',
  'aria-text': 'ACC_ARIA_02_REQUIRED_ATTR_MISSING',
  'aria-treeitem-name': 'ACC_ARIA_02_REQUIRED_ATTR_MISSING',
  
  // ====================================
  // FORM & INPUT RULES MAPPING
  // ====================================
  
  'button-name': 'ACC_FRM_10_BUTTON_NAME_MISSING',
  'input-button-name': 'ACC_FRM_10_BUTTON_NAME_MISSING',
  'link-name': 'ACC_STR_01_HEADING_ORDER', // Will need dedicated link rule
  'form-field-multiple-labels': 'ACC_FRM_02_LABEL_FOR_ID_MISMATCH',
  'label': 'ACC_FRM_01_LABEL_MISSING',
  'label-title-only': 'ACC_FRM_03_LABEL_HIDDEN',
  
  // ====================================
  // IMAGE & MEDIA RULES MAPPING  
  // ====================================
  
  'image-alt': 'ACC_IMG_01_ALT_TEXT_MISSING',
  'input-image-alt': 'ACC_IMG_01_ALT_TEXT_MISSING',
  'area-alt': 'ACC_IMG_01_ALT_TEXT_MISSING',
  
  // ====================================
  // STRUCTURE & NAVIGATION RULES MAPPING
  // ====================================
  
  'empty-heading': 'ACC_STR_01_HEADING_ORDER',
  'heading-order': 'ACC_STR_01_HEADING_ORDER',
  'frame-title': 'ACC_STR_06_PAGE_TITLE_MISSING',
  'document-title': 'ACC_STR_06_PAGE_TITLE_MISSING',
  
  // Language rules
  'html-has-lang': 'ACC_STR_04_PAGE_LANG_MISSING',
  'html-lang-valid': 'ACC_STR_04_PAGE_LANG_MISSING',
  'valid-lang': 'ACC_STR_05_ELEMENT_LANG_MISSING',
  
  // Newly activated structural rules
  'bypass': 'ACC_STR_08_SKIP_LINK_MISSING',
  'landmark-one-main': 'ACC_STR_10_LANDMARK_MISSING',
  'landmark-complementary-is-top-level': 'ACC_STR_11_LANDMARK_DUPLICATE',
  'landmark-main-is-top-level': 'ACC_STR_10_LANDMARK_MISSING',
  'page-has-heading-one': 'ACC_STR_02_NO_H1',
  'landmark-unique': 'ACC_STR_11_LANDMARK_DUPLICATE',
  
  // List structure rules
  'list': 'ACC_STR_12_LIST_STRUCTURE_INVALID',
  'listitem': 'ACC_STR_12_LIST_STRUCTURE_INVALID',
  'definition-list': 'ACC_STR_12_LIST_STRUCTURE_INVALID',
  
  // ====================================
  // COLOR & VISUAL RULES MAPPING
  // ====================================
  
  'color-contrast': 'ACC_CLR_01_TEXT_CONTRAST_RATIO',
  'color-contrast-enhanced': 'ACC_CLR_02_LARGE_TEXT_CONTRAST',
  'link-in-text-block': 'ACC_CLR_01_TEXT_CONTRAST_RATIO',
  
  // Newly activated visual rules
  'focus-order-semantics': 'ACC_KBD_05_FOCUS_ORDER_LOGICAL',
  'scrollable-region-focusable': 'ACC_KBD_04_INTERACTIVE_NOT_FOCUSABLE',
};

/**
 * Reverse mapping from database rule keys to axe-core rule IDs
 * Useful for understanding which axe rules map to which database rules
 */
export const DATABASE_TO_AXE_MAPPING: { [dbRuleKey: string]: string[] } = {};

// Build reverse mapping
Object.entries(AXE_TO_DATABASE_MAPPING).forEach(([axeRule, dbRule]) => {
  if (!DATABASE_TO_AXE_MAPPING[dbRule]) {
    DATABASE_TO_AXE_MAPPING[dbRule] = [];
  }
  DATABASE_TO_AXE_MAPPING[dbRule].push(axeRule);
});

/**
 * Get the database rule key for an axe-core rule ID
 * @param axeRuleId - The axe-core rule ID (e.g., 'color-contrast')
 * @returns Database rule key or null if no mapping exists
 */
export function getDatabaseRuleKey(axeRuleId: string): string | null {
  return AXE_TO_DATABASE_MAPPING[axeRuleId] || null;
}

/**
 * Get all axe-core rule IDs that map to a database rule key
 * @param databaseRuleKey - The database rule key (e.g., 'ACC_CLR_01_TEXT_CONTRAST_RATIO')
 * @returns Array of axe-core rule IDs that map to this database rule
 */
export function getAxeRulesForDatabaseRule(databaseRuleKey: string): string[] {
  return DATABASE_TO_AXE_MAPPING[databaseRuleKey] || [];
}

/**
 * Validate that all axe rules being used have database mappings
 * @param axeRuleIds - Array of axe-core rule IDs being used
 * @returns Object with mapped and unmapped rules
 */
export function validateRuleMappings(axeRuleIds: string[]) {
  const mapped: string[] = [];
  const unmapped: string[] = [];
  
  axeRuleIds.forEach(ruleId => {
    if (AXE_TO_DATABASE_MAPPING[ruleId]) {
      mapped.push(ruleId);
    } else {
      unmapped.push(ruleId);
    }
  });
  
  return { mapped, unmapped };
}

/**
 * Get severity mapping based on axe impact levels
 * Maps axe-core impact levels to our database severity levels
 */
export const IMPACT_TO_SEVERITY_MAPPING = {
  'minor': 'minor',
  'moderate': 'moderate', 
  'serious': 'serious',
  'critical': 'critical'
} as const;

export type AxeImpact = keyof typeof IMPACT_TO_SEVERITY_MAPPING;
export type DatabaseSeverity = typeof IMPACT_TO_SEVERITY_MAPPING[AxeImpact];

/**
 * Convert axe-core impact level to database severity level
 * @param impact - Axe-core impact level
 * @returns Database severity level
 */
export function mapImpactToSeverity(impact: AxeImpact): DatabaseSeverity {
  return IMPACT_TO_SEVERITY_MAPPING[impact] || 'moderate';
}

/**
 * Category mapping for accessibility rules
 * Maps database rule keys to frontend category keys
 */
export const RULE_CATEGORY_MAPPING = {
  // Images & Media category
  'ACC_IMG_01_ALT_TEXT_MISSING': 'images-media',
  'ACC_IMG_02_ALT_TEXT_DECORATIVE': 'images-media',
  'ACC_IMG_03_ALT_TEXT_INFORMATIVE': 'images-media',
  'ACC_IMG_04_COMPLEX_IMAGE_DESC': 'images-media',
  'ACC_IMG_05_IMAGE_TEXT_REDUNDANT': 'images-media',
  'ACC_MED_01_VIDEO_CAPTIONS': 'images-media',
  'ACC_MED_02_AUDIO_TRANSCRIPT': 'images-media',
  'ACC_MED_03_VIDEO_AUDIO_DESC': 'images-media',

  // Forms & Input Controls category
  'ACC_FRM_01_LABEL_MISSING': 'forms-input',
  'ACC_FRM_02_LABEL_FOR_ID_MISMATCH': 'forms-input',
  'ACC_FRM_03_LABEL_HIDDEN': 'forms-input',
  'ACC_FRM_04_FIELDSET_LEGEND_MISSING': 'forms-input',
  'ACC_FRM_05_REQUIRED_INDICATION': 'forms-input',
  'ACC_FRM_06_ERROR_IDENTIFICATION': 'forms-input',
  'ACC_FRM_07_ERROR_SUGGESTION': 'forms-input',
  'ACC_FRM_08_INPUT_PURPOSE': 'forms-input',
  'ACC_FRM_09_PLACEHOLDER_LABEL': 'forms-input',
  'ACC_FRM_10_BUTTON_NAME_MISSING': 'forms-input',
  'ACC_FRM_11_SUBMIT_BUTTON_GENERIC': 'forms-input',
  'ACC_FRM_12_FORM_INSTRUCTION_MISSING': 'forms-input',
  'ACC_FRM_13_AUTOCOMPLETE_MISSING': 'forms-input',
  'ACC_FRM_14_INPUT_FORMAT_UNCLEAR': 'forms-input',
  'ACC_FRM_15_CHANGE_OF_CONTEXT': 'forms-input',

  // ARIA Implementation category
  'ACC_ARIA_01_ROLE_INVALID': 'aria',
  'ACC_ARIA_02_REQUIRED_ATTR_MISSING': 'aria',
  'ACC_ARIA_03_INVALID_ATTR_VALUE': 'aria',
  'ACC_ARIA_04_REDUNDANT_ROLE': 'aria',
  'ACC_ARIA_05_HIDDEN_FOCUSABLE': 'aria',
  'ACC_ARIA_06_LIVE_REGION_MISSING': 'aria',
  'ACC_ARIA_07_LABELLEDBY_MISSING': 'aria',
  'ACC_ARIA_08_DESCRIBEDBY_MISSING': 'aria',
  'ACC_ARIA_09_EXPANDED_MISSING': 'aria',
  'ACC_ARIA_10_CONTROLS_MISSING': 'aria',

  // Keyboard Navigation category
  'ACC_KBD_01_FOCUS_VISIBLE': 'keyboard',
  'ACC_KBD_02_KEYBOARD_TRAP': 'keyboard',
  'ACC_KBD_03_TABINDEX_POSITIVE': 'keyboard',
  'ACC_KBD_04_INTERACTIVE_NOT_FOCUSABLE': 'keyboard',
  'ACC_KBD_05_FOCUS_ORDER_LOGICAL': 'keyboard',
  'ACC_KBD_06_BYPASS_BLOCKS': 'keyboard',
  'ACC_KBD_07_KEYBOARD_SHORTCUTS': 'keyboard',
  'ACC_KBD_08_ACCESS_KEY_DUPLICATE': 'keyboard',

  // Color & Visual Design category
  'ACC_CLR_01_TEXT_CONTRAST_RATIO': 'color-visual',
  'ACC_CLR_02_LARGE_TEXT_CONTRAST': 'color-visual',
  'ACC_CLR_03_NON_TEXT_CONTRAST': 'color-visual',
  'ACC_CLR_04_COLOR_ONLY_MEANING': 'color-visual',
  'ACC_CLR_05_FOCUS_CONTRAST': 'color-visual',
  'ACC_CLR_06_TEXT_SPACING': 'color-visual',
  'ACC_CLR_07_REFLOW_CONTENT': 'color-visual',

  // Content Structure & Navigation category
  'ACC_STR_01_HEADING_ORDER': 'content-structure',
  'ACC_STR_02_NO_H1': 'content-structure',
  'ACC_STR_03_MULTIPLE_H1': 'content-structure',
  'ACC_STR_04_PAGE_LANG_MISSING': 'content-structure',
  'ACC_STR_05_ELEMENT_LANG_MISSING': 'content-structure',
  'ACC_STR_06_PAGE_TITLE_MISSING': 'content-structure',
  'ACC_STR_07_PAGE_TITLE_UNINFORMATIVE': 'content-structure',
  'ACC_STR_08_SKIP_LINK_MISSING': 'content-structure',
  'ACC_STR_09_SKIP_LINK_BROKEN': 'content-structure',
  'ACC_STR_10_LANDMARK_MISSING': 'content-structure',
  'ACC_STR_11_LANDMARK_DUPLICATE': 'content-structure',
  'ACC_STR_12_LIST_STRUCTURE_INVALID': 'content-structure',

  // Tables & Data Presentation category
  'ACC_TBL_01_HEADER_MISSING': 'tables-data',
  'ACC_TBL_02_CAPTION_MISSING': 'tables-data',
  'ACC_TBL_03_SCOPE_MISSING': 'tables-data',
  'ACC_TBL_04_COMPLEX_TABLE_HEADERS': 'tables-data',
  'ACC_TBL_05_LAYOUT_TABLE_HEADERS': 'tables-data',

  // Axe-core rule mappings to categories
  'color-contrast': 'color-visual',
  'color-contrast-enhanced': 'color-visual',
  'link-in-text-block': 'color-visual',
  'focus-order-semantics': 'keyboard',
  'scrollable-region-focusable': 'keyboard'
};

/**
 * Get the category for a given rule key
 * @param ruleKey - Database rule key or axe-core rule ID
 * @returns Category key or 'general' if no mapping found
 */
export function getRuleCategory(ruleKey: string): string {
  return RULE_CATEGORY_MAPPING[ruleKey] || 'general';
}