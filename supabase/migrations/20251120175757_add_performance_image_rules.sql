-- Add Performance Image Optimization Rules
-- This migration adds 8 new performance rules for the Image Optimization worker
-- Created: 2025-11-20

-- Get Performance module ID
DO $$
DECLARE
    performance_module_id UUID;
BEGIN
    -- Get Performance module ID
    SELECT id INTO performance_module_id FROM analysis_modules WHERE name = 'Performance';

    IF performance_module_id IS NULL THEN
        RAISE EXCEPTION 'Performance module not found. Please run seed_data migration first.';
    END IF;

    -- ================================
    -- PERFORMANCE IMAGE RULES (8 rules)
    -- ================================

    -- Check if rules already exist before inserting
    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'PERF_IMG_01_OVERSIZED') THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (performance_module_id, 'PERF_IMG_01_OVERSIZED', 'Oversized Images', 'Images are larger than needed for their display size, wasting bandwidth', 'serious');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'PERF_IMG_02_FORMAT_OUTDATED') THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (performance_module_id, 'PERF_IMG_02_FORMAT_OUTDATED', 'Outdated Image Formats', 'Images use older formats (JPEG/PNG) instead of modern formats (WebP/AVIF)', 'moderate');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'PERF_IMG_03_DIMENSIONS_MISSING') THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (performance_module_id, 'PERF_IMG_03_DIMENSIONS_MISSING', 'Missing Image Dimensions', 'Images lack width/height attributes, causing Cumulative Layout Shift (CLS)', 'serious');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'PERF_IMG_04_LAZY_LOADING_MISSING') THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (performance_module_id, 'PERF_IMG_04_LAZY_LOADING_MISSING', 'Lazy Loading Missing', 'Below-fold images load immediately instead of being lazy-loaded', 'moderate');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'PERF_IMG_05_LAZY_LOADING_INCORRECT') THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (performance_module_id, 'PERF_IMG_05_LAZY_LOADING_INCORRECT', 'Incorrect Lazy Loading', 'Above-fold images are lazy-loaded, delaying Largest Contentful Paint (LCP)', 'serious');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'PERF_IMG_06_NO_SRCSET') THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (performance_module_id, 'PERF_IMG_06_NO_SRCSET', 'Missing Responsive Images', 'Large images lack srcset attributes for responsive serving', 'moderate');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'PERF_IMG_07_PAGE_WEIGHT_HIGH') THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (performance_module_id, 'PERF_IMG_07_PAGE_WEIGHT_HIGH', 'High Page Weight from Images', 'Total image weight exceeds recommended limits, slowing page load', 'moderate');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'PERF_IMG_08_CLS_RISK') THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (performance_module_id, 'PERF_IMG_08_CLS_RISK', 'CLS Risk from Images', 'Above-fold images without dimensions risk causing Cumulative Layout Shift', 'critical');
    END IF;

    RAISE NOTICE 'Successfully added 8 performance image optimization rules';
END $$;
