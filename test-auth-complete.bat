@echo off
echo ========================================
echo  Testing SiteCraft Authentication API
echo ========================================
echo.

:: Check if backend server is running
curl -s http://localhost:3001/health >nul 2>&1
if errorlevel 1 (
    echo ERROR: Backend server is not running
    echo Please run: cd backend && npm run dev
    pause
    exit /b 1
)

echo ✅ Backend server is running
echo.

:: Generate random email for testing
set /a "rand=%random% %% 9000 + 1000"
set "testEmail=test%rand%@example.com"
set "testPassword=Test123!@#"

echo 📧 Test Email: %testEmail%
echo 🔑 Test Password: %testPassword%
echo.

echo ========================================
echo  1. Testing User Registration
echo ========================================
echo.

curl -X POST http://localhost:3001/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\": \"%testEmail%\", \"password\": \"%testPassword%\", \"firstName\": \"John\", \"lastName\": \"Doe\"}" ^
  -w "\nHTTP Status: %%{http_code}\n" ^
  -o registration_response.json

echo.
echo Registration Response:
type registration_response.json | jq .
echo.

:: Extract access token from registration response
for /f "tokens=*" %%i in ('type registration_response.json ^| jq -r ".data.tokens.accessToken // empty"') do set "accessToken=%%i"

if "%accessToken%"=="" (
    echo ❌ Registration failed - no access token received
    goto :test_login
)

echo ✅ Registration successful - Access token received
echo.

echo ========================================
echo  2. Testing User Profile Access
echo ========================================
echo.

curl -X GET http://localhost:3001/api/auth/profile ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %accessToken%" ^
  -w "\nHTTP Status: %%{http_code}\n"

echo.

:test_login
echo ========================================
echo  3. Testing User Login
echo ========================================
echo.

curl -X POST http://localhost:3001/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\": \"%testEmail%\", \"password\": \"%testPassword%\"}" ^
  -w "\nHTTP Status: %%{http_code}\n" ^
  -o login_response.json

echo.
echo Login Response:
type login_response.json | jq .
echo.

:: Extract refresh token from login response
for /f "tokens=*" %%i in ('type login_response.json ^| jq -r ".data.tokens.refreshToken // empty"') do set "refreshToken=%%i"

if "%refreshToken%"=="" (
    echo ❌ Login failed - no refresh token received
    goto :cleanup
)

echo ✅ Login successful - Refresh token received
echo.

echo ========================================
echo  4. Testing Token Refresh
echo ========================================
echo.

curl -X POST http://localhost:3001/api/auth/refresh ^
  -H "Content-Type: application/json" ^
  -d "{\"refreshToken\": \"%refreshToken%\"}" ^
  -w "\nHTTP Status: %%{http_code}\n"

echo.

echo ========================================
echo  5. Testing Logout
echo ========================================
echo.

curl -X POST http://localhost:3001/api/auth/logout ^
  -H "Content-Type: application/json" ^
  -d "{\"refreshToken\": \"%refreshToken%\"}" ^
  -w "\nHTTP Status: %%{http_code}\n"

echo.

:cleanup
:: Clean up temporary files
del /q registration_response.json 2>nul
del /q login_response.json 2>nul

echo ========================================
echo  Authentication Testing Complete! 🎉
echo ========================================
echo.
echo If you see successful HTTP 200/201 responses above,
echo your authentication system is working correctly!
echo.
echo You can now:
echo ✅ Register new users
echo ✅ Login existing users  
echo ✅ Access protected routes with JWT tokens
echo ✅ Refresh expired tokens
echo ✅ Logout users
echo.
pause