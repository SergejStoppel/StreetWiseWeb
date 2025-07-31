import { Router, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticateToken, requireWorkspaceAccess, requireWorkspaceRole, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Validation schemas
const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(100, 'Name too long'),
});

const updateWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(100, 'Name too long'),
});

const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.enum(['admin', 'member']).default('member'),
});

const updateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'member']),
});

/**
 * GET /api/workspaces
 * Get user's workspaces
 */
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { data: workspaces, error } = await supabase
      .from('workspace_members')
      .select(`
        workspace_id,
        role,
        created_at,
        workspaces:workspace_id (
          id,
          name,
          created_at,
          updated_at,
          owner_id,
          users:owner_id (
            full_name,
            email
          )
        )
      `)
      .eq('user_id', req.user.id);

    if (error) {
      console.error('Fetch workspaces error:', error);
      return res.status(500).json({ error: 'Failed to fetch workspaces' });
    }

    res.json({ workspaces });
  } catch (error) {
    console.error('Get workspaces error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/workspaces
 * Create a new workspace
 */
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { name } = createWorkspaceSchema.parse(req.body);
    
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Use the database function to create workspace with owner
    const { data: result, error } = await supabase
      .rpc('create_workspace_with_owner', {
        owner_user_id: req.user.id,
        workspace_name: name,
      });

    if (error) {
      console.error('Create workspace error:', error);
      return res.status(500).json({ error: 'Failed to create workspace' });
    }

    // Fetch the created workspace details
    const { data: workspace, error: fetchError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', result)
      .single();

    if (fetchError) {
      console.error('Fetch created workspace error:', fetchError);
      return res.status(500).json({ error: 'Workspace created but failed to fetch details' });
    }

    res.status(201).json({
      message: 'Workspace created successfully',
      workspace,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Create workspace error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/workspaces/:workspaceId
 * Get workspace details
 */
router.get('/:workspaceId', authenticateToken, requireWorkspaceAccess, async (req: AuthRequest, res: Response) => {
  try {
    const { workspaceId } = req.params;

    const { data: workspace, error } = await supabase
      .from('workspaces')
      .select(`
        *,
        owner:owner_id (
          id,
          full_name,
          email
        ),
        workspace_members (
          user_id,
          role,
          created_at,
          users:user_id (
            id,
            full_name,
            email
          )
        ),
        subscriptions (
          id,
          status,
          current_period_end,
          plans:plan_id (
            name,
            price_monthly,
            price_yearly
          )
        )
      `)
      .eq('id', workspaceId)
      .single();

    if (error) {
      console.error('Fetch workspace error:', error);
      return res.status(500).json({ error: 'Failed to fetch workspace' });
    }

    res.json({ workspace });
  } catch (error) {
    console.error('Get workspace error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/workspaces/:workspaceId
 * Update workspace
 */
router.put('/:workspaceId', authenticateToken, requireWorkspaceRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const { name } = updateWorkspaceSchema.parse(req.body);

    const { data: workspace, error } = await supabase
      .from('workspaces')
      .update({ name })
      .eq('id', workspaceId)
      .select()
      .single();

    if (error) {
      console.error('Update workspace error:', error);
      return res.status(500).json({ error: 'Failed to update workspace' });
    }

    res.json({
      message: 'Workspace updated successfully',
      workspace,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Update workspace error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/workspaces/:workspaceId
 * Delete workspace (owner only)
 */
router.delete('/:workspaceId', authenticateToken, requireWorkspaceRole('owner'), async (req: AuthRequest, res: Response) => {
  try {
    const { workspaceId } = req.params;

    const { error } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', workspaceId);

    if (error) {
      console.error('Delete workspace error:', error);
      return res.status(500).json({ error: 'Failed to delete workspace' });
    }

    res.json({ message: 'Workspace deleted successfully' });

  } catch (error) {
    console.error('Delete workspace error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/workspaces/:workspaceId/members
 * Invite member to workspace
 */
router.post('/:workspaceId/members', authenticateToken, requireWorkspaceRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const { email, role } = inviteMemberSchema.parse(req.body);

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return res.status(400).json({ error: 'User with this email not found' });
    }

    // Check if user is already a member
    const { data: existingMember, error: memberError } = await supabase
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member of this workspace' });
    }

    // Add member to workspace
    const { data: member, error: addError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspaceId,
        user_id: user.id,
        role,
      })
      .select(`
        *,
        users:user_id (
          id,
          full_name,
          email
        )
      `)
      .single();

    if (addError) {
      console.error('Add member error:', addError);
      return res.status(500).json({ error: 'Failed to add member' });
    }

    res.status(201).json({
      message: 'Member added successfully',
      member,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Invite member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/workspaces/:workspaceId/members/:userId
 * Update member role
 */
router.put('/:workspaceId/members/:userId', authenticateToken, requireWorkspaceRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { workspaceId, userId } = req.params;
    const { role } = updateMemberRoleSchema.parse(req.body);

    // Prevent changing owner role
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('owner_id')
      .eq('id', workspaceId)
      .single();

    if (workspaceError) {
      return res.status(500).json({ error: 'Failed to verify workspace' });
    }

    if (workspace.owner_id === userId) {
      return res.status(400).json({ error: 'Cannot change owner role' });
    }

    const { data: member, error } = await supabase
      .from('workspace_members')
      .update({ role })
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .select(`
        *,
        users:user_id (
          id,
          full_name,
          email
        )
      `)
      .single();

    if (error) {
      console.error('Update member role error:', error);
      return res.status(500).json({ error: 'Failed to update member role' });
    }

    res.json({
      message: 'Member role updated successfully',
      member,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Update member role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/workspaces/:workspaceId/members/:userId
 * Remove member from workspace
 */
router.delete('/:workspaceId/members/:userId', authenticateToken, requireWorkspaceRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { workspaceId, userId } = req.params;

    // Prevent removing owner
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('owner_id')
      .eq('id', workspaceId)
      .single();

    if (workspaceError) {
      return res.status(500).json({ error: 'Failed to verify workspace' });
    }

    if (workspace.owner_id === userId) {
      return res.status(400).json({ error: 'Cannot remove workspace owner' });
    }

    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId);

    if (error) {
      console.error('Remove member error:', error);
      return res.status(500).json({ error: 'Failed to remove member' });
    }

    res.json({ message: 'Member removed successfully' });

  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/workspaces/:workspaceId/leave
 * Leave workspace (non-owners)
 */
router.post('/:workspaceId/leave', authenticateToken, requireWorkspaceAccess, async (req: AuthRequest, res: Response) => {
  try {
    const { workspaceId } = req.params;
    
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Prevent owner from leaving
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('owner_id')
      .eq('id', workspaceId)
      .single();

    if (workspaceError) {
      return res.status(500).json({ error: 'Failed to verify workspace' });
    }

    if (workspace.owner_id === req.user.id) {
      return res.status(400).json({ error: 'Workspace owner cannot leave. Transfer ownership or delete the workspace.' });
    }

    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_id', req.user.id);

    if (error) {
      console.error('Leave workspace error:', error);
      return res.status(500).json({ error: 'Failed to leave workspace' });
    }

    res.json({ message: 'Left workspace successfully' });

  } catch (error) {
    console.error('Leave workspace error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;