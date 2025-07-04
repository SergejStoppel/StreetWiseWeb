# SiteCraft Architecture Documentation

## Overview
SiteCraft is a SaaS platform designed to help small businesses improve their online presence through automated audits, AI-generated content, and website optimization services.

## Architecture Principles
- **Modularity**: Each feature is a separate module that can be developed and deployed independently
- **Scalability**: Designed to handle increasing load with horizontal scaling
- **Flexibility**: Easy to add new features without major refactoring
- **Lean**: Minimal dependencies and packages
- **Security**: Secure by design with proper authentication and authorization

## System Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   External      │
│   (React/Next)  │◄──►│   (Node.js)     │◄──►│   Services      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Database      │
                       │   (PostgreSQL)  │
                       └─────────────────┘
```

### Technology Stack

#### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **State Management**: Zustand (lightweight alternative to Redux)
- **Form Handling**: React Hook Form
- **HTTP Client**: Axios
- **UI Components**: Headless UI + Custom components

#### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens
- **File Storage**: Local storage (expandable to S3)
- **Background Jobs**: Bull Queue with Redis
- **API Documentation**: Swagger/OpenAPI

#### External Services
- **AI Services**: OpenAI API (GPT-4)
- **SEO Data**: Google Search Console API (future)
- **Email**: SendGrid
- **Payment**: Stripe (future)
- **Website Screenshots**: Puppeteer

### Database Design

#### Core Tables
```sql
-- Users and Authentication
users (id, email, password_hash, created_at, updated_at)
user_sessions (id, user_id, token, expires_at)

-- Website Audits
websites (id, url, user_id, created_at, updated_at)
audits (id, website_id, audit_type, scores, issues, created_at)

-- Content Generation
content_requests (id, user_id, business_type, location, created_at)
generated_content (id, request_id, content_type, title, content, created_at)

-- Subscription Management (Future)
subscriptions (id, user_id, plan_type, status, created_at, expires_at)
```

### API Structure

#### Core Endpoints
```
Auth:
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
GET  /api/auth/me

Audits:
POST /api/audits/scan
GET  /api/audits/:id
GET  /api/audits/website/:websiteId

Content:
POST /api/content/generate-ideas
POST /api/content/generate-post
GET  /api/content/history

Websites:
POST /api/websites
GET  /api/websites
GET  /api/websites/:id
```

### Module Structure

#### Phase 1 Modules (Features 1-3)
1. **Audit Engine** - Website scanning and analysis
2. **Content Generator** - AI-powered content creation
3. **Report Generator** - PDF and HTML report generation
4. **User Management** - Authentication and user profiles

#### Phase 2 Modules (Features 4-5)
1. **Design Engine** - Mockup generation
2. **Implementation Services** - Full redesign management
3. **Subscription Management** - Billing and plan management
4. **Customer Portal** - Advanced dashboard features

### Security Considerations
- **Input Validation**: All user inputs validated and sanitized
- **Rate Limiting**: API rate limiting to prevent abuse
- **Authentication**: JWT-based authentication with refresh tokens
- **Data Protection**: Encrypted sensitive data at rest
- **CORS**: Proper CORS configuration for frontend-backend communication

### Deployment Strategy
- **Development**: Local development with Docker Compose
- **Production**: Containerized deployment (Docker)
- **Database**: Managed PostgreSQL service
- **CDN**: Static assets served via CDN
- **Monitoring**: Application monitoring and logging

### Performance Considerations
- **Caching**: Redis for caching frequent queries
- **Database Indexing**: Proper indexes for query optimization
- **Background Processing**: Queue system for time-intensive operations
- **Image Optimization**: Automated image compression and optimization

### Scalability Plan
- **Horizontal Scaling**: Load balancer with multiple app instances
- **Database Scaling**: Read replicas for read-heavy operations
- **Microservices**: Future migration to microservices architecture
- **CDN**: Global content delivery network

## Development Phases

### Phase 1: MVP (Features 1-3)
- Core audit functionality
- Basic content generation
- User authentication
- Simple reporting

### Phase 2: Growth (Features 4-5)
- Advanced design features
- Full service offerings
- Subscription management
- Customer portal

### Phase 3: Scale
- Advanced AI features
- White-label solutions
- Enterprise features
- Advanced analytics 