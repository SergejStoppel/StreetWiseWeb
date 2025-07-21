/**
 * Frontend Environment Configuration Utility
 * 
 * Handles environment-specific configuration for React app
 * Works with the unified .env file approach
 */

// React build process exposes variables that start with REACT_APP_
// Our unified system sets these based on APP_ENV during build
const APP_ENV = process.env.REACT_APP_ENV || process.env.NODE_ENV || 'development';
const isDevelopment = APP_ENV === 'development';
const isProduction = APP_ENV === 'production';

// Environment configuration for frontend
const config = {
  // Environment info
  APP_ENV,
  NODE_ENV: process.env.NODE_ENV || 'development',
  isDevelopment,
  isProduction,

  // Supabase configuration (set by build process based on APP_ENV)
  SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY,

  // API configuration
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001',

  // Environment indicator
  ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT || 'development',

  // Feature flags
  DEBUG: process.env.REACT_APP_DEBUG === 'true',
  ENABLE_ANALYTICS: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
  ENABLE_SOCIAL_LOGIN: process.env.REACT_APP_ENABLE_SOCIAL_LOGIN === 'true',
  MOCK_EXTERNAL_SERVICES: process.env.REACT_APP_MOCK_EXTERNAL_SERVICES === 'true',
};

// Validation for frontend
const validateConfig = () => {
  const errors = [];

  if (!config.SUPABASE_URL) {
    errors.push(`Missing SUPABASE_URL for environment: ${APP_ENV}`);
  }
  if (!config.SUPABASE_ANON_KEY) {
    errors.push(`Missing SUPABASE_ANON_KEY for environment: ${APP_ENV}`);
  }

  if (errors.length > 0) {
    console.error('❌ Frontend Environment Configuration Errors:');
    errors.forEach(error => console.error(`   • ${error}`));
    throw new Error('Invalid frontend environment configuration');
  }
};

// Log configuration (development only)
if (isDevelopment && process.env.REACT_APP_DEBUG !== 'false') {
  console.log('🎨 Frontend Environment Configuration:');
  console.log(`   • Environment: ${APP_ENV}`);
  console.log(`   • Node Environment: ${config.NODE_ENV}`);
  console.log(`   • API URL: ${config.API_URL}`);
  console.log(`   • Supabase URL: ${config.SUPABASE_URL?.substring(0, 30)}...`);
  console.log(`   • Analytics: ${config.ENABLE_ANALYTICS ? 'Enabled' : 'Disabled'}`);
  console.log(`   • Social Login: ${config.ENABLE_SOCIAL_LOGIN ? 'Enabled' : 'Disabled'}`);
  console.log('');
}

// Validate on load
validateConfig();

export default config;