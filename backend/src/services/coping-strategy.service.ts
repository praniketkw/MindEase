import { CopingStrategy, EmotionalAnalysis, EmotionalState } from '../../../shared/types';
import { CopingStrategyModel } from '../models/coping-strategy.model';
import { DatabaseService } from './database.service';
import { v4 as uuidv4 } from 'uuid';

export interface StrategyRecommendation {
  strategy: CopingStrategy;
  relevanceScore: number;
  reason: string;
  personalizedInstructions?: string;
}

export interface StrategyFeedback {
  strategyId: string;
  effectiveness: number; // 1-5 scale
  notes?: string;
  timestamp: Date;
}

export class CopingStrategyService {
  private databaseService: DatabaseService;
  private defaultStrategies: CopingStrategyModel[];

  constructor(databaseService: DatabaseService) {
    this.databaseService = databaseService;
    this.defaultStrategies = this.initializeDefaultStrategies();
  }

  private initializeDefaultStrategies(): CopingStrategyModel[] {
    return [
      // Breathing strategies
      new CopingStrategyModel({
        id: 'breathing-478',
        name: '4-7-8 Breathing',
        description: 'Inhale for 4 counts, hold for 7, exhale for 8. Repeat 3-4 times to calm anxiety.',
        category: 'breathing'
      }),
      new CopingStrategyModel({
        id: 'breathing-box',
        name: 'Box Breathing',
        description: 'Inhale for 4, hold for 4, exhale for 4, hold for 4. Repeat to reduce stress.',
        category: 'breathing'
      }),
      
      // Grounding strategies
      new CopingStrategyModel({
        id: 'grounding-54321',
        name: '5-4-3-2-1 Grounding',
        description: 'Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.',
        category: 'grounding'
      }),
      new CopingStrategyModel({
        id: 'grounding-body',
        name: 'Body Scan Grounding',
        description: 'Focus on each part of your body from toes to head, noticing sensations.',
        category: 'grounding'
      }),
      
      // Cognitive strategies
      new CopingStrategyModel({
        id: 'cognitive-challenge',
        name: 'Thought Challenging',
        description: 'Question negative thoughts: Is this realistic? What evidence supports/contradicts this?',
        category: 'cognitive'
      }),
      new CopingStrategyModel({
        id: 'cognitive-reframe',
        name: 'Positive Reframing',
        description: 'Look for alternative, more balanced ways to view the situation.',
        category: 'cognitive'
      }),
      
      // Physical strategies
      new CopingStrategyModel({
        id: 'physical-pmr',
        name: 'Progressive Muscle Relaxation',
        description: 'Tense and release muscle groups starting from toes, working up to head.',
        category: 'physical'
      }),
      new CopingStrategyModel({
        id: 'physical-walk',
        name: 'Mindful Walking',
        description: 'Take a 5-10 minute walk, focusing on your steps and surroundings.',
        category: 'physical'
      }),
      
      // Social strategies
      new CopingStrategyModel({
        id: 'social-support',
        name: 'Reach Out for Support',
        description: 'Contact a trusted friend, family member, or counselor for emotional support.',
        category: 'social'
      }),
      new CopingStrategyModel({
        id: 'social-journal',
        name: 'Expressive Writing',
        description: 'Write about your feelings for 10-15 minutes without worrying about grammar.',
        category: 'social'
      })
    ];
  }

  /**
   * Get personalized coping strategy recommendations based on user's emotional state and history
   */
  async getRecommendations(
    userId: string, 
    emotionalState: EmotionalState, 
    emotionalAnalysis?: EmotionalAnalysis,
    limit: number = 3
  ): Promise<StrategyRecommendation[]> {
    // Get user's strategy history
    const userStrategies = this.getUserStrategies(userId);
    const userStrategyMap = new Map(userStrategies.map(s => [s.id, s]));

    // Score all strategies based on relevance
    const scoredStrategies = this.defaultStrategies.map(strategy => {
      const userStrategy = userStrategyMap.get(strategy.id);
      const relevanceScore = this.calculateRelevanceScore(
        strategy, 
        emotionalState, 
        emotionalAnalysis, 
        userStrategy
      );
      
      return {
        strategy: this.mergeWithUserData(strategy, userStrategy),
        relevanceScore,
        reason: this.generateRecommendationReason(strategy, emotionalState, emotionalAnalysis),
        personalizedInstructions: this.generatePersonalizedInstructions(strategy, emotionalState)
      };
    });

    // Sort by relevance and return top recommendations
    return scoredStrategies
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  /**
   * Record strategy usage and effectiveness feedback
   */
  async recordStrategyUsage(
    userId: string, 
    strategyId: string, 
    feedback?: StrategyFeedback
  ): Promise<void> {
    let userStrategy = this.getUserStrategy(userId, strategyId);
    
    if (!userStrategy) {
      // Create new user strategy from default
      const defaultStrategy = this.defaultStrategies.find(s => s.id === strategyId);
      if (!defaultStrategy) {
        throw new Error(`Strategy ${strategyId} not found`);
      }
      
      userStrategy = new CopingStrategyModel({
        ...defaultStrategy.toJSON(),
        id: uuidv4() // Generate new ID for user-specific instance
      });
    }

    // Record usage
    userStrategy.recordUsage(feedback?.effectiveness);

    // Save to database
    const dbData = {
      ...userStrategy.toDatabase(),
      user_id: userId,
      original_strategy_id: strategyId // Track which default strategy this is based on
    };
    
    this.databaseService.saveCopingStrategy(dbData);
  }

  /**
   * Get user's strategy effectiveness history
   */
  getUserStrategies(userId: string): CopingStrategyModel[] {
    const dbStrategies = this.databaseService.getCopingStrategies(userId);
    return dbStrategies.map(row => CopingStrategyModel.fromDatabase(row));
  }

  /**
   * Get specific user strategy
   */
  getUserStrategy(userId: string, strategyId: string): CopingStrategyModel | null {
    const userStrategies = this.getUserStrategies(userId);
    return userStrategies.find(s => s.id === strategyId) || null;
  }

  /**
   * Calculate relevance score for a strategy based on current emotional state
   */
  private calculateRelevanceScore(
    strategy: CopingStrategyModel,
    emotionalState: EmotionalState,
    emotionalAnalysis?: EmotionalAnalysis,
    userStrategy?: CopingStrategyModel
  ): number {
    let score = 0;

    // Base score by category relevance to emotional state
    const categoryScores = this.getCategoryRelevanceScores(emotionalState, emotionalAnalysis);
    score += categoryScores[strategy.category] || 0;

    // User effectiveness bonus
    if (userStrategy && userStrategy.effectivenessScore > 0) {
      score += userStrategy.effectivenessScore * 0.3; // 30% weight for personal effectiveness
    }

    // Recency penalty (avoid suggesting recently used strategies)
    if (userStrategy && userStrategy.isRecentlyUsed(6)) { // Within 6 hours
      score -= 0.5;
    }

    // Usage frequency bonus (strategies that work get recommended more)
    if (userStrategy && userStrategy.usageCount > 0) {
      score += Math.min(userStrategy.usageCount * 0.1, 1.0); // Cap at 1.0 bonus
    }

    // Mood-specific adjustments
    if (emotionalState.currentMood <= 2) { // Very low mood
      if (strategy.category === 'breathing' || strategy.category === 'grounding') {
        score += 0.5; // Prioritize immediate relief strategies
      }
    } else if (emotionalState.currentMood >= 4) { // Good mood
      if (strategy.category === 'cognitive' || strategy.category === 'physical') {
        score += 0.3; // Prioritize growth-oriented strategies
      }
    }

    return Math.max(0, score); // Ensure non-negative score
  }

  /**
   * Get category relevance scores based on emotional state
   */
  private getCategoryRelevanceScores(
    emotionalState: EmotionalState,
    emotionalAnalysis?: EmotionalAnalysis
  ): Record<string, number> {
    const scores: Record<string, number> = {
      breathing: 1.0, // Always relevant for immediate relief
      grounding: 0.8,
      cognitive: 0.6,
      physical: 0.5,
      social: 0.4
    };

    // Adjust based on dominant emotion
    if (emotionalAnalysis) {
      const { emotions } = emotionalAnalysis;
      
      if (emotions.fear > 0.6 || emotions.sadness > 0.6) {
        scores.breathing += 0.5;
        scores.grounding += 0.4;
      }
      
      if (emotions.anger > 0.6) {
        scores.physical += 0.4;
        scores.breathing += 0.3;
      }
      
      if (emotions.joy < 0.2 && emotions.sadness > 0.4) {
        scores.social += 0.3;
        scores.cognitive += 0.2;
      }
    }

    // Adjust based on stress level
    if (emotionalState.stressLevel > 3) {
      scores.breathing += 0.3;
      scores.grounding += 0.2;
    }

    return scores;
  }

  /**
   * Generate explanation for why a strategy is recommended
   */
  private generateRecommendationReason(
    strategy: CopingStrategyModel,
    emotionalState: EmotionalState,
    emotionalAnalysis?: EmotionalAnalysis
  ): string {
    const reasons = [];

    if (emotionalState.currentMood <= 2) {
      reasons.push("to help provide immediate emotional relief");
    }

    if (emotionalState.stressLevel > 3) {
      reasons.push("to help reduce your current stress level");
    }

    if (emotionalAnalysis) {
      const { emotions } = emotionalAnalysis;
      
      if (emotions.fear > 0.5) {
        reasons.push("to help manage feelings of anxiety or fear");
      }
      
      if (emotions.sadness > 0.5) {
        reasons.push("to provide comfort during difficult emotions");
      }
      
      if (emotions.anger > 0.5) {
        reasons.push("to help process and release feelings of frustration");
      }
    }

    if (strategy.category === 'breathing') {
      reasons.push("as breathing exercises are effective for quick emotional regulation");
    }

    return reasons.length > 0 
      ? `Recommended ${reasons.join(" and ")}.`
      : "This strategy may be helpful for your current emotional state.";
  }

  /**
   * Generate personalized instructions based on user's current state
   */
  private generatePersonalizedInstructions(
    strategy: CopingStrategyModel,
    emotionalState: EmotionalState
  ): string | undefined {
    if (strategy.category === 'breathing' && emotionalState.stressLevel > 3) {
      return "Since you're feeling stressed, try to focus extra attention on making your exhales longer than your inhales.";
    }

    if (strategy.category === 'grounding' && emotionalState.currentMood <= 2) {
      return "Take your time with each step - there's no rush. Focus on really noticing the details of what you observe.";
    }

    if (strategy.category === 'cognitive' && emotionalState.riskLevel !== 'low') {
      return "Be gentle with yourself during this exercise. If thoughts feel overwhelming, try the breathing exercise first.";
    }

    return undefined;
  }

  /**
   * Merge default strategy with user-specific data
   */
  private mergeWithUserData(
    defaultStrategy: CopingStrategyModel,
    userStrategy?: CopingStrategyModel
  ): CopingStrategy {
    const base = defaultStrategy.toJSON();
    
    if (userStrategy) {
      return {
        ...base,
        effectivenessScore: userStrategy.effectivenessScore,
        usageCount: userStrategy.usageCount,
        lastUsed: userStrategy.lastUsed
      };
    }
    
    return base;
  }

  /**
   * Get strategies by category
   */
  getStrategiesByCategory(category: CopingStrategy['category']): CopingStrategy[] {
    return this.defaultStrategies
      .filter(s => s.category === category)
      .map(s => s.toJSON());
  }

  /**
   * Get most effective strategies for a user
   */
  getMostEffectiveStrategies(userId: string, limit: number = 5): CopingStrategy[] {
    const userStrategies = this.getUserStrategies(userId);
    
    return userStrategies
      .filter(s => s.usageCount > 0) // Only strategies that have been used
      .sort((a, b) => b.effectivenessScore - a.effectivenessScore)
      .slice(0, limit)
      .map(s => s.toJSON());
  }
}