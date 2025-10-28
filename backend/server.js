const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    error: 'Too many requests from this IP, please try again later.'
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
    version: '1.0.0'
  });
});

// API status endpoint
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

// Initialize Azure OpenAI client
let openaiClient = null;

if (process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY) {
  openaiClient = new OpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
    defaultQuery: { 'api-version': '2024-02-15-preview' },
    defaultHeaders: {
      'api-key': process.env.AZURE_OPENAI_API_KEY,
    },
  });
  console.log('✅ Azure OpenAI client initialized');
} else {
  console.log('⚠️ Azure OpenAI not configured - missing environment variables');
}

// Chat endpoint with real Azure OpenAI integration
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    console.log('📨 Received message:', message);
    console.log('🔧 Environment check:', {
      hasEndpoint: !!process.env.AZURE_OPENAI_ENDPOINT,
      hasApiKey: !!process.env.AZURE_OPENAI_API_KEY,
      hasDeployment: !!process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME
    });

    if (!message || message.trim() === '') {
      return res.status(400).json({
        error: 'Message is required',
        source: 'validation_error'
      });
    }

    // If Azure OpenAI is not configured, return error instead of mock
    if (!openaiClient) {
      console.log('❌ Azure OpenAI client not available');
      return res.status(503).json({
        error: 'AI service is not configured. Please check Azure OpenAI settings.',
        source: 'configuration_error',
        details: 'Missing Azure OpenAI environment variables'
      });
    }

    console.log('🚀 Making Azure OpenAI API call...');

    // Make the actual Azure OpenAI API call
    const completion = await openaiClient.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are MindEase, a compassionate AI mental health support assistant. Your role is to:
          
          1. Provide empathetic, personalized responses to each user's unique situation
          2. Listen actively and validate their feelings
          3. Offer practical coping strategies when appropriate
          4. Recognize signs of crisis and respond appropriately
          5. Maintain a warm, supportive, and non-judgmental tone
          
          Guidelines:
          - Always acknowledge the person's feelings as valid
          - Provide specific, actionable advice when requested
          - If someone mentions self-harm, suicide, or crisis, take it seriously and suggest professional help
          - Adapt your language and approach to match the user's communication style
          - Be genuine and avoid generic responses
          
          Remember: You are not a replacement for professional therapy, but a supportive companion on their mental health journey.`
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    });

    console.log('✅ Azure OpenAI API call successful');
    console.log('📊 Usage:', completion.usage);

    const aiResponse = completion.choices[0].message.content;
    
    // Enhanced crisis detection
    const crisisKeywords = [
      'suicide', 'kill myself', 'end it all', 'hurt myself', 'die', 'death',
      'self-harm', 'cutting', 'overdose', 'jump', 'hanging', 'worthless',
      'hopeless', 'no point', 'better off dead', 'end my life'
    ];
    
    const crisisDetected = crisisKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );

    if (crisisDetected) {
      console.log('🚨 CRISIS DETECTED in message:', message);
    }

    const response = {
      response: aiResponse,
      crisisDetected: crisisDetected,
      suggestedActions: crisisDetected ? [
        'Contact 988 Suicide & Crisis Lifeline immediately',
        'Reach out to a trusted friend or family member',
        'Contact your local emergency services if in immediate danger'
      ] : [],
      source: 'azure_openai',
      timestamp: new Date().toISOString(),
      usage: completion.usage
    };

    console.log('📤 Sending response:', {
      responseLength: aiResponse.length,
      crisisDetected,
      source: 'azure_openai'
    });

    res.json(response);

  } catch (error) {
    console.error('💥 Chat API Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Return error instead of fallback
    res.status(500).json({
      error: 'Failed to get AI response',
      details: error.message,
      source: 'api_error',
      timestamp: new Date().toISOString(),
      suggestion: 'Please try again in a moment. If the issue persists, contact support.'
    });
  }
});

// Mock voice endpoint
app.post('/api/voice', (req, res) => {
  try {
    res.json({
      response: "I hear you. Voice processing is currently being set up. For now, please use text chat.",
      crisisDetected: false,
      suggestedActions: []
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to process voice input',
      message: 'Please try again later'
    });
  }
});

// Mock journal endpoints
app.get('/api/journal', (req, res) => {
  res.json({ entries: [] });
});

app.post('/api/journal', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Journal entry saved successfully' 
  });
});

// Mock user endpoints
app.get('/api/user/profile', (req, res) => {
  res.json({
    id: 'user-1',
    createdAt: new Date().toISOString(),
    preferences: {
      voiceEnabled: true,
      language: 'en',
      checkInFrequency: 'daily',
      communicationStyle: 'casual'
    }
  });
});

app.put('/api/user/profile', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Profile updated successfully' 
  });
});

// Mock coping strategies endpoint
app.get('/api/coping-strategies', (req, res) => {
  res.json({
    strategies: [
      {
        id: '1',
        name: 'Deep Breathing',
        description: 'Take slow, deep breaths to help calm your mind',
        category: 'breathing'
      },
      {
        id: '2',
        name: '5-4-3-2-1 Grounding',
        description: 'Name 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste',
        category: 'grounding'
      }
    ]
  });
});

// Mock check-in endpoint
app.post('/api/check-in', (req, res) => {
  res.json({
    success: true,
    message: 'Check-in completed successfully'
  });
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
app.use((error, req, res, next) => {
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong. Please try again later.'
  });
});

// Start server
async function startServer() {
  try {
    app.listen(PORT, () => {
      console.log(`🚀 MindEase Backend Server running on port ${PORT}`);
      console.log(`📊 Health check available at http://localhost:${PORT}/health`);
      console.log(`🔒 Security headers enabled`);
      console.log(`⚡ Rate limiting: 100 requests per 15 minutes`);
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

module.exports = app;