-- =====================================================
-- 03. FUNCTIONS
-- =====================================================
-- Creates all database functions
-- Must be run after core tables
-- =====================================================

BEGIN;

-- Function to update updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user creation (for database trigger)
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
BEGIN
    -- Log the deletion
    INSERT INTO public.deletion_logs (user_id, entity_type, entity_id, deleted_data, reason)
    VALUES (
        OLD.id,
        'user_profile',
        OLD.id,
        to_jsonb(OLD),
        'User account deletion'
    );
    
    -- Count what will be deleted for logging
    SELECT COUNT(*) INTO deleted_analyses_count FROM public.analyses WHERE user_id = OLD.id;
    SELECT COUNT(*) INTO deleted_projects_count FROM public.projects WHERE user_id = OLD.id;
    
    -- The actual deletions will be handled by CASCADE constraints
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup anonymous analyses older than 30 days
CREATE OR REPLACE FUNCTION public.cleanup_anonymous_analyses()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM public.analyses
        WHERE is_anonymous = TRUE
        AND created_at < NOW() - INTERVAL '30 days'
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup orphaned storage objects
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_storage()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM public.storage_objects
        WHERE analysis_id IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM public.analyses WHERE id = storage_objects.analysis_id
        )
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired cache analyses
CREATE OR REPLACE FUNCTION public.cleanup_expired_analyses()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM public.analyses
        WHERE cache_expires_at IS NOT NULL
        AND cache_expires_at < NOW()
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refresh dashboard stats materialized view
CREATE OR REPLACE FUNCTION public.refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_dashboard_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Main cleanup orchestrator function
CREATE OR REPLACE FUNCTION public.daily_cleanup()
RETURNS TABLE(
    anonymous_analyses_deleted INTEGER,
    orphaned_storage_deleted INTEGER,
    expired_analyses_deleted INTEGER
) AS $$
DECLARE
    anon_deleted INTEGER;
    storage_deleted INTEGER;
    expired_deleted INTEGER;
BEGIN
    -- Run all cleanup functions
    anon_deleted := public.cleanup_anonymous_analyses();
    storage_deleted := public.cleanup_orphaned_storage();
    expired_deleted := public.cleanup_expired_analyses();
    
    -- Refresh materialized views after cleanup
    PERFORM public.refresh_dashboard_stats();
    
    -- Return results
    RETURN QUERY SELECT anon_deleted, storage_deleted, expired_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find cached analysis for a given URL within cache window
CREATE OR REPLACE FUNCTION find_cached_analysis(
    p_url TEXT,
    p_cache_hours INTEGER DEFAULT 24
)
RETURNS TABLE(
    analysis_id UUID,
    created_at TIMESTAMPTZ,
    hours_old NUMERIC,
    is_cache_valid BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id as analysis_id,
        a.created_at,
        EXTRACT(EPOCH FROM (NOW() - a.created_at))/3600 as hours_old,
        (EXTRACT(EPOCH FROM (NOW() - a.created_at))/3600) <= p_cache_hours as is_cache_valid
    FROM analyses a
    WHERE a.url = p_url
      AND a.status = 'completed'
      AND a.created_at > NOW() - INTERVAL '1 hour' * p_cache_hours
    ORDER BY a.created_at DESC
    LIMIT 1;
END;
$$;

-- Function to increment analysis access count
CREATE OR REPLACE FUNCTION increment_analysis_access(
    p_analysis_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE analyses 
    SET access_count = COALESCE(access_count, 0) + 1,
        updated_at = NOW()
    WHERE id = p_analysis_id;
END;
$$;

-- Function to log report access
CREATE OR REPLACE FUNCTION log_report_access(
    p_analysis_id UUID,
    p_user_id UUID,
    p_access_type TEXT,
    p_report_type TEXT,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_referrer TEXT DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO report_access_logs (
        analysis_id,
        user_id,
        access_type,
        report_type,
        ip_address,
        user_agent,
        referrer,
        session_id
    )
    VALUES (
        p_analysis_id,
        p_user_id,
        p_access_type,
        p_report_type,
        p_ip_address,
        p_user_agent,
        p_referrer,
        p_session_id
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$;

COMMIT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Functions created successfully';
    RAISE NOTICE '';
END $$;