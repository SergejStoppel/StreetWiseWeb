import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import authService from '../services/authService';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName } = req.body;

      const result = await authService.registerUser({
        email,
        password,
        firstName,
        lastName
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: result.user,
          tokens: result.tokens
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error instanceof Error) {
        if (error.message === 'User already exists with this email') {
          res.status(409).json({
            success: false,
            error: 'Email already in use',
            message: 'An account with this email already exists'
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: 'Registration failed',
        message: 'An error occurred during registration'
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const result = await authService.loginUser({ email, password });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          tokens: result.tokens
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Invalid email or password') {
          res.status(401).json({
            success: false,
            error: 'Invalid credentials',
            message: 'Invalid email or password'
          });
          return;
        }
        
        if (error.message === 'Account is deactivated') {
          res.status(403).json({
            success: false,
            error: 'Account deactivated',
            message: 'Your account has been deactivated'
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: 'Login failed',
        message: 'An error occurred during login'
      });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Refresh token required',
          message: 'Please provide a refresh token'
        });
        return;
      }

      const newTokens = await authService.refreshTokens(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Tokens refreshed successfully',
        data: {
          tokens: newTokens
        }
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      
      res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        message: 'The provided refresh token is invalid or expired'
      });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await authService.logoutUser(refreshToken);
      }

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Logout failed',
        message: 'An error occurred during logout'
      });
    }
  }

  async logoutAllDevices(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
        return;
      }

      await authService.logoutAllDevices(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Logged out from all devices successfully'
      });
    } catch (error) {
      console.error('Logout all devices error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Logout failed',
        message: 'An error occurred during logout'
      });
    }
  }

  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
        return;
      }

      const user = await authService.getUserProfile(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          user
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Profile retrieval failed',
        message: 'An error occurred while retrieving profile'
      });
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
        return;
      }

      const { firstName, lastName } = req.body;

      const user = await authService.updateUserProfile(req.user.id, {
        firstName,
        lastName
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Profile update failed',
        message: 'An error occurred while updating profile'
      });
    }
  }

  async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'Current password and new password are required'
        });
        return;
      }

      await authService.changePassword(req.user.id, currentPassword, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully. Please log in again.'
      });
    } catch (error) {
      console.error('Change password error:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Current password is incorrect') {
          res.status(400).json({
            success: false,
            error: 'Invalid current password',
            message: 'The current password is incorrect'
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: 'Password change failed',
        message: 'An error occurred while changing password'
      });
    }
  }

  async deactivateAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
        return;
      }

      await authService.deactivateAccount(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Account deactivated successfully'
      });
    } catch (error) {
      console.error('Deactivate account error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Account deactivation failed',
        message: 'An error occurred while deactivating account'
      });
    }
  }
}

export default new AuthController();