@echo off
echo ========================================
echo  Creating SiteCraft Database Tables
echo ========================================
echo.

:: Check if Docker container is running
docker-compose ps | findstr "sitecraft-postgres" | findstr "running" >nul
if errorlevel 1 (
    echo ERROR: PostgreSQL container is not running
    echo Please run setup-database.bat first
    pause
    exit /b 1
)

echo ✓ PostgreSQL container is running
echo.

:: Execute the SQL script to create tables
echo Creating database tables...
docker-compose exec -T postgres psql -U sitecraft_user -d sitecraft -f - < create-tables.sql
if errorlevel 1 (
    echo ERROR: Failed to create tables
    pause
    exit /b 1
)

echo ✓ Database tables created successfully
echo.

:: Verify tables were created
echo Verifying tables...
docker-compose exec -T postgres psql -U sitecraft_user -d sitecraft -c "\dt"

echo.
echo ========================================
echo  Tables Created Successfully! 🎉
echo ========================================
echo.
echo You can now:
echo 1. Start the backend server: start-backend.bat
echo 2. View tables in pgAdmin: http://localhost:8080
echo 3. Test the API endpoints
echo.
pause