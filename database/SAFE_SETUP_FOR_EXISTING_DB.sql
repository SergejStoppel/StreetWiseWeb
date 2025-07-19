-- StreetWiseWeb Safe Setup for Existing Database
-- This script safely updates an existing database to the optimized structure
-- Run this in your Supabase SQL Editor if you already have some data

-- =============================================================================
-- 1. CREATE NEW OPTIMIZED TABLES (IF NOT EXISTS)
-- =============================================================================

-- Storage tracking table
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

-- Separate table for violations (large JSONB data)
CREATE TABLE IF NOT EXISTS public.analysis_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE,
    violations JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Separate table for screenshots
CREATE TABLE IF NOT EXISTS public.analysis_screenshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE,
    screenshot_url TEXT NOT NULL,
    screenshot_type VARCHAR(50) DEFAULT 'main',
    storage_object_id UUID REFERENCES public.storage_objects(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pre-computed analysis summaries for fast dashboard queries
CREATE TABLE IF NOT EXISTS public.analysis_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE,
    total_issues INTEGER DEFAULT 0,
    critical_issues INTEGER DEFAULT 0,
    serious_issues INTEGER DEFAULT 0,
    moderate_issues INTEGER DEFAULT 0,
    minor_issues INTEGER DEFAULT 0,
    contrast_errors INTEGER DEFAULT 0,
    missing_alt_text INTEGER DEFAULT 0,
    form_issues INTEGER DEFAULT 0,
    aria_issues INTEGER DEFAULT 0,
    keyboard_issues INTEGER DEFAULT 0,
    heading_issues INTEGER DEFAULT 0,
    landmark_issues INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deletion logs for audit trail
CREATE TABLE IF NOT EXISTS public.deletion_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    deleted_at TIMESTAMPTZ DEFAULT NOW(),
    deletion_type VARCHAR(50) NOT NULL,
    deleted_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'
);

-- =============================================================================
-- 2. UPDATE FOREIGN KEY CONSTRAINTS TO CASCADE
-- =============================================================================

-- Update analyses table foreign key to CASCADE
DO $$
BEGIN
    -- Check if the constraint exists and update it
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'analyses_user_id_fkey' 
        AND table_name = 'analyses'
    ) THEN
        ALTER TABLE public.analyses 
        DROP CONSTRAINT analyses_user_id_fkey,
        ADD CONSTRAINT analyses_user_id_fkey 
            FOREIGN KEY (user_id) 
            REFERENCES public.user_profiles(id) 
            ON DELETE CASCADE;
    END IF;
END $$;

-- Update usage_logs table foreign key to CASCADE
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'usage_logs_user_id_fkey' 
        AND table_name = 'usage_logs'
    ) THEN
        ALTER TABLE public.usage_logs 
        DROP CONSTRAINT usage_logs_user_id_fkey,
        ADD CONSTRAINT usage_logs_user_id_fkey 
            FOREIGN KEY (user_id) 
            REFERENCES public.user_profiles(id) 
            ON DELETE CASCADE;
    END IF;
END $$;

-- =============================================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Storage objects indexes
CREATE INDEX IF NOT EXISTS idx_storage_objects_user ON public.storage_objects(user_id);
CREATE INDEX IF NOT EXISTS idx_storage_objects_analysis ON public.storage_objects(analysis_id);

-- Violations indexes
CREATE INDEX IF NOT EXISTS idx_analysis_violations_analysis ON public.analysis_violations(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analysis_violations_gin ON public.analysis_violations USING gin(violations);

-- Screenshots indexes
CREATE INDEX IF NOT EXISTS idx_analysis_screenshots_analysis ON public.analysis_screenshots(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analysis_screenshots_type ON public.analysis_screenshots(screenshot_type);

-- Summaries indexes
CREATE INDEX IF NOT EXISTS idx_analysis_summaries_analysis ON public.analysis_summaries(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analysis_summaries_issues ON public.analysis_summaries(total_issues, critical_issues);

-- Additional performance indexes
CREATE INDEX IF NOT EXISTS idx_analyses_user_created ON public.analyses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_scores ON public.analyses(overall_score, accessibility_score, seo_score);

-- =============================================================================
-- 4. CREATE MATERIALIZED VIEW FOR DASHBOARD STATS
-- =============================================================================

-- Drop existing view if it exists and recreate
DROP MATERIALIZED VIEW IF EXISTS public.user_dashboard_stats;

CREATE MATERIALIZED VIEW public.user_dashboard_stats AS
SELECT 
    u.id as user_id,
    COUNT(DISTINCT a.id) as total_analyses,
    COUNT(DISTINCT p.id) as total_projects,
    COALESCE(AVG(a.overall_score), 0) as avg_overall_score,
    COALESCE(AVG(a.accessibility_score), 0) as avg_accessibility_score,
    COALESCE(AVG(a.seo_score), 0) as avg_seo_score,
    COALESCE(AVG(a.performance_score), 0) as avg_performance_score,
    MAX(a.created_at) as last_analysis_date,
    COALESCE(SUM(so.file_size), 0) as total_storage_used
FROM public.user_profiles u
LEFT JOIN public.analyses a ON a.user_id = u.id AND a.status = 'completed'
LEFT JOIN public.projects p ON p.user_id = u.id
LEFT JOIN public.storage_objects so ON so.user_id = u.id
GROUP BY u.id;

CREATE UNIQUE INDEX idx_user_dashboard_stats_user ON public.user_dashboard_stats(user_id);

-- =============================================================================
-- 5. CREATE CLEANUP AND UTILITY FUNCTIONS
-- =============================================================================

-- Function to refresh dashboard stats
DROP FUNCTION IF EXISTS public.refresh_dashboard_stats();
CREATE FUNCTION public.refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_dashboard_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup user data before deletion
DROP FUNCTION IF EXISTS public.cleanup_user_data_before_delete();
CREATE FUNCTION public.cleanup_user_data_before_delete()
RETURNS TRIGGER AS $$
DECLARE
    deleted_analyses_count INTEGER;
    deleted_projects_count INTEGER;
    deleted_storage_count INTEGER;
BEGIN
    -- Count items being deleted for logging
    SELECT COUNT(*) INTO deleted_analyses_count FROM public.analyses WHERE user_id = OLD.id;
    SELECT COUNT(*) INTO deleted_projects_count FROM public.projects WHERE user_id = OLD.id;
    SELECT COUNT(*) INTO deleted_storage_count FROM public.storage_objects WHERE user_id = OLD.id;
    
    -- Log the deletion
    INSERT INTO public.deletion_logs (user_id, deletion_type, deleted_count, metadata)
    VALUES (
        OLD.id, 
        'user_deletion', 
        deleted_analyses_count + deleted_projects_count,
        jsonb_build_object(
            'analyses_count', deleted_analyses_count,
            'projects_count', deleted_projects_count,
            'storage_objects_count', deleted_storage_count,
            'email', OLD.email
        )
    );
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup anonymous analyses older than 7 days
DROP FUNCTION IF EXISTS public.cleanup_anonymous_analyses();
CREATE FUNCTION public.cleanup_anonymous_analyses()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.analyses
    WHERE is_anonymous = TRUE 
    AND created_at < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    IF deleted_count > 0 THEN
        INSERT INTO public.deletion_logs (deletion_type, deleted_count, metadata)
        VALUES ('anonymous_cleanup', deleted_count, jsonb_build_object('cleanup_date', NOW()));
    END IF;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup orphaned storage objects
DROP FUNCTION IF EXISTS public.cleanup_orphaned_storage();
CREATE FUNCTION public.cleanup_orphaned_storage()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.storage_objects
    WHERE analysis_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM public.analyses WHERE id = storage_objects.analysis_id
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Main daily cleanup function
DROP FUNCTION IF EXISTS public.daily_cleanup();
CREATE FUNCTION public.daily_cleanup()
RETURNS JSONB AS $$
DECLARE
    anonymous_deleted INTEGER;
    orphaned_deleted INTEGER;
    result JSONB;
BEGIN
    -- Cleanup anonymous analyses
    anonymous_deleted := public.cleanup_anonymous_analyses();
    
    -- Cleanup orphaned storage
    orphaned_deleted := public.cleanup_orphaned_storage();
    
    -- Refresh materialized view
    PERFORM public.refresh_dashboard_stats();
    
    result := jsonb_build_object(
        'anonymous_analyses_deleted', anonymous_deleted,
        'orphaned_storage_deleted', orphaned_deleted,
        'cleanup_date', NOW()
    );
    
    INSERT INTO public.deletion_logs (deletion_type, deleted_count, metadata)
    VALUES ('daily_cleanup', anonymous_deleted + orphaned_deleted, result);
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 6. CREATE TRIGGERS (SAFELY)
-- =============================================================================

-- Drop existing triggers first to avoid conflicts
DROP TRIGGER IF EXISTS before_user_delete ON public.user_profiles;
DROP TRIGGER IF EXISTS update_analysis_summaries_updated_at ON public.analysis_summaries;

-- Trigger for user deletion cleanup
CREATE TRIGGER before_user_delete
    BEFORE DELETE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.cleanup_user_data_before_delete();

-- Trigger to update timestamps
DROP FUNCTION IF EXISTS public.update_updated_at_column();
CREATE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update trigger
CREATE TRIGGER update_analysis_summaries_updated_at
    BEFORE UPDATE ON public.analysis_summaries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- 7. UPDATE RLS POLICIES (SAFELY)
-- =============================================================================

-- Enable RLS on new tables
ALTER TABLE public.storage_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_summaries ENABLE ROW LEVEL SECURITY;

-- Storage objects policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'storage_objects' AND policyname = 'Users can view their own storage objects'
    ) THEN
        CREATE POLICY "Users can view their own storage objects"
            ON public.storage_objects FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'storage_objects' AND policyname = 'Users can create their own storage objects'
    ) THEN
        CREATE POLICY "Users can create their own storage objects"
            ON public.storage_objects FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'storage_objects' AND policyname = 'Users can delete their own storage objects'
    ) THEN
        CREATE POLICY "Users can delete their own storage objects"
            ON public.storage_objects FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- Analysis violations policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'analysis_violations' AND policyname = 'Users can view violations for their analyses'
    ) THEN
        CREATE POLICY "Users can view violations for their analyses"
            ON public.analysis_violations FOR SELECT
            USING (EXISTS (
                SELECT 1 FROM public.analyses 
                WHERE analyses.id = analysis_violations.analysis_id 
                AND analyses.user_id = auth.uid()
            ));
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'analysis_violations' AND policyname = 'Users can create violations for their analyses'
    ) THEN
        CREATE POLICY "Users can create violations for their analyses"
            ON public.analysis_violations FOR INSERT
            WITH CHECK (EXISTS (
                SELECT 1 FROM public.analyses 
                WHERE analyses.id = analysis_violations.analysis_id 
                AND analyses.user_id = auth.uid()
            ));
    END IF;
END $$;

-- Analysis screenshots policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'analysis_screenshots' AND policyname = 'Users can view screenshots for their analyses'
    ) THEN
        CREATE POLICY "Users can view screenshots for their analyses"
            ON public.analysis_screenshots FOR SELECT
            USING (EXISTS (
                SELECT 1 FROM public.analyses 
                WHERE analyses.id = analysis_screenshots.analysis_id 
                AND analyses.user_id = auth.uid()
            ));
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'analysis_screenshots' AND policyname = 'Users can create screenshots for their analyses'
    ) THEN
        CREATE POLICY "Users can create screenshots for their analyses"
            ON public.analysis_screenshots FOR INSERT
            WITH CHECK (EXISTS (
                SELECT 1 FROM public.analyses 
                WHERE analyses.id = analysis_screenshots.analysis_id 
                AND analyses.user_id = auth.uid()
            ));
    END IF;
END $$;

-- Analysis summaries policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'analysis_summaries' AND policyname = 'Users can view summaries for their analyses'
    ) THEN
        CREATE POLICY "Users can view summaries for their analyses"
            ON public.analysis_summaries FOR SELECT
            USING (EXISTS (
                SELECT 1 FROM public.analyses 
                WHERE analyses.id = analysis_summaries.analysis_id 
                AND analyses.user_id = auth.uid()
            ));
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'analysis_summaries' AND policyname = 'Users can create summaries for their analyses'
    ) THEN
        CREATE POLICY "Users can create summaries for their analyses"
            ON public.analysis_summaries FOR INSERT
            WITH CHECK (EXISTS (
                SELECT 1 FROM public.analyses 
                WHERE analyses.id = analysis_summaries.analysis_id 
                AND analyses.user_id = auth.uid()
            ));
    END IF;
END $$;

-- =============================================================================
-- 8. GRANT PERMISSIONS
-- =============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, DELETE ON public.storage_objects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analysis_violations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analysis_screenshots TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.analysis_summaries TO authenticated;
GRANT SELECT ON public.user_dashboard_stats TO authenticated;

-- Grant permissions to anonymous users (for public endpoints)
GRANT SELECT ON public.analysis_violations TO anon;
GRANT SELECT ON public.analysis_screenshots TO anon;
GRANT SELECT ON public.analysis_summaries TO anon;

-- Grant sequence usage
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- =============================================================================
-- 9. FINAL SETUP
-- =============================================================================

-- Analyze tables for query optimization
ANALYZE public.storage_objects;
ANALYZE public.analysis_violations;
ANALYZE public.analysis_screenshots;
ANALYZE public.analysis_summaries;

-- Initial refresh of materialized view
SELECT public.refresh_dashboard_stats();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'StreetWiseWeb database optimization completed successfully!';
    RAISE NOTICE 'New optimized tables created and configured.';
    RAISE NOTICE 'Your application should now work with the optimized structure.';
END $$;