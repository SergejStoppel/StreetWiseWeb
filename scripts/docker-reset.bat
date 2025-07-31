@echo off
echo 🧹 Cleaning up Docker containers and images...

REM Stop all containers
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.prod.yml down

REM Remove sitecraft containers
FOR /f "tokens=1" %%i IN ('docker ps -a ^| findstr sitecraft') DO docker rm %%i

REM Remove sitecraft images  
FOR /f "tokens=3" %%i IN ('docker images ^| findstr sitecraft') DO docker rmi %%i

REM Remove unused containers, networks, images, and build cache
docker system prune -f

echo ✅ Docker cleanup complete!
echo 🚀 Ready to rebuild containers