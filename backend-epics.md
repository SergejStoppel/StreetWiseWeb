# Backend Development Epics - SiteCraft Phase 1

## Epic Structure
- **Epic ID**: Unique identifier
- **Priority**: High/Medium/Low  
- **Status**: Not Started/In Progress/Completed/Blocked
- **Dependencies**: List of prerequisite epics/tasks
- **Estimated Time**: Development time estimate

---

## Epic 1: Project Setup and Infrastructure
**Epic ID**: BE-001  
**Priority**: High  
**Status**: Completed ✅  
**Dependencies**: None  
**Estimated Time**: 1-2 days

### Tasks

#### BE-001-01: Initialize Node.js Project ✅
**Priority**: High  
**Dependencies**: None  
**Estimated Time**: 2 hours  
**Status**: Completed

**Description**: Set up the basic Node.js project structure with Express.js

**Detailed Instructions**:
1. Create a new directory `sitecraft-backend`
2. Initialize npm project: `npm init -y`
3. Install core dependencies:
   ```bash
   npm install express cors helmet morgan dotenv
   npm install -D nodemon @types/node typescript ts-node
   ```
4. Create `src/` directory structure:
   ```
   src/
   ├── controllers/
   ├── middleware/
   ├── models/
   ├── routes/
   ├── services/
   ├── utils/
   └── app.ts
   ```
5. Create `tsconfig.json` with proper TypeScript configuration
6. Create `package.json` scripts for development and production
7. Create `.env.example` file with required environment variables

**Acceptance Criteria**:
- Server starts without errors
- TypeScript compilation works
- Basic Express app responds to GET /health endpoint
- Environment variables are properly configured

**Files to Create**:
- `package.json`
- `tsconfig.json` 
- `src/app.ts`
- `src/server.ts`
- `.env.example`

#### BE-001-02: Database Setup with Prisma ✅
**Priority**: High  
**Dependencies**: BE-001-01  
**Estimated Time**: 3 hours  
**Status**: Completed

**Description**: Set up PostgreSQL database with Prisma ORM

**Detailed Instructions**:
1. Install Prisma dependencies:
   ```bash
   npm install prisma @prisma/client
   npm install -D prisma
   ```
2. Initialize Prisma: `npx prisma init`
3. Configure `schema.prisma` with initial models:
   ```prisma
   model User {
     id        String   @id @default(cuid())
     email     String   @unique
     password  String
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
     
     websites  Website[]
     audits    Audit[]
   }
   
   model Website {
     id        String   @id @default(cuid())
     url       String
     userId    String?
     user      User?    @relation(fields: [userId], references: [id])
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
     
     audits    Audit[]
   }
   
   model Audit {
     id          String   @id @default(cuid())
     websiteId   String
     website     Website  @relation(fields: [websiteId], references: [id])
     userId      String?
     user        User?    @relation(fields: [userId], references: [id])
     auditType   String
     scores      Json
     issues      Json
     createdAt   DateTime @default(now())
   }
   ```
4. Create database connection utility in `src/utils/db.ts`
5. Add database URL to environment variables
6. Run initial migration: `npx prisma migrate dev --name init`

**Acceptance Criteria**:
- Database schema is created successfully
- Prisma client generates without errors
- Database connection works
- All models are properly defined with relationships

**Files to Create**:
- `prisma/schema.prisma`
- `src/utils/db.ts`
- Migration files

#### BE-001-03: Basic Express Server Setup ✅
**Priority**: High  
**Dependencies**: BE-001-01  
**Estimated Time**: 2 hours  
**Status**: Completed

**Description**: Create the basic Express server with middleware and routing structure

**Detailed Instructions**:
1. Create `src/app.ts` with Express app configuration
2. Create `src/server.ts` to start the server
3. Create route handlers structure in `src/routes/`
4. Create error handling middleware in `src/middleware/errorHandler.ts`
5. Create validation middleware in `src/middleware/validation.ts`

**Acceptance Criteria**:
- Server starts on specified port
- Health check endpoint responds correctly
- CORS and security middleware are properly configured
- Error handling middleware catches and formats errors

**Files to Create**:
- `src/app.ts`
- `src/server.ts`
- `src/middleware/errorHandler.ts`
- `src/middleware/validation.ts`
- `src/routes/index.ts`

---

## Epic 2: Website Audit Engine (Core MVP Feature)
**Epic ID**: BE-002  
**Priority**: High  
**Status**: Not Started  
**Dependencies**: BE-001  
**Estimated Time**: 3-4 days

### Overview
This epic focuses on building the core website auditing functionality that provides immediate value to users without requiring authentication. Users can scan any website and get instant SEO, accessibility, and performance insights.

### Tasks

#### BE-002-01: Website Scanning Service
**Priority**: High  
**Dependencies**: BE-001-03  
**Estimated Time**: 4 hours

**Description**: Create service to scan websites and extract basic information

**Detailed Instructions**:
1. Install required dependencies:
   ```bash
   npm install puppeteer cheerio url-parse lighthouse
   npm install -D @types/url-parse
   ```
2. Create `src/services/websiteScanner.ts` with scanning logic
3. Add URL validation utility
4. Add error handling for invalid URLs and timeouts
5. Add user agent configuration for better website compatibility

**Acceptance Criteria**:
- Can successfully scan valid websites
- Extracts title, description, headings, images, and links
- Handles errors gracefully (timeouts, invalid URLs)
- Returns structured data in consistent format

**Files to Create**:
- `src/services/websiteScanner.ts`
- `src/utils/urlValidator.ts`

#### BE-002-02: SEO Analysis Service
**Priority**: High  
**Dependencies**: BE-002-01  
**Estimated Time**: 3 hours

**Description**: Create service to analyze SEO aspects of scanned websites

**Detailed Instructions**:
1. Create `src/services/seoAnalyzer.ts` with SEO analysis logic
2. Add comprehensive SEO checks:
   - Title tag optimization (length, uniqueness)
   - Meta description (presence, length)
   - Heading hierarchy (H1-H6 structure)
   - Image alt text analysis
   - Internal/external link analysis
   - Page loading speed assessment
3. Implement scoring algorithm based on issue severity
4. Create recommendation engine with actionable suggestions

**Acceptance Criteria**:
- Identifies common SEO issues accurately
- Provides actionable recommendations
- Calculates meaningful SEO score (0-100)
- Categorizes issues by type and severity

**Files to Create**:
- `src/services/seoAnalyzer.ts`

#### BE-002-03: Accessibility Analysis Service
**Priority**: High  
**Dependencies**: BE-002-01  
**Estimated Time**: 3 hours

**Description**: Create service to analyze accessibility aspects of scanned websites

**Detailed Instructions**:
1. Create `src/services/accessibilityAnalyzer.ts` with accessibility checks
2. Implement accessibility checks:
   - Alt text for images
   - Heading hierarchy and structure
   - Color contrast ratios
   - Form label associations
   - Keyboard navigation
   - ARIA attributes usage
3. Map issues to WCAG guidelines
4. Create compliance assessment with severity levels

**Acceptance Criteria**:
- Identifies accessibility issues based on WCAG guidelines
- Provides clear suggestions for improvements
- Calculates accessibility score (0-100)
- Assesses WCAG compliance levels (A, AA, AAA)

**Files to Create**:
- `src/services/accessibilityAnalyzer.ts`

#### BE-002-04: Performance Analysis Service
**Priority**: High  
**Dependencies**: BE-002-01  
**Estimated Time**: 2 hours

**Description**: Create service to analyze website performance metrics

**Detailed Instructions**:
1. Create `src/services/performanceAnalyzer.ts` using Lighthouse
2. Analyze key performance metrics:
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Time to Interactive (TTI)
   - Cumulative Layout Shift (CLS)
   - Total Blocking Time (TBT)
3. Provide performance optimization recommendations
4. Calculate performance score based on Core Web Vitals

**Acceptance Criteria**:
- Runs Lighthouse performance audit
- Extracts and analyzes Core Web Vitals
- Provides performance optimization suggestions
- Calculates performance score (0-100)

**Files to Create**:
- `src/services/performanceAnalyzer.ts`

#### BE-002-05: Audit Controller and Routes
**Priority**: High  
**Dependencies**: BE-002-01, BE-002-02, BE-002-03, BE-002-04  
**Estimated Time**: 2 hours

**Description**: Create controller and routes for website audit functionality

**Detailed Instructions**:
1. Create `src/controllers/auditController.ts` with audit logic
2. Create `src/routes/audit.ts` with audit routes:
   - `POST /api/audit/scan` - Scan a website URL
   - `GET /api/audit/results/:id` - Get audit results
3. Add rate limiting for audit requests (5 requests per minute)
4. Add input validation and URL sanitization
5. Add proper error handling and logging
6. Store audit results temporarily (1 hour TTL) for retrieval

**Acceptance Criteria**:
- POST /api/audit/scan accepts URL and returns audit results
- Results include SEO, accessibility, and performance scores
- Proper error handling for invalid URLs and scan failures
- Rate limiting prevents abuse
- Results can be retrieved via results endpoint

**Files to Create**:
- `src/controllers/auditController.ts`
- `src/routes/audit.ts`
- `src/middleware/rateLimiter.ts`

---

## Epic 3: Content Generation System
**Epic ID**: BE-003  
**Priority**: High  
**Status**: Not Started  
**Dependencies**: BE-002  
**Estimated Time**: 2-3 days

### Overview
This epic builds the AI-powered content generation features that help users create blog posts, social media content, and website copy based on their business type and audit results.

### Tasks

#### BE-003-01: OpenAI Integration Service
**Priority**: High  
**Dependencies**: BE-002-05  
**Estimated Time**: 3 hours

**Description**: Create service to integrate with OpenAI API for content generation

**Detailed Instructions**:
1. Install OpenAI SDK: `npm install openai`
2. Create `src/services/openaiService.ts` with OpenAI integration
3. Add OpenAI API key to environment variables
4. Implement content generation methods:
   - Blog post ideas generation
   - Full blog post creation
   - Social media post generation
   - Product descriptions
   - Landing page copy
5. Add error handling for API failures and rate limits
6. Add cost tracking for API usage

**Acceptance Criteria**:
- Successfully connects to OpenAI API
- Generates high-quality content based on prompts
- Handles API errors and rate limits gracefully
- Tracks API usage and estimated costs
- Supports multiple content types

**Files to Create**:
- `src/services/openaiService.ts`
- `src/utils/contentPrompts.ts`

#### BE-003-02: Content Generation Controller
**Priority**: High  
**Dependencies**: BE-003-01  
**Estimated Time**: 2 hours

**Description**: Create controller for content generation endpoints

**Detailed Instructions**:
1. Create `src/controllers/contentController.ts` with content generation logic
2. Create `src/routes/content.ts` with content routes:
   - `POST /api/content/blog-ideas` - Generate blog post ideas
   - `POST /api/content/blog-post` - Generate full blog post
   - `POST /api/content/social-media` - Generate social media posts
   - `POST /api/content/product-description` - Generate product descriptions
3. Add input validation for business type, target audience, etc.
4. Add rate limiting for content generation (3 requests per minute)
5. Temporarily store generated content for retrieval

**Acceptance Criteria**:
- All content generation endpoints work correctly
- Input validation prevents invalid requests
- Rate limiting prevents abuse
- Generated content is high-quality and relevant
- Content can be retrieved and downloaded

**Files to Create**:
- `src/controllers/contentController.ts`
- `src/routes/content.ts`

---

## Epic 4: Payment and Subscription System
**Epic ID**: BE-004  
**Priority**: High  
**Status**: Not Started  
**Dependencies**: BE-002, BE-003  
**Estimated Time**: 2-3 days

### Overview
This epic implements Stripe payment processing for subscription management, enabling monetization of the platform with different pricing tiers.

### Tasks

#### BE-004-01: Stripe Integration Setup
**Priority**: High  
**Dependencies**: BE-003-02  
**Estimated Time**: 3 hours

**Description**: Set up Stripe payment processing for subscription management

**Detailed Instructions**:
1. Install Stripe SDK: `npm install stripe`
2. Create `src/services/stripeService.ts` with Stripe integration
3. Create subscription plans in Stripe Dashboard:
   - **Free**: 5 audits/month, 3 content generations/month
   - **Essentials** ($19/month): 50 audits/month, 20 content generations/month
   - **Growth** ($49/month): 200 audits/month, 100 content generations/month
   - **Pro** ($99/month): Unlimited audits and content generation
4. Add Stripe webhook handling for subscription events
5. Add environment variables for Stripe keys

**Acceptance Criteria**:
- Stripe SDK is properly configured
- Customer creation and management work
- Subscription creation, updates, and cancellation work
- Webhook handling processes subscription events
- Multiple pricing tiers are supported

**Files to Create**:
- `src/services/stripeService.ts`
- `src/controllers/paymentController.ts`
- `src/routes/payment.ts`
- `src/middleware/stripeWebhook.ts`

#### BE-004-02: Subscription Database Models
**Priority**: High  
**Dependencies**: BE-004-01  
**Estimated Time**: 2 hours

**Description**: Create database models for subscription and usage tracking

**Detailed Instructions**:
1. Update `prisma/schema.prisma` to add subscription models
2. Create usage tracking models for audits and content generation
3. Run database migration
4. Create subscription management utilities

**Acceptance Criteria**:
- Database models support subscription management
- Usage tracking works correctly
- Migration completes without errors
- Subscription limits are properly enforced

**Files to Modify**:
- `prisma/schema.prisma`

---

## Epic 5: User Authentication System
**Epic ID**: BE-005  
**Priority**: Medium  
**Status**: Not Started  
**Dependencies**: BE-004  
**Estimated Time**: 2-3 days

### Overview
This epic adds user authentication to enable account creation, login, and personalized features like saving audit history and managing subscriptions. **Note: This is now deprioritized to allow users to test core functionality without creating accounts first.**

### Tasks

#### BE-005-01: JWT Authentication Setup
**Priority**: Medium  
**Dependencies**: BE-004-02  
**Estimated Time**: 3 hours

**Description**: Implement JWT-based authentication system

**Detailed Instructions**:
1. Install JWT dependencies: `npm install jsonwebtoken bcryptjs`
2. Create `src/utils/jwt.ts` with token generation and verification
3. Create `src/utils/password.ts` for password hashing
4. Create authentication middleware in `src/middleware/auth.ts`
5. Add JWT_SECRET to environment variables

**Acceptance Criteria**:
- JWT tokens are generated correctly
- Password hashing and comparison work
- Authentication middleware verifies tokens
- Unauthorized requests are properly rejected

**Files to Create**:
- `src/utils/jwt.ts`
- `src/utils/password.ts`
- `src/middleware/auth.ts`

#### BE-005-02: User Registration and Login
**Priority**: Medium  
**Dependencies**: BE-005-01  
**Estimated Time**: 3 hours

**Description**: Create user registration and login endpoints

**Detailed Instructions**:
1. Create `src/controllers/authController.ts` with auth logic
2. Create `src/routes/auth.ts` with authentication routes:
   - `POST /api/auth/register` - User registration
   - `POST /api/auth/login` - User login
   - `POST /api/auth/logout` - User logout
   - `GET /api/auth/profile` - Get user profile
3. Add email validation and password strength requirements
4. Add rate limiting for authentication attempts
5. Connect user accounts to existing audit and content data

**Acceptance Criteria**:
- Users can register with email and password
- Login works with valid credentials
- JWT tokens are properly managed
- User profiles can be retrieved and updated
- Rate limiting prevents brute force attacks

**Files to Create**:
- `src/controllers/authController.ts`
- `src/routes/auth.ts`
- `src/validation/authValidation.ts`

#### BE-005-03: Protected Routes and User Data
**Priority**: Medium  
**Dependencies**: BE-005-02  
**Estimated Time**: 2 hours

**Description**: Add authentication to existing routes and enable user data persistence

**Detailed Instructions**:
1. Add optional authentication to audit and content routes
2. Enable saving audit history for authenticated users
3. Enable saving generated content for authenticated users
4. Add user dashboard endpoints:
   - `GET /api/user/audits` - Get user's audit history
   - `GET /api/user/content` - Get user's generated content
   - `GET /api/user/subscription` - Get subscription status

**Acceptance Criteria**:
- Existing routes work with or without authentication
- Authenticated users can save and retrieve their data
- User dashboard provides usage statistics
- Subscription status affects feature availability

**Files to Modify**:
- `src/controllers/auditController.ts`
- `src/controllers/contentController.ts`
- `src/routes/audit.ts`
- `src/routes/content.ts`

---

## Epic 6: Advanced Features and Optimization
**Epic ID**: BE-006  
**Priority**: Low  
**Status**: Not Started  
**Dependencies**: BE-005  
**Estimated Time**: 2-3 days

### Overview
This epic adds advanced features like bulk auditing, API integrations, and performance optimizations.

### Tasks

#### BE-006-01: Bulk Website Auditing
**Priority**: Low  
**Dependencies**: BE-005-03  
**Estimated Time**: 3 hours

**Description**: Enable bulk auditing of multiple websites

**Files to Create**:
- `src/services/bulkAuditService.ts`
- `src/controllers/bulkAuditController.ts`

#### BE-006-02: API Rate Limiting and Caching
**Priority**: Low  
**Dependencies**: BE-005-03  
**Estimated Time**: 2 hours

**Description**: Implement Redis caching and advanced rate limiting

**Files to Create**:
- `src/services/cacheService.ts`
- `src/middleware/advancedRateLimit.ts`

#### BE-006-03: Webhook Integrations
**Priority**: Low  
**Dependencies**: BE-005-03  
**Estimated Time**: 2 hours

**Description**: Add webhook support for third-party integrations

**Files to Create**:
- `src/services/webhookService.ts`
- `src/controllers/webhookController.ts`

---

## Development Priority Summary

### **Immediate Priority (Sprint 1-2):**
1. ✅ **Epic 1**: Project Setup and Infrastructure (Completed)
2. 🚀 **Epic 2**: Website Audit Engine (Next - Core MVP)

### **High Priority (Sprint 3-4):**
3. 🎯 **Epic 3**: Content Generation System
4. 💳 **Epic 4**: Payment and Subscription System

### **Medium Priority (Sprint 5-6):**
5. 👤 **Epic 5**: User Authentication System

### **Low Priority (Future Sprints):**
6. ⚡ **Epic 6**: Advanced Features and Optimization

## Key Changes Made:

1. **✅ Moved Website Audit Engine to Epic 2** - This is now the highest priority as it provides immediate user value
2. **✅ Content Generation moved to Epic 3** - Second highest priority for user engagement  
3. **✅ Payment System moved to Epic 4** - Required before authentication to define subscription limits
4. **📉 Authentication moved to Epic 5** - Now lower priority; users can test functionality without accounts
5. **🎯 Focus on MVP** - Core audit functionality can be built and tested immediately

This reorganization allows you to:
- ✅ Build and deploy core functionality immediately
- ✅ Let users test the website audit tool without registration
- ✅ Add authentication later when you need user accounts for subscriptions
- ✅ Implement a freemium model (limited free usage, then require account/payment)

## How to Mark Tickets as Complete

### Ticket Status Management

1. **Update Ticket Status**:
   - Change status in this document from "Not Started" → "In Progress" → "Completed"
   - Add completion date and developer name

2. **Code Review Checklist**:
   - [ ] Code follows TypeScript best practices
   - [ ] All functions have proper error handling
   - [ ] Input validation is implemented
   - [ ] Unit tests are written (if applicable)
   - [ ] Code is properly documented
   - [ ] Security considerations are addressed

3. **Testing Requirements**:
   - [ ] Manual testing completed
   - [ ] API endpoints tested with Postman/Thunder Client
   - [ ] Error cases tested
   - [ ] Edge cases considered

4. **Documentation Updates**:
   - [ ] API documentation updated
   - [ ] Environment variables documented
   - [ ] README updated if needed

### Completion Format
```
**Status**: Completed ✅
**Completed By**: [Developer Name]
**Completion Date**: [Date]
**Notes**: [Any important notes about implementation]
```

## Dependencies Overview

### Critical Path
1. BE-001 (Project Setup) → BE-002 (Authentication) → BE-003 (Audit Engine) → BE-004 (Content Generation)
2. BE-005 (Payment System) depends on BE-002 (Authentication)
3. BE-006 (Reports) depends on BE-003 and BE-004

### Parallel Development
- BE-003-02 (SEO Analysis) and BE-003-03 (Accessibility Analysis) can be developed in parallel
- BE-004-01 (OpenAI Integration) can be developed in parallel with BE-003 tasks
- BE-005 (Payment System) can be developed in parallel with BE-003 and BE-004
- BE-006 (Report Generation) can be developed after BE-003 is complete 