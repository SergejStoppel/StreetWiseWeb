# StreetWiseWeb - Quick Reference Guide

**Generated:** November 20, 2025
**Project:** Multi-tenant Accessibility Analysis SaaS Platform
**Status:** Core features implemented, ~27% of production roadmap complete

---

## Quick Facts

| Item | Details |
|------|---------|
| **Project Name** | StreetWiseWeb / SiteCraft V3 |
| **Type** | Multi-tenant SaaS (Web Accessibility Analysis) |
| **Primary Purpose** | Automated WCAG compliance analysis with business impact scoring |
| **Code Size** | 14.5K backend LOC + 73 frontend files |
| **Tech Stack** | React 18 + TypeScript + Node.js + Express + Supabase + Redis |
| **Database** | PostgreSQL (Supabase) with 20+ tables |
| **Queue System** | BullMQ (Redis-backed) |
| **Deployment** | Docker + GitHub Actions + Supabase |
| **Production Ready** | No (Billing system incomplete) |
| **Estimated Time to Production** | 4-6 weeks for critical features |

---

## Core Features At A Glance

### Analysis Capabilities
- **Accessibility**: 12 detailed WCAG analysis modules (ARIA, contrast, forms, keyboard, media, structure, tables, etc.)
- **SEO**: Technical SEO, meta tags, structured data, Core Web Vitals
- **Performance**: Lighthouse integration, page speed, conversion impact
- **Coverage**: 100+ predefined analysis rules across all categories

### Workspace & Collaboration
- Multi-tenant workspaces with ownership
- Role-based access: Owner, Admin, Member
- Team member invitations and management
- Complete data isolation (RLS policies)

### Authentication & Security
- Supabase Auth (email/password, OAuth-ready)
- Password reset, email confirmation
- BCRYPT hashing, JWT tokens
- Rate limiting, CORS, Helmet security headers
- Row Level Security at database level

### Reporting
- Detailed analysis reports with scores (0-100)
- Priority matrix visualization
- Screenshot capture (desktop/mobile/tablet/full-page)
- Recommended fixes with code examples
- PDF/JSON export

---

## Technology Stack Highlights

### Frontend
```
React 18.2 + TypeScript + Styled Components + Axios + i18next
- 73 source files
- 20+ page components
- 3 language support (en, de, es)
- Dark/light mode theme
- Responsive design
```

### Backend
```
Node.js 18+ + Express + TypeScript + BullMQ
- 53 TypeScript files
- 14,561 lines of code
- 3-tier analysis pipeline (Master → Fetcher → Analyzers)
- 8 major API route groups
- Jest testing (2 tests)
```

### Database
```
Supabase PostgreSQL
- 12 migration files (versioned)
- 20+ tables across 6 categories
- RLS policies enabled
- 100+ seeded analysis rules
- Auto-backup, GDPR-ready
```

### Infrastructure
```
Docker + Docker Compose + GitHub Actions
- Multi-stage builds
- Health checks on all services
- Development, production, and simple configurations
- CI/CD via GitHub Actions
- Automated Supabase migrations
```

---

## Quick Commands

### Development
```bash
npm run install-all          # Install all dependencies
npm run dev                  # Start frontend + backend
npm run docker:dev           # Run with Docker
npm run build               # Build frontend
```

### Testing
```bash
npm run test                # Run all tests
cd backend && npm test      # Backend only
```

### Deployment
```bash
# Development (auto on main push)
git push origin main

# Production (auto on prod push after approval)
git push origin prod
```

### Monitoring
```bash
npm run health              # Check service health
npm run docker:logs         # View Docker logs
npm run docker:logs:backend # Backend logs only
```

---

## Architecture Overview

### Analysis Pipeline (3-Tier Workers)
```
1. Frontend Request
   ↓
2. Master Worker (orchestration)
   ↓
3. Fetcher Worker (asset capture)
   ↓
4. Parallel Analysis (3 workers)
   ├─ Accessibility Worker (12 modules)
   ├─ SEO Worker
   └─ Performance Worker
   ↓
5. Result Aggregation
   ↓
6. Frontend Display
```

### API Endpoints Summary
- **Auth** (8 endpoints): signup, signin, password reset, profile
- **Workspaces** (8 endpoints): CRUD, member management
- **Analysis** (4 endpoints): create, get results, get report, list
- **Reports** (1 endpoint): get detailed report
- **Billing** (3 endpoints): plans, checkout, subscription status
- **Health** (2 endpoints): health check with details

---

## Implementation Status

### Fully Implemented (✅)
- Authentication system (Supabase)
- Workspace management
- Analysis engine (3-tier pipeline)
- Accessibility analysis (12 modules)
- SEO analysis
- Performance analysis (Lighthouse)
- Report generation
- Screenshot capture
- Dark/light mode UI
- Multi-language support
- Docker containerization
- Health monitoring
- Security (Helmet, CORS, rate limiting)
- Database schema (comprehensive)
- CI/CD automation

### Partially Implemented (⚠️)
- Stripe integration (exists, incomplete)
- Billing/subscriptions (database tables exist, no enforcement)
- Audit logging (infrastructure in place, not integrated)
- AI features (OpenAI integration exists, not connected)
- Prometheus metrics (ready, not active)

### Not Implemented (❌)
- Subscription enforcement
- Usage limit enforcement
- Stripe webhooks
- Admin dashboard
- API access tokens
- Scheduled analyses
- Advanced team features
- Public API

---

## Environment Variables (Unified .env)

### Must Configure
```
APP_ENV=development|production
DEV_SUPABASE_URL / PROD_SUPABASE_URL
DEV_SUPABASE_ANON_KEY / PROD_SUPABASE_ANON_KEY
DEV_SUPABASE_SERVICE_ROLE_KEY / PROD_SUPABASE_SERVICE_ROLE_KEY
```

### Optional Configuration
```
STRIPE_SECRET_KEY
OPENAI_API_KEY
REDIS_URL
SENTRY_DSN
SENDGRID_API_KEY
```

### Auto-Generated (don't edit)
```
REACT_APP_SUPABASE_URL (from DEV_/PROD_ versions)
REACT_APP_SUPABASE_ANON_KEY (from DEV_/PROD_ versions)
REACT_APP_API_URL (from DEV_/PROD_ versions)
```

---

## Performance Characteristics

| Aspect | Dev | Prod |
|--------|-----|------|
| Analysis Timeout | 30s | 60s |
| Max Concurrent | 5 | 10 |
| Rate Limit | 1000/15min | 100/15min |
| Analysis Rate Limit | 50/15min | 10/15min |
| Log Level | debug | info |
| API Docs | Enabled | Disabled |

---

## Key Directories

```
/backend/               (14.5K LOC)
  ├── src/api/          API routes & middleware
  ├── src/core/         Business logic & workers
  ├── src/lib/          Shared libraries
  └── src/types/        TypeScript definitions

/frontend/              (73 files)
  ├── src/components/   UI components
  ├── src/pages/        Page components
  ├── src/services/     API clients
  ├── src/context/      Global state
  └── src/theme/        Styling

/database/              (12 SQL files)
  └── setup/            Migration scripts

/supabase/              (12 versioned migrations)
  └── migrations/       Version-controlled DB changes

/docs/                  (Implementation guides)
  └── backend-v2-plan/  Detailed technical specs

.github/workflows/      (CI/CD)
  ├── deploy-dev.yml    Auto-deploy on main push
  └── deploy-prod.yml   Auto-deploy on prod push
```

---

## Production Readiness Checklist

### Critical (Blocking)
- [ ] Complete Stripe webhook implementation
- [ ] Implement subscription enforcement
- [ ] Implement usage limit enforcement
- [ ] Complete audit logging middleware

### High Priority
- [ ] Increase test coverage (target: 80%)
- [ ] Add E2E tests
- [ ] Configure monitoring/alerting
- [ ] Admin dashboard for operations

### Medium Priority
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Advanced user features
- [ ] Integration marketplace
- [ ] Benchmark comparisons

### Low Priority
- [ ] Advanced reporting templates
- [ ] CI/CD pipeline integrations
- [ ] Additional language support
- [ ] Mobile app

---

## Known Issues

1. **WSL2 Volume Mounting**: Docker Compose dev disables volume mounts to prevent EIO errors
2. **Memory Usage**: Frontend container has 4GB limit (React build is memory-intensive)
3. **Puppeteer**: Requires system Chromium packages in Docker
4. **Rate Limiting**: Only active in production (disabled in dev)
5. **AI Features**: OpenAI integration exists but not connected to pipeline
6. **Email Service**: Only Supabase auth emails work currently

---

## Cost Structure

### Current Stack Cost
- **Supabase Free Tier**: $0/month
  - PostgreSQL database (500MB)
  - Authentication
  - File storage (1GB)
  - Row Level Security
  - Auto-backups

### Potential Upgrades
- Supabase Pro: $25/month (2GB database)
- Custom domain: $15/month
- Analytics/monitoring: $50-100/month
- **Total for scaled operation**: $50-100/month

### Competitor Costs (Alternative Stack)
- Traditional database (AWS RDS): $20-50/month
- Authentication service: $10-20/month
- File storage: $5-10/month
- Infrastructure: $20-50/month
- **Total**: $55-130/month

**Your Savings**: $600-1,560/year using Supabase

---

## Next Steps (from NEXT_STEPS.md)

### Phase 1: Critical Path (4-6 weeks)
1. **Weeks 1-2**: Complete Stripe integration
   - Webhook implementation
   - Checkout session creation
   - Subscription status enforcement

2. **Weeks 2-3**: Security hardening
   - Complete RLS verification
   - Audit logging middleware
   - Service role authentication

3. **Weeks 3-4**: Operations
   - Email notifications
   - Admin dashboard
   - Usage tracking

4. **Weeks 4-6**: Quality & Compliance
   - Increase test coverage
   - Compliance verification
   - Performance optimization

---

## Useful References

### Documentation Files
- `PROJECT_ANALYSIS.md` - Comprehensive project analysis (this repo)
- `README.md` - Feature overview and tech stack
- `NEXT_STEPS.md` - Production launch roadmap
- `DEPLOYMENT.md` - Deployment guide
- `DOCKER.md` - Docker configuration guide

### Configuration Files
- `.env.example` - Unified environment template
- `docker-compose.yml` - Production setup
- `docker-compose.dev.yml` - Development setup
- `docker-compose.prod.yml` - Production with Nginx

### Key Source Files
- `backend/src/server.ts` - Express app setup
- `backend/src/api/routes/` - API endpoints
- `backend/src/core/workers/` - Analysis pipeline
- `frontend/src/pages/` - React pages
- `database/setup/` - Database schema

---

## Support Resources

### Within Project
- `docs/` - Implementation plans and technical specs
- `backend/README.md` - Backend architecture guide
- `CLAUDE.md` - AI development instructions

### Community & Tools
- Supabase Docs: https://supabase.com/docs
- Express.js: https://expressjs.com
- React: https://react.dev
- BullMQ: https://docs.bullmq.io

---

**Last Updated:** November 20, 2025
**Maintainer:** Development Team
**Status:** Actively developed, pre-production

