-- =====================================================
-- 07. ROW LEVEL SECURITY POLICIES
-- =====================================================
-- Creates RLS policies for data security
-- Must be run after all tables are created
-- =====================================================

BEGIN;

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deletion_logs ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can view own projects" ON public.projects
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.team_members tm 
            WHERE tm.project_id = id AND tm.user_id = auth.uid() AND tm.is_active = true
        )
    );

CREATE POLICY "Users can create own projects" ON public.projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.projects
    FOR UPDATE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.team_members tm 
            WHERE tm.project_id = id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin') AND tm.is_active = true
        )
    );

CREATE POLICY "Users can delete own projects" ON public.projects
    FOR DELETE USING (auth.uid() = user_id);

-- Analyses policies
CREATE POLICY "Users can view own analyses" ON public.analyses
    FOR SELECT USING (
        auth.uid() = user_id OR
        is_anonymous = true OR
        EXISTS (
            SELECT 1 FROM public.projects p 
            JOIN public.team_members tm ON p.id = tm.project_id 
            WHERE p.id = project_id AND tm.user_id = auth.uid() AND tm.is_active = true
        )
    );

CREATE POLICY "Users can create analyses" ON public.analyses
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        user_id IS NULL
    );

CREATE POLICY "Users can update own analyses" ON public.analyses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses" ON public.analyses
    FOR DELETE USING (auth.uid() = user_id);

-- Storage objects policies
CREATE POLICY "Users can view own storage objects" ON public.storage_objects
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.analyses a 
            WHERE a.id = analysis_id AND (a.user_id = auth.uid() OR a.is_anonymous = true)
        )
    );

CREATE POLICY "Users can create storage objects" ON public.storage_objects
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.analyses a 
            WHERE a.id = analysis_id AND (a.user_id = auth.uid() OR a.user_id IS NULL)
        )
    );

CREATE POLICY "Users can delete own storage objects" ON public.storage_objects
    FOR DELETE USING (auth.uid() = user_id);

-- Analysis screenshots policies
CREATE POLICY "Users can view analysis screenshots" ON public.analysis_screenshots
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.analyses a 
            WHERE a.id = analysis_id AND (a.user_id = auth.uid() OR a.is_anonymous = true)
        )
    );

CREATE POLICY "Users can create analysis screenshots" ON public.analysis_screenshots
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.analyses a 
            WHERE a.id = analysis_id AND (a.user_id = auth.uid() OR a.user_id IS NULL)
        )
    );

-- Analysis violations policies
CREATE POLICY "Users can view analysis violations" ON public.analysis_violations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.analyses a 
            WHERE a.id = analysis_id AND (a.user_id = auth.uid() OR a.is_anonymous = true)
        )
    );

CREATE POLICY "Users can create analysis violations" ON public.analysis_violations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.analyses a 
            WHERE a.id = analysis_id AND (a.user_id = auth.uid() OR a.user_id IS NULL)
        )
    );

-- Analysis summaries policies
CREATE POLICY "Users can view analysis summaries" ON public.analysis_summaries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.analyses a 
            WHERE a.id = analysis_id AND (a.user_id = auth.uid() OR a.is_anonymous = true)
        )
    );

CREATE POLICY "Users can create analysis summaries" ON public.analysis_summaries
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.analyses a 
            WHERE a.id = analysis_id AND (a.user_id = auth.uid() OR a.user_id IS NULL)
        )
    );

CREATE POLICY "Users can update analysis summaries" ON public.analysis_summaries
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.analyses a 
            WHERE a.id = analysis_id AND a.user_id = auth.uid()
        )
    );

-- Usage logs policies
CREATE POLICY "Users can view own usage logs" ON public.usage_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create usage logs" ON public.usage_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Team members policies
CREATE POLICY "Users can view team memberships" ON public.team_members
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.projects p 
            WHERE p.id = project_id AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Project owners can manage team members" ON public.team_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.projects p 
            WHERE p.id = project_id AND p.user_id = auth.uid()
        )
    );

-- Deletion logs policies
CREATE POLICY "Users can view own deletion logs" ON public.deletion_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Report configurations policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view report configurations" ON public.report_configurations
    FOR SELECT USING (auth.role() = 'authenticated');

-- Report access logs policies
CREATE POLICY "Users can view their own report access logs" ON public.report_access_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert report access logs" ON public.report_access_logs
    FOR INSERT WITH CHECK (true);

COMMIT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Row Level Security policies created successfully';
    RAISE NOTICE '';
END $$;