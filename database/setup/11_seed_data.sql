-- Comprehensive Seed Data
-- Populate analysis engine with complete rule sets based on backend-v2-plan specifications

-- Insert analysis modules
INSERT INTO analysis_modules (name, description) VALUES
('Accessibility', 'Web Content Accessibility Guidelines (WCAG) compliance checks - 65+ comprehensive rules'),
('SEO', 'Search Engine Optimization and technical analysis - 25+ comprehensive rules'),
('Performance', 'Website performance and Core Web Vitals measurement - 20+ comprehensive rules');

-- Insert compliance standards
INSERT INTO compliance_standards (name) VALUES
('WCAG 2.1 AA'),
('WCAG 2.1 AAA'),
('Section 508'),
('EN 301 549'),
('ADA'),
('Google Core Web Vitals'),
('Google Search Console'),
('Schema.org');

-- Get module and standard IDs for rules insertion
DO $$
DECLARE
    accessibility_module_id UUID;
    seo_module_id UUID;
    performance_module_id UUID;
    wcag_aa_standard_id UUID;
    wcag_aaa_standard_id UUID;
    section_508_standard_id UUID;
    cwv_standard_id UUID;
BEGIN
    -- Get module IDs
    SELECT id INTO accessibility_module_id FROM analysis_modules WHERE name = 'Accessibility';
    SELECT id INTO seo_module_id FROM analysis_modules WHERE name = 'SEO';
    SELECT id INTO performance_module_id FROM analysis_modules WHERE name = 'Performance';
    
    -- Get standard IDs
    SELECT id INTO wcag_aa_standard_id FROM compliance_standards WHERE name = 'WCAG 2.1 AA';
    SELECT id INTO wcag_aaa_standard_id FROM compliance_standards WHERE name = 'WCAG 2.1 AAA';
    SELECT id INTO section_508_standard_id FROM compliance_standards WHERE name = 'Section 508';
    SELECT id INTO cwv_standard_id FROM compliance_standards WHERE name = 'Google Core Web Vitals';

    -- ================================
    -- ACCESSIBILITY RULES (65+ rules)
    -- ================================

    -- Images & Media (8 rules)
    INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
    (accessibility_module_id, 'ACC_IMG_01_ALT_TEXT_MISSING', 'Image Missing Alt Text', 'Images must have alternative text for screen readers', 'critical'),
    (accessibility_module_id, 'ACC_IMG_02_ALT_TEXT_DECORATIVE', 'Decorative Image Alt Text', 'Decorative images should have empty alt attributes', 'serious'),
    (accessibility_module_id, 'ACC_IMG_03_ALT_TEXT_INFORMATIVE', 'Uninformative Alt Text', 'Alt text should be descriptive and informative', 'serious'),
    (accessibility_module_id, 'ACC_IMG_04_COMPLEX_IMAGE_DESC', 'Complex Image Missing Description', 'Complex images need detailed descriptions', 'serious'),
    (accessibility_module_id, 'ACC_IMG_05_IMAGE_TEXT_REDUNDANT', 'Image Alt Text Duplicates Adjacent Text', 'Alt text should not duplicate nearby text', 'moderate'),
    (accessibility_module_id, 'ACC_MED_01_VIDEO_CAPTIONS', 'Video Missing Captions', 'Videos must have captions for deaf and hard of hearing users', 'critical'),
    (accessibility_module_id, 'ACC_MED_02_AUDIO_TRANSCRIPT', 'Audio Missing Transcript', 'Audio content must have text transcripts', 'critical'),
    (accessibility_module_id, 'ACC_MED_03_VIDEO_AUDIO_DESC', 'Video Missing Audio Description', 'Videos should have audio descriptions for blind users', 'moderate');

    -- Content Structure & Navigation (12 rules)
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
    (accessibility_module_id, 'ACC_STR_12_LIST_STRUCTURE_INVALID', 'Invalid List Structure', 'Lists must be properly structured with appropriate elements', 'moderate');

    -- Forms & Input Controls (15 rules)
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
    (accessibility_module_id, 'ACC_FRM_15_CHANGE_OF_CONTEXT', 'Unexpected Context Change', 'Form interactions should not cause unexpected context changes', 'serious');

    -- ARIA Implementation (10 rules)
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
    (accessibility_module_id, 'ACC_ARIA_10_CONTROLS_MISSING', 'ARIA Controls Attribute Missing', 'Control elements should specify what they control', 'moderate');

    -- Keyboard Navigation (8 rules)
    INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
    (accessibility_module_id, 'ACC_KBD_01_FOCUS_VISIBLE', 'Focus Indicator Not Visible', 'Keyboard focus must be clearly visible', 'critical'),
    (accessibility_module_id, 'ACC_KBD_02_KEYBOARD_TRAP', 'Keyboard Focus Trap', 'Users must be able to navigate away from all elements', 'critical'),
    (accessibility_module_id, 'ACC_KBD_03_TABINDEX_POSITIVE', 'Positive Tabindex Values', 'Avoid positive tabindex values that disrupt tab order', 'serious'),
    (accessibility_module_id, 'ACC_KBD_04_INTERACTIVE_NOT_FOCUSABLE', 'Interactive Element Not Focusable', 'All interactive elements must be keyboard accessible', 'serious'),
    (accessibility_module_id, 'ACC_KBD_05_FOCUS_ORDER_LOGICAL', 'Illogical Focus Order', 'Tab order should follow logical sequence', 'serious'),
    (accessibility_module_id, 'ACC_KBD_06_BYPASS_BLOCKS', 'No Way to Bypass Blocks', 'Provide mechanisms to skip repetitive content', 'serious'),
    (accessibility_module_id, 'ACC_KBD_07_KEYBOARD_SHORTCUTS', 'Keyboard Shortcuts Conflict', 'Custom shortcuts should not conflict with assistive technology', 'moderate'),
    (accessibility_module_id, 'ACC_KBD_08_ACCESS_KEY_DUPLICATE', 'Duplicate Access Keys', 'Access keys must be unique within a page', 'moderate');

    -- Color & Visual Design (7 rules)
    INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
    (accessibility_module_id, 'ACC_CLR_01_TEXT_CONTRAST_RATIO', 'Low Text Contrast Ratio', 'Text must have sufficient contrast against background', 'critical'),
    (accessibility_module_id, 'ACC_CLR_02_LARGE_TEXT_CONTRAST', 'Low Large Text Contrast', 'Large text needs adequate contrast ratio', 'serious'),
    (accessibility_module_id, 'ACC_CLR_03_NON_TEXT_CONTRAST', 'Low Non-Text Contrast', 'UI components need sufficient contrast', 'serious'),
    (accessibility_module_id, 'ACC_CLR_04_COLOR_ONLY_MEANING', 'Color Used as Only Visual Means', 'Information cannot be conveyed by color alone', 'serious'),
    (accessibility_module_id, 'ACC_CLR_05_FOCUS_CONTRAST', 'Focus Indicator Low Contrast', 'Focus indicators need sufficient contrast', 'serious'),
    (accessibility_module_id, 'ACC_CLR_06_TEXT_SPACING', 'Text Spacing Not Customizable', 'Users should be able to adjust text spacing', 'moderate'),
    (accessibility_module_id, 'ACC_CLR_07_REFLOW_CONTENT', 'Content Doesn''t Reflow', 'Content should reflow at 320px width without horizontal scrolling', 'moderate');

    -- Tables & Data Presentation (5 rules)
    INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
    (accessibility_module_id, 'ACC_TBL_01_HEADER_MISSING', 'Table Headers Missing', 'Data tables must have proper header cells', 'serious'),
    (accessibility_module_id, 'ACC_TBL_02_CAPTION_MISSING', 'Table Caption Missing', 'Complex tables should have captions', 'moderate'),
    (accessibility_module_id, 'ACC_TBL_03_SCOPE_MISSING', 'Table Scope Attributes Missing', 'Table headers should specify their scope', 'serious'),
    (accessibility_module_id, 'ACC_TBL_04_COMPLEX_TABLE_HEADERS', 'Complex Table Headers Unclear', 'Complex tables need clear header associations', 'serious'),
    (accessibility_module_id, 'ACC_TBL_05_LAYOUT_TABLE_HEADERS', 'Layout Table Has Headers', 'Layout tables should not use header elements', 'moderate');

    -- ================================
    -- SEO RULES (25+ rules)
    -- ================================

    -- Technical SEO Foundation (10 rules)
    INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
    (seo_module_id, 'SEO_TEC_01_ROBOTS_TXT_MISSING', 'robots.txt File Missing', 'robots.txt file provides crawl guidance to search engines', 'serious'),
    (seo_module_id, 'SEO_TEC_02_ROBOTS_TXT_ERRORS', 'robots.txt Syntax Errors', 'robots.txt must have correct syntax for proper crawl control', 'serious'),
    (seo_module_id, 'SEO_TEC_03_SITEMAP_MISSING', 'XML Sitemap Missing', 'XML sitemaps help search engines discover pages', 'serious'),
    (seo_module_id, 'SEO_TEC_04_SITEMAP_ERRORS', 'XML Sitemap Errors', 'XML sitemaps must be valid and accessible', 'moderate'),
    (seo_module_id, 'SEO_TEC_05_CANONICAL_MISSING', 'Canonical Tag Missing', 'Canonical tags prevent duplicate content issues', 'critical'),
    (seo_module_id, 'SEO_TEC_06_CANONICAL_SELF_REFERENCE', 'Canonical Self-Reference Missing', 'Pages should canonically reference themselves', 'moderate'),
    (seo_module_id, 'SEO_TEC_07_HTTPS_MISSING', 'HTTPS Not Implemented', 'HTTPS is required for security and search rankings', 'critical'),
    (seo_module_id, 'SEO_TEC_08_MOBILE_FRIENDLY', 'Mobile-Friendly Issues', 'Pages must be optimized for mobile devices', 'critical'),
    (seo_module_id, 'SEO_TEC_09_STRUCTURED_DATA_VALIDATION', 'Invalid Structured Data', 'Structured data must be valid for rich snippets', 'serious'),
    (seo_module_id, 'SEO_TEC_10_HREFLANG_ERRORS', 'Hreflang Implementation Errors', 'International sites need proper hreflang implementation', 'moderate');

    -- On-Page Content Optimization (8 rules)
    INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
    (seo_module_id, 'SEO_CON_01_TITLE_TAG_MISSING', 'Page Title Missing', 'Every page must have a unique, descriptive title', 'critical'),
    (seo_module_id, 'SEO_CON_02_TITLE_TAG_LENGTH', 'Title Tag Length Issues', 'Titles should be 50-60 characters for optimal SERP display', 'serious'),
    (seo_module_id, 'SEO_CON_03_TITLE_TAG_DUPLICATE', 'Duplicate Title Tags', 'Each page should have a unique title tag', 'serious'),
    (seo_module_id, 'SEO_CON_04_META_DESC_MISSING', 'Meta Description Missing', 'Meta descriptions improve click-through rates from search results', 'serious'),
    (seo_module_id, 'SEO_CON_05_META_DESC_LENGTH', 'Meta Description Length Issues', 'Meta descriptions should be 120-160 characters', 'moderate'),
    (seo_module_id, 'SEO_CON_06_META_DESC_DUPLICATE', 'Duplicate Meta Descriptions', 'Each page should have a unique meta description', 'moderate'),
    (seo_module_id, 'SEO_CON_07_H1_MISSING', 'H1 Tag Missing', 'Pages should have exactly one H1 tag for content structure', 'serious'),
    (seo_module_id, 'SEO_CON_08_H1_DUPLICATE', 'Duplicate H1 Tags', 'Pages should have only one H1 tag', 'moderate');

    -- Content Quality & Structure (4 rules)
    INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
    (seo_module_id, 'SEO_STR_01_CONTENT_LENGTH', 'Insufficient Content Length', 'Pages should have substantial content for authority', 'moderate'),
    (seo_module_id, 'SEO_STR_02_KEYWORD_DENSITY', 'Keyword Over-Optimization', 'Avoid keyword stuffing for natural content flow', 'moderate'),
    (seo_module_id, 'SEO_STR_03_INTERNAL_LINKS', 'Insufficient Internal Linking', 'Internal links help with site architecture and page authority', 'moderate'),
    (seo_module_id, 'SEO_STR_04_EXTERNAL_LINKS', 'No External Links', 'External links to authoritative sources can improve content credibility', 'minor');

    -- Structured Data & Rich Snippets (3 rules)
    INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
    (seo_module_id, 'SEO_SCHEMA_01_ORGANIZATION', 'Organization Schema Missing', 'Organization schema helps with brand visibility in search', 'moderate'),
    (seo_module_id, 'SEO_SCHEMA_02_BREADCRUMB', 'Breadcrumb Schema Missing', 'Breadcrumb schema improves search result navigation', 'minor'),
    (seo_module_id, 'SEO_SCHEMA_03_ARTICLE', 'Article Schema Missing', 'Article schema enhances content appearance in search results', 'moderate');

    -- ================================
    -- PERFORMANCE RULES (20+ rules)
    -- ================================

    -- Core Web Vitals (6 rules)
    INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
    (performance_module_id, 'PERF_CWV_01_LCP_SLOW', 'Slow Largest Contentful Paint', 'LCP should be under 2.5 seconds for good user experience', 'critical'),
    (performance_module_id, 'PERF_CWV_02_CLS_HIGH', 'High Cumulative Layout Shift', 'CLS should be under 0.1 to prevent layout instability', 'critical'),
    (performance_module_id, 'PERF_CWV_03_FID_SLOW', 'Slow First Input Delay', 'FID should be under 100ms for responsive interactions', 'serious'),
    (performance_module_id, 'PERF_CWV_04_INP_SLOW', 'Slow Interaction to Next Paint', 'INP should be under 200ms for smooth interactions', 'serious'),
    (performance_module_id, 'PERF_CWV_05_TTFB_SLOW', 'Slow Time to First Byte', 'TTFB should be optimized for faster loading', 'serious'),
    (performance_module_id, 'PERF_CWV_06_FCP_SLOW', 'Slow First Contentful Paint', 'FCP should be under 1.8 seconds for perceived speed', 'moderate');

    -- Resource Loading & Optimization (8 rules)
    INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
    (performance_module_id, 'PERF_RES_01_IMAGE_FORMAT', 'Images Not Using Next-Gen Formats', 'Modern image formats like WebP and AVIF reduce file sizes', 'serious'),
    (performance_module_id, 'PERF_RES_02_IMAGE_DIMENSIONS', 'Improperly Sized Images', 'Images should be appropriately sized for their display dimensions', 'serious'),
    (performance_module_id, 'PERF_RES_03_IMAGE_LAZY_LOADING', 'Images Not Lazy Loaded', 'Non-critical images should be lazy loaded to improve initial load', 'moderate'),
    (performance_module_id, 'PERF_RES_04_UNUSED_CSS', 'Unused CSS Code', 'Remove unused CSS to reduce resource overhead', 'moderate'),
    (performance_module_id, 'PERF_RES_05_UNUSED_JS', 'Unused JavaScript Code', 'Remove unused JavaScript to improve execution speed', 'serious'),
    (performance_module_id, 'PERF_RES_06_RENDER_BLOCKING', 'Render-Blocking Resources', 'Critical resources should not block initial page rendering', 'critical'),
    (performance_module_id, 'PERF_RES_07_FONT_LOADING', 'Inefficient Font Loading', 'Optimize font loading strategy to prevent layout shifts', 'moderate'),
    (performance_module_id, 'PERF_RES_08_THIRD_PARTY_IMPACT', 'High Third-Party Impact', 'Third-party scripts significantly impact performance', 'serious');

    -- Caching & Delivery (3 rules)
    INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
    (performance_module_id, 'PERF_CACHE_01_BROWSER_CACHING', 'Missing Browser Cache Headers', 'Implement proper cache headers for repeat visit performance', 'serious'),
    (performance_module_id, 'PERF_CACHE_02_CDN_MISSING', 'CDN Not Implemented', 'Content delivery networks improve global performance', 'moderate'),
    (performance_module_id, 'PERF_CACHE_03_COMPRESSION', 'Resource Compression Missing', 'Enable gzip/brotli compression for faster transfers', 'serious');

    -- JavaScript & Interactivity (3 rules)
    INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
    (performance_module_id, 'PERF_JS_01_MAIN_THREAD_BLOCKING', 'Main Thread Blocking', 'Long JavaScript tasks block user interactions', 'critical'),
    (performance_module_id, 'PERF_JS_02_CODE_SPLITTING', 'No Code Splitting', 'Implement code splitting to reduce initial bundle size', 'moderate'),
    (performance_module_id, 'PERF_JS_03_POLYFILL_BLOAT', 'Unnecessary Polyfills', 'Remove polyfills not needed for target browsers', 'minor');

    -- ================================
    -- COMPLIANCE MAPPINGS
    -- ================================

    -- Map accessibility rules to WCAG 2.1 AA
    INSERT INTO standard_rules_mapping (standard_id, rule_id)
    SELECT wcag_aa_standard_id, id FROM rules 
    WHERE module_id = accessibility_module_id 
    AND rule_key IN (
        'ACC_IMG_01_ALT_TEXT_MISSING', 'ACC_IMG_02_ALT_TEXT_DECORATIVE', 'ACC_IMG_03_ALT_TEXT_INFORMATIVE',
        'ACC_IMG_04_COMPLEX_IMAGE_DESC', 'ACC_MED_01_VIDEO_CAPTIONS', 'ACC_MED_02_AUDIO_TRANSCRIPT',
        'ACC_STR_01_HEADING_ORDER', 'ACC_STR_02_NO_H1', 'ACC_STR_04_PAGE_LANG_MISSING',
        'ACC_STR_06_PAGE_TITLE_MISSING', 'ACC_STR_08_SKIP_LINK_MISSING', 'ACC_STR_10_LANDMARK_MISSING',
        'ACC_FRM_01_LABEL_MISSING', 'ACC_FRM_04_FIELDSET_LEGEND_MISSING', 'ACC_FRM_06_ERROR_IDENTIFICATION',
        'ACC_ARIA_01_ROLE_INVALID', 'ACC_ARIA_02_REQUIRED_ATTR_MISSING', 'ACC_ARIA_03_INVALID_ATTR_VALUE',
        'ACC_KBD_01_FOCUS_VISIBLE', 'ACC_KBD_02_KEYBOARD_TRAP', 'ACC_KBD_04_INTERACTIVE_NOT_FOCUSABLE',
        'ACC_CLR_01_TEXT_CONTRAST_RATIO', 'ACC_CLR_02_LARGE_TEXT_CONTRAST', 'ACC_CLR_04_COLOR_ONLY_MEANING',
        'ACC_TBL_01_HEADER_MISSING', 'ACC_TBL_03_SCOPE_MISSING'
    );

    -- Map accessibility rules to WCAG 2.1 AAA (all AA rules plus additional)
    INSERT INTO standard_rules_mapping (standard_id, rule_id)
    SELECT wcag_aaa_standard_id, id FROM rules 
    WHERE module_id = accessibility_module_id;

    -- Map accessibility rules to Section 508
    INSERT INTO standard_rules_mapping (standard_id, rule_id)
    SELECT section_508_standard_id, id FROM rules 
    WHERE module_id = accessibility_module_id 
    AND rule_key IN (
        'ACC_IMG_01_ALT_TEXT_MISSING', 'ACC_MED_01_VIDEO_CAPTIONS', 'ACC_MED_02_AUDIO_TRANSCRIPT',
        'ACC_STR_04_PAGE_LANG_MISSING', 'ACC_STR_06_PAGE_TITLE_MISSING', 'ACC_STR_08_SKIP_LINK_MISSING',
        'ACC_FRM_01_LABEL_MISSING', 'ACC_FRM_06_ERROR_IDENTIFICATION', 'ACC_KBD_01_FOCUS_VISIBLE',
        'ACC_KBD_02_KEYBOARD_TRAP', 'ACC_CLR_01_TEXT_CONTRAST_RATIO', 'ACC_TBL_01_HEADER_MISSING'
    );

    -- Map performance rules to Core Web Vitals
    INSERT INTO standard_rules_mapping (standard_id, rule_id)
    SELECT cwv_standard_id, id FROM rules 
    WHERE module_id = performance_module_id 
    AND rule_key IN (
        'PERF_CWV_01_LCP_SLOW', 'PERF_CWV_02_CLS_HIGH', 'PERF_CWV_03_FID_SLOW',
        'PERF_CWV_04_INP_SLOW', 'PERF_CWV_05_TTFB_SLOW', 'PERF_CWV_06_FCP_SLOW'
    );

END $$;