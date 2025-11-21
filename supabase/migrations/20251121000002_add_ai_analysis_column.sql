-- Add AI analysis column to analyses table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analyses' AND column_name = 'ai_analysis') THEN
    ALTER TABLE analyses ADD COLUMN ai_analysis JSONB;
    RAISE NOTICE 'Added ai_analysis column to analyses';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analyses' AND column_name = 'ai_analyzed_at') THEN
    ALTER TABLE analyses ADD COLUMN ai_analyzed_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added ai_analyzed_at column to analyses';
  END IF;
END $$;
