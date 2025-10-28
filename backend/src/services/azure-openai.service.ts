import { OpenAIClient, AzureKeyCredential } from '@azure/openai';
import { AzureOpenAIService, ConversationResponse, AzureServiceError } from '../interfaces/azure-services';
import { ConversationContext, EmotionalAnalysis } from '../../../shared/types';

export class AzureOpenAIServiceImpl implements AzureOpenAIService {
  private client: OpenAIClient;
  private deploymentName: string;

  constructor(
    endpoint: string,
    apiKey: string,
    deploymentName: string
  ) {
    this.client = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey));
    this.deploymentName = deploymentName;
  }

  async generateResponse(context: ConversationContext, userMessage: string): Promise<ConversationResponse> {
    try {
      const systemPrompt = this.createEmpathicSystemPrompt(context);
      const conversationHistory = this.buildConversationHistory(context);
      
      const response = await this.client.getChatCompletions(this.deploymentName, {
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        maxTokens: 500,
        topP: 0.9,
        frequencyPenalty: 0.1,
        presencePenalty: 0.1
      });

      const assistantResponse = response.choices[0]?.message?.content || 'I understand you\'re reaching out. Could you tell me more about how you\'re feeling?';

      // Note: Emotional analysis and crisis detection will be handled by other services
      // This is a placeholder structure for the response
      return {
        response: assistantResponse,
        emotionalAnalysis: {
          sentiment: { positive: 0, neutral: 0, negative: 0 },
          emotions: { joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0, disgust: 0 },
          keyPhrases: [],
          stressIndicators: [],
          copingMechanisms: []
        },
        suggestedActions: [],
        crisisDetected: false
      };

    } catch (error) {
      throw new AzureServiceError(
        'OpenAI',
        error.code || 'UNKNOWN_ERROR',
        this.isRetryableError(error),
        `Failed to generate response: ${error.message}`
      );
    }
  }

  async generateEmpathicResponse(emotionalState: string, userMessage: string): Promise<string> {
    try {
      const empathicPrompt = this.createEmotionSpecificPrompt(emotionalState);
      
      const response = await this.client.getChatCompletions(this.deploymentName, {
        messages: [
          { role: 'system', content: empathicPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.8,
        maxTokens: 300,
        topP: 0.9
      });

      return response.choices[0]?.message?.content || 'I hear you and I\'m here to support you.';

    } catch (error) {
      throw new AzureServiceError(
        'OpenAI',
        error.code || 'UNKNOWN_ERROR',
        this.isRetryableError(error),
        `Failed to generate empathic response: ${error.message}`
      );
    }
  }

  async createPersonalizedPrompt(userHistory: string[], currentMood: string): Promise<string> {
    try {
      const personalizationContext = this.buildPersonalizationContext(userHistory, currentMood);
      
      const response = await this.client.getChatCompletions(this.deploymentName, {
        messages: [
          { 
            role: 'system', 
            content: 'You are a mental health AI assistant. Based on the user\'s history and current mood, create a personalized, empathetic prompt that acknowledges their journey and current state.' 
          },
          { role: 'user', content: personalizationContext }
        ],
        temperature: 0.6,
        maxTokens: 200
      });

      return response.choices[0]?.message?.content || 'How are you feeling today? I\'m here to listen and support you.';

    } catch (error) {
      throw new AzureServiceError(
        'OpenAI',
        error.code || 'UNKNOWN_ERROR',
        this.isRetryableError(error),
        `Failed to create personalized prompt: ${error.message}`
      );
    }
  }

  private createEmpathicSystemPrompt(context: ConversationContext): string {
    const basePrompt = `You are MindEase, a compassionate AI mental health companion designed to support students, especially international students adjusting to new environments. Your role is to:

1. Provide empathetic, non-judgmental emotional support
2. Listen actively and validate feelings
3. Offer gentle guidance and coping strategies
4. Maintain appropriate boundaries as a non-clinical AI assistant
5. Encourage professional help when appropriate

IMPORTANT GUIDELINES:
- Always maintain a warm, calm, and supportive tone
- Acknowledge that you are an AI companion, not a replacement for professional therapy
- Focus on emotional support and practical coping strategies
- Be culturally sensitive, especially for international students
- Never provide medical advice or diagnose mental health conditions
- If you detect crisis language, gently guide toward professional resources

CONVERSATION CONTEXT:
- User's current emotional state: ${context.emotionalState.dominantEmotion}
- Current mood level: ${context.emotionalState.currentMood}/5
- Risk level: ${context.emotionalState.riskLevel}
- Recent themes: ${context.recentMessages.map(m => m.keyThemes.join(', ')).join('; ')}

Respond with empathy, understanding, and appropriate support based on this context.`;

    return basePrompt;
  }

  private createEmotionSpecificPrompt(emotionalState: string): string {
    const emotionPrompts = {
      sadness: 'You are responding to someone experiencing sadness. Offer gentle validation, acknowledge their pain, and provide comfort while suggesting healthy coping strategies.',
      anxiety: 'You are responding to someone experiencing anxiety. Provide calming reassurance, offer grounding techniques, and help them feel more in control.',
      anger: 'You are responding to someone experiencing anger. Validate their feelings while helping them process emotions constructively and safely.',
      fear: 'You are responding to someone experiencing fear. Offer reassurance, help them feel safe, and provide practical strategies for managing fear.',
      joy: 'You are responding to someone experiencing joy. Celebrate with them while helping them maintain and build on positive emotions.',
      default: 'You are responding to someone who needs emotional support. Be empathetic, validating, and supportive.'
    };

    return emotionPrompts[emotionalState.toLowerCase()] || emotionPrompts.default;
  }

  private buildConversationHistory(context: ConversationContext): Array<{ role: 'user' | 'assistant', content: string }> {
    // Build conversation history from recent messages
    // This is a simplified version - in practice, you'd maintain actual message history
    return context.recentMessages.slice(-3).map((msg, index) => ({
      role: index % 2 === 0 ? 'user' : 'assistant',
      content: `Previous context: ${msg.keyThemes.join(', ')} (mood: ${msg.userMood}/5)`
    }));
  }

  private buildPersonalizationContext(userHistory: string[], currentMood: string): string {
    return `User's conversation history themes: ${userHistory.join(', ')}
Current mood: ${currentMood}
Create a personalized greeting that acknowledges their journey and current emotional state.`;
  }

  private isRetryableError(error: any): boolean {
    // Define which errors are retryable (network issues, rate limits, etc.)
    const retryableCodes = ['429', '500', '502', '503', '504', 'ECONNRESET', 'ETIMEDOUT'];
    return retryableCodes.includes(error.code) || retryableCodes.includes(error.status?.toString());
  }
}