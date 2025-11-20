-- ================================================
-- Add Performance Image Optimization Rules
-- ================================================
-- This migration adds 8 new performance rules for the Image Optimization worker
-- Created: 2025-11-20
-- Can be run on existing databases (idempotent - safe to run multiple times)
-- ================================================

DO $$
DECLARE
    performance_module_id UUID;
    new_rules_count INTEGER := 0;
    existing_rules_count INTEGER := 0;
    rule_exists BOOLEAN;
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Performance Image Optimization Rules Migration';
    RAISE NOTICE '================================================';
    RAISE NOTICE '';

    -- Get Performance module ID
    SELECT id INTO performance_module_id FROM analysis_modules WHERE name = 'Performance';

    IF performance_module_id IS NULL THEN
        RAISE EXCEPTION 'Performance module not found. Please run seed_data migration first.';
    END IF;

    RAISE NOTICE '✓ Found Performance module (ID: %)', performance_module_id;
    RAISE NOTICE '';
    RAISE NOTICE 'Adding performance image optimization rules...';
    RAISE NOTICE '';

    -- ================================
    -- PERFORMANCE IMAGE RULES (8 rules)
    -- ================================

    -- PERF_IMG_01: Oversized Images
    SELECT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'PERF_IMG_01_OVERSIZED') INTO rule_exists;
    IF NOT rule_exists THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (performance_module_id, 'PERF_IMG_01_OVERSIZED', 'Oversized Images', 'Images are larger than needed for their display size, wasting bandwidth', 'serious');
        new_rules_count := new_rules_count + 1;
        RAISE NOTICE '  [✓] Added: PERF_IMG_01_OVERSIZED';
    ELSE
        existing_rules_count := existing_rules_count + 1;
        RAISE NOTICE '  [EXISTS] PERF_IMG_01_OVERSIZED';
    END IF;

    -- PERF_IMG_02: Outdated Image Formats
    SELECT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'PERF_IMG_02_FORMAT_OUTDATED') INTO rule_exists;
    IF NOT rule_exists THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (performance_module_id, 'PERF_IMG_02_FORMAT_OUTDATED', 'Outdated Image Formats', 'Images use older formats (JPEG/PNG) instead of modern formats (WebP/AVIF)', 'moderate');
        new_rules_count := new_rules_count + 1;
        RAISE NOTICE '  [✓] Added: PERF_IMG_02_FORMAT_OUTDATED';
    ELSE
        existing_rules_count := existing_rules_count + 1;
        RAISE NOTICE '  [EXISTS] PERF_IMG_02_FORMAT_OUTDATED';
    END IF;

    -- PERF_IMG_03: Missing Image Dimensions
    SELECT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'PERF_IMG_03_DIMENSIONS_MISSING') INTO rule_exists;
    IF NOT rule_exists THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (performance_module_id, 'PERF_IMG_03_DIMENSIONS_MISSING', 'Missing Image Dimensions', 'Images lack width/height attributes, causing Cumulative Layout Shift (CLS)', 'serious');
        new_rules_count := new_rules_count + 1;
        RAISE NOTICE '  [✓] Added: PERF_IMG_03_DIMENSIONS_MISSING';
    ELSE
        existing_rules_count := existing_rules_count + 1;
        RAISE NOTICE '  [EXISTS] PERF_IMG_03_DIMENSIONS_MISSING';
    END IF;

    -- PERF_IMG_04: Lazy Loading Missing
    SELECT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'PERF_IMG_04_LAZY_LOADING_MISSING') INTO rule_exists;
    IF NOT rule_exists THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (performance_module_id, 'PERF_IMG_04_LAZY_LOADING_MISSING', 'Lazy Loading Missing', 'Below-fold images load immediately instead of being lazy-loaded', 'moderate');
        new_rules_count := new_rules_count + 1;
        RAISE NOTICE '  [✓] Added: PERF_IMG_04_LAZY_LOADING_MISSING';
    ELSE
        existing_rules_count := existing_rules_count + 1;
        RAISE NOTICE '  [EXISTS] PERF_IMG_04_LAZY_LOADING_MISSING';
    END IF;

    -- PERF_IMG_05: Incorrect Lazy Loading
    SELECT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'PERF_IMG_05_LAZY_LOADING_INCORRECT') INTO rule_exists;
    IF NOT rule_exists THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (performance_module_id, 'PERF_IMG_05_LAZY_LOADING_INCORRECT', 'Incorrect Lazy Loading', 'Above-fold images are lazy-loaded, delaying Largest Contentful Paint (LCP)', 'serious');
        new_rules_count := new_rules_count + 1;
        RAISE NOTICE '  [✓] Added: PERF_IMG_05_LAZY_LOADING_INCORRECT';
    ELSE
        existing_rules_count := existing_rules_count + 1;
        RAISE NOTICE '  [EXISTS] PERF_IMG_05_LAZY_LOADING_INCORRECT';
    END IF;

    -- PERF_IMG_06: Missing Responsive Images
    SELECT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'PERF_IMG_06_NO_SRCSET') INTO rule_exists;
    IF NOT rule_exists THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (performance_module_id, 'PERF_IMG_06_NO_SRCSET', 'Missing Responsive Images', 'Large images lack srcset attributes for responsive serving', 'moderate');
        new_rules_count := new_rules_count + 1;
        RAISE NOTICE '  [✓] Added: PERF_IMG_06_NO_SRCSET';
    ELSE
        existing_rules_count := existing_rules_count + 1;
        RAISE NOTICE '  [EXISTS] PERF_IMG_06_NO_SRCSET';
    END IF;

    -- PERF_IMG_07: High Page Weight from Images
    SELECT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'PERF_IMG_07_PAGE_WEIGHT_HIGH') INTO rule_exists;
    IF NOT rule_exists THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (performance_module_id, 'PERF_IMG_07_PAGE_WEIGHT_HIGH', 'High Page Weight from Images', 'Total image weight exceeds recommended limits, slowing page load', 'moderate');
        new_rules_count := new_rules_count + 1;
        RAISE NOTICE '  [✓] Added: PERF_IMG_07_PAGE_WEIGHT_HIGH';
    ELSE
        existing_rules_count := existing_rules_count + 1;
        RAISE NOTICE '  [EXISTS] PERF_IMG_07_PAGE_WEIGHT_HIGH';
    END IF;

    -- PERF_IMG_08: CLS Risk from Images
    SELECT EXISTS (SELECT 1 FROM rules WHERE rule_key = 'PERF_IMG_08_CLS_RISK') INTO rule_exists;
    IF NOT rule_exists THEN
        INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
        (performance_module_id, 'PERF_IMG_08_CLS_RISK', 'CLS Risk from Images', 'Above-fold images without dimensions risk causing Cumulative Layout Shift', 'critical');
        new_rules_count := new_rules_count + 1;
        RAISE NOTICE '  [✓] Added: PERF_IMG_08_CLS_RISK';
    ELSE
        existing_rules_count := existing_rules_count + 1;
        RAISE NOTICE '  [EXISTS] PERF_IMG_08_CLS_RISK';
    END IF;

    -- Summary
    RAISE NOTICE '';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Migration Complete!';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'New rules added: %', new_rules_count;
    RAISE NOTICE 'Already existing: %', existing_rules_count;
    RAISE NOTICE 'Total rules processed: %', (new_rules_count + existing_rules_count);
    RAISE NOTICE '';
    RAISE NOTICE 'Performance Image Optimization Worker is now ready to use!';
    RAISE NOTICE '================================================';
END $$;
