-- Complete Performance Analysis Setup Migration
-- This comprehensive migration adds all necessary components for Performance analysis
-- Run this on existing databases to add performance analysis capabilities

BEGIN;

-- ==========================================
-- 1. Add Core Web Vitals metrics to analyses table
-- ==========================================

ALTER TABLE analyses 
ADD COLUMN IF NOT EXISTS lcp_value DECIMAL(8,3), -- Largest Contentful Paint in seconds
ADD COLUMN IF NOT EXISTS cls_value DECIMAL(8,3), -- Cumulative Layout Shift (unitless)  
ADD COLUMN IF NOT EXISTS tbt_value DECIMAL(8,3), -- Total Blocking Time in milliseconds
ADD COLUMN IF NOT EXISTS fcp_value DECIMAL(8,3), -- First Contentful Paint in seconds
ADD COLUMN IF NOT EXISTS performance_data JSONB; -- Full Lighthouse report data

-- ==========================================
-- 2. Add performance-specific columns to performance_issues table
-- ==========================================

ALTER TABLE performance_issues
ADD COLUMN IF NOT EXISTS metric_value DECIMAL(10,3), -- Numeric metric value (LCP, CLS, etc.)
ADD COLUMN IF NOT EXISTS improvement_potential TEXT, -- Estimated improvement (e.g., "Save 2.5s", "Reduce by 0.15")
ADD COLUMN IF NOT EXISTS resource_url TEXT, -- URL of problematic resource (for images, JS, CSS)
ADD COLUMN IF NOT EXISTS savings_bytes INTEGER, -- Potential bytes saved
ADD COLUMN IF NOT EXISTS savings_ms INTEGER; -- Potential milliseconds saved

-- ==========================================
-- 3. Add indexes for performance optimization
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_analyses_lcp_value ON analyses(lcp_value);
CREATE INDEX IF NOT EXISTS idx_analyses_cls_value ON analyses(cls_value);
CREATE INDEX IF NOT EXISTS idx_analyses_tbt_value ON analyses(tbt_value);
CREATE INDEX IF NOT EXISTS idx_performance_issues_metric_value ON performance_issues(metric_value);
CREATE INDEX IF NOT EXISTS idx_performance_issues_resource_url ON performance_issues(resource_url);

-- ==========================================
-- 4. Add Performance module if it doesn't exist
-- ==========================================

INSERT INTO analysis_modules (name, description) VALUES
('Performance', 'Website performance and Core Web Vitals measurement - 20+ comprehensive rules')
ON CONFLICT (name) DO UPDATE SET 
    description = EXCLUDED.description;

-- ==========================================
-- 5. Add Core Web Vitals compliance standard
-- ==========================================

INSERT INTO compliance_standards (name) VALUES
('Google Core Web Vitals')
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- 6. Add comprehensive performance rules
-- ==========================================

DO $$
DECLARE
    performance_module_id UUID;
    cwv_standard_id UUID;
BEGIN
    -- Get module and standard IDs
    SELECT id INTO performance_module_id FROM analysis_modules WHERE name = 'Performance';
    SELECT id INTO cwv_standard_id FROM compliance_standards WHERE name = 'Google Core Web Vitals';

    -- Core Web Vitals Rules (with specific thresholds)
    INSERT INTO rules (module_id, rule_key, name, description, default_severity) VALUES
    (performance_module_id, 'PERF_CWV_01_LCP_POOR', 'Poor Largest Contentful Paint', 'LCP is over 4 seconds, significantly impacting user experience', 'critical'),
    (performance_module_id, 'PERF_CWV_02_LCP_NEEDS_IMPROVEMENT', 'LCP Needs Improvement', 'LCP is between 2.5-4 seconds and needs optimization', 'serious'),
    (performance_module_id, 'PERF_CWV_03_CLS_POOR', 'Poor Cumulative Layout Shift', 'CLS is over 0.25, causing visual instability', 'serious'),
    (performance_module_id, 'PERF_CWV_04_CLS_NEEDS_IMPROVEMENT', 'CLS Needs Improvement', 'CLS is between 0.1-0.25 and should be optimized', 'moderate'),
    (performance_module_id, 'PERF_CWV_05_TBT_POOR', 'Poor Total Blocking Time', 'TBT is over 600ms, severely impacting interactivity', 'critical'),
    (performance_module_id, 'PERF_CWV_06_TBT_NEEDS_IMPROVEMENT', 'TBT Needs Improvement', 'TBT is between 200-600ms and needs optimization', 'serious'),
    
    -- Image Optimization Rules
    (performance_module_id, 'PERF_IMG_01_FORMAT_NOT_OPTIMIZED', 'Images Not Using Next-Gen Formats', 'Images should use WebP or AVIF for better compression', 'moderate'),
    (performance_module_id, 'PERF_IMG_02_OVERSIZED_IMAGES', 'Images Are Oversized', 'Images are rendered smaller than their actual size', 'moderate'),
    (performance_module_id, 'PERF_IMG_03_MISSING_DIMENSIONS', 'Images Missing Width/Height', 'Images lack width and height attributes causing layout shifts', 'serious'),
    (performance_module_id, 'PERF_IMG_04_LARGE_FILE_SIZE', 'Large Image File Sizes', 'Images are unnecessarily large and slow to load', 'serious'),
    
    -- Resource Optimization Rules
    (performance_module_id, 'PERF_RES_01_RENDER_BLOCKING', 'Render-Blocking Resources', 'CSS and JS resources are blocking initial render', 'serious'),
    (performance_module_id, 'PERF_RES_02_UNUSED_CODE', 'Unused CSS/JavaScript', 'Page contains significant unused code', 'moderate'),
    (performance_module_id, 'PERF_RES_03_COMPRESSION', 'Missing Resource Compression', 'Text resources should be compressed (gzip/brotli)', 'moderate'),
    (performance_module_id, 'PERF_RES_04_UNUSED_JS', 'Unused JavaScript Code', 'Remove unused JavaScript to improve execution speed', 'serious'),
    (performance_module_id, 'PERF_RES_05_IMAGE_LAZY_LOADING', 'Images Not Lazy Loaded', 'Non-critical images should be lazy loaded to improve initial load', 'moderate'),
    
    -- Caching & Delivery Rules  
    (performance_module_id, 'PERF_CACHE_01_INEFFICIENT', 'Inefficient Cache Policy', 'Resources lack appropriate cache headers', 'moderate'),
    (performance_module_id, 'PERF_CACHE_02_COMPRESSION', 'Resource Compression Missing', 'Enable gzip/brotli compression for faster transfers', 'serious'),
    (performance_module_id, 'PERF_CACHE_03_BROWSER_CACHING', 'Missing Browser Cache Headers', 'Implement proper cache headers for repeat visit performance', 'serious'),
    
    -- JavaScript & Interactivity Rules
    (performance_module_id, 'PERF_JS_01_MAIN_THREAD_BLOCKING', 'Main Thread Blocking', 'Long JavaScript tasks block user interactions', 'critical'),
    (performance_module_id, 'PERF_JS_02_CODE_SPLITTING', 'No Code Splitting', 'Implement code splitting to reduce initial bundle size', 'moderate'),
    (performance_module_id, 'PERF_JS_03_THIRD_PARTY_IMPACT', 'High Third-Party Impact', 'Third-party scripts significantly impact performance', 'serious')
    ON CONFLICT (rule_key) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        default_severity = EXCLUDED.default_severity;

    -- Map Core Web Vitals rules to the CWV compliance standard
    INSERT INTO standard_rules_mapping (standard_id, rule_id)
    SELECT cwv_standard_id, id FROM rules 
    WHERE module_id = performance_module_id 
    AND rule_key IN (
        'PERF_CWV_01_LCP_POOR', 'PERF_CWV_02_LCP_NEEDS_IMPROVEMENT',
        'PERF_CWV_03_CLS_POOR', 'PERF_CWV_04_CLS_NEEDS_IMPROVEMENT', 
        'PERF_CWV_05_TBT_POOR', 'PERF_CWV_06_TBT_NEEDS_IMPROVEMENT'
    )
    ON CONFLICT (standard_id, rule_id) DO NOTHING;

END $$;

-- ==========================================
-- 7. Add helpful comments for documentation
-- ==========================================

COMMENT ON COLUMN analyses.lcp_value IS 'Largest Contentful Paint in seconds (Core Web Vital)';
COMMENT ON COLUMN analyses.cls_value IS 'Cumulative Layout Shift unitless score (Core Web Vital)';
COMMENT ON COLUMN analyses.tbt_value IS 'Total Blocking Time in milliseconds (interactivity proxy)';
COMMENT ON COLUMN analyses.fcp_value IS 'First Contentful Paint in seconds';
COMMENT ON COLUMN analyses.performance_data IS 'Full Lighthouse report JSON for detailed analysis';

COMMENT ON COLUMN performance_issues.metric_value IS 'Numeric value of the performance metric (LCP: 4.2, CLS: 0.25, etc.)';
COMMENT ON COLUMN performance_issues.improvement_potential IS 'Human-readable improvement estimate (Save 2.5s loading time)';
COMMENT ON COLUMN performance_issues.resource_url IS 'URL of the resource causing the performance issue';
COMMENT ON COLUMN performance_issues.savings_bytes IS 'Potential bytes saved by fixing this issue';
COMMENT ON COLUMN performance_issues.savings_ms IS 'Potential milliseconds saved by fixing this issue';

COMMIT;

-- ==========================================
-- Migration Complete!
-- ==========================================

-- Verify the migration was successful
DO $$
BEGIN
    -- Check if performance module exists
    ASSERT EXISTS(SELECT 1 FROM analysis_modules WHERE name = 'Performance'), 'Performance module was not created';
    
    -- Check if Core Web Vitals rules exist
    ASSERT EXISTS(SELECT 1 FROM rules WHERE rule_key = 'PERF_CWV_01_LCP_POOR'), 'Core Web Vitals rules were not created';
    
    -- Check if new columns exist
    ASSERT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'analyses' AND column_name = 'lcp_value'
    ), 'Performance metrics columns were not added to analyses table';
    
    -- Check if performance_issues enhancements exist
    ASSERT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'performance_issues' AND column_name = 'metric_value'
    ), 'Performance-specific columns were not added to performance_issues table';

    RAISE NOTICE 'Performance Analysis setup completed successfully!';
    RAISE NOTICE 'Added: Core Web Vitals metrics, performance rules, and enhanced issue tracking';
    RAISE NOTICE 'Database is ready for Performance analysis workers.';
END $$;