-- Simple fix for user registration issues
-- Run this in your Supabase SQL Editor

-- Ensure columns exist
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
EXCEPTION WHEN others THEN
    -- Don't fail user creation if profile creation fails
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;