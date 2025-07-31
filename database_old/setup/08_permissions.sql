-- =====================================================
-- 08. PERMISSIONS AND GRANTS
-- =====================================================
-- Sets up database permissions
-- Must be run after all other objects are created
-- =====================================================

BEGIN;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Grant permissions on tables to authenticated users
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.projects TO authenticated;
GRANT ALL ON public.analyses TO authenticated;
GRANT ALL ON public.storage_objects TO authenticated;
GRANT ALL ON public.analysis_screenshots TO authenticated;
GRANT ALL ON public.analysis_violations TO authenticated;
GRANT ALL ON public.analysis_summaries TO authenticated;
GRANT ALL ON public.usage_logs TO authenticated;
GRANT ALL ON public.team_members TO authenticated;
GRANT ALL ON public.deletion_logs TO authenticated;

-- Grant read access to anonymous users for public analyses
GRANT SELECT ON public.analyses TO anon;
GRANT SELECT ON public.analysis_screenshots TO anon;
GRANT SELECT ON public.analysis_violations TO anon;
GRANT SELECT ON public.analysis_summaries TO anon;
GRANT SELECT ON public.storage_objects TO anon;

-- Grant permissions on materialized views
GRANT SELECT ON public.user_dashboard_stats TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_user_data_before_delete() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_anonymous_analyses() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_orphaned_storage() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_analyses() TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.daily_cleanup() TO authenticated;

-- Grant permissions for service role (for scheduled tasks)
GRANT EXECUTE ON FUNCTION public.cleanup_anonymous_analyses() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_orphaned_storage() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_analyses() TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_dashboard_stats() TO service_role;
GRANT EXECUTE ON FUNCTION public.daily_cleanup() TO service_role;

-- Grant refresh permissions on materialized views to service role
GRANT SELECT, UPDATE ON public.user_dashboard_stats TO service_role;

COMMIT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Permissions and grants configured successfully';
    RAISE NOTICE '';
END $$;