/**
 * Frontend Environment Setup for React Build Process
 * 
 * This file helps React access the unified environment variables
 * It transforms the unified .env variables into React-compatible format
 */

// React only exposes variables that start with REACT_APP_
// We need to map our unified environment variables to React format

const APP_ENV = process.env.REACT_APP_ENV || process.env.NODE_ENV || 'development';

// For build process, we need to expose the environment variables 
// React can access at build time
const setupEnvironmentForReact = () => {
  const isDevelopment = APP_ENV === 'development';
  
  // Set React-specific environment variables based on APP_ENV
  if (isDevelopment) {
    // Development environment
    process.env.REACT_APP_SUPABASE_URL = process.env.DEV_SUPABASE_URL;
    process.env.REACT_APP_SUPABASE_ANON_KEY = process.env.DEV_SUPABASE_ANON_KEY;
    process.env.REACT_APP_API_URL = process.env.DEV_API_URL || 'http://localhost:3001';
    process.env.REACT_APP_ENVIRONMENT = 'development';
    process.env.REACT_APP_DEBUG = 'true';
  } else {
    // Production environment
    process.env.REACT_APP_SUPABASE_URL = process.env.PROD_SUPABASE_URL;
    process.env.REACT_APP_SUPABASE_ANON_KEY = process.env.PROD_SUPABASE_ANON_KEY;
    process.env.REACT_APP_API_URL = process.env.PROD_API_URL;
    process.env.REACT_APP_ENVIRONMENT = 'production';
    process.env.REACT_APP_DEBUG = 'false';
  }
  
  // Set the environment indicator
  process.env.REACT_APP_ENV = APP_ENV;
};

// Run setup immediately
setupEnvironmentForReact();

module.exports = {
  setupEnvironmentForReact,
  APP_ENV
};