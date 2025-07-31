-- =====================================================
-- 05. MATERIALIZED VIEWS
-- =====================================================
-- Creates materialized views for performance optimization
-- Must be run after core tables
-- =====================================================

BEGIN;

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

COMMIT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Materialized views created successfully';
    RAISE NOTICE '';
END $$;