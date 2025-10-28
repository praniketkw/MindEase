import { EmotionalState, MessageSummary, UserPreferences } from '../../../shared/types';
import { DatabaseService } from './database.service';
import { v4 as uuidv4 } from 'uuid';

export interface CheckInSession {
  id: string;
  userId: string;
  timestamp: Date;
  mood: number; // 1-5 scale
  stressLevel: number; // 1-5 scale
  emotionalState: EmotionalState;
  responses: CheckInResponse[];
  completed: boolean;
  triggeredBy: 'scheduled' | 'pattern_detected' | 'manual';
  concerningPatterns?: string[];
}

export interface CheckInResponse {
  question: string;
  answer: string;
  emotionalAnalysis?: {
    sentiment: number; // -1 to 1
    keyWords: string[];
  };
}

export interface MoodPattern {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  averageMood: number;
  moodTrend: 'improving' | 'stable' | 'declining';
  concerningIndicators: string[];
  lastAnalyzed: Date;
}

export interface CheckInTrigger {
  type: 'mood_decline' | 'stress_spike' | 'inactivity' | 'concerning_language' | 'scheduled';
  severity: 'low' | 'medium' | 'high';
  description: string;
  threshold: number;
}

export class CheckInService {
  private databaseService: DatabaseService;
  private checkInQuestions: string[];
  private moodTrackingData: Map<string, MoodPattern> = new Map();

  constructor(databaseService: DatabaseService) {
    this.databaseService = databaseService;
    this.checkInQuestions = this.initializeCheckInQuestions();
  }

  private initializeCheckInQuestions(): string[] {
    return [
      "How are you feeling today on a scale of 1-5?",
      "What's been on your mind lately?",
      "How has your stress level been?",
      "Have you been sleeping well?",
      "What's one thing that brought you joy recently?",
      "Is there anything you're worried about?",
      "How connected do you feel to others right now?",
      "What would help you feel better today?",
      "Have you been taking care of yourself?",
      "What's been challenging for you lately?"
    ];
  }

  /**
   * Create a new check-in session
   */
  async createCheckInSession(
    userId: string, 
    triggeredBy: CheckInSession['triggeredBy'],
    concerningPatterns?: string[]
  ): Promise<CheckInSession> {
    const session: CheckInSession = {
      id: uuidv4(),
      userId,
      timestamp: new Date(),
      mood: 3, // Default neutral
      stressLevel: 2, // Default low-medium
      emotionalState: {
        currentMood: 3,
        dominantEmotion: 'neutral',
        stressLevel: 2,
        riskLevel: 'low'
      },
      responses: [],
      completed: false,
      triggeredBy,
      concerningPatterns
    };

    // Save to database
    this.saveCheckInSession(session);
    
    return session;
  }

  /**
   * Get personalized check-in questions based on user's recent patterns
   */
  getPersonalizedQuestions(userId: string, concerningPatterns?: string[]): string[] {
    const baseQuestions = [...this.checkInQuestions];
    const personalizedQuestions: string[] = [];

    // Always start with mood question
    personalizedQuestions.push("How are you feeling today on a scale of 1-5?");

    // Add pattern-specific questions
    if (concerningPatterns) {
      if (concerningPatterns.includes('mood_decline')) {
        personalizedQuestions.push("I've noticed you might be going through a tough time. What's been weighing on you?");
      }
      
      if (concerningPatterns.includes('stress_spike')) {
        personalizedQuestions.push("Your stress levels seem elevated lately. What's been causing you the most stress?");
      }
      
      if (concerningPatterns.includes('inactivity')) {
        personalizedQuestions.push("I haven't heard from you in a while. How have you been taking care of yourself?");
      }
      
      if (concerningPatterns.includes('concerning_language')) {
        personalizedQuestions.push("I want to make sure you're okay. Is there anything you'd like to talk about?");
      }
    }

    // Add 2-3 random questions from the base set
    const remainingQuestions = baseQuestions.filter(q => !personalizedQuestions.includes(q));
    const randomQuestions = this.shuffleArray(remainingQuestions).slice(0, 3);
    personalizedQuestions.push(...randomQuestions);

    return personalizedQuestions.slice(0, 5); // Limit to 5 questions max
  }

  /**
   * Process check-in response and update session
   */
  async processCheckInResponse(
    sessionId: string,
    question: string,
    answer: string
  ): Promise<CheckInSession> {
    const session = await this.getCheckInSession(sessionId);
    if (!session) {
      throw new Error('Check-in session not found');
    }

    // Analyze the response
    const emotionalAnalysis = this.analyzeResponse(answer);
    
    const response: CheckInResponse = {
      question,
      answer,
      emotionalAnalysis
    };

    session.responses.push(response);

    // Update mood and stress based on responses
    if (question.includes('scale of 1-5')) {
      const moodMatch = answer.match(/[1-5]/);
      if (moodMatch) {
        session.mood = parseInt(moodMatch[0]);
        session.emotionalState.currentMood = session.mood;
      }
    }

    // Update emotional state based on response content
    this.updateEmotionalStateFromResponse(session, answer, emotionalAnalysis);

    // Save updated session
    this.saveCheckInSession(session);

    return session;
  }

  /**
   * Complete a check-in session and analyze results
   */
  async completeCheckInSession(sessionId: string): Promise<{
    session: CheckInSession;
    insights: string[];
    recommendations: string[];
    followUpNeeded: boolean;
  }> {
    const session = await this.getCheckInSession(sessionId);
    if (!session) {
      throw new Error('Check-in session not found');
    }

    session.completed = true;
    session.timestamp = new Date(); // Update completion time

    // Analyze overall session
    const insights = this.generateInsights(session);
    const recommendations = this.generateRecommendations(session);
    const followUpNeeded = this.assessFollowUpNeed(session);

    // Update user's mood pattern
    await this.updateMoodPattern(session.userId, session);

    // Save completed session
    this.saveCheckInSession(session);

    return {
      session,
      insights,
      recommendations,
      followUpNeeded
    };
  }

  /**
   * Analyze user patterns and determine if check-in is needed
   */
  async analyzeUserPatterns(userId: string): Promise<CheckInTrigger[]> {
    const triggers: CheckInTrigger[] = [];
    
    // Get recent conversation summaries
    const recentMessages = this.getRecentMessageSummaries(userId, 7); // Last 7 days
    
    if (recentMessages.length === 0) {
      // User hasn't been active
      triggers.push({
        type: 'inactivity',
        severity: 'medium',
        description: 'User has been inactive for several days',
        threshold: 7
      });
      return triggers;
    }

    // Analyze mood trends
    const moodTrend = this.analyzeMoodTrend(recentMessages);
    if (moodTrend.trend === 'declining' && moodTrend.severity > 0.3) {
      triggers.push({
        type: 'mood_decline',
        severity: moodTrend.severity > 0.6 ? 'high' : 'medium',
        description: `Mood has been declining over the past ${moodTrend.days} days`,
        threshold: moodTrend.severity
      });
    }

    // Analyze stress patterns
    const stressPattern = this.analyzeStressPattern(recentMessages);
    if (stressPattern.averageStress > 3.5) {
      triggers.push({
        type: 'stress_spike',
        severity: stressPattern.averageStress > 4 ? 'high' : 'medium',
        description: 'Elevated stress levels detected in recent conversations',
        threshold: stressPattern.averageStress
      });
    }

    // Check for concerning language patterns
    const concerningLanguage = this.detectConcerningLanguage(recentMessages);
    if (concerningLanguage.score > 0.4) {
      triggers.push({
        type: 'concerning_language',
        severity: concerningLanguage.score > 0.7 ? 'high' : 'medium',
        description: 'Concerning language patterns detected',
        threshold: concerningLanguage.score
      });
    }

    return triggers;
  }

  /**
   * Schedule check-ins based on user preferences
   */
  async scheduleCheckIn(userId: string, preferences: UserPreferences): Promise<Date | null> {
    const lastCheckIn = await this.getLastCheckInDate(userId);
    const now = new Date();
    
    let nextCheckIn: Date | null = null;

    switch (preferences.checkInFrequency) {
      case 'daily':
        if (!lastCheckIn || this.daysBetween(lastCheckIn, now) >= 1) {
          nextCheckIn = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
        }
        break;
        
      case 'weekly':
        if (!lastCheckIn || this.daysBetween(lastCheckIn, now) >= 7) {
          nextCheckIn = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Next week
        }
        break;
        
      case 'custom':
        // For custom, check if it's been more than 3 days
        if (!lastCheckIn || this.daysBetween(lastCheckIn, now) >= 3) {
          nextCheckIn = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // In 3 days
        }
        break;
    }

    return nextCheckIn;
  }

  /**
   * Get user's mood pattern over time
   */
  async getUserMoodPattern(userId: string, days: number = 30): Promise<MoodPattern> {
    const messages = this.getRecentMessageSummaries(userId, days);
    
    if (messages.length === 0) {
      return {
        userId,
        period: 'monthly',
        averageMood: 3,
        moodTrend: 'stable',
        concerningIndicators: [],
        lastAnalyzed: new Date()
      };
    }

    const averageMood = messages.reduce((sum, msg) => sum + msg.userMood, 0) / messages.length;
    const moodTrend = this.calculateMoodTrend(messages);
    const concerningIndicators = this.identifyConcerningIndicators(messages);

    return {
      userId,
      period: days <= 7 ? 'daily' : days <= 30 ? 'weekly' : 'monthly',
      averageMood,
      moodTrend,
      concerningIndicators,
      lastAnalyzed: new Date()
    };
  }

  // Private helper methods

  private analyzeResponse(answer: string): { sentiment: number; keyWords: string[] } {
    const lowerAnswer = answer.toLowerCase();
    
    // Simple sentiment analysis
    const positiveWords = ['good', 'great', 'happy', 'better', 'fine', 'okay', 'well'];
    const negativeWords = ['bad', 'terrible', 'sad', 'worse', 'awful', 'stressed', 'anxious', 'worried'];
    
    const positiveCount = positiveWords.filter(word => lowerAnswer.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerAnswer.includes(word)).length;
    
    const sentiment = (positiveCount - negativeCount) / Math.max(positiveCount + negativeCount, 1);
    
    // Extract key words
    const keyWords = [...positiveWords, ...negativeWords].filter(word => lowerAnswer.includes(word));
    
    return { sentiment, keyWords };
  }

  private updateEmotionalStateFromResponse(
    session: CheckInSession, 
    answer: string, 
    analysis: { sentiment: number; keyWords: string[] }
  ): void {
    // Update emotional state based on sentiment
    if (analysis.sentiment < -0.3) {
      session.emotionalState.riskLevel = 'medium';
      session.emotionalState.dominantEmotion = 'sad';
    } else if (analysis.sentiment > 0.3) {
      session.emotionalState.dominantEmotion = 'happy';
    }

    // Adjust stress level based on key words
    if (analysis.keyWords.some(word => ['stressed', 'anxious', 'worried'].includes(word))) {
      session.stressLevel = Math.min(5, session.stressLevel + 1);
      session.emotionalState.stressLevel = session.stressLevel;
    }
  }

  private generateInsights(session: CheckInSession): string[] {
    const insights: string[] = [];
    
    if (session.mood <= 2) {
      insights.push("You seem to be going through a difficult time right now.");
    } else if (session.mood >= 4) {
      insights.push("It's great to see you're feeling positive today!");
    }

    if (session.stressLevel >= 4) {
      insights.push("Your stress levels appear to be quite high.");
    }

    const negativeResponses = session.responses.filter(r => 
      r.emotionalAnalysis && r.emotionalAnalysis.sentiment < -0.2
    );
    
    if (negativeResponses.length > session.responses.length / 2) {
      insights.push("Several of your responses suggest you might benefit from additional support.");
    }

    return insights;
  }

  private generateRecommendations(session: CheckInSession): string[] {
    const recommendations: string[] = [];
    
    if (session.mood <= 2 || session.stressLevel >= 4) {
      recommendations.push("Consider trying some breathing exercises or grounding techniques");
      recommendations.push("Reach out to a friend, family member, or counselor for support");
    }

    if (session.stressLevel >= 3) {
      recommendations.push("Take some time for self-care activities you enjoy");
    }

    recommendations.push("Continue our conversations whenever you need support");
    
    return recommendations;
  }

  private assessFollowUpNeed(session: CheckInSession): boolean {
    return session.mood <= 2 || 
           session.stressLevel >= 4 || 
           session.emotionalState.riskLevel !== 'low' ||
           session.concerningPatterns && session.concerningPatterns.length > 0;
  }

  private analyzeMoodTrend(messages: MessageSummary[]): { trend: 'improving' | 'stable' | 'declining'; severity: number; days: number } {
    if (messages.length < 3) {
      return { trend: 'stable', severity: 0, days: messages.length };
    }

    const sortedMessages = messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const recentMoods = sortedMessages.slice(-5).map(m => m.userMood);
    
    let trendScore = 0;
    for (let i = 1; i < recentMoods.length; i++) {
      trendScore += recentMoods[i] - recentMoods[i - 1];
    }
    
    const averageTrend = trendScore / (recentMoods.length - 1);
    const severity = Math.abs(averageTrend) / 4; // Normalize to 0-1
    
    if (averageTrend < -0.3) {
      return { trend: 'declining', severity, days: messages.length };
    } else if (averageTrend > 0.3) {
      return { trend: 'improving', severity, days: messages.length };
    } else {
      return { trend: 'stable', severity, days: messages.length };
    }
  }

  private analyzeStressPattern(messages: MessageSummary[]): { averageStress: number; trend: string } {
    // This would analyze stress indicators in message themes
    // For now, return a simple calculation
    const stressKeywords = ['stress', 'overwhelmed', 'pressure', 'anxious', 'worried'];
    let stressScore = 0;
    
    messages.forEach(msg => {
      const stressCount = msg.keyThemes.filter(theme => 
        stressKeywords.some(keyword => theme.toLowerCase().includes(keyword))
      ).length;
      stressScore += stressCount;
    });
    
    const averageStress = Math.min(5, 2 + (stressScore / messages.length));
    
    return { averageStress, trend: 'stable' };
  }

  private detectConcerningLanguage(messages: MessageSummary[]): { score: number; indicators: string[] } {
    const concerningKeywords = ['hurt', 'harm', 'hopeless', 'worthless', 'end', 'give up'];
    let concernScore = 0;
    const indicators: string[] = [];
    
    messages.forEach(msg => {
      msg.keyThemes.forEach(theme => {
        concerningKeywords.forEach(keyword => {
          if (theme.toLowerCase().includes(keyword)) {
            concernScore += 0.2;
            indicators.push(keyword);
          }
        });
      });
    });
    
    return { score: Math.min(1, concernScore), indicators };
  }

  private calculateMoodTrend(messages: MessageSummary[]): 'improving' | 'stable' | 'declining' {
    if (messages.length < 2) return 'stable';
    
    const sortedMessages = messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const firstHalf = sortedMessages.slice(0, Math.floor(messages.length / 2));
    const secondHalf = sortedMessages.slice(Math.floor(messages.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, msg) => sum + msg.userMood, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, msg) => sum + msg.userMood, 0) / secondHalf.length;
    
    const difference = secondAvg - firstAvg;
    
    if (difference > 0.5) return 'improving';
    if (difference < -0.5) return 'declining';
    return 'stable';
  }

  private identifyConcerningIndicators(messages: MessageSummary[]): string[] {
    const indicators: string[] = [];
    
    const avgMood = messages.reduce((sum, msg) => sum + msg.userMood, 0) / messages.length;
    if (avgMood < 2.5) {
      indicators.push('Consistently low mood');
    }
    
    const recentMessages = messages.slice(-3);
    if (recentMessages.every(msg => msg.userMood <= 2)) {
      indicators.push('Recent mood decline');
    }
    
    return indicators;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private daysBetween(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
  }

  // Database operations
  private saveCheckInSession(session: CheckInSession): void {
    const dbSession = {
      id: session.id,
      user_id: session.userId,
      timestamp: session.timestamp.toISOString(),
      mood: session.mood,
      stress_level: session.stressLevel,
      emotional_state: session.emotionalState,
      completed: session.completed,
      triggered_by: session.triggeredBy,
      concerning_patterns: session.concerningPatterns
    };
    
    this.databaseService.saveCheckInSession(dbSession);

    // Save responses
    session.responses.forEach(response => {
      const dbResponse = {
        id: uuidv4(),
        session_id: session.id,
        question: response.question,
        answer: response.answer,
        emotional_analysis: response.emotionalAnalysis,
        timestamp: new Date().toISOString()
      };
      this.databaseService.saveCheckInResponse(dbResponse);
    });
  }

  private async getCheckInSession(sessionId: string): Promise<CheckInSession | null> {
    const dbSession = this.databaseService.getCheckInSession(sessionId);
    if (!dbSession) return null;

    const responses = this.databaseService.getCheckInResponses(sessionId);

    return {
      id: dbSession.id,
      userId: dbSession.user_id,
      timestamp: new Date(dbSession.timestamp),
      mood: dbSession.mood,
      stressLevel: dbSession.stress_level,
      emotionalState: dbSession.emotional_state,
      responses: responses.map(r => ({
        question: r.question,
        answer: r.answer,
        emotionalAnalysis: r.emotional_analysis
      })),
      completed: dbSession.completed,
      triggeredBy: dbSession.triggered_by,
      concerningPatterns: dbSession.concerning_patterns
    };
  }

  private getRecentMessageSummaries(userId: string, days: number): MessageSummary[] {
    // Get conversation summaries from the database
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    try {
      // This would use the existing conversation summaries table
      const stmt = this.databaseService['db'].prepare(`
        SELECT * FROM conversation_summaries 
        WHERE user_id = ? AND timestamp > ? 
        ORDER BY timestamp DESC
      `);
      
      const rows = stmt.all(userId, cutoffDate.toISOString());
      
      return rows.map(row => ({
        timestamp: new Date(row.timestamp),
        emotionalTone: row.emotional_tone,
        keyThemes: JSON.parse(row.key_themes || '[]'),
        userMood: row.mood_score
      }));
    } catch (error) {
      console.error('Error getting recent message summaries:', error);
      return [];
    }
  }

  private async getLastCheckInDate(userId: string): Promise<Date | null> {
    return this.databaseService.getLastCheckInDate(userId);
  }

  private async updateMoodPattern(userId: string, session: CheckInSession): Promise<void> {
    // Store mood pattern data - this could be expanded to a separate table
    // For now, we'll just log the pattern update
    const pattern = await this.getUserMoodPattern(userId, 30);
    console.log('Updated mood pattern for user:', userId, pattern);
  }
}