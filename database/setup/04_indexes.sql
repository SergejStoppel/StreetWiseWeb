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
CREATE INDEX idx_analyses_scores ON public.analyses(overall_score, accessibility_score, seo_score, performance_score);
CREATE INDEX idx_analyses_detailed_paid ON public.analyses(detailed_report_paid) WHERE detailed_report_paid = true;
CREATE INDEX idx_analyses_has_detailed ON public.analyses(has_detailed_access) WHERE has_detailed_access = true;

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

-- Report configurations indexes
CREATE INDEX idx_report_configurations_type ON public.report_configurations(report_type);

-- Subscriptions indexes
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_plan ON public.subscriptions(plan_type);
CREATE INDEX idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_active ON public.subscriptions(status, current_period_end) WHERE status = 'active';

-- Report access logs indexes
CREATE INDEX idx_report_access_logs_analysis ON public.report_access_logs(analysis_id);
CREATE INDEX idx_report_access_logs_user ON public.report_access_logs(user_id);
CREATE INDEX idx_report_access_logs_created ON public.report_access_logs(created_at DESC);
CREATE INDEX idx_report_access_logs_access_type ON public.report_access_logs(access_type);

COMMIT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Indexes created successfully';
    RAISE NOTICE '';
END $$;