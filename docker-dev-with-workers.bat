@echo off
REM Start development environment with all workers

echo Starting SiteCraft development environment with workers...
echo This will start:
echo   - Backend API
echo   - Frontend React App
echo   - Redis
echo   - Master Worker
echo   - Fetcher Worker
echo   - Accessibility Workers
echo   - SEO Workers
echo   - Performance Workers (NEW!)
echo.

REM Use both docker-compose files
docker-compose -f docker-compose.dev.yml -f docker-compose.workers.yml up

REM To run in detached mode, use:
REM docker-compose -f docker-compose.dev.yml -f docker-compose.workers.yml up -d

REM To stop all services:
REM docker-compose -f docker-compose.dev.yml -f docker-compose.workers.yml down