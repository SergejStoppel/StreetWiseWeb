-- =============================================
-- QUICK SETUP FOR STREETWISEWEB DATABASE
-- =============================================
-- Copy and paste this into your Supabase SQL Editor
-- Go to: Supabase Dashboard > SQL Editor > New Query

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    company TEXT,
    plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'basic', 'premium')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}'::jsonb
);

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    website_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_archived BOOLEAN DEFAULT FALSE,
    settings JSONB DEFAULT '{}'::jsonb
);

-- Analyses table
CREATE TABLE IF NOT EXISTS public.analyses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    report_type TEXT DEFAULT 'overview',
    language TEXT DEFAULT 'en',
    overall_score INTEGER,
    accessibility_score INTEGER,
    seo_score INTEGER,
    performance_score INTEGER,
    analysis_data JSONB NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'completed'
);

-- Analysis issues table
CREATE TABLE IF NOT EXISTS public.analysis_issues (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE NOT NULL,
    issue_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT,
    category TEXT,
    wcag_criteria JSONB DEFAULT '[]'::jsonb,
    elements JSONB DEFAULT '[]'::jsonb,
    remediation JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Usage logs table
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    action TEXT NOT NULL,
    resource_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Essential indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_project_id ON public.analyses(project_id);
CREATE INDEX IF NOT EXISTS idx_analysis_issues_analysis_id ON public.analysis_issues(analysis_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own profile" ON public.user_profiles
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage their own projects" ON public.projects
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own analyses" ON public.analyses
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own analysis issues" ON public.analysis_issues
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.analyses 
            WHERE analyses.id = analysis_issues.analysis_id 
            AND analyses.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own usage logs" ON public.usage_logs
    FOR ALL USING (auth.uid() = user_id);

-- Success message
SELECT 'StreetWiseWeb database setup completed successfully!' as message;