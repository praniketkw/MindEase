const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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

// Chat endpoint with Azure OpenAI integration
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    console.log('📨 Received message:', message);
    console.log('🔑 Azure OpenAI Endpoint:', process.env.AZURE_OPENAI_ENDPOINT);
    
    // Check if Azure OpenAI is configured
    if (!process.env.AZURE_OPENAI_ENDPOINT || !process.env.AZURE_OPENAI_API_KEY) {
      console.log('⚠️ Azure OpenAI not configured, using mock response');
      
      const mockResponses = [
        "I understand you're going through a difficult time. Can you tell me more about what's on your mind?",
        "Thank you for sharing that with me. It takes courage to open up about your feelings.",
        "I'm here to listen and support you. What would be most helpful for you right now?",
        "It sounds like you're dealing with a lot. Remember that it's okay to take things one step at a time.",
        "Your feelings are valid, and you don't have to go through this alone."
      ];
      
      const response = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      
      return res.json({
        response: response,
        crisisDetected: false,
        suggestedActions: [],
        source: 'mock'
      });
    }

    // Make actual Azure OpenAI API call
    const azureResponse = await fetch(`${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=2024-02-15-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.AZURE_OPENAI_API_KEY
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are MindEase, an empathetic AI mental health support assistant. Provide compassionate, supportive responses. If you detect crisis language, acknowledge it seriously and suggest professional help.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    console.log('🌐 Azure OpenAI Response Status:', azureResponse.status);

    if (!azureResponse.ok) {
      const errorText = await azureResponse.text();
      console.error('❌ Azure OpenAI Error:', errorText);
      throw new Error(`Azure OpenAI API error: ${azureResponse.status}`);
    }

    const azureData = await azureResponse.json();
    console.log('✅ Azure OpenAI Response:', JSON.stringify(azureData, null, 2));

    const aiResponse = azureData.choices[0].message.content;
    
    // Simple crisis detection
    const crisisKeywords = ['suicide', 'kill myself', 'end it all', 'hurt myself', 'die'];
    const crisisDetected = crisisKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );

    if (crisisDetected) {
      console.log('🚨 Crisis detected in message');
    }

    res.json({
      response: aiResponse,
      crisisDetected: crisisDetected,
      suggestedActions: crisisDetected ? ['Contact 988 Suicide & Crisis Lifeline'] : [],
      source: 'azure_openai'
    });

  } catch (error) {
    console.error('💥 Chat API Error:', error);
    
    // Fallback to mock response on error
    const fallbackResponse = "I'm here to support you. I'm experiencing some technical difficulties right now, but please know that your feelings matter and help is available.";
    
    res.json({
      response: fallbackResponse,
      crisisDetected: false,
      suggestedActions: ['Contact 988 if you need immediate support'],
      source: 'fallback',
      error: error.message
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