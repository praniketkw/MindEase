import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authMiddleware } from './middleware/auth.middleware';
import { errorHandler, notFoundHandler, timeoutHandler } from './middleware/error.middleware';
import { getSecurityConfig, getHelmetConfig, getRouteSecurityHeaders } from './config/security.config';
import logger, { httpLogger } from './config/logging.config';
import { conversationRoutes } from './routes/conversation.routes';
import { journalRoutes } from './routes/journal.routes';
import { userRoutes } from './routes/user.routes';
import copingStrategyRoutes from './routes/coping-strategy.routes';
import checkInRoutes from './routes/check-in.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Get security configuration
const securityConfig = getSecurityConfig();
const routeSecurityHeaders = getRouteSecurityHeaders();

// Trust proxy for accurate IP addresses (required for Azure Static Web Apps)
app.set('trust proxy', 1);

// Request timeout middleware
app.use(timeoutHandler(30000)); // 30 second timeout

// HTTP request logging
app.use(httpLogger);

// Security middleware
app.use(getHelmetConfig());

// CORS configuration
app.use(cors({
  origin: securityConfig.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
  exposedHeaders: ['X-RateLimit-Remaining', 'X-RateLimit-Reset']
}));

// General rate limiting
app.use(securityConfig.rateLimiting.general);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint (no authentication required)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API status endpoint (no authentication required)
app.get('/api/status', (req, res) => {
  res.status(200).json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    services: {
      database: 'operational',
      ai_services: 'operational'
    }
  });
});

// Authentication middleware for protected routes
app.use('/api', authMiddleware);

// Apply route-specific security headers and rate limiting
app.use('/api/chat', routeSecurityHeaders.api, securityConfig.rateLimiting.conversation);
app.use('/api/voice', routeSecurityHeaders.voice, securityConfig.rateLimiting.voice);
app.use('/api/journal', routeSecurityHeaders.journal, securityConfig.rateLimiting.journal);

// API routes
app.use('/api/chat', conversationRoutes);
app.use('/api/voice', conversationRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/user', userRoutes);
app.use('/api/coping-strategies', copingStrategyRoutes);
app.use('/api/check-in', checkInRoutes);

// 404 handler
app.use('*', notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Create logs directory if it doesn't exist (for production)
    if (process.env.NODE_ENV === 'production') {
      const fs = require('fs');
      const path = require('path');
      const logsDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
    }

    const server = app.listen(PORT, () => {
      logger.info(`🚀 MindEase Backend Server started`, {
        port: PORT,
        environment: process.env.NODE_ENV,
        nodeVersion: process.version,
        timestamp: new Date().toISOString()
      });
      
      console.log(`🚀 MindEase Backend Server running on port ${PORT}`);
      console.log(`📊 Health check available at http://localhost:${PORT}/health`);
      console.log(`🔒 Enhanced security measures enabled`);
      console.log(`⚡ Rate limiting configured for different endpoints`);
      console.log(`📝 Structured logging enabled`);
    });

    // Set server timeout
    server.timeout = 30000; // 30 seconds

    return server;
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`🛑 ${signal} received, shutting down gracefully`);
  console.log(`🛑 ${signal} received, shutting down gracefully`);
  
  // Close server and cleanup resources
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();

export default app;