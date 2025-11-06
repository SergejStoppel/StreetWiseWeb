-- Storage Bucket Policies for Analysis Assets
-- This script sets up Row Level Security (RLS) policies for the 'analysis-assets' storage bucket
-- Note: RLS is already enabled on storage.objects by Supabase, so we just create the policies

-- Drop existing policies if they exist (for re-running the script)
DROP POLICY IF EXISTS "Service can upload analysis assets" ON storage.objects;
DROP POLICY IF EXISTS "Service can read analysis assets" ON storage.objects;
DROP POLICY IF EXISTS "Service can update analysis assets" ON storage.objects;
DROP POLICY IF EXISTS "Service can delete analysis assets" ON storage.objects;

-- Policy 1: Allow service role to upload (insert) analysis assets
-- This allows the backend workers to store HTML, CSS, JS, screenshots, and metadata
CREATE POLICY "Service can upload analysis assets" ON storage.objects
FOR INSERT TO service_role
WITH CHECK (bucket_id = 'analysis-assets');

-- Policy 2: Allow service role to read (select/download) analysis assets
-- This allows workers to retrieve stored assets for analysis
CREATE POLICY "Service can read analysis assets" ON storage.objects
FOR SELECT TO service_role
USING (bucket_id = 'analysis-assets');

-- Policy 3: Allow service role to update analysis assets (optional)
-- This allows updating existing files if needed
CREATE POLICY "Service can update analysis assets" ON storage.objects
FOR UPDATE TO service_role
USING (bucket_id = 'analysis-assets')
WITH CHECK (bucket_id = 'analysis-assets');

-- Policy 4: Allow service role to delete analysis assets (optional)
-- This allows cleanup of old analysis files if needed
CREATE POLICY "Service can delete analysis assets" ON storage.objects
FOR DELETE TO service_role
USING (bucket_id = 'analysis-assets');
