-- Verification Script for StreetWiseWeb Database Setup
-- Run this to verify everything was created correctly

-- =============================================================================
-- 1. CHECK TABLES
-- =============================================================================

SELECT 'Tables Check' as verification_type, 
       table_name, 
       'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'user_profiles', 
    'projects', 
    'analyses', 
    'usage_logs',
    'storage_objects',
    'analysis_violations', 
    'analysis_screenshots', 
    'analysis_summaries',
    'deletion_logs'
)
ORDER BY table_name;

-- =============================================================================
-- 2. CHECK MATERIALIZED VIEW
-- =============================================================================

SELECT 'Materialized View Check' as verification_type,
       matviewname as object_name,
       'EXISTS' as status
FROM pg_matviews 
WHERE schemaname = 'public' 
AND matviewname = 'user_dashboard_stats';

-- =============================================================================
-- 3. CHECK FUNCTIONS
-- =============================================================================

SELECT 'Functions Check' as verification_type,
       proname as object_name,
       'EXISTS' as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND proname IN (
    'refresh_dashboard_stats',
    'cleanup_user_data_before_delete',
    'cleanup_anonymous_analyses',
    'cleanup_orphaned_storage',
    'daily_cleanup',
    'update_updated_at_column',
    'handle_new_user'
)
ORDER BY proname;

-- =============================================================================
-- 4. CHECK TRIGGERS
-- =============================================================================

SELECT 'Triggers Check' as verification_type,
       tgname as object_name,
       'EXISTS ON ' || c.relname as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
AND tgname IN (
    'before_user_delete',
    'update_user_profiles_updated_at',
    'update_projects_updated_at',
    'update_analyses_updated_at',
    'update_analysis_summaries_updated_at',
    'on_auth_user_created'
)
ORDER BY tgname;

-- =============================================================================
-- 5. CHECK INDEXES
-- =============================================================================

SELECT 'Indexes Check' as verification_type,
       indexname as object_name,
       'EXISTS ON ' || tablename as status
FROM pg_indexes 
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY indexname;

-- =============================================================================
-- 6. CHECK RLS POLICIES
-- =============================================================================

SELECT 'RLS Policies Check' as verification_type,
       tablename || ' -> ' || policyname as object_name,
       'EXISTS' as status
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =============================================================================
-- 7. CHECK FOREIGN KEY CONSTRAINTS
-- =============================================================================

SELECT 'Foreign Keys Check' as verification_type,
       tc.table_name || ' -> ' || tc.constraint_name as object_name,
       'CASCADE: ' || rc.delete_rule as status
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
WHERE tc.table_schema = 'public'
AND tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('analyses', 'usage_logs')
ORDER BY tc.table_name;

-- =============================================================================
-- 8. SUMMARY COUNT
-- =============================================================================

SELECT 'SUMMARY' as verification_type,
       'Total Objects Created' as object_name,
       (
           (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('user_profiles', 'projects', 'analyses', 'usage_logs', 'storage_objects', 'analysis_violations', 'analysis_screenshots', 'analysis_summaries', 'deletion_logs')) +
           (SELECT COUNT(*) FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'user_dashboard_stats') +
           (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND proname IN ('refresh_dashboard_stats', 'cleanup_user_data_before_delete', 'cleanup_anonymous_analyses', 'cleanup_orphaned_storage', 'daily_cleanup', 'update_updated_at_column', 'handle_new_user'))
       )::text || ' objects' as status;

-- =============================================================================
-- 9. TEST MATERIALIZED VIEW
-- =============================================================================

SELECT 'Materialized View Test' as verification_type,
       'user_dashboard_stats' as object_name,
       CASE 
           WHEN COUNT(*) >= 0 THEN 'WORKING - ' || COUNT(*) || ' rows'
           ELSE 'ERROR'
       END as status
FROM public.user_dashboard_stats;