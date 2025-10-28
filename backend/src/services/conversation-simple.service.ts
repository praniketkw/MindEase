// Simplified conversation service for task 5.2
// This provides the basic API structure without complex Azure integrations

export interface ConversationResponse {
  response: string;
  emotionalAnalysis?: {
    sentiment: {
      positive: number;
      neutral: number;
      negative: number;
    };
    emotions: {
      joy: number;
      sadness: number;
      anger: number;
      fear: number;
      surprise: number;
      disgust: number;
    };
    keyPhrases: string[];
  };
  suggestedActions?: string[];
  crisisDetected: boolean;
  audioResponse?: Buffer;
}

export interface ConversationContext {
  userId: string;
  sessionId: string;
  recentMessages: Array<{
    content: string;
    sender: 'user' | 'assistant';
    timestamp: Date;
  }>;
}

export class ConversationService {
  private contexts: Map<string, ConversationContext> = new Map();

  async processMessage(userId: string, sessionId: string, message: string): Promise<ConversationResponse> {
    try {
      // Get or create conversation context
      const contextKey = `${userId}-${sessionId}`;
      let context = this.contexts.get(contextKey);
      
      if (!context) {
        context = {
          userId,
          sessionId,
          recentMessages: []
        };
        this.contexts.set(contextKey, context);
      }

      // Add user message to context
      context.recentMessages.push({
        content: message,
        sender: 'user',
        timestamp: new Date()
      });

      // Keep only last 10 messages for context
      if (context.recentMessages.length > 10) {
        context.recentMessages = context.recentMessages.slice(-10);
      }

      // Simple crisis detection (basic keyword matching)
      const crisisDetected = this.detectCrisis(message);

      // Generate response based on message content and context
      const response = await this.generateResponse(message, context, crisisDetected);

      // Add assistant response to context
      context.recentMessages.push({
        content: response,
        sender: 'assistant',
        timestamp: new Date()
      });

      // Simple emotional analysis
      const emotionalAnalysis = this.analyzeEmotion(message);

      return {
        response,
        emotionalAnalysis,
        crisisDetected,
        suggestedActions: crisisDetected ? ['Contact 988 Suicide & Crisis Lifeline'] : []
      };

    } catch (error) {
      console.error('Error processing message:', error);
      return {
        response: "I'm sorry, I'm having trouble processing your message right now. If you need immediate support, please contact 988 Suicide & Crisis Lifeline.",
        crisisDetected: false
      };
    }
  }

  async processVoiceInput(userId: string, sessionId: string, audioBuffer: Buffer): Promise<ConversationResponse> {
    try {
      // For now, return a placeholder response for voice input
      // In a full implementation, this would use Azure Speech Service
      const mockTranscription = "I received your voice message";
      
      return await this.processMessage(userId, sessionId, mockTranscription);
    } catch (error) {
      console.error('Error processing voice input:', error);
      return {
        response: "I'm sorry, I couldn't process your voice message. Please try typing your message instead.",
        crisisDetected: false
      };
    }
  }

  private detectCrisis(message: string): boolean {
    const crisisKeywords = [
      'suicide', 'kill myself', 'end my life', 'want to die', 'hurt myself',
      'self harm', 'cutting', 'overdose', 'jump off', 'hanging',
      'no point living', 'better off dead', 'can\'t go on'
    ];

    const lowerMessage = message.toLowerCase();
    return crisisKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  private async generateResponse(message: string, context: ConversationContext, crisisDetected: boolean): Promise<string> {
    if (crisisDetected) {
      return "I'm really concerned about what you're sharing with me. Your life has value, and there are people who want to help. Please reach out to the 988 Suicide & Crisis Lifeline (call or text 988) for immediate support. You don't have to go through this alone.";
    }

    // Simple response generation based on message content
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return "Hello! I'm here to listen and support you. How are you feeling today?";
    }

    if (lowerMessage.includes('sad') || lowerMessage.includes('depressed')) {
      return "I'm sorry to hear you're feeling sad. It's okay to feel this way, and I'm here to listen. Would you like to talk about what's making you feel this way?";
    }

    if (lowerMessage.includes('anxious') || lowerMessage.includes('worried')) {
      return "I understand that anxiety can be overwhelming. It's completely normal to feel worried sometimes. Would you like to try a breathing exercise together, or would you prefer to talk about what's causing your anxiety?";
    }

    if (lowerMessage.includes('stressed')) {
      return "Stress can be really challenging to deal with. You're not alone in feeling this way. What's been the biggest source of stress for you lately?";
    }

    if (lowerMessage.includes('lonely')) {
      return "Feeling lonely can be really difficult. I want you to know that you're not alone - I'm here with you right now. Sometimes talking about these feelings can help. What's been making you feel lonely?";
    }

    if (lowerMessage.includes('thank')) {
      return "You're very welcome. I'm glad I could be here for you. Remember, it takes courage to reach out and talk about your feelings.";
    }

    // Default empathetic response
    return "I hear you, and I want you to know that your feelings are valid. It sounds like you're going through something difficult. I'm here to listen and support you. Would you like to tell me more about how you're feeling?";
  }

  private analyzeEmotion(message: string): ConversationResponse['emotionalAnalysis'] {
    const lowerMessage = message.toLowerCase();
    
    // Simple emotion detection based on keywords
    let joy = 0, sadness = 0, anger = 0, fear = 0, surprise = 0, disgust = 0;
    let positive = 0, neutral = 0.5, negative = 0;

    // Joy indicators
    if (lowerMessage.match(/happy|joy|excited|great|wonderful|amazing|love|good/)) {
      joy = 0.8;
      positive = 0.7;
      negative = 0.1;
      neutral = 0.2;
    }

    // Sadness indicators
    if (lowerMessage.match(/sad|depressed|down|upset|cry|hurt|pain|lonely/)) {
      sadness = 0.8;
      negative = 0.7;
      positive = 0.1;
      neutral = 0.2;
    }

    // Anger indicators
    if (lowerMessage.match(/angry|mad|furious|hate|annoyed|frustrated/)) {
      anger = 0.7;
      negative = 0.6;
      positive = 0.1;
      neutral = 0.3;
    }

    // Fear/anxiety indicators
    if (lowerMessage.match(/scared|afraid|anxious|worried|nervous|panic/)) {
      fear = 0.7;
      negative = 0.6;
      positive = 0.1;
      neutral = 0.3;
    }

    // Extract key phrases (simple word extraction)
    const keyPhrases = message
      .split(/[.!?]+/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 10)
      .slice(0, 3);

    return {
      sentiment: { positive, neutral, negative },
      emotions: { joy, sadness, anger, fear, surprise, disgust },
      keyPhrases
    };
  }

  // Clean up old contexts to prevent memory leaks
  cleanupOldContexts() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    for (const [key, context] of this.contexts.entries()) {
      const lastMessage = context.recentMessages[context.recentMessages.length - 1];
      if (lastMessage && lastMessage.timestamp < oneHourAgo) {
        this.contexts.delete(key);
      }
    }
  }
}

// Singleton instance
export const conversationService = new ConversationService();

// Clean up old contexts every hour
setInterval(() => {
  conversationService.cleanupOldContexts();
}, 60 * 60 * 1000);