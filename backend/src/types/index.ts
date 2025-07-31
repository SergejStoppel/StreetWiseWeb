// Core entity types
export interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  createdAt: Date;
}

export interface Workspace {
  id: string;
  ownerId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  createdAt: Date;
}

export interface Website {
  id: string;
  workspaceId: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

// Analysis types
export interface Analysis {
  id: string;
  websiteId: string;
  userId: string;
  status: AnalysisStatus;
  overallScore?: number;
  accessibilityScore?: number;
  seoScore?: number;
  performanceScore?: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface AnalysisJob {
  id: string;
  analysisId: string;
  moduleId: string;
  status: JobStatus;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface Screenshot {
  id: string;
  analysisId: string;
  type: ScreenshotType;
  storageBucket: string;
  storagePath: string;
  url: string;
  createdAt: Date;
}

// Rules engine types
export interface AnalysisModule {
  id: string;
  name: string;
  description?: string;
}

export interface Rule {
  id: string;
  moduleId: string;
  ruleKey: string;
  name: string;
  description?: string;
  defaultSeverity: IssueSeverity;
  wcagCriteria?: string[];
  wcagLevel?: WCAGLevel;
  disabilityGroups?: string[];
  impactScore?: number;
  legalRiskLevel?: LegalRiskLevel;
  plainLanguageExplanation?: string;
  whyItMatters?: string;
  businessImpact?: string;
}

export interface RuleSolution {
  id: string;
  ruleId: string;
  solutionType: SolutionType;
  title: string;
  description: string;
  steps?: unknown[];
  codeExamples?: Record<string, string>;
  toolsMentioned?: string[];
  estimatedEffort?: EffortLevel;
  technicalLevel?: TechnicalLevel;
}

export interface RuleTesting {
  id: string;
  ruleId: string;
  automatedTests?: unknown;
  manualTests?: unknown;
  validationCriteria?: string;
}

export interface ComplianceStandard {
  id: string;
  name: string;
}

// Issue types
export interface BaseIssue {
  id: string;
  analysisJobId: string;
  ruleId: string;
  severity: IssueSeverity;
  locationPath?: string;
  codeSnippet?: string;
  message?: string;
  fixSuggestion?: string;
  screenshotHighlight?: ScreenshotHighlight;
  createdAt: Date;
}

export interface AccessibilityIssue extends BaseIssue {}
export interface SeoIssue extends BaseIssue {}
export interface PerformanceIssue extends BaseIssue {}

export interface ScreenshotHighlight {
  screenshotId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Billing types
export interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  billingInterval: BillingInterval;
  features: PlanFeatures;
  stripePriceId?: string;
  createdAt: Date;
}

export interface PlanFeatures {
  maxAnalysesPerMonth: number;
  maxConcurrentAnalyses: number;
  detailedReports: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
  teamMembers: number;
  dataRetentionDays: number;
}

export interface Subscription {
  id: string;
  workspaceId: string;
  planId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OneTimePurchase {
  id: string;
  workspaceId: string;
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  creditAmount: number;
  status: PurchaseStatus;
  createdAt: Date;
}

export interface ReportCredit {
  workspaceId: string;
  balance: number;
  lastPurchasedAt?: Date;
  lastUsedAt?: Date;
}

// Report types
export interface Report {
  id: string;
  analysisId: string;
  workspaceId: string;
  reportType: ReportType;
  generatedAt: Date;
  expiresAt?: Date;
  downloadCount: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  workspaceId?: string;
  action: string;
  level: AuditLogLevel;
  details?: unknown;
  metadata?: unknown;
  createdAt: Date;
}

// Enum types
export enum WorkspaceRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export enum AnalysisStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum JobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum IssueSeverity {
  CRITICAL = 'critical',
  SERIOUS = 'serious',
  MODERATE = 'moderate',
  MINOR = 'minor',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  TRIALING = 'trialing',
}

export enum ReportType {
  FREE = 'free',
  DETAILED = 'detailed',
}

export enum PurchaseStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
}

export enum ScreenshotType {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  TABLET = 'tablet',
  FULL_PAGE = 'full_page',
}

export enum WCAGLevel {
  A = 'A',
  AA = 'AA',
  AAA = 'AAA',
}

export enum LegalRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum SolutionType {
  DIY = 'diy',
  THIRD_PARTY = 'third_party',
  ALTERNATIVE = 'alternative',
}

export enum EffortLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum TechnicalLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export enum BillingInterval {
  MONTH = 'month',
  YEAR = 'year',
}

export enum AuditLogLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SECURITY = 'security',
}

// API request/response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Job queue types
export interface QueueJobData {
  analysisId: string;
  workspaceId: string;
  websiteId: string;
  userId: string;
  assetPath?: string;
}

export interface MasterJobData extends QueueJobData {
  analysisTypes: string[];
}

export interface FetcherJobData extends QueueJobData {
  url: string;
  screenshotTypes: ScreenshotType[];
}

export interface AnalyzerJobData extends QueueJobData {
  ruleIds: string[];
  assetPath: string;
}

// Configuration types
export interface AppConfig {
  port: number;
  nodeEnv: string;
  frontendUrl: string;
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  redis: {
    url: string;
    host: string;
    port: number;
    password?: string;
  };
  stripe: {
    secretKey: string;
    publishableKey: string;
    webhookSecret: string;
    successUrl: string;
    cancelUrl: string;
  };
  openai: {
    apiKey: string;
  };
  analysis: {
    timeout: number;
    maxConcurrentAnalyses: number;
  };
  security: {
    jwtSecret: string;
    jwtExpiresIn: string;
    bcryptRounds: number;
  };
  logging: {
    level: string;
    file?: string;
  };
}

// Express request extensions
export interface AuthenticatedRequest {
  user: User;
  workspace?: Workspace;
  workspaceRole?: WorkspaceRole;
}

// Error types
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;

  constructor(message: string, statusCode: number, isOperational = true, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 400, true, code);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required', code?: string) {
    super(message, 401, true, code);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions', code?: string) {
    super(message, 403, true, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code?: string) {
    super(message, 404, true, code);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists', code?: string) {
    super(message, 409, true, code);
  }
}

export class PaymentRequiredError extends AppError {
  constructor(message = 'Payment required', code?: string) {
    super(message, 402, true, code);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded', code?: string) {
    super(message, 429, true, code);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal server error', code?: string) {
    super(message, 500, true, code);
  }
}