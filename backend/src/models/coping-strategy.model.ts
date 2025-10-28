import { CopingStrategy } from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export class CopingStrategyModel {
  private data: CopingStrategy;

  constructor(data?: Partial<CopingStrategy>) {
    this.data = {
      id: data?.id || uuidv4(),
      name: data?.name || '',
      description: data?.description || '',
      category: data?.category || 'cognitive',
      effectivenessScore: data?.effectivenessScore || 0,
      usageCount: data?.usageCount || 0,
      lastUsed: data?.lastUsed
    };
  }

  // Getters
  get id(): string {
    return this.data.id;
  }

  get name(): string {
    return this.data.name;
  }

  get description(): string {
    return this.data.description;
  }

  get category(): CopingStrategy['category'] {
    return this.data.category;
  }

  get effectivenessScore(): number {
    return this.data.effectivenessScore;
  }

  get usageCount(): number {
    return this.data.usageCount;
  }

  get lastUsed(): Date | undefined {
    return this.data.lastUsed;
  }

  // Update methods
  updateEffectiveness(rating: number): void {
    // Rating should be 1-5, update effectiveness with weighted average
    const currentScore = this.data.effectivenessScore;
    const currentCount = this.data.usageCount;
    
    if (currentCount === 0) {
      this.data.effectivenessScore = rating;
    } else {
      // Weighted average giving more weight to recent ratings
      this.data.effectivenessScore = (currentScore * currentCount + rating * 2) / (currentCount + 2);
    }
  }

  recordUsage(effectiveness?: number): void {
    this.data.usageCount += 1;
    this.data.lastUsed = new Date();
    
    if (effectiveness !== undefined) {
      this.updateEffectiveness(effectiveness);
    }
  }

  isRecentlyUsed(hours: number = 24): boolean {
    if (!this.data.lastUsed) return false;
    
    const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.data.lastUsed > hoursAgo;
  }

  getEffectivenessRating(): 'low' | 'medium' | 'high' {
    if (this.data.effectivenessScore >= 4) return 'high';
    if (this.data.effectivenessScore >= 2.5) return 'medium';
    return 'low';
  }

  // Serialization methods
  toJSON(): CopingStrategy {
    return { ...this.data };
  }

  toDatabase(): any {
    return {
      id: this.data.id,
      user_id: '', // Will be set by the service layer
      strategy_name: this.data.name,
      effectiveness_score: this.data.effectivenessScore,
      usage_count: this.data.usageCount,
      last_used: this.data.lastUsed?.toISOString() || null,
      created_at: new Date().toISOString()
    };
  }

  static fromDatabase(row: any): CopingStrategyModel {
    return new CopingStrategyModel({
      id: row.id,
      name: row.strategy_name,
      description: '', // Will be populated from strategy definitions
      category: 'cognitive', // Will be determined from strategy definitions
      effectivenessScore: row.effectiveness_score,
      usageCount: row.usage_count,
      lastUsed: row.last_used ? new Date(row.last_used) : undefined
    });
  }

  // Static factory methods for common strategies
  static createBreathingStrategy(): CopingStrategyModel {
    return new CopingStrategyModel({
      name: '4-7-8 Breathing',
      description: 'Inhale for 4 counts, hold for 7, exhale for 8. Repeat 3-4 times.',
      category: 'breathing'
    });
  }

  static createGroundingStrategy(): CopingStrategyModel {
    return new CopingStrategyModel({
      name: '5-4-3-2-1 Grounding',
      description: 'Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.',
      category: 'grounding'
    });
  }

  static createCognitiveStrategy(): CopingStrategyModel {
    return new CopingStrategyModel({
      name: 'Thought Challenging',
      description: 'Question negative thoughts: Is this realistic? What would I tell a friend?',
      category: 'cognitive'
    });
  }

  static createPhysicalStrategy(): CopingStrategyModel {
    return new CopingStrategyModel({
      name: 'Progressive Muscle Relaxation',
      description: 'Tense and release muscle groups starting from toes to head.',
      category: 'physical'
    });
  }

  static createSocialStrategy(): CopingStrategyModel {
    return new CopingStrategyModel({
      name: 'Reach Out to Support',
      description: 'Contact a trusted friend, family member, or counselor for support.',
      category: 'social'
    });
  }
}