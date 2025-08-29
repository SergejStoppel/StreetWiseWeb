-- Quick migration to add AI SEO rules
-- Copy and paste this into your Supabase SQL editor and run it

DO $$
DECLARE
    seo_module_id UUID;
    rule_count INTEGER;
BEGIN
    -- Get SEO module ID
    SELECT id INTO seo_module_id FROM analysis_modules WHERE name = 'SEO';
    
    IF seo_module_id IS NULL THEN
        RAISE EXCEPTION 'SEO module not found. Please ensure the analysis modules are properly initialized.';
    END IF;
    
    -- Check if AI rules already exist
    SELECT COUNT(*) INTO rule_count FROM rules WHERE rule_key LIKE 'SEO_AI_%';
    
    IF rule_count > 0 THEN
        RAISE NOTICE 'Found % existing AI rules, updating them...', rule_count;
    ELSE
        RAISE NOTICE 'No existing AI rules found, creating new ones...';
    END IF;
    
    -- Insert/Update AI-powered SEO rules
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
        
    -- Verify the rules were added
    SELECT COUNT(*) INTO rule_count FROM rules WHERE rule_key LIKE 'SEO_AI_%';
    
    RAISE NOTICE 'Migration completed! Total AI rules now: %', rule_count;
    
    -- Show the rules that were added
    RAISE NOTICE 'AI Rules added:';
    FOR rule_count IN 
        SELECT rule_key FROM rules WHERE rule_key LIKE 'SEO_AI_%' ORDER BY rule_key
    LOOP
        RAISE NOTICE '  - %', rule_count;
    END LOOP;
        
END $$;

-- Verify the rules exist
SELECT rule_key, name, default_severity 
FROM rules 
WHERE rule_key LIKE 'SEO_AI_%' 
ORDER BY rule_key;