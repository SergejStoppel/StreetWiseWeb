-- =====================================================
-- SUPABASE STORAGE BUCKET SETUP
-- =====================================================
-- Run this script in Supabase SQL Editor AFTER creating
-- the 'analysis-screenshots' bucket in Storage UI
-- =====================================================

-- NOTE: You must create the bucket first in Storage UI:
-- 1. Go to Storage → Create bucket
-- 2. Name: analysis-screenshots 
-- 3. Make it PUBLIC (toggle on)
-- 4. Then run this script

-- =====================================================
-- STORAGE BUCKET POLICIES
-- =====================================================

-- Remove any existing policies for this bucket
DROP POLICY IF EXISTS "Authenticated users can upload screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Public can view screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own screenshots" ON storage.objects;

-- 1. INSERT Policy - Authenticated users can upload screenshots
CREATE POLICY "Authenticated users can upload screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'analysis-screenshots');

-- 2. SELECT Policy - Public can view screenshots (needed for sharing reports)
CREATE POLICY "Public can view screenshots"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'analysis-screenshots');

-- 3. DELETE Policy - Users can delete their own screenshots
-- This uses a folder-based approach where files are organized by user ID
CREATE POLICY "Users can delete their own screenshots"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'analysis-screenshots' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. UPDATE Policy - Users can update their own screenshot metadata
CREATE POLICY "Users can update their own screenshots"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'analysis-screenshots' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check that the bucket exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'analysis-screenshots') THEN
        RAISE NOTICE '✅ Storage bucket "analysis-screenshots" exists';
        
        -- Check if it's public
        IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'analysis-screenshots' AND public = true) THEN
            RAISE NOTICE '✅ Storage bucket is PUBLIC (correct)';
        ELSE
            RAISE NOTICE '⚠️  Storage bucket is PRIVATE - you may need to make it public in the UI';
        END IF;
    ELSE
        RAISE NOTICE '❌ Storage bucket "analysis-screenshots" does not exist!';
        RAISE NOTICE '   Please create it first in Storage UI:';
        RAISE NOTICE '   1. Go to Storage → Create bucket';
        RAISE NOTICE '   2. Name: analysis-screenshots';
        RAISE NOTICE '   3. Make it PUBLIC (toggle on)';
        RAISE NOTICE '   4. Then re-run this script';
    END IF;
END $$;

-- Show all policies for the storage.objects table
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname LIKE '%screenshot%';
    
    IF policy_count > 0 THEN
        RAISE NOTICE '✅ Found % storage policies for screenshots', policy_count;
    ELSE
        RAISE NOTICE '⚠️  No screenshot storage policies found - they may not have been created';
    END IF;
END $$;

-- List all policies for verification
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
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND (policyname LIKE '%screenshot%' OR policyname LIKE '%analysis-screenshots%')
ORDER BY policyname;

-- =====================================================
-- FINAL SETUP MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Storage Bucket Setup Complete!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Created 4 storage policies:';
    RAISE NOTICE '   • INSERT: Authenticated users can upload';
    RAISE NOTICE '   • SELECT: Public can view (for sharing)';
    RAISE NOTICE '   • DELETE: Users can delete their own';
    RAISE NOTICE '   • UPDATE: Users can update their own';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 File Organization:';
    RAISE NOTICE '   Files will be stored as: /user-id/analysis-id/filename.png';
    RAISE NOTICE '   This ensures users can only manage their own files';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Your storage is ready for screenshot uploads!';
    RAISE NOTICE '';
END $$;