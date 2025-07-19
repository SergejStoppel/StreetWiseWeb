-- StreetWiseWeb Complete Production Database Setup
-- This script sets up the entire database schema for both development and production
-- Run this once in your Supabase SQL Editor

-- =============================================================================
-- 1. CREATE TABLES
-- =============================================================================

-- User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    company VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to existing user_profiles table if needed
DO $$
BEGIN
    -- Check if full_name column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'full_name'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN full_name VARCHAR(255);
    END IF;
    
    -- Check if company column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'company'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN company VARCHAR(255);
    END IF;
    
    -- Check if created_at column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Check if updated_at column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Projects table (for organizing analyses)
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to existing projects table if needed
DO $$
BEGIN
    -- Check if name column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'projects' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE public.projects ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT 'Unnamed Project';
    END IF;
    
    -- Check if description column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'projects' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE public.projects ADD COLUMN description TEXT;
    END IF;
    
    -- Check if created_at column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'projects' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.projects ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Check if updated_at column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'projects' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.projects ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Main analyses table with smart caching support
CREATE TABLE IF NOT EXISTS public.analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    url TEXT NOT NULL,
    url_hash VARCHAR(64) GENERATED ALWAYS AS (encode(sha256(url::bytea), 'hex')) STORED,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    report_type VARCHAR(50) DEFAULT 'overview' CHECK (report_type IN ('overview', 'detailed')),
    
    -- Analysis results
    accessibility_score INTEGER,
    seo_score INTEGER,
    performance_score INTEGER,
    overall_score INTEGER,
    
    -- Analysis data (JSON)
    violations JSONB,
    summary JSONB,
    metadata JSONB,
    screenshots JSONB,
    seo_analysis JSONB,
    ai_insights JSONB,
    
    -- Smart caching fields
    is_anonymous BOOLEAN DEFAULT false,
    cache_expires_at TIMESTAMPTZ,
    access_count INTEGER DEFAULT 1,
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Performance indexes
    CONSTRAINT unique_user_url_active UNIQUE (user_id, url_hash) DEFERRABLE INITIALLY DEFERRED
);

-- Add missing columns to existing analyses table if needed
DO $$
BEGIN
    -- Basic columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'analyses' AND column_name = 'project_id'
    ) THEN
        ALTER TABLE public.analyses ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'analyses' AND column_name = 'url'
    ) THEN
        ALTER TABLE public.analyses ADD COLUMN url TEXT NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'analyses' AND column_name = 'url_hash'
    ) THEN
        ALTER TABLE public.analyses ADD COLUMN url_hash VARCHAR(64) GENERATED ALWAYS AS (encode(sha256(url::bytea), 'hex')) STORED;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'analyses' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.analyses ADD COLUMN status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed'));
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'analyses' AND column_name = 'report_type'
    ) THEN
        ALTER TABLE public.analyses ADD COLUMN report_type VARCHAR(50) DEFAULT 'overview' CHECK (report_type IN ('overview', 'detailed'));
    END IF;
    
    -- Score columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'analyses' AND column_name = 'accessibility_score'
    ) THEN
        ALTER TABLE public.analyses ADD COLUMN accessibility_score INTEGER;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'analyses' AND column_name = 'seo_score'
    ) THEN
        ALTER TABLE public.analyses ADD COLUMN seo_score INTEGER;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'analyses' AND column_name = 'performance_score'
    ) THEN
        ALTER TABLE public.analyses ADD COLUMN performance_score INTEGER;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'analyses' AND column_name = 'overall_score'
    ) THEN
        ALTER TABLE public.analyses ADD COLUMN overall_score INTEGER;
    END IF;
    
    -- JSON data columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'analyses' AND column_name = 'violations'
    ) THEN
        ALTER TABLE public.analyses ADD COLUMN violations JSONB;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'analyses' AND column_name = 'summary'
    ) THEN
        ALTER TABLE public.analyses ADD COLUMN summary JSONB;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'analyses' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.analyses ADD COLUMN metadata JSONB;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'analyses' AND column_name = 'screenshots'
    ) THEN
        ALTER TABLE public.analyses ADD COLUMN screenshots JSONB;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'analyses' AND column_name = 'seo_analysis'
    ) THEN
        ALTER TABLE public.analyses ADD COLUMN seo_analysis JSONB;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'analyses' AND column_name = 'ai_insights'
    ) THEN
        ALTER TABLE public.analyses ADD COLUMN ai_insights JSONB;
    END IF;
    
    -- Smart caching columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'analyses' AND column_name = 'is_anonymous'
    ) THEN
        ALTER TABLE public.analyses ADD COLUMN is_anonymous BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'analyses' AND column_name = 'cache_expires_at'
    ) THEN
        ALTER TABLE public.analyses ADD COLUMN cache_expires_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'analyses' AND column_name = 'access_count'
    ) THEN
        ALTER TABLE public.analyses ADD COLUMN access_count INTEGER DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'analyses' AND column_name = 'last_accessed_at'
    ) THEN
        ALTER TABLE public.analyses ADD COLUMN last_accessed_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Timestamp columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'analyses' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.analyses ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'analyses' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.analyses ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Fix NOT NULL constraints from old schema to support anonymous analyses
    -- Remove NOT NULL constraint from user_id to allow anonymous analyses
    BEGIN
        ALTER TABLE public.analyses ALTER COLUMN user_id DROP NOT NULL;
    EXCEPTION
        WHEN others THEN
            -- Ignore errors if constraint doesn't exist or column doesn't exist
            NULL;
    END;
    
    -- Remove NOT NULL constraint from analysis_data if it exists (legacy column)
    BEGIN
        ALTER TABLE public.analyses ALTER COLUMN analysis_data DROP NOT NULL;
    EXCEPTION
        WHEN others THEN
            -- Ignore errors if constraint doesn't exist or column doesn't exist
            NULL;
    END;
END $$;

-- Analysis issues table (for detailed issue tracking)
CREATE TABLE IF NOT EXISTS public.analysis_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE,
    
    -- Issue details
    title VARCHAR(500) NOT NULL,
    description TEXT,
    severity VARCHAR(50) CHECK (severity IN ('critical', 'serious', 'moderate', 'minor')),
    category VARCHAR(100),
    
    -- WCAG compliance
    wcag_criteria TEXT[],
    
    -- Technical details
    selector TEXT,
    html_snippet TEXT,
    remediation JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to existing analysis_issues table if needed
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'analysis_issues' AND column_name = 'analysis_id'
    ) THEN
        ALTER TABLE public.analysis_issues ADD COLUMN analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'analysis_issues' AND column_name = 'title'
    ) THEN
        ALTER TABLE public.analysis_issues ADD COLUMN title VARCHAR(500) NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'analysis_issues' AND column_name = 'description'
    ) THEN
        ALTER TABLE public.analysis_issues ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'analysis_issues' AND column_name = 'severity'
    ) THEN
        ALTER TABLE public.analysis_issues ADD COLUMN severity VARCHAR(50) CHECK (severity IN ('critical', 'serious', 'moderate', 'minor'));
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'analysis_issues' AND column_name = 'category'
    ) THEN
        ALTER TABLE public.analysis_issues ADD COLUMN category VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'analysis_issues' AND column_name = 'wcag_criteria'
    ) THEN
        ALTER TABLE public.analysis_issues ADD COLUMN wcag_criteria TEXT[];
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'analysis_issues' AND column_name = 'selector'
    ) THEN
        ALTER TABLE public.analysis_issues ADD COLUMN selector TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'analysis_issues' AND column_name = 'html_snippet'
    ) THEN
        ALTER TABLE public.analysis_issues ADD COLUMN html_snippet TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'analysis_issues' AND column_name = 'remediation'
    ) THEN
        ALTER TABLE public.analysis_issues ADD COLUMN remediation JSONB;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'analysis_issues' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.analysis_issues ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Usage logs table (for analytics)
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    analysis_id UUID REFERENCES public.analyses(id) ON DELETE SET NULL,
    
    -- Event details
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to existing usage_logs table if needed
DO $$
BEGIN
    -- Check if event_type column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usage_logs' 
        AND column_name = 'event_type'
    ) THEN
        ALTER TABLE public.usage_logs ADD COLUMN event_type VARCHAR(100) NOT NULL DEFAULT 'unknown';
    END IF;
    
    -- Check if event_data column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usage_logs' 
        AND column_name = 'event_data'
    ) THEN
        ALTER TABLE public.usage_logs ADD COLUMN event_data JSONB;
    END IF;
    
    -- Check if ip_address column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usage_logs' 
        AND column_name = 'ip_address'
    ) THEN
        ALTER TABLE public.usage_logs ADD COLUMN ip_address INET;
    END IF;
    
    -- Check if user_agent column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usage_logs' 
        AND column_name = 'user_agent'
    ) THEN
        ALTER TABLE public.usage_logs ADD COLUMN user_agent TEXT;
    END IF;
END $$;

-- =============================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Analyses table indexes
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_project_id ON public.analyses(project_id);
CREATE INDEX IF NOT EXISTS idx_analyses_url_hash ON public.analyses(url_hash);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON public.analyses(status);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON public.analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_cache_expires ON public.analyses(cache_expires_at) WHERE cache_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analyses_anonymous ON public.analyses(is_anonymous) WHERE is_anonymous = true;

-- Analysis issues indexes
CREATE INDEX IF NOT EXISTS idx_analysis_issues_analysis_id ON public.analysis_issues(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analysis_issues_severity ON public.analysis_issues(severity);

-- Usage logs indexes
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_event_type ON public.usage_logs(event_type);

-- =============================================================================
-- 3. CREATE FUNCTIONS
-- =============================================================================

-- Function to find cached analysis
CREATE OR REPLACE FUNCTION public.find_cached_analysis(
    p_url TEXT,
    p_cache_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
    analysis_id UUID,
    created_at TIMESTAMPTZ,
    is_cache_valid BOOLEAN,
    hours_old NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id AS analysis_id,
        a.created_at,
        CASE 
            WHEN a.created_at > NOW() - INTERVAL '1 hour' * p_cache_hours THEN true
            ELSE false
        END AS is_cache_valid,
        EXTRACT(EPOCH FROM (NOW() - a.created_at)) / 3600 AS hours_old
    FROM public.analyses a
    WHERE a.url_hash = encode(sha256(p_url::bytea), 'hex')
        AND a.status = 'completed'
    ORDER BY a.created_at DESC
    LIMIT 1;
END;
$$;

-- Function to increment analysis access count
CREATE OR REPLACE FUNCTION public.increment_analysis_access(p_analysis_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.analyses
    SET 
        access_count = access_count + 1,
        last_accessed_at = NOW()
    WHERE id = p_analysis_id;
END;
$$;

-- Function to create user profile automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 4. CREATE TRIGGERS
-- =============================================================================

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers to update updated_at timestamp
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_analyses_updated_at ON public.analyses;
CREATE TRIGGER update_analyses_updated_at
    BEFORE UPDATE ON public.analyses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- 5. CREATE VIEWS
-- =============================================================================

-- Drop existing view to avoid column name conflicts
DROP VIEW IF EXISTS public.recent_analyses;

-- View for recent analyses with cache status
CREATE VIEW public.recent_analyses AS
SELECT 
    a.*,
    COALESCE(up.email, 'Anonymous') as user_email,
    COALESCE(up.full_name, 'Anonymous User') as user_name,
    CASE 
        WHEN a.cache_expires_at IS NULL THEN false
        WHEN a.cache_expires_at > NOW() THEN true
        ELSE false
    END AS is_cache_valid,
    EXTRACT(EPOCH FROM (NOW() - COALESCE(a.created_at, NOW()))) / 3600 AS hours_old
FROM public.analyses a
LEFT JOIN public.user_profiles up ON a.user_id = up.id;

-- =============================================================================
-- 6. ENABLE ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 7. CREATE RLS POLICIES
-- =============================================================================

-- User Profiles Policies
DROP POLICY IF EXISTS "user_profiles_select_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_service_role" ON public.user_profiles;

CREATE POLICY "user_profiles_select_own" ON public.user_profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "user_profiles_service_role" ON public.user_profiles
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Projects Policies
DROP POLICY IF EXISTS "projects_select_own" ON public.projects;
DROP POLICY IF EXISTS "projects_crud_own" ON public.projects;
DROP POLICY IF EXISTS "projects_service_role" ON public.projects;

CREATE POLICY "projects_select_own" ON public.projects
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "projects_crud_own" ON public.projects
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "projects_service_role" ON public.projects
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Analyses Policies (supports both authenticated and anonymous)
DROP POLICY IF EXISTS "analyses_select_own" ON public.analyses;
DROP POLICY IF EXISTS "analyses_select_own_or_anonymous" ON public.analyses;
DROP POLICY IF EXISTS "analyses_select_accessible" ON public.analyses;
DROP POLICY IF EXISTS "analyses_insert_own" ON public.analyses;
DROP POLICY IF EXISTS "analyses_insert_service" ON public.analyses;
DROP POLICY IF EXISTS "analyses_update_service" ON public.analyses;
DROP POLICY IF EXISTS "analyses_crud_own" ON public.analyses;
DROP POLICY IF EXISTS "analyses_service_role" ON public.analyses;

CREATE POLICY "analyses_select_accessible" ON public.analyses
    FOR SELECT USING (
        auth.uid() = user_id 
        OR is_anonymous = true
        OR auth.role() = 'service_role'
    );

CREATE POLICY "analyses_crud_own" ON public.analyses
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "analyses_service_role" ON public.analyses
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Analysis Issues Policies
DROP POLICY IF EXISTS "analysis_issues_select_own" ON public.analysis_issues;
DROP POLICY IF EXISTS "analysis_issues_select_accessible" ON public.analysis_issues;
DROP POLICY IF EXISTS "analysis_issues_service_role" ON public.analysis_issues;

CREATE POLICY "analysis_issues_select_accessible" ON public.analysis_issues
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.analyses a 
            WHERE a.id = analysis_id 
            AND (a.user_id = auth.uid() OR a.is_anonymous = true)
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "analysis_issues_service_role" ON public.analysis_issues
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Usage Logs Policies
DROP POLICY IF EXISTS "usage_logs_select_own" ON public.usage_logs;
DROP POLICY IF EXISTS "usage_logs_service_role" ON public.usage_logs;

CREATE POLICY "usage_logs_select_own" ON public.usage_logs
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "usage_logs_service_role" ON public.usage_logs
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- =============================================================================
-- 8. SETUP STORAGE BUCKET
-- =============================================================================

-- Create storage bucket for analysis screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'analysis-screenshots',
    'analysis-screenshots', 
    true, -- Public bucket for easy access
    5242880, -- 5MB limit
    ARRAY['image/png', 'image/jpeg', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET 
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp']::text[];

-- Create storage policies
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow service role upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow service role update" ON storage.objects;
DROP POLICY IF EXISTS "Allow service role delete" ON storage.objects;

CREATE POLICY "Allow public read access" ON storage.objects
    FOR SELECT USING (bucket_id = 'analysis-screenshots');

CREATE POLICY "Allow service role upload" ON storage.objects
    FOR INSERT TO service_role
    WITH CHECK (bucket_id = 'analysis-screenshots');

CREATE POLICY "Allow service role update" ON storage.objects
    FOR UPDATE TO service_role
    USING (bucket_id = 'analysis-screenshots');

CREATE POLICY "Allow service role delete" ON storage.objects
    FOR DELETE TO service_role
    USING (bucket_id = 'analysis-screenshots');

-- =============================================================================
-- 9. GRANT PERMISSIONS
-- =============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant permissions on tables
GRANT SELECT ON public.user_profiles TO anon, authenticated;
GRANT SELECT ON public.projects TO anon, authenticated;
GRANT SELECT ON public.analyses TO anon, authenticated;
GRANT SELECT ON public.analysis_issues TO anon, authenticated;
GRANT SELECT ON public.usage_logs TO authenticated;

-- Grant permissions on views
GRANT SELECT ON public.recent_analyses TO anon, authenticated, service_role;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.find_cached_analysis TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_analysis_access TO anon, authenticated, service_role;

-- =============================================================================
-- 10. FINAL SETUP VERIFICATION
-- =============================================================================

-- Create a test function to verify setup
CREATE OR REPLACE FUNCTION public.verify_setup()
RETURNS TEXT AS $$
DECLARE
    table_count INTEGER;
    policy_count INTEGER;
    function_count INTEGER;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('user_profiles', 'projects', 'analyses', 'analysis_issues', 'usage_logs');
    
    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    -- Count functions
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name IN ('find_cached_analysis', 'increment_analysis_access', 'handle_new_user');
    
    RETURN FORMAT('Setup Complete! Tables: %s, Policies: %s, Functions: %s', 
                  table_count, policy_count, function_count);
END;
$$ LANGUAGE plpgsql;

-- Run verification
SELECT public.verify_setup();

-- =============================================================================
-- SETUP COMPLETE!
-- =============================================================================
-- 
-- This script has set up:
-- ✅ All database tables with smart caching
-- ✅ Performance indexes
-- ✅ RLS policies for security
-- ✅ Functions for caching and user management
-- ✅ Storage bucket for screenshots
-- ✅ Triggers for automatic updates
-- ✅ Views for easy querying
--
-- Your StreetWiseWeb database is now ready for production!
-- =============================================================================