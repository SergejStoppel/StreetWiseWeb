-- =====================================================
-- 02. CORE TABLES
-- =====================================================
-- Creates the main application tables
-- Must be run after cleanup and before other scripts
-- =====================================================

BEGIN;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles (extends Supabase auth.users)
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

-- Main analyses table
CREATE TABLE public.analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    url TEXT NOT NULL,
    report_type VARCHAR(50) DEFAULT 'overview',
    language VARCHAR(10) DEFAULT 'en',
    overall_score INTEGER DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),
    accessibility_score INTEGER DEFAULT 0 CHECK (accessibility_score >= 0 AND accessibility_score <= 100),
    seo_score INTEGER DEFAULT 0 CHECK (seo_score >= 0 AND seo_score <= 100),
    performance_score INTEGER DEFAULT 0 CHECK (performance_score >= 0 AND performance_score <= 100),
    analysis_data JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Anonymous access
    is_anonymous BOOLEAN DEFAULT FALSE,
    url_hash TEXT,
    cache_expires_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT analyses_url_not_empty CHECK (LENGTH(TRIM(url)) > 0)
);

-- Storage tracking for files
CREATE TABLE public.storage_objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE,
    bucket_id TEXT NOT NULL DEFAULT 'analysis-screenshots',
    object_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT DEFAULT 0,
    mime_type TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT storage_objects_path_not_empty CHECK (LENGTH(TRIM(object_path)) > 0),
    CONSTRAINT storage_objects_positive_size CHECK (file_size >= 0)
);

-- Analysis violations (separate table for performance)
CREATE TABLE public.analysis_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
    violations JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analysis screenshots
CREATE TABLE public.analysis_screenshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
    screenshot_url TEXT NOT NULL,
    screenshot_type VARCHAR(50) DEFAULT 'main' CHECK (screenshot_type IN ('main', 'desktop', 'mobile', 'tablet', 'full')),
    storage_object_id UUID REFERENCES public.storage_objects(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analysis summaries for dashboard queries
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

-- Team collaboration table
CREATE TABLE public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    is_active BOOLEAN DEFAULT TRUE,
    invited_by UUID REFERENCES public.user_profiles(id),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(project_id, user_id)
);

-- Deletion logs for audit trail
CREATE TABLE public.deletion_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    deleted_data JSONB,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMIT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Core tables created successfully';
    RAISE NOTICE '';
END $$;