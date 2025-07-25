-- =====================================================
-- STREETWISEWEB COMPLETE PRODUCTION SETUP - FIXED
-- =====================================================
-- Single script for complete database setup
-- Version: 3.1 - Fixed dependency issues
-- Compatible with Supabase PostgreSQL
-- 
-- This script creates all tables, functions, triggers, and policies
-- Safe to run on fresh databases
-- =====================================================

-- =====================================================
-- 1. EXTENSIONS AND BASIC SETUP
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clean up existing objects to ensure fresh setup (ignore errors if they don't exist)
-- Note: We'll drop triggers after we know tables exist
DO $$
BEGIN
    -- Drop triggers only if tables exist
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') THEN
        DROP TRIGGER IF EXISTS before_user_delete ON public.user_profiles CASCADE;
        DROP TRIGGER IF EXISTS cleanup_before_user_delete ON public.user_profiles CASCADE;
        DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles CASCADE;
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

-- Drop functions that might exist (ignore errors)
DROP FUNCTION IF EXISTS public.cleanup_user_data_before_delete() CASCADE;
DROP FUNCTION IF EXISTS public.refresh_dashboard_stats() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_anonymous_analyses() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_orphaned_storage() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_expired_analyses() CASCADE;
DROP FUNCTION IF EXISTS public.daily_cleanup() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Drop materialized view if exists
DROP MATERIALIZED VIEW IF EXISTS public.user_dashboard_stats CASCADE;

-- Drop tables in reverse dependency order (safely - ignore errors)
DO $$
BEGIN
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
    
    RAISE NOTICE '✅ Cleanup completed - ready for fresh setup';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️  Cleanup had some issues (this is OK for fresh databases): %', SQLERRM;
END $$;

-- =====================================================
-- 2. CORE TABLES (IN DEPENDENCY ORDER)
-- =====================================================

-- User profiles (depends on auth.users which exists in Supabase)
DO $$
BEGIN
    RAISE NOTICE '🔨 Creating user_profiles table...';
END $$;

CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
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
    color_contrast_violations INTEGER DEFAULT 0,
    
    -- Backend-expected columns (mapping to specific issues)
    images_without_alt INTEGER DEFAULT 0,
    forms_without_labels INTEGER DEFAULT 0,
    
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
-- 3. INDEXES FOR PERFORMANCE
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
-- 4. FUNCTIONS (CREATED BEFORE TRIGGERS THAT USE THEM)
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
            'first_name', OLD.first_name,
            'last_name', OLD.last_name,
            'plan_type', OLD.plan_type
        )
    );
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup functions
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
-- 5. MATERIALIZED VIEW (BEFORE RLS)
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

-- Function to refresh dashboard stats materialized view
CREATE OR REPLACE FUNCTION public.refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_dashboard_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. TRIGGERS (AFTER FUNCTIONS AND TABLES EXIST)
-- =====================================================

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

-- Trigger for user deletion cleanup
CREATE TRIGGER before_user_delete
    BEFORE DELETE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.cleanup_user_data_before_delete();

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
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
-- 8. RLS POLICIES
-- =====================================================

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

-- Team members policies
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
-- 9. GRANT PERMISSIONS
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
-- 10. FINAL SETUP AND VALIDATION
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

-- Try to create trigger on auth.users (this might fail on some Supabase instances)
DO $$
BEGIN
    -- Try to create the auth trigger
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    
    RAISE NOTICE '✅ Auth trigger created successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️  Auth trigger creation failed (this is OK): %', SQLERRM;
        RAISE NOTICE '⚠️  User profiles will need to be created manually or via application code';
END $$;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 StreetWiseWeb Database Setup Complete!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Database Schema:';
    RAISE NOTICE '   • All 10 tables created successfully';
    RAISE NOTICE '   • All indexes created for optimal performance';
    RAISE NOTICE '   • Materialized view ready for fast dashboard queries';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Security:';
    RAISE NOTICE '   • Row Level Security (RLS) enabled and configured';
    RAISE NOTICE '   • Authentication policies in place';
    RAISE NOTICE '   • Service role permissions granted';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Features:';
    RAISE NOTICE '   • Screenshot storage with metadata support ✅ FIXED!';
    RAISE NOTICE '   • Automated cleanup functions';
    RAISE NOTICE '   • User profile auto-creation (if auth trigger works)';
    RAISE NOTICE '   • Audit logging for deletions';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Next Steps:';
    RAISE NOTICE '   1. Create storage bucket: "analysis-screenshots" (make it PUBLIC)';
    RAISE NOTICE '   2. Update your .env file with Supabase credentials';
    RAISE NOTICE '   3. Test your Docker containers: start-dev.bat';
    RAISE NOTICE '   4. Try creating a user account and running an analysis';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Your database is ready for StreetWiseWeb!';
    RAISE NOTICE '';
END $$;