const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Load unified environment configuration
const envConfig = require('./config/environment');

const accessibilityRoutes = require('./routes/accessibility');
const analysisRoutes = require('./routes/analysis');
const logger = require('./utils/logger');

const app = express();
const PORT = envConfig.PORT;

// Trust proxy for rate limiting (required for development behind proxies)
app.set('trust proxy', 1);

// Security middleware (production only or when enabled)
if (envConfig.ENABLE_HELMET) {
  app.use(helmet());
}

// Rate limiting with environment-specific settings
const limiter = rateLimit({
  windowMs: envConfig.RATE_LIMIT_WINDOW,
  max: envConfig.RATE_LIMIT_MAX,
  message: {
    error: 'Too many requests',
    retryAfter: Math.ceil(envConfig.RATE_LIMIT_WINDOW / 1000)
  }
});
app.use(limiter);

// CORS configuration with environment-specific settings
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = envConfig.isProduction 
      ? [envConfig.FRONTEND_URL, envConfig.CORS_ORIGIN].filter(Boolean)
      : ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3005'];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.info(`CORS: Blocked origin ${origin} (allowed: ${allowedOrigins.join(', ')})`);
      callback(null, envConfig.isDevelopment); // Allow in development for easier debugging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Debug middleware to log all requests
app.use((req, res, next) => {
  logger.info(`=== REQUEST: ${req.method} ${req.path} ===`);
  logger.info(`Request Headers:`, req.headers);
  logger.info(`Request Body:`, req.body);
  next();
});

// Routes
logger.info('Loading accessibility routes');
app.use('/api/accessibility', accessibilityRoutes);
logger.info('Accessibility routes loaded successfully');

logger.info('Loading analysis routes');
app.use('/api/analysis', analysisRoutes);
logger.info('Analysis routes loaded successfully');

// Test routes (development only)
if (envConfig.isDevelopment) {
  const testPhase1Routes = require('./routes/test-phase1');
  app.use('/api/test-phase1', testPhase1Routes);
  
  const databaseTestRoutes = require('./routes/database-test');
  app.use('/api/database-test', databaseTestRoutes);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  let version = '1.0.0';
  try {
    version = require('./package.json').version || '1.0.0';
  } catch (err) {
    // Use default version if package.json is not found
  }
  
  res.json({ 
    status: 'OK', 
    environment: envConfig.APP_ENV,
    timestamp: new Date().toISOString(),
    version: version
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('=== UNHANDLED ERROR ===');
  logger.error('Error:', err);
  logger.error('Stack:', err.stack);
  logger.error('Request:', req.method, req.path);
  logger.error('Body:', req.body);
  res.status(500).json({ 
    error: 'Internal server error',
    message: envConfig.isDevelopment ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  // Log the configuration when server starts
  envConfig.logConfiguration();
  
  logger.info(`🚀 StreetWiseWeb server started successfully!`);
  logger.info(`📡 Server running on port ${PORT}`);
  logger.info(`🌍 Frontend URL: ${envConfig.FRONTEND_URL}`);
  logger.info(`🔗 API Health Check: ${envConfig.API_URL}/api/health`);
});