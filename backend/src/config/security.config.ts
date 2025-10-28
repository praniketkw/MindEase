import { Request } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Environment-specific security configuration
export const getSecurityConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    isProduction,
    isDevelopment,
    corsOrigins: isProduction 
      ? [
          process.env.CORS_ORIGIN || 'https://mindease-app.azurestaticapps.net',
          /^https:\/\/.*\.azurestaticapps\.net$/
        ]
      : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    
    // Rate limiting configuration
    rateLimiting: {
      // General API rate limit
      general: rateLimit({
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
        message: {
          error: 'Too many requests from this IP, please try again later.',
          retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 60000) + ' minutes'
        },
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req: Request) => {
          // Skip rate limiting for health checks
          return req.path === '/health' || req.path === '/api/health';
        }
      }),

      // Stricter rate limit for conversation endpoints
      conversation: rateLimit({
        windowMs: 60000, // 1 minute
        max: isProduction ? 20 : 100, // 20 requests per minute in production
        message: {
          error: 'Too many conversation requests. Please wait before sending another message.',
          retryAfter: '1 minute'
        },
        standardHeaders: true,
        legacyHeaders: false,
      }),

      // Very strict rate limit for voice endpoints
      voice: rateLimit({
        windowMs: 60000, // 1 minute
        max: isProduction ? 10 : 50, // 10 voice requests per minute in production
        message: {
          error: 'Too many voice requests. Please wait before sending another voice message.',
          retryAfter: '1 minute'
        },
        standardHeaders: true,
        legacyHeaders: false,
      }),

      // Rate limit for journal entries
      journal: rateLimit({
        windowMs: 300000, // 5 minutes
        max: isProduction ? 10 : 50, // 10 journal entries per 5 minutes
        message: {
          error: 'Too many journal entries. Please wait before creating another entry.',
          retryAfter: '5 minutes'
        },
        standardHeaders: true,
        legacyHeaders: false,
      })
    }
  };
};

// Helmet security configuration
export const getHelmetConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'", 
          "'unsafe-inline'", // Required for Material-UI
          "https://fonts.googleapis.com"
        ],
        scriptSrc: [
          "'self'",
          ...(isProduction ? [] : ["'unsafe-eval'"]) // Allow eval in development for hot reload
        ],
        imgSrc: [
          "'self'", 
          "data:", 
          "https:",
          "blob:" // For voice waveform visualizations
        ],
        connectSrc: [
          "'self'",
          "https://*.openai.azure.com",
          "https://*.cognitiveservices.azure.com",
          "https://*.speech.microsoft.com",
          "wss://*.speech.microsoft.com", // WebSocket for speech
          ...(isProduction ? [] : ["ws://localhost:*", "http://localhost:*"])
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com"
        ],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", "blob:"], // For audio playback
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: isProduction ? [] : null
      },
      reportOnly: !isProduction // Only report violations in development
    },

    // HTTP Strict Transport Security
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },

    // X-Frame-Options
    frameguard: {
      action: 'deny'
    },

    // X-Content-Type-Options
    noSniff: true,

    // X-XSS-Protection
    xssFilter: true,

    // Referrer Policy
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin'
    },

    // Cross-Origin Embedder Policy
    crossOriginEmbedderPolicy: false, // Disabled for Azure services compatibility

    // Cross-Origin Opener Policy
    crossOriginOpenerPolicy: {
      policy: 'same-origin'
    },

    // Cross-Origin Resource Policy
    crossOriginResourcePolicy: {
      policy: 'cross-origin' // Required for Azure Static Web Apps
    },

    // Permissions Policy (formerly Feature Policy)
    permissionsPolicy: {
      features: {
        camera: ["'none'"],
        microphone: ["'self'"], // Required for voice input
        geolocation: ["'none'"],
        payment: ["'none'"],
        usb: ["'none'"],
        magnetometer: ["'none'"],
        gyroscope: ["'none'"],
        accelerometer: ["'none'"]
      }
    }
  });
};

// Security headers for specific routes
export const getRouteSecurityHeaders = () => {
  return {
    // Additional headers for API routes
    api: (req: any, res: any, next: any) => {
      res.setHeader('X-API-Version', '1.0');
      res.setHeader('X-RateLimit-Remaining', res.getHeader('X-RateLimit-Remaining') || 'unknown');
      next();
    },

    // Additional headers for voice routes
    voice: (req: any, res: any, next: any) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      next();
    },

    // Additional headers for journal routes
    journal: (req: any, res: any, next: any) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      next();
    }
  };
};