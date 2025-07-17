-- =============================================
-- STREETWISEWEB DATABASE SCHEMA
-- =============================================
-- Run this SQL in your Supabase SQL Editor to create the database schema
-- Navigate to: Supabase Dashboard > SQL Editor > New Query

-- =============================================
-- EXTENSIONS
-- =============================================
-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE
-- =============================================
-- Note: Supabase auth.users table already exists for authentication
-- This table extends the auth.users with additional user data
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    company TEXT,
    plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'basic', 'premium')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    
    -- Constraints
    CONSTRAINT user_profiles_email_valid CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- =============================================
-- PROJECTS TABLE
-- =============================================
-- Projects organize multiple analyses for a website/client
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    website_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_archived BOOLEAN DEFAULT FALSE,
    settings JSONB DEFAULT '{}'::jsonb,
    
    -- Constraints
    CONSTRAINT projects_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT projects_website_url_valid CHECK (
        website_url IS NULL OR 
        website_url ~* '^https?://[^\s/$.?#].[^\s]*$'
    )
);

-- =============================================
-- ANALYSES TABLE
-- =============================================
-- Main table for storing analysis results
CREATE TABLE IF NOT EXISTS public.analyses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    report_type TEXT DEFAULT 'overview' CHECK (report_type IN ('overview', 'detailed', 'quick')),
    language TEXT DEFAULT 'en' CHECK (language IN ('en', 'de', 'es')),
    
    -- Analysis results
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    accessibility_score INTEGER CHECK (accessibility_score >= 0 AND accessibility_score <= 100),
    seo_score INTEGER CHECK (seo_score >= 0 AND seo_score <= 100),
    performance_score INTEGER CHECK (performance_score >= 0 AND performance_score <= 100),
    
    -- Raw data (JSON)
    analysis_data JSONB NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE, -- For cache management
    
    -- Status
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    
    -- Constraints
    CONSTRAINT analyses_url_valid CHECK (url ~* '^https?://[^\s/$.?#].[^\s]*$'),
    CONSTRAINT analyses_url_not_empty CHECK (LENGTH(TRIM(url)) > 0)
);

-- =============================================
-- ANALYSIS ISSUES TABLE
-- =============================================
-- Extracted accessibility issues for better querying and reporting
CREATE TABLE IF NOT EXISTS public.analysis_issues (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE NOT NULL,
    issue_id TEXT NOT NULL, -- From axe-core or custom analyzers
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT CHECK (severity IN ('critical', 'serious', 'moderate', 'minor')),
    category TEXT, -- forms, images, navigation, etc
    wcag_criteria JSONB DEFAULT '[]'::jsonb,
    elements JSONB DEFAULT '[]'::jsonb,
    remediation JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT analysis_issues_title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
    CONSTRAINT analysis_issues_issue_id_not_empty CHECK (LENGTH(TRIM(issue_id)) > 0)
);

-- =============================================
-- USAGE LOGS TABLE
-- =============================================
-- Track usage for billing and rate limiting
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    action TEXT NOT NULL, -- analysis, report_generated, pdf_download, etc
    resource_id UUID, -- analysis_id, project_id, etc
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Constraints
    CONSTRAINT usage_logs_action_not_empty CHECK (LENGTH(TRIM(action)) > 0)
);

-- =============================================
-- TEAM MEMBERS TABLE (Future feature)
-- =============================================
-- For team collaboration features
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    joined_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Constraints
    UNIQUE(project_id, user_id)
);

-- =============================================
-- INDEXES
-- =============================================
-- Performance indexes for common queries

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_plan_type ON public.user_profiles(plan_type);

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_user_created ON public.projects(user_id, created_at DESC);

-- Analyses indexes
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_project_id ON public.analyses(project_id);
CREATE INDEX IF NOT EXISTS idx_analyses_url ON public.analyses(url);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON public.analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_user_created ON public.analyses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_project_created ON public.analyses(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON public.analyses(status);

-- Analysis issues indexes
CREATE INDEX IF NOT EXISTS idx_analysis_issues_analysis_id ON public.analysis_issues(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analysis_issues_severity ON public.analysis_issues(severity);
CREATE INDEX IF NOT EXISTS idx_analysis_issues_category ON public.analysis_issues(category);

-- Usage logs indexes
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_action ON public.usage_logs(action);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_action_date ON public.usage_logs(user_id, action, created_at DESC);

-- Team members indexes
CREATE INDEX IF NOT EXISTS idx_team_members_project_id ON public.team_members(project_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);

-- =============================================
-- FUNCTIONS
-- =============================================
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- TRIGGERS
-- =============================================
-- Auto-update updated_at columns
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_analyses_updated_at
    BEFORE UPDATE ON public.analyses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- User profiles: Users can only see and modify their own profile
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Projects: Users can only see their own projects
CREATE POLICY "Users can view their own projects" ON public.projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" ON public.projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON public.projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON public.projects
    FOR DELETE USING (auth.uid() = user_id);

-- Analyses: Users can only see their own analyses
CREATE POLICY "Users can view their own analyses" ON public.analyses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analyses" ON public.analyses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyses" ON public.analyses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses" ON public.analyses
    FOR DELETE USING (auth.uid() = user_id);

-- Analysis issues: Users can only see issues from their own analyses
CREATE POLICY "Users can view their own analysis issues" ON public.analysis_issues
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.analyses 
            WHERE analyses.id = analysis_issues.analysis_id 
            AND analyses.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own analysis issues" ON public.analysis_issues
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.analyses 
            WHERE analyses.id = analysis_issues.analysis_id 
            AND analyses.user_id = auth.uid()
        )
    );

-- Usage logs: Users can only see their own usage logs
CREATE POLICY "Users can view their own usage logs" ON public.usage_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage logs" ON public.usage_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Team members: Users can see team members for projects they own or are part of
CREATE POLICY "Users can view team members for their projects" ON public.team_members
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = team_members.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- =============================================
-- INITIAL DATA
-- =============================================
-- Insert some sample data for testing (optional)
-- You can remove this section if you don't want sample data

-- Sample plan types can be added to a separate lookup table if needed
-- For now, plan_type is just a text field with CHECK constraint

-- =============================================
-- VIEWS (Optional - for easier querying)
-- =============================================
-- View for user analytics
CREATE OR REPLACE VIEW public.user_analytics AS
SELECT 
    up.id,
    up.email,
    up.first_name,
    up.last_name,
    up.company,
    up.plan_type,
    up.created_at,
    COUNT(DISTINCT p.id) as project_count,
    COUNT(DISTINCT a.id) as analysis_count,
    COUNT(DISTINCT CASE WHEN a.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN a.id END) as recent_analyses,
    MAX(a.created_at) as last_analysis_date
FROM public.user_profiles up
LEFT JOIN public.projects p ON up.id = p.user_id
LEFT JOIN public.analyses a ON up.id = a.user_id
GROUP BY up.id, up.email, up.first_name, up.last_name, up.company, up.plan_type, up.created_at;

-- View for project analytics
CREATE OR REPLACE VIEW public.project_analytics AS
SELECT 
    p.id,
    p.name,
    p.user_id,
    p.website_url,
    p.created_at,
    COUNT(DISTINCT a.id) as analysis_count,
    AVG(a.overall_score) as avg_overall_score,
    AVG(a.accessibility_score) as avg_accessibility_score,
    MAX(a.created_at) as last_analysis_date
FROM public.projects p
LEFT JOIN public.analyses a ON p.id = a.project_id
GROUP BY p.id, p.name, p.user_id, p.website_url, p.created_at;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================
-- If you see this message, the schema was created successfully!
DO $$ 
BEGIN 
    RAISE NOTICE 'StreetWiseWeb database schema created successfully!';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test the schema by inserting sample data';
    RAISE NOTICE '2. Configure your application to use Supabase client';
    RAISE NOTICE '3. Set up authentication in your frontend';
END $$;