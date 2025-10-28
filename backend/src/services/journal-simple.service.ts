// Simplified journal service for task 5.3
// This provides basic journal functionality without complex database integrations

export interface JournalEntry {
  id: string;
  userId: string;
  content: string;
  contentType: 'text' | 'voice';
  timestamp: Date;
  emotionalAnalysis: {
    sentiment: {
      positive: number;
      neutral: number;
      negative: number;
    };
    emotions: {
      joy: number;
      sadness: number;
      anger: number;
      fear: number;
      surprise: number;
      disgust: number;
    };
    keyPhrases: string[];
  };
  themes: string[];
  mood: number; // 1-5 scale
}

export interface JournalSummary {
  totalEntries: number;
  averageMood: number;
  commonThemes: string[];
  emotionalTrends: {
    positive: number;
    negative: number;
    neutral: number;
  };
  recentEntries: JournalEntry[];
}

export class JournalService {
  private entries: Map<string, JournalEntry[]> = new Map();

  async createEntry(
    userId: string,
    content: string,
    contentType: 'text' | 'voice' = 'text'
  ): Promise<JournalEntry> {
    try {
      // Get user's entries or create new array
      let userEntries = this.entries.get(userId) || [];

      // Analyze emotional content
      const emotionalAnalysis = this.analyzeEmotion(content);
      
      // Extract themes
      const themes = this.extractThemes(content);
      
      // Calculate mood score (1-5 scale based on sentiment)
      const mood = this.calculateMoodScore(emotionalAnalysis);

      // Create new entry
      const entry: JournalEntry = {
        id: this.generateId(),
        userId,
        content,
        contentType,
        timestamp: new Date(),
        emotionalAnalysis,
        themes,
        mood
      };

      // Add to user's entries
      userEntries.push(entry);
      
      // Keep only last 100 entries per user to prevent memory issues
      if (userEntries.length > 100) {
        userEntries = userEntries.slice(-100);
      }
      
      this.entries.set(userId, userEntries);

      return entry;

    } catch (error) {
      console.error('Error creating journal entry:', error);
      throw new Error('Failed to create journal entry');
    }
  }

  async getEntries(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<JournalEntry[]> {
    try {
      const userEntries = this.entries.get(userId) || [];
      
      // Sort by timestamp (newest first)
      const sortedEntries = userEntries.sort((a, b) => 
        b.timestamp.getTime() - a.timestamp.getTime()
      );

      // Apply pagination
      return sortedEntries.slice(offset, offset + limit);

    } catch (error) {
      console.error('Error getting journal entries:', error);
      throw new Error('Failed to retrieve journal entries');
    }
  }

  async getEntry(userId: string, entryId: string): Promise<JournalEntry | null> {
    try {
      const userEntries = this.entries.get(userId) || [];
      return userEntries.find(entry => entry.id === entryId) || null;

    } catch (error) {
      console.error('Error getting journal entry:', error);
      throw new Error('Failed to retrieve journal entry');
    }
  }

  async deleteEntry(userId: string, entryId: string): Promise<boolean> {
    try {
      const userEntries = this.entries.get(userId) || [];
      const entryIndex = userEntries.findIndex(entry => entry.id === entryId);
      
      if (entryIndex === -1) {
        return false;
      }

      userEntries.splice(entryIndex, 1);
      this.entries.set(userId, userEntries);
      
      return true;

    } catch (error) {
      console.error('Error deleting journal entry:', error);
      throw new Error('Failed to delete journal entry');
    }
  }

  async getJournalSummary(userId: string, days: number = 30): Promise<JournalSummary> {
    try {
      const userEntries = this.entries.get(userId) || [];
      
      // Filter entries from the last N days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const recentEntries = userEntries.filter(entry => 
        entry.timestamp >= cutoffDate
      );

      if (recentEntries.length === 0) {
        return {
          totalEntries: 0,
          averageMood: 0,
          commonThemes: [],
          emotionalTrends: { positive: 0, negative: 0, neutral: 1 },
          recentEntries: []
        };
      }

      // Calculate average mood
      const averageMood = recentEntries.reduce((sum, entry) => sum + entry.mood, 0) / recentEntries.length;

      // Calculate emotional trends
      const emotionalTrends = recentEntries.reduce(
        (acc, entry) => ({
          positive: acc.positive + entry.emotionalAnalysis.sentiment.positive,
          negative: acc.negative + entry.emotionalAnalysis.sentiment.negative,
          neutral: acc.neutral + entry.emotionalAnalysis.sentiment.neutral
        }),
        { positive: 0, negative: 0, neutral: 0 }
      );

      // Normalize emotional trends
      const totalEmotions = emotionalTrends.positive + emotionalTrends.negative + emotionalTrends.neutral;
      if (totalEmotions > 0) {
        emotionalTrends.positive /= totalEmotions;
        emotionalTrends.negative /= totalEmotions;
        emotionalTrends.neutral /= totalEmotions;
      }

      // Get common themes
      const themeCount: { [key: string]: number } = {};
      recentEntries.forEach(entry => {
        entry.themes.forEach(theme => {
          themeCount[theme] = (themeCount[theme] || 0) + 1;
        });
      });

      const commonThemes = Object.entries(themeCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([theme]) => theme);

      return {
        totalEntries: recentEntries.length,
        averageMood: Math.round(averageMood * 10) / 10,
        commonThemes,
        emotionalTrends,
        recentEntries: recentEntries.slice(0, 5) // Last 5 entries
      };

    } catch (error) {
      console.error('Error getting journal summary:', error);
      throw new Error('Failed to generate journal summary');
    }
  }

  private analyzeEmotion(content: string): JournalEntry['emotionalAnalysis'] {
    const lowerContent = content.toLowerCase();
    
    // Simple emotion detection based on keywords
    let joy = 0, sadness = 0, anger = 0, fear = 0, surprise = 0, disgust = 0;
    let positive = 0, neutral = 0.5, negative = 0;

    // Joy indicators
    if (lowerContent.match(/happy|joy|excited|great|wonderful|amazing|love|good|grateful|blessed|proud/)) {
      joy = 0.8;
      positive = 0.7;
      negative = 0.1;
      neutral = 0.2;
    }

    // Sadness indicators
    if (lowerContent.match(/sad|depressed|down|upset|cry|hurt|pain|lonely|empty|hopeless/)) {
      sadness = 0.8;
      negative = 0.7;
      positive = 0.1;
      neutral = 0.2;
    }

    // Anger indicators
    if (lowerContent.match(/angry|mad|furious|hate|annoyed|frustrated|irritated|rage/)) {
      anger = 0.7;
      negative = 0.6;
      positive = 0.1;
      neutral = 0.3;
    }

    // Fear/anxiety indicators
    if (lowerContent.match(/scared|afraid|anxious|worried|nervous|panic|terrified|overwhelmed/)) {
      fear = 0.7;
      negative = 0.6;
      positive = 0.1;
      neutral = 0.3;
    }

    // Surprise indicators
    if (lowerContent.match(/surprised|shocked|amazed|unexpected|sudden/)) {
      surprise = 0.6;
    }

    // Extract key phrases (simple sentence extraction)
    const keyPhrases = content
      .split(/[.!?]+/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 10 && sentence.length < 100)
      .slice(0, 3);

    return {
      sentiment: { positive, neutral, negative },
      emotions: { joy, sadness, anger, fear, surprise, disgust },
      keyPhrases
    };
  }

  private extractThemes(content: string): string[] {
    const lowerContent = content.toLowerCase();
    const themes: string[] = [];

    // Theme detection based on keywords
    const themeKeywords = {
      'work': ['work', 'job', 'career', 'boss', 'colleague', 'office', 'meeting', 'deadline'],
      'relationships': ['friend', 'family', 'partner', 'relationship', 'love', 'breakup', 'marriage'],
      'health': ['health', 'sick', 'doctor', 'medicine', 'exercise', 'diet', 'sleep'],
      'education': ['school', 'study', 'exam', 'university', 'college', 'homework', 'grade'],
      'finance': ['money', 'budget', 'debt', 'salary', 'expensive', 'financial', 'bills'],
      'personal growth': ['goal', 'dream', 'future', 'growth', 'learn', 'improve', 'change'],
      'stress': ['stress', 'pressure', 'overwhelmed', 'busy', 'tired', 'exhausted'],
      'social': ['social', 'party', 'event', 'gathering', 'community', 'group']
    };

    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        themes.push(theme);
      }
    }

    return themes.length > 0 ? themes : ['general'];
  }

  private calculateMoodScore(emotionalAnalysis: JournalEntry['emotionalAnalysis']): number {
    const { sentiment } = emotionalAnalysis;
    
    // Convert sentiment to 1-5 scale
    // Very negative = 1, Negative = 2, Neutral = 3, Positive = 4, Very positive = 5
    if (sentiment.negative > 0.7) return 1;
    if (sentiment.negative > 0.5) return 2;
    if (sentiment.neutral > 0.6) return 3;
    if (sentiment.positive > 0.5) return 4;
    if (sentiment.positive > 0.7) return 5;
    
    return 3; // Default neutral
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Clean up old entries to prevent memory leaks
  cleanupOldEntries() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    for (const [userId, entries] of this.entries.entries()) {
      const recentEntries = entries.filter(entry => entry.timestamp >= sixMonthsAgo);
      this.entries.set(userId, recentEntries);
    }
  }
}

// Singleton instance
export const journalService = new JournalService();

// Clean up old entries every day
setInterval(() => {
  journalService.cleanupOldEntries();
}, 24 * 60 * 60 * 1000);