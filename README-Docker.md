# SiteCraft Docker Setup

This Docker setup provides a consistent environment for running SiteCraft with all Chrome dependencies pre-installed.

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose

## Quick Start

### Windows
```cmd
start-docker.bat
```

### Linux/WSL
```bash
./start-docker.sh
```

## Manual Setup

### Production Build
```bash
docker-compose up -d
```

### Development Mode
```bash
docker-compose -f docker-compose.dev.yml up -d
```

## URLs

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## Docker Commands

### View running containers
```bash
docker-compose ps
```

### View logs
```bash
docker-compose logs
docker-compose logs backend
docker-compose logs frontend
```

### Stop containers
```bash
docker-compose down
```

### Rebuild containers
```bash
docker-compose down
docker-compose build
docker-compose up -d
```

### Clean up everything
```bash
docker-compose down -v
docker system prune -a
```

## Benefits

- ✅ **Consistent Environment**: Same setup on Windows, WSL, and Linux
- ✅ **Chrome Pre-installed**: All dependencies included
- ✅ **No Mock Data**: Real accessibility analysis
- ✅ **Isolated**: No conflicts with host system
- ✅ **Easy Setup**: One command to start everything

## Development

The Docker setup includes:
- Hot reload for both frontend and backend
- Volume mounts for live code editing
- Health checks for reliability
- Proper Chrome configuration for containers

## Troubleshooting

### Container fails to start
```bash
docker-compose logs backend
```

### Chrome issues
The Docker image includes all Chrome dependencies. If you still see Chrome errors, try:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Permission issues
```bash
docker-compose down
sudo docker system prune -a
docker-compose up -d
```