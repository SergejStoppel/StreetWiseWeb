-- Add AI-powered SEO analysis rules to existing database
-- Run this migration to add the missing AI SEO rules

DO $$
DECLARE
    seo_module_id UUID;
BEGIN
    -- Get SEO module ID
    SELECT id INTO seo_module_id FROM analysis_modules WHERE name = 'SEO';
    
    IF seo_module_id IS NULL THEN
        RAISE EXCEPTION 'SEO module not found. Please ensure the analysis modules are properly initialized.';
    END IF;
    
    -- Insert AI-powered SEO rules with conflict resolution
    INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
    (seo_module_id, 'SEO_AI_01_READABILITY', 'Content Readability Issues', 'Content readability score is below recommended threshold for user engagement', 'moderate'),
    (seo_module_id, 'SEO_AI_02_CONTENT_RELEVANCE', 'Content-Title Mismatch', 'Content does not align well with page title and meta description', 'serious'),
    (seo_module_id, 'SEO_AI_03_KEYWORD_RELEVANCE', 'Poor Keyword Integration', 'Target keywords are not well integrated into the content', 'moderate'),
    (seo_module_id, 'SEO_AI_04_CONTENT_GAPS', 'Content Improvement Opportunities', 'AI analysis identified potential content enhancements', 'minor'),
    (seo_module_id, 'SEO_AI_05_SEMANTIC_OPPORTUNITIES', 'Semantic Keyword Opportunities', 'Related semantic keywords could improve content relevance', 'minor')
    ON CONFLICT (rule_key) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        default_severity = EXCLUDED.default_severity,
        updated_at = CURRENT_TIMESTAMP;
        
    -- Log the result
    RAISE NOTICE 'Successfully added/updated 5 AI-powered SEO rules';
        
END $$;