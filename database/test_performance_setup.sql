-- Test Script: Verify Performance Analysis Database Setup
-- Run this script to validate that all performance-related database components are properly set up

-- Test 1: Check if Performance module exists
SELECT 
    CASE 
        WHEN EXISTS(SELECT 1 FROM analysis_modules WHERE name = 'Performance') 
        THEN '✅ PASS: Performance module exists'
        ELSE '❌ FAIL: Performance module missing'
    END as performance_module_test;

-- Test 2: Check if performance_issues table has new columns
SELECT 
    CASE 
        WHEN EXISTS(
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'performance_issues' 
            AND column_name IN ('metric_value', 'improvement_potential', 'resource_url', 'savings_bytes', 'savings_ms')
        ) 
        THEN '✅ PASS: performance_issues table has enhanced columns'
        ELSE '❌ FAIL: performance_issues table missing enhanced columns'
    END as performance_issues_columns_test;

-- Test 3: Check if analyses table has Core Web Vitals columns
SELECT 
    CASE 
        WHEN EXISTS(
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'analyses' 
            AND column_name IN ('lcp_value', 'cls_value', 'tbt_value', 'fcp_value', 'performance_data')
        ) 
        THEN '✅ PASS: analyses table has Core Web Vitals columns'
        ELSE '❌ FAIL: analyses table missing Core Web Vitals columns'
    END as analyses_cwv_columns_test;

-- Test 4: Count performance rules
SELECT 
    CASE 
        WHEN rule_count >= 15 
        THEN '✅ PASS: ' || rule_count || ' performance rules found'
        ELSE '❌ FAIL: Only ' || rule_count || ' performance rules found (expected 15+)'
    END as performance_rules_count_test
FROM (
    SELECT COUNT(*) as rule_count 
    FROM rules r 
    JOIN analysis_modules m ON r.module_id = m.id 
    WHERE m.name = 'Performance'
) counts;

-- Test 5: Check Core Web Vitals specific rules
SELECT 
    CASE 
        WHEN cwv_rule_count >= 6 
        THEN '✅ PASS: ' || cwv_rule_count || ' Core Web Vitals rules found'
        ELSE '❌ FAIL: Only ' || cwv_rule_count || ' Core Web Vitals rules found (expected 6+)'
    END as cwv_rules_test
FROM (
    SELECT COUNT(*) as cwv_rule_count 
    FROM rules r 
    JOIN analysis_modules m ON r.module_id = m.id 
    WHERE m.name = 'Performance' AND r.rule_key LIKE 'PERF_CWV_%'
) cwv_counts;

-- Test 6: Check Image Optimization rules
SELECT 
    CASE 
        WHEN img_rule_count >= 4 
        THEN '✅ PASS: ' || img_rule_count || ' Image Optimization rules found'
        ELSE '❌ FAIL: Only ' || img_rule_count || ' Image Optimization rules found (expected 4+)'
    END as image_rules_test
FROM (
    SELECT COUNT(*) as img_rule_count 
    FROM rules r 
    JOIN analysis_modules m ON r.module_id = m.id 
    WHERE m.name = 'Performance' AND r.rule_key LIKE 'PERF_IMG_%'
) img_counts;

-- Test 7: Check indexes exist
SELECT 
    CASE 
        WHEN EXISTS(
            SELECT 1 FROM pg_indexes 
            WHERE indexname IN ('idx_analyses_lcp_value', 'idx_performance_issues_metric_value')
        ) 
        THEN '✅ PASS: Performance indexes created'
        ELSE '❌ FAIL: Performance indexes missing'
    END as performance_indexes_test;

-- Test 8: Check Core Web Vitals compliance standard mapping
SELECT 
    CASE 
        WHEN mapping_count >= 6 
        THEN '✅ PASS: ' || mapping_count || ' Core Web Vitals compliance mappings found'
        ELSE '❌ FAIL: Only ' || mapping_count || ' Core Web Vitals compliance mappings found (expected 6+)'
    END as cwv_compliance_test
FROM (
    SELECT COUNT(*) as mapping_count
    FROM standard_rules_mapping srm
    JOIN compliance_standards cs ON srm.standard_id = cs.id
    JOIN rules r ON srm.rule_id = r.id
    WHERE cs.name = 'Google Core Web Vitals'
) mapping_counts;

-- Summary: Show all performance rules for verification
SELECT 
    r.rule_key,
    r.name,
    r.description,
    r.default_severity
FROM rules r
JOIN analysis_modules m ON r.module_id = m.id
WHERE m.name = 'Performance'
ORDER BY r.rule_key;