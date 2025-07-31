-- =====================================================
-- STREETWISEWEB DATABASE SETUP
-- =====================================================
-- Complete database setup with functions, triggers, and RLS
-- Run this AFTER running schema.sql
-- Version: 3.0
-- Compatible with Supabase PostgreSQL

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user creation automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup user data before deletion (with logging)
CREATE OR REPLACE FUNCTION public.cleanup_user_data_before_delete()
RETURNS TRIGGER AS $$
DECLARE
    deleted_analyses_count INTEGER;
    deleted_projects_count INTEGER;
    deleted_storage_count INTEGER;
BEGIN
    -- Count items being deleted for audit logging
    SELECT COUNT(*) INTO deleted_analyses_count FROM public.analyses WHERE user_id = OLD.id;
    SELECT COUNT(*) INTO deleted_projects_count FROM public.projects WHERE user_id = OLD.id;
    SELECT COUNT(*) INTO deleted_storage_count FROM public.storage_objects WHERE user_id = OLD.id;
    
    -- Log the deletion for audit trail
    INSERT INTO public.deletion_logs (user_id, deletion_type, deleted_count, metadata)
    VALUES (
        OLD.id, 
        'user_deletion', 
        deleted_analyses_count + deleted_projects_count,
        jsonb_build_object(
            'analyses_count', deleted_analyses_count,
            'projects_count', deleted_projects_count,
            'storage_objects_count', deleted_storage_count,
            'email', OLD.email,
            'plan_type', OLD.plan_type
        )
    );
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refresh dashboard stats materialized view
CREATE OR REPLACE FUNCTION public.refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_dashboard_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup anonymous analyses older than specified days
CREATE OR REPLACE FUNCTION public.cleanup_anonymous_analyses(p_days_old INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.analyses
    WHERE is_anonymous = TRUE 
    AND created_at < NOW() - INTERVAL '1 day' * p_days_old;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log cleanup activity
    IF deleted_count > 0 THEN
        INSERT INTO public.deletion_logs (deletion_type, deleted_count, metadata)
        VALUES (
            'anonymous_cleanup', 
            deleted_count, 
            jsonb_build_object(
                'cleanup_date', NOW(), 
                'days_old', p_days_old,
                'cleanup_type', 'anonymous_analyses'
            )
        );
    END IF;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup orphaned storage objects
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_storage()
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
    
    -- Log cleanup activity
    IF deleted_count > 0 THEN
        INSERT INTO public.deletion_logs (deletion_type, deleted_count, metadata)
        VALUES (
            'orphaned_cleanup', 
            deleted_count, 
            jsonb_build_object(
                'cleanup_date', NOW(),
                'cleanup_type', 'orphaned_storage'
            )
        );
    END IF;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired analyses
CREATE OR REPLACE FUNCTION public.cleanup_expired_analyses()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.analyses
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log cleanup activity
    IF deleted_count > 0 THEN
        INSERT INTO public.deletion_logs (deletion_type, deleted_count, metadata)
        VALUES (
            'expired_cleanup', 
            deleted_count, 
            jsonb_build_object(
                'cleanup_date', NOW(),
                'cleanup_type', 'expired_analyses'
            )
        );
    END IF;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Main daily cleanup function
CREATE OR REPLACE FUNCTION public.daily_cleanup()
RETURNS JSONB AS $$
DECLARE
    anonymous_deleted INTEGER;
    orphaned_deleted INTEGER;
    expired_deleted INTEGER;
    result JSONB;
BEGIN
    -- Cleanup anonymous analyses (7+ days old)
    anonymous_deleted := public.cleanup_anonymous_analyses(7);
    
    -- Cleanup orphaned storage objects
    orphaned_deleted := public.cleanup_orphaned_storage();
    
    -- Cleanup expired analyses
    expired_deleted := public.cleanup_expired_analyses();
    
    -- Refresh materialized view for updated stats
    PERFORM public.refresh_dashboard_stats();
    
    -- Build result
    result := jsonb_build_object(
        'anonymous_analyses_deleted', anonymous_deleted,
        'orphaned_storage_deleted', orphaned_deleted,
        'expired_analyses_deleted', expired_deleted,
        'cleanup_date', NOW(),
        'total_deleted', anonymous_deleted + orphaned_deleted + expired_deleted
    );
    
    -- Log overall cleanup activity
    INSERT INTO public.deletion_logs (deletion_type, deleted_count, metadata)
    VALUES (
        'daily_cleanup', 
        anonymous_deleted + orphaned_deleted + expired_deleted, 
        result
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
DROP TRIGGER IF EXISTS update_analyses_updated_at ON public.analyses;
DROP TRIGGER IF EXISTS update_analysis_summaries_updated_at ON public.analysis_summaries;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS before_user_delete ON public.user_profiles;

-- Triggers to update updated_at timestamps
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

-- Trigger for automatic user profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for user deletion cleanup
CREATE TRIGGER before_user_delete
    BEFORE DELETE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.cleanup_user_data_before_delete();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view their own analyses" ON public.analyses;
DROP POLICY IF EXISTS "Users can create their own analyses" ON public.analyses;
DROP POLICY IF EXISTS "Users can update their own analyses" ON public.analyses;
DROP POLICY IF EXISTS "Users can delete their own analyses" ON public.analyses;
DROP POLICY IF EXISTS "Anonymous can view public analyses" ON public.analyses;
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
DROP POLICY IF EXISTS "Users can update summaries for their analyses" ON public.analysis_summaries;
DROP POLICY IF EXISTS "Users can view team members for their projects" ON public.team_members;
DROP POLICY IF EXISTS "Users can manage team members for their projects" ON public.team_members;

-- User profiles policies
CREATE POLICY "Users can view their own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

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

-- Allow anonymous access to public analyses (for sharing)
CREATE POLICY "Anonymous can view public analyses"
    ON public.analyses FOR SELECT
    USING (is_anonymous = true OR auth.uid() = user_id);

-- Usage logs policies
CREATE POLICY "Users can view their own usage logs"
    ON public.usage_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own usage logs"
    ON public.usage_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

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
        AND (analyses.user_id = auth.uid() OR analyses.is_anonymous = true)
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
        AND (analyses.user_id = auth.uid() OR analyses.is_anonymous = true)
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
        AND (analyses.user_id = auth.uid() OR analyses.is_anonymous = true)
    ));

CREATE POLICY "Users can create summaries for their analyses"
    ON public.analysis_summaries FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.analyses 
        WHERE analyses.id = analysis_summaries.analysis_id 
        AND analyses.user_id = auth.uid()
    ));

CREATE POLICY "Users can update summaries for their analyses"
    ON public.analysis_summaries FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.analyses 
        WHERE analyses.id = analysis_summaries.analysis_id 
        AND analyses.user_id = auth.uid()
    ));

-- Team members policies (for future collaboration features)
CREATE POLICY "Users can view team members for their projects"
    ON public.team_members FOR SELECT
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = team_members.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage team members for their projects"
    ON public.team_members FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = team_members.project_id 
        AND projects.user_id = auth.uid()
    ));

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;

-- Grant read access to anonymous users (for public analyses)
GRANT SELECT ON public.analyses TO anon;
GRANT SELECT ON public.analysis_violations TO anon;
GRANT SELECT ON public.analysis_screenshots TO anon;
GRANT SELECT ON public.analysis_summaries TO anon;

-- Grant sequence usage
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Grant function execution permissions to service role (for cleanup jobs)
GRANT EXECUTE ON FUNCTION public.cleanup_anonymous_analyses TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_orphaned_storage TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_analyses TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_dashboard_stats TO service_role;
GRANT EXECUTE ON FUNCTION public.daily_cleanup TO service_role;

-- =====================================================
-- FINAL SETUP STEPS
-- =====================================================

-- Analyze tables for query optimization
ANALYZE public.user_profiles;
ANALYZE public.projects;
ANALYZE public.analyses;
ANALYZE public.storage_objects;
ANALYZE public.analysis_violations;
ANALYZE public.analysis_screenshots;
ANALYZE public.analysis_summaries;
ANALYZE public.usage_logs;
ANALYZE public.team_members;

-- Initial refresh of materialized view
SELECT public.refresh_dashboard_stats();

-- =====================================================
-- SETUP VALIDATION
-- =====================================================

-- Validate that all functions exist
DO $$
DECLARE
    expected_functions TEXT[] := ARRAY[
        'update_updated_at_column', 'handle_new_user', 'cleanup_user_data_before_delete',
        'refresh_dashboard_stats', 'cleanup_anonymous_analyses', 'cleanup_orphaned_storage',
        'cleanup_expired_analyses', 'daily_cleanup'
    ];
    function_name TEXT;
    missing_functions TEXT[] := '{}';
BEGIN
    FOREACH function_name IN ARRAY expected_functions
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_name = function_name
            AND routine_type = 'FUNCTION'
        ) THEN
            missing_functions := array_append(missing_functions, function_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_functions, 1) > 0 THEN
        RAISE EXCEPTION 'Missing functions: %', array_to_string(missing_functions, ', ');
    ELSE
        RAISE NOTICE 'Setup validation passed - all functions created';
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Database setup completed successfully!';
    RAISE NOTICE '📋 Summary:';
    RAISE NOTICE '   - All functions and triggers created';
    RAISE NOTICE '   - RLS policies configured';
    RAISE NOTICE '   - Permissions granted';
    RAISE NOTICE '   - Materialized view refreshed';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Your database is ready to use!';
END $$;