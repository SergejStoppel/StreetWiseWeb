import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests per window
  message?: string;
  standardHeaders?: boolean; // Return rate limit info in the `X-RateLimit-*` headers
  legacyHeaders?: boolean; // Return rate limit info in the `X-RateLimit-Limit` and `X-RateLimit-Remaining` headers
}

export const createRateLimit = (options: RateLimitOptions) => {
  const {
    windowMs,
    max,
    message = 'Too many requests, please try again later.',
    standardHeaders = true,
    legacyHeaders = false
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    // Clean up expired entries
    if (store[key] && now > store[key].resetTime) {
      delete store[key];
    }
    
    // Initialize or increment counter
    if (!store[key]) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs
      };
    } else {
      store[key].count++;
    }
    
    const current = store[key];
    const remaining = Math.max(0, max - current.count);
    const resetTime = new Date(current.resetTime);
    
    // Set rate limit headers
    if (standardHeaders) {
      res.set({
        'X-RateLimit-Limit': max.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': resetTime.toISOString()
      });
    }
    
    if (legacyHeaders) {
      res.set({
        'X-RateLimit-Limit': max.toString(),
        'X-RateLimit-Remaining': remaining.toString()
      });
    }
    
    // Check if rate limit exceeded
    if (current.count > max) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message,
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      });
      return;
    }
    
    next();
  };
};

// Common rate limiters
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts, please try again after 15 minutes.'
});

export const auditRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many audit requests, please try again after a minute.'
});

export const contentGenerationRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: 'Too many content generation requests, please try again after a minute.'
});

export const generalRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: 'Too many requests, please try again later.'
});

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key] && now > store[key].resetTime) {
      delete store[key];
    }
  });
}, 60 * 1000); // Clean up every minute