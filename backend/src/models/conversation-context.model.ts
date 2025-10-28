import { 
  ConversationContext, 
  MessageSummary, 
  EmotionalState, 
  SafetyFlag 
} from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export class ConversationContextModel {
  private data: ConversationContext;

  constructor(userId: string, data?: Partial<ConversationContext>) {
    this.data = {
      userId,
      recentMessages: data?.recentMessages || [],
      emotionalState: data?.emotionalState || this.getDefaultEmotionalState(),
      personalizedPrompts: data?.personalizedPrompts || [],
      safetyFlags: data?.safetyFlags || [],
      sessionId: data?.sessionId || uuidv4()
    };
  }

  // Getters
  get userId(): string {
    return this.data.userId;
  }

  get sessionId(): string {
    return this.data.sessionId;
  }

  get recentMessages(): MessageSummary[] {
    return this.data.recentMessages;
  }

  get emotionalState(): EmotionalState {
    return this.data.emotionalState;
  }

  get personalizedPrompts(): string[] {
    return this.data.personalizedPrompts;
  }

  get safetyFlags(): SafetyFlag[] {
    return this.data.safetyFlags;
  }

  // Message management
  addMessageSummary(summary: MessageSummary): void {
    this.data.recentMessages.push(summary);
    
    // Keep only the last 5 messages as per requirements
    if (this.data.recentMessages.length > 5) {
      this.data.recentMessages = this.data.recentMessages.slice(-5);
    }
  }

  getRecentMessageContext(): string {
    return this.data.recentMessages
      .map(msg => `${msg.emotionalTone}: ${msg.keyThemes.join(', ')} (mood: ${msg.userMood})`)
      .join('\n');
  }

  // Emotional state management
  updateEmotionalState(state: Partial<EmotionalState>): void {
    this.data.emotionalState = {
      ...this.data.emotionalState,
      ...state
    };
  }

  updateMood(mood: number): void {
    this.data.emotionalState.currentMood = Math.max(1, Math.min(5, mood));
  }

  updateStressLevel(level: number): void {
    this.data.emotionalState.stressLevel = Math.max(0, Math.min(10, level));
  }

  setDominantEmotion(emotion: string): void {
    this.data.emotionalState.dominantEmotion = emotion;
  }

  updateRiskLevel(level: 'low' | 'medium' | 'high' | 'crisis'): void {
    this.data.emotionalState.riskLevel = level;
  }

  // Safety flag management
  addSafetyFlag(flag: SafetyFlag): void {
    this.data.safetyFlags.push(flag);
    
    // Keep only flags from the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.data.safetyFlags = this.data.safetyFlags.filter(
      flag => flag.timestamp > oneDayAgo
    );
  }

  hasRecentCrisisFlags(): boolean {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return this.data.safetyFlags.some(
      flag => flag.type === 'crisis_indicator' && flag.timestamp > oneHourAgo
    );
  }

  getHighSeverityFlags(): SafetyFlag[] {
    return this.data.safetyFlags.filter(flag => flag.severity === 'high');
  }

  // Personalization
  addPersonalizedPrompt(prompt: string): void {
    if (!this.data.personalizedPrompts.includes(prompt)) {
      this.data.personalizedPrompts.push(prompt);
    }
    
    // Keep only the most recent 10 prompts
    if (this.data.personalizedPrompts.length > 10) {
      this.data.personalizedPrompts = this.data.personalizedPrompts.slice(-10);
    }
  }

  getPersonalizationContext(): string {
    return this.data.personalizedPrompts.join('\n');
  }

  // Session management
  startNewSession(): void {
    this.data.sessionId = uuidv4();
    // Keep emotional state and safety flags, but clear messages and prompts for new session
    this.data.recentMessages = [];
    this.data.personalizedPrompts = [];
  }

  // Serialization methods
  toJSON(): ConversationContext {
    return { ...this.data };
  }

  toDatabase(): any {
    return {
      id: uuidv4(),
      user_id: this.data.userId,
      session_id: this.data.sessionId,
      timestamp: new Date().toISOString(),
      emotional_tone: this.data.emotionalState.dominantEmotion,
      key_themes: JSON.stringify(this.getRecentThemes()),
      mood_score: this.data.emotionalState.currentMood,
      created_at: new Date().toISOString()
    };
  }

  static fromDatabase(row: any): ConversationContextModel {
    const context = new ConversationContextModel(row.user_id, {
      sessionId: row.session_id,
      emotionalState: {
        currentMood: row.mood_score,
        dominantEmotion: row.emotional_tone,
        stressLevel: 0, // Default, will be updated
        riskLevel: 'low' // Default, will be updated
      }
    });
    
    return context;
  }

  // Helper methods
  private getDefaultEmotionalState(): EmotionalState {
    return {
      currentMood: 3, // neutral
      dominantEmotion: 'neutral',
      stressLevel: 0,
      riskLevel: 'low'
    };
  }

  private getRecentThemes(): string[] {
    const allThemes = this.data.recentMessages.flatMap(msg => msg.keyThemes);
    return [...new Set(allThemes)]; // Remove duplicates
  }
}