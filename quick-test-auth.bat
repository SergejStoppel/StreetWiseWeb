@echo off
echo ========================================
echo  Quick SiteCraft Authentication Test
echo ========================================
echo.

:: Test 1: Health Check
echo 1. Testing Health Check...
curl -s http://localhost:3001/health
echo.
echo.

:: Test 2: Debug Route
echo 2. Testing Auth Debug Route...
curl -s http://localhost:3001/api/auth/debug
echo.
echo.

:: Test 3: User Registration
echo 3. Testing User Registration...
curl -X POST http://localhost:3001/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\": \"quicktest@example.com\", \"password\": \"Test123!@#\", \"firstName\": \"Quick\", \"lastName\": \"Test\"}"
echo.
echo.

:: Test 4: User Login
echo 4. Testing User Login...
curl -X POST http://localhost:3001/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\": \"quicktest@example.com\", \"password\": \"Test123!@#\"}"
echo.
echo.

echo ========================================
echo  Quick Test Complete!
echo ========================================
echo.
echo If you see JSON responses above without errors,
echo your authentication system is working! 🎉
echo.
pause