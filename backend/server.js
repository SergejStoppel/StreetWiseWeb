const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const accessibilityRoutes = require('./routes/accessibility');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for rate limiting (required for development behind proxies)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL || 'http://localhost:3000']
      : ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3001'];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.info(`CORS: Blocked origin ${origin}`);
      callback(null, true); // Allow in development for easier debugging
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

// Test route for Phase 1 services (development only)
if (process.env.NODE_ENV !== 'production') {
  const testPhase1Routes = require('./routes/test-phase1');
  app.use('/api/test-phase1', testPhase1Routes);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
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
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});