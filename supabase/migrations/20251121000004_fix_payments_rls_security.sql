-- Fix payments RLS policy: Remove unauthorized access to NULL user_id records

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;

-- Recreate with strict user ownership only
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);
