# API Keys and Secrets Documentation - SiteCraft

## Overview
This document contains all the required API keys, secrets, and environment variables needed to run the SiteCraft application in development and production environments.

## Required API Keys and Services

### 1. OpenAI API
**Service**: AI content generation
**Purpose**: Generate blog post ideas and full blog posts
**Required for**: Content Generation (BE-004)

**Setup Instructions**:
1. Sign up at [OpenAI Platform](https://platform.openai.com/)
2. Navigate to API Keys section
3. Create new secret key
4. Copy the key (starts with `sk-`)

**Environment Variables**:
```bash
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-3.5-turbo  # or gpt-4 for better quality
```

**Usage Limits**:
- Free tier: $5 credit initially
- Pay-as-you-go: $0.002 per 1K tokens (GPT-3.5-turbo)
- Rate limits: 3 requests per minute (free tier)

### 2. Stripe Payment Processing
**Service**: Payment processing and subscription management
**Purpose**: Handle subscription payments and billing
**Required for**: Payment System (BE-005)

**Setup Instructions**:
1. Create account at [Stripe Dashboard](https://dashboard.stripe.com/)
2. Go to Developers → API Keys
3. Copy Publishable and Secret keys
4. Set up webhook endpoint for events

**Environment Variables**:
```bash
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Required Stripe Products**:
Create these products in Stripe Dashboard:
- Essentials Plan: $49/month
- Growth Plan: $149/month  
- Pro Plan: $399/month

### 3. Database (PostgreSQL)
**Service**: Primary database
**Purpose**: Store user data, audits, content, subscriptions
**Required for**: All backend functionality

**Development Setup**:
```bash
# Local PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/sitecraft_dev"

# Or use a cloud provider like Supabase, PlanetScale, or Railway
DATABASE_URL="postgresql://username:password@host:5432/database_name"
```

**Production Recommendations**:
- Supabase (free tier available)
- PlanetScale (serverless MySQL alternative)
- Railway (PostgreSQL hosting)
- AWS RDS (enterprise)

### 4. Redis (Background Jobs)
**Service**: Queue management and caching
**Purpose**: Handle background jobs for website scanning
**Required for**: Website Audit Engine (BE-003)

**Environment Variables**:
```bash
REDIS_URL=redis://localhost:6379
# Or for cloud Redis:
REDIS_URL=redis://username:password@host:port
```

**Provider Options**:
- Redis Labs (free tier available)
- Upstash (serverless Redis)
- Railway (Redis hosting)

### 5. Email Service (SendGrid)
**Service**: Email delivery
**Purpose**: Send reports, notifications, and marketing emails
**Required for**: Report delivery and user notifications

**Setup Instructions**:
1. Sign up at [SendGrid](https://sendgrid.com/)
2. Create API key in Settings → API Keys
3. Verify sender identity

**Environment Variables**:
```bash
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@sitecraft.com
FROM_NAME="SiteCraft"
```

### 6. JWT Authentication
**Service**: User authentication
**Purpose**: Secure API endpoints and user sessions
**Required for**: Authentication System (BE-002)

**Environment Variables**:
```bash
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_EXPIRES_IN=7d
```

**Security Note**: Generate a strong random secret:
```bash
# Generate secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Complete Environment Variables

### Backend (.env)
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/sitecraft_dev"

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_EXPIRES_IN=7d

# OpenAI API
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-3.5-turbo

# Stripe Payment
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Redis
REDIS_URL=redis://localhost:6379

# Email (SendGrid)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@sitecraft.com
FROM_NAME="SiteCraft"

# Application
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env.local)
```bash
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001

# Stripe (Public Key)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Application
NEXT_PUBLIC_APP_NAME=SiteCraft
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Cost Estimates

### Development (Monthly)
- OpenAI API: $10-20 (based on usage)
- Stripe: Free (no transaction fees in test mode)
- Database: Free (local PostgreSQL or free tier)
- Redis: Free (local or free tier)
- Email: Free (SendGrid free tier: 100 emails/day)
- **Total: $10-20/month**

### Production (Monthly)
- OpenAI API: $50-200 (based on usage)
- Stripe: 2.9% + 30¢ per transaction
- Database: $15-25 (managed PostgreSQL)
- Redis: $5-15 (managed Redis)
- Email: $15-25 (SendGrid paid plan)
- **Total: $85-265/month** (excluding transaction fees)

## Security Best Practices

### API Key Security
1. **Never commit API keys to version control**
2. **Use environment variables only**
3. **Rotate keys regularly**
4. **Use different keys for development and production**
5. **Set up monitoring for unusual API usage**

### Environment File Security
```bash
# Add to .gitignore
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

### Production Security
1. **Use secrets management service** (AWS Secrets Manager, Azure Key Vault)
2. **Enable API key restrictions where possible**
3. **Set up rate limiting**
4. **Monitor API usage and costs**
5. **Use HTTPS only in production**

## Setup Checklist

### Development Setup
- [ ] PostgreSQL database created and running
- [ ] Redis server running (or cloud Redis configured)
- [ ] OpenAI API key obtained and added to .env
- [ ] Stripe test keys obtained and added to .env
- [ ] SendGrid API key obtained and added to .env
- [ ] JWT secret generated and added to .env
- [ ] All environment variables configured in .env files
- [ ] Database migrations run successfully

### Production Setup
- [ ] Production database provisioned
- [ ] Production Redis provisioned
- [ ] Production API keys configured
- [ ] Stripe webhook endpoint configured
- [ ] Domain and SSL certificate configured
- [ ] Environment variables set in hosting platform
- [ ] Database migrations run in production
- [ ] Health checks configured

## Troubleshooting

### Common Issues

**OpenAI API Errors**:
- Check API key format (starts with `sk-`)
- Verify billing setup in OpenAI dashboard
- Check rate limits and quotas

**Stripe Integration Issues**:
- Verify webhook endpoint URL is accessible
- Check webhook secret matches environment variable
- Ensure test/live mode consistency

**Database Connection Issues**:
- Verify database URL format
- Check database server is running
- Verify network connectivity and firewall rules

**Redis Connection Issues**:
- Check Redis URL format
- Verify Redis server is running
- Check connection limits

### Support Resources
- OpenAI: [OpenAI Platform Help](https://help.openai.com/)
- Stripe: [Stripe Documentation](https://stripe.com/docs)
- SendGrid: [SendGrid Support](https://sendgrid.com/support/)
- PostgreSQL: [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- Redis: [Redis Documentation](https://redis.io/documentation) 