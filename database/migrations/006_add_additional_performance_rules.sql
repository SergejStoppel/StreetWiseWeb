-- Migration: Add Additional Performance Rules
-- Adds specific rules for our Core Web Vitals and Image Optimization workers

BEGIN;

-- Get performance module ID
DO $$
DECLARE
    performance_module_id UUID;
BEGIN
    SELECT id INTO performance_module_id FROM analysis_modules WHERE name = 'Performance';

    -- Add additional specific rules for our implementation
    INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
    -- Core Web Vitals - More specific thresholds
    (performance_module_id, 'PERF_CWV_01_LCP_POOR', 'Poor Largest Contentful Paint', 'LCP is over 4 seconds, significantly impacting user experience', 'critical'),
    (performance_module_id, 'PERF_CWV_02_LCP_NEEDS_IMPROVEMENT', 'LCP Needs Improvement', 'LCP is between 2.5-4 seconds and needs optimization', 'serious'),
    (performance_module_id, 'PERF_CWV_03_CLS_POOR', 'Poor Cumulative Layout Shift', 'CLS is over 0.25, causing visual instability', 'serious'),
    (performance_module_id, 'PERF_CWV_04_CLS_NEEDS_IMPROVEMENT', 'CLS Needs Improvement', 'CLS is between 0.1-0.25 and should be optimized', 'moderate'),
    (performance_module_id, 'PERF_CWV_05_TBT_POOR', 'Poor Total Blocking Time', 'TBT is over 600ms, severely impacting interactivity', 'critical'),
    (performance_module_id, 'PERF_CWV_06_TBT_NEEDS_IMPROVEMENT', 'TBT Needs Improvement', 'TBT is between 200-600ms and needs optimization', 'serious'),
    
    -- Image Optimization - Specific implementation rules
    (performance_module_id, 'PERF_IMG_01_FORMAT_NOT_OPTIMIZED', 'Images Not Using Next-Gen Formats', 'Images should use WebP or AVIF for better compression', 'moderate'),
    (performance_module_id, 'PERF_IMG_02_OVERSIZED_IMAGES', 'Images Are Oversized', 'Images are rendered smaller than their actual size', 'moderate'),
    (performance_module_id, 'PERF_IMG_03_MISSING_DIMENSIONS', 'Images Missing Width/Height', 'Images lack width and height attributes causing layout shifts', 'serious'),
    (performance_module_id, 'PERF_IMG_04_LARGE_FILE_SIZE', 'Large Image File Sizes', 'Images are unnecessarily large and slow to load', 'serious'),
    
    -- Additional Resource Optimization
    (performance_module_id, 'PERF_RES_01_RENDER_BLOCKING', 'Render-Blocking Resources', 'CSS and JS resources are blocking initial render', 'serious'),
    (performance_module_id, 'PERF_RES_02_UNUSED_CODE', 'Unused CSS/JavaScript', 'Page contains significant unused code', 'moderate'),
    (performance_module_id, 'PERF_RES_03_COMPRESSION', 'Missing Resource Compression', 'Text resources should be compressed (gzip/brotli)', 'moderate'),
    (performance_module_id, 'PERF_CACHE_01_INEFFICIENT', 'Inefficient Cache Policy', 'Resources lack appropriate cache headers', 'moderate')
    ON CONFLICT (rule_key) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        default_severity = EXCLUDED.default_severity;

END $$;

COMMIT;