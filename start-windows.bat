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
echo NOTE: If you're running this in WSL and experience Chrome issues,
echo please run the following command in your WSL terminal:
echo.
echo sudo apt-get update ^&^& sudo apt-get install -y libnss3-dev libatk-bridge2.0-dev libdrm-dev libxkbcommon-dev libgbm-dev libasound2-dev libxss1 libgconf-2-4 libxrandr2 libasound2 libpangocairo-1.0-0 libgtk-3-0 fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils
echo.
echo Press any key to exit...
pause >nul