import winston from 'winston';
import path from 'path';

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(logColors);

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : process.env.LOG_LEVEL || 'info';
};

// Custom format for development
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Custom format for production (JSON)
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    // Remove sensitive information from logs
    const sanitized = { ...info };
    
    // Remove potential PII
    if (sanitized.message) {
      sanitized.message = sanitizeSensitiveData(sanitized.message);
    }
    
    // Remove sensitive headers
    if (sanitized.headers) {
      delete sanitized.headers.authorization;
      delete sanitized.headers.cookie;
      delete sanitized.headers['x-api-key'];
    }
    
    // Remove request body for privacy
    if (sanitized.body) {
      sanitized.body = '[REDACTED]';
    }
    
    return JSON.stringify(sanitized);
  })
);

// Function to sanitize sensitive data from log messages
const sanitizeSensitiveData = (message: string): string => {
  // Remove potential API keys, tokens, and personal information
  return message
    .replace(/\b[A-Za-z0-9]{32,}\b/g, '[API_KEY_REDACTED]') // API keys
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/g, 'Bearer [TOKEN_REDACTED]') // JWT tokens
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]') // Email addresses
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN_REDACTED]') // SSN
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD_REDACTED]'); // Credit card numbers
};

// Define transports
const transports = [];

// Console transport
transports.push(
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  })
);

// File transports for production
if (process.env.NODE_ENV === 'production') {
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      format: productionFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      format: productionFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Security events log
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'security.log'),
      level: 'warn',
      format: productionFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: level(),
  levels: logLevels,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'exceptions.log'),
      format: productionFormat,
    }),
  ],
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'rejections.log'),
      format: productionFormat,
    }),
  ],
});

// Security event logger
export const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
    winston.format.printf((info) => {
      return JSON.stringify({
        ...info,
        type: 'SECURITY_EVENT',
        environment: process.env.NODE_ENV,
        service: 'mindease-backend'
      });
    })
  ),
  transports: [
    new winston.transports.Console(),
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'security.log'),
        maxsize: 5242880,
        maxFiles: 10,
      })
    ] : [])
  ],
});

// HTTP request logger middleware
export const httpLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      // Don't log request body for privacy
    };

    // Log different levels based on status code
    if (res.statusCode >= 500) {
      logger.error('HTTP Request', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.http('HTTP Request', logData);
    }

    // Log security events
    if (res.statusCode === 401 || res.statusCode === 403) {
      securityLogger.warn('Authentication/Authorization failure', {
        ...logData,
        event: 'AUTH_FAILURE'
      });
    }

    // Log rate limiting
    if (res.statusCode === 429) {
      securityLogger.warn('Rate limit exceeded', {
        ...logData,
        event: 'RATE_LIMIT_EXCEEDED'
      });
    }
  });

  next();
};

// Error logger
export const errorLogger = (error: Error, req?: any) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    url: req?.url,
    method: req?.method,
    ip: req?.ip,
    userAgent: req?.get('User-Agent'),
    timestamp: new Date().toISOString(),
  };

  logger.error('Application Error', errorData);

  // Log security-related errors separately
  if (error.message.includes('authentication') || 
      error.message.includes('authorization') ||
      error.message.includes('token') ||
      error.message.includes('permission')) {
    securityLogger.error('Security Error', {
      ...errorData,
      event: 'SECURITY_ERROR'
    });
  }
};

export default logger;