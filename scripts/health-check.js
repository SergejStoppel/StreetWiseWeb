#!/usr/bin/env node

/**
 * Health Check Script
 * Checks if all services are running and healthy
 */

const axios = require('axios');

const services = [
  {
    name: 'Frontend',
    url: 'http://localhost:3000',
    timeout: 5000
  },
  {
    name: 'Backend API',
    url: 'http://localhost:3005/health',
    timeout: 5000
  },
  {
    name: 'Backend Auth',
    url: 'http://localhost:3005/api/auth/me',
    timeout: 5000,
    expectStatus: 401 // Should return 401 without auth token
  }
];

async function checkService(service) {
  try {
    const response = await axios.get(service.url, {
      timeout: service.timeout,
      validateStatus: function (status) {
        // Accept any status code for this check
        return status < 500;
      }
    });

    const expectedStatus = service.expectStatus || 200;
    const isHealthy = response.status === expectedStatus;

    return {
      name: service.name,
      url: service.url,
      status: response.status,
      healthy: isHealthy,
      responseTime: response.headers['x-response-time'] || 'N/A',
      message: isHealthy ? 'OK' : `Expected ${expectedStatus}, got ${response.status}`
    };
  } catch (error) {
    return {
      name: service.name,
      url: service.url,
      status: 'ERROR',
      healthy: false,
      responseTime: 'N/A',
      message: error.code || error.message
    };
  }
}

async function healthCheck() {
  console.log('🏥 SiteCraft Health Check');
  console.log('========================\n');

  const results = await Promise.all(services.map(checkService));
  
  let allHealthy = true;

  results.forEach(result => {
    const icon = result.healthy ? '✅' : '❌';
    const status = result.status === 'ERROR' ? 'ERROR' : `${result.status}`;
    
    console.log(`${icon} ${result.name}`);
    console.log(`   URL: ${result.url}`);
    console.log(`   Status: ${status}`);
    console.log(`   Message: ${result.message}`);
    console.log('');

    if (!result.healthy) {
      allHealthy = false;
    }
  });

  if (allHealthy) {
    console.log('🎉 All services are healthy!');
    process.exit(0);
  } else {
    console.log('⚠️  Some services are unhealthy');
    process.exit(1);
  }
}

// Check if running in Docker
const isDocker = process.env.DOCKER === 'true';
if (isDocker) {
  // Update URLs for Docker network
  services.forEach(service => {
    service.url = service.url
      .replace('localhost:3000', 'frontend:3000')
      .replace('localhost:3005', 'backend:3005');
  });
}

// Run health check
healthCheck().catch(error => {
  console.error('Health check failed:', error.message);
  process.exit(1);
});