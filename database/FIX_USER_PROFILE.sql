-- Fix user profile creation
-- Run this in Supabase SQL Editor

-- Check if user exists in auth.users but not in user_profiles
DO $$
DECLARE
    user_record RECORD;
    profile_count INTEGER;
BEGIN
    -- Find users without profiles
    FOR user_record IN 
        SELECT id, email 
        FROM auth.users 
        WHERE id NOT IN (SELECT id FROM public.user_profiles)
    LOOP
        RAISE NOTICE 'Creating profile for user: % (%)', user_record.id, user_record.email;
        
        -- Create the profile
        INSERT INTO public.user_profiles (id, email, created_at, updated_at)
        VALUES (user_record.id, user_record.email, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
    END LOOP;
    
    -- Count total profiles
    SELECT COUNT(*) INTO profile_count FROM public.user_profiles;
    RAISE NOTICE 'Total user profiles: %', profile_count;
END $$;

-- Fix the missing column in analysis_summaries
ALTER TABLE public.analysis_summaries 
ADD COLUMN IF NOT EXISTS color_contrast_violations INTEGER DEFAULT 0;

-- Verify the fix
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'analysis_summaries' 
AND column_name = 'color_contrast_violations';