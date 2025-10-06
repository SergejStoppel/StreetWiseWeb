-- Migration: Add Performance Metrics to Analyses Table
-- This migration adds detailed performance metrics columns to store Core Web Vitals and Lighthouse data

BEGIN;

-- Add Core Web Vitals metrics to analyses table
ALTER TABLE analyses 
ADD COLUMN IF NOT EXISTS lcp_value DECIMAL(8,3), -- Largest Contentful Paint in seconds
ADD COLUMN IF NOT EXISTS cls_value DECIMAL(8,3), -- Cumulative Layout Shift (unitless)  
ADD COLUMN IF NOT EXISTS tbt_value DECIMAL(8,3), -- Total Blocking Time in milliseconds
ADD COLUMN IF NOT EXISTS fcp_value DECIMAL(8,3), -- First Contentful Paint in seconds
ADD COLUMN IF NOT EXISTS performance_data JSONB; -- Full Lighthouse report data

-- Add performance-specific columns to performance_issues table
ALTER TABLE performance_issues
ADD COLUMN IF NOT EXISTS metric_value DECIMAL(10,3), -- Numeric metric value (LCP, CLS, etc.)
ADD COLUMN IF NOT EXISTS improvement_potential TEXT, -- Estimated improvement (e.g., "Save 2.5s", "Reduce by 0.15")
ADD COLUMN IF NOT EXISTS resource_url TEXT, -- URL of problematic resource (for images, JS, CSS)
ADD COLUMN IF NOT EXISTS savings_bytes INTEGER, -- Potential bytes saved
ADD COLUMN IF NOT EXISTS savings_ms INTEGER; -- Potential milliseconds saved

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_analyses_lcp_value ON analyses(lcp_value);
CREATE INDEX IF NOT EXISTS idx_analyses_cls_value ON analyses(cls_value);
CREATE INDEX IF NOT EXISTS idx_analyses_tbt_value ON analyses(tbt_value);
CREATE INDEX IF NOT EXISTS idx_performance_issues_metric_value ON performance_issues(metric_value);
CREATE INDEX IF NOT EXISTS idx_performance_issues_resource_url ON performance_issues(resource_url);

-- Add comments for documentation
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