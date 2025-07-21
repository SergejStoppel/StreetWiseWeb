-- =====================================================
-- STREETWISEWEB DATABASE SCHEMA
-- =====================================================
-- Current Production Schema v3.0
-- Compatible with Supabase PostgreSQL
-- Last Updated: 2025-01-21

-- =====================================================
-- EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    company VARCHAR(255),
    plan_type VARCHAR(20) DEFAULT 'free' CHECK (plan_type IN ('free', 'basic', 'premium')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    settings JSONB DEFAULT '{}'::jsonb,
    
    -- Constraints
    CONSTRAINT user_profiles_email_valid CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Projects for organizing analyses
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    website_url TEXT,
    is_archived BOOLEAN DEFAULT FALSE,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT projects_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT projects_website_url_valid CHECK (
        website_url IS NULL OR 
        website_url ~* '^https?://[^\s/$.?#].[^\s]*$'
    )
);

-- Main analyses table (optimized structure)
CREATE TABLE public.analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    url TEXT NOT NULL,
    report_type VARCHAR(50) DEFAULT 'overview' CHECK (report_type IN ('overview', 'detailed', 'quick')),
    language VARCHAR(10) DEFAULT 'en' CHECK (language IN ('en', 'de', 'es')),
    
    -- Scores (extracted for fast querying)
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    accessibility_score INTEGER CHECK (accessibility_score >= 0 AND accessibility_score <= 100),
    seo_score INTEGER CHECK (seo_score >= 0 AND seo_score <= 100),
    performance_score INTEGER CHECK (performance_score >= 0 AND performance_score <= 100),
    
    -- Core analysis data (without large objects)
    analysis_data JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Status and lifecycle
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT analyses_url_valid CHECK (url ~* '^https?://[^\s/$.?#].[^\s]*$'),
    CONSTRAINT analyses_url_not_empty CHECK (LENGTH(TRIM(url)) > 0)
);

-- =====================================================
-- STORAGE AND MEDIA TABLES
-- =====================================================

-- Storage object tracking (for cleanup and management)
CREATE TABLE public.storage_objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE,
    bucket_id TEXT NOT NULL DEFAULT 'analysis-screenshots',
    object_path TEXT NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    mime_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique paths per bucket
    UNIQUE(bucket_id, object_path)
);

-- Screenshot management (with proper metadata support)
CREATE TABLE public.analysis_screenshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
    screenshot_url TEXT NOT NULL,
    screenshot_type VARCHAR(50) DEFAULT 'main' CHECK (screenshot_type IN ('main', 'desktop', 'mobile', 'full')),
    storage_object_id UUID REFERENCES public.storage_objects(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Violations storage (separate table for large JSONB data)
CREATE TABLE public.analysis_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
    violations JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SUMMARY AND ANALYTICS TABLES
-- =====================================================

-- Pre-computed analysis summaries (for fast dashboard queries)
CREATE TABLE public.analysis_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
    
    -- Issue counts
    total_issues INTEGER DEFAULT 0,
    critical_issues INTEGER DEFAULT 0,
    serious_issues INTEGER DEFAULT 0,
    moderate_issues INTEGER DEFAULT 0,
    minor_issues INTEGER DEFAULT 0,
    
    -- Category-specific counts
    contrast_errors INTEGER DEFAULT 0,
    missing_alt_text INTEGER DEFAULT 0,
    form_issues INTEGER DEFAULT 0,
    aria_issues INTEGER DEFAULT 0,
    keyboard_issues INTEGER DEFAULT 0,
    heading_issues INTEGER DEFAULT 0,
    landmark_issues INTEGER DEFAULT 0,
    
    -- WCAG compliance
    wcag_level VARCHAR(3),
    compliance_percentage NUMERIC(5,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one summary per analysis
    UNIQUE(analysis_id)
);

-- Usage logging for billing and analytics
CREATE TABLE public.usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT usage_logs_action_not_empty CHECK (LENGTH(TRIM(action)) > 0)
);

-- =====================================================
-- COLLABORATION TABLES (Future features)
-- =====================================================

-- Team members for project collaboration
CREATE TABLE public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
    invited_by UUID REFERENCES public.user_profiles(id),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- One membership per user per project
    UNIQUE(project_id, user_id)
);

-- =====================================================
-- AUDIT AND CLEANUP TABLES
-- =====================================================

-- Deletion audit trail
CREATE TABLE public.deletion_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    deleted_at TIMESTAMPTZ DEFAULT NOW(),
    deletion_type VARCHAR(50) NOT NULL,
    deleted_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User profiles indexes
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_plan ON public.user_profiles(plan_type);
CREATE INDEX idx_user_profiles_created ON public.user_profiles(created_at DESC);

-- Projects indexes
CREATE INDEX idx_projects_user ON public.projects(user_id);
CREATE INDEX idx_projects_created ON public.projects(created_at DESC);
CREATE INDEX idx_projects_user_created ON public.projects(user_id, created_at DESC);
CREATE INDEX idx_projects_archived ON public.projects(is_archived);

-- Analyses indexes (most critical for performance)
CREATE INDEX idx_analyses_user ON public.analyses(user_id);
CREATE INDEX idx_analyses_project ON public.analyses(project_id);
CREATE INDEX idx_analyses_url ON public.analyses(url);
CREATE INDEX idx_analyses_created ON public.analyses(created_at DESC);
CREATE INDEX idx_analyses_status ON public.analyses(status);
CREATE INDEX idx_analyses_anonymous ON public.analyses(is_anonymous, created_at DESC);
CREATE INDEX idx_analyses_user_created ON public.analyses(user_id, created_at DESC);
CREATE INDEX idx_analyses_project_created ON public.analyses(project_id, created_at DESC);
CREATE INDEX idx_analyses_scores ON public.analyses(overall_score, accessibility_score, seo_score, performance_score);
CREATE INDEX idx_analyses_expires ON public.analyses(expires_at) WHERE expires_at IS NOT NULL;

-- Storage and media indexes
CREATE INDEX idx_storage_objects_user ON public.storage_objects(user_id);
CREATE INDEX idx_storage_objects_analysis ON public.storage_objects(analysis_id);
CREATE INDEX idx_storage_objects_bucket_path ON public.storage_objects(bucket_id, object_path);

CREATE INDEX idx_analysis_screenshots_analysis ON public.analysis_screenshots(analysis_id);
CREATE INDEX idx_analysis_screenshots_type ON public.analysis_screenshots(screenshot_type);
CREATE INDEX idx_analysis_screenshots_storage ON public.analysis_screenshots(storage_object_id);

CREATE INDEX idx_analysis_violations_analysis ON public.analysis_violations(analysis_id);
CREATE INDEX idx_analysis_violations_gin ON public.analysis_violations USING gin(violations);

-- Summary and analytics indexes
CREATE INDEX idx_analysis_summaries_analysis ON public.analysis_summaries(analysis_id);
CREATE INDEX idx_analysis_summaries_issues ON public.analysis_summaries(total_issues, critical_issues);
CREATE INDEX idx_analysis_summaries_compliance ON public.analysis_summaries(compliance_percentage);

CREATE INDEX idx_usage_logs_user ON public.usage_logs(user_id);
CREATE INDEX idx_usage_logs_action ON public.usage_logs(action);
CREATE INDEX idx_usage_logs_created ON public.usage_logs(created_at DESC);
CREATE INDEX idx_usage_logs_user_action_date ON public.usage_logs(user_id, action, created_at DESC);

-- Team and collaboration indexes
CREATE INDEX idx_team_members_project ON public.team_members(project_id);
CREATE INDEX idx_team_members_user ON public.team_members(user_id);
CREATE INDEX idx_team_members_active ON public.team_members(is_active);

-- Audit indexes
CREATE INDEX idx_deletion_logs_user ON public.deletion_logs(user_id);
CREATE INDEX idx_deletion_logs_type ON public.deletion_logs(deletion_type);
CREATE INDEX idx_deletion_logs_deleted_at ON public.deletion_logs(deleted_at DESC);

-- =====================================================
-- MATERIALIZED VIEW FOR DASHBOARD
-- =====================================================

-- Fast dashboard statistics
CREATE MATERIALIZED VIEW public.user_dashboard_stats AS
SELECT 
    u.id as user_id,
    u.plan_type,
    COUNT(DISTINCT a.id) as total_analyses,
    COUNT(DISTINCT p.id) as total_projects,
    COUNT(DISTINCT a.id) FILTER (WHERE a.created_at >= NOW() - INTERVAL '30 days') as recent_analyses,
    COALESCE(AVG(a.overall_score), 0) as avg_overall_score,
    COALESCE(AVG(a.accessibility_score), 0) as avg_accessibility_score,
    COALESCE(AVG(a.seo_score), 0) as avg_seo_score,
    COALESCE(AVG(a.performance_score), 0) as avg_performance_score,
    MAX(a.created_at) as last_analysis_date,
    COALESCE(SUM(so.file_size), 0) as total_storage_used,
    COUNT(DISTINCT tm.id) as team_memberships
FROM public.user_profiles u
LEFT JOIN public.analyses a ON a.user_id = u.id AND a.status = 'completed'
LEFT JOIN public.projects p ON p.user_id = u.id AND p.is_archived = FALSE
LEFT JOIN public.storage_objects so ON so.user_id = u.id
LEFT JOIN public.team_members tm ON tm.user_id = u.id AND tm.is_active = TRUE
GROUP BY u.id, u.plan_type;

-- Index for materialized view
CREATE UNIQUE INDEX idx_user_dashboard_stats_user ON public.user_dashboard_stats(user_id);

-- =====================================================
-- SCHEMA VALIDATION
-- =====================================================

-- Ensure all expected tables exist
DO $$
DECLARE
    expected_tables TEXT[] := ARRAY[
        'user_profiles', 'projects', 'analyses', 'storage_objects',
        'analysis_screenshots', 'analysis_violations', 'analysis_summaries',
        'usage_logs', 'team_members', 'deletion_logs'
    ];
    table_name TEXT;
    missing_tables TEXT[] := '{}';
BEGIN
    FOREACH table_name IN ARRAY expected_tables
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = table_name
        ) THEN
            missing_tables := array_append(missing_tables, table_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION 'Missing tables: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE 'Schema validation passed - all tables exist';
    END IF;
END $$;