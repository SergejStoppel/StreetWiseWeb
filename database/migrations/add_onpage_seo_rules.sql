-- Standalone Migration Script: Add On-Page SEO Rules
-- This script can be run directly on an existing database to add the new SEO rules
-- Created: 2025-11-20
-- Purpose: Add 14 new SEO rules for the onPageSeo worker

-- Instructions:
-- 1. Connect to your Supabase database
-- 2. Run this script in the SQL editor
-- 3. Verify success by checking: SELECT COUNT(*) FROM rules WHERE module_id = (SELECT id FROM analysis_modules WHERE name = 'SEO');

\echo 'Starting migration: Add On-Page SEO Rules...'

-- Get SEO module ID
DO $$
DECLARE
    seo_module_id UUID;
    rules_added INTEGER := 0;
BEGIN
    -- Get SEO module ID
    SELECT id INTO seo_module_id FROM analysis_modules WHERE name = 'SEO';

    IF seo_module_id IS NULL THEN
        RAISE EXCEPTION 'SEO module not found. Please ensure your database has been initialized with the seed data.';
    END IF;

    RAISE NOTICE 'SEO Module ID: %', seo_module_id;
    RAISE NOTICE 'Adding on-page SEO rules...';

    -- ================================
    -- META DESCRIPTION ENHANCEMENTS
    -- ================================

    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'SEO_CON_06_META_DESC_NO_CTA') THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (seo_module_id, 'SEO_CON_06_META_DESC_NO_CTA', 'Meta Description Lacks Call-to-Action', 'Meta descriptions should include action-oriented language to encourage clicks', 'minor');
        rules_added := rules_added + 1;
        RAISE NOTICE '  [✓] Added: SEO_CON_06_META_DESC_NO_CTA';
    ELSE
        RAISE NOTICE '  [EXISTS] SEO_CON_06_META_DESC_NO_CTA';
    END IF;

    -- ================================
    -- HEADING STRUCTURE ENHANCEMENTS
    -- ================================

    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'SEO_CON_09_H1_TITLE_MISMATCH') THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (seo_module_id, 'SEO_CON_09_H1_TITLE_MISMATCH', 'H1 and Title Tag Mismatch', 'H1 and title tag should communicate the same core message', 'minor');
        rules_added := rules_added + 1;
        RAISE NOTICE '  [✓] Added: SEO_CON_09_H1_TITLE_MISMATCH';
    ELSE
        RAISE NOTICE '  [EXISTS] SEO_CON_09_H1_TITLE_MISMATCH';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'SEO_CON_10_HEADING_HIERARCHY') THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (seo_module_id, 'SEO_CON_10_HEADING_HIERARCHY', 'Improper Heading Hierarchy', 'Headings should follow sequential order without skipping levels', 'moderate');
        rules_added := rules_added + 1;
        RAISE NOTICE '  [✓] Added: SEO_CON_10_HEADING_HIERARCHY';
    ELSE
        RAISE NOTICE '  [EXISTS] SEO_CON_10_HEADING_HIERARCHY';
    END IF;

    -- ================================
    -- CONTENT QUALITY ENHANCEMENTS
    -- ================================

    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'SEO_CON_11_CONTENT_TOO_LONG') THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (seo_module_id, 'SEO_CON_11_CONTENT_TOO_LONG', 'Content Excessively Long', 'Very long content (2500+ words) may benefit from being split into multiple pages', 'minor');
        rules_added := rules_added + 1;
        RAISE NOTICE '  [✓] Added: SEO_CON_11_CONTENT_TOO_LONG';
    ELSE
        RAISE NOTICE '  [EXISTS] SEO_CON_11_CONTENT_TOO_LONG';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'SEO_CON_12_PARAGRAPH_LENGTH') THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (seo_module_id, 'SEO_CON_12_PARAGRAPH_LENGTH', 'Paragraphs Too Long', 'Long paragraphs (150+ words) reduce readability and engagement', 'minor');
        rules_added := rules_added + 1;
        RAISE NOTICE '  [✓] Added: SEO_CON_12_PARAGRAPH_LENGTH';
    ELSE
        RAISE NOTICE '  [EXISTS] SEO_CON_12_PARAGRAPH_LENGTH';
    END IF;

    -- ================================
    -- LINK QUALITY RULES
    -- ================================

    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'SEO_CON_13_EMPTY_LINKS') THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (seo_module_id, 'SEO_CON_13_EMPTY_LINKS', 'Empty or Placeholder Links', 'Links with no meaningful destination (#, javascript:void) confuse users and search engines', 'minor');
        rules_added := rules_added + 1;
        RAISE NOTICE '  [✓] Added: SEO_CON_13_EMPTY_LINKS';
    ELSE
        RAISE NOTICE '  [EXISTS] SEO_CON_13_EMPTY_LINKS';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'SEO_CON_14_GENERIC_LINK_TEXT') THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (seo_module_id, 'SEO_CON_14_GENERIC_LINK_TEXT', 'Generic Anchor Text', 'Descriptive anchor text improves SEO and user experience over generic phrases like "click here"', 'minor');
        rules_added := rules_added + 1;
        RAISE NOTICE '  [✓] Added: SEO_CON_14_GENERIC_LINK_TEXT';
    ELSE
        RAISE NOTICE '  [EXISTS] SEO_CON_14_GENERIC_LINK_TEXT';
    END IF;

    -- ================================
    -- IMAGE SEO RULES
    -- ================================

    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'SEO_CON_15_IMAGE_ALT_MISSING') THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (seo_module_id, 'SEO_CON_15_IMAGE_ALT_MISSING', 'Image Alt Text Missing (SEO)', 'Images without alt text miss SEO opportunities and accessibility requirements', 'serious');
        rules_added := rules_added + 1;
        RAISE NOTICE '  [✓] Added: SEO_CON_15_IMAGE_ALT_MISSING';
    ELSE
        RAISE NOTICE '  [EXISTS] SEO_CON_15_IMAGE_ALT_MISSING';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'SEO_CON_16_IMAGE_ALT_EMPTY') THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (seo_module_id, 'SEO_CON_16_IMAGE_ALT_EMPTY', 'Many Images Have Empty Alt Text', 'Only decorative images should have empty alt text; content images need descriptions', 'moderate');
        rules_added := rules_added + 1;
        RAISE NOTICE '  [✓] Added: SEO_CON_16_IMAGE_ALT_EMPTY';
    ELSE
        RAISE NOTICE '  [EXISTS] SEO_CON_16_IMAGE_ALT_EMPTY';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'SEO_CON_17_IMAGE_ALT_SHORT') THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (seo_module_id, 'SEO_CON_17_IMAGE_ALT_SHORT', 'Image Alt Text Too Short', 'Alt text should be descriptive (typically 10-125 characters) for SEO and accessibility', 'minor');
        rules_added := rules_added + 1;
        RAISE NOTICE '  [✓] Added: SEO_CON_17_IMAGE_ALT_SHORT';
    ELSE
        RAISE NOTICE '  [EXISTS] SEO_CON_17_IMAGE_ALT_SHORT';
    END IF;

    -- ================================
    -- URL STRUCTURE RULES
    -- ================================

    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'SEO_CON_18_URL_TOO_LONG') THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (seo_module_id, 'SEO_CON_18_URL_TOO_LONG', 'URL Excessively Long', 'URLs should be concise and under 100 characters for better usability and SEO', 'minor');
        rules_added := rules_added + 1;
        RAISE NOTICE '  [✓] Added: SEO_CON_18_URL_TOO_LONG';
    ELSE
        RAISE NOTICE '  [EXISTS] SEO_CON_18_URL_TOO_LONG';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'SEO_CON_19_URL_SESSION_ID') THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (seo_module_id, 'SEO_CON_19_URL_SESSION_ID', 'Session ID in URL', 'Session IDs in URLs create duplicate content issues and security vulnerabilities', 'serious');
        rules_added := rules_added + 1;
        RAISE NOTICE '  [✓] Added: SEO_CON_19_URL_SESSION_ID';
    ELSE
        RAISE NOTICE '  [EXISTS] SEO_CON_19_URL_SESSION_ID';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'SEO_CON_20_URL_UNDERSCORES') THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (seo_module_id, 'SEO_CON_20_URL_UNDERSCORES', 'URL Contains Underscores', 'Google recommends using hyphens instead of underscores in URLs for better word separation', 'minor');
        rules_added := rules_added + 1;
        RAISE NOTICE '  [✓] Added: SEO_CON_20_URL_UNDERSCORES';
    ELSE
        RAISE NOTICE '  [EXISTS] SEO_CON_20_URL_UNDERSCORES';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'SEO_CON_21_URL_UPPERCASE') THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (seo_module_id, 'SEO_CON_21_URL_UPPERCASE', 'URL Contains Uppercase Letters', 'Lowercase URLs prevent duplicate content issues and improve consistency', 'minor');
        rules_added := rules_added + 1;
        RAISE NOTICE '  [✓] Added: SEO_CON_21_URL_UPPERCASE';
    ELSE
        RAISE NOTICE '  [EXISTS] SEO_CON_21_URL_UPPERCASE';
    END IF;

    -- Summary
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration Complete!';
    RAISE NOTICE 'New rules added: %', rules_added;
    RAISE NOTICE '========================================';

    -- Verify total count
    DECLARE
        total_seo_rules INTEGER;
    BEGIN
        SELECT COUNT(*) INTO total_seo_rules FROM rules WHERE module_id = seo_module_id;
        RAISE NOTICE 'Total SEO rules in database: %', total_seo_rules;
    END;
END $$;

\echo 'Migration completed successfully!'
\echo 'You can verify by running: SELECT rule_key, name FROM rules WHERE rule_key LIKE ''SEO_CON_%'' ORDER BY rule_key;'
