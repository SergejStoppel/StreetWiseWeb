import { Request } from 'express';

// Extend Express Request to include user information
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// User types
export interface CreateUserRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Website audit types
export interface WebsiteAuditRequest {
  url: string;
  auditType: 'QUICK_SCAN' | 'FULL_AUDIT' | 'SEO_FOCUS' | 'PERFORMANCE_FOCUS' | 'ACCESSIBILITY_FOCUS';
}

export interface AuditScores {
  overallScore: number;
  seoScore: number;
  performanceScore: number;
  accessibilityScore: number;
}

export interface AuditIssue {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  element?: string;
  suggestion?: string;
}

// Content generation types
export interface ContentGenerationRequest {
  businessType: string;
  businessName: string;
  location?: string;
  targetAudience?: string;
  businessDescription?: string;
  contentType: 'BLOG_POST_IDEAS' | 'BLOG_POST_FULL' | 'SOCIAL_MEDIA_POST' | 'PRODUCT_DESCRIPTION' | 'LANDING_PAGE_COPY';
  topic?: string;
  tone?: 'professional' | 'casual' | 'friendly' | 'authoritative';
  length?: 'short' | 'medium' | 'long';
}

export interface GeneratedContentResponse {
  id: string;
  title: string;
  content: string;
  contentType: string;
  createdAt: string;
}

// Subscription types
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    auditsPerMonth: number;
    contentGenerationsPerMonth: number;
    websitesTracked: number;
  };
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Validation error
export interface ValidationError {
  field: string;
  message: string;
}

// Database connection health
export interface DatabaseHealth {
  connected: boolean;
  latency?: number;
  error?: string;
}