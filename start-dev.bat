@echo off
echo Starting StreetWiseWeb in Development Mode...
echo.
echo This will start containers with hot reloading enabled.
echo Code changes will be reflected automatically without rebuild.
echo.

echo Checking for Supabase configuration...
if not exist .env (
    echo ⚠️  WARNING: .env file not found!
    echo Please create a .env file with your Supabase credentials.
    echo.
)

echo Checking if containers are already running...
docker-compose -f docker-compose.dev.yml ps -q >nul 2>&1

echo Starting development containers...
docker-compose -f docker-compose.dev.yml up -d

if %errorlevel% neq 0 (
    echo.
    echo ❌ Failed to start containers. Trying to rebuild...
    docker-compose -f docker-compose.dev.yml down
    docker-compose -f docker-compose.dev.yml up --build -d
    
    if %errorlevel% neq 0 (
        echo.
        echo ❌ Still failed. Check error messages above.
        pause
        exit /b 1
    )
)

echo.
echo ✅ StreetWiseWeb is running in development mode!
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend:  http://localhost:3005
echo.
echo 🔥 HOT RELOADING ENABLED:
echo - Frontend changes reload automatically
echo - Backend restarts on file changes
echo - No need to rebuild for code changes!
echo.
echo Useful commands:
echo - View logs:      docker-compose -f docker-compose.dev.yml logs -f
echo - Stop:           docker-compose -f docker-compose.dev.yml down
echo - Restart:        docker-compose -f docker-compose.dev.yml restart
echo - Check status:   docker-compose -f docker-compose.dev.yml ps
echo.
echo Press any key to exit (containers will keep running)...
pause >nul