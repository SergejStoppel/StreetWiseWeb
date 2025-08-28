-- Migration: Add missing fields to accessibility_issues table
-- Date: 2025-08-27
-- Description: Adds dom_path and wcag_criteria fields to support enhanced accessibility analysis

-- Add dom_path column if it doesn't exist
ALTER TABLE accessibility_issues 
ADD COLUMN IF NOT EXISTS dom_path TEXT;

-- Add wcag_criteria column if it doesn't exist  
ALTER TABLE accessibility_issues
ADD COLUMN IF NOT EXISTS wcag_criteria TEXT;

-- Add comments to document the columns
COMMENT ON COLUMN accessibility_issues.dom_path IS 'DOM hierarchy path showing element location (e.g., "html > body > main > form > input")';
COMMENT ON COLUMN accessibility_issues.wcag_criteria IS 'WCAG criteria references (e.g., "1.3.1, 2.4.6")';

-- Update existing location_path comment for clarity
COMMENT ON COLUMN accessibility_issues.location_path IS 'CSS selector for locating the element (e.g., "button#submit", "input[name=email]")';
COMMENT ON COLUMN accessibility_issues.code_snippet IS 'The problematic HTML code snippet';