-- Fix Analyses Table Schema Issues
-- This script fixes missing score columns and NULL value issues
-- Run this in Supabase SQL Editor

BEGIN;

-- First, let's check current table structure
DO $$
BEGIN
    RAISE NOTICE '=== SCHEMA FIX: Starting Analysis ===';
    RAISE NOTICE 'Checking current analyses table structure...';
END $$;

-- Add missing score columns if they don't exist
ALTER TABLE public.analyses 
    ADD COLUMN IF NOT EXISTS overall_score INTEGER,
    ADD COLUMN IF NOT EXISTS accessibility_score INTEGER,
    ADD COLUMN IF NOT EXISTS seo_score INTEGER,
    ADD COLUMN IF NOT EXISTS performance_score INTEGER;

-- Update all NULL scores to 0
UPDATE public.analyses 
SET 
    overall_score = COALESCE(overall_score, 0),
    accessibility_score = COALESCE(accessibility_score, 0),
    seo_score = COALESCE(seo_score, 0),
    performance_score = COALESCE(performance_score, 0)
WHERE 
    overall_score IS NULL 
    OR accessibility_score IS NULL 
    OR seo_score IS NULL 
    OR performance_score IS NULL;

-- Add NOT NULL constraints and defaults
ALTER TABLE public.analyses 
    ALTER COLUMN overall_score SET DEFAULT 0,
    ALTER COLUMN overall_score SET NOT NULL,
    ALTER COLUMN accessibility_score SET DEFAULT 0,
    ALTER COLUMN accessibility_score SET NOT NULL,
    ALTER COLUMN seo_score SET DEFAULT 0,
    ALTER COLUMN seo_score SET NOT NULL,
    ALTER COLUMN performance_score SET DEFAULT 0,
    ALTER COLUMN performance_score SET NOT NULL;

-- Add check constraints for valid score ranges (drop first if they exist)
DO $$
BEGIN
    -- Drop constraints if they exist, then add them
    ALTER TABLE public.analyses DROP CONSTRAINT IF EXISTS check_overall_score;
    ALTER TABLE public.analyses DROP CONSTRAINT IF EXISTS check_accessibility_score;
    ALTER TABLE public.analyses DROP CONSTRAINT IF EXISTS check_seo_score;
    ALTER TABLE public.analyses DROP CONSTRAINT IF EXISTS check_performance_score;
    
    -- Add the constraints
    ALTER TABLE public.analyses ADD CONSTRAINT check_overall_score 
        CHECK (overall_score >= 0 AND overall_score <= 100);
    ALTER TABLE public.analyses ADD CONSTRAINT check_accessibility_score 
        CHECK (accessibility_score >= 0 AND accessibility_score <= 100);
    ALTER TABLE public.analyses ADD CONSTRAINT check_seo_score 
        CHECK (seo_score >= 0 AND seo_score <= 100);
    ALTER TABLE public.analyses ADD CONSTRAINT check_performance_score 
        CHECK (performance_score >= 0 AND performance_score <= 100);
END $$;

-- Try to populate scores from analysis_data JSONB where missing
UPDATE public.analyses 
SET 
    overall_score = CASE 
        WHEN overall_score = 0 AND analysis_data->'summary'->>'overallScore' IS NOT NULL 
        THEN COALESCE((analysis_data->'summary'->>'overallScore')::INTEGER, 0)
        ELSE overall_score 
    END,
    accessibility_score = CASE 
        WHEN accessibility_score = 0 AND analysis_data->'summary'->>'accessibilityScore' IS NOT NULL 
        THEN COALESCE((analysis_data->'summary'->>'accessibilityScore')::INTEGER, 0)
        ELSE accessibility_score 
    END,
    seo_score = CASE 
        WHEN seo_score = 0 AND analysis_data->'summary'->>'seoScore' IS NOT NULL 
        THEN COALESCE((analysis_data->'summary'->>'seoScore')::INTEGER, 0)
        ELSE seo_score 
    END,
    performance_score = CASE 
        WHEN performance_score = 0 AND analysis_data->'summary'->>'performanceScore' IS NOT NULL 
        THEN COALESCE((analysis_data->'summary'->>'performanceScore')::INTEGER, 0)
        ELSE performance_score 
    END
WHERE 
    analysis_data IS NOT NULL 
    AND analysis_data != '{}'::jsonb;

COMMIT;

-- Validation queries
DO $$
DECLARE
    total_analyses INTEGER;
    analyses_with_scores INTEGER;
    avg_overall NUMERIC;
    avg_accessibility NUMERIC;
BEGIN
    SELECT COUNT(*) INTO total_analyses FROM public.analyses;
    SELECT COUNT(*) INTO analyses_with_scores FROM public.analyses WHERE overall_score > 0;
    SELECT AVG(overall_score) INTO avg_overall FROM public.analyses WHERE overall_score > 0;
    SELECT AVG(accessibility_score) INTO avg_accessibility FROM public.analyses WHERE accessibility_score > 0;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== SCHEMA FIX RESULTS ===';
    RAISE NOTICE 'Total analyses: %', total_analyses;
    RAISE NOTICE 'Analyses with scores > 0: %', analyses_with_scores;
    RAISE NOTICE 'Average overall score: %', ROUND(avg_overall, 2);
    RAISE NOTICE 'Average accessibility score: %', ROUND(avg_accessibility, 2);
    RAISE NOTICE '';
    RAISE NOTICE '✅ Schema fix completed successfully!';
    RAISE NOTICE 'You can now restart your backend server.';
END $$;