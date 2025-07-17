-- =============================================
-- STREETWISEWEB PRODUCTION DATABASE SETUP
-- =============================================
-- Complete production-ready database setup with proper RLS policies
-- Run this in Supabase SQL Editor to set up everything needed

-- =============================================
-- CLEAN UP EXISTING POLICIES
-- =============================================
-- Remove any existing policies that might conflict

-- User profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "authenticated_users_insert_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "authenticated_users_select_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "authenticated_users_update_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "authenticated_users_delete_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "service_role_full_access" ON public.user_profiles;

-- Analyses policies
DROP POLICY IF EXISTS "Users can view their own analyses" ON public.analyses;
DROP POLICY IF EXISTS "Users can insert their own analyses" ON public.analyses;
DROP POLICY IF EXISTS "Users can update their own analyses" ON public.analyses;
DROP POLICY IF EXISTS "Users can delete their own analyses" ON public.analyses;
DROP POLICY IF EXISTS "Users can manage their own analyses" ON public.analyses;
DROP POLICY IF EXISTS "authenticated_users_insert_own_analysis" ON public.analyses;
DROP POLICY IF EXISTS "authenticated_users_select_own_analysis" ON public.analyses;
DROP POLICY IF EXISTS "authenticated_users_update_own_analysis" ON public.analyses;
DROP POLICY IF EXISTS "authenticated_users_delete_own_analysis" ON public.analyses;
DROP POLICY IF EXISTS "service_role_full_access_analyses" ON public.analyses;

-- Projects policies
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;

-- Other table policies
DROP POLICY IF EXISTS "Users can view their own analysis issues" ON public.analysis_issues;
DROP POLICY IF EXISTS "Users can insert their own analysis issues" ON public.analysis_issues;
DROP POLICY IF EXISTS "Users can manage their own analysis issues" ON public.analysis_issues;
DROP POLICY IF EXISTS "Users can view their own usage logs" ON public.usage_logs;
DROP POLICY IF EXISTS "Users can insert their own usage logs" ON public.usage_logs;
DROP POLICY IF EXISTS "Users can manage their own usage logs" ON public.usage_logs;

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================
-- Ensure RLS is enabled on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- USER PROFILES POLICIES
-- =============================================
-- Allow authenticated users to manage their own profiles

CREATE POLICY "user_profiles_select_own" ON public.user_profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "user_profiles_insert_own" ON public.user_profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles_update_own" ON public.user_profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles_delete_own" ON public.user_profiles
    FOR DELETE TO authenticated
    USING (auth.uid() = id);

-- Service role policy for backend operations
CREATE POLICY "user_profiles_service_role" ON public.user_profiles
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- =============================================
-- PROJECTS POLICIES
-- =============================================
CREATE POLICY "projects_select_own" ON public.projects
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "projects_insert_own" ON public.projects
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "projects_update_own" ON public.projects
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "projects_delete_own" ON public.projects
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Service role policy for backend operations
CREATE POLICY "projects_service_role" ON public.projects
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- =============================================
-- ANALYSES POLICIES
-- =============================================
CREATE POLICY "analyses_select_own" ON public.analyses
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "analyses_insert_own" ON public.analyses
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "analyses_update_own" ON public.analyses
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "analyses_delete_own" ON public.analyses
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Service role policy for backend operations
CREATE POLICY "analyses_service_role" ON public.analyses
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- =============================================
-- ANALYSIS ISSUES POLICIES
-- =============================================
CREATE POLICY "analysis_issues_select_own" ON public.analysis_issues
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.analyses 
            WHERE analyses.id = analysis_issues.analysis_id 
            AND analyses.user_id = auth.uid()
        )
    );

CREATE POLICY "analysis_issues_insert_own" ON public.analysis_issues
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.analyses 
            WHERE analyses.id = analysis_issues.analysis_id 
            AND analyses.user_id = auth.uid()
        )
    );

CREATE POLICY "analysis_issues_update_own" ON public.analysis_issues
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.analyses 
            WHERE analyses.id = analysis_issues.analysis_id 
            AND analyses.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.analyses 
            WHERE analyses.id = analysis_issues.analysis_id 
            AND analyses.user_id = auth.uid()
        )
    );

CREATE POLICY "analysis_issues_delete_own" ON public.analysis_issues
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.analyses 
            WHERE analyses.id = analysis_issues.analysis_id 
            AND analyses.user_id = auth.uid()
        )
    );

-- Service role policy for backend operations
CREATE POLICY "analysis_issues_service_role" ON public.analysis_issues
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- =============================================
-- USAGE LOGS POLICIES
-- =============================================
CREATE POLICY "usage_logs_select_own" ON public.usage_logs
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "usage_logs_insert_own" ON public.usage_logs
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Service role policy for backend operations
CREATE POLICY "usage_logs_service_role" ON public.usage_logs
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- =============================================
-- FUNCTIONS FOR PROFILE MANAGEMENT
-- =============================================
-- Function to handle user profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, created_at, updated_at)
    VALUES (new.id, new.email, now(), now());
    RETURN new;
END;
$$ language 'plpgsql' security definer;

-- Trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- VERIFICATION QUERIES
-- =============================================
-- Check that RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'projects', 'analyses', 'analysis_issues', 'usage_logs')
ORDER BY tablename;

-- Check that policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Success message
SELECT '✅ Production database setup complete!' as status;
SELECT 'RLS enabled with proper policies for authenticated users and service role' as details;
SELECT 'User profiles will be created automatically on signup' as profile_creation;