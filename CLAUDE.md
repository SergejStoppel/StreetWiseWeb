# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SiteCraft is an AI-powered SaaS platform for small businesses to improve their online presence through automated website audits, AI-generated content, and optimization services.

**Current Status**: Planning phase - implementation ready to begin with BE-001 (Backend Project Setup)

## Technology Stack

### Backend
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens
- **AI Integration**: OpenAI API (GPT-4)
- **Background Jobs**: Bull Queue with Redis
- **Payments**: Stripe integration

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS with semantic CSS variables
- **State Management**: Zustand
- **Forms**: React Hook Form
- **UI Components**: Headless UI + Custom components

## Architecture Overview

The application follows a modular architecture with clear separation between:
- **Audit Engine**: Website scanning and analysis
- **Content Generator**: AI-powered content creation
- **Report Generator**: PDF and HTML report generation
- **User Management**: Authentication and user profiles
- **Payment System**: Subscription management via Stripe

## Development Commands

### Backend (Node.js/Express)
```bash
# Setup (after BE-001 completion)
cd backend
npm install
npm run dev

# Database operations
npx prisma migrate dev
npx prisma studio
npx prisma generate

# Testing
npm test
npm run test:watch
```

### Frontend (Next.js)
```bash
# Setup (after FE-001 completion)
cd frontend
npm install
npm run dev

# Building
npm run build
npm run start

# Linting
npm run lint
npm run lint:fix
```

## Key Development Files

### Essential Configuration Files
- `backend-epics.md` - Complete backend development plan (6 epics)
- `frontend-epics.md` - Complete frontend development plan (7 epics)
- `ARCHITECTURE.md` - System architecture and design principles
- `style-guide.md` - Frontend design system with semantic CSS variables
- `completion-guide.md` - Task completion standards and testing checklist
- `api-keys-secrets.md` - Required API keys and environment setup

### Global Styles
- `globals.css` - Contains semantic CSS variables for consistent UI
- All components should use CSS variables from the style guide
- Variables are context-specific (e.g., `--bg-card`, `--text-primary`)

## Epic-Based Development Process

### Backend Epic Order
1. **BE-001**: Project Setup & Infrastructure (START HERE)
2. **BE-002**: User Authentication System
3. **BE-003**: Website Audit Engine
4. **BE-004**: Content Generation System
5. **BE-005**: Payment & Subscription System
6. **BE-006**: Report Generation System

### Frontend Epic Order
1. **FE-001**: Project Setup & Foundation
2. **FE-002**: Landing Page & Marketing
3. **FE-003**: User Authentication System
4. **FE-004**: User Dashboard
5. **FE-005**: Payment & Subscription Interface
6. **FE-006**: Content Generation Interface
7. **FE-007**: Report Display & Download

### Dependencies
- All Frontend epics depend on FE-001 completion
- Frontend auth (FE-003) depends on Backend auth (BE-002)
- Frontend audit features depend on Backend audit (BE-003)
- Frontend content generation depends on Backend content (BE-004)

## Core API Structure

### Authentication Endpoints
```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
GET  /api/auth/me
```

### Audit Endpoints
```
POST /api/audits/scan
GET  /api/audits/:id
GET  /api/audits/website/:websiteId
```

### Content Generation Endpoints
```
POST /api/content/generate-ideas
POST /api/content/generate-post
GET  /api/content/history
```

### Payment Endpoints
```
POST /api/payments/create-subscription
GET  /api/payments/subscription-status
POST /api/payments/cancel-subscription
```

## Development Standards

### Code Quality
- **TypeScript**: Strict typing, no `any` usage
- **Testing**: Comprehensive error handling and edge case coverage
- **Security**: Input validation, rate limiting, secure authentication
- **Performance**: Optimized queries, efficient algorithms, caching

### UI/UX Standards
- Use semantic CSS variables from `style-guide.md`
- Follow component patterns for consistency
- Implement responsive design (mobile-first)
- Ensure accessibility compliance (WCAG 2.1)

## Required Environment Variables

### Backend
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/sitecraft
JWT_SECRET=your-jwt-secret-key
OPENAI_API_KEY=sk-your-openai-key
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
REDIS_URL=redis://localhost:6379
```

### Frontend
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
```

## File Structure (Post-Setup)

```
SiteCraft/
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Custom middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   └── app.ts          # Express app setup
│   ├── prisma/             # Database schema
│   └── package.json
├── frontend/                # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js app router
│   │   ├── components/    # Reusable components
│   │   ├── lib/           # Utility functions
│   │   └── styles/        # Global styles
│   ├── public/            # Static assets
│   └── package.json
└── docs/                   # Documentation
```

## Testing Strategy

### Backend Testing
- Unit tests for all services and utilities
- Integration tests for API endpoints
- Database operation tests
- Authentication flow tests

### Frontend Testing
- Component unit tests
- Integration tests for forms and user flows
- End-to-end testing for critical paths
- Accessibility testing

## Common Tasks

### Adding New Features
1. Define the feature in appropriate epic document
2. Create database migrations if needed
3. Implement backend API endpoints
4. Add frontend components and pages
5. Update documentation

### Debugging
- Check browser console for frontend errors
- Review backend logs for API issues
- Use Prisma Studio for database inspection
- Test API endpoints with curl or Postman

### Performance Optimization
- Use React.memo for expensive components
- Implement proper caching strategies
- Optimize database queries
- Use Next.js Image optimization

## Critical Success Factors

1. **Follow Epic Order**: Complete epics in dependency order
2. **Use Semantic CSS**: Always use variables from style-guide.md
3. **Test Thoroughly**: Follow completion-guide.md testing checklist
4. **Document Changes**: Update relevant epic documents when complete
5. **Security First**: Validate all inputs and implement proper authentication

## Next Steps

**Current Priority**: Start with BE-001 (Backend Project Setup) in `backend-epics.md`

This epic contains detailed, step-by-step instructions for initializing the Node.js backend project with all necessary dependencies and configuration.