# 🌐 StreetWiseWeb

> **Comprehensive Website Accessibility Analysis Tool**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-green.svg)](https://supabase.com/)
[![Docker](https://img.shields.io/badge/Docker-Supported-blue.svg)](https://www.docker.com/)

StreetWiseWeb is a comprehensive web accessibility analysis tool that provides instant insights into website compliance with WCAG guidelines. Built with modern web technologies, it delivers detailed reports with actionable recommendations to help make the web more accessible for everyone.

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔍 **Comprehensive Analysis** | Uses axe-core and custom checks for thorough accessibility evaluation |
| ⚡ **Real-time Reporting** | Instant analysis results with detailed scoring and metrics |
| 📊 **WCAG Compliance** | Checks against Web Content Accessibility Guidelines (WCAG 2.1) |
| 🎯 **Actionable Recommendations** | Specific, prioritized guidance for fixing accessibility issues |
| 💾 **Screenshot Storage** | Captures and stores website screenshots in Supabase storage |
| 👥 **User Management** | Full user authentication and profile management |
| 📈 **Analytics Dashboard** | Track analysis history and progress over time |
| 🌙 **Dark/Light Mode** | Responsive UI with theme switching |
| 🌐 **Multilingual** | Support for English, German, and Spanish |
| 📱 **Responsive Design** | Works seamlessly on desktop and mobile devices |
| 📄 **Export Reports** | Download detailed analysis reports in multiple formats |
| 🐳 **Docker Ready** | Easy deployment with Docker containers |

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 16+ with Express framework
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Storage**: Supabase Storage for screenshots and files
- **Analysis**: Puppeteer for web scraping + axe-core for accessibility testing
- **Security**: Helmet, CORS, rate limiting, and comprehensive middleware
- **Logging**: Winston with structured logging and log rotation
- **Environment**: Unified development/production configuration

### Frontend
- **Framework**: React 18 with modern hooks and functional components
- **Styling**: Styled Components with theme support
- **Routing**: React Router v6 with protected routes
- **State Management**: React Context API + custom hooks
- **API Client**: Axios with interceptors and error handling
- **UI Components**: Custom component library with React Icons
- **Internationalization**: i18next with language detection
- **Build Tool**: Create React App with custom configurations

### Infrastructure
- **Database**: Supabase PostgreSQL with automated backups
- **Authentication**: Supabase Auth with JWT tokens
- **Storage**: Supabase Storage with CDN delivery
- **Deployment**: Docker containers with multi-stage builds
- **Environment Management**: Unified .env configuration for dev/prod

## 🚀 Quick Start

### Prerequisites
- **Node.js** v16 or higher
- **npm** or **yarn**
- **Git** for version control
- **Supabase Account** (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/streetwiseweb.git
   cd streetwiseweb
   ```

2. **Install all dependencies** (root, backend, and frontend)
   ```bash
   npm run install-all
   ```

3. **Environment Configuration**
   ```bash
   # Copy the environment template
   cp .env.example .env
   ```
   
   **Edit `.env` file with your Supabase credentials:**
   ```bash
   # Environment selector
   APP_ENV=development
   
   # Development Supabase Project
   DEV_SUPABASE_URL=https://your-dev-project-id.supabase.co
   DEV_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   DEV_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   
   # Production Supabase Project (when ready)
   PROD_SUPABASE_URL=https://your-prod-project-id.supabase.co
   PROD_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   PROD_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **Database Setup**
   
   Follow the [Database Setup Guide](./database/README.md) to configure your Supabase database:
   - Create development and production Supabase projects
   - Run the database setup scripts
   - Configure storage buckets and policies

### 🖥️ Development Mode

**Start the full application:**
```bash
npm run dev
```

This will start:
- **Backend API** at http://localhost:3001
- **Frontend** at http://localhost:3000
- **Automatic reload** on code changes

**Alternative: Start components individually**
```bash
# Backend only
npm run backend

# Frontend only 
npm run frontend
```

### 🐳 Docker Deployment

**Development with Docker:**
```bash
# Windows
start-dev.bat

# Linux/Mac
docker-compose -f docker-compose.dev.yml up
```

**Production with Docker:**
```bash
# Windows  
start-docker.bat

# Linux/Mac
docker-compose up -d
```

### 🏭 Production Build

1. **Set environment to production:**
   ```bash
   # In .env file
   APP_ENV=production
   ```

2. **Build the application:**
   ```bash
   npm run build
   ```

3. **Start production server:**
   ```bash
   npm start
   ```

## 📖 How to Use

### For End Users

1. **🔐 Sign Up/Login**
   - Create an account or sign in with existing credentials
   - Access your personal dashboard with analysis history

2. **🌐 Enter Website URL**
   - Input the URL of the website you want to analyze
   - Choose analysis type (Quick, Overview, or Detailed)

3. **⚡ Start Analysis**
   - Click "Analyze Website" to begin the accessibility audit
   - Watch real-time progress indicators

4. **📊 View Results**
   - Review comprehensive reports with scores and recommendations
   - Explore interactive violations with screenshots
   - Navigate through categorized issues

5. **💾 Save & Export**
   - Save analyses to your dashboard
   - Export reports in multiple formats
   - Share results with team members

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
# Analysis
POST /api/analysis/analyze          # Start new website analysis
GET  /api/analysis/:id              # Get analysis results
GET  /api/analysis/user/:userId     # Get user's analysis history

# Screenshots
GET  /api/screenshots/:analysisId   # Get analysis screenshots

# Health & Status
GET  /api/health                    # API health check
GET  /api/version                   # API version info

# User Management
GET  /api/user/profile              # Get user profile
PUT  /api/user/profile              # Update user profile
GET  /api/user/dashboard            # Get dashboard statistics
```

## 🏗️ Project Structure

```
streetwiseweb/
├── 📁 backend/                 # Node.js/Express API server
│   ├── 📁 routes/             # API route handlers
│   ├── 📁 services/           # Business logic and analysis engines
│   │   ├── 📁 analysis/       # Individual analyzer modules
│   │   ├── 📁 cache/          # Caching functionality
│   │   ├── 📁 reporting/      # Report generation
│   │   └── 📁 utils/          # Backend utilities
│   ├── 📁 middleware/         # Express middleware (auth, validation, etc.)
│   ├── 📁 config/             # Configuration files
│   └── 📁 logs/               # Application logs
├── 📁 frontend/               # React application
│   ├── 📁 src/
│   │   ├── 📁 components/     # Reusable UI components
│   │   ├── 📁 pages/          # Page components and routes
│   │   ├── 📁 services/       # API client services
│   │   ├── 📁 hooks/          # Custom React hooks
│   │   ├── 📁 theme/          # Theme and styling system
│   │   └── 📁 utils/          # Frontend utilities
│   ├── 📁 public/
│   │   └── 📁 locales/        # i18n translation files
│   └── 📄 package.json
├── 📁 database/               # Database setup and migrations
│   ├── 📄 COMPLETE_PRODUCTION_SETUP.sql  # Complete database setup
│   ├── 📄 STORAGE_BUCKET_SETUP.sql       # Storage policies setup
│   └── 📄 README.md           # Database setup guide
├── 📁 docs/                   # Documentation
├── 📁 docker/                 # Docker configurations
├── 📄 docker-compose.yml      # Production Docker setup
├── 📄 docker-compose.dev.yml  # Development Docker setup
├── 📄 .env.example            # Environment template
├── 📄 CLAUDE.md               # AI assistant instructions
└── 📄 package.json            # Root package.json with scripts
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