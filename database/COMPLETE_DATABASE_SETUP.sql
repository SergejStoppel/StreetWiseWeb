-- StreetWiseWeb Complete Database Setup
-- This single script handles both fresh installations and existing databases
-- Run this in your Supabase SQL Editor

-- =============================================================================
-- 1. SAFELY DROP EXISTING OBJECTS THAT MIGHT CONFLICT
-- =============================================================================

-- Drop triggers first (they depend on functions)
DROP TRIGGER IF EXISTS before_user_delete ON public.user_profiles CASCADE;
DROP TRIGGER IF EXISTS cleanup_before_user_delete ON public.user_profiles CASCADE;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles CASCADE;
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects CASCADE;
DROP TRIGGER IF EXISTS update_analyses_updated_at ON public.analyses CASCADE;
DROP TRIGGER IF EXISTS update_analysis_summaries_updated_at ON public.analysis_summaries CASCADE;

-- Drop functions that might have different signatures
DROP FUNCTION IF EXISTS public.cleanup_user_data_before_delete() CASCADE;
DROP FUNCTION IF EXISTS public.refresh_dashboard_stats() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_anonymous_analyses() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_orphaned_storage() CASCADE;
DROP FUNCTION IF EXISTS public.daily_cleanup() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.track_storage_upload() CASCADE;

-- Drop materialized view (will be recreated)
DROP MATERIALIZED VIEW IF EXISTS public.user_dashboard_stats CASCADE;

-- =============================================================================
-- 2. CREATE BASE TABLES (IF NOT EXISTS)
-- =============================================================================

-- User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    company VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table (for organizing analyses)
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Main analyses table (optimized - no large JSONB fields)
CREATE TABLE IF NOT EXISTS public.analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    url TEXT NOT NULL,
    report_type VARCHAR(50) DEFAULT 'overview',
    language VARCHAR(10) DEFAULT 'en',
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    accessibility_score INTEGER CHECK (accessibility_score >= 0 AND accessibility_score <= 100),
    seo_score INTEGER CHECK (seo_score >= 0 AND seo_score <= 100),
    performance_score INTEGER CHECK (performance_score >= 0 AND performance_score <= 100),
    analysis_data JSONB, -- Core data without violations/screenshots
    metadata JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'completed',
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage logs table
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 3. CREATE OPTIMIZED STORAGE TABLES
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
-- 4. UPDATE FOREIGN KEY CONSTRAINTS TO CASCADE
-- =============================================================================

-- Update analyses table foreign key to CASCADE (drop and recreate)
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
-- 5. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_user ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created ON public.projects(created_at DESC);

-- Analyses indexes
CREATE INDEX IF NOT EXISTS idx_analyses_user ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_project ON public.analyses(project_id);
CREATE INDEX IF NOT EXISTS idx_analyses_url ON public.analyses(url);
CREATE INDEX IF NOT EXISTS idx_analyses_created ON public.analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_scores ON public.analyses(overall_score, accessibility_score, seo_score);
CREATE INDEX IF NOT EXISTS idx_analyses_user_created ON public.analyses(user_id, created_at DESC);

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

-- Usage logs indexes
CREATE INDEX IF NOT EXISTS idx_usage_logs_user ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created ON public.usage_logs(created_at DESC);

-- =============================================================================
-- 6. CREATE MATERIALIZED VIEW FOR DASHBOARD STATS
-- =============================================================================

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
-- 7. CREATE CLEANUP AND UTILITY FUNCTIONS
-- =============================================================================

-- Function to refresh dashboard stats
CREATE FUNCTION public.refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_dashboard_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup user data before deletion
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

-- Function to track storage uploads
CREATE FUNCTION public.track_storage_upload()
RETURNS TRIGGER AS $$
BEGIN
    -- This function needs to be called from storage triggers
    -- It's a placeholder for the actual implementation
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup anonymous analyses older than 7 days
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
-- 8. CREATE TRIGGERS
-- =============================================================================

-- Trigger for user deletion cleanup
CREATE TRIGGER before_user_delete
    BEFORE DELETE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.cleanup_user_data_before_delete();

-- Trigger to update timestamps
CREATE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_analyses_updated_at
    BEFORE UPDATE ON public.analyses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_analysis_summaries_updated_at
    BEFORE UPDATE ON public.analysis_summaries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- 9. CREATE RLS POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_summaries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view their own analyses" ON public.analyses;
DROP POLICY IF EXISTS "Users can create their own analyses" ON public.analyses;
DROP POLICY IF EXISTS "Users can update their own analyses" ON public.analyses;
DROP POLICY IF EXISTS "Users can delete their own analyses" ON public.analyses;
DROP POLICY IF EXISTS "Users can view their own usage logs" ON public.usage_logs;
DROP POLICY IF EXISTS "Users can create their own usage logs" ON public.usage_logs;
DROP POLICY IF EXISTS "Users can view their own storage objects" ON public.storage_objects;
DROP POLICY IF EXISTS "Users can create their own storage objects" ON public.storage_objects;
DROP POLICY IF EXISTS "Users can delete their own storage objects" ON public.storage_objects;
DROP POLICY IF EXISTS "Users can view violations for their analyses" ON public.analysis_violations;
DROP POLICY IF EXISTS "Users can create violations for their analyses" ON public.analysis_violations;
DROP POLICY IF EXISTS "Users can view screenshots for their analyses" ON public.analysis_screenshots;
DROP POLICY IF EXISTS "Users can create screenshots for their analyses" ON public.analysis_screenshots;
DROP POLICY IF EXISTS "Users can view summaries for their analyses" ON public.analysis_summaries;
DROP POLICY IF EXISTS "Users can create summaries for their analyses" ON public.analysis_summaries;

-- User profiles policies
CREATE POLICY "Users can view their own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can view their own projects"
    ON public.projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
    ON public.projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
    ON public.projects FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
    ON public.projects FOR DELETE
    USING (auth.uid() = user_id);

-- Analyses policies
CREATE POLICY "Users can view their own analyses"
    ON public.analyses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analyses"
    ON public.analyses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyses"
    ON public.analyses FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses"
    ON public.analyses FOR DELETE
    USING (auth.uid() = user_id);

-- Storage objects policies
CREATE POLICY "Users can view their own storage objects"
    ON public.storage_objects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own storage objects"
    ON public.storage_objects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own storage objects"
    ON public.storage_objects FOR DELETE
    USING (auth.uid() = user_id);

-- Analysis violations policies
CREATE POLICY "Users can view violations for their analyses"
    ON public.analysis_violations FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.analyses 
        WHERE analyses.id = analysis_violations.analysis_id 
        AND analyses.user_id = auth.uid()
    ));

CREATE POLICY "Users can create violations for their analyses"
    ON public.analysis_violations FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.analyses 
        WHERE analyses.id = analysis_violations.analysis_id 
        AND analyses.user_id = auth.uid()
    ));

-- Analysis screenshots policies
CREATE POLICY "Users can view screenshots for their analyses"
    ON public.analysis_screenshots FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.analyses 
        WHERE analyses.id = analysis_screenshots.analysis_id 
        AND analyses.user_id = auth.uid()
    ));

CREATE POLICY "Users can create screenshots for their analyses"
    ON public.analysis_screenshots FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.analyses 
        WHERE analyses.id = analysis_screenshots.analysis_id 
        AND analyses.user_id = auth.uid()
    ));

-- Analysis summaries policies
CREATE POLICY "Users can view summaries for their analyses"
    ON public.analysis_summaries FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.analyses 
        WHERE analyses.id = analysis_summaries.analysis_id 
        AND analyses.user_id = auth.uid()
    ));

CREATE POLICY "Users can create summaries for their analyses"
    ON public.analysis_summaries FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.analyses 
        WHERE analyses.id = analysis_summaries.analysis_id 
        AND analyses.user_id = auth.uid()
    ));

-- Usage logs policies
CREATE POLICY "Users can view their own usage logs"
    ON public.usage_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own usage logs"
    ON public.usage_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 10. GRANT PERMISSIONS
-- =============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analyses TO authenticated;
GRANT SELECT, INSERT ON public.usage_logs TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.storage_objects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analysis_violations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analysis_screenshots TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.analysis_summaries TO authenticated;
GRANT SELECT ON public.user_dashboard_stats TO authenticated;

-- Grant permissions to anonymous users (for public endpoints)
GRANT SELECT ON public.analyses TO anon;
GRANT SELECT ON public.analysis_violations TO anon;
GRANT SELECT ON public.analysis_screenshots TO anon;
GRANT SELECT ON public.analysis_summaries TO anon;

-- Grant sequence usage
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- =============================================================================
-- 11. CREATE INITIAL TRIGGER FOR USER PROFILE CREATION
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- 12. FINAL SETUP AND OPTIMIZATION
-- =============================================================================

-- Analyze tables for query optimization
ANALYZE public.user_profiles;
ANALYZE public.projects;
ANALYZE public.analyses;
ANALYZE public.storage_objects;
ANALYZE public.analysis_violations;
ANALYZE public.analysis_screenshots;
ANALYZE public.analysis_summaries;
ANALYZE public.usage_logs;

-- Initial refresh of materialized view
SELECT public.refresh_dashboard_stats();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'StreetWiseWeb database setup completed successfully!';
    RAISE NOTICE 'Your optimized database is ready to use.';
    RAISE NOTICE 'Remember to restart your application containers.';
END $$;