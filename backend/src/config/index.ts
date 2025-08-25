import dotenv from 'dotenv';
import path from 'path';
import { AppConfig } from '@/types';

// Load environment variables from root directory
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

// Determine which environment to use
const APP_ENV = process.env.APP_ENV || 'development';
const isDev = APP_ENV === 'development';

// Helper function to get environment-specific variables
function getEnvVar(devKey: string, prodKey: string): string {
  const value = isDev ? process.env[devKey] : process.env[prodKey];
  if (!value) {
    throw new Error(`Required environment variable ${isDev ? devKey : prodKey} is not set`);
  }
  return value;
}

// Helper function to get environment-specific variables with fallback
function getEnvVarWithFallback(devKey: string, prodKey: string, fallback: string): string {
  const value = isDev ? process.env[devKey] : process.env[prodKey];
  return value || fallback;
}

// Validate required environment variables based on environment
const requiredEnvVars = isDev 
  ? ['DEV_SUPABASE_URL', 'DEV_SUPABASE_ANON_KEY', 'DEV_SUPABASE_SERVICE_ROLE_KEY']
  : ['PROD_SUPABASE_URL', 'PROD_SUPABASE_ANON_KEY', 'PROD_SUPABASE_SERVICE_ROLE_KEY'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Required environment variable ${envVar} is not set for ${APP_ENV} environment`);
  }
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '3005', 10),
  nodeEnv: APP_ENV,
  frontendUrl: getEnvVar('DEV_FRONTEND_URL', 'PROD_FRONTEND_URL'),

  supabase: {
    url: getEnvVar('DEV_SUPABASE_URL', 'PROD_SUPABASE_URL'),
    anonKey: getEnvVar('DEV_SUPABASE_ANON_KEY', 'PROD_SUPABASE_ANON_KEY'),
    serviceRoleKey: getEnvVar('DEV_SUPABASE_SERVICE_ROLE_KEY', 'PROD_SUPABASE_SERVICE_ROLE_KEY'),
  },

  redis: {
    url: process.env.REDIS_URL || '',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    successUrl: process.env.STRIPE_SUCCESS_URL || `${getEnvVar('DEV_FRONTEND_URL', 'PROD_FRONTEND_URL')}/billing/success`,
    cancelUrl: process.env.STRIPE_CANCEL_URL || `${getEnvVar('DEV_FRONTEND_URL', 'PROD_FRONTEND_URL')}/billing/cancel`,
  },

  openai: {
    apiKey: getEnvVar('DEV_OPENAI_API_KEY', 'PROD_OPENAI_API_KEY'),
  },

  analysis: {
    timeout: parseInt(getEnvVarWithFallback('DEV_ANALYSIS_TIMEOUT', 'PROD_ANALYSIS_TIMEOUT', '30000'), 10),
    maxConcurrentAnalyses: parseInt(getEnvVarWithFallback('DEV_MAX_CONCURRENT_ANALYSES', 'PROD_MAX_CONCURRENT_ANALYSES', '5'), 10),
  },

  security: {
    jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },

  logging: {
    level: getEnvVarWithFallback('DEV_LOG_LEVEL', 'PROD_LOG_LEVEL', 'info'),
    file: process.env.LOG_FILE || undefined,
  },
};

// Validate configuration
export function validateConfig(): void {
  if (config.port < 1 || config.port > 65535) {
    throw new Error('Invalid port number');
  }

  if (config.redis.port < 1 || config.redis.port > 65535) {
    throw new Error('Invalid Redis port number');
  }

  if (config.analysis.timeout < 1000 || config.analysis.timeout > 600000) {
    throw new Error('Analysis timeout must be between 1 second and 10 minutes');
  }

  if (config.analysis.maxConcurrentAnalyses < 1 || config.analysis.maxConcurrentAnalyses > 100) {
    throw new Error('Max concurrent analyses must be between 1 and 100');
  }

  if (config.security.bcryptRounds < 8 || config.security.bcryptRounds > 15) {
    throw new Error('BCrypt rounds must be between 8 and 15');
  }
}

// Development mode helpers
export const isDevelopment = APP_ENV === 'development';
export const isProduction = APP_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';

// Feature flags
export const features = {
  stripeEnabled: Boolean(config.stripe.secretKey),
  openaiEnabled: Boolean(config.openai.apiKey),
  devMode: isDevelopment,
  
  // Development features
  enableApiDocs: isDevelopment ? process.env.DEV_ENABLE_API_DOCS === 'true' : process.env.PROD_ENABLE_API_DOCS === 'true',
  enableAnalytics: isDevelopment ? process.env.DEV_ENABLE_ANALYTICS === 'true' : process.env.PROD_ENABLE_ANALYTICS === 'true',
  enableEmailNotifications: isDevelopment ? process.env.DEV_ENABLE_EMAIL_NOTIFICATIONS === 'true' : process.env.PROD_ENABLE_EMAIL_NOTIFICATIONS === 'true',
  mockExternalServices: isDevelopment ? process.env.DEV_MOCK_EXTERNAL_SERVICES === 'true' : process.env.PROD_MOCK_EXTERNAL_SERVICES === 'true',
  
  // Development-only features
  skipEmailVerification: isDevelopment && process.env.DEV_SKIP_EMAIL_VERIFICATION === 'true',
  mockPaymentProvider: isDevelopment && process.env.DEV_MOCK_PAYMENT_PROVIDER === 'true',
  enableSocialLogin: isDevelopment ? process.env.DEV_ENABLE_SOCIAL_LOGIN === 'true' : process.env.PROD_ENABLE_SOCIAL_LOGIN === 'true',
  
  // Production-only features
  forceHttps: isProduction && process.env.PROD_FORCE_HTTPS === 'true',
  enableHelmet: isProduction && process.env.PROD_ENABLE_HELMET === 'true',
  
  // Rate limiting
  rateLimitWindow: parseInt(getEnvVarWithFallback('DEV_RATE_LIMIT_WINDOW', 'PROD_RATE_LIMIT_WINDOW', '900000'), 10),
  rateLimitMax: parseInt(getEnvVarWithFallback('DEV_RATE_LIMIT_MAX', 'PROD_RATE_LIMIT_MAX', '100'), 10),
  analysisRateLimitMax: parseInt(getEnvVarWithFallback('DEV_ANALYSIS_RATE_LIMIT_MAX', 'PROD_ANALYSIS_RATE_LIMIT_MAX', '10'), 10),
};