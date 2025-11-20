import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/config';
import { authenticateToken, AuthRequest } from '../../middleware/auth';
import { requireSuperAdmin, logAdminAction, grantSuperAdmin, revokeSuperAdmin } from '../../middleware/adminAuth';

const router = Router();
const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey
);

// All routes require authentication and super admin access
router.use(authenticateToken);
router.use(requireSuperAdmin);

/**
 * GET /api/admin/users
 * Get list of all users with pagination and filters
 */
router.get('/', async (req: AuthRequest, res) => {
  try {
    const {
      page = '1',
      limit = '20',
      search = '',
      sort_by = 'created_at',
      sort_order = 'desc',
      is_super_admin,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build query
    let query = supabase
      .from('users')
      .select('id, email, full_name, avatar_url, is_super_admin, created_at, onboarding_completed', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    if (is_super_admin !== undefined) {
      query = query.eq('is_super_admin', is_super_admin === 'true');
    }

    // Apply sorting
    query = query.order(sort_by as string, { ascending: sort_order === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limitNum - 1);

    const { data: users, error, count } = await query;

    if (error) {
      throw error;
    }

    // Get workspace and analysis counts for each user
    const usersWithStats = await Promise.all(
      (users || []).map(async (user) => {
        // Get workspace count
        const { count: workspaceCount } = await supabase
          .from('workspaces')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', user.id);

        // Get analysis count
        const { count: analysisCount } = await supabase
          .from('analyses')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Get subscription info (if billing table exists)
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('status, plan_id, current_period_end')
          .eq('user_id', user.id)
          .single();

        return {
          ...user,
          workspace_count: workspaceCount || 0,
          analysis_count: analysisCount || 0,
          subscription: subscription || null,
        };
      })
    );

    // Log the action
    await logAdminAction({
      admin_user_id: req.user!.id,
      action_type: 'list_users',
      action_category: 'user_management',
      action_details: { page: pageNum, limit: limitNum, search },
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    });

    return res.json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count || 0,
          pages: Math.ceil((count || 0) / limitNum),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/admin/users/:userId
 * Get detailed information about a specific user
 */
router.get('/:userId', async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString(),
      });
    }

    // Get workspaces
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('*')
      .eq('owner_id', userId);

    // Get recent analyses
    const { data: analyses } = await supabase
      .from('analyses')
      .select('id, status, overall_score, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get feature interactions
    const { data: interactions } = await supabase
      .from('user_feature_interactions')
      .select('feature_name, interaction_type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    // Log the action
    await logAdminAction({
      admin_user_id: req.user!.id,
      action_type: 'view_user_details',
      action_category: 'user_management',
      target_user_id: userId,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    });

    return res.json({
      success: true,
      data: {
        user,
        workspaces: workspaces || [],
        recent_analyses: analyses || [],
        subscription: subscription || null,
        recent_interactions: interactions || [],
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user details',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * PATCH /api/admin/users/:userId
 * Update user information
 */
router.patch('/:userId', async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const { full_name, email, is_super_admin } = req.body;

    const updates: any = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (email !== undefined) updates.email = email;
    if (is_super_admin !== undefined) updates.is_super_admin = is_super_admin;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
        timestamp: new Date().toISOString(),
      });
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log the action
    await logAdminAction({
      admin_user_id: req.user!.id,
      action_type: 'update_user',
      action_category: 'user_management',
      target_user_id: userId,
      action_details: { updates },
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    });

    return res.json({
      success: true,
      data: data,
      message: 'User updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/admin/users/:userId/grant-admin
 * Grant super admin privileges to a user
 */
router.post('/:userId/grant-admin', async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;

    await grantSuperAdmin(userId, req.user!.id);

    return res.json({
      success: true,
      message: 'Super admin privileges granted',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error granting admin privileges:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to grant admin privileges',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/admin/users/:userId/revoke-admin
 * Revoke super admin privileges from a user
 */
router.post('/:userId/revoke-admin', async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;

    await revokeSuperAdmin(userId, req.user!.id);

    return res.json({
      success: true,
      message: 'Super admin privileges revoked',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error revoking admin privileges:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to revoke admin privileges',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * DELETE /api/admin/users/:userId
 * Delete a user (soft delete or hard delete)
 */
router.delete('/:userId', async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const { hard_delete = false } = req.query;

    // Don't allow deleting own account
    if (userId === req.user!.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
        timestamp: new Date().toISOString(),
      });
    }

    if (hard_delete === 'true') {
      // Hard delete - remove from database
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        throw error;
      }

      // Log the action
      await logAdminAction({
        admin_user_id: req.user!.id,
        action_type: 'hard_delete_user',
        action_category: 'user_management',
        target_user_id: userId,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
      });

      return res.json({
        success: true,
        message: 'User permanently deleted',
        timestamp: new Date().toISOString(),
      });
    } else {
      // Soft delete - disable account
      // This requires adding a deleted_at or is_deleted field
      // For now, we'll return an error
      return res.status(501).json({
        success: false,
        message: 'Soft delete not yet implemented. Use hard_delete=true to permanently delete.',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/admin/users/:userId/impersonate
 * Generate an impersonation token for a user (for support purposes)
 */
router.post('/:userId/impersonate', async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;

    // Don't allow impersonating another admin
    const { data: targetUser } = await supabase
      .from('users')
      .select('is_super_admin')
      .eq('id', userId)
      .single();

    if (targetUser?.is_super_admin) {
      return res.status(403).json({
        success: false,
        message: 'Cannot impersonate another admin',
        timestamp: new Date().toISOString(),
      });
    }

    // Log the action (important for security)
    await logAdminAction({
      admin_user_id: req.user!.id,
      action_type: 'impersonate_user',
      action_category: 'security',
      target_user_id: userId,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    });

    // Note: Actual impersonation implementation depends on your auth strategy
    // This is a placeholder - you would typically generate a special session token
    return res.json({
      success: true,
      message: 'Impersonation feature requires additional implementation',
      data: {
        user_id: userId,
        // Add impersonation token here
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error impersonating user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to impersonate user',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
