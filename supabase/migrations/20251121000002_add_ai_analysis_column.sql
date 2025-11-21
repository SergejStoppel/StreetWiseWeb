-- ================================================
-- Add AI Analysis Column to Analyses Table
-- ================================================

DO $$
BEGIN
  -- Add ai_analysis JSONB column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'analyses' AND column_name = 'ai_analysis') THEN
    ALTER TABLE analyses ADD COLUMN ai_analysis JSONB;
    RAISE NOTICE 'Added ai_analysis column to analyses';
  END IF;

  -- Add ai_analyzed_at timestamp column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'analyses' AND column_name = 'ai_analyzed_at') THEN
    ALTER TABLE analyses ADD COLUMN ai_analyzed_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added ai_analyzed_at column to analyses';
  END IF;
END $$;

-- Index for finding analyses with AI analysis
CREATE INDEX IF NOT EXISTS idx_analyses_ai_analyzed ON analyses(ai_analyzed_at) WHERE ai_analyzed_at IS NOT NULL;

COMMENT ON COLUMN analyses.ai_analysis IS 'AI-powered content analysis results from OpenAI';
COMMENT ON COLUMN analyses.ai_analyzed_at IS 'Timestamp when AI analysis was completed';
