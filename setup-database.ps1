# SiteCraft Database Setup Script (PowerShell)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " SiteCraft Database Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
try {
    docker --version | Out-Null
    Write-Host "✓ Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Docker is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    Write-Host "Make sure to enable WSL 2 integration in Docker Desktop settings" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Docker is not running" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Navigate to project directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir
Write-Host "Current directory: $PWD" -ForegroundColor Blue
Write-Host ""

# Stop any existing containers
Write-Host "Stopping any existing containers..." -ForegroundColor Yellow
docker-compose down 2>$null
Write-Host ""

# Start PostgreSQL container
Write-Host "Starting PostgreSQL container..." -ForegroundColor Yellow
docker-compose up -d postgres
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to start PostgreSQL container" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✓ PostgreSQL container started" -ForegroundColor Green
Write-Host ""

# Wait for PostgreSQL to be ready
Write-Host "Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
do {
    Start-Sleep -Seconds 2
    $ready = docker-compose exec -T postgres pg_isready -U sitecraft_user -d sitecraft 2>$null
} while ($LASTEXITCODE -ne 0)

Write-Host "✓ PostgreSQL is ready" -ForegroundColor Green
Write-Host ""

# Navigate to backend directory
if (-not (Test-Path "backend")) {
    Write-Host "ERROR: Backend directory not found" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Set-Location "backend"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing Node.js dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
    Write-Host ""
}

# Generate Prisma client
Write-Host "Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to generate Prisma client" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✓ Prisma client generated" -ForegroundColor Green
Write-Host ""

# Run database migrations
Write-Host "Running database migrations..." -ForegroundColor Yellow
npx prisma migrate dev --name init
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to run migrations" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✓ Database migrations completed" -ForegroundColor Green
Write-Host ""

# Test database connection
Write-Host "Testing database connection..." -ForegroundColor Yellow
$testScript = @"
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.`$queryRaw``SELECT 1``.then(() => {
    console.log('✓ Database connection successful');
    process.exit(0);
}).catch((error) => {
    console.log('ERROR: Database connection failed');
    console.log(error.message);
    process.exit(1);
}).finally(() => {
    prisma.`$disconnect();
});
"@

$testScript | node
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Database connection test failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Setup Complete! 🎉" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Database is running at: localhost:5432" -ForegroundColor Green
Write-Host "Database name: sitecraft" -ForegroundColor Green
Write-Host "Username: sitecraft_user" -ForegroundColor Green
Write-Host "Password: sitecraft_password" -ForegroundColor Green
Write-Host ""
Write-Host "pgAdmin web interface: http://localhost:8080" -ForegroundColor Blue
Write-Host "Login: admin@sitecraft.com / admin123" -ForegroundColor Blue
Write-Host ""
Write-Host "To start the backend server:" -ForegroundColor Yellow
Write-Host "  cd backend" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "To test the API:" -ForegroundColor Yellow
Write-Host "  curl http://localhost:3001/health" -ForegroundColor White
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "  docker-compose ps          - Check container status" -ForegroundColor White
Write-Host "  docker-compose logs        - View logs" -ForegroundColor White
Write-Host "  docker-compose down        - Stop containers" -ForegroundColor White
Write-Host "  npx prisma studio          - Open database GUI" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit"