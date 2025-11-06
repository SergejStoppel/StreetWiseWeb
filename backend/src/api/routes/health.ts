import express from 'express';
import { ApiResponse } from '@/types';
import { supabase } from '@/config/supabase';
import { config } from '@/config';
import { createLogger } from '@/config/logger';
import { Queue } from 'bullmq';

const router = express.Router();
const logger = createLogger('health');

// Service status type
type ServiceStatus = 'healthy' | 'degraded' | 'unhealthy';

interface ServiceCheck {
  status: ServiceStatus;
  message?: string;
  responseTime?: number;
  details?: any;
}

interface HealthCheckResult {
  status: ServiceStatus;
  timestamp: string;
  version: string;
  services: {
    database: ServiceCheck;
    redis: ServiceCheck;
    storage: ServiceCheck;
    queues: ServiceCheck;
  };
  metrics: {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
}

/**
 * Check database connectivity by querying Supabase
 */
async function checkDatabase(): Promise<ServiceCheck> {
  const startTime = Date.now();

  try {
    const { count, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });

    const responseTime = Date.now() - startTime;

    if (error) {
      logger.error('Database health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        message: `Database query failed: ${error.message}`,
        responseTime,
      };
    }

    // Check if response time is acceptable (< 1000ms is healthy, < 3000ms is degraded)
    const status: ServiceStatus = responseTime < 1000 ? 'healthy' : responseTime < 3000 ? 'degraded' : 'unhealthy';

    return {
      status,
      message: status === 'healthy' ? 'Database is responding normally' : 'Database is slow to respond',
      responseTime,
      details: {
        userCount: count,
      },
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    logger.error('Database health check error', { error: error.message });
    return {
      status: 'unhealthy',
      message: `Database connection error: ${error.message}`,
      responseTime,
    };
  }
}

/**
 * Check Redis connectivity by attempting to connect
 */
async function checkRedis(): Promise<ServiceCheck> {
  const startTime = Date.now();

  try {
    // Create a temporary connection to test Redis
    const Redis = require('ioredis');
    const redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      connectTimeout: 5000,
      maxRetriesPerRequest: 1,
    });

    // Test Redis with a ping
    await redis.ping();
    const responseTime = Date.now() - startTime;

    // Get Redis info
    const info = await redis.info('server');
    const memoryInfo = await redis.info('memory');

    await redis.quit();

    // Check if response time is acceptable
    const status: ServiceStatus = responseTime < 100 ? 'healthy' : responseTime < 500 ? 'degraded' : 'unhealthy';

    return {
      status,
      message: status === 'healthy' ? 'Redis is responding normally' : 'Redis is slow to respond',
      responseTime,
      details: {
        connected: true,
      },
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    logger.error('Redis health check error', { error: error.message });
    return {
      status: 'unhealthy',
      message: `Redis connection error: ${error.message}`,
      responseTime,
    };
  }
}

/**
 * Check Supabase storage connectivity
 */
async function checkStorage(): Promise<ServiceCheck> {
  const startTime = Date.now();

  try {
    // List buckets to verify storage connectivity
    const { data: buckets, error } = await supabase.storage.listBuckets();

    const responseTime = Date.now() - startTime;

    if (error) {
      logger.error('Storage health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        message: `Storage query failed: ${error.message}`,
        responseTime,
      };
    }

    // Check if response time is acceptable
    const status: ServiceStatus = responseTime < 1000 ? 'healthy' : responseTime < 3000 ? 'degraded' : 'unhealthy';

    return {
      status,
      message: status === 'healthy' ? 'Storage is responding normally' : 'Storage is slow to respond',
      responseTime,
      details: {
        bucketCount: buckets?.length || 0,
        buckets: buckets?.map(b => b.name) || [],
      },
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    logger.error('Storage health check error', { error: error.message });
    return {
      status: 'unhealthy',
      message: `Storage connection error: ${error.message}`,
      responseTime,
    };
  }
}

/**
 * Check queue health by getting metrics from all queues
 */
async function checkQueues(): Promise<ServiceCheck> {
  const startTime = Date.now();

  try {
    // Define all queue names
    const queueNames = [
      'master-analysis',
      'fetcher',
      'accessibility-colorContrast',
      'accessibility-aria',
      'accessibility-keyboard',
      'accessibility-media',
      'forms-analysis',
      'structure-analysis',
      'tables-analysis',
      'seo-technical',
    ];

    // Create queue instances to check their health
    const queues = queueNames.map(name => new Queue(name, {
      connection: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
      },
    }));

    // Get counts for each queue
    const queueMetrics = await Promise.all(
      queues.map(async (queue) => {
        try {
          const [waiting, active, completed, failed] = await Promise.all([
            queue.getWaitingCount(),
            queue.getActiveCount(),
            queue.getCompletedCount(),
            queue.getFailedCount(),
          ]);

          return {
            name: queue.name,
            waiting,
            active,
            completed,
            failed,
          };
        } catch (error: any) {
          return {
            name: queue.name,
            error: error.message,
          };
        }
      })
    );

    // Close all queue connections
    await Promise.all(queues.map(q => q.close()));

    const responseTime = Date.now() - startTime;

    // Check if any queue has errors or too many failed jobs
    const hasErrors = queueMetrics.some(m => 'error' in m);
    const totalFailed = queueMetrics.reduce((sum, m) => sum + (m.failed || 0), 0);
    const totalWaiting = queueMetrics.reduce((sum, m) => sum + (m.waiting || 0), 0);

    let status: ServiceStatus;
    let message: string;

    if (hasErrors) {
      status = 'unhealthy';
      message = 'Some queues are not responding';
    } else if (totalFailed > 10) {
      status = 'degraded';
      message = `${totalFailed} failed jobs detected across queues`;
    } else if (totalWaiting > 50) {
      status = 'degraded';
      message = `${totalWaiting} jobs waiting in queues - system may be under load`;
    } else {
      status = 'healthy';
      message = 'All queues are operating normally';
    }

    return {
      status,
      message,
      responseTime,
      details: {
        queues: queueMetrics,
        summary: {
          totalWaiting,
          totalActive: queueMetrics.reduce((sum, m) => sum + (m.active || 0), 0),
          totalCompleted: queueMetrics.reduce((sum, m) => sum + (m.completed || 0), 0),
          totalFailed,
        },
      },
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    logger.error('Queue health check error', { error: error.message });
    return {
      status: 'unhealthy',
      message: `Queue health check error: ${error.message}`,
      responseTime,
    };
  }
}

/**
 * Determine overall system status based on service statuses
 */
function determineOverallStatus(services: HealthCheckResult['services']): ServiceStatus {
  const statuses = Object.values(services).map(s => s.status);

  if (statuses.some(s => s === 'unhealthy')) {
    return 'unhealthy';
  }

  if (statuses.some(s => s === 'degraded')) {
    return 'degraded';
  }

  return 'healthy';
}

/**
 * @swagger
 * /api/health/status:
 *   get:
 *     summary: Get detailed system health status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: System health status
 */
router.get('/status', async (req, res) => {
  try {
    // Run all health checks in parallel
    const [database, redis, storage, queues] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkStorage(),
      checkQueues(),
    ]);

    const services = {
      database,
      redis,
      storage,
      queues,
    };

    const overallStatus = determineOverallStatus(services);

    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      services,
      metrics: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
    };

    // Return 200 for healthy/degraded, 503 for unhealthy
    const statusCode = overallStatus === 'unhealthy' ? 503 : 200;

    const response: ApiResponse = {
      success: overallStatus !== 'unhealthy',
      data: result,
      timestamp: new Date().toISOString(),
    };

    res.status(statusCode).json(response);
  } catch (error: any) {
    logger.error('Health check endpoint error', { error: error.message });

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'HEALTH_CHECK_ERROR',
        message: 'Failed to perform health checks',
        details: error.message,
      },
      timestamp: new Date().toISOString(),
    };

    res.status(503).json(response);
  }
});

export default router;