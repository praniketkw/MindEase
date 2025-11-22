import { Request, Response } from 'express';
import { AnthropicService } from '../services/anthropic.service';
import { CrisisDetectionService } from '../services/crisis-detection.service';

const anthropicService = new AnthropicService();
const crisisService = new CrisisDetectionService();

interface ChatRequest {
  message: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

interface CrisisCheckRequest {
  message: string;
}

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory = [] }: ChatRequest = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Message is required and must be a string',
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        error: 'Message too long',
        message: 'Message must be less than 2000 characters',
      });
    }

    // Check for crisis indicators first
    const crisisCheck = crisisService.detectCrisis(message);

    // Get AI response
    const response = await anthropicService.chat(message, conversationHistory);

    res.json({
      response: response.content,
      crisisDetected: crisisCheck.isCrisis,
      crisisLevel: crisisCheck.level,
      suggestedResources: crisisCheck.isCrisis ? crisisCheck.resources : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    
    // Handle rate limiting
    if (error.status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please wait a moment and try again.',
      });
    }

    // Handle API errors
    if (error.status === 401) {
      return res.status(500).json({
        error: 'Configuration error',
        message: 'AI service is not properly configured. Please contact support.',
      });
    }

    res.status(500).json({
      error: 'Failed to process message',
      message: 'An error occurred while processing your message. Please try again.',
    });
  }
};

export const detectCrisis = async (req: Request, res: Response) => {
  try {
    const { message }: CrisisCheckRequest = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Message is required and must be a string',
      });
    }

    const crisisCheck = crisisService.detectCrisis(message);

    res.json({
      isCrisis: crisisCheck.isCrisis,
      level: crisisCheck.level,
      indicators: crisisCheck.indicators,
      resources: crisisCheck.resources,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Crisis detection error:', error);
    res.status(500).json({
      error: 'Failed to check for crisis',
      message: 'An error occurred. Please try again.',
    });
  }
};
