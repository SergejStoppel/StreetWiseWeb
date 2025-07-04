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
**Status**: Not Started  
**Dependencies**: None  
**Estimated Time**: 1-2 days

### Tasks

#### BE-001-01: Initialize Node.js Project
**Priority**: High  
**Dependencies**: None  
**Estimated Time**: 2 hours

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

#### BE-001-02: Database Setup with Prisma
**Priority**: High  
**Dependencies**: BE-001-01  
**Estimated Time**: 3 hours

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

#### BE-001-03: Basic Express Server Setup
**Priority**: High  
**Dependencies**: BE-001-01  
**Estimated Time**: 2 hours

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

## Epic 2: User Authentication System
**Epic ID**: BE-002  
**Priority**: High  
**Status**: Not Started  
**Dependencies**: BE-001  
**Estimated Time**: 2-3 days

### Tasks

#### BE-002-01: JWT Authentication Setup
**Priority**: High  
**Dependencies**: BE-001-02, BE-001-03  
**Estimated Time**: 3 hours

**Description**: Implement JWT-based authentication system

**Detailed Instructions**:
1. Install JWT dependencies:
   ```bash
   npm install jsonwebtoken bcryptjs
   npm install -D @types/jsonwebtoken @types/bcryptjs
   ```
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

#### BE-002-02: User Registration Endpoint
**Priority**: High  
**Dependencies**: BE-002-01  
**Estimated Time**: 2 hours

**Description**: Create user registration endpoint with validation

**Detailed Instructions**:
1. Create `src/controllers/authController.ts` with registration logic
2. Create validation schema using a validation library
3. Create `src/routes/auth.ts` with registration route
4. Add email validation and password strength requirements
5. Add rate limiting for registration attempts

**Acceptance Criteria**:
- User can register with valid email and password
- Duplicate email registration is prevented
- Password is properly hashed before storing
- JWT token is returned on successful registration
- Input validation works correctly

**Files to Create**:
- `src/controllers/authController.ts`
- `src/routes/auth.ts`
- `src/validation/authValidation.ts`

#### BE-002-03: User Login Endpoint
**Priority**: High  
**Dependencies**: BE-002-01, BE-002-02  
**Estimated Time**: 1.5 hours

**Description**: Create user login endpoint with authentication

**Detailed Instructions**:
1. Add login method to `src/controllers/authController.ts`
2. Add login route to `src/routes/auth.ts`
3. Add rate limiting for login attempts
4. Add login validation

**Acceptance Criteria**:
- User can login with correct credentials
- Invalid credentials are rejected
- JWT token is returned on successful login
- Rate limiting prevents brute force attacks

**Files to Modify**:
- `src/controllers/authController.ts`
- `src/routes/auth.ts`

---

## Epic 3: Website Audit Engine
**Epic ID**: BE-003  
**Priority**: High  
**Status**: Not Started  
**Dependencies**: BE-002  
**Estimated Time**: 3-4 days

### Tasks

#### BE-003-01: Website Scanning Service
**Priority**: High  
**Dependencies**: BE-002-03  
**Estimated Time**: 4 hours

**Description**: Create service to scan websites and extract basic information

**Detailed Instructions**:
1. Install required dependencies:
   ```bash
   npm install puppeteer cheerio url-parse
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

#### BE-003-02: SEO Analysis Service
**Priority**: High  
**Dependencies**: BE-003-01  
**Estimated Time**: 3 hours

**Description**: Create service to analyze SEO aspects of scanned websites

**Detailed Instructions**:
1. Create `src/services/seoAnalyzer.ts` with SEO analysis logic
2. Add comprehensive SEO checks (title, meta description, headings, images)
3. Implement scoring algorithm based on issue severity
4. Create recommendation engine

**Acceptance Criteria**:
- Identifies common SEO issues accurately
- Provides actionable recommendations
- Calculates meaningful SEO score (0-100)
- Categorizes issues by type and severity

**Files to Create**:
- `src/services/seoAnalyzer.ts`

#### BE-003-03: Accessibility Analysis Service
**Priority**: High  
**Dependencies**: BE-003-01  
**Estimated Time**: 3 hours

**Description**: Create service to analyze accessibility aspects of scanned websites

**Detailed Instructions**:
1. Create `src/services/accessibilityAnalyzer.ts` with accessibility checks
2. Implement accessibility checks (alt text, heading hierarchy, color contrast)
3. Map issues to WCAG guidelines
4. Create compliance assessment

**Acceptance Criteria**:
- Identifies accessibility issues based on WCAG guidelines
- Provides clear suggestions for improvements
- Calculates accessibility score
- Assesses WCAG compliance levels

**Files to Create**:
- `src/services/accessibilityAnalyzer.ts`

#### BE-003-04: Audit Controller and Routes
**Priority**: High  
**Dependencies**: BE-003-01, BE-003-02, BE-003-03  
**Estimated Time**: 2 hours

**Description**: Create controller and routes for website audit functionality

**Detailed Instructions**:
1. Create `src/controllers/auditController.ts` with audit logic
2. Create `src/routes/audit.ts` with audit routes
3. Add rate limiting for audit requests
4. Add input validation and sanitization
5. Add proper error handling and logging

**Acceptance Criteria**:
- POST /api/audits/scan accepts URL and returns audit results
- Audit results are saved to database
- Proper error handling for invalid URLs
- Rate limiting prevents abuse
- Authentication is enforced for registered users

**Files to Create**:
- `src/controllers/auditController.ts`
- `src/routes/audit.ts`

---

## Epic 4: Content Generation System
**Epic ID**: BE-004  
**Priority**: High  
**Status**: Not Started  
**Dependencies**: BE-002  
**Estimated Time**: 2-3 days

### Tasks

#### BE-004-01: OpenAI Integration Service
**Priority**: High  
**Dependencies**: BE-002-03  
**Estimated Time**: 2 hours

**Description**: Create service to integrate with OpenAI API for content generation

**Detailed Instructions**:
1. Install OpenAI SDK: `npm install openai`
2. Create `src/services/openaiService.ts` with OpenAI integration
3. Add OpenAI API key to environment variables
4. Add error handling for API failures
5. Add rate limiting for OpenAI requests
6. Add cost tracking for API usage

**Acceptance Criteria**:
- Successfully connects to OpenAI API
- Generates blog post ideas based on business type and location
- Generates full blog posts with proper structure
- Handles API errors gracefully
- Tracks API usage and costs

**Files to Create**:
- `src/services/openaiService.ts`

#### BE-004-02: Content Generation Controller
**Priority**: High  
**Dependencies**: BE-004-01  
**Estimated Time**: 2 hours

**Description**: Create controller for content generation endpoints

**Detailed Instructions**:
1. Create `src/controllers/contentController.ts` with content generation logic
2. Create `src/routes/content.ts` with content routes
3. Add input validation and sanitization
4. Add rate limiting for content generation
5. Add user authentication middleware

**Acceptance Criteria**:
- POST /api/content/generate-ideas returns blog post ideas
- POST /api/content/generate-post creates full blog post
- GET /api/content/history returns user's content history
- Proper error handling and validation
- Rate limiting prevents abuse

**Files to Create**:
- `src/controllers/contentController.ts`
- `src/routes/content.ts`

#### BE-004-03: Content Request Database Models
**Priority**: High  
**Dependencies**: BE-004-01  
**Estimated Time**: 1 hour

**Description**: Create database models for content generation requests and results

**Detailed Instructions**:
1. Update `prisma/schema.prisma` to add content models
2. Update User model to include relationships
3. Run database migration
4. Update database client imports where needed

**Acceptance Criteria**:
- Database models are created successfully
- Relationships between models work correctly
- Migration completes without errors
- Prisma client generates updated types

**Files to Modify**:
- `prisma/schema.prisma`

---

## Epic 5: Payment and Subscription System
**Epic ID**: BE-005  
**Priority**: High  
**Status**: Not Started  
**Dependencies**: BE-002  
**Estimated Time**: 2-3 days

### Tasks

#### BE-005-01: Stripe Integration Setup
**Priority**: High  
**Dependencies**: BE-002-03  
**Estimated Time**: 3 hours

**Description**: Set up Stripe payment processing for subscription management

**Detailed Instructions**:
1. Install Stripe SDK:
   ```bash
   npm install stripe
   npm install -D @types/stripe
   ```
2. Create `src/services/stripeService.ts`:
   ```typescript
   import Stripe from 'stripe';
   
   export class StripeService {
     private stripe: Stripe;
     
     constructor() {
       this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
         apiVersion: '2023-10-16',
       });
     }
     
     async createCustomer(email: string, name?: string): Promise<Stripe.Customer> {
       return this.stripe.customers.create({
         email,
         name,
       });
     }
     
     async createSubscription(
       customerId: string,
       priceId: string
     ): Promise<Stripe.Subscription> {
       return this.stripe.subscriptions.create({
         customer: customerId,
         items: [{ price: priceId }],
         payment_behavior: 'default_incomplete',
         payment_settings: { save_default_payment_method: 'on_subscription' },
         expand: ['latest_invoice.payment_intent'],
       });
     }
     
     async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
       return this.stripe.subscriptions.cancel(subscriptionId);
     }
   }
   ```
3. Add Stripe webhook handling
4. Create subscription plans in Stripe Dashboard
5. Add environment variables for Stripe keys

**Acceptance Criteria**:
- Stripe SDK is properly configured
- Customer creation works
- Subscription creation and cancellation work
- Webhook handling is implemented
- Environment variables are documented

**Files to Create**:
- `src/services/stripeService.ts`
- `src/controllers/paymentController.ts`
- `src/routes/payment.ts`
- `src/middleware/stripeWebhook.ts`

#### BE-005-02: Subscription Database Models
**Priority**: High  
**Dependencies**: BE-005-01  
**Estimated Time**: 2 hours

**Description**: Create database models for subscription management

**Detailed Instructions**:
1. Update `prisma/schema.prisma` to add subscription models:
   ```prisma
   model Customer {
     id               String   @id @default(cuid())
     userId           String   @unique
     user             User     @relation(fields: [userId], references: [id])
     stripeCustomerId String   @unique
     createdAt        DateTime @default(now())
     updatedAt        DateTime @updatedAt
     
     subscriptions    Subscription[]
   }
   
   model Subscription {
     id                   String   @id @default(cuid())
     customerId           String
     customer             Customer @relation(fields: [customerId], references: [id])
     stripeSubscriptionId String   @unique
     status               String   // active, canceled, past_due, etc.
     planType             String   // essentials, growth, pro
     currentPeriodStart   DateTime
     currentPeriodEnd     DateTime
     createdAt            DateTime @default(now())
     updatedAt            DateTime @updatedAt
     
     invoices             Invoice[]
   }
   
   model Invoice {
     id              String       @id @default(cuid())
     subscriptionId  String
     subscription    Subscription @relation(fields: [subscriptionId], references: [id])
     stripeInvoiceId String       @unique
     amount          Int          // Amount in cents
     currency        String       @default("usd")
     status          String       // paid, open, void, etc.
     createdAt       DateTime     @default(now())
   }
   ```
2. Update User model to include customer relationship
3. Run database migration
4. Create subscription management utilities

**Acceptance Criteria**:
- Database models are created successfully
- Relationships between models work correctly
- Migration completes without errors
- Subscription utilities are functional

**Files to Modify**:
- `prisma/schema.prisma`

#### BE-005-03: Payment Controller and Routes
**Priority**: High  
**Dependencies**: BE-005-01, BE-005-02  
**Estimated Time**: 3 hours

**Description**: Create payment endpoints for subscription management

**Detailed Instructions**:
1. Create `src/controllers/paymentController.ts`:
   ```typescript
   import { Request, Response } from 'express';
   import { PrismaClient } from '@prisma/client';
   import { StripeService } from '../services/stripeService';
   
   const prisma = new PrismaClient();
   const stripeService = new StripeService();
   
   export const createSubscription = async (req: Request, res: Response) => {
     try {
       const { planType } = req.body;
       const userId = req.user?.userId;
       
       // Get or create Stripe customer
       const user = await prisma.user.findUnique({
         where: { id: userId },
         include: { customer: true }
       });
       
       let customer = user?.customer;
       if (!customer) {
         const stripeCustomer = await stripeService.createCustomer(user!.email);
         customer = await prisma.customer.create({
           data: {
             userId: userId!,
             stripeCustomerId: stripeCustomer.id
           }
         });
       }
       
       // Create subscription
       const priceId = getPriceIdForPlan(planType);
       const subscription = await stripeService.createSubscription(
         customer.stripeCustomerId,
         priceId
       );
       
       // Save subscription to database
       await prisma.subscription.create({
         data: {
           customerId: customer.id,
           stripeSubscriptionId: subscription.id,
           status: subscription.status,
           planType,
           currentPeriodStart: new Date(subscription.current_period_start * 1000),
           currentPeriodEnd: new Date(subscription.current_period_end * 1000)
         }
       });
       
       res.json({
         subscriptionId: subscription.id,
         clientSecret: subscription.latest_invoice?.payment_intent?.client_secret
       });
     } catch (error) {
       console.error('Subscription creation error:', error);
       res.status(500).json({ error: 'Failed to create subscription' });
     }
   };
   ```
2. Create payment routes in `src/routes/payment.ts`
3. Add webhook endpoint for Stripe events
4. Add subscription status checking middleware
5. Create plan pricing configuration

**Acceptance Criteria**:
- POST /api/payments/subscribe creates subscriptions
- Webhook endpoint handles Stripe events
- Subscription status is properly tracked
- Plan pricing is configurable
- Authentication is enforced

**Files to Create**:
- `src/controllers/paymentController.ts`
- `src/routes/payment.ts`
- `src/config/pricing.ts`

---

## Epic 6: Report Generation System
**Epic ID**: BE-006  
**Priority**: Medium  
**Status**: Not Started  
**Dependencies**: BE-003, BE-004  
**Estimated Time**: 2-3 days

### Tasks

#### BE-006-01: PDF Report Generator
**Priority**: Medium  
**Dependencies**: BE-003-04  
**Estimated Time**: 3 hours

**Description**: Create service to generate PDF reports from audit results

**Detailed Instructions**:
1. Install PDF generation dependencies: `npm install puppeteer-pdf html-pdf-node`
2. Create `src/services/reportGenerator.ts` with PDF generation logic
3. Create report templates directory structure
4. Add styling and branding to reports
5. Add error handling for PDF generation

**Acceptance Criteria**:
- Generates PDF reports from audit data
- Reports include SEO and accessibility analysis
- Professional styling and layout
- Error handling for generation failures

**Files to Create**:
- `src/services/reportGenerator.ts`
- `src/templates/reportTemplate.html`

#### BE-006-02: Report Download Endpoint
**Priority**: Medium  
**Dependencies**: BE-006-01  
**Estimated Time**: 1.5 hours

**Description**: Create endpoint to download generated reports

**Detailed Instructions**:
1. Add report download method to `src/controllers/auditController.ts`
2. Add route for report download
3. Add authentication middleware
4. Add rate limiting for report downloads

**Acceptance Criteria**:
- GET /api/audits/:id/report downloads PDF report
- Authentication is required
- Proper headers for PDF download
- Rate limiting prevents abuse

**Files to Modify**:
- `src/controllers/auditController.ts`
- `src/routes/audit.ts`

---

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