@echo off
echo ========================================
echo  SiteCraft Database Setup Script
echo ========================================
echo.

:: Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed or not in PATH
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/
    echo Make sure to enable WSL 2 integration in Docker Desktop settings
    pause
    exit /b 1
)

echo ✓ Docker is installed
echo.

:: Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running
    echo Please start Docker Desktop and try again
    pause
    exit /b 1
)

echo ✓ Docker is running
echo.

:: Navigate to project directory
cd /d "%~dp0"
echo Current directory: %CD%
echo.

:: Stop any existing containers
echo Stopping any existing containers...
docker-compose down >nul 2>&1
echo.

:: Start PostgreSQL container
echo Starting PostgreSQL container...
docker-compose up -d postgres
if errorlevel 1 (
    echo ERROR: Failed to start PostgreSQL container
    pause
    exit /b 1
)

echo ✓ PostgreSQL container started
echo.

:: Wait for PostgreSQL to be ready
echo Waiting for PostgreSQL to be ready...
:wait_loop
docker-compose exec -T postgres pg_isready -U sitecraft_user -d sitecraft >nul 2>&1
if errorlevel 1 (
    timeout /t 2 >nul
    goto wait_loop
)

echo ✓ PostgreSQL is ready
echo.

:: Navigate to backend directory
cd backend
if errorlevel 1 (
    echo ERROR: Backend directory not found
    pause
    exit /b 1
)

:: Check if node_modules exists
if not exist "node_modules" (
    echo Installing Node.js dependencies...
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✓ Dependencies installed
    echo.
)

:: Generate Prisma client
echo Generating Prisma client...
npx prisma generate
if errorlevel 1 (
    echo ERROR: Failed to generate Prisma client
    pause
    exit /b 1
)

echo ✓ Prisma client generated
echo.

:: Run database migrations
echo Running database migrations...
npx prisma migrate dev --name init
if errorlevel 1 (
    echo ERROR: Failed to run migrations
    pause
    exit /b 1
)

echo ✓ Database migrations completed
echo.

:: Test database connection
echo Testing database connection...
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.$queryRaw\`SELECT 1\`.then(() => {
    console.log('✓ Database connection successful');
    process.exit(0);
}).catch((error) => {
    console.log('ERROR: Database connection failed');
    console.log(error.message);
    process.exit(1);
}).finally(() => {
    prisma.$disconnect();
});
"
if errorlevel 1 (
    echo ERROR: Database connection test failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Setup Complete! 🎉
echo ========================================
echo.
echo Database is running at: localhost:5432
echo Database name: sitecraft
echo Username: sitecraft_user
echo Password: sitecraft_password
echo.
echo pgAdmin web interface: http://localhost:8080
echo Login: admin@sitecraft.com / admin123
echo.
echo To start the backend server:
echo   cd backend
echo   npm run dev
echo.
echo To test the API:
echo   curl http://localhost:3001/health
echo.
echo Useful commands:
echo   docker-compose ps          - Check container status
echo   docker-compose logs        - View logs
echo   docker-compose down        - Stop containers
echo   npx prisma studio          - Open database GUI
echo.
pause