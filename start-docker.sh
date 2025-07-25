#!/bin/bash

echo "Starting StreetWiseWeb with Docker..."
echo ""

echo "Checking Docker availability..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed."
    echo "Please install Docker first:"
    echo "  Ubuntu/Debian: sudo apt-get install docker.io"
    echo "  CentOS/RHEL: sudo yum install docker"
    echo "  Or visit: https://docs.docker.com/engine/install/"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker is not running."
    echo "Please start Docker service:"
    echo "  sudo systemctl start docker"
    exit 1
fi

echo "✅ Docker is available"
echo ""

echo "Checking Docker Compose availability..."
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not available."
    echo "Please install Docker Compose:"
    echo "  sudo apt-get install docker-compose"
    echo "  Or visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker Compose is available"
echo ""

echo "Building and starting StreetWiseWeb containers..."
echo "This may take a few minutes on the first run..."
echo ""

docker-compose down
docker-compose build
docker-compose up -d

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ StreetWiseWeb is starting in Docker containers!"
    echo ""
    echo "Backend will be available at: http://localhost:3001"
    echo "Frontend will be available at: http://localhost:3000"
    echo ""
    echo "You can check the status with: docker-compose ps"
    echo "You can view logs with: docker-compose logs"
    echo "You can stop the containers with: docker-compose down"
    echo ""
    echo "The system includes:"
    echo "- ✅ Chrome pre-installed with all dependencies"
    echo "- ✅ Consistent environment across Windows and WSL"
    echo "- ✅ Real accessibility analysis (no mock data)"
    echo "- ✅ Screenshots, SEO analysis, and AI insights"
    echo ""
else
    echo ""
    echo "❌ Failed to start StreetWiseWeb containers."
    echo "Check the error messages above for details."
    echo ""
fi