# Docker Setup Guide

This guide explains how to run SiteCraft using Docker for both development and production environments.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose v2.0 or higher
- A valid `.env` file (copy from `.env.example`)

## Quick Start

### Development Environment

```bash
# Start development environment with hot reload
npm run docker:dev

# Or start in detached mode (runs in background)
npm run docker:dev:detached

# View logs
npm run docker:logs

# View specific service logs
npm run docker:logs:backend
npm run docker:logs:frontend
```

### Production Environment

```bash
# Start production environment
npm run docker:prod

# Or start in detached mode
npm run docker:prod:detached
```

### Stopping and Cleanup

```bash
# Stop all services
npm run docker:stop

# Clean up containers, volumes, and images
npm run docker:clean
```

## Environment Configuration

### Development Setup

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Configure your `.env` file:**
   ```bash
   # Set environment to development
   APP_ENV=development
   
   # Add your Supabase development keys
   DEV_SUPABASE_URL=your_dev_supabase_url
   DEV_SUPABASE_ANON_KEY=your_dev_anon_key
   DEV_SUPABASE_SERVICE_ROLE_KEY=your_dev_service_key
   ```

3. **Start development environment:**
   ```bash
   npm run docker:dev
   ```

### Production Setup

1. **Set production environment:**
   ```bash
   # In your .env file
   APP_ENV=production
   
   # Add your Supabase production keys
   PROD_SUPABASE_URL=your_prod_supabase_url
   PROD_SUPABASE_ANON_KEY=your_prod_anon_key
   PROD_SUPABASE_SERVICE_ROLE_KEY=your_prod_service_key
   ```

2. **Start production environment:**
   ```bash
   npm run docker:prod
   ```

## Services Overview

### Development Stack

- **Frontend**: React app with hot reload (http://localhost:3000)
- **Backend**: Node.js API with hot reload (http://localhost:3005)
- **Redis**: Job queue and caching (localhost:6379)
- **PostgreSQL**: Optional local database (localhost:5432)

### Production Stack

- **Frontend**: Optimized React build served by Nginx (http://localhost:3000)
- **Backend**: Optimized Node.js API (http://localhost:3005)
- **Redis**: Job queue and caching with authentication
- **Nginx**: Reverse proxy and load balancer (http://localhost:80)

## Health Checks

All production services include health checks:

```bash
# Check service health
docker-compose -f docker-compose.prod.yml ps

# View health check logs
docker-compose -f docker-compose.prod.yml logs nginx
```

## Database Setup

### Using Supabase (Recommended)

No additional setup required. Configure your Supabase keys in `.env` and the app will connect automatically.

### Using Local PostgreSQL (Development Only)

The development stack includes a PostgreSQL container with the database schema pre-loaded:

- **Host**: localhost:5432
- **Database**: sitecraft
- **Username**: postgres
- **Password**: password

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Check what's using the ports
   lsof -i :3000
   lsof -i :3005
   
   # Stop conflicting services or change ports in docker-compose files
   ```

2. **Permission errors:**
   ```bash
   # Fix Docker permissions (Linux/Mac)
   sudo chown -R $USER:$USER .
   ```

3. **Memory issues:**
   ```bash
   # Increase Docker memory limit in Docker Desktop settings
   # Recommended: 4GB+ for development, 8GB+ for production
   ```

4. **Environment variables not loading:**
   ```bash
   # Ensure .env file exists and has correct format
   # No spaces around = signs
   # No quotes around values unless needed
   ```

### Logs and Debugging

```bash
# View all logs
docker-compose -f docker-compose.dev.yml logs

# View specific service logs
docker-compose -f docker-compose.dev.yml logs backend
docker-compose -f docker-compose.dev.yml logs frontend

# Follow logs in real-time
docker-compose -f docker-compose.dev.yml logs -f

# View container status
docker-compose -f docker-compose.dev.yml ps
```

### Rebuilding Services

```bash
# Rebuild specific service
docker-compose -f docker-compose.dev.yml build backend

# Rebuild all services
docker-compose -f docker-compose.dev.yml build

# Force rebuild without cache
docker-compose -f docker-compose.dev.yml build --no-cache
```

## Development Workflow

1. **Start development environment:**
   ```bash
   npm run docker:dev:detached
   ```

2. **Make code changes** - Files are hot-reloaded automatically

3. **View logs:**
   ```bash
   npm run docker:logs
   ```

4. **Test the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3005
   - API Documentation: http://localhost:3005/api/docs

5. **Stop when done:**
   ```bash
   npm run docker:stop
   ```

## Production Deployment

1. **Build production images:**
   ```bash
   npm run docker:prod
   ```

2. **Verify health checks:**
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3005

## Security Notes

- Production containers run as non-root users
- Health checks ensure service availability
- Nginx provides additional security headers
- Redis is password-protected in production
- All images use Alpine Linux for minimal attack surface

## Performance Optimization

- Multi-stage builds reduce image sizes
- Nginx serves static files efficiently
- Redis provides caching and session storage
- Gzip compression enabled for web assets
- Docker layers are optimized for caching