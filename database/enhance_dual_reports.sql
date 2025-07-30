-- Enhance analyses table to support dual report generation
-- Run this in Supabase SQL Editor

BEGIN;

-- Add columns for storing both free and detailed reports
ALTER TABLE public.analyses 
ADD COLUMN IF NOT EXISTS free_report JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS detailed_report JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS detailed_report_paid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS detailed_report_paid_at TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS has_detailed_access BOOLEAN DEFAULT FALSE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_analyses_detailed_paid ON public.analyses(detailed_report_paid) WHERE detailed_report_paid = true;
CREATE INDEX IF NOT EXISTS idx_analyses_has_detailed ON public.analyses(has_detailed_access) WHERE has_detailed_access = true;

-- Add comments for clarity
COMMENT ON COLUMN public.analyses.free_report IS 'Free report data (limited insights)';
COMMENT ON COLUMN public.analyses.detailed_report IS 'Detailed report data (full insights)';
COMMENT ON COLUMN public.analyses.detailed_report_paid IS 'Whether user has paid for detailed report access';
COMMENT ON COLUMN public.analyses.detailed_report_paid_at IS 'When detailed report access was granted';
COMMENT ON COLUMN public.analyses.has_detailed_access IS 'Whether user currently has access to detailed report (subscription or payment)';

-- For development/testing: Give current user detailed access
UPDATE public.analyses 
SET 
    detailed_report_paid = true,
    detailed_report_paid_at = NOW(),
    has_detailed_access = true
WHERE user_id = '75219379-1069-43b5-8017-7934bf6e9638';

COMMIT;