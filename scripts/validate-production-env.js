#!/usr/bin/env node

/**
 * Production Environment Validation Script
 * 
 * This script validates that all production environment variables
 * are properly configured and the system is ready for deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating production environment configuration...\n');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  console.error('   Please copy .env.example to .env and configure it.');
  process.exit(1);
}

require('dotenv').config({ path: envPath });

// Validation results
let hasErrors = false;
let hasWarnings = false;
const errors = [];
const warnings = [];

// Helper functions
const validateRequired = (varName, description) => {
  if (!process.env[varName]) {
    errors.push(`${varName}: ${description}`);
    hasErrors = true;
    return false;
  }
  return true;
};

const validateOptional = (varName, description, defaultValue) => {
  if (!process.env[varName]) {
    warnings.push(`${varName}: ${description} (will use default: ${defaultValue})`);
    hasWarnings = true;
    return false;
  }
  return true;
};

const validateUrl = (varName, url) => {
  if (!url) return false;
  
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      errors.push(`${varName}: Must be a valid HTTP/HTTPS URL`);
      hasErrors = true;
      return false;
    }
    
    if (parsed.protocol === 'http:' && process.env.APP_ENV === 'production') {
      warnings.push(`${varName}: Using HTTP in production is not recommended`);
      hasWarnings = true;
    }
    
    return true;
  } catch (error) {
    errors.push(`${varName}: Invalid URL format`);
    hasErrors = true;
    return false;
  }
};

const validateJWT = (varName, token) => {
  if (!token) return false;
  
  // Basic JWT format validation
  const parts = token.split('.');
  if (parts.length !== 3) {
    errors.push(`${varName}: Invalid JWT format`);
    hasErrors = true;
    return false;
  }
  
  try {
    // Decode JWT header to check algorithm
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    if (header.alg !== 'HS256' && header.alg !== 'RS256') {
      warnings.push(`${varName}: Unexpected JWT algorithm: ${header.alg}`);
      hasWarnings = true;
    }
    
    // Check expiration
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    if (payload.exp && payload.exp < Date.now() / 1000) {
      errors.push(`${varName}: JWT token has expired`);
      hasErrors = true;
      return false;
    }
    
    return true;
  } catch (error) {
    errors.push(`${varName}: Cannot decode JWT token`);
    hasErrors = true;
    return false;
  }
};

// Check APP_ENV
console.log('📋 Checking environment selector...');
const APP_ENV = process.env.APP_ENV;
if (APP_ENV !== 'production') {
  warnings.push('APP_ENV: Should be set to "production" for production deployment');
  hasWarnings = true;
}
console.log(`   Environment: ${APP_ENV || 'development'} ${APP_ENV === 'production' ? '✅' : '⚠️'}`);

// Check Node environment
const NODE_ENV = process.env.NODE_ENV;
if (NODE_ENV !== 'production') {
  warnings.push('NODE_ENV: Should be set to "production" for production deployment');
  hasWarnings = true;
}

console.log('\n📋 Checking Supabase configuration...');

// Required Supabase variables
const supabaseUrl = process.env.PROD_SUPABASE_URL;
const supabaseAnonKey = process.env.PROD_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.PROD_SUPABASE_SERVICE_ROLE_KEY;

validateRequired('PROD_SUPABASE_URL', 'Production Supabase project URL');
validateRequired('PROD_SUPABASE_ANON_KEY', 'Production Supabase anonymous key');
validateRequired('PROD_SUPABASE_SERVICE_ROLE_KEY', 'Production Supabase service role key');

// Validate Supabase URL format
if (supabaseUrl) {
  if (!supabaseUrl.includes('.supabase.co')) {
    warnings.push('PROD_SUPABASE_URL: Does not appear to be a Supabase URL');
    hasWarnings = true;
  }
  validateUrl('PROD_SUPABASE_URL', supabaseUrl);
}

// Validate JWT tokens
if (supabaseAnonKey) {
  validateJWT('PROD_SUPABASE_ANON_KEY', supabaseAnonKey);
}
if (supabaseServiceKey) {
  validateJWT('PROD_SUPABASE_SERVICE_ROLE_KEY', supabaseServiceKey);
}

console.log(`   Supabase URL: ${supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'MISSING'} ${supabaseUrl ? '✅' : '❌'}`);
console.log(`   Anonymous Key: ${supabaseAnonKey ? 'SET' : 'MISSING'} ${supabaseAnonKey ? '✅' : '❌'}`);
console.log(`   Service Key: ${supabaseServiceKey ? 'SET' : 'MISSING'} ${supabaseServiceKey ? '✅' : '❌'}`);

console.log('\n📋 Checking URL configuration...');

// URL configuration
const frontendUrl = process.env.PROD_FRONTEND_URL;
const apiUrl = process.env.PROD_API_URL;
const corsOrigin = process.env.PROD_CORS_ORIGIN;

validateRequired('PROD_FRONTEND_URL', 'Production frontend URL');
validateRequired('PROD_API_URL', 'Production API URL');
validateRequired('PROD_CORS_ORIGIN', 'Production CORS origin');

// Validate URLs
if (frontendUrl) validateUrl('PROD_FRONTEND_URL', frontendUrl);
if (apiUrl) validateUrl('PROD_API_URL', apiUrl);
if (corsOrigin) validateUrl('PROD_CORS_ORIGIN', corsOrigin);

// Check URL consistency
if (frontendUrl && corsOrigin && frontendUrl !== corsOrigin) {
  warnings.push('PROD_FRONTEND_URL and PROD_CORS_ORIGIN should typically be the same');
  hasWarnings = true;
}

console.log(`   Frontend URL: ${frontendUrl || 'MISSING'} ${frontendUrl ? '✅' : '❌'}`);
console.log(`   API URL: ${apiUrl || 'MISSING'} ${apiUrl ? '✅' : '❌'}`);
console.log(`   CORS Origin: ${corsOrigin || 'MISSING'} ${corsOrigin ? '✅' : '❌'}`);

console.log('\n📋 Checking performance and security settings...');

// Performance settings
const rateLimit = process.env.PROD_RATE_LIMIT_MAX || '100';
const analysisRateLimit = process.env.PROD_ANALYSIS_RATE_LIMIT_MAX || '10';
const analysisTimeout = process.env.PROD_ANALYSIS_TIMEOUT || '60000';
const maxConcurrentAnalyses = process.env.PROD_MAX_CONCURRENT_ANALYSES || '10';

validateOptional('PROD_RATE_LIMIT_MAX', 'Global rate limit', '100');
validateOptional('PROD_ANALYSIS_RATE_LIMIT_MAX', 'Analysis rate limit', '10');
validateOptional('PROD_ANALYSIS_TIMEOUT', 'Analysis timeout', '60000');
validateOptional('PROD_MAX_CONCURRENT_ANALYSES', 'Max concurrent analyses', '10');

// Validate numeric values
if (isNaN(parseInt(rateLimit))) {
  errors.push('PROD_RATE_LIMIT_MAX: Must be a number');
  hasErrors = true;
}
if (isNaN(parseInt(analysisRateLimit))) {
  errors.push('PROD_ANALYSIS_RATE_LIMIT_MAX: Must be a number');
  hasErrors = true;
}

console.log(`   Rate Limit: ${rateLimit} req/window ${isNaN(parseInt(rateLimit)) ? '❌' : '✅'}`);
console.log(`   Analysis Rate Limit: ${analysisRateLimit} req/window ${isNaN(parseInt(analysisRateLimit)) ? '❌' : '✅'}`);
console.log(`   Analysis Timeout: ${analysisTimeout}ms ${isNaN(parseInt(analysisTimeout)) ? '❌' : '✅'}`);
console.log(`   Max Concurrent: ${maxConcurrentAnalyses} ${isNaN(parseInt(maxConcurrentAnalyses)) ? '❌' : '✅'}`);

// Security settings
const forceHttps = process.env.PROD_FORCE_HTTPS !== 'false';
const enableHelmet = process.env.PROD_ENABLE_HELMET !== 'false';
const debugMode = process.env.PROD_DEBUG === 'true';

console.log(`   Force HTTPS: ${forceHttps ? 'Enabled' : 'Disabled'} ${forceHttps ? '✅' : '⚠️'}`);
console.log(`   Helmet Security: ${enableHelmet ? 'Enabled' : 'Disabled'} ${enableHelmet ? '✅' : '⚠️'}`);
console.log(`   Debug Mode: ${debugMode ? 'Enabled' : 'Disabled'} ${!debugMode ? '✅' : '⚠️'}`);

if (debugMode) {
  warnings.push('PROD_DEBUG: Debug mode should be disabled in production');
  hasWarnings = true;
}

console.log('\n📋 Checking logging configuration...');

// Logging settings
const logLevel = process.env.PROD_LOG_LEVEL || 'info';
const validLogLevels = ['error', 'warn', 'info', 'debug'];

if (!validLogLevels.includes(logLevel)) {
  errors.push(`PROD_LOG_LEVEL: Must be one of ${validLogLevels.join(', ')}`);
  hasErrors = true;
}

console.log(`   Log Level: ${logLevel} ${validLogLevels.includes(logLevel) ? '✅' : '❌'}`);

console.log('\n📋 Checking optional services...');

// Optional services
const services = [
  { var: 'REDIS_URL', name: 'Redis' },
  { var: 'SENTRY_DSN', name: 'Sentry' },
  { var: 'SENDGRID_API_KEY', name: 'SendGrid' },
  { var: 'GOOGLE_CLIENT_ID', name: 'Google OAuth' },
  { var: 'GITHUB_CLIENT_ID', name: 'GitHub OAuth' }
];

services.forEach(service => {
  const isConfigured = !!process.env[service.var];
  console.log(`   ${service.name}: ${isConfigured ? 'Configured' : 'Not configured'} ${isConfigured ? '✅' : '⚪'}`);
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(60));

if (hasErrors) {
  console.log('\n❌ ERRORS FOUND:');
  errors.forEach(error => console.log(`   • ${error}`));
}

if (hasWarnings) {
  console.log('\n⚠️  WARNINGS:');
  warnings.forEach(warning => console.log(`   • ${warning}`));
}

if (!hasErrors && !hasWarnings) {
  console.log('\n🎉 All checks passed! Your production environment is properly configured.');
} else if (!hasErrors && hasWarnings) {
  console.log('\n✅ No critical errors found, but there are some warnings to consider.');
  console.log('   Your application should work, but consider addressing the warnings.');
} else {
  console.log('\n❌ Critical errors found! Please fix these before deploying to production.');
}

console.log('\nNext steps:');
if (hasErrors) {
  console.log('1. Fix all critical errors listed above');
  console.log('2. Re-run this validation script');
  console.log('3. Once validation passes, run: npm run build:production');
} else {
  console.log('1. Address any warnings if needed');
  console.log('2. Run production build: npm run build:production');
  console.log('3. Deploy using your preferred method');
  console.log('4. Run post-deployment health checks');
}

console.log('\n📚 For more information, see:');
console.log('   • docs/PRODUCTION_SECRETS_GUIDE.md');
console.log('   • docs/PRODUCTION_DEPLOYMENT.md');

// Exit with appropriate code
process.exit(hasErrors ? 1 : 0);