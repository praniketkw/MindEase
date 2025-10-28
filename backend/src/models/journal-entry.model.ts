import { JournalEntry, EmotionalAnalysis } from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export class JournalEntryModel {
  private data: JournalEntry;

  constructor(data?: Partial<JournalEntry>) {
    this.data = {
      id: data?.id || uuidv4(),
      userId: data?.userId || '',
      content: data?.content || '',
      contentType: data?.contentType || 'text',
      timestamp: data?.timestamp || new Date(),
      emotionalAnalysis: data?.emotionalAnalysis || this.getDefaultEmotionalAnalysis(),
      themes: data?.themes || [],
      mood: data?.mood || 3, // neutral mood
      copingStrategiesUsed: data?.copingStrategiesUsed || []
    };
  }

  // Getters
  get id(): string {
    return this.data.id;
  }

  get userId(): string {
    return this.data.userId;
  }

  get content(): string {
    return this.data.content;
  }

  get contentType(): 'text' | 'voice' {
    return this.data.contentType;
  }

  get timestamp(): Date {
    return this.data.timestamp;
  }

  get emotionalAnalysis(): EmotionalAnalysis {
    return this.data.emotionalAnalysis;
  }

  get themes(): string[] {
    return this.data.themes;
  }

  get mood(): number {
    return this.data.mood;
  }

  get copingStrategiesUsed(): string[] {
    return this.data.copingStrategiesUsed;
  }

  // Setters
  setUserId(userId: string): void {
    this.data.userId = userId;
  }

  setContent(content: string): void {
    this.data.content = content;
  }

  setContentType(type: 'text' | 'voice'): void {
    this.data.contentType = type;
  }

  setEmotionalAnalysis(analysis: EmotionalAnalysis): void {
    this.data.emotionalAnalysis = analysis;
    
    // Update mood based on emotional analysis
    this.updateMoodFromAnalysis(analysis);
    
    // Extract themes from key phrases
    this.updateThemesFromAnalysis(analysis);
  }

  setMood(mood: number): void {
    // Ensure mood is within valid range (1-5)
    this.data.mood = Math.max(1, Math.min(5, mood));
  }

  addTheme(theme: string): void {
    if (!this.data.themes.includes(theme)) {
      this.data.themes.push(theme);
    }
  }

  removeTheme(theme: string): void {
    this.data.themes = this.data.themes.filter(t => t !== theme);
  }

  addCopingStrategy(strategy: string): void {
    if (!this.data.copingStrategiesUsed.includes(strategy)) {
      this.data.copingStrategiesUsed.push(strategy);
    }
  }

  removeCopingStrategy(strategy: string): void {
    this.data.copingStrategiesUsed = this.data.copingStrategiesUsed.filter(s => s !== strategy);
  }

  // Analysis methods
  getDominantEmotion(): string {
    const emotions = this.data.emotionalAnalysis.emotions;
    let maxEmotion = 'neutral';
    let maxValue = 0;

    Object.entries(emotions).forEach(([emotion, value]) => {
      if (value > maxValue) {
        maxValue = value;
        maxEmotion = emotion;
      }
    });

    return maxEmotion;
  }

  getSentimentScore(): number {
    const sentiment = this.data.emotionalAnalysis.sentiment;
    return sentiment.positive - sentiment.negative;
  }

  getStressLevel(): number {
    const stressIndicators = this.data.emotionalAnalysis.stressIndicators.length;
    const negativeEmotions = this.data.emotionalAnalysis.emotions.anger + 
                           this.data.emotionalAnalysis.emotions.fear + 
                           this.data.emotionalAnalysis.emotions.sadness;
    
    // Calculate stress level on a scale of 0-10
    return Math.min(10, Math.round((stressIndicators * 2) + (negativeEmotions * 5)));
  }

  hasPositiveIndicators(): boolean {
    const sentiment = this.data.emotionalAnalysis.sentiment;
    const copingMechanisms = this.data.emotionalAnalysis.copingMechanisms.length;
    
    return sentiment.positive > 0.6 || copingMechanisms > 0;
  }

  hasCrisisIndicators(): boolean {
    const stressIndicators = this.data.emotionalAnalysis.stressIndicators;
    const crisisKeywords = ['suicide', 'kill myself', 'end it all', 'hurt myself', 'no point'];
    
    return stressIndicators.some(indicator => 
      crisisKeywords.some(keyword => 
        indicator.toLowerCase().includes(keyword)
      )
    );
  }

  // Serialization methods
  toJSON(): JournalEntry {
    return { ...this.data };
  }

  toDatabase(): any {
    return {
      id: this.data.id,
      user_id: this.data.userId,
      content: this.data.content, // Will be encrypted by DatabaseService
      content_type: this.data.contentType,
      timestamp: this.data.timestamp.toISOString(),
      emotional_analysis: JSON.stringify(this.data.emotionalAnalysis),
      themes: JSON.stringify(this.data.themes),
      mood_score: this.data.mood,
      created_at: new Date().toISOString()
    };
  }

  static fromDatabase(row: any): JournalEntryModel {
    return new JournalEntryModel({
      id: row.id,
      userId: row.user_id,
      content: row.content, // Will be decrypted by DatabaseService
      contentType: row.content_type,
      timestamp: new Date(row.timestamp),
      emotionalAnalysis: row.emotional_analysis ? JSON.parse(row.emotional_analysis) : undefined,
      themes: row.themes ? JSON.parse(row.themes) : [],
      mood: row.mood_score,
      copingStrategiesUsed: [] // Will be populated separately if needed
    });
  }

  // Summary methods for insights
  generateSummary(): {
    wordCount: number;
    dominantEmotion: string;
    sentimentScore: number;
    stressLevel: number;
    themes: string[];
    hasPositiveContent: boolean;
    hasConcerns: boolean;
  } {
    return {
      wordCount: this.data.content.split(/\s+/).length,
      dominantEmotion: this.getDominantEmotion(),
      sentimentScore: this.getSentimentScore(),
      stressLevel: this.getStressLevel(),
      themes: this.data.themes,
      hasPositiveContent: this.hasPositiveIndicators(),
      hasConcerns: this.getStressLevel() > 6 || this.hasCrisisIndicators()
    };
  }

  // Private helper methods
  private getDefaultEmotionalAnalysis(): EmotionalAnalysis {
    return {
      sentiment: {
        positive: 0.33,
        neutral: 0.34,
        negative: 0.33
      },
      emotions: {
        joy: 0,
        sadness: 0,
        anger: 0,
        fear: 0,
        surprise: 0,
        disgust: 0
      },
      keyPhrases: [],
      stressIndicators: [],
      copingMechanisms: []
    };
  }

  private updateMoodFromAnalysis(analysis: EmotionalAnalysis): void {
    const sentiment = analysis.sentiment;
    
    // Calculate mood based on sentiment (1-5 scale)
    if (sentiment.positive > 0.6) {
      this.data.mood = 4 + Math.round(sentiment.positive);
    } else if (sentiment.negative > 0.6) {
      this.data.mood = Math.max(1, 3 - Math.round(sentiment.negative * 2));
    } else {
      this.data.mood = 3; // neutral
    }
  }

  private updateThemesFromAnalysis(analysis: EmotionalAnalysis): void {
    // Extract themes from key phrases
    const themeKeywords = {
      'work': ['work', 'job', 'career', 'boss', 'colleague', 'office'],
      'relationships': ['friend', 'family', 'partner', 'relationship', 'love', 'breakup'],
      'health': ['health', 'sick', 'tired', 'sleep', 'energy', 'pain'],
      'academic': ['school', 'study', 'exam', 'grade', 'university', 'homework'],
      'financial': ['money', 'financial', 'debt', 'expensive', 'budget', 'cost'],
      'social': ['social', 'party', 'friends', 'lonely', 'isolated', 'community'],
      'personal': ['myself', 'identity', 'confidence', 'self-esteem', 'personal']
    };

    const content = this.data.content.toLowerCase();
    const keyPhrases = analysis.keyPhrases.map(phrase => phrase.toLowerCase());

    Object.entries(themeKeywords).forEach(([theme, keywords]) => {
      const hasTheme = keywords.some(keyword => 
        content.includes(keyword) || 
        keyPhrases.some(phrase => phrase.includes(keyword))
      );
      
      if (hasTheme) {
        this.addTheme(theme);
      }
    });
  }
}