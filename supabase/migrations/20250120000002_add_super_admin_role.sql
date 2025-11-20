-- Migration: Add Super Admin Role
-- Description: Adds platform-wide admin role system with permissions and audit logging
-- Author: Phase 4 Implementation
-- Date: 2025-01-20

-- Add super admin flag to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- Create table for granular admin permissions
CREATE TABLE IF NOT EXISTS super_admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permission_type TEXT NOT NULL CHECK (permission_type IN ('users', 'billing', 'system', 'analytics', 'content')),
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  notes TEXT,
  UNIQUE(user_id, permission_type)
);

-- Create comprehensive admin audit log
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  action_category TEXT CHECK (action_category IN ('user_management', 'billing', 'system', 'content', 'security')),
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_resource_type TEXT,
  target_resource_id UUID,
  action_details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_super_admin ON users(is_super_admin) WHERE is_super_admin = true;
CREATE INDEX IF NOT EXISTS idx_super_admin_permissions_user_id ON super_admin_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_super_admin_permissions_type ON super_admin_permissions(permission_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_user ON admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target_user ON admin_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action_type ON admin_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_category ON admin_audit_log(action_category);

-- Function to grant admin permission
CREATE OR REPLACE FUNCTION grant_admin_permission(
  p_user_id UUID,
  p_permission_type TEXT,
  p_granted_by UUID,
  p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_permission_id UUID;
BEGIN
  -- Check if granting user is super admin
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_granted_by AND is_super_admin = true) THEN
    RAISE EXCEPTION 'Only super admins can grant permissions';
  END IF;

  -- Insert or update permission
  INSERT INTO super_admin_permissions (user_id, permission_type, granted_by, notes)
  VALUES (p_user_id, p_permission_type, p_granted_by, p_notes)
  ON CONFLICT (user_id, permission_type)
  DO UPDATE SET
    granted_by = p_granted_by,
    granted_at = now(),
    revoked_at = NULL,
    notes = p_notes
  RETURNING id INTO v_permission_id;

  -- Log the action
  INSERT INTO admin_audit_log (
    admin_user_id,
    action_type,
    action_category,
    target_user_id,
    action_details
  ) VALUES (
    p_granted_by,
    'grant_permission',
    'security',
    p_user_id,
    jsonb_build_object('permission_type', p_permission_type)
  );

  RETURN v_permission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke admin permission
CREATE OR REPLACE FUNCTION revoke_admin_permission(
  p_user_id UUID,
  p_permission_type TEXT,
  p_revoked_by UUID
) RETURNS void AS $$
BEGIN
  -- Check if revoking user is super admin
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_revoked_by AND is_super_admin = true) THEN
    RAISE EXCEPTION 'Only super admins can revoke permissions';
  END IF;

  -- Update permission
  UPDATE super_admin_permissions
  SET revoked_at = now()
  WHERE user_id = p_user_id AND permission_type = p_permission_type;

  -- Log the action
  INSERT INTO admin_audit_log (
    admin_user_id,
    action_type,
    action_category,
    target_user_id,
    action_details
  ) VALUES (
    p_revoked_by,
    'revoke_permission',
    'security',
    p_user_id,
    jsonb_build_object('permission_type', p_permission_type)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has admin permission
CREATE OR REPLACE FUNCTION has_admin_permission(
  p_user_id UUID,
  p_permission_type TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Super admins have all permissions
  IF EXISTS (SELECT 1 FROM users WHERE id = p_user_id AND is_super_admin = true) THEN
    RETURN true;
  END IF;

  -- Check specific permission
  RETURN EXISTS (
    SELECT 1
    FROM super_admin_permissions
    WHERE user_id = p_user_id
      AND permission_type = p_permission_type
      AND revoked_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log admin action
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_user_id UUID,
  p_action_type TEXT,
  p_action_category TEXT,
  p_target_user_id UUID DEFAULT NULL,
  p_target_resource_type TEXT DEFAULT NULL,
  p_target_resource_id UUID DEFAULT NULL,
  p_action_details JSONB DEFAULT '{}'::jsonb,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO admin_audit_log (
    admin_user_id,
    action_type,
    action_category,
    target_user_id,
    target_resource_type,
    target_resource_id,
    action_details,
    ip_address,
    user_agent,
    success,
    error_message
  ) VALUES (
    p_admin_user_id,
    p_action_type,
    p_action_category,
    p_target_user_id,
    p_target_resource_type,
    p_target_resource_id,
    p_action_details,
    p_ip_address,
    p_user_agent,
    p_success,
    p_error_message
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for active admin users
CREATE OR REPLACE VIEW active_admin_users AS
SELECT
  u.id,
  u.email,
  u.full_name,
  u.is_super_admin,
  u.created_at,
  array_agg(
    CASE WHEN sap.revoked_at IS NULL
    THEN sap.permission_type
    ELSE NULL END
  ) FILTER (WHERE sap.permission_type IS NOT NULL) AS permissions
FROM users u
LEFT JOIN super_admin_permissions sap ON u.id = sap.user_id
WHERE u.is_super_admin = true OR EXISTS (
  SELECT 1 FROM super_admin_permissions
  WHERE user_id = u.id AND revoked_at IS NULL
)
GROUP BY u.id, u.email, u.full_name, u.is_super_admin, u.created_at;

-- RLS policies for admin tables
ALTER TABLE super_admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only super admins can view permissions
CREATE POLICY "Super admins can view all permissions"
  ON super_admin_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = true)
  );

-- Only super admins can modify permissions
CREATE POLICY "Super admins can modify permissions"
  ON super_admin_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = true)
  );

-- Admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON admin_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = true)
  );

-- Only system can insert audit logs (through functions)
CREATE POLICY "System can insert audit logs"
  ON admin_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Comments for documentation
COMMENT ON COLUMN users.is_super_admin IS 'Platform-wide admin with full access to admin dashboard';
COMMENT ON TABLE super_admin_permissions IS 'Granular permissions for admin users';
COMMENT ON TABLE admin_audit_log IS 'Comprehensive audit trail of all admin actions';
COMMENT ON FUNCTION has_admin_permission IS 'Check if user has specific admin permission';
COMMENT ON FUNCTION log_admin_action IS 'Record admin action in audit log';
