import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { CreateUserRequest, LoginRequest, AuthTokens } from '../types';

const prisma = new PrismaClient();

export class AuthService {
  private readonly JWT_SECRET: string;
  private readonly JWT_EXPIRES_IN: string;

  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
    this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
  }

  async registerUser(userData: CreateUserRequest): Promise<{ user: any; tokens: AuthTokens }> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email.toLowerCase() }
    });

    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(userData.password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: userData.email.toLowerCase(),
        passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.email);

    // Store refresh token in database
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return { user, tokens };
  }

  async loginUser(loginData: LoginRequest): Promise<{ user: any; tokens: AuthTokens }> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: loginData.email.toLowerCase() }
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginData.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.email);

    // Store refresh token in database
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    // Return user without password hash
    const userWithoutPassword = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return { user: userWithoutPassword, tokens };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.JWT_SECRET) as any;

      // Check if refresh token exists in database
      const storedToken = await prisma.userSession.findUnique({
        where: { token: refreshToken },
        include: { user: true }
      });

      if (!storedToken || !storedToken.user.isActive) {
        throw new Error('Invalid refresh token');
      }

      // Generate new tokens
      const newTokens = this.generateTokens(storedToken.user.id, storedToken.user.email);

      // Store new refresh token and remove old one
      await prisma.$transaction([
        prisma.userSession.delete({
          where: { token: refreshToken }
        }),
        prisma.userSession.create({
          data: {
            userId: storedToken.user.id,
            token: newTokens.refreshToken,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          }
        })
      ]);

      return newTokens;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async logoutUser(refreshToken: string): Promise<void> {
    // Remove refresh token from database
    await prisma.userSession.deleteMany({
      where: { token: refreshToken }
    });
  }

  async logoutAllDevices(userId: string): Promise<void> {
    // Remove all refresh tokens for the user
    await prisma.userSession.deleteMany({
      where: { userId }
    });
  }

  private generateTokens(userId: string, email: string): AuthTokens {
    const payload = {
      userId,
      email,
      iat: Math.floor(Date.now() / 1000)
    };

    const accessToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN
    });

    const refreshToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: '30d'
    });

    return {
      accessToken,
      refreshToken
    };
  }

  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    // Calculate expiration date (30 days from now)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Store refresh token in database
    await prisma.userSession.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt
      }
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Get user's current password hash
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password and logout all devices
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash }
      }),
      prisma.userSession.deleteMany({
        where: { userId }
      })
    ]);
  }

  async deactivateAccount(userId: string): Promise<void> {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { isActive: false }
      }),
      prisma.userSession.deleteMany({
        where: { userId }
      })
    ]);
  }

  async getUserProfile(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async updateUserProfile(userId: string, updateData: { firstName?: string; lastName?: string }): Promise<any> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return user;
  }
}

export default new AuthService();