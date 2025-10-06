#!/bin/bash
# Start development environment with all workers

echo "Starting SiteCraft development environment with workers..."
echo "This will start:"
echo "  - Backend API"
echo "  - Frontend React App"
echo "  - Redis"
echo "  - Master Worker"
echo "  - Fetcher Worker"
echo "  - Accessibility Workers"
echo "  - SEO Workers"
echo "  - Performance Workers (NEW!)"
echo ""

# Use both docker-compose files
docker-compose -f docker-compose.dev.yml -f docker-compose.workers.yml up

# To run in detached mode, use:
# docker-compose -f docker-compose.dev.yml -f docker-compose.workers.yml up -d

# To stop all services:
# docker-compose -f docker-compose.dev.yml -f docker-compose.workers.yml down