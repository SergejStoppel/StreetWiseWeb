@echo off
echo ========================================
echo  Testing SiteCraft Audit API
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

echo ========================================
echo  1. Testing Audit Health Check
echo ========================================
echo.

curl -s http://localhost:3001/api/audit/health | jq .
echo.

echo ========================================
echo  2. Starting Website Audit
echo ========================================
echo.

echo Testing with example.com (should be accessible)...
curl -X POST http://localhost:3001/api/audit/scan ^
  -H "Content-Type: application/json" ^
  -d "{\"url\": \"https://example.com\", \"auditType\": \"ACCESSIBILITY_FOCUS\"}" ^
  -w "\nHTTP Status: %%{http_code}\n" ^
  -o audit_response.json

echo.
echo Audit Response:
type audit_response.json | jq .
echo.

:: Extract audit ID
for /f "tokens=*" %%i in ('type audit_response.json ^| jq -r ".auditId // empty"') do set "auditId=%%i"

if "%auditId%"=="" (
    echo ❌ No audit ID received - audit failed to start
    goto :cleanup
)

echo ✅ Audit started with ID: %auditId%
echo.

echo ========================================
echo  3. Checking Audit Results
echo ========================================
echo.

echo Waiting for audit to complete...
timeout /t 5 >nul

:check_results
curl -s http://localhost:3001/api/audit/results/%auditId% ^
  -w "\nHTTP Status: %%{http_code}\n" ^
  -o results_response.json

echo.
echo Audit Status Check:
type results_response.json | jq .status
echo.

:: Check if completed
for /f "tokens=*" %%i in ('type results_response.json ^| jq -r ".status // empty"') do set "status=%%i"

if "%status%"=="COMPLETED" (
    echo ✅ Audit completed successfully!
    echo.
    echo Accessibility Score:
    type results_response.json | jq .accessibilityAnalysis.score
    echo.
    echo Issues Summary:
    type results_response.json | jq .accessibilityAnalysis.summary
    echo.
) else if "%status%"=="RUNNING" (
    echo ⏳ Audit still running, waiting...
    timeout /t 5 >nul
    goto :check_results
) else if "%status%"=="FAILED" (
    echo ❌ Audit failed
    type results_response.json | jq .message
) else (
    echo ⏳ Checking again in a moment...
    timeout /t 3 >nul
    goto :check_results
)

echo ========================================
echo  4. Testing Recent Audits List
echo ========================================
echo.

curl -s http://localhost:3001/api/audit/recent | jq .
echo.

:cleanup
:: Clean up temporary files
del /q audit_response.json 2>nul
del /q results_response.json 2>nul

echo ========================================
echo  Audit API Testing Complete! 🎉
echo ========================================
echo.
echo If you see successful responses above,
echo your website audit system is working!
echo.
echo To test the frontend interface:
echo 1. Open frontend/index.html in your browser
echo 2. Enter a website URL (e.g., https://example.com)
echo 3. Click "Start Accessibility Audit"
echo.
pause