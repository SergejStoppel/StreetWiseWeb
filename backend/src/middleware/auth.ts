import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { User } from '../types';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface AuthRequest extends Request {
  user?: User;
  workspaceId?: string;
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Fetch user details from our database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError) {
      return res.status(401).json({ error: 'User not found in database' });
    }

    req.user = userData;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Middleware to verify workspace access
 */
export const requireWorkspaceAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaceId = req.params.workspaceId || req.body.workspaceId;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace ID required' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user has access to workspace
    const { data: membership, error } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', req.user.id)
      .single();

    if (error || !membership) {
      return res.status(403).json({ error: 'Access denied to workspace' });
    }

    req.workspaceId = workspaceId;
    next();
  } catch (error) {
    console.error('Workspace access middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to require specific workspace role
 */
export const requireWorkspaceRole = (requiredRole: 'owner' | 'admin' | 'member') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = req.params.workspaceId || req.body.workspaceId;
      
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { data: membership, error } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', req.user.id)
        .single();

      if (error || !membership) {
        return res.status(403).json({ error: 'Access denied to workspace' });
      }

      // Check role hierarchy: owner > admin > member
      const roleHierarchy = { owner: 3, admin: 2, member: 1 };
      const userRoleLevel = roleHierarchy[membership.role as keyof typeof roleHierarchy];
      const requiredRoleLevel = roleHierarchy[requiredRole];

      if (userRoleLevel < requiredRoleLevel) {
        return res.status(403).json({ error: `${requiredRole} role required` });
      }

      next();
    } catch (error) {
      console.error('Role check middleware error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};