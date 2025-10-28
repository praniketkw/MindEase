import { JournalEntryModel } from '../models/journal-entry.model';
import { DatabaseService } from './database.service';
import { EmotionalAnalysis, JournalEntry } from '../../../shared/types';

export interface JournalInsights {
  totalEntries: number;
  averageMood: number;
  moodTrend: 'improving' | 'declining' | 'stable';
  commonThemes: { theme: string; count: number }[];
  emotionalPatterns: {
    dominantEmotions: { emotion: string; frequency: number }[];
    stressLevels: number[];
    positiveEntries: number;
    concerningEntries: number;
  };
  weeklyStats: {
    week: string;
    entryCount: number;
    averageMood: number;
    themes: string[];
  }[];
  recommendations: string[];
}

export interface JournalFilters {
  startDate?: Date;
  endDate?: Date;
  themes?: string[];
  moodRange?: { min: number; max: number };
  contentType?: 'text' | 'voice';
  limit?: number;
}

export class JournalService {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  // Create journal entry
  async createEntry(
    userId: string,
    content: string,
    contentType: 'text' | 'voice' = 'text',
    emotionalAnalysis?: EmotionalAnalysis
  ): Promise<JournalEntryModel> {
    const entry = new JournalEntryModel({
      userId,
      content,
      contentType,
      timestamp: new Date()
    });

    if (emotionalAnalysis) {
      entry.setEmotionalAnalysis(emotionalAnalysis);
    }

    // Save to database
    this.db.saveJournalEntry(entry.toDatabase());

    return entry;
  }

  // Get journal entries with filters
  async getEntries(userId: string, filters?: JournalFilters): Promise<JournalEntryModel[]> {
    let entries = this.db.getJournalEntries(userId, filters?.limit);

    // Apply filters
    if (filters) {
      entries = this.applyFilters(entries, filters);
    }

    return entries.map(row => JournalEntryModel.fromDatabase(row));
  }

  // Get single journal entry
  async getEntry(entryId: string): Promise<JournalEntryModel | null> {
    const row = this.db.getJournalEntry(entryId);
    if (!row) return null;

    return JournalEntryModel.fromDatabase(row);
  }

  // Update journal entry
  async updateEntry(
    entryId: string,
    updates: {
      content?: string;
      mood?: number;
      themes?: string[];
      copingStrategies?: string[];
    }
  ): Promise<JournalEntryModel | null> {
    const entry = await this.getEntry(entryId);
    if (!entry) return null;

    if (updates.content) entry.setContent(updates.content);
    if (updates.mood) entry.setMood(updates.mood);
    if (updates.themes) {
      // Replace themes
      updates.themes.forEach(theme => entry.addTheme(theme));
    }
    if (updates.copingStrategies) {
      // Replace coping strategies
      updates.copingStrategies.forEach(strategy => entry.addCopingStrategy(strategy));
    }

    // Save updated entry
    this.db.saveJournalEntry(entry.toDatabase());

    return entry;
  }

  // Delete journal entry
  async deleteEntry(entryId: string): Promise<boolean> {
    try {
      // Note: This would require adding a delete method to DatabaseService
      // For now, we'll mark it as a placeholder
      console.log(`Delete entry ${entryId} - not implemented yet`);
      return true;
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      return false;
    }
  }

  // Generate insights from journal entries
  async generateInsights(userId: string, days: number = 30): Promise<JournalInsights> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const entries = await this.getEntries(userId, {
      startDate,
      endDate: new Date()
    });

    if (entries.length === 0) {
      return this.getEmptyInsights();
    }

    const insights: JournalInsights = {
      totalEntries: entries.length,
      averageMood: this.calculateAverageMood(entries),
      moodTrend: this.calculateMoodTrend(entries),
      commonThemes: this.calculateCommonThemes(entries),
      emotionalPatterns: this.calculateEmotionalPatterns(entries),
      weeklyStats: this.calculateWeeklyStats(entries),
      recommendations: this.generateRecommendations(entries)
    };

    return insights;
  }

  // Get mood tracking data
  async getMoodTracking(userId: string, days: number = 30): Promise<{
    date: string;
    mood: number;
    dominantEmotion: string;
  }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const entries = await this.getEntries(userId, {
      startDate,
      endDate: new Date()
    });

    return entries.map(entry => ({
      date: entry.timestamp.toISOString().split('T')[0],
      mood: entry.mood,
      dominantEmotion: entry.getDominantEmotion()
    }));
  }

  // Search journal entries
  async searchEntries(userId: string, query: string): Promise<JournalEntryModel[]> {
    const entries = await this.getEntries(userId);
    
    const searchTerms = query.toLowerCase().split(' ');
    
    return entries.filter(entry => {
      const content = entry.content.toLowerCase();
      const themes = entry.themes.map(t => t.toLowerCase());
      
      return searchTerms.some(term => 
        content.includes(term) || 
        themes.some(theme => theme.includes(term))
      );
    });
  }

  // Export journal data
  async exportJournal(userId: string, format: 'json' | 'csv' = 'json'): Promise<string> {
    const entries = await this.getEntries(userId);
    
    if (format === 'json') {
      return JSON.stringify(entries.map(entry => entry.toJSON()), null, 2);
    } else {
      // CSV format
      const headers = ['Date', 'Content Type', 'Mood', 'Themes', 'Dominant Emotion'];
      const rows = entries.map(entry => [
        entry.timestamp.toISOString(),
        entry.contentType,
        entry.mood.toString(),
        entry.themes.join('; '),
        entry.getDominantEmotion()
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }

  // Private helper methods
  private applyFilters(entries: any[], filters: JournalFilters): any[] {
    let filtered = entries;

    if (filters.startDate) {
      filtered = filtered.filter(entry => new Date(entry.timestamp) >= filters.startDate!);
    }

    if (filters.endDate) {
      filtered = filtered.filter(entry => new Date(entry.timestamp) <= filters.endDate!);
    }

    if (filters.themes && filters.themes.length > 0) {
      filtered = filtered.filter(entry => {
        const entryThemes = JSON.parse(entry.themes || '[]');
        return filters.themes!.some(theme => entryThemes.includes(theme));
      });
    }

    if (filters.moodRange) {
      filtered = filtered.filter(entry => 
        entry.mood_score >= filters.moodRange!.min && 
        entry.mood_score <= filters.moodRange!.max
      );
    }

    if (filters.contentType) {
      filtered = filtered.filter(entry => entry.content_type === filters.contentType);
    }

    return filtered;
  }

  private calculateAverageMood(entries: JournalEntryModel[]): number {
    if (entries.length === 0) return 3;
    
    const sum = entries.reduce((acc, entry) => acc + entry.mood, 0);
    return Math.round((sum / entries.length) * 10) / 10;
  }

  private calculateMoodTrend(entries: JournalEntryModel[]): 'improving' | 'declining' | 'stable' {
    if (entries.length < 3) return 'stable';

    const sortedEntries = entries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const firstHalf = sortedEntries.slice(0, Math.floor(sortedEntries.length / 2));
    const secondHalf = sortedEntries.slice(Math.floor(sortedEntries.length / 2));

    const firstHalfAvg = this.calculateAverageMood(firstHalf);
    const secondHalfAvg = this.calculateAverageMood(secondHalf);

    const difference = secondHalfAvg - firstHalfAvg;

    if (difference > 0.3) return 'improving';
    if (difference < -0.3) return 'declining';
    return 'stable';
  }

  private calculateCommonThemes(entries: JournalEntryModel[]): { theme: string; count: number }[] {
    const themeCount: { [key: string]: number } = {};

    entries.forEach(entry => {
      entry.themes.forEach(theme => {
        themeCount[theme] = (themeCount[theme] || 0) + 1;
      });
    });

    return Object.entries(themeCount)
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private calculateEmotionalPatterns(entries: JournalEntryModel[]): JournalInsights['emotionalPatterns'] {
    const emotionCount: { [key: string]: number } = {};
    const stressLevels: number[] = [];
    let positiveEntries = 0;
    let concerningEntries = 0;

    entries.forEach(entry => {
      const dominantEmotion = entry.getDominantEmotion();
      emotionCount[dominantEmotion] = (emotionCount[dominantEmotion] || 0) + 1;
      
      stressLevels.push(entry.getStressLevel());
      
      if (entry.hasPositiveIndicators()) positiveEntries++;
      if (entry.hasCrisisIndicators() || entry.getStressLevel() > 7) concerningEntries++;
    });

    const dominantEmotions = Object.entries(emotionCount)
      .map(([emotion, frequency]) => ({ emotion, frequency }))
      .sort((a, b) => b.frequency - a.frequency);

    return {
      dominantEmotions,
      stressLevels,
      positiveEntries,
      concerningEntries
    };
  }

  private calculateWeeklyStats(entries: JournalEntryModel[]): JournalInsights['weeklyStats'] {
    const weeklyData: { [key: string]: {
      entries: JournalEntryModel[];
      themes: Set<string>;
    }} = {};

    entries.forEach(entry => {
      const weekStart = this.getWeekStart(entry.timestamp);
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { entries: [], themes: new Set() };
      }

      weeklyData[weekKey].entries.push(entry);
      entry.themes.forEach(theme => weeklyData[weekKey].themes.add(theme));
    });

    return Object.entries(weeklyData)
      .map(([week, data]) => ({
        week,
        entryCount: data.entries.length,
        averageMood: this.calculateAverageMood(data.entries),
        themes: Array.from(data.themes)
      }))
      .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());
  }

  private generateRecommendations(entries: JournalEntryModel[]): string[] {
    const recommendations: string[] = [];
    const insights = this.calculateEmotionalPatterns(entries);
    const averageMood = this.calculateAverageMood(entries);

    if (averageMood < 2.5) {
      recommendations.push('Consider reaching out to a mental health professional for additional support.');
    }

    if (insights.concerningEntries > entries.length * 0.3) {
      recommendations.push('Your recent entries show some concerning patterns. Please consider talking to someone you trust.');
    }

    if (insights.stressLevels.some(level => level > 8)) {
      recommendations.push('Try incorporating stress-reduction techniques like deep breathing or meditation.');
    }

    if (insights.positiveEntries < entries.length * 0.2) {
      recommendations.push('Consider writing about positive experiences or things you\'re grateful for.');
    }

    if (entries.length < 7 && entries.length > 0) {
      recommendations.push('Regular journaling can help track your emotional patterns. Try to write a few times per week.');
    }

    return recommendations;
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  private getEmptyInsights(): JournalInsights {
    return {
      totalEntries: 0,
      averageMood: 3,
      moodTrend: 'stable',
      commonThemes: [],
      emotionalPatterns: {
        dominantEmotions: [],
        stressLevels: [],
        positiveEntries: 0,
        concerningEntries: 0
      },
      weeklyStats: [],
      recommendations: ['Start journaling to track your emotional patterns and gain insights into your mental health.']
    };
  }
}