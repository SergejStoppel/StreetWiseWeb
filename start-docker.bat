@echo off
echo Starting SiteCraft with Docker...
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

echo Building and starting SiteCraft containers...
echo This may take a few minutes on the first run...
echo.

docker-compose down
docker-compose build
if %errorlevel% neq 0 (
    echo.
    echo ❌ Failed to build SiteCraft containers.
    echo Check the error messages above for details.
    echo.
    pause
    exit /b 1
)

docker-compose up -d
if %errorlevel% neq 0 (
    echo.
    echo ❌ Failed to start SiteCraft containers.
    echo Check the error messages above for details.
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ SiteCraft is running in Docker containers!
echo.
echo Backend will be available at: http://localhost:3001
echo Frontend will be available at: http://localhost:3000
echo.
echo You can check the status with: docker-compose ps
echo You can view logs with: docker-compose logs
echo You can stop the containers with: docker-compose down
echo.
echo The system includes:
echo - ✅ Chrome pre-installed with all dependencies
echo - ✅ Consistent environment across Windows and WSL
echo - ✅ Real accessibility analysis (no mock data)
echo - ✅ Screenshots, SEO analysis, and AI insights
echo.

pause