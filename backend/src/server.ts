import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config, validateConfig, isDevelopment } from '@/config';
import { createLogger } from '@/config/logger';
import { AppError } from '@/types';

// Import middleware
import { errorHandler } from '@/api/middleware/errorHandler';
import { requestLogger } from '@/api/middleware/requestLogger';
import { notFoundHandler } from '@/api/middleware/notFoundHandler';

// Import routes
import authRoutes from '@/api/routes/auth';
import workspaceRoutes from '@/api/routes/workspaces';
import analysisRoutes from '@/api/routes/analyses';
import reportRoutes from '@/api/routes/reports';
import billingRoutes from '@/api/routes/billing';
import healthRoutes from '@/api/routes/health';
import debugRoutes from '@/api/routes/debug';
import testAnalysisRoutes from '@/api/routes/test-analysis';

const logger = createLogger('server');

class Server {
  private app: express.Application;

  constructor() {
    this.app = express();
    this.validateEnvironment();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private validateEnvironment(): void {
    try {
      validateConfig();
      logger.info('Configuration validated successfully');
    } catch (error) {
      logger.error('Configuration validation failed', { error: (error as Error).message });
      process.exit(1);
    }
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));

    // CORS configuration
    this.app.use(cors({
      origin: [config.frontendUrl, 'http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Workspace-ID'],
    }));

    // Rate limiting
    if (!isDevelopment) {
      const limiter = rateLimit({
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
        message: {
          error: 'Too many requests from this IP, please try again later.',
        },
        standardHeaders: true,
        legacyHeaders: false,
      });
      this.app.use(limiter);
    }

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression
    this.app.use(compression());

    // Request logging
    this.app.use(requestLogger);

    // Health check endpoint (before auth)
    this.app.get('/health', (_req, res) => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '2.0.0',
        environment: config.nodeEnv,
      });
    });
  }

  private initializeRoutes(): void {
    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/workspaces', workspaceRoutes);
    this.app.use('/api/analyses', analysisRoutes);
    this.app.use('/api/reports', reportRoutes);
    this.app.use('/api/billing', billingRoutes);
    this.app.use('/api/health', healthRoutes);
    this.app.use('/api/debug', debugRoutes);
    this.app.use('/api/test-analysis', testAnalysisRoutes);

    // API documentation (in development)
    if (isDevelopment) {
      import('swagger-ui-express').then(swaggerUi => {
        import('@/config/swagger').then(swagger => {
          this.app.use('/api/docs', swaggerUi.default.serve);
          this.app.get('/api/docs', swaggerUi.default.setup(swagger.swaggerSpec));
        }).catch(error => {
          logger.warn('Failed to load Swagger documentation', { error: (error as Error).message });
        });
      }).catch(error => {
        logger.warn('Swagger UI not available', { error: (error as Error).message });
      });
    }

    // Root endpoint
    this.app.get('/', (_req, res) => {
      res.json({
        name: 'SiteCraft Backend V2',
        version: '2.0.0',
        description: 'Multi-tenant accessibility analysis platform',
        documentation: isDevelopment ? `${config.frontendUrl}/api/docs` : undefined,
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Initialize database connections, queues, etc.
      await this.initializeServices();

      const server = this.app.listen(config.port, () => {
        logger.info(`Server started successfully`, {
          port: config.port,
          environment: config.nodeEnv,
          pid: process.pid,
        });
      });

      // Graceful shutdown handling
      const gracefulShutdown = (signal: string) => {
        logger.info(`Received ${signal}, shutting down gracefully`);
        
        server.close(async () => {
          logger.info('HTTP server closed');
          
          try {
            await this.cleanup();
            logger.info('Cleanup completed successfully');
            process.exit(0);
          } catch (error) {
            logger.error('Error during cleanup', { error: (error as Error).message });
            process.exit(1);
          }
        });

        // Force shutdown after 30 seconds
        setTimeout(() => {
          logger.error('Could not close connections in time, forcefully shutting down');
          process.exit(1);
        }, 30000);
      };

      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));

      // Handle unhandled promise rejections
      process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Rejection at Promise', { reason, promise });
        throw new AppError('Unhandled Promise Rejection', 500, false);
      });

      // Handle uncaught exceptions
      process.on('uncaughtException', (error: Error) => {
        logger.error('Uncaught Exception thrown', { error: error.message, stack: error.stack });
        process.exit(1);
      });

    } catch (error) {
      logger.error('Failed to start server', { error: (error as Error).message });
      process.exit(1);
    }
  }

  private async initializeServices(): Promise<void> {
    logger.info('Initializing services...');

    // Initialize BullMQ workers for analysis pipeline
    try {
      // Import and start workers
      const { masterWorker } = await import('@/core/workers/master.worker');
      const { fetcherWorker } = await import('@/core/workers/fetcher.worker');
      const { colorContrastWorker } = await import('@/core/workers/accessibility/colorContrast.worker');
      
      logger.info('BullMQ workers initialized successfully', {
        workers: ['master', 'fetcher', 'colorContrast']
      });
    } catch (error) {
      logger.error('Failed to initialize workers', { error: error.message });
      throw error;
    }

    logger.info('Services initialized successfully');
  }

  private async cleanup(): Promise<void> {
    logger.info('Starting cleanup...');

    try {
      // Close BullMQ workers
      const { masterWorker } = await import('@/core/workers/master.worker');
      const { fetcherWorker } = await import('@/core/workers/fetcher.worker');  
      const { colorContrastWorker } = await import('@/core/workers/accessibility/colorContrast.worker');
      
      await Promise.all([
        masterWorker.close(),
        fetcherWorker.close(),
        colorContrastWorker.close()
      ]);
      
      logger.info('BullMQ workers closed successfully');
    } catch (error) {
      logger.warn('Error closing workers', { error: error.message });
    }

    logger.info('Cleanup completed');
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new Server();
  server.start().catch(error => {
    logger.error('Failed to start application', { error: (error as Error).message });
    process.exit(1);
  });
}

export default Server;