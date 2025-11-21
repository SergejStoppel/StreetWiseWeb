-- Fix RLS policies: Add missing INSERT policies and handle NULL user_id

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own quota" ON user_quotas;
DROP POLICY IF EXISTS "Users can update their own quota" ON user_quotas;
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;

-- user_quotas policies
CREATE POLICY "Users can view their own quota" ON user_quotas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quota" ON user_quotas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quota" ON user_quotas
  FOR UPDATE USING (auth.uid() = user_id);

-- payments policies (handle NULL user_id for system payments)
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own payments" ON payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
