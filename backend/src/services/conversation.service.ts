import { ConversationService } from '../interfaces/services';
import { AzureOpenAIServiceImpl } from './azure-openai.service';
import { ConversationResponse } from '../interfaces/azure-services';
import { ConversationContext, EmotionalAnalysis, MessageSummary, EmotionalState, SafetyFlag } from '../../../shared/types';
import { CopingStrategyService, StrategyRecommendation } from './coping-strategy.service';
import { DatabaseService } from './database.service';
import { v4 as uuidv4 } from 'uuid';

export class ConversationServiceImpl implements ConversationService {
  private openAIService: AzureOpenAIServiceImpl;
  private conversationContexts: Map<string, ConversationContext> = new Map();
  private copingStrategyService: CopingStrategyService;

  constructor(
    openAIEndpoint: string,
    openAIApiKey: string,
    deploymentName: string,
    databaseService?: DatabaseService
  ) {
    this.openAIService = new AzureOpenAIServiceImpl(
      openAIEndpoint,
      openAIApiKey,
      deploymentName
    );
    
    // Initialize coping strategy service
    const dbService = databaseService || new DatabaseService();
    this.copingStrategyService = new CopingStrategyService(dbService);
  }

  async processMessage(userId: string, message: string): Promise<ConversationResponse> {
    try {
      // Get or create conversation context
      const context = await this.getConversationContext(userId);
      
      // Generate response using Azure OpenAI
      const response = await this.openAIService.generateResponse(context, message);
      
      // Update conversation context with new message
      await this.updateContextWithMessage(userId, message, response.response);
      
      // Get coping strategy recommendations if user seems distressed
      const updatedContext = await this.getConversationContext(userId);
      const copingStrategies = await this.getCopingStrategyRecommendations(
        userId, 
        updatedContext.emotionalState, 
        response.emotionalAnalysis
      );
      
      // Add coping strategies to suggested actions
      const enhancedSuggestedActions = [...(response.suggestedActions || [])];
      if (copingStrategies.length > 0) {
        enhancedSuggestedActions.push(
          ...copingStrategies.map(s => `Try: ${s.strategy.name}`)
        );
      }
      
      return {
        ...response,
        suggestedActions: enhancedSuggestedActions,
        copingStrategies: copingStrategies.map(s => ({
          id: s.strategy.id,
          name: s.strategy.name,
          description: s.strategy.description,
          reason: s.reason,
          personalizedInstructions: s.personalizedInstructions
        }))
      };

    } catch (error) {
      console.error('Error processing message:', error);
      
      // Return fallback response
      return {
        response: 'I apologize, but I\'m having trouble processing your message right now. I\'m still here to listen and support you. Could you try rephrasing what you\'d like to share?',
        emotionalAnalysis: this.createDefaultEmotionalAnalysis(),
        suggestedActions: ['Try rephrasing your message', 'Check your connection'],
        crisisDetected: false
      };
    }
  }

  async processVoiceInput(userId: string, audioBlob: Buffer): Promise<ConversationResponse> {
    try {
      // For now, return a placeholder response
      // Voice processing will be implemented in the Speech Service integration
      return {
        response: 'I received your voice message. Voice processing will be available soon. For now, please use text input.',
        emotionalAnalysis: this.createDefaultEmotionalAnalysis(),
        suggestedActions: ['Use text input for now'],
        crisisDetected: false
      };

    } catch (error) {
      console.error('Error processing voice input:', error);
      
      return {
        response: 'I\'m having trouble processing voice input right now. Please try using text instead.',
        emotionalAnalysis: this.createDefaultEmotionalAnalysis(),
        suggestedActions: ['Use text input'],
        crisisDetected: false
      };
    }
  }

  async generateResponse(context: ConversationContext): Promise<string> {
    try {
      const response = await this.openAIService.generateResponse(context, 'Continue the conversation based on context');
      return response.response;
    } catch (error) {
      console.error('Error generating response:', error);
      return 'I\'m here to listen and support you. How are you feeling right now?';
    }
  }

  async analyzeEmotion(text: string): Promise<EmotionalAnalysis> {
    // Placeholder implementation - will be enhanced with Azure AI Language service
    // For now, return basic analysis based on simple keyword detection
    return this.performBasicEmotionAnalysis(text);
  }

  async getConversationContext(userId: string): Promise<ConversationContext> {
    if (this.conversationContexts.has(userId)) {
      return this.conversationContexts.get(userId)!;
    }

    // Create new conversation context
    const newContext: ConversationContext = {
      userId,
      recentMessages: [],
      emotionalState: {
        currentMood: 3, // neutral starting point
        dominantEmotion: 'neutral',
        stressLevel: 2,
        riskLevel: 'low'
      },
      personalizedPrompts: [],
      safetyFlags: [],
      sessionId: uuidv4()
    };

    this.conversationContexts.set(userId, newContext);
    return newContext;
  }

  async updateConversationContext(userId: string, context: ConversationContext): Promise<void> {
    this.conversationContexts.set(userId, context);
  }

  private async updateContextWithMessage(userId: string, userMessage: string, assistantResponse: string): Promise<void> {
    const context = await this.getConversationContext(userId);
    
    // Analyze user message for emotional content
    const emotionalAnalysis = await this.analyzeEmotion(userMessage);
    
    // Create message summary
    const messageSummary: MessageSummary = {
      timestamp: new Date(),
      emotionalTone: emotionalAnalysis.emotions.sadness > 0.6 ? 'sad' : 
                    emotionalAnalysis.emotions.joy > 0.6 ? 'happy' :
                    emotionalAnalysis.emotions.anger > 0.6 ? 'angry' :
                    emotionalAnalysis.emotions.fear > 0.6 ? 'anxious' : 'neutral',
      keyThemes: emotionalAnalysis.keyPhrases,
      userMood: this.calculateMoodScore(emotionalAnalysis)
    };

    // Update context
    context.recentMessages.push(messageSummary);
    
    // Keep only last 5 messages for context
    if (context.recentMessages.length > 5) {
      context.recentMessages = context.recentMessages.slice(-5);
    }

    // Update emotional state
    context.emotionalState = {
      currentMood: messageSummary.userMood,
      dominantEmotion: messageSummary.emotionalTone,
      stressLevel: this.calculateStressLevel(emotionalAnalysis),
      riskLevel: this.assessRiskLevel(emotionalAnalysis)
    };

    await this.updateConversationContext(userId, context);
  }

  private performBasicEmotionAnalysis(text: string): EmotionalAnalysis {
    const lowerText = text.toLowerCase();
    
    // Simple keyword-based emotion detection
    const sadWords = ['sad', 'depressed', 'down', 'upset', 'crying', 'hurt', 'lonely', 'empty'];
    const joyWords = ['happy', 'excited', 'great', 'wonderful', 'amazing', 'good', 'better', 'fantastic'];
    const angerWords = ['angry', 'mad', 'furious', 'annoyed', 'frustrated', 'irritated'];
    const fearWords = ['scared', 'afraid', 'worried', 'anxious', 'nervous', 'panic', 'terrified'];
    const stressWords = ['stressed', 'overwhelmed', 'pressure', 'burden', 'exhausted', 'tired'];

    const sadScore = this.countKeywords(lowerText, sadWords) / sadWords.length;
    const joyScore = this.countKeywords(lowerText, joyWords) / joyWords.length;
    const angerScore = this.countKeywords(lowerText, angerWords) / angerWords.length;
    const fearScore = this.countKeywords(lowerText, fearWords) / fearWords.length;
    const stressScore = this.countKeywords(lowerText, stressWords) / stressWords.length;

    // Calculate sentiment
    const positiveScore = joyScore;
    const negativeScore = Math.max(sadScore, angerScore, fearScore);
    const neutralScore = 1 - (positiveScore + negativeScore);

    return {
      sentiment: {
        positive: Math.min(positiveScore, 1),
        neutral: Math.max(neutralScore, 0),
        negative: Math.min(negativeScore, 1)
      },
      emotions: {
        joy: Math.min(joyScore * 2, 1),
        sadness: Math.min(sadScore * 2, 1),
        anger: Math.min(angerScore * 2, 1),
        fear: Math.min(fearScore * 2, 1),
        surprise: 0.1, // placeholder
        disgust: 0.1   // placeholder
      },
      keyPhrases: this.extractKeyPhrases(text),
      stressIndicators: stressScore > 0.3 ? ['high stress language detected'] : [],
      copingMechanisms: this.identifyCopingMechanisms(text)
    };
  }

  private countKeywords(text: string, keywords: string[]): number {
    return keywords.reduce((count, keyword) => {
      return count + (text.includes(keyword) ? 1 : 0);
    }, 0);
  }

  private extractKeyPhrases(text: string): string[] {
    // Simple key phrase extraction - split by sentences and take meaningful phrases
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.slice(0, 3).map(s => s.trim().substring(0, 50));
  }

  private identifyCopingMechanisms(text: string): string[] {
    const copingWords = ['breathe', 'meditation', 'exercise', 'talk', 'journal', 'music', 'walk'];
    const lowerText = text.toLowerCase();
    
    return copingWords.filter(word => lowerText.includes(word));
  }

  private calculateMoodScore(analysis: EmotionalAnalysis): number {
    // Calculate mood on 1-5 scale based on emotional analysis
    const positiveWeight = analysis.sentiment.positive * 2;
    const negativeWeight = analysis.sentiment.negative * -2;
    const neutralWeight = analysis.sentiment.neutral * 0;
    
    const rawScore = 3 + positiveWeight + negativeWeight; // 3 is neutral baseline
    return Math.max(1, Math.min(5, Math.round(rawScore)));
  }

  private calculateStressLevel(analysis: EmotionalAnalysis): number {
    // Calculate stress level 1-5 based on negative emotions and stress indicators
    const stressScore = (analysis.emotions.fear + analysis.emotions.anger) * 2 + 
                       (analysis.stressIndicators.length * 0.5);
    return Math.max(1, Math.min(5, Math.round(stressScore * 5)));
  }

  private assessRiskLevel(analysis: EmotionalAnalysis): 'low' | 'medium' | 'high' | 'crisis' {
    const negativeScore = analysis.sentiment.negative;
    const stressIndicators = analysis.stressIndicators.length;
    
    if (negativeScore > 0.8 && stressIndicators > 2) return 'high';
    if (negativeScore > 0.6 || stressIndicators > 1) return 'medium';
    return 'low';
  }

  private async getCopingStrategyRecommendations(
    userId: string,
    emotionalState: EmotionalState,
    emotionalAnalysis?: EmotionalAnalysis
  ): Promise<StrategyRecommendation[]> {
    try {
      // Only recommend strategies if user seems distressed
      if (emotionalState.currentMood > 3 && emotionalState.stressLevel < 3) {
        return []; // User seems okay, no need for coping strategies
      }

      // Get personalized recommendations
      const recommendations = await this.copingStrategyService.getRecommendations(
        userId,
        emotionalState,
        emotionalAnalysis,
        2 // Limit to 2 recommendations to avoid overwhelming
      );

      return recommendations;
    } catch (error) {
      console.error('Error getting coping strategy recommendations:', error);
      return [];
    }
  }

  private createDefaultEmotionalAnalysis(): EmotionalAnalysis {
    return {
      sentiment: { positive: 0.3, neutral: 0.4, negative: 0.3 },
      emotions: { joy: 0.2, sadness: 0.2, anger: 0.1, fear: 0.1, surprise: 0.1, disgust: 0.1 },
      keyPhrases: [],
      stressIndicators: [],
      copingMechanisms: []
    };
  }
}