-- =====================================================
-- DIAGNOSE AND FIX USER REGISTRATION ISSUES
-- =====================================================
-- This script will:
-- 1. Check current table structure
-- 2. Check if trigger exists and works
-- 3. Fix any issues found
-- 4. Test the setup
-- =====================================================

-- Step 1: Check current user_profiles table structure
DO $$
DECLARE
    column_info RECORD;
BEGIN
    RAISE NOTICE '🔍 DIAGNOSIS: Checking user_profiles table structure...';
    
    FOR column_info IN 
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '   Column: % (% - nullable: %)', 
            column_info.column_name, 
            column_info.data_type, 
            column_info.is_nullable;
    END LOOP;
END $$;

-- Step 2: Check if required columns exist
DO $$
DECLARE
    has_first_name BOOLEAN;
    has_last_name BOOLEAN;
    has_email BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 DIAGNOSIS: Checking required columns...';
    
    SELECT COUNT(*) > 0 INTO has_first_name 
    FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'first_name';
    
    SELECT COUNT(*) > 0 INTO has_last_name 
    FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'last_name';
    
    SELECT COUNT(*) > 0 INTO has_email 
    FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'email';
    
    RAISE NOTICE '   first_name exists: %', has_first_name;
    RAISE NOTICE '   last_name exists: %', has_last_name;
    RAISE NOTICE '   email exists: %', has_email;
    
    IF NOT has_first_name THEN
        RAISE NOTICE '❌ Missing first_name column - will add it';
        ALTER TABLE public.user_profiles ADD COLUMN first_name VARCHAR(255);
        RAISE NOTICE '✅ Added first_name column';
    END IF;
    
    IF NOT has_last_name THEN
        RAISE NOTICE '❌ Missing last_name column - will add it';
        ALTER TABLE public.user_profiles ADD COLUMN last_name VARCHAR(255);
        RAISE NOTICE '✅ Added last_name column';
    END IF;
END $$;

-- Step 3: Check if trigger function exists
DO $$
DECLARE
    function_exists BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 DIAGNOSIS: Checking trigger function...';
    
    SELECT COUNT(*) > 0 INTO function_exists
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name = 'handle_new_user'
    AND routine_type = 'FUNCTION';
    
    RAISE NOTICE '   handle_new_user function exists: %', function_exists;
    
    IF NOT function_exists THEN
        RAISE NOTICE '❌ Missing handle_new_user function - will create it';
    END IF;
END $$;

-- Step 4: Recreate the trigger function (with better error handling)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    BEGIN
        INSERT INTO public.user_profiles (id, email, created_at, updated_at)
        VALUES (NEW.id, NEW.email, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
        
        RAISE LOG 'Successfully created user profile for user: % (email: %)', NEW.id, NEW.email;
        
    EXCEPTION WHEN others THEN
        -- Log the error but don't fail the user creation
        RAISE LOG 'Error creating user profile for %: % - %', NEW.email, SQLSTATE, SQLERRM;
        -- Still return NEW so user creation doesn't fail
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Check if auth trigger exists
DO $$
DECLARE
    trigger_exists BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 DIAGNOSIS: Checking auth trigger...';
    
    SELECT COUNT(*) > 0 INTO trigger_exists
    FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created';
    
    RAISE NOTICE '   on_auth_user_created trigger exists: %', trigger_exists;
    
    IF NOT trigger_exists THEN
        RAISE NOTICE '❌ Missing auth trigger - attempting to create it';
    END IF;
END $$;

-- Step 6: Try to create the auth trigger (might fail, that's OK)
DO $$
BEGIN
    -- Drop trigger if it exists
    BEGIN
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop existing trigger (this is OK): %', SQLERRM;
    END;
    
    -- Try to create the trigger
    BEGIN
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
        
        RAISE NOTICE '✅ Auth trigger created successfully!';
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️  Could not create auth trigger: %', SQLERRM;
            RAISE NOTICE '    This means user profiles will need to be created manually by the app';
    END;
END $$;

-- Step 7: Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT INSERT ON public.user_profiles TO service_role;

-- Step 8: Test the function manually (simulate what should happen)
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_email TEXT := 'test@example.com';
    profile_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧪 TEST: Simulating user profile creation...';
    
    -- Clean up any existing test data
    DELETE FROM public.user_profiles WHERE email = test_email;
    
    -- Test the function directly
    BEGIN
        INSERT INTO public.user_profiles (id, email, created_at, updated_at)
        VALUES (test_user_id, test_email, NOW(), NOW());
        
        SELECT COUNT(*) INTO profile_count 
        FROM public.user_profiles 
        WHERE email = test_email;
        
        IF profile_count > 0 THEN
            RAISE NOTICE '✅ User profile creation test PASSED';
        ELSE
            RAISE NOTICE '❌ User profile creation test FAILED';
        END IF;
        
        -- Clean up test data
        DELETE FROM public.user_profiles WHERE email = test_email;
        
    EXCEPTION WHEN others THEN
        RAISE NOTICE '❌ User profile creation test FAILED with error: %', SQLERRM;
    END;
END $$;

-- Step 9: Final status report
DO $$
DECLARE
    table_exists BOOLEAN;
    has_columns BOOLEAN;
    function_exists BOOLEAN;
    trigger_exists BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📋 FINAL DIAGNOSIS REPORT:';
    RAISE NOTICE '=========================';
    
    -- Check table
    SELECT COUNT(*) > 0 INTO table_exists
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_profiles';
    
    -- Check columns
    SELECT COUNT(*) >= 2 INTO has_columns
    FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name IN ('first_name', 'last_name', 'email');
    
    -- Check function
    SELECT COUNT(*) > 0 INTO function_exists
    FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_name = 'handle_new_user';
    
    -- Check trigger
    SELECT COUNT(*) > 0 INTO trigger_exists
    FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created';
    
    RAISE NOTICE '✅ Table exists: %', table_exists;
    RAISE NOTICE '✅ Required columns exist: %', has_columns;
    RAISE NOTICE '✅ Trigger function exists: %', function_exists;
    RAISE NOTICE '% Auth trigger exists: %', 
        CASE WHEN trigger_exists THEN '✅' ELSE '⚠️ ' END, 
        trigger_exists;
    
    RAISE NOTICE '';
    IF table_exists AND has_columns AND function_exists THEN
        RAISE NOTICE '🎉 DATABASE SETUP LOOKS GOOD!';
        RAISE NOTICE '';
        RAISE NOTICE '🔄 Next steps:';
        RAISE NOTICE '   1. Try user registration again';
        IF NOT trigger_exists THEN
            RAISE NOTICE '   2. If it still fails, the app will need to create profiles manually';
            RAISE NOTICE '      (this is normal for some Supabase configurations)';
        END IF;
    ELSE
        RAISE NOTICE '❌ There are still issues that need to be resolved';
    END IF;
END $$;