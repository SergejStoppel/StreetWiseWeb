# SiteCraft Database Setup with Docker

## Prerequisites

1. **Install Docker Desktop** (if not already installed):
   - Download from: https://www.docker.com/products/docker-desktop/
   - Enable WSL 2 integration in Docker Desktop settings

## Quick Start

### 1. Start the Database
```bash
# Navigate to project root
cd /mnt/c/Sergej/Code/SiteCraft

# Start PostgreSQL container
docker-compose up -d postgres

# Check if container is running
docker-compose ps
```

### 2. Run Database Migrations
```bash
# Navigate to backend directory
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations to create tables
npx prisma migrate dev --name init

# Open Prisma Studio (optional - database GUI)
npx prisma studio
```

### 3. Start the Backend Server
```bash
# Install dependencies (if not done already)
npm install

# Start development server
npm run dev
```

## Database Access

### Connection Details
- **Host**: localhost
- **Port**: 5432
- **Database**: sitecraft
- **Username**: sitecraft_user
- **Password**: sitecraft_password

### pgAdmin (Web Interface)
- **URL**: http://localhost:8080
- **Email**: admin@sitecraft.com
- **Password**: admin123

To connect to the database in pgAdmin:
1. Right-click "Servers" → "Create" → "Server"
2. **General Tab**: Name = "SiteCraft Local"
3. **Connection Tab**:
   - Host: postgres
   - Port: 5432
   - Database: sitecraft
   - Username: sitecraft_user
   - Password: sitecraft_password

## Useful Commands

```bash
# Start all services (PostgreSQL + pgAdmin)
docker-compose up -d

# Start only PostgreSQL
docker-compose up -d postgres

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: This deletes all data)
docker-compose down -v

# View logs
docker-compose logs postgres

# Connect to PostgreSQL directly
docker-compose exec postgres psql -U sitecraft_user -d sitecraft

# Reset database (WARNING: This deletes all data)
docker-compose down -v
docker-compose up -d postgres
cd backend && npx prisma migrate deploy
```

## Troubleshooting

### If Docker command not found in WSL:
1. Install Docker Desktop on Windows
2. Enable WSL 2 integration in Docker Desktop settings
3. Restart WSL

### If port 5432 is already in use:
```bash
# Check what's using port 5432
sudo lsof -i :5432

# Or change the port in docker-compose.yml
# Change "5432:5432" to "5433:5432" and update DATABASE_URL
```

### If migration fails:
```bash
# Reset Prisma migrations
rm -rf backend/prisma/migrations
npx prisma migrate dev --name init
```

## Database Schema

The database includes these main tables:
- **users** - User accounts and authentication
- **user_sessions** - JWT token management
- **websites** - User's tracked websites
- **audits** - Website audit results and scores
- **content_requests** - AI content generation requests
- **generated_content** - AI-generated content
- **subscriptions** - Stripe subscription management

## Next Steps

Once the database is running:
1. Test the health endpoint: `curl http://localhost:3001/health`
2. Test user registration: `POST http://localhost:3001/api/auth/register`
3. Continue with the frontend setup