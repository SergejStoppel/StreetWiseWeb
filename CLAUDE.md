# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SiteCraft is a comprehensive web accessibility analysis tool that provides instant insights into website compliance with WCAG guidelines. It uses a React frontend with a Node.js/Express backend powered by Puppeteer and axe-core for accessibility analysis.

## Key Commands

### Development
```bash
# Install all dependencies (root, backend, and frontend)
npm run install-all

# Run both frontend and backend in development mode
npm run dev

# Run backend only (port 3001)
npm run backend

# Run frontend only (port 3000) 
npm run frontend
```

### Testing
```bash
# Run all tests (backend and frontend)
npm run test

# Run backend tests only
cd backend && npm test

# Run frontend tests only
cd frontend && npm test
```

### Building
```bash
# Build frontend for production
npm run build

# Start backend in production mode
npm start
```

### Linting and Type Checking
No lint or typecheck commands are currently configured. When implementing new code, ensure consistent code style by following existing patterns in the codebase.

## Architecture Overview

### Backend Architecture (Node.js/Express)

The backend follows a service-oriented architecture with modular analyzers:

- **Routes** (`backend/routes/`): API endpoints for accessibility analysis
- **Services** (`backend/services/`): Business logic organized by feature
  - `analysis/`: Individual analyzer classes for different accessibility aspects
    - Each analyzer (e.g., `colorContrastAnalyzer.js`, `FormAnalyzer.js`) handles specific WCAG criteria
    - `AiAnalysisService.js` provides AI-powered analysis capabilities
  - `cache/`: Caching functionality for performance optimization
  - `reporting/`: Report generation and formatting
  - `utils/`: Utility functions for browser control, validation, etc.
- **Middleware** (`backend/middleware/`): Express middleware for security, logging, validation

Key patterns:
- Each analyzer extends a base class and implements standardized analysis methods
- Services are instantiated and injected where needed
- Puppeteer browser instances are managed centrally for performance

### Frontend Architecture (React)

The frontend uses modern React patterns with hooks and context:

- **Pages** (`frontend/src/pages/`): Route-based page components
- **Components** (`frontend/src/components/`): Reusable UI components
- **Services** (`frontend/src/services/`): API client services using Axios
- **Hooks** (`frontend/src/hooks/`): Custom React hooks for shared logic
- **Theme** (`frontend/src/theme/`): Theme context for dark/light mode support
- **Utils** (`frontend/src/utils/`): Frontend utility functions

Key patterns:
- Styled Components for CSS-in-JS styling
- Context API for theme and language management
- i18n support with translations in `public/locales/` (en, de, es)

## Important Configuration

### Environment Variables
Backend requires a `.env` file (copy from `.env.example`):
- `PORT`: Backend server port (default: 3001)
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:3000)
- `NODE_ENV`: Environment (development/production)
- `LOG_LEVEL`: Winston logging level
- `ANALYSIS_TIMEOUT`: Maximum time for analysis (ms)
- `MAX_CONCURRENT_ANALYSES`: Concurrent analysis limit

### Proxy Configuration
Frontend is configured to proxy API requests to `http://localhost:3005` (note: this differs from the actual backend port 3001 and may need adjustment).

## Testing Strategy

- Backend uses Jest with unit tests in `__tests__` directories
- No Jest configuration file exists, so tests use default Jest settings
- Frontend uses React Testing Library (via Create React App)
- Run tests before committing changes

## Key Features to Understand

1. **Multi-Analyzer System**: Each accessibility aspect has its own analyzer class that can be independently updated
2. **Caching**: CacheManager provides performance optimization for repeated analyses
3. **Internationalization**: Full i18n support with language detection and switching
4. **Reporting**: Comprehensive report generation with export functionality
5. **Security**: Rate limiting, CORS, and Helmet middleware for security

## Development Workflow

1. Feature branches off `master` (e.g., `feature/UpdatingResultsSection`)
2. Run `npm run dev` to start both frontend and backend
3. Make changes and test locally
4. Run tests with `npm run test`
5. Create pull requests to `master`

## Common Development Tasks

### Adding a New Analyzer
1. Create new analyzer class in `backend/services/analysis/`
2. Extend base analyzer class and implement required methods
3. Register analyzer in the main analysis service
4. Add corresponding frontend display components

### Adding API Endpoints
1. Create route handler in `backend/routes/`
2. Add validation middleware if needed
3. Implement service method for business logic
4. Update frontend API service to consume endpoint

### Adding UI Components
1. Create component in appropriate directory under `frontend/src/components/`
2. Use Styled Components for styling
3. Follow existing component patterns for consistency
4. Add i18n keys for any user-facing text

## Docker Support

The project includes Docker configuration for both development and production:
- `docker-compose.yml`: Production setup
- `docker-compose.dev.yml`: Development setup with hot reloading
- Use Docker for consistent development environments across team members