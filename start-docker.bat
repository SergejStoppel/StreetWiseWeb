@echo off
echo Starting StreetWiseWeb with Docker...
echo.

echo Checking Docker availability...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed or not running.
    echo Please install Docker Desktop and make sure it's running.
    echo Download from: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

echo ✅ Docker is available
echo.

echo Checking Docker Compose availability...
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not available.
    echo Please install Docker Compose or use Docker Desktop which includes it.
    pause
    exit /b 1
)

echo ✅ Docker Compose is available
echo.

echo Checking for Supabase configuration...
if not exist .env (
    echo ⚠️  WARNING: .env file not found!
    echo Please create a .env file with your Supabase credentials.
    echo.
)

echo Building and starting StreetWiseWeb containers...
echo This may take a few minutes on the first run...
echo.

docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml build
if %errorlevel% neq 0 (
    echo.
    echo ❌ Failed to build StreetWiseWeb containers.
    echo Check the error messages above for details.
    echo.
    pause
    exit /b 1
)

docker-compose -f docker-compose.dev.yml up -d
if %errorlevel% neq 0 (
    echo.
    echo ❌ Failed to start StreetWiseWeb containers.
    echo Check the error messages above for details.
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ StreetWiseWeb is running in Docker containers!
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend:  http://localhost:3005
echo.
echo 📊 Useful commands:
echo - View status:    docker-compose -f docker-compose.dev.yml ps
echo - View logs:      docker-compose -f docker-compose.dev.yml logs -f
echo - Stop all:       docker-compose -f docker-compose.dev.yml down
echo - Restart:        docker-compose -f docker-compose.dev.yml restart
echo.
echo 🚀 Features:
echo - ✅ Supabase authentication and database
echo - ✅ Chrome pre-installed for analysis
echo - ✅ Real accessibility analysis
echo - ✅ Screenshots, SEO analysis, and AI insights
echo - ✅ User dashboard and analysis history
echo.
echo 📝 Note: Supabase credentials are loaded from .env file
echo.

pause