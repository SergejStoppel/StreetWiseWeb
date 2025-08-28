# SiteCraft Backend V2

A modern, scalable, multi-tenant accessibility analysis platform built with TypeScript, Express, and BullMQ.

## 🏗️ Architecture Overview

This backend implements a three-tier analysis pipeline with multi-tenant workspace isolation:

- **Tier 1: Master Worker** - Orchestrates analysis requests
- **Tier 2: Fetcher Worker** - Captures website assets once
- **Tier 3: Analyzer Workers** - Specialized analysis (Accessibility, SEO, Performance)

## 📁 Project Structure

```
src/
├── api/                    # API layer (routes, controllers, middleware)
│   ├── routes/            # Express route definitions
│   ├── controllers/       # Request/response handlers
│   ├── middleware/        # Auth, validation, error handling
│   └── validators/        # Request validation schemas
├── core/                  # Business logic layer
│   ├── auth/             # Authentication & authorization
│   ├── billing/          # Stripe integration & subscription management
│   ├── analysis/         # Analysis orchestration logic
│   ├── reporting/        # Report generation & formatting
│   └── monitoring/       # System monitoring & health checks
├── workers/              # Background job processors
│   ├── accessibility/    # Accessibility analysis workers
│   ├── seo/             # SEO analysis workers
│   ├── performance/     # Performance analysis workers
│   └── ai/              # AI-powered analysis workers
├── lib/                  # Shared libraries & utilities
│   ├── queue/           # BullMQ queue management
│   ├── storage/         # Supabase storage integration
│   ├── metrics/         # Prometheus metrics collection
│   ├── security/        # Security utilities & encryption
│   └── validation/      # Shared validation logic
├── db/                   # Database layer
│   ├── migrations/      # Database schema migrations
│   ├── seeds/           # Database seed data
│   └── functions/       # Database functions & triggers
├── config/              # Configuration management
├── types/               # TypeScript type definitions
├── utils/               # General utility functions
└── test/                # Test suites
    ├── unit/            # Unit tests
    ├── integration/     # Integration tests
    ├── fixtures/        # Test data fixtures
    └── mocks/           # Mock implementations
```

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Set up database:**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## 📜 Available Scripts

### Development
- `npm run dev` - Start development server with hot reload
- `npm run start:dev` - Start development server without hot reload
- `npm run build` - Build for production
- `npm start` - Start production server

### Database
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data
- `npm run db:reset` - Reset database (migrate + seed)

### Workers
- `npm run worker:master` - Start master worker
- `npm run worker:fetcher` - Start fetcher worker
- `npm run worker:accessibility` - Start accessibility workers
- `npm run worker:seo` - Start SEO workers
- `npm run worker:performance` - Start performance workers

### Testing
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

### Documentation
- `npm run docs:generate` - Generate API documentation
- `npm run docs:serve` - Serve API documentation

## 🔧 Configuration

The application uses environment variables for configuration. Copy `.env.example` to `.env` and update the values:

### Required Configuration
- **Database**: Supabase URL and keys
- **Redis**: Redis connection for job queues
- **Stripe**: Billing and subscription management
- **OpenAI**: AI-powered analysis features

### Optional Configuration
- **Monitoring**: Prometheus metrics
- **CDN**: Asset delivery optimization
- **Email**: Notification services

## 🏢 Multi-Tenant Architecture

The system is designed with workspace-based multi-tenancy:

- **Workspaces**: Isolated environments for teams/organizations
- **Row-Level Security**: Database-level access control
- **Resource Quotas**: Per-workspace limits and billing
- **Asset Isolation**: Workspace-scoped storage paths

## 🔍 Analysis Pipeline

### 1. Analysis Request
```typescript
POST /api/workspaces/:id/analyses
{
  "websiteId": "uuid",
  "analysisTypes": ["accessibility", "seo", "performance"]
}
```

### 2. Pipeline Execution
1. **Master Worker** validates request and enqueues fetcher job
2. **Fetcher Worker** captures website assets and screenshots
3. **Analyzer Workers** process assets in parallel
4. **Results** are aggregated and stored

### 3. Report Generation
```typescript
GET /api/reports/:analysisId?type=detailed
```

## 🛡️ Security Features

- **Authentication**: Supabase Auth with JWT tokens
- **Authorization**: Role-based access control (RBAC)
- **Row-Level Security**: Database-level multi-tenant isolation
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Comprehensive request validation
- **Encryption**: Sensitive data encryption at rest

## 📊 Monitoring & Observability

- **Health Checks**: `/health` endpoint for service monitoring
- **Metrics**: Prometheus metrics collection
- **Logging**: Structured logging with Winston
- **Error Tracking**: Comprehensive error handling and reporting
- **Audit Logs**: User action tracking for compliance

## 🧪 Testing Strategy

- **Unit Tests**: Individual function/class testing
- **Integration Tests**: API endpoint and database testing
- **Worker Tests**: Background job processing testing
- **E2E Tests**: Full pipeline testing with real websites

## 🚀 Deployment

The application is designed for containerized deployment:

```bash
# Build Docker image
docker build -t sitecraft-backend .

# Run with Docker Compose
docker-compose up -d
```

## 📝 API Documentation

Interactive API documentation is available at `/api/docs` when the server is running.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run the test suite: `npm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the [API documentation](/api/docs)
- Review the [troubleshooting guide](docs/troubleshooting.md)