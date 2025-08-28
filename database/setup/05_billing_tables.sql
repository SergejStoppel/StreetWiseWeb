-- Billing Tables
-- Subscriptions, one-time purchases, and plan management

-- Subscription plans available
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL, -- e.g., 'Free', 'Pro', 'Enterprise'
  price_monthly INT, -- Price in cents
  price_yearly INT, -- Price in cents
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Features available per plan
CREATE TABLE plan_features (
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
  feature_key TEXT, -- e.g., 'DETAILED_REPORTS', 'API_ACCESS', 'AUTO_FIXES'
  PRIMARY KEY (plan_id, feature_key)
);

-- Active subscriptions per workspace
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID UNIQUE NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  stripe_subscription_id TEXT UNIQUE,
  status subscription_status NOT NULL,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- One-time purchases (e.g., report credits)
CREATE TABLE one_time_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL, -- e.g., 'Detailed Report Credit'
  amount INT NOT NULL, -- Amount in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  status purchase_status NOT NULL,
  stripe_charge_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Report credits balance per workspace
CREATE TABLE report_credits (
  workspace_id UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  balance INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_subscriptions_workspace_id ON subscriptions(workspace_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_one_time_purchases_workspace_id ON one_time_purchases(workspace_id);
CREATE INDEX idx_one_time_purchases_user_id ON one_time_purchases(user_id);
CREATE INDEX idx_one_time_purchases_status ON one_time_purchases(status);