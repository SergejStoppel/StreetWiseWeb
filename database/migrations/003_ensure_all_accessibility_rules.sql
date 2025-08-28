-- Migration: Ensure all accessibility rules are properly seeded
-- This migration ensures all 60+ accessibility rules defined in the plan are present in the database
-- It uses INSERT ... ON CONFLICT DO NOTHING to be idempotent

-- Get module IDs
DO $$
DECLARE
    accessibility_module_id UUID;
    wcag_aa_standard_id UUID;
    wcag_aaa_standard_id UUID;
    section_508_standard_id UUID;
BEGIN
    -- Get module ID for Accessibility
    SELECT id INTO accessibility_module_id FROM analysis_modules WHERE name = 'Accessibility';
    
    -- Get standard IDs
    SELECT id INTO wcag_aa_standard_id FROM compliance_standards WHERE name = 'WCAG 2.1 AA';
    SELECT id INTO wcag_aaa_standard_id FROM compliance_standards WHERE name = 'WCAG 2.1 AAA';
    SELECT id INTO section_508_standard_id FROM compliance_standards WHERE name = 'Section 508';
    
    -- Ensure all accessibility rules exist (using ON CONFLICT to make idempotent)
    -- This handles cases where rules might be missing or need updating
    
    -- Images & Media Rules (8 rules)
    INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
    (accessibility_module_id, 'ACC_IMG_01_ALT_TEXT_MISSING', 'Image Missing Alt Text', 'Images must have alternative text for screen readers', 'critical'),
    (accessibility_module_id, 'ACC_IMG_02_ALT_TEXT_DECORATIVE', 'Decorative Image Alt Text', 'Decorative images should have empty alt attributes', 'serious'),
    (accessibility_module_id, 'ACC_IMG_03_ALT_TEXT_INFORMATIVE', 'Uninformative Alt Text', 'Alt text should be descriptive and informative', 'serious'),
    (accessibility_module_id, 'ACC_IMG_04_COMPLEX_IMAGE_DESC', 'Complex Image Missing Description', 'Complex images need detailed descriptions', 'serious'),
    (accessibility_module_id, 'ACC_IMG_05_IMAGE_TEXT_REDUNDANT', 'Image Alt Text Duplicates Adjacent Text', 'Alt text should not duplicate nearby text', 'moderate'),
    (accessibility_module_id, 'ACC_MED_01_VIDEO_CAPTIONS', 'Video Missing Captions', 'Videos must have captions for deaf and hard of hearing users', 'critical'),
    (accessibility_module_id, 'ACC_MED_02_AUDIO_TRANSCRIPT', 'Audio Missing Transcript', 'Audio content must have text transcripts', 'critical'),
    (accessibility_module_id, 'ACC_MED_03_VIDEO_AUDIO_DESC', 'Video Missing Audio Description', 'Videos should have audio descriptions for blind users', 'moderate')
    ON CONFLICT (rule_key) DO UPDATE SET 
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        default_severity = EXCLUDED.default_severity;

    -- Content Structure & Navigation Rules (12 rules)
    INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
    (accessibility_module_id, 'ACC_STR_01_HEADING_ORDER', 'Improper Heading Order', 'Headings should follow logical hierarchical order', 'serious'),
    (accessibility_module_id, 'ACC_STR_02_NO_H1', 'Page Missing H1 Heading', 'Every page should have exactly one H1 heading', 'serious'),
    (accessibility_module_id, 'ACC_STR_03_MULTIPLE_H1', 'Multiple H1 Headings', 'Pages should have only one H1 heading', 'moderate'),
    (accessibility_module_id, 'ACC_STR_04_PAGE_LANG_MISSING', 'Page Language Not Defined', 'HTML lang attribute must be specified', 'critical'),
    (accessibility_module_id, 'ACC_STR_05_ELEMENT_LANG_MISSING', 'Element Language Not Defined', 'Foreign language content should specify lang attribute', 'moderate'),
    (accessibility_module_id, 'ACC_STR_06_PAGE_TITLE_MISSING', 'Page Title Missing', 'Every page must have a descriptive title', 'critical'),
    (accessibility_module_id, 'ACC_STR_07_PAGE_TITLE_UNINFORMATIVE', 'Page Title Uninformative', 'Page titles should be descriptive and unique', 'serious'),
    (accessibility_module_id, 'ACC_STR_08_SKIP_LINK_MISSING', 'Skip Navigation Link Missing', 'Pages should provide skip links for keyboard users', 'serious'),
    (accessibility_module_id, 'ACC_STR_09_SKIP_LINK_BROKEN', 'Skip Navigation Link Broken', 'Skip links must function correctly', 'serious'),
    (accessibility_module_id, 'ACC_STR_10_LANDMARK_MISSING', 'Page Landmarks Missing', 'Pages should use ARIA landmarks for navigation', 'moderate'),
    (accessibility_module_id, 'ACC_STR_11_LANDMARK_DUPLICATE', 'Duplicate Landmark Labels', 'Multiple landmarks of same type need unique labels', 'moderate'),
    (accessibility_module_id, 'ACC_STR_12_LIST_STRUCTURE_INVALID', 'Invalid List Structure', 'Lists must be properly structured with appropriate elements', 'moderate')
    ON CONFLICT (rule_key) DO UPDATE SET 
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        default_severity = EXCLUDED.default_severity;

    -- Forms & Input Controls Rules (15 rules)
    INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
    (accessibility_module_id, 'ACC_FRM_01_LABEL_MISSING', 'Form Input Missing Label', 'All form inputs must have associated labels', 'critical'),
    (accessibility_module_id, 'ACC_FRM_02_LABEL_FOR_ID_MISMATCH', 'Label-Input ID Mismatch', 'Label for attribute must match input ID', 'serious'),
    (accessibility_module_id, 'ACC_FRM_03_LABEL_HIDDEN', 'Form Label Hidden', 'Form labels should be visible to all users', 'serious'),
    (accessibility_module_id, 'ACC_FRM_04_FIELDSET_LEGEND_MISSING', 'Fieldset Missing Legend', 'Grouped form controls need fieldset with legend', 'serious'),
    (accessibility_module_id, 'ACC_FRM_05_REQUIRED_INDICATION', 'Required Field Not Indicated', 'Required fields must be clearly indicated', 'serious'),
    (accessibility_module_id, 'ACC_FRM_06_ERROR_IDENTIFICATION', 'Form Errors Not Identified', 'Form validation errors must be clearly identified', 'critical'),
    (accessibility_module_id, 'ACC_FRM_07_ERROR_SUGGESTION', 'Form Errors Missing Suggestions', 'Error messages should include correction suggestions', 'serious'),
    (accessibility_module_id, 'ACC_FRM_08_INPUT_PURPOSE', 'Input Purpose Not Identified', 'Input autocomplete purpose should be specified', 'moderate'),
    (accessibility_module_id, 'ACC_FRM_09_PLACEHOLDER_LABEL', 'Placeholder Used as Label', 'Placeholders cannot replace proper labels', 'serious'),
    (accessibility_module_id, 'ACC_FRM_10_BUTTON_NAME_MISSING', 'Button Missing Accessible Name', 'Buttons must have accessible names', 'critical'),
    (accessibility_module_id, 'ACC_FRM_11_SUBMIT_BUTTON_GENERIC', 'Generic Submit Button Text', 'Submit buttons should have descriptive text', 'moderate'),
    (accessibility_module_id, 'ACC_FRM_12_FORM_INSTRUCTION_MISSING', 'Form Instructions Missing', 'Complex forms need clear instructions', 'moderate'),
    (accessibility_module_id, 'ACC_FRM_13_AUTOCOMPLETE_MISSING', 'Autocomplete Attribute Missing', 'Input fields should include autocomplete attributes', 'minor'),
    (accessibility_module_id, 'ACC_FRM_14_INPUT_FORMAT_UNCLEAR', 'Input Format Not Clear', 'Expected input format should be clearly indicated', 'moderate'),
    (accessibility_module_id, 'ACC_FRM_15_CHANGE_OF_CONTEXT', 'Unexpected Context Change', 'Form interactions should not cause unexpected context changes', 'serious')
    ON CONFLICT (rule_key) DO UPDATE SET 
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        default_severity = EXCLUDED.default_severity;

    -- ARIA Implementation Rules (10 rules)
    INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
    (accessibility_module_id, 'ACC_ARIA_01_ROLE_INVALID', 'Invalid ARIA Role', 'ARIA roles must be valid and appropriate', 'serious'),
    (accessibility_module_id, 'ACC_ARIA_02_REQUIRED_ATTR_MISSING', 'ARIA Required Attributes Missing', 'Required ARIA attributes must be present', 'serious'),
    (accessibility_module_id, 'ACC_ARIA_03_INVALID_ATTR_VALUE', 'Invalid ARIA Attribute Value', 'ARIA attribute values must be valid', 'serious'),
    (accessibility_module_id, 'ACC_ARIA_04_REDUNDANT_ROLE', 'Redundant ARIA Role', 'ARIA roles should not be redundant with implicit semantics', 'minor'),
    (accessibility_module_id, 'ACC_ARIA_05_HIDDEN_FOCUSABLE', 'ARIA Hidden Element Focusable', 'Hidden elements should not be focusable', 'serious'),
    (accessibility_module_id, 'ACC_ARIA_06_LIVE_REGION_MISSING', 'Live Region Missing', 'Dynamic content updates need ARIA live regions', 'moderate'),
    (accessibility_module_id, 'ACC_ARIA_07_LABELLEDBY_MISSING', 'ARIA Labelledby Target Missing', 'aria-labelledby must reference existing elements', 'serious'),
    (accessibility_module_id, 'ACC_ARIA_08_DESCRIBEDBY_MISSING', 'ARIA Describedby Target Missing', 'aria-describedby must reference existing elements', 'moderate'),
    (accessibility_module_id, 'ACC_ARIA_09_EXPANDED_MISSING', 'ARIA Expanded State Missing', 'Expandable elements need aria-expanded state', 'moderate'),
    (accessibility_module_id, 'ACC_ARIA_10_CONTROLS_MISSING', 'ARIA Controls Attribute Missing', 'Control elements should specify what they control', 'moderate')
    ON CONFLICT (rule_key) DO UPDATE SET 
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        default_severity = EXCLUDED.default_severity;

    -- Keyboard Navigation Rules (8 rules)
    INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
    (accessibility_module_id, 'ACC_KBD_01_FOCUS_VISIBLE', 'Focus Indicator Not Visible', 'Keyboard focus must be clearly visible', 'critical'),
    (accessibility_module_id, 'ACC_KBD_02_KEYBOARD_TRAP', 'Keyboard Focus Trap', 'Users must be able to navigate away from all elements', 'critical'),
    (accessibility_module_id, 'ACC_KBD_03_TABINDEX_POSITIVE', 'Positive Tabindex Values', 'Avoid positive tabindex values that disrupt tab order', 'serious'),
    (accessibility_module_id, 'ACC_KBD_04_INTERACTIVE_NOT_FOCUSABLE', 'Interactive Element Not Focusable', 'All interactive elements must be keyboard accessible', 'serious'),
    (accessibility_module_id, 'ACC_KBD_05_FOCUS_ORDER_LOGICAL', 'Illogical Focus Order', 'Tab order should follow logical sequence', 'serious'),
    (accessibility_module_id, 'ACC_KBD_06_BYPASS_BLOCKS', 'No Way to Bypass Blocks', 'Provide mechanisms to skip repetitive content', 'serious'),
    (accessibility_module_id, 'ACC_KBD_07_KEYBOARD_SHORTCUTS', 'Keyboard Shortcuts Conflict', 'Custom shortcuts should not conflict with assistive technology', 'moderate'),
    (accessibility_module_id, 'ACC_KBD_08_ACCESS_KEY_DUPLICATE', 'Duplicate Access Keys', 'Access keys must be unique within a page', 'moderate')
    ON CONFLICT (rule_key) DO UPDATE SET 
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        default_severity = EXCLUDED.default_severity;

    -- Color & Visual Design Rules (10 rules including axe-core compatible)
    INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
    (accessibility_module_id, 'color-contrast', 'Color Contrast (Minimum)', 'Text must have sufficient contrast against background (WCAG AA)', 'critical'),
    (accessibility_module_id, 'color-contrast-enhanced', 'Color Contrast (Enhanced)', 'Text must have enhanced contrast against background (WCAG AAA)', 'serious'),
    (accessibility_module_id, 'link-in-text-block', 'Links in Text Block', 'Links must have sufficient color contrast to be distinguishable from surrounding text', 'serious'),
    (accessibility_module_id, 'ACC_CLR_01_TEXT_CONTRAST_RATIO', 'Low Text Contrast Ratio', 'Text must have sufficient contrast against background', 'critical'),
    (accessibility_module_id, 'ACC_CLR_02_LARGE_TEXT_CONTRAST', 'Low Large Text Contrast', 'Large text needs adequate contrast ratio', 'serious'),
    (accessibility_module_id, 'ACC_CLR_03_NON_TEXT_CONTRAST', 'Low Non-Text Contrast', 'UI components need sufficient contrast', 'serious'),
    (accessibility_module_id, 'ACC_CLR_04_COLOR_ONLY_MEANING', 'Color Used as Only Visual Means', 'Information cannot be conveyed by color alone', 'serious'),
    (accessibility_module_id, 'ACC_CLR_05_FOCUS_CONTRAST', 'Focus Indicator Low Contrast', 'Focus indicators need sufficient contrast', 'serious'),
    (accessibility_module_id, 'ACC_CLR_06_TEXT_SPACING', 'Text Spacing Not Customizable', 'Users should be able to adjust text spacing', 'moderate'),
    (accessibility_module_id, 'ACC_CLR_07_REFLOW_CONTENT', 'Content Doesn''t Reflow', 'Content should reflow at 320px width without horizontal scrolling', 'moderate')
    ON CONFLICT (rule_key) DO UPDATE SET 
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        default_severity = EXCLUDED.default_severity;

    -- Tables & Data Presentation Rules (5 rules)
    INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
    (accessibility_module_id, 'ACC_TBL_01_HEADER_MISSING', 'Table Headers Missing', 'Data tables must have proper header cells', 'serious'),
    (accessibility_module_id, 'ACC_TBL_02_CAPTION_MISSING', 'Table Caption Missing', 'Complex tables should have captions', 'moderate'),
    (accessibility_module_id, 'ACC_TBL_03_SCOPE_MISSING', 'Table Scope Attributes Missing', 'Table headers should specify their scope', 'serious'),
    (accessibility_module_id, 'ACC_TBL_04_COMPLEX_TABLE_HEADERS', 'Complex Table Headers Unclear', 'Complex tables need clear header associations', 'serious'),
    (accessibility_module_id, 'ACC_TBL_05_LAYOUT_TABLE_HEADERS', 'Layout Table Has Headers', 'Layout tables should not use header elements', 'moderate')
    ON CONFLICT (rule_key) DO UPDATE SET 
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        default_severity = EXCLUDED.default_severity;

    -- Additional axe-core specific rules that map to our rules
    INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
    -- These axe rules need to exist for proper mapping
    (accessibility_module_id, 'skip-link', 'Skip Link Functionality', 'Ensure all skip links have a focusable target', 'serious'),
    (accessibility_module_id, 'bypass', 'Bypass Blocks', 'Page must provide ways to bypass repetitive content', 'serious'),
    (accessibility_module_id, 'focus-order-semantics', 'Focus Order Semantics', 'Elements in focus order must have appropriate roles', 'serious')
    ON CONFLICT (rule_key) DO NOTHING;

    -- Log completion
    RAISE NOTICE 'Accessibility rules migration completed. All 60+ rules are now ensured in the database.';

END $$;