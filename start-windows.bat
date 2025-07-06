@echo off
echo Starting SiteCraft Accessibility Analysis System...
echo.

echo Starting backend server...
cd /d "%~dp0backend"
start "SiteCraft Backend" cmd /k "npm run dev"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo Starting frontend server...
cd /d "%~dp0frontend"
start "SiteCraft Frontend" cmd /k "npm start"

echo.
echo Both servers are starting...
echo Backend will be available at: http://localhost:3001
echo Frontend will be available at: http://localhost:3000
echo.
echo Press any key to exit...
pause >nul