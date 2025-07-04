@echo off
echo ========================================
echo  Starting SiteCraft Backend Server
echo ========================================
echo.

:: Navigate to backend directory
cd /d "%~dp0\backend"

:: Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo WARNING: Docker is not running
    echo Starting Docker containers...
    cd ..
    docker-compose up -d postgres
    cd backend
    echo ✓ Database started
    echo.
)

:: Check if database is ready
echo Checking database connection...
docker-compose exec -T postgres pg_isready -U sitecraft_user -d sitecraft >nul 2>&1
if errorlevel 1 (
    echo ERROR: Database is not ready
    echo Please run setup-database.bat first
    pause
    exit /b 1
)

echo ✓ Database is ready
echo.

:: Start the backend server
echo Starting backend server...
echo Server will be available at: http://localhost:3001
echo Health check: http://localhost:3001/health
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev