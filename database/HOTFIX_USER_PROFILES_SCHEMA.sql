-- =====================================================
-- HOTFIX: USER PROFILES SCHEMA MISMATCH
-- =====================================================
-- This script fixes the mismatch between database schema
-- and frontend code expectations
-- 
-- Issue: Database has 'full_name' but frontend expects
-- 'first_name' and 'last_name' columns
-- =====================================================

-- Add the missing columns to match frontend expectations
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);

-- If you want to migrate existing full_name data (if any exists):
UPDATE public.user_profiles 
SET first_name = split_part(full_name, ' ', 1),
    last_name = CASE 
        WHEN full_name LIKE '% %' THEN split_part(full_name, ' ', 2)
        ELSE NULL 
    END
WHERE full_name IS NOT NULL AND (first_name IS NULL OR last_name IS NULL);

-- Optional: Keep full_name column for compatibility or remove it
-- Uncomment the next line if you want to remove the full_name column:
-- ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS full_name;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Schema hotfix applied successfully!';
    RAISE NOTICE '📋 Changes made:';
    RAISE NOTICE '   • Added first_name column (VARCHAR 255)';
    RAISE NOTICE '   • Added last_name column (VARCHAR 255)'; 
    RAISE NOTICE '   • Migrated existing full_name data if any existed';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Next step: Test user registration in your app';
END $$;