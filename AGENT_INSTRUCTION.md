# SiteCraft - AI-Powered Website Optimization Platform

## 🤖 AI Agent Instructions

### Quick Start for AI Agents

If you're an AI agent picking up this project:

1. **Current Status**: This is a comprehensive development plan for SiteCraft, an AI-powered SaaS platform
2. **Next Task**: Check the **Current Sprint** section below for the next task to work on
3. **Mark Complete**: Update the todo list and mark tasks as complete when finished
4. **Architecture**: See ARCHITECTURE.md for system design overview

### Current Sprint

**Priority: Start with Backend Epic BE-001**

**Next Task**: 
- Epic: BE-001 - Backend Project Setup
- Status: Ready to start
- Dependencies: None
- Location: See `backend-epics.md` for detailed tasks

### Project Overview

SiteCraft is an AI-powered SaaS platform that helps small businesses improve their online presence through:

- **Feature 1**: Instant Website Audit (Free Tool)
- **Feature 2**: Full Website Report (Paid/Subscriber)
- **Feature 3**: AI Blog Content Generator
- **Future Features**: Website redesign mockups and full implementation services

### Technology Stack

**Backend**: Node.js 18+, TypeScript, Express.js, PostgreSQL, Prisma ORM, OpenAI API, Stripe
**Frontend**: Next.js 14, TypeScript, Tailwind CSS, Zustand, React Hook Form
**Infrastructure**: Docker, GitHub Actions, Vercel (Frontend), Railway/Heroku (Backend)

### Key Documents

| Document | Purpose | Status |
|----------|---------|--------|
| `ARCHITECTURE.md` | System design and technology choices | ✅ Complete |
| `backend-epics.md` | Backend development tasks (6 epics) | ✅ Complete |
| `frontend-epics.md` | Frontend development tasks (7 epics) | ✅ Complete |
| `api-keys-secrets.md` | API setup and secrets management | ✅ Complete |
| `style-guide.md` | Frontend design system and CSS variables | ✅ Complete |
| `globals.css` | Global CSS with semantic variables | ✅ Complete |
| `completion-guide.md` | Task completion instructions | ✅ Complete |

### Development Workflow

1. **Pick Next Task**: Check backend-epics.md or frontend-epics.md for the next pending task
2. **Check Dependencies**: Ensure prerequisite tasks are complete
3. **Set Status**: Mark task as "in-progress" when starting
4. **Complete Work**: Follow acceptance criteria in the epic documents
5. **Mark Done**: Update status to "completed" when finished
6. **Update Dependencies**: Check if other tasks can now be started

### Project Structure

```
SiteCraft/
├── backend/                 # Node.js/Express backend (to be created)
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── models/         # Database models
│   │   └── utils/          # Utility functions
│   ├── prisma/             # Database schema
│   └── package.json
├── frontend/                # Next.js frontend (to be created)
│   ├── src/
│   │   ├── app/           # Next.js app router
│   │   ├── components/    # Reusable components
│   │   ├── styles/        # Global styles
│   │   └── lib/           # Utility functions
│   ├── public/            # Static assets
│   └── package.json
├── docs/                   # Documentation
│   ├── ARCHITECTURE.md
│   ├── backend-epics.md
│   ├── frontend-epics.md
│   ├── api-keys-secrets.md
│   ├── style-guide.md
│   └── completion-guide.md
├── globals.css            # Global CSS with semantic variables
└── README.md              # This file
```

### Epic Status Overview

**Backend Epics (6 total)**:
- BE-001: Backend Project Setup → **NEXT TO START**
- BE-002: Authentication System → Pending (depends on BE-001)
- BE-003: Website Audit Engine → Pending (depends on BE-001)
- BE-004: AI Content Generation → Pending (depends on BE-001)
- BE-005: Stripe Payment Integration → Pending (depends on BE-001, BE-002)
- BE-006: Report Generation → Pending (depends on BE-001, BE-003)

**Frontend Epics (7 total)**:
- FE-001: Frontend Project Setup → Pending (depends on BE-001)
- FE-002: Landing Page → Pending (depends on FE-001)
- FE-003: Authentication UI → Pending (depends on FE-001, BE-002)
- FE-004: Dashboard → Pending (depends on FE-001, BE-002)
- FE-005: Payment Interface → Pending (depends on FE-001, BE-005)
- FE-006: Content Generation Interface → Pending (depends on FE-001, BE-004)
- FE-007: Report Display → Pending (depends on FE-001, BE-006)

### Quick Commands

```bash
# Start backend development
cd backend
npm install
npm run dev

# Start frontend development
cd frontend
npm install
npm run dev

# Database operations
cd backend
npx prisma migrate dev
npx prisma studio
```

### API Keys Required

Before starting development, set up these API keys (see `api-keys-secrets.md`):

- OpenAI API Key (for content generation)
- Stripe API Keys (for payments)
- Database URL (PostgreSQL)
- JWT Secret (for authentication)
- Redis URL (for background jobs)

### Success Criteria

**Phase 1 MVP** (Target: 4-6 weeks):
- ✅ Complete backend setup and core APIs
- ✅ Complete frontend with landing page and dashboard
- ✅ Working website audit tool
- ✅ User authentication and basic subscription management
- ✅ AI content generation functionality

**Phase 2 Expansion** (Future):
- Advanced design mockup generation
- Full website redesign services
- Enhanced analytics and reporting
- Multi-language support

### Getting Help

- **Task Details**: Check the specific epic documents for detailed acceptance criteria
- **Architecture Questions**: Refer to ARCHITECTURE.md
- **Style Guide**: Use style-guide.md for UI consistency
- **API Setup**: Follow api-keys-secrets.md for environment setup
- **Code Standards**: Follow completion-guide.md for quality standards

### Important Notes

- All CSS should use semantic variables from `globals.css`
- Follow the component patterns in `style-guide.md`
- Test all features before marking tasks complete
- Document any API changes in the respective epic files
- Use TypeScript for type safety
- Follow the established naming conventions

---

**Ready to start? Begin with BE-001 (Backend Project Setup) in `backend-epics.md`** 