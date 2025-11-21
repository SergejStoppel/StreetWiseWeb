-- ================================================
-- User Quotas and Payments System
-- ================================================
-- Implements two-tier analysis system:
-- - Instant Scan: Free (limited) or included with paid
-- - Deep Analysis: $49 per scan
-- ================================================

-- ================================
-- USER QUOTAS TABLE
-- ================================
-- Tracks monthly scan limits per user
-- Tiers: 'free' (3 scans), 'paid' (10 scans), 'tester' (unlimited)

CREATE TABLE IF NOT EXISTS user_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Account tier: 'free', 'paid', 'tester'
  -- 'tester' bypasses all limits (for internal testing)
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'paid', 'tester')),

  -- Instant scan quota
  instant_scans_used INTEGER NOT NULL DEFAULT 0,
  instant_scans_limit INTEGER NOT NULL DEFAULT 3, -- 3 for free, 10 for paid, unlimited for tester

  -- When the monthly quota resets
  quota_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (date_trunc('month', now() AT TIME ZONE 'UTC') + interval '1 month'),

  -- Lifetime stats
  total_instant_scans INTEGER NOT NULL DEFAULT 0,
  total_deep_analyses INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  UNIQUE(user_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_quotas_user_id ON user_quotas(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quotas_tier ON user_quotas(tier);

-- ================================
-- PAYMENTS TABLE
-- ================================
-- Tracks all payment transactions

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Link to the analysis this payment is for
  analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL,

  -- Payment details
  amount_cents INTEGER NOT NULL, -- 4900 = $49.00
  currency TEXT NOT NULL DEFAULT 'usd' CHECK (currency IN ('usd', 'eur')),

  -- Stripe integration (will be populated when Stripe is added)
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,

  -- Payment status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'mocked')),

  -- For mocked payments during development
  is_mocked BOOLEAN DEFAULT false,

  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_analysis_id ON payments(analysis_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session ON payments(stripe_checkout_session_id);

-- ================================
-- UPDATE ANALYSES TABLE
-- ================================
-- Add columns for analysis type and caching

DO $$
BEGIN
  -- Add analysis_type column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'analyses' AND column_name = 'analysis_type') THEN
    ALTER TABLE analyses ADD COLUMN analysis_type TEXT NOT NULL DEFAULT 'instant'
      CHECK (analysis_type IN ('instant', 'deep'));
    RAISE NOTICE 'Added analysis_type column to analyses';
  END IF;

  -- Add is_guest column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'analyses' AND column_name = 'is_guest') THEN
    ALTER TABLE analyses ADD COLUMN is_guest BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added is_guest column to analyses';
  END IF;

  -- Add payment_id reference if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'analyses' AND column_name = 'payment_id') THEN
    ALTER TABLE analyses ADD COLUMN payment_id UUID REFERENCES payments(id);
    RAISE NOTICE 'Added payment_id column to analyses';
  END IF;

  -- Add expires_at for guest analyses (auto-cleanup)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'analyses' AND column_name = 'expires_at') THEN
    ALTER TABLE analyses ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added expires_at column to analyses';
  END IF;
END $$;

-- Index for finding cached results by URL and user
CREATE INDEX IF NOT EXISTS idx_analyses_url_user ON analyses(url, user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_type ON analyses(analysis_type);
CREATE INDEX IF NOT EXISTS idx_analyses_expires ON analyses(expires_at) WHERE expires_at IS NOT NULL;

-- ================================
-- HELPER FUNCTIONS
-- ================================

-- Function to check and reset quota if needed
CREATE OR REPLACE FUNCTION check_and_reset_quota(p_user_id UUID)
RETURNS user_quotas AS $$
DECLARE
  v_quota user_quotas;
BEGIN
  SELECT * INTO v_quota FROM user_quotas WHERE user_id = p_user_id;

  -- If no quota record exists, create one
  IF v_quota IS NULL THEN
    INSERT INTO user_quotas (user_id) VALUES (p_user_id)
    RETURNING * INTO v_quota;
  END IF;

  -- Reset quota if past reset date
  IF v_quota.quota_reset_at <= now() THEN
    UPDATE user_quotas
    SET
      instant_scans_used = 0,
      quota_reset_at = date_trunc('month', now() AT TIME ZONE 'UTC') + interval '1 month',
      updated_at = now()
    WHERE user_id = p_user_id
    RETURNING * INTO v_quota;
  END IF;

  RETURN v_quota;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can perform instant scan
CREATE OR REPLACE FUNCTION can_perform_instant_scan(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_quota user_quotas;
BEGIN
  v_quota := check_and_reset_quota(p_user_id);

  -- Testers have unlimited scans
  IF v_quota.tier = 'tester' THEN
    RETURN true;
  END IF;

  -- Check against limit
  RETURN v_quota.instant_scans_used < v_quota.instant_scans_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to increment scan usage
CREATE OR REPLACE FUNCTION increment_scan_usage(p_user_id UUID)
RETURNS user_quotas AS $$
DECLARE
  v_quota user_quotas;
BEGIN
  v_quota := check_and_reset_quota(p_user_id);

  -- Don't increment for testers (optional, for accurate tracking you might want to)
  UPDATE user_quotas
  SET
    instant_scans_used = instant_scans_used + 1,
    total_instant_scans = total_instant_scans + 1,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING * INTO v_quota;

  RETURN v_quota;
END;
$$ LANGUAGE plpgsql;

-- Function to upgrade user to paid tier
CREATE OR REPLACE FUNCTION upgrade_to_paid_tier(p_user_id UUID)
RETURNS user_quotas AS $$
DECLARE
  v_quota user_quotas;
BEGIN
  UPDATE user_quotas
  SET
    tier = 'paid',
    instant_scans_limit = 10,
    total_deep_analyses = total_deep_analyses + 1,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING * INTO v_quota;

  -- If no record existed, create one with paid tier
  IF v_quota IS NULL THEN
    INSERT INTO user_quotas (user_id, tier, instant_scans_limit)
    VALUES (p_user_id, 'paid', 10)
    RETURNING * INTO v_quota;
  END IF;

  RETURN v_quota;
END;
$$ LANGUAGE plpgsql;

-- Function to set user as tester (admin only)
CREATE OR REPLACE FUNCTION set_user_as_tester(p_user_id UUID)
RETURNS user_quotas AS $$
DECLARE
  v_quota user_quotas;
BEGIN
  -- Upsert tester status
  INSERT INTO user_quotas (user_id, tier, instant_scans_limit)
  VALUES (p_user_id, 'tester', 999999)
  ON CONFLICT (user_id)
  DO UPDATE SET
    tier = 'tester',
    instant_scans_limit = 999999,
    updated_at = now()
  RETURNING * INTO v_quota;

  RETURN v_quota;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- ROW LEVEL SECURITY
-- ================================

ALTER TABLE user_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users can only see their own quota
CREATE POLICY "Users can view own quota" ON user_quotas
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own payments
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can do everything (for backend)
CREATE POLICY "Service role full access to quotas" ON user_quotas
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to payments" ON payments
  FOR ALL USING (auth.role() = 'service_role');

-- ================================
-- TRIGGERS
-- ================================

-- Auto-create quota record when user signs up
CREATE OR REPLACE FUNCTION create_quota_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_quotas (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_quota') THEN
    CREATE TRIGGER on_auth_user_created_quota
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION create_quota_on_signup();
  END IF;
END $$;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_quotas_updated_at
  BEFORE UPDATE ON user_quotas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ================================
-- COMMENTS
-- ================================

COMMENT ON TABLE user_quotas IS 'Tracks user scan quotas and tier status';
COMMENT ON TABLE payments IS 'Tracks all payment transactions for deep analyses';
COMMENT ON COLUMN user_quotas.tier IS 'Account tier: free (3 scans/mo), paid (10 scans/mo), tester (unlimited)';
COMMENT ON COLUMN analyses.analysis_type IS 'Type of analysis: instant (free preview) or deep (paid full analysis)';
