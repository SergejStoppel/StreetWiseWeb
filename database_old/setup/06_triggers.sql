-- =====================================================
-- 06. TRIGGERS
-- =====================================================
-- Creates all database triggers
-- Must be run after functions
-- =====================================================

BEGIN;

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

CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON public.team_members
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for user deletion cleanup
CREATE TRIGGER before_user_delete
    BEFORE DELETE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.cleanup_user_data_before_delete();

COMMIT;

-- Try to create auth trigger (may fail in some Supabase configurations)
DO $$
BEGIN
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    
    RAISE NOTICE '✅ Auth trigger created successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️  Auth trigger creation failed (this is OK): %', SQLERRM;
        RAISE NOTICE '⚠️  User profiles will need to be created manually or via application code';
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Triggers created successfully';
    RAISE NOTICE '';
END $$;