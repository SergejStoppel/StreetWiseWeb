# API Keys and Secrets Documentation - SiteCraft

## Overview
This document contains all the required API keys, secrets, and environment variables needed to run the SiteCraft application.

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
OPENAI_MODEL=gpt-3.5-turbo
```

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

### 3. Database (PostgreSQL)
**Service**: Primary database
**Purpose**: Store user data, audits, content, subscriptions

**Environment Variables**:
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/sitecraft_dev"
```

### 4. Redis (Background Jobs)
**Service**: Queue management and caching
**Purpose**: Handle background jobs for website scanning

**Environment Variables**:
```bash
REDIS_URL=redis://localhost:6379
```

### 5. JWT Authentication
**Service**: User authentication
**Purpose**: Secure API endpoints and user sessions

**Environment Variables**:
```bash
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_EXPIRES_IN=7d
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

## Setup Checklist

### Development Setup
- [ ] PostgreSQL database created and running
- [ ] Redis server running
- [ ] OpenAI API key obtained and added to .env
- [ ] Stripe test keys obtained and added to .env
- [ ] JWT secret generated and added to .env
- [ ] All environment variables configured in .env files
- [ ] Database migrations run successfully

### Production Setup
- [ ] Production database provisioned
- [ ] Production Redis provisioned
- [ ] Production API keys configured
- [ ] Stripe webhook endpoint configured
- [ ] Environment variables set in hosting platform
- [ ] Database migrations run in production 