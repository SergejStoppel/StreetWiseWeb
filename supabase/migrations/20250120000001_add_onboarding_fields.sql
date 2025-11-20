-- Migration: Add Onboarding Fields
-- Description: Adds fields to track user onboarding progress and feature interactions
-- Author: Phase 4 Implementation
-- Date: 2025-01-20

-- Add onboarding tracking fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS product_tour_completed BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS features_explored JSONB DEFAULT '[]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_onboarding_update TIMESTAMPTZ DEFAULT now();
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_analysis_completed BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS results_viewed_count INTEGER DEFAULT 0;

-- Create table to track feature interactions for analytics
CREATE TABLE IF NOT EXISTS user_feature_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('viewed', 'clicked', 'completed', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_feature_interactions_user_id ON user_feature_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_interactions_feature ON user_feature_interactions(feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_interactions_created_at ON user_feature_interactions(created_at DESC);

-- Function to update onboarding step
CREATE OR REPLACE FUNCTION update_onboarding_step(
  p_user_id UUID,
  p_step INTEGER,
  p_completed BOOLEAN DEFAULT false
) RETURNS void AS $$
BEGIN
  UPDATE users
  SET
    onboarding_step = GREATEST(onboarding_step, p_step),
    onboarding_completed = CASE WHEN p_completed THEN true ELSE onboarding_completed END,
    last_onboarding_update = now()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record feature interaction
CREATE OR REPLACE FUNCTION record_feature_interaction(
  p_user_id UUID,
  p_feature_name TEXT,
  p_interaction_type TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_interaction_id UUID;
BEGIN
  INSERT INTO user_feature_interactions (user_id, feature_name, interaction_type, metadata)
  VALUES (p_user_id, p_feature_name, p_interaction_type, p_metadata)
  RETURNING id INTO v_interaction_id;

  -- Update features_explored if this is a new feature
  UPDATE users
  SET features_explored = CASE
    WHEN NOT features_explored ? p_feature_name
    THEN features_explored || jsonb_build_array(p_feature_name)
    ELSE features_explored
  END
  WHERE id = p_user_id;

  RETURN v_interaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update onboarding based on user actions
CREATE OR REPLACE FUNCTION auto_update_onboarding_progress() RETURNS TRIGGER AS $$
BEGIN
  -- If user completes first analysis, update onboarding
  IF TG_TABLE_NAME = 'analyses' AND NEW.status = 'completed' THEN
    UPDATE users
    SET
      first_analysis_completed = true,
      onboarding_step = GREATEST(onboarding_step, 3)
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_auto_update_onboarding ON analyses;
CREATE TRIGGER trigger_auto_update_onboarding
  AFTER INSERT OR UPDATE ON analyses
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_onboarding_progress();

-- Comments for documentation
COMMENT ON COLUMN users.onboarding_completed IS 'Whether user has completed the onboarding flow';
COMMENT ON COLUMN users.onboarding_step IS 'Current step in onboarding (0-5)';
COMMENT ON COLUMN users.onboarding_skipped IS 'Whether user chose to skip onboarding';
COMMENT ON COLUMN users.product_tour_completed IS 'Whether user completed the interactive product tour';
COMMENT ON COLUMN users.features_explored IS 'Array of feature names the user has interacted with';
COMMENT ON TABLE user_feature_interactions IS 'Tracks individual feature interactions for analytics';
