import { ConversationContext, MessageSummary, EmotionalState, SafetyFlag } from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export class ContextManagerService {
  private contexts: Map<string, ConversationContext> = new Map();
  private readonly MAX_CONTEXT_MESSAGES = 5;
  private readonly CONTEXT_EXPIRY_HOURS = 24;

  async getContext(userId: string): Promise<ConversationContext> {
    const existingContext = this.contexts.get(userId);
    
    if (existingContext && this.isContextValid(existingContext)) {
      return existingContext;
    }

    // Create new context
    const newContext = this.createNewContext(userId);
    this.contexts.set(userId, newContext);
    return newContext;
  }

  async updateContext(userId: string, updates: Partial<ConversationContext>): Promise<ConversationContext> {
    const context = await this.getContext(userId);
    const updatedContext = { ...context, ...updates };
    this.contexts.set(userId, updatedContext);
    return updatedContext;
  }

  async addMessageToContext(
    userId: string, 
    userMessage: string, 
    assistantResponse: string,
    emotionalAnalysis: any
  ): Promise<void> {
    const context = await this.getContext(userId);
    
    const messageSummary: MessageSummary = {
      timestamp: new Date(),
      emotionalTone: this.extractDominantEmotion(emotionalAnalysis),
      keyThemes: emotionalAnalysis.keyPhrases || [],
      userMood: this.calculateMoodFromAnalysis(emotionalAnalysis)
    };

    // Add to recent messages
    context.recentMessages.push(messageSummary);
    
    // Keep only the most recent messages
    if (context.recentMessages.length > this.MAX_CONTEXT_MESSAGES) {
      context.recentMessages = context.recentMessages.slice(-this.MAX_CONTEXT_MESSAGES);
    }

    // Update emotional state
    context.emotionalState = this.updateEmotionalState(context.emotionalState, emotionalAnalysis);

    // Update personalized prompts based on conversation patterns
    context.personalizedPrompts = this.generatePersonalizedPrompts(context);

    this.contexts.set(userId, context);
  }

  async addSafetyFlag(userId: string, flag: SafetyFlag): Promise<void> {
    const context = await this.getContext(userId);
    context.safetyFlags.push(flag);
    
    // Keep only recent safety flags (last 10)
    if (context.safetyFlags.length > 10) {
      context.safetyFlags = context.safetyFlags.slice(-10);
    }

    this.contexts.set(userId, context);
  }

  async clearContext(userId: string): Promise<void> {
    this.contexts.delete(userId);
  }

  async getPersonalizationInsights(userId: string): Promise<{
    commonThemes: string[];
    emotionalPatterns: string[];
    preferredTopics: string[];
    riskFactors: string[];
  }> {
    const context = await this.getContext(userId);
    
    const allThemes = context.recentMessages.flatMap(msg => msg.keyThemes);
    const emotionalTones = context.recentMessages.map(msg => msg.emotionalTone);
    
    return {
      commonThemes: this.findMostFrequent(allThemes, 5),
      emotionalPatterns: this.findMostFrequent(emotionalTones, 3),
      preferredTopics: this.extractPreferredTopics(context),
      riskFactors: this.identifyRiskFactors(context)
    };
  }

  private createNewContext(userId: string): ConversationContext {
    return {
      userId,
      recentMessages: [],
      emotionalState: {
        currentMood: 3, // neutral starting point
        dominantEmotion: 'neutral',
        stressLevel: 2,
        riskLevel: 'low'
      },
      personalizedPrompts: [
        'How are you feeling today?',
        'What\'s on your mind?',
        'I\'m here to listen and support you.'
      ],
      safetyFlags: [],
      sessionId: uuidv4()
    };
  }

  private isContextValid(context: ConversationContext): boolean {
    if (!context.recentMessages.length) return true;
    
    const lastMessage = context.recentMessages[context.recentMessages.length - 1];
    const hoursSinceLastMessage = (Date.now() - lastMessage.timestamp.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceLastMessage < this.CONTEXT_EXPIRY_HOURS;
  }

  private extractDominantEmotion(emotionalAnalysis: any): string {
    if (!emotionalAnalysis?.emotions) return 'neutral';
    
    const emotions = emotionalAnalysis.emotions;
    let maxEmotion = 'neutral';
    let maxScore = 0;

    for (const [emotion, score] of Object.entries(emotions)) {
      if (typeof score === 'number' && score > maxScore) {
        maxScore = score;
        maxEmotion = emotion;
      }
    }

    return maxEmotion;
  }

  private calculateMoodFromAnalysis(emotionalAnalysis: any): number {
    if (!emotionalAnalysis?.sentiment) return 3;
    
    const { positive, negative, neutral } = emotionalAnalysis.sentiment;
    
    // Convert sentiment to 1-5 mood scale
    const moodScore = 1 + (positive * 4) - (negative * 2) + (neutral * 2);
    return Math.max(1, Math.min(5, Math.round(moodScore)));
  }

  private updateEmotionalState(currentState: EmotionalState, emotionalAnalysis: any): EmotionalState {
    const newMood = this.calculateMoodFromAnalysis(emotionalAnalysis);
    const dominantEmotion = this.extractDominantEmotion(emotionalAnalysis);
    
    // Calculate stress level based on negative emotions
    const stressLevel = this.calculateStressLevel(emotionalAnalysis);
    
    // Assess risk level
    const riskLevel = this.assessRiskLevel(emotionalAnalysis, currentState);

    return {
      currentMood: newMood,
      dominantEmotion,
      stressLevel,
      riskLevel
    };
  }

  private calculateStressLevel(emotionalAnalysis: any): number {
    if (!emotionalAnalysis?.emotions) return 2;
    
    const { fear, anger, sadness } = emotionalAnalysis.emotions;
    const stressScore = (fear + anger + sadness) / 3;
    
    return Math.max(1, Math.min(5, Math.round(1 + stressScore * 4)));
  }

  private assessRiskLevel(emotionalAnalysis: any, currentState: EmotionalState): 'low' | 'medium' | 'high' | 'crisis' {
    if (!emotionalAnalysis) return 'low';
    
    const negativeScore = emotionalAnalysis.sentiment?.negative || 0;
    const stressIndicators = emotionalAnalysis.stressIndicators?.length || 0;
    const currentRisk = currentState.riskLevel;
    
    // Crisis indicators (would be enhanced with content safety service)
    if (negativeScore > 0.9 && stressIndicators > 3) return 'crisis';
    if (negativeScore > 0.7 && stressIndicators > 2) return 'high';
    if (negativeScore > 0.5 || stressIndicators > 1) return 'medium';
    
    return 'low';
  }

  private generatePersonalizedPrompts(context: ConversationContext): string[] {
    const prompts: string[] = [];
    const recentThemes = context.recentMessages.flatMap(msg => msg.keyThemes);
    const dominantEmotion = context.emotionalState.dominantEmotion;
    
    // Generate prompts based on emotional state
    switch (dominantEmotion) {
      case 'sadness':
        prompts.push(
          'I noticed you\'ve been feeling down. Would you like to talk about what\'s troubling you?',
          'Sometimes sharing our feelings can help. What\'s been weighing on your mind?'
        );
        break;
      case 'anxiety':
      case 'fear':
        prompts.push(
          'I sense you might be feeling anxious. What\'s causing you worry right now?',
          'When we\'re anxious, it can help to talk through our concerns. What\'s on your mind?'
        );
        break;
      case 'anger':
        prompts.push(
          'It sounds like something has upset you. Would you like to share what happened?',
          'I\'m here to listen if you need to express your frustrations.'
        );
        break;
      case 'joy':
        prompts.push(
          'I\'m glad to hear you\'re feeling positive! What\'s been going well for you?',
          'It\'s wonderful that you\'re feeling good. What\'s bringing you joy today?'
        );
        break;
      default:
        prompts.push(
          'How are you feeling today?',
          'What would you like to talk about?',
          'I\'m here to listen and support you.'
        );
    }

    // Add theme-based prompts
    if (recentThemes.includes('school') || recentThemes.includes('study')) {
      prompts.push('How are things going with your studies?');
    }
    if (recentThemes.includes('family') || recentThemes.includes('home')) {
      prompts.push('How are things with your family?');
    }
    if (recentThemes.includes('friends') || recentThemes.includes('social')) {
      prompts.push('How are your relationships with friends going?');
    }

    return prompts.slice(0, 5); // Return top 5 prompts
  }

  private findMostFrequent(items: string[], limit: number): string[] {
    const frequency = items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([item]) => item);
  }

  private extractPreferredTopics(context: ConversationContext): string[] {
    // Extract topics that appear frequently and correlate with positive emotions
    const positiveMessages = context.recentMessages.filter(msg => msg.userMood >= 4);
    const positiveThemes = positiveMessages.flatMap(msg => msg.keyThemes);
    
    return this.findMostFrequent(positiveThemes, 3);
  }

  private identifyRiskFactors(context: ConversationContext): string[] {
    const riskFactors: string[] = [];
    
    // Check for concerning patterns
    const recentMoods = context.recentMessages.map(msg => msg.userMood);
    const averageMood = recentMoods.reduce((sum, mood) => sum + mood, 0) / recentMoods.length;
    
    if (averageMood < 2.5) {
      riskFactors.push('consistently low mood');
    }
    
    if (context.safetyFlags.length > 0) {
      riskFactors.push('safety concerns detected');
    }
    
    if (context.emotionalState.stressLevel > 4) {
      riskFactors.push('high stress levels');
    }
    
    return riskFactors;
  }
}