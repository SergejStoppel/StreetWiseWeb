@echo off
echo ========================================
echo  Testing SiteCraft API
echo ========================================
echo.

:: Check if backend server is running
curl -s http://localhost:3001/health >nul 2>&1
if errorlevel 1 (
    echo ERROR: Backend server is not running
    echo Please run start-backend.bat first
    pause
    exit /b 1
)

echo ✓ Backend server is running
echo.

echo Testing Health Endpoint...
curl -s http://localhost:3001/health | jq .
echo.

echo Testing User Registration...
curl -X POST http://localhost:3001/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\": \"test@example.com\", \"password\": \"Test123!@#\", \"firstName\": \"John\", \"lastName\": \"Doe\"}" | jq .
echo.

echo Testing User Login...
curl -X POST http://localhost:3001/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\": \"test@example.com\", \"password\": \"Test123!@#\"}" | jq .
echo.

echo ========================================
echo  API Testing Complete!
echo ========================================
echo.
echo If you see JSON responses above, the API is working correctly.
echo You can now register users and authenticate them.
echo.
pause