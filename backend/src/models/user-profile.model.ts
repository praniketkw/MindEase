import { UserProfile, UserPreferences, EmotionalBaseline, CopingStrategy } from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export class UserProfileModel {
  private data: UserProfile;

  constructor(data?: Partial<UserProfile>) {
    this.data = {
      id: data?.id || uuidv4(),
      createdAt: data?.createdAt || new Date(),
      preferences: data?.preferences || this.getDefaultPreferences(),
      emotionalBaseline: data?.emotionalBaseline || this.getDefaultEmotionalBaseline(),
      encryptionKey: data?.encryptionKey || this.generateEncryptionKey()
    };
  }

  // Getters
  get id(): string {
    return this.data.id;
  }

  get createdAt(): Date {
    return this.data.createdAt;
  }

  get preferences(): UserPreferences {
    return this.data.preferences;
  }

  get emotionalBaseline(): EmotionalBaseline {
    return this.data.emotionalBaseline;
  }

  get encryptionKey(): string {
    return this.data.encryptionKey;
  }

  // Update methods
  updatePreferences(preferences: Partial<UserPreferences>): void {
    this.data.preferences = {
      ...this.data.preferences,
      ...preferences
    };
  }

  updateEmotionalBaseline(baseline: Partial<EmotionalBaseline>): void {
    this.data.emotionalBaseline = {
      ...this.data.emotionalBaseline,
      ...baseline
    };
  }

  addCopingStrategy(strategy: string): void {
    if (!this.data.emotionalBaseline.preferredCopingStrategies.includes(strategy)) {
      this.data.emotionalBaseline.preferredCopingStrategies.push(strategy);
    }
  }

  updateAverageMood(newMood: number): void {
    // Simple moving average calculation
    const currentAverage = this.data.emotionalBaseline.averageMood;
    this.data.emotionalBaseline.averageMood = (currentAverage + newMood) / 2;
  }

  addTheme(theme: string): void {
    if (!this.data.emotionalBaseline.commonThemes.includes(theme)) {
      this.data.emotionalBaseline.commonThemes.push(theme);
    }
  }

  // Serialization methods
  toJSON(): UserProfile {
    return { ...this.data };
  }

  toDatabase(): any {
    return {
      id: this.data.id,
      created_at: this.data.createdAt.toISOString(),
      preferences: JSON.stringify(this.data.preferences),
      emotional_baseline: JSON.stringify(this.data.emotionalBaseline),
      encryption_key: this.data.encryptionKey,
      last_interaction: new Date().toISOString()
    };
  }

  static fromDatabase(row: any): UserProfileModel {
    return new UserProfileModel({
      id: row.id,
      createdAt: new Date(row.created_at),
      preferences: JSON.parse(row.preferences),
      emotionalBaseline: JSON.parse(row.emotional_baseline),
      encryptionKey: row.encryption_key
    });
  }

  // Private helper methods
  private getDefaultPreferences(): UserPreferences {
    return {
      voiceEnabled: true,
      language: 'en',
      checkInFrequency: 'weekly',
      communicationStyle: 'casual'
    };
  }

  private getDefaultEmotionalBaseline(): EmotionalBaseline {
    return {
      averageMood: 3, // neutral on 1-5 scale
      commonThemes: [],
      preferredCopingStrategies: [],
      riskFactors: []
    };
  }

  private generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}