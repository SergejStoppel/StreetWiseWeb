import { Request, Response, NextFunction } from 'express';
import { AppError, ApiResponse } from '@/types';
import { createLogger } from '@/config/logger';
import { isDevelopment } from '@/config';

const logger = createLogger('errorHandler');

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let code: string | undefined;

  // Handle known AppError instances
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code;
  }

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
    code = 'VALIDATION_ERROR';
  }

  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  }

  if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource ID';
    code = 'INVALID_ID';
  }

  // Log error
  const logLevel = statusCode >= 500 ? 'error' : 'warn';
  logger[logLevel]('Request error', {
    statusCode,
    message,
    code,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    stack: isDevelopment ? error.stack : undefined,
    error: error.message,
  });

  // Prepare response
  const response: ApiResponse = {
    success: false,
    error: message,
    message: statusCode >= 500 ? 'An unexpected error occurred' : message,
    timestamp: new Date().toISOString(),
    requestId: res.locals.requestId,
  };

  // Add error details in development
  if (isDevelopment && statusCode >= 500) {
    response.error = error.message;
    (response as any).stack = error.stack;
  }

  // Add error code if available
  if (code) {
    (response as any).code = code;
  }

  res.status(statusCode).json(response);
};