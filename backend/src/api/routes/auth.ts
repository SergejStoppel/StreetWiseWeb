import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { ApiResponse } from '@/types';
import { config } from '@/config';

const router = express.Router();

const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey
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
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               fullName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Account created successfully
 *       400:
 *         description: Validation error or account already exists
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName } = signUpSchema.parse(req.body);

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      const response: ApiResponse = {
        success: false,
        message: 'An account with this email already exists',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
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
      const response: ApiResponse = {
        success: false,
        message: authError.message || 'Failed to create account',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    if (!authData.user) {
      const response: ApiResponse = {
        success: false,
        message: 'Failed to create user',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
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
      // Try to clean up the auth user if database insert fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      const response: ApiResponse = {
        success: false,
        message: 'Failed to create user profile',
        timestamp: new Date().toISOString(),
      };
      return res.status(500).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Account created successfully. Please check your email to confirm your account.',
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          fullName: fullName,
          emailConfirmed: false,
        }
      },
      timestamp: new Date().toISOString(),
    };

    res.status(201).json(response);

  } catch (error) {
    if (error instanceof z.ZodError) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation failed',
        errors: error.errors,
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }
    
    const response: ApiResponse = {
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
});

/**
 * @swagger
 * /api/auth/signin:
 *   post:
 *     summary: Sign in user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Signed in successfully
 *       401:
 *         description: Invalid credentials or email not confirmed
 */
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = signInSchema.parse(req.body);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      let message = 'Sign in failed';
      if (authError.message.includes('Invalid login credentials')) {
        message = 'Invalid email or password';
      } else if (authError.message.includes('Email not confirmed')) {
        message = 'Please confirm your email before signing in';
      } else {
        message = authError.message;
      }
      
      const response: ApiResponse = {
        success: false,
        message,
        timestamp: new Date().toISOString(),
      };
      return res.status(401).json(response);
    }

    if (!authData.user || !authData.session) {
      const response: ApiResponse = {
        success: false,
        message: 'Sign in failed',
        timestamp: new Date().toISOString(),
      };
      return res.status(401).json(response);
    }

    // Get user profile from our database
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      const response: ApiResponse = {
        success: false,
        message: 'Failed to fetch user profile',
        timestamp: new Date().toISOString(),
      };
      return res.status(500).json(response);
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

    const response: ApiResponse = {
      success: true,
      message: 'Signed in successfully',
      data: {
        user: userProfile,
        session: {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
          expires_at: authData.session.expires_at,
        },
        workspaces: workspaces || [],
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);

  } catch (error) {
    if (error instanceof z.ZodError) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation failed',
        errors: error.errors,
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }
    
    const response: ApiResponse = {
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
});

/**
 * @swagger
 * /api/auth/signout:
 *   post:
 *     summary: Sign out user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Signed out successfully
 */
router.post('/signout', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (token) {
      const { error } = await supabase.auth.admin.signOut(token);
      if (error) {
        console.error('Signout error:', error);
      }
    }

    const response: ApiResponse = {
      success: true,
      message: 'Signed out successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
});

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Send password reset email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent (if account exists)
 */
router.post('/forgot-password', async (req, res) => {
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
      const response: ApiResponse = {
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link.',
        timestamp: new Date().toISOString(),
      };
      return res.json(response);
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${config.frontendUrl}/auth/reset-password`,
    });

    if (error) {
      console.error('Password reset error:', error);
    }

    const response: ApiResponse = {
      success: true,
      message: 'If an account with that email exists, we have sent a password reset link.',
      timestamp: new Date().toISOString(),
    };
    res.json(response);

  } catch (error) {
    if (error instanceof z.ZodError) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation failed',
        errors: error.errors,
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }
    
    const response: ApiResponse = {
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
});

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset user password with reset token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successfully
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { newPassword } = updatePasswordSchema.parse(req.body);
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      const response: ApiResponse = {
        success: false,
        message: 'Reset token required',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      const response: ApiResponse = {
        success: false,
        message: error.message || 'Failed to reset password',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Password reset successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(response);

  } catch (error) {
    if (error instanceof z.ZodError) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation failed',
        errors: error.errors,
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }
    
    const response: ApiResponse = {
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        message: 'Not authenticated',
        timestamp: new Date().toISOString(),
      };
      return res.status(401).json(response);
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

    const response: ApiResponse = {
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user: req.user,
        workspaces: workspaces || [],
      },
      timestamp: new Date().toISOString(),
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
});

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const updates = updateProfileSchema.parse(req.body);
    
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        message: 'Not authenticated',
        timestamp: new Date().toISOString(),
      };
      return res.status(401).json(response);
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
        const response: ApiResponse = {
          success: false,
          message: emailError.message || 'Failed to update email',
          timestamp: new Date().toISOString(),
        };
        return res.status(400).json(response);
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
      const response: ApiResponse = {
        success: false,
        message: 'Failed to update profile',
        timestamp: new Date().toISOString(),
      };
      return res.status(500).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser,
      },
      timestamp: new Date().toISOString(),
    };
    res.json(response);

  } catch (error) {
    if (error instanceof z.ZodError) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation failed',
        errors: error.errors,
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }
    
    const response: ApiResponse = {
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
});

/**
 * @swagger
 * /api/auth/password:
 *   put:
 *     summary: Update user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password updated successfully
 */
router.put('/password', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { newPassword } = updatePasswordSchema.parse(req.body);
    
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        message: 'Not authenticated',
        timestamp: new Date().toISOString(),
      };
      return res.status(401).json(response);
    }

    const { error } = await supabase.auth.admin.updateUserById(
      req.user.id,
      { password: newPassword }
    );

    if (error) {
      const response: ApiResponse = {
        success: false,
        message: error.message || 'Failed to update password',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Password updated successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(response);

  } catch (error) {
    if (error instanceof z.ZodError) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation failed',
        errors: error.errors,
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }
    
    const response: ApiResponse = {
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
});

/**
 * @swagger
 * /api/auth/account:
 *   delete:
 *     summary: Delete user account
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 */
router.delete('/account', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        message: 'Not authenticated',
        timestamp: new Date().toISOString(),
      };
      return res.status(401).json(response);
    }

    // Delete user from auth (this will cascade delete from our tables due to foreign keys)
    const { error } = await supabase.auth.admin.deleteUser(req.user.id);

    if (error) {
      const response: ApiResponse = {
        success: false,
        message: 'Failed to delete account',
        timestamp: new Date().toISOString(),
      };
      return res.status(500).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Account deleted successfully',
      timestamp: new Date().toISOString(),
    };
    res.json(response);

  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
});

/**
 * @swagger
 * /api/auth/resend-confirmation:
 *   post:
 *     summary: Resend email confirmation
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Confirmation email sent (if account exists)
 */
router.post('/resend-confirmation', async (req, res) => {
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
    const response: ApiResponse = {
      success: true,
      message: 'If an unconfirmed account exists with that email, we have sent a confirmation link.',
      timestamp: new Date().toISOString(),
    };
    res.json(response);

  } catch (error) {
    if (error instanceof z.ZodError) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation failed',
        errors: error.errors,
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }
    
    const response: ApiResponse = {
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
});

export default router;