import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import { conversationService } from './services/conversation-simple.service';
import { journalService } from './services/journal-simple.service';
import { userService } from './services/user-simple.service';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Types for authentication
interface AuthenticatedRequest extends express.Request {
  userId?: string;
  sessionId?: string;
}

// Authentication middleware
const authMiddleware = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      // For MindEase, we'll create anonymous sessions for privacy
      req.userId = uuidv4();
      req.sessionId = uuidv4();
      
      // Set session cookie for subsequent requests
      const sessionToken = jwt.sign(
        { 
          userId: req.userId, 
          sessionId: req.sessionId,
          type: 'anonymous'
        },
        process.env.JWT_SECRET || 'mindease-dev-secret',
        { expiresIn: '24h' }
      );
      
      res.cookie('session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      return next();
    }

    // Verify existing token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'mindease-dev-secret'
    ) as any;
    
    req.userId = decoded.userId;
    req.sessionId = decoded.sessionId;
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      // Invalid token, create new anonymous session
      req.userId = uuidv4();
      req.sessionId = uuidv4();
      
      const sessionToken = jwt.sign(
        { 
          userId: req.userId, 
          sessionId: req.sessionId,
          type: 'anonymous'
        },
        process.env.JWT_SECRET || 'mindease-dev-secret',
        { expiresIn: '24h' }
      );
      
      res.cookie('session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
      });
      
      return next();
    }
    
    return res.status(500).json({
      error: 'Authentication error',
      message: 'Unable to process authentication'
    });
  }
};

// Error handling middleware
const errorHandler = (
  error: any,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  // Default error values
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';
  let code = error.code || 'INTERNAL_ERROR';

  // Log error for debugging (exclude sensitive information)
  console.error('API Error:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    statusCode,
    code,
    message: message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Invalid input data';
    code = 'VALIDATION_ERROR';
  }

  if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Authentication required';
    code = 'UNAUTHORIZED';
  }

  // Rate limiting errors
  if (error.name === 'TooManyRequestsError') {
    statusCode = 429;
    message = 'Too many requests, please try again later';
    code = 'RATE_LIMIT_EXCEEDED';
  }

  // Privacy-focused error response (don't expose internal details)
  const errorResponse = {
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        details: error
      })
    }
  };

  // For crisis-related errors, always provide supportive message
  if (statusCode >= 500) {
    errorResponse.error.message = 'We\'re experiencing technical difficulties. If you need immediate support, please contact 988 Suicide & Crisis Lifeline.';
  }

  res.status(statusCode).json(errorResponse);
};

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.cognitive.microsoft.com", "https://*.openai.azure.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Configure multer for file uploads (voice messages)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

// Authentication middleware for protected routes
app.use('/api', authMiddleware);

// Conversation API endpoints
app.post('/api/chat', async (req: AuthenticatedRequest, res) => {
  try {
    const { message } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Message is required and must be a string'
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Message must be less than 1000 characters'
      });
    }

    const response = await conversationService.processMessage(
      req.userId!,
      req.sessionId!,
      message
    );

    res.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process chat message'
    });
  }
});

app.post('/api/voice', upload.single('audio'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Audio file is required'
      });
    }

    const response = await conversationService.processVoiceInput(
      req.userId!,
      req.sessionId!,
      req.file.buffer
    );

    res.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Voice endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process voice message'
    });
  }
});

// Journal API endpoints
app.post('/api/journal', async (req: AuthenticatedRequest, res) => {
  try {
    const { content, contentType = 'text' } = req.body;
    
    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Content is required and must be a string'
      });
    }

    if (content.length > 5000) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Content must be less than 5000 characters'
      });
    }

    if (contentType !== 'text' && contentType !== 'voice') {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Content type must be either "text" or "voice"'
      });
    }

    const entry = await journalService.createEntry(
      req.userId!,
      content,
      contentType
    );

    res.status(201).json({
      success: true,
      data: entry,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Journal creation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create journal entry'
    });
  }
});

app.get('/api/journal', async (req: AuthenticatedRequest, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    
    if (limit > 100) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Limit cannot exceed 100'
      });
    }

    const entries = await journalService.getEntries(req.userId!, limit, offset);

    res.json({
      success: true,
      data: {
        entries,
        pagination: {
          limit,
          offset,
          hasMore: entries.length === limit
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Journal retrieval error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve journal entries'
    });
  }
});

app.get('/api/journal/summary', async (req: AuthenticatedRequest, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    
    if (days > 365) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Days cannot exceed 365'
      });
    }

    const summary = await journalService.getJournalSummary(req.userId!, days);

    res.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Journal summary error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate journal summary'
    });
  }
});

app.get('/api/journal/:entryId', async (req: AuthenticatedRequest, res) => {
  try {
    const { entryId } = req.params;
    
    const entry = await journalService.getEntry(req.userId!, entryId);
    
    if (!entry) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Journal entry not found'
      });
    }

    res.json({
      success: true,
      data: entry,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Journal entry retrieval error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve journal entry'
    });
  }
});

app.delete('/api/journal/:entryId', async (req: AuthenticatedRequest, res) => {
  try {
    const { entryId } = req.params;
    
    const deleted = await journalService.deleteEntry(req.userId!, entryId);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Journal entry not found'
      });
    }

    res.json({
      success: true,
      message: 'Journal entry deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Journal deletion error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete journal entry'
    });
  }
});

// User profile and settings API endpoints
app.get('/api/user/profile', async (req: AuthenticatedRequest, res) => {
  try {
    const profile = await userService.getProfile(req.userId!);

    res.json({
      success: true,
      data: profile,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Profile retrieval error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve user profile'
    });
  }
});

app.put('/api/user/profile', async (req: AuthenticatedRequest, res) => {
  try {
    const updates = req.body;
    
    // Only allow updating preferences in this endpoint
    const allowedUpdates = {
      preferences: updates.preferences
    };

    const profile = await userService.updateProfile(req.userId!, allowedUpdates);

    res.json({
      success: true,
      data: profile,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Profile update error:', error);
    
    if (error instanceof Error && error.message.includes('Invalid')) {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update user profile'
    });
  }
});

app.get('/api/user/preferences', async (req: AuthenticatedRequest, res) => {
  try {
    const profile = await userService.getProfile(req.userId!);

    res.json({
      success: true,
      data: profile.preferences,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Preferences retrieval error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve user preferences'
    });
  }
});

app.put('/api/user/preferences', async (req: AuthenticatedRequest, res) => {
  try {
    const preferences = await userService.updatePreferences(req.userId!, req.body);

    res.json({
      success: true,
      data: preferences,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Preferences update error:', error);
    
    if (error instanceof Error && error.message.includes('Invalid')) {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update user preferences'
    });
  }
});

app.get('/api/user/stats', async (req: AuthenticatedRequest, res) => {
  try {
    const profile = await userService.getProfile(req.userId!);

    res.json({
      success: true,
      data: profile.stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Stats retrieval error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve user stats'
    });
  }
});

app.get('/api/user/export', async (req: AuthenticatedRequest, res) => {
  try {
    const userData = await userService.exportUserData(req.userId!);

    if (!userData) {
      return res.status(404).json({
        error: 'Not found',
        message: 'No user data found to export'
      });
    }

    res.json({
      success: true,
      data: userData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Data export error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to export user data'
    });
  }
});

app.delete('/api/user/data', async (req: AuthenticatedRequest, res) => {
  try {
    const { confirm } = req.body;
    
    if (confirm !== 'DELETE_ALL_DATA') {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Must provide confirmation string "DELETE_ALL_DATA" to proceed'
      });
    }

    const deleted = await userService.resetUserData(req.userId!);

    if (!deleted) {
      return res.status(404).json({
        error: 'Not found',
        message: 'No user data found to delete'
      });
    }

    res.json({
      success: true,
      message: 'All user data has been permanently deleted',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Data reset error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to reset user data'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    app.listen(PORT, () => {
      console.log(`🚀 MindEase Backend Server running on port ${PORT}`);
      console.log(`📊 Health check available at http://localhost:${PORT}/health`);
      console.log(`🔒 Security headers enabled`);
      console.log(`⚡ Rate limiting: 100 requests per 15 minutes`);
      console.log(`🔐 Anonymous session authentication enabled`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

export default app;