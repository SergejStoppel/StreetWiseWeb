-- Two-Tier Analysis System: User Quotas and Payments
-- Supports: Guest, Free (3 scans/mo), Paid (10 scans/mo), Tester (unlimited)

-- User quotas table
CREATE TABLE IF NOT EXISTS user_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'paid', 'tester')),
  instant_scans_used INTEGER NOT NULL DEFAULT 0,
  instant_scans_limit INTEGER NOT NULL DEFAULT 3,
  quota_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (date_trunc('month', now() AT TIME ZONE 'UTC') + interval '1 month'),
  deep_analyses_purchased INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add columns to analyses table for tier tracking
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analyses' AND column_name = 'analysis_type') THEN
    ALTER TABLE analyses ADD COLUMN analysis_type TEXT DEFAULT 'instant' CHECK (analysis_type IN ('instant', 'deep'));
    RAISE NOTICE 'Added analysis_type column to analyses';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analyses' AND column_name = 'is_guest') THEN
    ALTER TABLE analyses ADD COLUMN is_guest BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added is_guest column to analyses';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analyses' AND column_name = 'payment_id') THEN
    ALTER TABLE analyses ADD COLUMN payment_id UUID REFERENCES payments(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added payment_id column to analyses';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analyses' AND column_name = 'expires_at') THEN
    ALTER TABLE analyses ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added expires_at column to analyses';
  END IF;
END $$;

-- Index for finding cached results by website_id and user
CREATE INDEX IF NOT EXISTS idx_analyses_website_user ON analyses(website_id, user_id);

-- Index for quota lookups
CREATE INDEX IF NOT EXISTS idx_user_quotas_user_id ON user_quotas(user_id);

-- Index for payment lookups
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_analysis_id ON payments(analysis_id);

-- RLS policies for user_quotas
ALTER TABLE user_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quota" ON user_quotas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own quota" ON user_quotas
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- Function to check and reset quota if needed
CREATE OR REPLACE FUNCTION check_and_reset_quota(p_user_id UUID)
RETURNS user_quotas AS $$
DECLARE
  v_quota user_quotas;
BEGIN
  SELECT * INTO v_quota FROM user_quotas WHERE user_id = p_user_id;

  IF v_quota IS NULL THEN
    INSERT INTO user_quotas (user_id, tier, instant_scans_limit)
    VALUES (p_user_id, 'free', 3)
    RETURNING * INTO v_quota;
  ELSIF v_quota.quota_reset_at <= now() THEN
    UPDATE user_quotas
    SET instant_scans_used = 0,
        quota_reset_at = date_trunc('month', now() AT TIME ZONE 'UTC') + interval '1 month',
        updated_at = now()
    WHERE user_id = p_user_id
    RETURNING * INTO v_quota;
  END IF;

  RETURN v_quota;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can perform instant scan
CREATE OR REPLACE FUNCTION can_perform_instant_scan(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_quota user_quotas;
BEGIN
  v_quota := check_and_reset_quota(p_user_id);

  IF v_quota.tier = 'tester' THEN
    RETURN true;
  END IF;

  RETURN v_quota.instant_scans_used < v_quota.instant_scans_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment scan usage
CREATE OR REPLACE FUNCTION increment_scan_usage(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_quota user_quotas;
BEGIN
  v_quota := check_and_reset_quota(p_user_id);

  IF v_quota.tier = 'tester' THEN
    RETURN true;
  END IF;

  IF v_quota.instant_scans_used >= v_quota.instant_scans_limit THEN
    RETURN false;
  END IF;

  UPDATE user_quotas
  SET instant_scans_used = instant_scans_used + 1,
      updated_at = now()
  WHERE user_id = p_user_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to upgrade user to paid tier
CREATE OR REPLACE FUNCTION upgrade_to_paid_tier(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_quotas (user_id, tier, instant_scans_limit)
  VALUES (p_user_id, 'paid', 10)
  ON CONFLICT (user_id)
  DO UPDATE SET tier = 'paid', instant_scans_limit = 10, updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set user as tester (admin only)
CREATE OR REPLACE FUNCTION set_user_as_tester(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_quotas (user_id, tier, instant_scans_limit)
  VALUES (p_user_id, 'tester', 999999)
  ON CONFLICT (user_id)
  DO UPDATE SET tier = 'tester', instant_scans_limit = 999999, updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
