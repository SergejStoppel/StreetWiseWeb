const supabase = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * Middleware to extract and verify Supabase JWT token
 * Sets req.user if valid token is found, null otherwise
 */
const extractUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    logger.info('Auth middleware - checking headers', {
      hasAuthHeader: !!authHeader,
      authHeaderPreview: authHeader ? authHeader.substring(0, 20) + '...' : null,
      requestPath: req.path
    });
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.info('No valid auth header found, proceeding as anonymous');
      req.user = null;
      return next();
    }
    
    const token = authHeader.substring(7);
    logger.info('Attempting JWT verification', { tokenLength: token.length });
    
    try {
      // Verify the JWT token with Supabase with timeout
      const verificationPromise = supabase.auth.getUser(token);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('JWT verification timeout')), 10000);
      });

      const { data: { user }, error } = await Promise.race([verificationPromise, timeoutPromise]);

      if (error) {
        logger.warn('JWT verification failed:', error.message);
        req.user = null;
      } else {
        req.user = user;
        logger.info('User authenticated:', { userId: user.id, email: user.email });
      }
    } catch (jwtError) {
      logger.warn('JWT parsing failed:', jwtError.message);
      req.user = null;
    }
    
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error.message);
    req.user = null;
    next();
  }
};

/**
 * Middleware to require authentication
 * Returns 401 if user is not authenticated
 */
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please sign in to access this resource'
    });
  }
  next();
};

module.exports = {
  extractUser,
  requireAuth
};