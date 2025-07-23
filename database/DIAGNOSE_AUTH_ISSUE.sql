-- =====================================================
-- DIAGNOSE: USER REGISTRATION ISSUES
-- =====================================================

-- 1. Check if auth is enabled and working
SELECT COUNT(*) as total_auth_users 
FROM auth.users;

-- 2. Check for recent sign-up attempts (last 24 hours)
SELECT 
    id,
    email,
    created_at,
    confirmed_at,
    email_confirmed_at,
    last_sign_in_at,
    raw_user_meta_data
FROM auth.users
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 3. Check if user_profiles table has corresponding entries
SELECT 
    au.email as auth_email,
    au.created_at as auth_created,
    au.confirmed_at as auth_confirmed,
    up.id as profile_exists
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE au.created_at > NOW() - INTERVAL '24 hours'
ORDER BY au.created_at DESC;

-- 4. Check RLS policies on user_profiles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_profiles';

-- 5. Check if the handle_new_user trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 6. Test if we can manually insert into user_profiles
-- (This will fail if there's no user with this ID, but shows if insert is allowed)
DO $$
BEGIN
    -- Try to get permissions info
    RAISE NOTICE 'Current user: %', current_user;
    RAISE NOTICE 'Current role: %', current_role;
    
    -- Check if RLS is enabled
    RAISE NOTICE 'RLS enabled on user_profiles: %', 
        (SELECT relrowsecurity FROM pg_class WHERE relname = 'user_profiles');
END $$;

-- 7. Check Supabase auth settings (if accessible)
-- Note: This might fail depending on permissions
BEGIN;
    SELECT raw_app_meta_data, raw_user_meta_data 
    FROM auth.users 
    LIMIT 1;
ROLLBACK;

-- Summary message
DO $$
DECLARE
    auth_count INTEGER;
    profile_count INTEGER;
    recent_signups INTEGER;
BEGIN
    SELECT COUNT(*) INTO auth_count FROM auth.users;
    SELECT COUNT(*) INTO profile_count FROM public.user_profiles;
    SELECT COUNT(*) INTO recent_signups 
    FROM auth.users 
    WHERE created_at > NOW() - INTERVAL '1 hour';
    
    RAISE NOTICE '';
    RAISE NOTICE '=== DIAGNOSTIC SUMMARY ===';
    RAISE NOTICE 'Total auth users: %', auth_count;
    RAISE NOTICE 'Total user profiles: %', profile_count;
    RAISE NOTICE 'Recent signups (last hour): %', recent_signups;
    RAISE NOTICE 'Missing profiles: %', auth_count - profile_count;
    
    IF auth_count > profile_count THEN
        RAISE NOTICE '⚠️  There are auth users without profiles!';
        RAISE NOTICE 'Run FIX_USER_PROFILE_AFTER_RESET.sql to create missing profiles.';
    END IF;
END $$;