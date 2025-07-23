# Production Deployment Guide

This guide covers the complete production deployment process for StreetWiseWeb.

## 🚀 Quick Start

### Option 1: Automated Production Build
```bash
# Run the complete production build process
npm run build:production
```

This script will:
- ✅ Validate environment configuration
- ✅ Set up build environment correctly  
- ✅ Clean previous builds
- ✅ Install production dependencies
- ✅ Build optimized frontend
- ✅ Validate build output
- ✅ Generate build report

### Option 2: Manual Build Process
```bash
# 1. Set environment
export APP_ENV=production

# 2. Install dependencies
npm run install-all

# 3. Build frontend
npm run build:prod

# 4. Test build locally
cd frontend && npx serve -s build -l 3000
```

---

## 📋 Pre-Deployment Checklist

### Environment Configuration
- [ ] Production `.env` file configured with real credentials
- [ ] `APP_ENV=production` set
- [ ] All required production environment variables set
- [ ] Database schema deployed to production Supabase project
- [ ] Row Level Security (RLS) policies enabled

### Security
- [ ] Debug mode disabled (`REACT_APP_DEBUG=false`)
- [ ] Console logs removed from production build
- [ ] Source maps disabled (`GENERATE_SOURCEMAP=false`)
- [ ] Rate limiting configured appropriately
- [ ] CORS origins set to production domains only
- [ ] Helmet security middleware enabled

### Performance
- [ ] Production database optimized (indexes, materialized views)
- [ ] CDN configured for static assets
- [ ] Image optimization enabled
- [ ] Code splitting implemented
- [ ] Bundle size under acceptable limits

---

## 🌐 Deployment Options

### Option 1: Vercel (Recommended for Frontend)

#### Setup
```bash
# Install Vercel CLI
npm i -g vercel

# Login and deploy
vercel login
vercel --prod
```

#### Configuration
Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://your-backend-domain.com/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "frontend/build/$1"
    }
  ],
  "env": {
    "REACT_APP_ENV": "production",
    "REACT_APP_SUPABASE_URL": "@prod_supabase_url",
    "REACT_APP_SUPABASE_ANON_KEY": "@prod_supabase_anon_key",
    "REACT_APP_API_URL": "@prod_api_url"
  }
}
```

### Option 2: Railway (Full-Stack)

#### Setup
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up --detach
```

#### Configuration
Create `railway.json`:
```json
{
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health"
  }
}
```

### Option 3: Docker Production

#### Create Production Dockerfile
```dockerfile
# Multi-stage build for frontend
FROM node:18-alpine as frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production
COPY frontend/ ./
RUN npm run build

# Backend production image
FROM node:18-alpine as backend
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ ./

# Final production image
FROM node:18-alpine
WORKDIR /app

# Copy backend
COPY --from=backend /app /app

# Copy frontend build
COPY --from=frontend-build /app/frontend/build /app/public

# Install production dependencies
RUN npm ci --only=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S streetwise -u 1001
USER streetwise

EXPOSE 3005
CMD ["npm", "start"]
```

#### Docker Compose Production
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3005:3005"
    environment:
      - APP_ENV=production
      - NODE_ENV=production
    env_file:
      - .env.production
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
```

### Option 4: AWS / GCP / Azure

#### AWS Elastic Beanstalk
```bash
# Install EB CLI
pip install awsebcli

# Initialize and deploy
eb init
eb create production
eb deploy
```

#### Google Cloud Run
```bash
# Build and deploy
gcloud builds submit --tag gcr.io/PROJECT-ID/streetwiseweb
gcloud run deploy --image gcr.io/PROJECT-ID/streetwiseweb --platform managed
```

---

## 🔧 Environment Variables for Production

### Frontend (React)
```bash
REACT_APP_ENV=production
REACT_APP_SUPABASE_URL=https://your-prod-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ...your-prod-anon-key...
REACT_APP_API_URL=https://yourdomain.com
REACT_APP_ENVIRONMENT=production
REACT_APP_DEBUG=false
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_SOCIAL_LOGIN=false
REACT_APP_MOCK_EXTERNAL_SERVICES=false
```

### Backend (Node.js)
```bash
APP_ENV=production
NODE_ENV=production
PORT=3005

# Supabase Production
PROD_SUPABASE_URL=https://your-prod-project.supabase.co
PROD_SUPABASE_ANON_KEY=eyJ...your-prod-anon-key...
PROD_SUPABASE_SERVICE_ROLE_KEY=eyJ...your-prod-service-role-key...

# URLs
PROD_FRONTEND_URL=https://yourdomain.com
PROD_API_URL=https://yourdomain.com
PROD_CORS_ORIGIN=https://yourdomain.com

# Performance & Security
PROD_RATE_LIMIT_WINDOW=900000
PROD_RATE_LIMIT_MAX=100
PROD_ANALYSIS_RATE_LIMIT_MAX=10
PROD_ANALYSIS_TIMEOUT=60000
PROD_MAX_CONCURRENT_ANALYSES=10
PROD_LOG_LEVEL=info
PROD_DEBUG=false
PROD_FORCE_HTTPS=true
PROD_ENABLE_HELMET=true
```

---

## 🔍 Post-Deployment Verification

### Health Checks
```bash
# Backend health
curl https://yourdomain.com/api/health

# Frontend accessibility
curl -I https://yourdomain.com

# Database connectivity
curl https://yourdomain.com/api/analysis/stats
```

### Performance Testing
```bash
# Lighthouse audit
npx lighthouse https://yourdomain.com --output html --output-path report.html

# Load testing
npx artillery quick --count 10 --num 50 https://yourdomain.com
```

### Security Verification
```bash
# SSL/TLS check
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Security headers
curl -I https://yourdomain.com
```

---

## 📊 Monitoring and Analytics

### Application Monitoring
```javascript
// Optional: Add to backend/config/monitoring.js
const Sentry = require('@sentry/node');

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}
```

### Database Monitoring
- Monitor Supabase dashboard for API usage
- Set up alerts for high error rates
- Track query performance

### Infrastructure Monitoring
- Set up uptime monitoring (UptimeRobot, Pingdom)
- Configure log aggregation (Logtail, DataDog)
- Monitor resource usage (CPU, memory, disk)

---

## 🚨 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache and retry
rm -rf node_modules package-lock.json
npm install
npm run build:production
```

#### Environment Variable Issues
```bash
# Verify variables are set
node -e "console.log(process.env.PROD_SUPABASE_URL)"

# Check build environment
npm run build:env
```

#### CORS Errors
- Verify `PROD_CORS_ORIGIN` matches your domain exactly
- Check that domain has proper SSL certificate
- Ensure no trailing slashes in URLs

#### Database Connection Issues
- Verify Supabase project is active
- Check service role key permissions
- Review RLS policies

### Rollback Procedure
1. Keep previous build artifacts
2. Maintain database migration history
3. Have environment variable backups
4. Test rollback procedure in staging

---

## 📈 Performance Optimization

### Bundle Analysis
```bash
# Analyze bundle size
cd frontend
npm install -g webpack-bundle-analyzer
npx webpack-bundle-analyzer build/static/js/*.js
```

### Image Optimization
```bash
# Optimize images before deployment
npm install -g imagemin-cli
imagemin frontend/public/images/* --out-dir=frontend/public/images/optimized
```

### CDN Configuration
```javascript
// For static assets
const CDN_URL = process.env.REACT_APP_CDN_URL || '';
<img src={`${CDN_URL}/images/logo.png`} alt="Logo" />
```

---

## 🔐 Security Hardening

### SSL/TLS Configuration
```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
}
```

### Rate Limiting
```javascript
// Adjust based on your needs
PROD_RATE_LIMIT_MAX=100  // requests per window
PROD_ANALYSIS_RATE_LIMIT_MAX=10  // analysis requests per window
```

---

## 📝 Maintenance

### Regular Tasks
- Monitor error rates and performance metrics
- Update dependencies monthly
- Rotate Supabase service role keys quarterly
- Review and optimize database queries
- Update SSL certificates before expiry

### Backup Strategy
- Database: Automatic Supabase backups
- Code: Git repository with tags for releases
- Configuration: Secure backup of environment variables
- Build artifacts: Keep last 3 production builds

---

## 🎯 Success Metrics

After deployment, monitor these key metrics:
- **Uptime**: Target 99.9%
- **Response time**: < 2 seconds for analysis requests
- **Error rate**: < 1% of requests
- **Build size**: Frontend bundle < 5MB
- **Security**: No critical vulnerabilities
- **Performance**: Lighthouse score > 90

---

Ready to deploy? Run `npm run build:production` to get started! 🚀