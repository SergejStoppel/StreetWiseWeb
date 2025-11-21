-- Add On-Page SEO Rules for onPageSeo Worker
-- This migration adds 14 new SEO rules used by the on-page SEO analysis worker
-- Created: 2025-11-20

-- Get SEO module ID
DO $$
DECLARE
    seo_module_id UUID;
BEGIN
    -- Get SEO module ID
    SELECT id INTO seo_module_id FROM analysis_modules WHERE name = 'SEO';

    IF seo_module_id IS NULL THEN
        RAISE EXCEPTION 'SEO module not found. Please run seed_data migration first.';
    END IF;

    -- ================================
    -- META DESCRIPTION ENHANCEMENTS
    -- ================================

    -- Check if rule already exists before inserting
    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'SEO_CON_06_META_DESC_NO_CTA') THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (seo_module_id, 'SEO_CON_06_META_DESC_NO_CTA', 'Meta Description Lacks Call-to-Action', 'Meta descriptions should include action-oriented language to encourage clicks', 'minor');
    END IF;

    -- ================================
    -- HEADING STRUCTURE ENHANCEMENTS
    -- ================================

    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'SEO_CON_09_H1_TITLE_MISMATCH') THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (seo_module_id, 'SEO_CON_09_H1_TITLE_MISMATCH', 'H1 and Title Tag Mismatch', 'H1 and title tag should communicate the same core message', 'minor');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'SEO_CON_10_HEADING_HIERARCHY') THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (seo_module_id, 'SEO_CON_10_HEADING_HIERARCHY', 'Improper Heading Hierarchy', 'Headings should follow sequential order without skipping levels', 'moderate');
    END IF;

    -- ================================
    -- CONTENT QUALITY ENHANCEMENTS
    -- ================================

    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'SEO_CON_11_CONTENT_TOO_LONG') THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (seo_module_id, 'SEO_CON_11_CONTENT_TOO_LONG', 'Content Excessively Long', 'Very long content (2500+ words) may benefit from being split into multiple pages', 'minor');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'SEO_CON_12_PARAGRAPH_LENGTH') THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (seo_module_id, 'SEO_CON_12_PARAGRAPH_LENGTH', 'Paragraphs Too Long', 'Long paragraphs (150+ words) reduce readability and engagement', 'minor');
    END IF;

    -- ================================
    -- LINK QUALITY RULES
    -- ================================

    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'SEO_CON_13_EMPTY_LINKS') THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (seo_module_id, 'SEO_CON_13_EMPTY_LINKS', 'Empty or Placeholder Links', 'Links with no meaningful destination (#, javascript:void) confuse users and search engines', 'minor');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'SEO_CON_14_GENERIC_LINK_TEXT') THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (seo_module_id, 'SEO_CON_14_GENERIC_LINK_TEXT', 'Generic Anchor Text', 'Descriptive anchor text improves SEO and user experience over generic phrases like "click here"', 'minor');
    END IF;

    -- ================================
    -- IMAGE SEO RULES
    -- ================================

    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'SEO_CON_15_IMAGE_ALT_MISSING') THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (seo_module_id, 'SEO_CON_15_IMAGE_ALT_MISSING', 'Image Alt Text Missing (SEO)', 'Images without alt text miss SEO opportunities and accessibility requirements', 'serious');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'SEO_CON_16_IMAGE_ALT_EMPTY') THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (seo_module_id, 'SEO_CON_16_IMAGE_ALT_EMPTY', 'Many Images Have Empty Alt Text', 'Only decorative images should have empty alt text; content images need descriptions', 'moderate');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'SEO_CON_17_IMAGE_ALT_SHORT') THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (seo_module_id, 'SEO_CON_17_IMAGE_ALT_SHORT', 'Image Alt Text Too Short', 'Alt text should be descriptive (typically 10-125 characters) for SEO and accessibility', 'minor');
    END IF;

    -- ================================
    -- URL STRUCTURE RULES
    -- ================================

    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'SEO_CON_18_URL_TOO_LONG') THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (seo_module_id, 'SEO_CON_18_URL_TOO_LONG', 'URL Excessively Long', 'URLs should be concise and under 100 characters for better usability and SEO', 'minor');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'SEO_CON_19_URL_SESSION_ID') THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (seo_module_id, 'SEO_CON_19_URL_SESSION_ID', 'Session ID in URL', 'Session IDs in URLs create duplicate content issues and security vulnerabilities', 'serious');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'SEO_CON_20_URL_UNDERSCORES') THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (seo_module_id, 'SEO_CON_20_URL_UNDERSCORES', 'URL Contains Underscores', 'Google recommends using hyphens instead of underscores in URLs for better word separation', 'minor');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'SEO_CON_21_URL_UPPERCASE') THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (seo_module_id, 'SEO_CON_21_URL_UPPERCASE', 'URL Contains Uppercase Letters', 'Lowercase URLs prevent duplicate content issues and improve consistency', 'minor');
    END IF;

    RAISE NOTICE 'Successfully added 14 on-page SEO rules';
END $$;
