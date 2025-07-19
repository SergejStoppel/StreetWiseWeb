-- StreetWiseWeb Database Optimization Migration
-- Version: 001
-- Description: Optimize database structure for better performance and data cleanup
-- Date: 2025-01-19

-- =============================================================================
-- 1. FIX CASCADE RELATIONSHIPS
-- =============================================================================

-- Fix analyses table to CASCADE delete when user is deleted
ALTER TABLE public.analyses 
DROP CONSTRAINT IF EXISTS analyses_user_id_fkey,
ADD CONSTRAINT analyses_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.user_profiles(id) 
    ON DELETE CASCADE;

-- Fix usage_logs to CASCADE delete when user is deleted
ALTER TABLE public.usage_logs 
DROP CONSTRAINT IF EXISTS usage_logs_user_id_fkey,
ADD CONSTRAINT usage_logs_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.user_profiles(id) 
    ON DELETE CASCADE;

-- =============================================================================
-- 2. CREATE STORAGE TRACKING TABLE
-- =============================================================================

-- Track all storage objects for proper cleanup
CREATE TABLE IF NOT EXISTS public.storage_objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE,
    bucket_id TEXT NOT NULL DEFAULT 'analysis-screenshots',
    object_path TEXT NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    mime_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(bucket_id, object_path)
);

CREATE INDEX idx_storage_objects_user ON public.storage_objects(user_id);
CREATE INDEX idx_storage_objects_analysis ON public.storage_objects(analysis_id);

-- =============================================================================
-- 3. OPTIMIZE ANALYSES TABLE STRUCTURE
-- =============================================================================

-- Create separate table for violations (large JSONB data)
CREATE TABLE IF NOT EXISTS public.analysis_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE,
    violations JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analysis_violations_analysis ON public.analysis_violations(analysis_id);
CREATE INDEX idx_analysis_violations_gin ON public.analysis_violations USING gin(violations);

-- Create separate table for screenshots
CREATE TABLE IF NOT EXISTS public.analysis_screenshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE,
    screenshot_type VARCHAR(50) NOT NULL CHECK (screenshot_type IN ('desktop', 'mobile', 'full')),
    storage_path TEXT,
    screenshot_data JSONB, -- For legacy base64 data
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analysis_screenshots_analysis ON public.analysis_screenshots(analysis_id);

-- Create summary table for fast dashboard queries
CREATE TABLE IF NOT EXISTS public.analysis_summaries (
    analysis_id UUID PRIMARY KEY REFERENCES public.analyses(id) ON DELETE CASCADE,
    total_issues INTEGER DEFAULT 0,
    critical_issues INTEGER DEFAULT 0,
    serious_issues INTEGER DEFAULT 0,
    moderate_issues INTEGER DEFAULT 0,
    minor_issues INTEGER DEFAULT 0,
    images_without_alt INTEGER DEFAULT 0,
    forms_without_labels INTEGER DEFAULT 0,
    color_contrast_violations INTEGER DEFAULT 0,
    wcag_level VARCHAR(3),
    compliance_percentage NUMERIC(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_analyses_user_url_hash ON public.analyses(user_id, url_hash);
CREATE INDEX IF NOT EXISTS idx_analyses_user_status_created ON public.analyses(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_scores ON public.analyses(overall_score, accessibility_score, seo_score, performance_score);

-- =============================================================================
-- 4. CREATE DELETION LOGS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.deletion_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    deleted_at TIMESTAMPTZ DEFAULT NOW(),
    data_types TEXT[],
    metadata JSONB
);

CREATE INDEX idx_deletion_logs_user ON public.deletion_logs(user_id);
CREATE INDEX idx_deletion_logs_deleted_at ON public.deletion_logs(deleted_at DESC);

-- =============================================================================
-- 5. CREATE CLEANUP FUNCTIONS
-- =============================================================================

-- Function to cleanup user data before deletion
CREATE OR REPLACE FUNCTION public.cleanup_user_data_before_delete()
RETURNS TRIGGER AS $$
DECLARE
    v_storage_path TEXT;
    v_deleted_count INTEGER := 0;
BEGIN
    -- Log deletion for audit
    INSERT INTO public.deletion_logs (user_id, deleted_at, data_types, metadata)
    VALUES (
        OLD.id, 
        NOW(), 
        ARRAY['analyses', 'projects', 'storage', 'usage_logs'],
        jsonb_build_object(
            'email', OLD.email,
            'deletion_triggered_by', current_user
        )
    );
    
    -- Count items being deleted for logging
    SELECT COUNT(*) INTO v_deleted_count
    FROM public.analyses
    WHERE user_id = OLD.id;
    
    RAISE NOTICE 'Deleting user % with % analyses', OLD.id, v_deleted_count;
    
    -- Storage cleanup will be handled by storage_objects CASCADE delete
    -- and a separate cleanup job for the actual files
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user deletion
DROP TRIGGER IF EXISTS cleanup_before_user_delete ON public.user_profiles;
CREATE TRIGGER cleanup_before_user_delete
    BEFORE DELETE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.cleanup_user_data_before_delete();

-- Function to track storage uploads
CREATE OR REPLACE FUNCTION public.track_storage_upload()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_analysis_id UUID;
    v_file_size BIGINT;
BEGIN
    -- Only track objects in analysis-screenshots bucket
    IF NEW.bucket_id != 'analysis-screenshots' THEN
        RETURN NEW;
    END IF;
    
    -- Extract user_id and analysis_id from path
    -- Path format: {user_id}/{analysis_id}/screenshots/{filename}
    -- or: anonymous/{analysis_id}/screenshots/{filename}
    IF NEW.name ~ '^[a-f0-9-]{36}/[a-f0-9-]{36}/' THEN
        v_user_id := split_part(NEW.name, '/', 1)::UUID;
        v_analysis_id := split_part(NEW.name, '/', 2)::UUID;
    ELSIF NEW.name ~ '^anonymous/[a-f0-9-]{36}/' THEN
        v_user_id := NULL;
        v_analysis_id := split_part(NEW.name, '/', 2)::UUID;
    ELSE
        -- Path doesn't match expected format, skip
        RETURN NEW;
    END IF;
    
    -- Get file size from metadata
    v_file_size := COALESCE((NEW.metadata->>'size')::BIGINT, 0);
    
    -- Track the object
    INSERT INTO public.storage_objects (
        user_id, 
        analysis_id, 
        bucket_id, 
        object_path, 
        file_size,
        mime_type
    ) VALUES (
        v_user_id,
        v_analysis_id,
        NEW.bucket_id,
        NEW.name,
        v_file_size,
        NEW.metadata->>'mimetype'
    ) ON CONFLICT (bucket_id, object_path) 
    DO UPDATE SET
        file_size = EXCLUDED.file_size,
        mime_type = EXCLUDED.mime_type;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Storage trigger needs to be added via Supabase SQL Editor with proper permissions
-- UNCOMMENT AND RUN IN SUPABASE SQL EDITOR:
-- CREATE TRIGGER track_storage_upload_trigger
--     AFTER INSERT OR UPDATE ON storage.objects
--     FOR EACH ROW EXECUTE FUNCTION public.track_storage_upload();

-- =============================================================================
-- 6. BATCH OPERATION FUNCTIONS
-- =============================================================================

-- Batch delete old anonymous analyses
CREATE OR REPLACE FUNCTION public.cleanup_anonymous_analyses(p_days_old INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM public.analyses
        WHERE is_anonymous = true
        AND created_at < NOW() - INTERVAL '1 day' * p_days_old
        AND (cache_expires_at IS NULL OR cache_expires_at < NOW())
        RETURNING id
    )
    SELECT COUNT(*) INTO v_deleted_count FROM deleted;
    
    RAISE NOTICE 'Deleted % anonymous analyses older than % days', v_deleted_count, p_days_old;
    RETURN v_deleted_count;
END;
$$;

-- Delete orphaned storage objects
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_storage()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM public.storage_objects so
        WHERE NOT EXISTS (
            SELECT 1 FROM public.analyses a 
            WHERE a.id = so.analysis_id
        )
        RETURNING id
    )
    SELECT COUNT(*) INTO v_deleted_count FROM deleted;
    
    RAISE NOTICE 'Deleted % orphaned storage objects', v_deleted_count;
    RETURN v_deleted_count;
END;
$$;

-- =============================================================================
-- 7. CREATE MATERIALIZED VIEW FOR DASHBOARD
-- =============================================================================

-- Fast dashboard query using materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS public.user_dashboard_stats AS
SELECT 
    u.id as user_id,
    COUNT(DISTINCT a.id) as total_analyses,
    COUNT(DISTINCT a.id) FILTER (WHERE a.created_at > NOW() - INTERVAL '30 days') as recent_analyses,
    AVG(a.overall_score)::INTEGER as avg_overall_score,
    AVG(a.accessibility_score)::INTEGER as avg_accessibility_score,
    AVG(a.seo_score)::INTEGER as avg_seo_score,
    AVG(a.performance_score)::INTEGER as avg_performance_score,
    MAX(a.created_at) as last_analysis_date,
    COALESCE(SUM(so.file_size), 0) as total_storage_used
FROM public.user_profiles u
LEFT JOIN public.analyses a ON u.id = a.user_id AND a.status = 'completed'
LEFT JOIN public.storage_objects so ON u.id = so.user_id
GROUP BY u.id;

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_dashboard_stats_user ON public.user_dashboard_stats(user_id);

-- Refresh function
CREATE OR REPLACE FUNCTION public.refresh_dashboard_stats()
RETURNS void
LANGUAGE sql
AS $$
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_dashboard_stats;
$$;

-- =============================================================================
-- 8. DAILY CLEANUP JOB
-- =============================================================================

CREATE OR REPLACE FUNCTION public.daily_cleanup()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_anonymous_deleted INTEGER;
    v_orphaned_deleted INTEGER;
BEGIN
    -- 1. Delete old anonymous analyses (30+ days)
    v_anonymous_deleted := public.cleanup_anonymous_analyses(30);
    
    -- 2. Delete orphaned storage objects
    v_orphaned_deleted := public.cleanup_orphaned_storage();
    
    -- 3. Log cleanup results
    INSERT INTO public.deletion_logs (
        user_id, 
        deleted_at, 
        data_types, 
        metadata
    ) VALUES (
        NULL,
        NOW(),
        ARRAY['cleanup_job'],
        jsonb_build_object(
            'anonymous_analyses_deleted', v_anonymous_deleted,
            'orphaned_storage_deleted', v_orphaned_deleted,
            'job_type', 'daily_cleanup'
        )
    );
    
    -- 4. Refresh materialized views
    PERFORM public.refresh_dashboard_stats();
    
    RAISE NOTICE 'Daily cleanup completed: % anonymous analyses, % orphaned storage objects', 
                 v_anonymous_deleted, v_orphaned_deleted;
END;
$$;

-- =============================================================================
-- 9. MIGRATE EXISTING DATA
-- =============================================================================

-- Populate storage_objects from existing data
INSERT INTO public.storage_objects (user_id, analysis_id, bucket_id, object_path, file_size, mime_type)
SELECT 
    a.user_id,
    a.id,
    'analysis-screenshots',
    CASE 
        WHEN a.user_id IS NOT NULL THEN a.user_id || '/' || a.id || '/screenshots/desktop.jpg'
        ELSE 'anonymous/' || a.id || '/screenshots/desktop.jpg'
    END,
    1024000, -- Default 1MB estimate
    'image/jpeg'
FROM public.analyses a
WHERE a.screenshots IS NOT NULL
AND a.screenshots->>'desktop' IS NOT NULL
ON CONFLICT (bucket_id, object_path) DO NOTHING;

-- Populate analysis_summaries from existing data
INSERT INTO public.analysis_summaries (
    analysis_id,
    total_issues,
    critical_issues,
    serious_issues,
    moderate_issues,
    minor_issues,
    images_without_alt,
    forms_without_labels,
    color_contrast_violations,
    wcag_level,
    compliance_percentage
)
SELECT 
    a.id,
    COALESCE((a.summary->>'totalIssues')::INTEGER, 0),
    COALESCE((a.summary->>'criticalIssues')::INTEGER, 0),
    COALESCE((a.summary->>'seriousIssues')::INTEGER, 0),
    COALESCE((a.summary->>'moderateIssues')::INTEGER, 0),
    COALESCE((a.summary->>'minorIssues')::INTEGER, 0),
    COALESCE((a.summary->>'imagesWithoutAlt')::INTEGER, 0),
    COALESCE((a.summary->>'formsWithoutLabels')::INTEGER, 0),
    COALESCE((a.summary->>'colorContrastViolations')::INTEGER, 0),
    a.summary->>'wcagLevel',
    COALESCE((a.summary->>'compliancePercentage')::NUMERIC, 0)
FROM public.analyses a
WHERE a.summary IS NOT NULL
ON CONFLICT (analysis_id) DO NOTHING;

-- Populate initial materialized view
REFRESH MATERIALIZED VIEW public.user_dashboard_stats;

-- =============================================================================
-- 10. GRANT PERMISSIONS
-- =============================================================================

-- Grant permissions on new tables
GRANT SELECT ON public.storage_objects TO authenticated;
GRANT SELECT ON public.analysis_violations TO authenticated;
GRANT SELECT ON public.analysis_screenshots TO authenticated;
GRANT SELECT ON public.analysis_summaries TO authenticated;
GRANT SELECT ON public.deletion_logs TO authenticated;
GRANT SELECT ON public.user_dashboard_stats TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.cleanup_anonymous_analyses TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_orphaned_storage TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_dashboard_stats TO service_role;
GRANT EXECUTE ON FUNCTION public.daily_cleanup TO service_role;

-- =============================================================================
-- Migration completed successfully!
-- =============================================================================