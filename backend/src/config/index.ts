import dotenv from 'dotenv';
import { AppConfig } from '@/types';

// Load environment variables
dotenv.config();

const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
  'REDIS_URL',
] as const;

// Validate required environment variables
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Required environment variable ${envVar} is not set`);
  }
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  supabase: {
    url: process.env.SUPABASE_URL!,
    anonKey: process.env.SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },

  redis: {
    url: process.env.REDIS_URL!,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    successUrl: process.env.STRIPE_SUCCESS_URL || `${process.env.FRONTEND_URL}/billing/success`,
    cancelUrl: process.env.STRIPE_CANCEL_URL || `${process.env.FRONTEND_URL}/billing/cancel`,
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },

  analysis: {
    timeout: parseInt(process.env.ANALYSIS_TIMEOUT || '300000', 10), // 5 minutes
    maxConcurrentAnalyses: parseInt(process.env.MAX_CONCURRENT_ANALYSES || '5', 10),
  },

  security: {
    jwtSecret: process.env.JWT_SECRET!,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE,
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
export const isDevelopment = config.nodeEnv === 'development';
export const isProduction = config.nodeEnv === 'production';
export const isTest = config.nodeEnv === 'test';

// Feature flags
export const features = {
  stripeEnabled: Boolean(config.stripe.secretKey),
  openaiEnabled: Boolean(config.openai.apiKey),
  devMode: isDevelopment,
  skipAuth: isDevelopment && process.env.DEV_SKIP_AUTH === 'true',
  mockPayments: isDevelopment && process.env.DEV_MOCK_PAYMENTS === 'true',
  seedDatabase: isDevelopment && process.env.DEV_SEED_DATABASE === 'true',
};