# Production Setup Prerequisites

This document outlines the manual setup steps required before implementing the production-ready features for StreetWiseWeb.

## 📋 **Phase 1: Essential Services Setup (Can proceed after this)**

### 1. **Database Setup - Supabase** ⭐ **START HERE**

**Why first:** Database is required for user management, but we can implement basic auth without full production deployment.

**Steps:**
1. Go to [supabase.com](https://supabase.com)
2. Create a new account/organization
3. Create a new project:
   - **Project Name**: `streetwiseweb-production`
   - **Database Password**: Generate secure password (save this!)
   - **Region**: Choose closest to your target users
4. Wait for project to initialize (2-3 minutes)
5. Navigate to **Settings > API** and copy:
   - `Project URL` (starts with https://...)
   - `anon public key` (starts with eyJ...)
   - `service_role secret` (starts with eyJ... - keep this secure!)

**What you'll get:**
- PostgreSQL database
- Built-in authentication system
- Real-time subscriptions
- Auto-generated REST API

**After this step:** I can start implementing database models and basic authentication.

---

### 2. **Error Tracking - Sentry** ⭐ **RECOMMENDED**

**Why important:** Essential for production monitoring and debugging.

**Steps:**
1. Go to [sentry.io](https://sentry.io)
2. Create account (free tier: 5k errors/month)
3. Create new project:
   - **Platform**: Node.js
   - **Project Name**: `streetwiseweb-backend`
4. Copy the DSN (Data Source Name) URL
5. Create another project for frontend:
   - **Platform**: React
   - **Project Name**: `streetwiseweb-frontend`
6. Copy the frontend DSN URL

**What you'll get:**
- Real-time error tracking
- Performance monitoring
- Release tracking
- User context with errors

**After this step:** I can implement error tracking throughout the application.

---

## 📋 **Phase 2: Development Environment (Next priority)**

### 3. **Redis Setup - Upstash** ⭐ **FOR CACHING**

**Why needed:** Session management and caching for better performance.

**Steps:**
1. Go to [upstash.com](https://upstash.com)
2. Sign up (free tier: 10k requests/day)
3. Create new Redis database:
   - **Name**: `streetwiseweb-cache`
   - **Region**: Same as your Supabase region
   - **Type**: Regional (cheaper)
4. Copy connection details:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

**Alternative (Local Development):**
```bash
# Install Redis locally for development
# Windows (using Chocolatey):
choco install redis-64

# Or use Docker:
docker run -d -p 6379:6379 redis:alpine
```

**After this step:** I can implement session management and caching.

---

### 4. **Environment Variables Setup**

**Create these files locally:**

**`.env.development`** (for local development):
```bash
# Database
DATABASE_URL=postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Redis
REDIS_URL=redis://localhost:6379
# OR for Upstash:
# REDIS_URL=rediss://xxx.upstash.io:6380

# Security
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
SESSION_SECRET=your-super-secret-session-key-minimum-32-characters

# Error Tracking
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Server Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Analysis Configuration
ANALYSIS_TIMEOUT=30000
MAX_CONCURRENT_ANALYSES=5
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

**`.env.production`** (for production deployment):
```bash
# Database (same as development but production instance)
DATABASE_URL=postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Redis (production instance)
REDIS_URL=rediss://xxx.upstash.io:6380

# Security (DIFFERENT from development)
JWT_SECRET=production-super-secret-jwt-key-minimum-32-characters
SESSION_SECRET=production-super-secret-session-key-minimum-32-characters

# Error Tracking (same project, different environment)
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ENVIRONMENT=production

# Server Configuration
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://yourdomain.com

# Analysis Configuration (stricter limits)
ANALYSIS_TIMEOUT=30000
MAX_CONCURRENT_ANALYSES=3
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=50
```

**After this step:** I can implement environment-specific configurations.

---

## 📋 **Phase 3: CI/CD and Deployment (Later)**

### 5. **GitHub Secrets Configuration**

**Navigate to:** Your repository > Settings > Secrets and variables > Actions

**Add these secrets:**

**Database & Services:**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `REDIS_URL`

**Security:**
- `JWT_SECRET`
- `SESSION_SECRET`
- `SENTRY_DSN`

**Deployment (when ready):**
- `PRODUCTION_HOST` (server IP/domain)
- `PRODUCTION_USER` (SSH username)
- `PRODUCTION_SSH_KEY` (private SSH key)

### 6. **Domain and SSL (Production deployment)**

**When ready for production:**
1. Purchase domain (Namecheap, GoDaddy, etc.)
2. Set up CloudFlare (free tier for SSL/CDN)
3. Configure DNS records
4. Set up SSL certificates

---

## 🚀 **Implementation Phases**

### **Phase 1: Database + Auth (Week 1)**
**Prerequisites needed:**
- ✅ Supabase project
- ✅ Local .env.development file
- ✅ Sentry project (optional but recommended)

**I can implement:**
- Database models and migrations
- User authentication system
- Basic user management
- Protected API routes

### **Phase 2: Caching + Sessions (Week 2)**
**Prerequisites needed:**
- ✅ Redis setup (Upstash or local)
- ✅ Updated environment variables

**I can implement:**
- Session management
- Analysis result caching
- Rate limiting improvements
- Performance optimizations

### **Phase 3: CI/CD Pipeline (Week 3)**
**Prerequisites needed:**
- ✅ GitHub secrets configured
- ✅ Production environment variables ready

**I can implement:**
- GitHub Actions workflows
- Automated testing
- Security scanning
- Deployment automation

### **Phase 4: Production Deployment (Week 4)**
**Prerequisites needed:**
- ✅ Server/hosting setup
- ✅ Domain and SSL
- ✅ Production database

**I can implement:**
- Production Docker configurations
- Monitoring and alerting
- Backup procedures
- Performance optimization

---

## 🔧 **Quick Start (Minimum to begin)**

**To start development immediately, you only need:**

1. **Supabase project** (15 minutes setup)
2. **Create `.env.development`** file with Supabase credentials
3. **Update `.gitignore`** to exclude `.env*` files

**I can then begin implementing:**
- Database connection
- User models
- Basic authentication
- User registration/login endpoints

This approach allows us to make progress incrementally without waiting for full production setup.

---

## 🆘 **If You Get Stuck**

**Supabase Issues:**
- Check project initialization is complete
- Verify database password is correct
- Ensure you copied the full URLs/keys

**Environment Issues:**
- Double-check .env file format (no spaces around =)
- Verify file is in correct directory
- Check file is not committed to git

**Redis Issues:**
- For local: ensure Redis is running
- For Upstash: check connection URL format
- Test connection with Redis CLI

**Next Steps:**
Once you've completed Phase 1 setup, let me know and I'll start implementing the database layer and authentication system!