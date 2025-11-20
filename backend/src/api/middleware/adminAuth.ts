import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/config';
import { AuthRequest } from './auth';

const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey
);

/**
 * Middleware to require super admin access
 * Must be used after authenticateToken middleware
 */
export const requireSuperAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
    }

    // Check if user is super admin
    const { data: userData, error } = await supabase
      .from('users')
      .select('is_super_admin')
      .eq('id', req.user.id)
      .single();

    if (error || !userData || !userData.is_super_admin) {
      // Log the access attempt
      await logAdminAction({
        admin_user_id: req.user.id,
        action_type: 'unauthorized_access_attempt',
        action_category: 'security',
        action_details: { path: req.path, method: req.method },
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        success: false,
        error_message: 'Super admin access required'
      });

      return res.status(403).json({
        success: false,
        message: 'Forbidden: Super admin access required',
        timestamp: new Date().toISOString(),
      });
    }

    next();
  } catch (error) {
    console.error('Super admin check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization check failed',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Middleware to require specific admin permission
 * Permissions: 'users', 'billing', 'system', 'analytics', 'content'
 */
export const requireAdminPermission = (permissionType: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          timestamp: new Date().toISOString(),
        });
      }

      // Check if user has the permission
      const hasPermission = await checkAdminPermission(req.user.id, permissionType);

      if (!hasPermission) {
        // Log the access attempt
        await logAdminAction({
          admin_user_id: req.user.id,
          action_type: 'unauthorized_permission_attempt',
          action_category: 'security',
          action_details: {
            path: req.path,
            method: req.method,
            required_permission: permissionType
          },
          ip_address: req.ip,
          user_agent: req.get('user-agent'),
          success: false,
          error_message: `${permissionType} permission required`
        });

        return res.status(403).json({
          success: false,
          message: `Forbidden: ${permissionType} permission required`,
          timestamp: new Date().toISOString(),
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Permission check failed',
        timestamp: new Date().toISOString(),
      });
    }
  };
};

/**
 * Helper function to check if user has admin permission
 */
export const checkAdminPermission = async (
  userId: string,
  permissionType: string
): Promise<boolean> => {
  try {
    // First check if user is super admin (has all permissions)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_super_admin')
      .eq('id', userId)
      .single();

    if (!userError && userData?.is_super_admin) {
      return true;
    }

    // Check specific permission
    const { data: permission, error: permError } = await supabase
      .from('super_admin_permissions')
      .select('*')
      .eq('user_id', userId)
      .eq('permission_type', permissionType)
      .is('revoked_at', null)
      .single();

    return !permError && !!permission;
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
};

/**
 * Helper function to log admin actions
 */
export const logAdminAction = async (params: {
  admin_user_id: string;
  action_type: string;
  action_category: 'user_management' | 'billing' | 'system' | 'content' | 'security';
  target_user_id?: string;
  target_resource_type?: string;
  target_resource_id?: string;
  action_details?: any;
  ip_address?: string;
  user_agent?: string;
  success?: boolean;
  error_message?: string;
}): Promise<void> => {
  try {
    await supabase.from('admin_audit_log').insert({
      admin_user_id: params.admin_user_id,
      action_type: params.action_type,
      action_category: params.action_category,
      target_user_id: params.target_user_id,
      target_resource_type: params.target_resource_type,
      target_resource_id: params.target_resource_id,
      action_details: params.action_details || {},
      ip_address: params.ip_address,
      user_agent: params.user_agent,
      success: params.success !== undefined ? params.success : true,
      error_message: params.error_message,
    });
  } catch (error) {
    // Don't fail the request if logging fails, but log the error
    console.error('Failed to log admin action:', error);
  }
};

/**
 * Middleware wrapper to automatically log successful admin actions
 */
export const withAdminAuditLog = (
  actionType: string,
  actionCategory: 'user_management' | 'billing' | 'system' | 'content' | 'security'
) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to intercept response
    res.json = function (body: any) {
      // Log the action if successful (2xx status code)
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        logAdminAction({
          admin_user_id: req.user.id,
          action_type: actionType,
          action_category: actionCategory,
          target_user_id: req.params.userId || req.body.userId,
          target_resource_type: req.params.resourceType,
          target_resource_id: req.params.resourceId,
          action_details: {
            method: req.method,
            path: req.path,
            params: req.params,
            query: req.query,
          },
          ip_address: req.ip,
          user_agent: req.get('user-agent'),
          success: true,
        }).catch(err => console.error('Audit logging failed:', err));
      }

      return originalJson(body);
    };

    next();
  };
};

/**
 * Get list of admin users
 */
export const getAdminUsers = async () => {
  const { data, error } = await supabase
    .from('active_admin_users')
    .select('*');

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Grant super admin status to a user
 * Must be called by another super admin
 */
export const grantSuperAdmin = async (
  userId: string,
  grantedBy: string
): Promise<void> => {
  // Verify granting user is super admin
  const canGrant = await checkAdminPermission(grantedBy, 'users');
  if (!canGrant) {
    throw new Error('Only super admins can grant super admin status');
  }

  const { error } = await supabase
    .from('users')
    .update({ is_super_admin: true })
    .eq('id', userId);

  if (error) {
    throw error;
  }

  // Log the action
  await logAdminAction({
    admin_user_id: grantedBy,
    action_type: 'grant_super_admin',
    action_category: 'security',
    target_user_id: userId,
    success: true,
  });
};

/**
 * Revoke super admin status from a user
 */
export const revokeSuperAdmin = async (
  userId: string,
  revokedBy: string
): Promise<void> => {
  // Verify revoking user is super admin
  const canRevoke = await checkAdminPermission(revokedBy, 'users');
  if (!canRevoke) {
    throw new Error('Only super admins can revoke super admin status');
  }

  // Don't allow revoking own admin status
  if (userId === revokedBy) {
    throw new Error('Cannot revoke your own super admin status');
  }

  const { error } = await supabase
    .from('users')
    .update({ is_super_admin: false })
    .eq('id', userId);

  if (error) {
    throw error;
  }

  // Log the action
  await logAdminAction({
    admin_user_id: revokedBy,
    action_type: 'revoke_super_admin',
    action_category: 'security',
    target_user_id: userId,
    success: true,
  });
};
