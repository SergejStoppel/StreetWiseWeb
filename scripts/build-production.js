#!/usr/bin/env node

/**
 * Production Build Script
 * 
 * This script optimizes the build process for production deployment
 * - Sets up environment variables correctly
 * - Runs build with production optimizations
 * - Validates the build output
 * - Generates build report
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting production build process...\n');

// Step 1: Environment validation
console.log('📋 Step 1: Validating environment configuration');

// Check if .env exists
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found! Please copy .env.example to .env and configure it.');
  process.exit(1);
}

// Load environment variables
require('dotenv').config({ path: envPath });

// Validate required production variables
const requiredVars = [
  'PROD_SUPABASE_URL',
  'PROD_SUPABASE_ANON_KEY',
  'PROD_SUPABASE_SERVICE_ROLE_KEY',
  'PROD_FRONTEND_URL',
  'PROD_API_URL'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Missing required production environment variables:');
  missingVars.forEach(varName => console.error(`   • ${varName}`));
  console.error('\nPlease configure these in your .env file.');
  process.exit(1);
}

console.log('✅ Environment validation passed');

// Step 2: Set up build environment
console.log('\n📋 Step 2: Setting up build environment');

// Ensure APP_ENV is set to production
process.env.APP_ENV = 'production';
process.env.NODE_ENV = 'production';

// Set React environment variables for production build
process.env.REACT_APP_ENV = 'production';
process.env.REACT_APP_SUPABASE_URL = process.env.PROD_SUPABASE_URL;
process.env.REACT_APP_SUPABASE_ANON_KEY = process.env.PROD_SUPABASE_ANON_KEY;
process.env.REACT_APP_API_URL = process.env.PROD_API_URL;
process.env.REACT_APP_ENVIRONMENT = 'production';
process.env.REACT_APP_DEBUG = 'false';
process.env.REACT_APP_ENABLE_ANALYTICS = process.env.PROD_ENABLE_ANALYTICS || 'true';
process.env.REACT_APP_ENABLE_SOCIAL_LOGIN = process.env.PROD_ENABLE_SOCIAL_LOGIN || 'false';
process.env.REACT_APP_MOCK_EXTERNAL_SERVICES = 'false';

// Build optimizations
process.env.GENERATE_SOURCEMAP = 'false'; // Disable source maps for production
process.env.INLINE_RUNTIME_CHUNK = 'false'; // Better caching
process.env.IMAGE_INLINE_SIZE_LIMIT = '8192'; // Inline small images

console.log('✅ Build environment configured');

// Step 3: Clean previous build
console.log('\n📋 Step 3: Cleaning previous build');
try {
  const buildPath = path.join(__dirname, '..', 'frontend', 'build');
  if (fs.existsSync(buildPath)) {
    execSync('rm -rf frontend/build', { 
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe'
    });
  }
  console.log('✅ Previous build cleaned');
} catch (error) {
  console.warn('⚠️  Warning: Could not clean previous build:', error.message);
}

// Step 4: Install dependencies
console.log('\n📋 Step 4: Installing dependencies');
try {
  console.log('   Installing root dependencies...');
  execSync('npm ci --only=production', { 
    cwd: path.join(__dirname, '..'),
    stdio: 'pipe'
  });
  
  console.log('   Installing frontend dependencies...');
  execSync('npm ci', { 
    cwd: path.join(__dirname, '..', 'frontend'),
    stdio: 'pipe'
  });
  
  console.log('   Installing backend dependencies...');
  execSync('npm ci --only=production', { 
    cwd: path.join(__dirname, '..', 'backend'),
    stdio: 'pipe'
  });
  
  console.log('✅ Dependencies installed');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Step 5: Build frontend
console.log('\n📋 Step 5: Building frontend application');
try {
  const startTime = Date.now();
  
  execSync('npm run build', { 
    cwd: path.join(__dirname, '..', 'frontend'),
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  const buildTime = Date.now() - startTime;
  console.log(`✅ Frontend build completed in ${(buildTime / 1000).toFixed(1)}s`);
} catch (error) {
  console.error('❌ Frontend build failed:', error.message);
  process.exit(1);
}

// Step 6: Validate build output
console.log('\n📋 Step 6: Validating build output');
const buildPath = path.join(__dirname, '..', 'frontend', 'build');

if (!fs.existsSync(buildPath)) {
  console.error('❌ Build directory not found!');
  process.exit(1);
}

// Check for required files
const requiredFiles = ['index.html', 'static/js', 'static/css'];
const missingFiles = requiredFiles.filter(file => 
  !fs.existsSync(path.join(buildPath, file))
);

if (missingFiles.length > 0) {
  console.error('❌ Missing required build files:');
  missingFiles.forEach(file => console.error(`   • ${file}`));
  process.exit(1);
}

// Check build size
const getBuildSize = (dir) => {
  let size = 0;
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      size += getBuildSize(filePath);
    } else {
      size += stats.size;
    }
  });
  
  return size;
};

const buildSize = getBuildSize(buildPath);
const buildSizeMB = (buildSize / 1024 / 1024).toFixed(2);

console.log(`✅ Build validation passed`);
console.log(`   Build size: ${buildSizeMB} MB`);

if (buildSize > 50 * 1024 * 1024) { // 50MB
  console.warn('⚠️  Warning: Build size is quite large. Consider code splitting and optimization.');
}

// Step 7: Generate build report
console.log('\n📋 Step 7: Generating build report');
const reportPath = path.join(__dirname, '..', 'build-report.json');
const report = {
  timestamp: new Date().toISOString(),
  environment: 'production',
  buildTime: Date.now(),
  buildSize: buildSize,
  buildSizeMB: buildSizeMB,
  nodeVersion: process.version,
  platform: process.platform,
  arch: process.arch,
  environmentVariables: {
    APP_ENV: process.env.APP_ENV,
    NODE_ENV: process.env.NODE_ENV,
    REACT_APP_ENV: process.env.REACT_APP_ENV,
    hasSupabaseUrl: !!process.env.REACT_APP_SUPABASE_URL,
    hasSupabaseKey: !!process.env.REACT_APP_SUPABASE_ANON_KEY,
    hasApiUrl: !!process.env.REACT_APP_API_URL
  }
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`✅ Build report saved to build-report.json`);

// Step 8: Success message
console.log('\n🎉 Production build completed successfully!');
console.log('\nNext steps:');
console.log('1. Test the build locally: cd frontend && npx serve -s build');
console.log('2. Deploy the frontend/build directory to your hosting platform');
console.log('3. Deploy the backend to your server infrastructure');
console.log('4. Configure your domain and SSL certificate');
console.log('5. Set up monitoring and analytics');
console.log('\n📊 Build Summary:');
console.log(`   • Build size: ${buildSizeMB} MB`);
console.log(`   • Environment: production`);
console.log(`   • Source maps: disabled`);
console.log(`   • Debug mode: disabled`);
console.log(`   • Analytics: ${process.env.REACT_APP_ENABLE_ANALYTICS === 'true' ? 'enabled' : 'disabled'}`);
console.log('\n🚀 Ready for deployment!');