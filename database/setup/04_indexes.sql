-- =====================================================
-- 04. INDEXES
-- =====================================================
-- Creates indexes for performance optimization
-- Must be run after core tables
-- =====================================================

BEGIN;

-- User profiles indexes
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_plan ON public.user_profiles(plan_type);
CREATE INDEX idx_user_profiles_created ON public.user_profiles(created_at DESC);

-- Projects indexes
CREATE INDEX idx_projects_user ON public.projects(user_id);
CREATE INDEX idx_projects_archived ON public.projects(is_archived);
CREATE INDEX idx_projects_created ON public.projects(created_at DESC);

-- Analyses indexes
CREATE INDEX idx_analyses_user ON public.analyses(user_id);
CREATE INDEX idx_analyses_project ON public.analyses(project_id);
CREATE INDEX idx_analyses_url_hash ON public.analyses(url_hash);
CREATE INDEX idx_analyses_anonymous ON public.analyses(is_anonymous);
CREATE INDEX idx_analyses_created ON public.analyses(created_at DESC);
CREATE INDEX idx_analyses_status ON public.analyses(status);
CREATE INDEX idx_analyses_cache_expires ON public.analyses(cache_expires_at) WHERE cache_expires_at IS NOT NULL;

-- Storage objects indexes
CREATE INDEX idx_storage_objects_user ON public.storage_objects(user_id);
CREATE INDEX idx_storage_objects_analysis ON public.storage_objects(analysis_id);
CREATE INDEX idx_storage_objects_bucket ON public.storage_objects(bucket_id);
CREATE INDEX idx_storage_objects_created ON public.storage_objects(created_at DESC);

-- Analysis violations indexes
CREATE INDEX idx_analysis_violations_analysis ON public.analysis_violations(analysis_id);

-- Analysis screenshots indexes
CREATE INDEX idx_analysis_screenshots_analysis ON public.analysis_screenshots(analysis_id);
CREATE INDEX idx_analysis_screenshots_type ON public.analysis_screenshots(screenshot_type);
CREATE INDEX idx_analysis_screenshots_storage ON public.analysis_screenshots(storage_object_id);

-- Analysis summaries indexes
CREATE INDEX idx_analysis_summaries_analysis ON public.analysis_summaries(analysis_id);
CREATE INDEX idx_analysis_summaries_issues ON public.analysis_summaries(total_issues, critical_issues);
CREATE INDEX idx_analysis_summaries_compliance ON public.analysis_summaries(compliance_percentage);

-- Usage logs indexes
CREATE INDEX idx_usage_logs_user ON public.usage_logs(user_id);
CREATE INDEX idx_usage_logs_action ON public.usage_logs(action);
CREATE INDEX idx_usage_logs_created ON public.usage_logs(created_at DESC);
CREATE INDEX idx_usage_logs_user_action_date ON public.usage_logs(user_id, action, created_at DESC);

-- Team members indexes
CREATE INDEX idx_team_members_project ON public.team_members(project_id);
CREATE INDEX idx_team_members_user ON public.team_members(user_id);
CREATE INDEX idx_team_members_active ON public.team_members(is_active);

-- Deletion logs indexes
CREATE INDEX idx_deletion_logs_user ON public.deletion_logs(user_id);
CREATE INDEX idx_deletion_logs_entity ON public.deletion_logs(entity_type, entity_id);
CREATE INDEX idx_deletion_logs_created ON public.deletion_logs(created_at DESC);

COMMIT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Indexes created successfully';
    RAISE NOTICE '';
END $$;