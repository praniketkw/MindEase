import { Request, Response, NextFunction } from 'express';
import logger, { errorLogger, securityLogger } from '../config/logging.config';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Default error values
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';
  let code = error.code || 'INTERNAL_ERROR';

  // Log the error using the centralized logger
  errorLogger(error, req);

  // Security-related error patterns that should not be exposed
  const SENSITIVE_ERROR_PATTERNS = [
    /database/i,
    /connection/i,
    /azure/i,
    /api[_\s]?key/i,
    /secret/i,
    /token/i,
    /credential/i,
    /password/i
  ];

  // Check for sensitive information in error message
  if (SENSITIVE_ERROR_PATTERNS.some(pattern => pattern.test(error.message))) {
    message = 'Internal server error';
    code = 'INTERNAL_ERROR';
  }

  // Handle specific error types
  switch (error.name) {
    case 'ValidationError':
      statusCode = 400;
      message = 'Invalid input data';
      code = 'VALIDATION_ERROR';
      break;

    case 'UnauthorizedError':
    case 'JsonWebTokenError':
    case 'TokenExpiredError':
      statusCode = 401;
      message = 'Authentication required';
      code = 'UNAUTHORIZED';
      // Log security event
      securityLogger.warn('Authentication failure', {
        event: 'AUTH_FAILURE',
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      break;

    case 'ForbiddenError':
      statusCode = 403;
      message = 'Access denied';
      code = 'FORBIDDEN';
      // Log security event
      securityLogger.warn('Authorization failure', {
        event: 'AUTHZ_FAILURE',
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      break;

    case 'NotFoundError':
      statusCode = 404;
      message = 'Resource not found';
      code = 'NOT_FOUND';
      break;

    case 'RestError':
    case 'AzureServiceError':
      statusCode = 503;
      message = 'AI service temporarily unavailable';
      code = 'SERVICE_UNAVAILABLE';
      break;

    case 'SqliteError':
    case 'DatabaseError':
      statusCode = 500;
      message = isProduction ? 'Internal server error' : 'Database operation failed';
      code = 'DATABASE_ERROR';
      break;

    case 'TooManyRequestsError':
    case 'RateLimitError':
      statusCode = 429;
      message = 'Too many requests, please try again later';
      code = 'RATE_LIMIT_EXCEEDED';
      // Log rate limiting event
      securityLogger.warn('Rate limit exceeded', {
        event: 'RATE_LIMIT_EXCEEDED',
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      break;

    default:
      // Check if error code indicates Azure service error
      if (error.code?.startsWith('Azure') || error.code?.includes('AZURE')) {
        statusCode = 503;
        message = 'AI service temporarily unavailable';
        code = 'SERVICE_UNAVAILABLE';
      }
  }

  // Sanitize error message in production
  if (isProduction) {
    // Don't expose internal error details
    if (statusCode === 500) {
      message = 'We\'re experiencing technical difficulties. If you need immediate support, please contact 988 Suicide & Crisis Lifeline.';
      code = 'INTERNAL_ERROR';
    }

    // Generic messages for client errors to avoid information leakage
    if (statusCode >= 400 && statusCode < 500 && !['UNAUTHORIZED', 'FORBIDDEN', 'VALIDATION_ERROR', 'RATE_LIMIT_EXCEEDED'].includes(code)) {
      message = 'Bad request';
      code = 'BAD_REQUEST';
    }
  }

  // Privacy-focused error response (don't expose internal details)
  const errorResponse: any = {
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
      statusCode
    }
  };

  // Add request ID for tracking (if available)
  if (req.headers['x-request-id']) {
    errorResponse.error.requestId = req.headers['x-request-id'];
  }

  // Include stack trace and details only in development
  if (!isProduction) {
    if (error.stack) {
      errorResponse.error.stack = error.stack;
    }
    if (error.name === 'ValidationError' && (error as any).details) {
      errorResponse.error.details = (error as any).details;
    }
  }

  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // For crisis-related errors, always provide supportive message
  if (statusCode >= 500) {
    errorResponse.error.supportMessage = 'If you need immediate support, please contact 988 Suicide & Crisis Lifeline.';
  }

  res.status(statusCode).json(errorResponse);

  // Log critical errors for monitoring
  if (statusCode >= 500) {
    logger.error('Critical error occurred', {
      error: error.message,
      statusCode,
      url: req.url,
      method: req.method,
      stack: error.stack
    });
  }
};

// Custom error classes
export class ValidationError extends Error {
  statusCode = 400;
  isOperational = true;
  code = 'VALIDATION_ERROR';
  
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends Error {
  statusCode = 401;
  isOperational = true;
  code = 'UNAUTHORIZED';
  
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  isOperational = true;
  code = 'NOT_FOUND';
  
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ServiceUnavailableError extends Error {
  statusCode = 503;
  isOperational = true;
  code = 'SERVICE_UNAVAILABLE';
  
  constructor(message: string = 'Service temporarily unavailable') {
    super(message);
    this.name = 'ServiceUnavailableError';
  }
}
// A
sync error handler wrapper
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  const message = `Route ${req.originalUrl} not found`;
  
  logger.warn('Route not found', {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(404).json({
    error: {
      message,
      code: 'NOT_FOUND',
      statusCode: 404,
      timestamp: new Date().toISOString()
    }
  });
};

// Request timeout handler
export const timeoutHandler = (timeout: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn('Request timeout', {
          url: req.url,
          method: req.method,
          timeout,
          ip: req.ip
        });

        res.status(408).json({
          error: {
            message: 'Request timeout',
            code: 'REQUEST_TIMEOUT',
            statusCode: 408,
            timestamp: new Date().toISOString()
          }
        });
      }
    }, timeout);

    res.on('finish', () => {
      clearTimeout(timer);
    });

    next();
  };
};