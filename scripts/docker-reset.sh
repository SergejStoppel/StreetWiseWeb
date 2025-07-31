#!/bin/bash

echo "🧹 Cleaning up Docker containers and images..."

# Stop all containers
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.prod.yml down

# Remove sitecraft containers
docker ps -a | grep sitecraft | awk '{print $1}' | xargs -r docker rm

# Remove sitecraft images
docker images | grep sitecraft | awk '{print $3}' | xargs -r docker rmi

# Remove unused containers, networks, images, and build cache
docker system prune -f

echo "✅ Docker cleanup complete!"
echo "🚀 Ready to rebuild containers"