/**
 * Environment Configuration Utility
 * 
 * Loads environment variables and sets appropriate values based on APP_ENV
 * This allows for a single .env file with both dev and production configs
 */

require('dotenv').config();

// Get the current environment (defaults to development)
const APP_ENV = process.env.APP_ENV || 'development';
const isDevelopment = APP_ENV === 'development';
const isProduction = APP_ENV === 'production';

// Helper function to get environment-specific value
const getEnvValue = (devKey, prodKey, fallback = null) => {
  if (isDevelopment) {
    return process.env[devKey] || fallback;
  } else if (isProduction) {
    return process.env[prodKey] || fallback;
  }
  return fallback;
};

// Environment configuration object
const config = {
  // Environment info
  APP_ENV,
  NODE_ENV: isProduction ? 'production' : 'development',
  isDevelopment,
  isProduction,

  // Server configuration
  PORT: process.env.PORT || 3005,
  FRONTEND_URL: getEnvValue('DEV_FRONTEND_URL', 'PROD_FRONTEND_URL', 'http://localhost:3000'),
  API_URL: getEnvValue('DEV_API_URL', 'PROD_API_URL', 'http://localhost:3005'),
  CORS_ORIGIN: getEnvValue('DEV_CORS_ORIGIN', 'PROD_CORS_ORIGIN', 'http://localhost:3000'),

  // Supabase configuration
  SUPABASE_URL: getEnvValue('DEV_SUPABASE_URL', 'PROD_SUPABASE_URL'),
  SUPABASE_ANON_KEY: getEnvValue('DEV_SUPABASE_ANON_KEY', 'PROD_SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: getEnvValue('DEV_SUPABASE_SERVICE_ROLE_KEY', 'PROD_SUPABASE_SERVICE_ROLE_KEY'),

  // Analysis configuration
  ANALYSIS_TIMEOUT: parseInt(getEnvValue('DEV_ANALYSIS_TIMEOUT', 'PROD_ANALYSIS_TIMEOUT', '30000'), 10),
  MAX_CONCURRENT_ANALYSES: parseInt(getEnvValue('DEV_MAX_CONCURRENT_ANALYSES', 'PROD_MAX_CONCURRENT_ANALYSES', '5'), 10),

  // Rate limiting
  RATE_LIMIT_WINDOW: parseInt(getEnvValue('DEV_RATE_LIMIT_WINDOW', 'PROD_RATE_LIMIT_WINDOW', '900000'), 10),
  RATE_LIMIT_MAX: parseInt(getEnvValue('DEV_RATE_LIMIT_MAX', 'PROD_RATE_LIMIT_MAX', '100'), 10),
  ANALYSIS_RATE_LIMIT_MAX: parseInt(getEnvValue('DEV_ANALYSIS_RATE_LIMIT_MAX', 'PROD_ANALYSIS_RATE_LIMIT_MAX', '10'), 10),

  // Logging
  LOG_LEVEL: getEnvValue('DEV_LOG_LEVEL', 'PROD_LOG_LEVEL', 'info'),
  LOG_FILE: process.env.LOG_FILE || './logs/app.log',
  DEBUG: getEnvValue('DEV_DEBUG', 'PROD_DEBUG', 'false') === 'true',

  // Security (handled by Supabase - no additional secrets needed)

  // Feature flags
  ENABLE_API_DOCS: getEnvValue('DEV_ENABLE_API_DOCS', 'PROD_ENABLE_API_DOCS', 'false') === 'true',
  ENABLE_ANALYTICS: getEnvValue('DEV_ENABLE_ANALYTICS', 'PROD_ENABLE_ANALYTICS', 'false') === 'true',
  ENABLE_EMAIL_NOTIFICATIONS: getEnvValue('DEV_ENABLE_EMAIL_NOTIFICATIONS', 'PROD_ENABLE_EMAIL_NOTIFICATIONS', 'false') === 'true',
  MOCK_EXTERNAL_SERVICES: getEnvValue('DEV_MOCK_EXTERNAL_SERVICES', 'PROD_MOCK_EXTERNAL_SERVICES', 'false') === 'true',

  // Development-only settings
  ENABLE_SOCIAL_LOGIN: isDevelopment ? 
    (process.env.DEV_ENABLE_SOCIAL_LOGIN === 'true') : 
    (process.env.PROD_ENABLE_SOCIAL_LOGIN === 'true'),
  SKIP_EMAIL_VERIFICATION: isDevelopment ? 
    (process.env.DEV_SKIP_EMAIL_VERIFICATION === 'true') : 
    false,
  MOCK_PAYMENT_PROVIDER: isDevelopment ? 
    (process.env.DEV_MOCK_PAYMENT_PROVIDER === 'true') : 
    false,

  // Production-only settings
  FORCE_HTTPS: isProduction ? 
    (process.env.PROD_FORCE_HTTPS !== 'false') : 
    false,
  ENABLE_HELMET: isProduction ? 
    (process.env.PROD_ENABLE_HELMET !== 'false') : 
    false,

  // Optional services (available in both environments)
  REDIS_URL: process.env.REDIS_URL,
  SENTRY_DSN: process.env.SENTRY_DSN,
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  FROM_EMAIL: process.env.FROM_EMAIL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
};

// Validation function
const validateConfig = () => {
  const errors = [];

  // Required Supabase configuration
  if (!config.SUPABASE_URL) {
    errors.push(`Missing SUPABASE_URL for environment: ${APP_ENV}`);
  }
  if (!config.SUPABASE_ANON_KEY) {
    errors.push(`Missing SUPABASE_ANON_KEY for environment: ${APP_ENV}`);
  }
  if (!config.SUPABASE_SERVICE_ROLE_KEY) {
    errors.push(`Missing SUPABASE_SERVICE_ROLE_KEY for environment: ${APP_ENV}`);
  }

  // Security validation (Supabase handles JWT tokens)
  // No additional secrets required - authentication is managed by Supabase

  // Production-specific validations
  if (isProduction) {
    if (!config.FRONTEND_URL?.includes('https://')) {
      errors.push('Production FRONTEND_URL should use HTTPS');
    }
  }

  if (errors.length > 0) {
    console.error('❌ Environment Configuration Errors:');
    errors.forEach(error => console.error(`   • ${error}`));
    process.exit(1);
  }
};

// Log current configuration (without secrets)
const logConfiguration = () => {
  console.log('🚀 Environment Configuration:');
  console.log(`   • Environment: ${APP_ENV}`);
  console.log(`   • Node Environment: ${config.NODE_ENV}`);
  console.log(`   • Port: ${config.PORT}`);
  console.log(`   • Frontend URL: ${config.FRONTEND_URL}`);
  console.log(`   • CORS Origin: ${config.CORS_ORIGIN}`);
  console.log(`   • Supabase URL: ${config.SUPABASE_URL?.substring(0, 30)}...`);
  console.log(`   • Analysis Timeout: ${config.ANALYSIS_TIMEOUT}ms`);
  console.log(`   • Max Concurrent Analyses: ${config.MAX_CONCURRENT_ANALYSES}`);
  console.log(`   • Rate Limit: ${config.RATE_LIMIT_MAX} requests per ${config.RATE_LIMIT_WINDOW / 60000} minutes`);
  console.log(`   • Log Level: ${config.LOG_LEVEL}`);
  console.log(`   • Debug Mode: ${config.DEBUG}`);
  
  // Feature flags
  const enabledFeatures = [];
  if (config.ENABLE_API_DOCS) enabledFeatures.push('API Docs');
  if (config.ENABLE_ANALYTICS) enabledFeatures.push('Analytics');
  if (config.ENABLE_EMAIL_NOTIFICATIONS) enabledFeatures.push('Email Notifications');
  if (config.MOCK_EXTERNAL_SERVICES) enabledFeatures.push('Mock Services');
  
  if (enabledFeatures.length > 0) {
    console.log(`   • Enabled Features: ${enabledFeatures.join(', ')}`);
  }

  // Optional services
  const optionalServices = [];
  if (config.REDIS_URL) optionalServices.push('Redis');
  if (config.SENTRY_DSN) optionalServices.push('Sentry');
  if (config.SENDGRID_API_KEY) optionalServices.push('SendGrid');
  
  if (optionalServices.length > 0) {
    console.log(`   • Optional Services: ${optionalServices.join(', ')}`);
  }

  console.log('');
};

// Validate configuration on load
validateConfig();

// Export the configuration
module.exports = {
  ...config,
  validate: validateConfig,
  logConfiguration,
};