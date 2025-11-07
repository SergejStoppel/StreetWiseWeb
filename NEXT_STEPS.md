# StreetWiseWeb - Next Steps for Production Launch

**Last Updated:** 2025-11-07
**Current Status:** Core functionality implemented, ~27% of backend-v2-plan complete

This document outlines the prioritized roadmap to launch StreetWiseWeb as a production-ready SaaS product.

---

## 🎯 Phase 1: Critical Path to Launch (4-6 weeks)

These items are **required** before you can launch and accept paying customers.

### Week 1-2: Monetization & Billing

#### 1. Complete Subscription Management (HIGH PRIORITY)
**Status:** Partially implemented
**Document:** `docs/backend-v2-plan/3.1_Implement_Subscription_Management.md`

**What's Done:**
- ✅ Billing routes exist (`backend/src/api/routes/billing.ts`)
- ✅ Database tables exist (`database/setup/05_billing_tables.sql`)

**What's Missing:**
- [ ] Stripe webhook implementation for subscription events
- [ ] Checkout session creation endpoint (currently returns placeholder)
- [ ] Subscription status updates (active/past_due/canceled)
- [ ] Grace period handling for failed payments
- [ ] Proration logic for mid-cycle plan changes
- [ ] Customer portal integration for self-service
- [ ] Plan limits enforcement (analyses per month, concurrent analyses)

**Action Items:**
```bash
# 1. Implement Stripe webhooks
backend/src/api/routes/stripe-webhooks.ts
- Handle checkout.session.completed
- Handle customer.subscription.updated
- Handle customer.subscription.deleted
- Handle invoice.payment_failed

# 2. Complete checkout endpoint
backend/src/api/routes/billing.ts
- Integrate actual Stripe API
- Create checkout sessions with workspace_id metadata
- Return Stripe checkout URL

# 3. Add subscription middleware
backend/src/api/middleware/subscription.ts
- Check active subscription
- Enforce usage limits
- Handle trial periods
```

**Testing Checklist:**
- [ ] Create subscription via Stripe Checkout
- [ ] Verify webhook events are processed correctly
- [ ] Test failed payment grace period
- [ ] Test plan upgrades/downgrades
- [ ] Verify usage limits are enforced

---

#### 2. Implement One-Time Purchase Flow
**Status:** Not implemented
**Document:** `docs/backend-v2-plan/3.2_Implement_One_Time_Purchase.md`

**What's Needed:**
- [ ] One-time report purchase endpoint
- [ ] Report credits system (deduct on purchase)
- [ ] Stripe checkout for one-time payments
- [ ] Report access control (only purchaser can access)

**Action Items:**
```bash
# 1. Create purchase endpoint
POST /api/workspaces/:id/reports/purchase
- Create Stripe checkout session
- Link to specific analysis
- Set metadata for webhook processing

# 2. Webhook handling
- Handle checkout.session.completed for reports
- Create report_credits entry
- Update analysis with purchased report access

# 3. Gating logic
GET /api/analyses/:id/report
- Check if user has purchased report
- Check if user has active subscription
- Return 403 if neither condition met
```

---

### Week 2-3: Security & Data Protection

#### 3. Verify & Complete Row-Level Security (RLS)
**Status:** Partially implemented
**Document:** `docs/backend-v2-plan/4.2_Implement_RLS_Policies.md`

**What's Done:**
- ✅ RLS policies file exists (`database/setup/10_rls_policies.sql`)
- ✅ 18 RLS policies defined

**What's Missing:**
- [ ] Verify all workspace-scoped tables have RLS enabled
- [ ] Test RLS policies with multiple users
- [ ] Add service role bypass for background workers
- [ ] Performance optimization with indexes for RLS checks
- [ ] Documentation of which operations use service role vs user auth

**Action Items:**
```bash
# 1. Audit RLS coverage
- List all tables containing user/workspace data
- Verify each has appropriate policies
- Test cross-workspace data access attempts

# 2. Worker authentication
- Update workers to use service role where needed
- Document authentication requirements per worker
- Test worker access to workspace-scoped data

# 3. Performance testing
- Run EXPLAIN ANALYZE on RLS-protected queries
- Add composite indexes where needed
- Benchmark query performance impact
```

**Testing Checklist:**
- [ ] User A cannot access User B's workspaces
- [ ] User A cannot access User B's analyses
- [ ] Workers can access necessary data with service role
- [ ] RLS policy performance is acceptable (<50ms overhead)

---

#### 4. Implement Audit Logging
**Status:** Table exists, logging not implemented
**Document:** `docs/backend-v2-plan/4.1_Implement_Audit_Logging.md`

**What's Done:**
- ✅ `audit_log` table exists in database

**What's Missing:**
- [ ] Audit logging middleware
- [ ] Log sensitive operations (login, subscription changes, etc.)
- [ ] Log data exports/deletions
- [ ] Admin dashboard to view audit logs

**Action Items:**
```bash
# 1. Create audit logging middleware
backend/src/api/middleware/auditLog.ts
- Log user actions automatically
- Include workspace_id, user_id, action, metadata
- Handle async insertion (don't block requests)

# 2. Apply to sensitive routes
- Auth routes (login, logout, password reset)
- Billing routes (subscription changes, purchases)
- Data routes (exports, deletions)

# 3. Create audit log viewer
GET /api/workspaces/:id/audit-logs
- Filter by date range, action type, user
- Pagination
- Export capability
```

---

### Week 3-4: Core Product Features

#### 5. Complete Report Generation API
**Status:** Not implemented
**Document:** `docs/backend-v2-plan/3.3_Implement_Report_Generation_API.md`

**What's Needed:**
- [ ] PDF report generation endpoint
- [ ] Report templates (basic vs detailed)
- [ ] Email delivery of reports
- [ ] Report history/downloads

**Action Items:**
```bash
# 1. Implement PDF generation
backend/src/services/reporting/pdfGenerator.ts
- Use puppeteer or similar
- Create professional report templates
- Include branding, scores, issues, recommendations

# 2. Report API endpoints
GET /api/analyses/:id/report/pdf
POST /api/analyses/:id/report/email
GET /api/workspaces/:id/reports

# 3. Report access control
- Free tier: Basic report only
- Paid tier: Detailed report
- One-time purchase: Detailed report for specific analysis
```

---

#### 6. Legal & Compliance Pages
**Status:** Not implemented
**Priority:** CRITICAL (required by law)

**What's Needed:**
- [ ] Privacy Policy page
- [ ] Terms of Service page
- [ ] Cookie Consent banner (GDPR)
- [ ] Data Processing Agreement (for EU customers)
- [ ] Accessibility Statement

**Action Items:**
```bash
# 1. Create legal pages
frontend/src/pages/PrivacyPolicy.js
frontend/src/pages/TermsOfService.js
frontend/src/pages/AccessibilityStatement.js

# 2. Add cookie consent
- Use a compliant cookie banner library
- Store consent preferences
- Block non-essential cookies until consent

# 3. Add GDPR features
POST /api/users/export-data (download all user data)
DELETE /api/users/delete-account (with confirmation)
```

**Resources:**
- Use legal template generators (Termly, iubenda)
- Consult with a lawyer for final review
- Ensure GDPR compliance for EU users

---

### Week 4: Email System
**Status:** Not implemented
**Priority:** HIGH (user experience & retention)

**What's Needed:**
- [ ] Transactional email service (SendGrid, Postmark, AWS SES)
- [ ] Email templates
- [ ] Email sending service/utility

**Email Types to Implement:**
1. **Authentication:**
   - [ ] Welcome email (new user signup)
   - [ ] Password reset email
   - [ ] Email verification

2. **Analysis:**
   - [ ] Analysis completion notification
   - [ ] Analysis failed notification
   - [ ] Weekly/monthly usage summary

3. **Billing:**
   - [ ] Subscription confirmation
   - [ ] Payment receipt
   - [ ] Payment failed notification
   - [ ] Subscription cancelled notification
   - [ ] Trial expiring reminder

**Action Items:**
```bash
# 1. Set up email service
backend/src/services/email/emailService.ts
- Configure SendGrid/Postmark
- Create email templates (use MJML or similar)
- Queue emails for sending (use BullMQ)

# 2. Email templates
backend/src/services/email/templates/
- welcome.html
- analysis-complete.html
- payment-receipt.html
- etc.

# 3. Email queue worker
backend/src/core/workers/email.worker.ts
- Process email queue
- Handle failures/retries
- Track delivery status
```

---

## 🚀 Phase 2: Production Infrastructure (2-3 weeks)

### 7. Production Environment Setup
**Status:** Docker exists, production config needed

**What's Needed:**
- [ ] Separate production environment (different from dev)
- [ ] Environment variable management (1Password, AWS Secrets Manager)
- [ ] SSL/TLS certificates (Let's Encrypt)
- [ ] Domain configuration and DNS
- [ ] CDN setup for static assets (Cloudflare, CloudFront)
- [ ] Automated database backups

**Hosting Recommendations:**
- **Backend:** Railway, Render, or AWS ECS
- **Database:** Supabase (already using), or AWS RDS
- **Redis:** Upstash, Redis Cloud, or AWS ElastiCache
- **Frontend:** Vercel, Netlify, or Cloudflare Pages
- **Storage:** Supabase Storage (already using)

---

### 8. Monitoring & Error Tracking
**Status:** Basic logging exists, need production monitoring

**What's Needed:**
- [ ] Error tracking (Sentry, Rollbar)
- [ ] Application performance monitoring
- [ ] Uptime monitoring (UptimeRobot, Pingdom)
- [ ] Database query monitoring
- [ ] Job queue monitoring
- [ ] Alerts for critical errors

**Action Items:**
```bash
# 1. Install Sentry
npm install @sentry/node @sentry/react
- Configure backend error tracking
- Configure frontend error tracking
- Set up error notifications (Slack, email)

# 2. Set up uptime monitoring
- Monitor /api/health endpoint
- Monitor frontend URL
- Configure alerts (>5min downtime)

# 3. Queue monitoring dashboard
- Track failed jobs
- Monitor queue depth
- Alert on stalled workers
```

---

### 9. Rate Limiting & DDoS Protection
**Status:** Basic rate limiting exists, needs enhancement

**What's Needed:**
- [ ] Enhanced rate limiting per endpoint
- [ ] IP-based rate limiting
- [ ] API key rate limiting (if offering API access)
- [ ] DDoS protection (Cloudflare)

**Action Items:**
```bash
# 1. Implement tiered rate limits
- Public endpoints: 10 req/min per IP
- Authenticated endpoints: 100 req/min per user
- Analysis endpoints: Based on subscription tier

# 2. Add Cloudflare
- Enable DDoS protection
- Enable WAF rules
- Configure page rules for caching
```

---

## 📈 Phase 3: Missing Workers & Features (3-4 weeks)

### 10. Complete Missing Workers

**Status:** Core workers implemented, some missing

**Workers to Implement:**
- [ ] 2.6: SEO On-Page Worker (`docs/backend-v2-plan/2.6_Implement_SEO_OnPage_Worker.md`)
- [ ] 2.7: Performance Image Worker (`docs/backend-v2-plan/2.7_Implement_Performance_Image_Worker.md`)
- [ ] 2.8: Performance Core Web Vitals Worker (`docs/backend-v2-plan/2.8_Implement_Performance_CWV_Worker.md`)
- [ ] 2.9: AI Summary Worker (`docs/backend-v2-plan/2.9_Implement_AI_Summary_Worker.md`)

**Priority:** MEDIUM (Nice-to-have, can launch without these)

---

### 11. Enhanced Rules Engine
**Status:** Basic rules exist, enhancements needed

**Documents:**
- `docs/backend-v2-plan/2.1a_Enhanced_Accessibility_Rules.md`
- `docs/backend-v2-plan/2.1b_Enhanced_SEO_Rules.md`
- `docs/backend-v2-plan/2.1c_Enhanced_Performance_Rules.md`

**What's Missing:**
- [ ] WCAG criteria mapping
- [ ] Disability groups affected
- [ ] Solution templates with code examples
- [ ] Testing instructions (automated + manual)
- [ ] Business impact scoring

**Action Items:**
```bash
# 1. Enhance rules table schema
ALTER TABLE rules ADD COLUMN wcag_criteria TEXT[];
ALTER TABLE rules ADD COLUMN disability_groups TEXT[];
ALTER TABLE rules ADD COLUMN business_impact_score INT;

# 2. Update seed data
- Add enhanced metadata to existing rules
- Add solution templates
- Add testing instructions

# 3. Update API responses
- Include enhanced metadata in issue responses
- Provide actionable remediation guidance
```

---

### 12. Database Functions & Triggers
**Status:** Some triggers exist, functions incomplete
**Document:** `docs/backend-v2-plan/4.3_Implement_Database_Functions_Triggers.md`

**What's Done:**
- ✅ Some triggers exist (`database/setup/08_triggers.sql`)
- ✅ Some functions exist (`database/setup/07_functions.sql`)

**What's Missing:**
- [ ] Auto-update timestamps (updated_at)
- [ ] Cascade soft deletes
- [ ] Analysis score calculation functions
- [ ] Usage tracking functions

---

## 🎨 Phase 4: User Experience & Polish (2-3 weeks)

### 13. Onboarding Flow
**What's Needed:**
- [ ] Interactive tutorial for first analysis
- [ ] Product tour highlighting features
- [ ] Sample/demo analysis
- [ ] Onboarding checklist in dashboard

---

### 14. Admin Dashboard
**What's Needed:**
- [ ] User management interface
- [ ] Analytics overview (users, analyses, revenue)
- [ ] System health monitoring
- [ ] Manual analysis triggering
- [ ] Subscription management
- [ ] Support ticket integration

---

### 15. SEO & Marketing
**What's Needed:**
- [ ] Landing page optimization
- [ ] Blog setup (for content marketing)
- [ ] SEO meta tags on all pages
- [ ] Sitemap.xml and robots.txt
- [ ] OpenGraph and Twitter cards
- [ ] Schema.org markup

---

## 🔒 Phase 5: Advanced Security & Compliance (Ongoing)

### 16. Security Audit
**Status:** Not performed
**Document:** `docs/backend-v2-plan/6.2_Database_Encryption_Security.md`

**What's Needed:**
- [ ] Professional security audit
- [ ] Penetration testing
- [ ] Dependency vulnerability scanning (npm audit)
- [ ] SQL injection testing
- [ ] XSS prevention review
- [ ] CSRF protection verification
- [ ] Add Content Security Policy (CSP)

---

### 17. GDPR & Compliance
**Status:** Not implemented
**Document:** `docs/backend-v2-plan/6.4_Compliance_GDPR_SOC2.md`

**What's Needed:**
- [ ] Data export functionality (GDPR)
- [ ] Data deletion functionality (GDPR)
- [ ] Data processing agreements
- [ ] Privacy impact assessment
- [ ] Cookie consent management
- [ ] SOC 2 compliance (for enterprise customers)

---

### 18. Worker Error Recovery
**Status:** Not implemented
**Document:** `docs/backend-v2-plan/5.1_Implement_Worker_Error_Recovery.md`

**What's Needed:**
- [ ] Automatic retry logic with exponential backoff
- [ ] Dead letter queue for failed jobs
- [ ] Manual retry capability
- [ ] Error alerting
- [ ] Job timeout handling

---

## 📊 Phase 6: Analytics & Growth (Ongoing)

### 19. Analytics Implementation
**What's Needed:**
- [ ] Google Analytics or alternative
- [ ] Conversion tracking (sign-ups, purchases)
- [ ] Feature usage analytics
- [ ] Funnel analysis
- [ ] A/B testing infrastructure

---

### 20. Customer Support
**What's Needed:**
- [ ] Help center / Knowledge base
- [ ] Contact form
- [ ] Support ticket system (Zendesk, Intercom)
- [ ] Live chat widget (optional)
- [ ] FAQ section

---

## 🚢 Minimum Viable Product (MVP) Checklist

**You can launch with these items completed:**

### Must-Have (Launch Blockers):
- [ ] ✅ Stripe subscription management (Phase 1, Item 1)
- [ ] ✅ One-time purchase flow (Phase 1, Item 2)
- [ ] ✅ Privacy Policy & Terms of Service (Phase 1, Item 6)
- [ ] ✅ Cookie consent banner (Phase 1, Item 6)
- [ ] ✅ Email system (at minimum: welcome, analysis complete, payment emails) (Phase 1, Item 7)
- [ ] ✅ Production hosting setup (Phase 2, Item 7)
- [ ] ✅ Error tracking (Sentry) (Phase 2, Item 8)
- [ ] ✅ Uptime monitoring (Phase 2, Item 8)
- [ ] ✅ Rate limiting (Phase 2, Item 9)
- [ ] ✅ SSL certificates (Phase 2, Item 7)

### Should-Have (Launch Strong):
- [ ] Report generation (PDF) (Phase 1, Item 5)
- [ ] Audit logging (Phase 1, Item 4)
- [ ] RLS verification (Phase 1, Item 3)
- [ ] Onboarding flow (Phase 4, Item 13)
- [ ] SEO optimization (Phase 4, Item 15)

### Nice-to-Have (Add Later):
- [ ] Additional workers (Phase 3, Item 10)
- [ ] Enhanced rules engine (Phase 3, Item 11)
- [ ] Admin dashboard (Phase 4, Item 14)
- [ ] Advanced analytics (Phase 6, Item 19)

---

## 📅 Recommended Timeline

### Sprint 1 (Weeks 1-2): Monetization
- Complete Stripe integration
- Implement one-time purchases
- Test payment flows end-to-end

### Sprint 2 (Weeks 2-3): Security & Legal
- Complete RLS policies
- Add audit logging
- Create legal pages
- Add cookie consent

### Sprint 3 (Weeks 3-4): Core Features
- Implement report generation
- Set up email system
- Test user flows

### Sprint 4 (Weeks 4-5): Production Ready
- Set up production environment
- Configure monitoring & alerts
- Security hardening
- Load testing

### Sprint 5 (Weeks 5-6): Polish & Launch
- User onboarding
- SEO optimization
- Marketing pages
- Soft launch to beta users

### Post-Launch: Iterate
- Monitor metrics
- Fix bugs
- Add missing workers
- Implement user feedback

---

## 🎯 Success Metrics to Track

**Launch Readiness:**
- [ ] Payment processing works end-to-end
- [ ] Error rate < 1%
- [ ] API response time < 500ms (p95)
- [ ] All legal pages published
- [ ] Uptime monitoring active
- [ ] Email notifications working

**Business Metrics (Post-Launch):**
- Sign-up conversion rate
- Free to paid conversion rate
- Monthly recurring revenue (MRR)
- Customer churn rate
- Average analyses per user
- Customer support ticket volume

**Technical Metrics:**
- Worker success rate
- Queue processing time
- Database query performance
- API error rate
- Uptime percentage

---

## 💡 Quick Wins (Can Implement Quickly)

These are small improvements that can be done in <4 hours each:

1. **Add loading states** - Better UX during analysis
2. **Improve error messages** - More helpful feedback
3. **Add email verification** - Reduce spam signups
4. **Password strength indicator** - Better security
5. **Export analysis as JSON** - Developer-friendly
6. **Changelog page** - Keep users informed
7. **Status page** - Show system health
8. **Keyboard shortcuts** - Power user features
9. **Dark mode fixes** - Ensure consistency
10. **Mobile responsiveness** - Fix any issues

---

## 📝 Notes

- **Priority Order:** Follow the phases in order. Phase 1 is critical for launch.
- **Testing:** Write tests for payment flows, security features, and core functionality
- **Documentation:** Update API docs as you implement new endpoints
- **Performance:** Load test before launch (aim for 100 concurrent analyses)
- **Backup:** Ensure database backups are automated and tested
- **Monitoring:** Set up alerts BEFORE launch, not after

---

## 🤝 Getting Help

If you need assistance with any of these implementations:

1. **Stripe Integration:** Use Stripe's official docs and test mode
2. **Security:** Consider hiring a security auditor
3. **Legal:** Use template generators + lawyer review
4. **DevOps:** Railway and Vercel have great documentation
5. **Email:** SendGrid and Postmark have starter guides

---

**Last Review:** 2025-11-07
**Next Review:** After completing Phase 1
