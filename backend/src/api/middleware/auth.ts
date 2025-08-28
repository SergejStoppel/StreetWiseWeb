import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { User } from '@/types';
import { config } from '@/config';

const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey
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
      return res.status(401).json({ 
        success: false,
        message: 'Access token required',
        timestamp: new Date().toISOString(),
      });
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid or expired token',
        timestamp: new Date().toISOString(),
      });
    }

    // Fetch user details from our database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError) {
      // If user doesn't exist in our database, create them
      if (userError.code === 'PGRST116') {
        console.log(`Creating missing user record for ${user.email}`);
        
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name || '',
          })
          .select()
          .single();

        if (createError) {
          return res.status(500).json({ 
            success: false,
            message: 'Failed to create user record',
            timestamp: new Date().toISOString(),
          });
        }

        req.user = newUser;
      } else {
        return res.status(401).json({ 
          success: false,
          message: 'User not found in database',
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      req.user = userData;
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ 
      success: false,
      message: 'Authentication failed',
      timestamp: new Date().toISOString(),
    });
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
      return res.status(400).json({ 
        success: false,
        message: 'Workspace ID required',
        timestamp: new Date().toISOString(),
      });
    }

    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
    }

    // Check if user has access to workspace
    const { data: membership, error } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', req.user.id)
      .single();

    if (error || !membership) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied to workspace',
        timestamp: new Date().toISOString(),
      });
    }

    req.workspaceId = workspaceId;
    next();
  } catch (error) {
    console.error('Workspace access middleware error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
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
        return res.status(401).json({ 
          success: false,
          message: 'Authentication required',
          timestamp: new Date().toISOString(),
        });
      }

      const { data: membership, error } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', req.user.id)
        .single();

      if (error || !membership) {
        return res.status(403).json({ 
          success: false,
          message: 'Access denied to workspace',
          timestamp: new Date().toISOString(),
        });
      }

      // Check role hierarchy: owner > admin > member
      const roleHierarchy = { owner: 3, admin: 2, member: 1 };
      const userRoleLevel = roleHierarchy[membership.role as keyof typeof roleHierarchy];
      const requiredRoleLevel = roleHierarchy[requiredRole];

      if (userRoleLevel < requiredRoleLevel) {
        return res.status(403).json({ 
          success: false,
          message: `${requiredRole} role required`,
          timestamp: new Date().toISOString(),
        });
      }

      next();
    } catch (error) {
      console.error('Role check middleware error:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    }
  };
};