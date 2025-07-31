-- =====================================================
-- 01. CLEANUP EXISTING SCHEMA
-- =====================================================
-- This script removes existing database objects
-- Run this first if you need a clean slate
-- =====================================================

BEGIN;

-- Drop existing triggers safely
DO $$
BEGIN
    -- Drop all triggers on public tables
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') THEN
        DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles CASCADE;
        DROP TRIGGER IF EXISTS before_user_delete ON public.user_profiles CASCADE;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'projects' AND table_schema = 'public') THEN
        DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects CASCADE;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'analyses' AND table_schema = 'public') THEN
        DROP TRIGGER IF EXISTS update_analyses_updated_at ON public.analyses CASCADE;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'analysis_summaries' AND table_schema = 'public') THEN
        DROP TRIGGER IF EXISTS update_analysis_summaries_updated_at ON public.analysis_summaries CASCADE;
    END IF;
    
    -- Drop auth trigger (this might not exist or might not be accessible)
    BEGIN
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
    EXCEPTION
        WHEN OTHERS THEN
            -- Ignore error if we can't access auth.users
            NULL;
    END;
END $$;

-- Drop functions
DROP FUNCTION IF EXISTS public.cleanup_anonymous_analyses() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_orphaned_storage() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_expired_analyses() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_user_data_before_delete() CASCADE;
DROP FUNCTION IF EXISTS public.refresh_dashboard_stats() CASCADE;
DROP FUNCTION IF EXISTS public.daily_cleanup() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Drop materialized view if exists
DROP MATERIALIZED VIEW IF EXISTS public.user_dashboard_stats CASCADE;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS public.team_members CASCADE;
DROP TABLE IF EXISTS public.analysis_summaries CASCADE;
DROP TABLE IF EXISTS public.analysis_screenshots CASCADE;
DROP TABLE IF EXISTS public.analysis_violations CASCADE;
DROP TABLE IF EXISTS public.usage_logs CASCADE;
DROP TABLE IF EXISTS public.storage_objects CASCADE;
DROP TABLE IF EXISTS public.analyses CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.deletion_logs CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

COMMIT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Cleanup completed - ready for fresh setup';
    RAISE NOTICE '';
END $$;