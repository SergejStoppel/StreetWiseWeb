-- Migration: Add name column to websites table
-- Date: 2025-01-26
-- Description: Adds optional name column to websites table for user-friendly identification

-- Add name column to websites table
ALTER TABLE websites 
ADD COLUMN name TEXT;

-- Update existing records to use domain from URL as name (optional default)
UPDATE websites 
SET name = CASE 
  WHEN url ~ '^https?://([^/]+)' THEN 
    regexp_replace(url, '^https?://([^/]+).*', '\1')
  ELSE 
    url
END
WHERE name IS NULL;