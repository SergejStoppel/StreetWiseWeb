#!/usr/bin/env node

/**
 * Setup Build Environment Script
 * 
 * This script prepares React environment variables for the build process
 * by reading the unified .env file and setting REACT_APP_ variables
 * based on the APP_ENV setting.
 */

const fs = require('fs');
const path = require('path');

// Load dotenv to read the .env file
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const APP_ENV = process.env.APP_ENV || 'development';
const isDevelopment = APP_ENV === 'development';

console.log(`🔧 Setting up build environment for: ${APP_ENV}`);

// Define the React environment variables based on APP_ENV
const reactEnvVars = {};

if (isDevelopment) {
  // Development environment mappings
  reactEnvVars.REACT_APP_ENV = 'development';
  reactEnvVars.REACT_APP_SUPABASE_URL = process.env.DEV_SUPABASE_URL;
  reactEnvVars.REACT_APP_SUPABASE_ANON_KEY = process.env.DEV_SUPABASE_ANON_KEY;
  reactEnvVars.REACT_APP_API_URL = process.env.DEV_API_URL || 'http://localhost:3005';
  reactEnvVars.REACT_APP_ENVIRONMENT = 'development';
  reactEnvVars.REACT_APP_DEBUG = 'true';
  reactEnvVars.REACT_APP_ENABLE_ANALYTICS = process.env.DEV_ENABLE_ANALYTICS || 'false';
  reactEnvVars.REACT_APP_ENABLE_SOCIAL_LOGIN = process.env.DEV_ENABLE_SOCIAL_LOGIN || 'false';
  reactEnvVars.REACT_APP_MOCK_EXTERNAL_SERVICES = process.env.DEV_MOCK_EXTERNAL_SERVICES || 'false';
} else {
  // Production environment mappings
  reactEnvVars.REACT_APP_ENV = 'production';
  reactEnvVars.REACT_APP_SUPABASE_URL = process.env.PROD_SUPABASE_URL;
  reactEnvVars.REACT_APP_SUPABASE_ANON_KEY = process.env.PROD_SUPABASE_ANON_KEY;
  reactEnvVars.REACT_APP_API_URL = process.env.PROD_API_URL;
  reactEnvVars.REACT_APP_ENVIRONMENT = 'production';
  reactEnvVars.REACT_APP_DEBUG = 'false';
  reactEnvVars.REACT_APP_ENABLE_ANALYTICS = process.env.PROD_ENABLE_ANALYTICS || 'false';
  reactEnvVars.REACT_APP_ENABLE_SOCIAL_LOGIN = process.env.PROD_ENABLE_SOCIAL_LOGIN || 'false';
  reactEnvVars.REACT_APP_MOCK_EXTERNAL_SERVICES = 'false';
}

// Validate required variables
const requiredVars = ['REACT_APP_SUPABASE_URL', 'REACT_APP_SUPABASE_ANON_KEY'];
const missingVars = requiredVars.filter(varName => !reactEnvVars[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables for', APP_ENV);
  missingVars.forEach(varName => {
    console.error(`   • ${varName} (check ${varName.replace('REACT_APP_', isDevelopment ? 'DEV_' : 'PROD_')} in .env)`);
  });
  process.exit(1);
}

// Write the React environment variables to process.env
Object.keys(reactEnvVars).forEach(key => {
  if (reactEnvVars[key]) {
    process.env[key] = reactEnvVars[key];
  }
});

// Create a .env.local file for React to use during build
const reactEnvContent = Object.entries(reactEnvVars)
  .filter(([_, value]) => value)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

const frontendEnvPath = path.join(__dirname, '..', 'frontend', '.env.local');

fs.writeFileSync(frontendEnvPath, reactEnvContent);

console.log('✅ Build environment variables set:');
console.log(`   • Environment: ${APP_ENV}`);
console.log(`   • Supabase URL: ${reactEnvVars.REACT_APP_SUPABASE_URL?.substring(0, 30)}...`);
console.log(`   • API URL: ${reactEnvVars.REACT_APP_API_URL}`);
console.log(`   • Debug Mode: ${reactEnvVars.REACT_APP_DEBUG}`);
console.log(`   • Analytics: ${reactEnvVars.REACT_APP_ENABLE_ANALYTICS}`);
console.log(`   • Config written to: ${frontendEnvPath}`);
console.log('');