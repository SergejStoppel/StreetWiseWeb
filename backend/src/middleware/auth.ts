import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../types';
import prisma from '../utils/database';

export interface JwtPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ 
        error: 'Access token required',
        message: 'Please provide a valid access token' 
      });
      return;
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
    
    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true
      }
    });

    if (!user) {
      res.status(401).json({ 
        error: 'Invalid token',
        message: 'User not found' 
      });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({ 
        error: 'Account deactivated',
        message: 'Your account has been deactivated' 
      });
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ 
        error: 'Invalid token',
        message: 'The provided token is invalid or expired' 
      });
      return;
    }

    console.error('Authentication error:', error);
    res.status(500).json({ 
      error: 'Authentication failed',
      message: 'Internal server error during authentication' 
    });
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // No token provided, continue without authentication
      next();
      return;
    }

    if (!process.env.JWT_SECRET) {
      next();
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true
      }
    });

    if (user && user.isActive) {
      req.user = user;
    }

    next();
  } catch (error) {
    // If token verification fails, continue without authentication
    next();
  }
};