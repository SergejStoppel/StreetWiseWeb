@echo off
echo Starting StreetWiseWeb in Development Mode...
echo.
echo This will start containers with hot reloading enabled.
echo Code changes will be reflected automatically without rebuild.
echo.

echo Checking for unified environment configuration...
if not exist .env (
    echo ❌ ERROR: .env file not found!
    echo Please create your .env file from the template:
    echo    copy .env.example .env
    echo Then edit .env and set your Supabase credentials.
    echo.
    pause
    exit /b 1
)

echo Setting environment to DEVELOPMENT mode...
set APP_ENV=development

echo Checking for running containers...
docker ps -q --filter "name=sitecraft" >nul 2>&1
if %errorlevel% equ 0 (
    echo Found running containers. Stopping them first...
    docker-compose -f docker-compose.dev.yml down
)

echo Starting development containers with fresh build...
docker-compose -f docker-compose.dev.yml up --build -d

if %errorlevel% neq 0 (
    echo.
    echo ❌ Failed to start containers. Check error messages above.
    pause
    exit /b 1
)

echo.
echo ✅ StreetWiseWeb is running in DEVELOPMENT mode!
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend:  http://localhost:3005
echo 💾 Database: Development Supabase project
echo.
echo 🔥 HOT RELOADING ENABLED:
echo - Frontend changes reload automatically
echo - Backend restarts on file changes
echo - No need to rebuild for code changes!
echo - Environment: APP_ENV=development
echo.
echo Useful commands:
echo - View logs:      docker-compose -f docker-compose.dev.yml logs -f
echo - Stop:           docker-compose -f docker-compose.dev.yml down
echo - Restart:        docker-compose -f docker-compose.dev.yml restart
echo - Check status:   docker-compose -f docker-compose.dev.yml ps
echo.
echo Press any key to exit (containers will keep running)...
pause >nul