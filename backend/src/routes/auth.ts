import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Validation schemas
const signUpSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(1, 'Full name is required').optional(),
});

const signInSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const updatePasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

const updateProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').optional(),
  email: z.string().email('Invalid email format').optional(),
});

/**
 * POST /api/auth/signup
 * Register a new user account
 */
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName } = signUpSchema.parse(req.body);

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ 
        error: 'An account with this email already exists' 
      });
    }

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Require email confirmation
      user_metadata: {
        full_name: fullName,
      }
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      return res.status(400).json({ 
        error: authError.message || 'Failed to create account' 
      });
    }

    if (!authData.user) {
      return res.status(400).json({ error: 'Failed to create user' });
    }

    // Insert user into our users table
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email!,
        full_name: fullName || null,
      });

    if (insertError) {
      console.error('Database insert error:', insertError);
      // Try to clean up the auth user if database insert fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ error: 'Failed to create user profile' });
    }

    res.status(201).json({
      message: 'Account created successfully. Please check your email to confirm your account.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        fullName: fullName,
        emailConfirmed: false,
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/signin
 * Sign in user
 */
router.post('/signin', async (req: Request, res: Response) => {
  try {
    const { email, password } = signInSchema.parse(req.body);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      if (authError.message.includes('Invalid login credentials')) {
        return res.status(401).json({ 
          error: 'Invalid email or password' 
        });
      }
      if (authError.message.includes('Email not confirmed')) {
        return res.status(401).json({ 
          error: 'Please confirm your email before signing in' 
        });
      }
      return res.status(401).json({ 
        error: authError.message || 'Sign in failed' 
      });
    }

    if (!authData.user || !authData.session) {
      return res.status(401).json({ error: 'Sign in failed' });
    }

    // Get user profile from our database
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }

    // Get user's workspaces
    const { data: workspaces, error: workspaceError } = await supabase
      .from('workspace_members')
      .select(`
        workspace_id,
        role,
        workspaces:workspace_id (
          id,
          name,
          created_at
        )
      `)
      .eq('user_id', authData.user.id);

    if (workspaceError) {
      console.error('Workspace fetch error:', workspaceError);
    }

    res.json({
      message: 'Signed in successfully',
      user: userProfile,
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at,
      },
      workspaces: workspaces || [],
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/signout
 * Sign out user
 */
router.post('/signout', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (token) {
      const { error } = await supabase.auth.admin.signOut(token);
      if (error) {
        console.error('Signout error:', error);
      }
    }

    res.json({ message: 'Signed out successfully' });
  } catch (error) {
    console.error('Signout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/forgot-password
 * Send password reset email
 */
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = resetPasswordSchema.parse(req.body);

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    // Always return success to prevent email enumeration
    if (!user || userError) {
      return res.json({ 
        message: 'If an account with that email exists, we have sent a password reset link.' 
      });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/auth/reset-password`,
    });

    if (error) {
      console.error('Password reset error:', error);
    }

    res.json({ 
      message: 'If an account with that email exists, we have sent a password reset link.' 
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset user password with reset token
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { newPassword } = updatePasswordSchema.parse(req.body);
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return res.status(400).json({ error: 'Reset token required' });
    }

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      return res.status(400).json({ 
        error: error.message || 'Failed to reset password' 
      });
    }

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get user's workspaces
    const { data: workspaces, error: workspaceError } = await supabase
      .from('workspace_members')
      .select(`
        workspace_id,
        role,
        workspaces:workspace_id (
          id,
          name,
          created_at
        )
      `)
      .eq('user_id', req.user.id);

    if (workspaceError) {
      console.error('Workspace fetch error:', workspaceError);
    }

    res.json({
      user: req.user,
      workspaces: workspaces || [],
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const updates = updateProfileSchema.parse(req.body);
    
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Update auth metadata if fullName is being updated
    if (updates.fullName) {
      const { error: authError } = await supabase.auth.admin.updateUserById(
        req.user.id,
        { user_metadata: { full_name: updates.fullName } }
      );

      if (authError) {
        console.error('Auth update error:', authError);
      }
    }

    // Update email if provided
    if (updates.email && updates.email !== req.user.email) {
      const { error: emailError } = await supabase.auth.admin.updateUserById(
        req.user.id,
        { email: updates.email }
      );

      if (emailError) {
        return res.status(400).json({ 
          error: emailError.message || 'Failed to update email' 
        });
      }
    }

    // Update user profile in our database
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        ...(updates.fullName && { full_name: updates.fullName }),
        ...(updates.email && { email: updates.email }),
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/auth/password
 * Update user password
 */
router.put('/password', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { newPassword } = updatePasswordSchema.parse(req.body);
    
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { error } = await supabase.auth.admin.updateUserById(
      req.user.id,
      { password: newPassword }
    );

    if (error) {
      return res.status(400).json({ 
        error: error.message || 'Failed to update password' 
      });
    }

    res.json({ message: 'Password updated successfully' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/auth/account
 * Delete user account
 */
router.delete('/account', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Delete user from auth (this will cascade delete from our tables due to foreign keys)
    const { error } = await supabase.auth.admin.deleteUser(req.user.id);

    if (error) {
      console.error('Account deletion error:', error);
      return res.status(500).json({ error: 'Failed to delete account' });
    }

    res.json({ message: 'Account deleted successfully' });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/resend-confirmation
 * Resend email confirmation
 */
router.post('/resend-confirmation', async (req: Request, res: Response) => {
  try {
    const { email } = resetPasswordSchema.parse(req.body);

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    if (error) {
      console.error('Resend confirmation error:', error);
    }

    // Always return success to prevent email enumeration
    res.json({ 
      message: 'If an unconfirmed account exists with that email, we have sent a confirmation link.' 
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Resend confirmation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;