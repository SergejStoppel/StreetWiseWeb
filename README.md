# 🌐 SiteCraft V3

> **Multi-Tenant Accessibility Analysis Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)
[![Google Cloud](https://img.shields.io/badge/Database-Google%20Cloud-blue.svg)](https://cloud.google.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

SiteCraft V3 is a next-generation, multi-tenant accessibility analysis platform that provides comprehensive website compliance analysis with WCAG guidelines. Featuring workspace-based collaboration, advanced rule engines, and enterprise-grade security.

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🏢 **Multi-Tenant Architecture** | Workspace-based collaboration with role-based access control |
| 🔐 **Enterprise Authentication** | Complete auth flow with email confirmation, password reset, account management |
| 🔍 **Advanced Analysis Engine** | 100+ rules covering Accessibility, SEO, and Performance |
| ⚡ **Real-time Analysis** | Three-tier pipeline with Master, Fetcher, and Analyzer workers |
| 📊 **WCAG Compliance** | Complete WCAG 2.1 AA/AAA mapping with educational content |
| 🎯 **Intelligent Prioritization** | Business impact scoring and conversion rate analysis |
| 💾 **Cloud Storage** | Supabase storage with CDN delivery for screenshots |
| 👥 **Workspace Management** | Invite members, manage roles, and collaborate on analyses |
| 📈 **Analytics Dashboard** | Historical tracking and progress monitoring |
| 🌙 **Modern UI** | Dark/light mode with responsive design |
| 🌐 **Internationalization** | Multi-language support with i18next |
| 📄 **Export & Sharing** | Professional reports with public sharing links |
| 🐳 **Production Ready** | Docker deployment with health checks and monitoring |
| 🔒 **Security First** | Row Level Security, audit logging, and comprehensive validation |

## 🛠️ Tech Stack

### Backend V3 (TypeScript)
- **Runtime**: Node.js 18+ with Express.js and full TypeScript support
- **Database**: Google Cloud SQL PostgreSQL with application-level multi-tenancy
- **Queue System**: BullMQ with Google Cloud Memorystore (Redis) for job processing
- **Authentication**: Firebase Auth with workspace management and JWT validation
- **Storage**: Google Cloud Storage with secure bucket policies and CDN delivery
- **Analysis Engine**: Modular system with 100+ rules for Accessibility, SEO, Performance
- **Security**: Helmet, CORS, rate limiting, IAM-based access control, and audit logging
- **Logging**: Winston with structured logging and Google Cloud Logging integration
- **Validation**: Zod schemas for comprehensive input validation

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript and modern hooks
- **Styling**: Styled Components with comprehensive theme system
- **Routing**: React Router v6 with workspace-aware protected routes
- **State Management**: Context API with workspace and authentication contexts
- **API Client**: Axios with interceptors, error handling, and retry logic
- **UI Components**: Custom component library with accessibility focus
- **Internationalization**: i18next with dynamic language switching
- **Build Tool**: Create React App with TypeScript template

### Infrastructure & DevOps
- **Database**: Google Cloud SQL PostgreSQL with high availability and automated backups
- **Authentication**: Firebase Auth with email confirmation and password management
- **Storage**: Google Cloud Storage with secure bucket policies and global CDN
- **Redis**: Google Cloud Memorystore for Redis queue system and caching
- **Secrets**: Google Secret Manager for secure credential management
- **Deployment**: Docker multi-stage builds with Google Cloud Run/GKE support
- **Environment**: Google Cloud native configuration with environment separation
- **Monitoring**: Google Cloud Monitoring, Logging, and comprehensive error tracking
- **Job Processing**: Cloud-native queue system for scalable analysis processing

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18 or higher
- **Docker** and **Docker Compose** (optional, for containerized development)  
- **Git** for version control
- **Google Cloud Account** with billing enabled
- **Firebase Project** for authentication
- **Google Cloud CLI** (`gcloud`) installed and configured

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/sitecraft.git
   cd sitecraft
   ```

2. **Install all dependencies** (root, backend, and frontend)
   ```bash
   npm run install-all
   ```

3. **Google Cloud Infrastructure Setup**
   
   Set up your Google Cloud infrastructure:
   ```bash
   # Enable required APIs
   gcloud services enable sqladmin.googleapis.com storage.googleapis.com \
     redis.googleapis.com secretmanager.googleapis.com firebase.googleapis.com \
     identitytoolkit.googleapis.com
   
   # Create Cloud SQL instance
   gcloud sql instances create street-wise-web-db \
     --database-version=POSTGRES_15 --tier=db-g1-small \
     --region=us-central1 --availability-type=REGIONAL
   
   # Create application database
   gcloud sql databases create streetwiseweb --instance=street-wise-web-db
   
   # Create Cloud Storage bucket
   gsutil mb -p PROJECT_ID -c standard -l us-central1 \
     gs://street-wise-web-assets/
   
   # Set up Firebase Auth (via console.firebase.google.com)
   firebase login
   firebase init
   ```

4. **Environment Configuration**
   ```bash
   # Copy the environment template
   cp .env.example .env
   ```
   
   **Configure your `.env` file:**
   ```bash
   # ===========================================
   # GOOGLE CLOUD CONFIGURATION
   # ===========================================
   GOOGLE_CLOUD_PROJECT=street-wise-web
   GOOGLE_APPLICATION_CREDENTIALS=./firebase-admin-key.json
   
   # ===========================================
   # DATABASE (Cloud SQL)
   # ===========================================
   CLOUD_SQL_CONNECTION_NAME=street-wise-web:us-central1:street-wise-web-db
   DB_USER=streetwise_app
   DB_PASSWORD=your-secure-password
   DB_NAME=streetwiseweb
   
   # ===========================================
   # FIREBASE AUTH
   # ===========================================
   FIREBASE_PROJECT_ID=street-wise-web
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@street-wise-web.iam.gserviceaccount.com
   
   # ===========================================
   # STORAGE (Cloud Storage)
   # ===========================================
   GCS_BUCKET_NAME=street-wise-web-assets
   
   # ===========================================
   # REDIS (Cloud Memorystore)
   # ===========================================
   REDIS_HOST=10.0.0.3
   REDIS_PORT=6379
   ```

5. **Database Setup**
   
   Run the Google Cloud setup scripts:
   ```bash
   # Connect to your Cloud SQL instance
   gcloud sql connect street-wise-web-db --user=postgres
   
   # Or use the Cloud SQL Proxy for local development
   cloud_sql_proxy -instances=INSTANCE_CONNECTION_NAME=tcp:5432
   
   # Execute scripts in order from database/GoogleSetup/:
   # 1. 01_extensions_and_types.sql
   # 2. 02_core_tables.sql  
   # 3. 03_analysis_engine_tables.sql
   # 4. 04_issues_tables.sql
   # 5. 05_billing_tables.sql
   # 6. 06_reporting_audit_tables.sql
   # 7. 07_firebase_functions.sql
   # 8. 08_triggers.sql
   # 9. 09_application_security.sql
   # 10. 10_seed_data.sql
   ```

## 🚀 Running the Application

### Option 1: Local Development (Recommended for development)

**Start the full application locally:**
```bash
npm run start:dev  # Uses APP_ENV=development
```

This will start:
- **Backend API** at http://localhost:3005
- **Frontend** at http://localhost:3000
- **Automatic reload** on code changes

**Alternative: Start components individually**
```bash
# Backend only (development mode)
npm run backend

# Frontend only 
npm run frontend

# Both with concurrently
npm run dev
```

### Option 2: Docker Development (For testing containerization)

**Start with Docker (development environment):**
```bash
# Start development containers with hot reload
npm run docker:dev

# Or run in background
npm run docker:dev:detached

# View logs
npm run docker:logs

# Check service health
npm run health:docker
```

### Option 3: Production Deployment

**Local production build:**
```bash
# Set environment to production in .env
APP_ENV=production

# Build and start production
npm run start:prod
```

**Docker production:**
```bash
# Start production containers
npm run docker:prod

# Or run in background
npm run docker:prod:detached
```

### 🔍 Monitoring & Health Checks

```bash
# Check if all services are running
npm run health

# View Docker logs
npm run docker:logs:backend
npm run docker:logs:frontend

# Stop all Docker services
npm run docker:stop

# Clean up Docker resources
npm run docker:clean
```

## 📖 How to Use SiteCraft V3

### 🔐 Authentication & Account Management

**Complete authentication system with:**
- ✅ **Sign Up** with email confirmation required
- ✅ **Sign In** with proper error handling for wrong passwords
- ✅ **Email Confirmation** - users must confirm email before accessing
- ✅ **Password Reset** via email with secure token-based flow
- ✅ **Account Settings** - change email, password, or delete account
- ✅ **Account Deletion** with complete data cleanup

### 🏢 Multi-Tenant Workspace Management

1. **Create Workspace**
   - Set up your organization's workspace
   - Automatically become the workspace owner

2. **Invite Team Members**
   - Add members with different roles: Owner, Admin, Member
   - Manage permissions and access levels

3. **Workspace Collaboration**
   - Share analyses across team members
   - Track team progress and history

### 🔍 Website Analysis (Coming Soon)

The analysis engine includes 100+ rules covering:
- **Accessibility**: WCAG 2.1 AA/AAA compliance with educational content
- **SEO**: Technical and content optimization with business impact
- **Performance**: Core Web Vitals and conversion rate analysis

### 🛡️ Analysis Features

#### Comprehensive Accessibility Checks
- ✅ **Image Accessibility** - Alt text validation and decorative image detection
- ✅ **Form Controls** - Label associations and form validation
- ✅ **Color Contrast** - WCAG AA/AAA contrast ratio analysis
- ✅ **Heading Structure** - Logical heading hierarchy validation
- ✅ **Link Quality** - Link text and context analysis
- ✅ **ARIA Implementation** - Proper ARIA attributes and roles
- ✅ **Keyboard Navigation** - Tab order and focus management
- ✅ **Semantic HTML** - Proper use of HTML5 semantic elements
- ✅ **Page Structure** - Landmarks and content organization

#### Scoring System
| Score Type | Range | Description |
|------------|-------|-------------|
| **Overall Score** | 0-100 | Combined accessibility and usability rating |
| **Accessibility Score** | 0-100 | WCAG 2.1 compliance percentage |
| **SEO Score** | 0-100 | Search engine optimization rating |
| **Performance Score** | 0-100 | Page load and performance metrics |

#### Detailed Reports Include
- 📈 **Executive Summary** - Key metrics and priority issues
- 🔍 **Detailed Violations** - Complete issue descriptions with examples
- 🎯 **Prioritized Recommendations** - Actionable fixes ordered by impact
- 📸 **Visual Evidence** - Screenshots highlighting issues
- 🏗️ **Technical Guidance** - Element-specific code examples
- 📊 **Progress Tracking** - Historical analysis comparison

### 🔌 API Endpoints

```http
# Authentication
POST /api/auth/signup               # Register new user
POST /api/auth/signin               # Sign in user
POST /api/auth/signout              # Sign out user
POST /api/auth/forgot-password      # Send password reset email
POST /api/auth/reset-password       # Reset password with token
GET  /api/auth/me                   # Get current user profile
PUT  /api/auth/profile              # Update user profile
PUT  /api/auth/password             # Update user password
DELETE /api/auth/account            # Delete user account
POST /api/auth/resend-confirmation  # Resend email confirmation

# Workspaces
GET  /api/workspaces                # Get user's workspaces
POST /api/workspaces                # Create new workspace
GET  /api/workspaces/:id            # Get workspace details
PUT  /api/workspaces/:id            # Update workspace
DELETE /api/workspaces/:id          # Delete workspace (owner only)
POST /api/workspaces/:id/members    # Invite member
PUT  /api/workspaces/:id/members/:userId  # Update member role
DELETE /api/workspaces/:id/members/:userId # Remove member
POST /api/workspaces/:id/leave      # Leave workspace

# Health & Monitoring
GET  /api/health                    # API health check
GET  /                              # API info and documentation
```

## 🏗️ Project Structure

```
sitecraft/
├── 📁 backend/                     # TypeScript Backend V3
│   ├── 📁 src/
│   │   ├── 📁 api/                # API layer
│   │   │   ├── 📁 controllers/    # Request handlers
│   │   │   ├── 📁 middleware/     # Auth, validation, error handling
│   │   │   ├── 📁 routes/         # Route definitions
│   │   │   └── 📁 validators/     # Zod validation schemas
│   │   ├── 📁 config/             # Configuration management
│   │   ├── 📁 core/               # Core business logic
│   │   │   ├── 📁 analysis/       # Analysis engine modules
│   │   │   ├── 📁 auth/           # Authentication services
│   │   │   ├── 📁 billing/        # Billing and subscription logic
│   │   │   └── 📁 reporting/      # Report generation
│   │   ├── 📁 db/                 # Database utilities
│   │   ├── 📁 lib/                # Shared libraries
│   │   ├── 📁 types/              # TypeScript type definitions
│   │   ├── 📁 utils/              # Utility functions
│   │   ├── 📁 workers/            # Background job workers
│   │   └── 📄 server.ts           # Main server file
│   ├── 📄 Dockerfile.dev          # Development container
│   ├── 📄 Dockerfile.prod         # Production container
│   └── 📄 package.json
├── 📁 frontend/                   # React TypeScript Frontend
│   ├── 📁 src/
│   │   ├── 📁 components/         # Reusable UI components
│   │   ├── 📁 pages/              # Page components
│   │   ├── 📁 services/           # API client services
│   │   ├── 📁 hooks/              # Custom React hooks
│   │   ├── 📁 context/            # React context providers
│   │   ├── 📁 theme/              # Styling and theme system
│   │   └── 📁 utils/              # Frontend utilities
│   ├── 📁 public/
│   │   └── 📁 locales/            # Internationalization files
│   ├── 📄 Dockerfile.dev          # Development container
│   ├── 📄 Dockerfile.prod         # Production container
│   ├── 📄 nginx.conf              # Nginx configuration
│   └── 📄 package.json
├── 📁 database/                   # Database Setup Scripts
│   ├── 📁 setup/                  # Modular setup scripts
│   │   ├── 📄 01_extensions_and_types.sql
│   │   ├── 📄 02_core_tables.sql
│   │   ├── 📄 03_analysis_engine_tables.sql
│   │   ├── 📄 04_issues_tables.sql
│   │   ├── 📄 05_billing_tables.sql
│   │   ├── 📄 06_reporting_audit_tables.sql
│   │   ├── 📄 07_functions.sql
│   │   ├── 📄 08_triggers.sql
│   │   ├── 📄 09_rls_policies.sql
│   │   ├── 📄 10_initial_data.sql
│   │   └── 📄 README.md
│   └── 📄 database_schema.dbml    # Database schema definition
├── 📁 docs/                       # Project Documentation
│   └── 📁 backend-v2-plan/        # Backend implementation plan
├── 📁 scripts/                    # Utility scripts
│   └── 📄 health-check.js         # Service health monitoring
├── 📄 docker-compose.dev.yml      # Development Docker setup
├── 📄 docker-compose.prod.yml     # Production Docker setup
├── 📄 .env.example                # Unified environment template
├── 📄 .dockerignore               # Docker build optimization
├── 📄 DOCKER.md                   # Docker setup guide
├── 📄 CLAUDE.md                   # AI assistant instructions
├── 📄 README.md                   # This file
└── 📄 package.json                # Root scripts and dependencies
```

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run backend tests only
cd backend && npm test

# Run frontend tests only 
cd frontend && npm test

# Run tests with coverage
npm run test:coverage
```

## 🐛 Troubleshooting

<details>
<summary><strong>🔧 Common Issues</strong></summary>

### Database Connection Issues
```bash
# Check Supabase connection
# Verify .env file has correct SUPABASE_URL and keys
# Ensure APP_ENV matches your intended environment
```

### Puppeteer Installation Problems
```bash
# Force reinstall Puppeteer
npm install puppeteer --force

# Or use system Chrome
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

### Port Conflicts
```bash
# Check what's using the ports
netstat -ano | findstr :3001  # Backend
netstat -ano | findstr :3000  # Frontend

# Kill processes (Windows)
taskkill /PID <PID> /F

# Kill processes (Linux/Mac)
kill -9 <PID>
```

### Environment Configuration
- ✅ Verify `APP_ENV` is set correctly (`development` or `production`)
- ✅ Check that Supabase URLs and keys match your projects
- ✅ Ensure CORS origins match your frontend URL
- ✅ Confirm database setup scripts have been run successfully

### Docker Issues
```bash
# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up

# Check logs
docker-compose logs -f
```

### Memory Issues
- Restart both development servers
- Check system resource usage
- Consider increasing Node.js memory limit:
  ```bash
  NODE_OPTIONS="--max-old-space-size=4096" npm run dev
  ```

</details>

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **🍴 Fork** the repository
2. **🌿 Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **💻 Make** your changes following our coding standards
4. **🧪 Test** your changes thoroughly
5. **📝 Commit** with clear messages: `git commit -m 'Add amazing feature'`
6. **🚀 Push** to your branch: `git push origin feature/amazing-feature`
7. **📮 Submit** a Pull Request

### Development Guidelines
- Follow existing code style and conventions
- Add tests for new functionality
- Update documentation as needed
- Ensure all tests pass before submitting

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 💬 Support & Community

<div align="center">

### 🆘 Need Help?

| Resource | Description |
|----------|-------------|
| 📚 [Documentation](./docs/) | Complete project documentation |
| 🐛 [Issues](https://github.com/your-username/streetwiseweb/issues) | Bug reports and feature requests |
| 💬 [Discussions](https://github.com/your-username/streetwiseweb/discussions) | Community discussions and Q&A |
| 📧 [Email](mailto:support@streetwiseweb.com) | Direct support contact |

### 🙏 Acknowledgments

Built with amazing open-source tools:
- [axe-core](https://github.com/dequelabs/axe-core) for accessibility testing
- [Puppeteer](https://github.com/puppeteer/puppeteer) for web automation
- [React](https://reactjs.org/) for the frontend
- [Supabase](https://supabase.com/) for backend services
- [Node.js](https://nodejs.org/) for the runtime

</div>

---

<div align="center">

**Made with ❤️ for a more accessible web**

[⭐ Star this project](https://github.com/your-username/streetwiseweb) | [🐛 Report Bug](https://github.com/your-username/streetwiseweb/issues) | [💡 Request Feature](https://github.com/your-username/streetwiseweb/issues)

</div>