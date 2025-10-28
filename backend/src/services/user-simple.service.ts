// Simplified user service for task 5.4
// This provides basic user profile and settings functionality

export interface UserPreferences {
  voiceEnabled: boolean;
  language: string;
  checkInFrequency: 'daily' | 'weekly' | 'custom' | 'never';
  communicationStyle: 'formal' | 'casual';
  crisisContactInfo?: string;
  notificationsEnabled: boolean;
  dataRetentionDays: number;
}

export interface UserProfile {
  id: string;
  createdAt: Date;
  lastActive: Date;
  preferences: UserPreferences;
  stats: {
    totalConversations: number;
    totalJournalEntries: number;
    averageMood: number;
    streakDays: number;
  };
}

export class UserService {
  private profiles: Map<string, UserProfile> = new Map();

  async getProfile(userId: string): Promise<UserProfile> {
    try {
      let profile = this.profiles.get(userId);
      
      if (!profile) {
        // Create default profile for new user
        profile = this.createDefaultProfile(userId);
        this.profiles.set(userId, profile);
      } else {
        // Update last active timestamp
        profile.lastActive = new Date();
      }

      return profile;

    } catch (error) {
      console.error('Error getting user profile:', error);
      throw new Error('Failed to retrieve user profile');
    }
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      let profile = this.profiles.get(userId);
      
      if (!profile) {
        profile = this.createDefaultProfile(userId);
      }

      // Update allowed fields
      if (updates.preferences) {
        profile.preferences = { ...profile.preferences, ...updates.preferences };
      }

      profile.lastActive = new Date();
      this.profiles.set(userId, profile);

      return profile;

    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update user profile');
    }
  }

  async updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    try {
      let profile = this.profiles.get(userId);
      
      if (!profile) {
        profile = this.createDefaultProfile(userId);
      }

      // Validate preferences
      this.validatePreferences(preferences);

      // Update preferences
      profile.preferences = { ...profile.preferences, ...preferences };
      profile.lastActive = new Date();
      
      this.profiles.set(userId, profile);

      return profile.preferences;

    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw new Error('Failed to update user preferences');
    }
  }

  async updateStats(userId: string, stats: Partial<UserProfile['stats']>): Promise<UserProfile['stats']> {
    try {
      let profile = this.profiles.get(userId);
      
      if (!profile) {
        profile = this.createDefaultProfile(userId);
      }

      // Update stats
      profile.stats = { ...profile.stats, ...stats };
      profile.lastActive = new Date();
      
      this.profiles.set(userId, profile);

      return profile.stats;

    } catch (error) {
      console.error('Error updating user stats:', error);
      throw new Error('Failed to update user stats');
    }
  }

  async resetUserData(userId: string): Promise<boolean> {
    try {
      // In a real implementation, this would also clear journal entries, conversations, etc.
      const deleted = this.profiles.delete(userId);
      
      if (deleted) {
        console.log(`User data reset for user: ${userId}`);
      }

      return deleted;

    } catch (error) {
      console.error('Error resetting user data:', error);
      throw new Error('Failed to reset user data');
    }
  }

  async exportUserData(userId: string): Promise<any> {
    try {
      const profile = this.profiles.get(userId);
      
      if (!profile) {
        return null;
      }

      // In a real implementation, this would include all user data
      return {
        profile,
        exportedAt: new Date().toISOString(),
        dataTypes: ['profile', 'preferences', 'stats'],
        note: 'This is a simplified export. In a full implementation, this would include journal entries and conversation history.'
      };

    } catch (error) {
      console.error('Error exporting user data:', error);
      throw new Error('Failed to export user data');
    }
  }

  private createDefaultProfile(userId: string): UserProfile {
    return {
      id: userId,
      createdAt: new Date(),
      lastActive: new Date(),
      preferences: {
        voiceEnabled: true,
        language: 'en',
        checkInFrequency: 'weekly',
        communicationStyle: 'casual',
        notificationsEnabled: true,
        dataRetentionDays: 365
      },
      stats: {
        totalConversations: 0,
        totalJournalEntries: 0,
        averageMood: 0,
        streakDays: 0
      }
    };
  }

  private validatePreferences(preferences: Partial<UserPreferences>): void {
    if (preferences.checkInFrequency && 
        !['daily', 'weekly', 'custom', 'never'].includes(preferences.checkInFrequency)) {
      throw new Error('Invalid check-in frequency');
    }

    if (preferences.communicationStyle && 
        !['formal', 'casual'].includes(preferences.communicationStyle)) {
      throw new Error('Invalid communication style');
    }

    if (preferences.language && 
        !/^[a-z]{2}(-[A-Z]{2})?$/.test(preferences.language)) {
      throw new Error('Invalid language code');
    }

    if (preferences.dataRetentionDays && 
        (preferences.dataRetentionDays < 30 || preferences.dataRetentionDays > 3650)) {
      throw new Error('Data retention days must be between 30 and 3650');
    }

    if (preferences.crisisContactInfo && 
        preferences.crisisContactInfo.length > 200) {
      throw new Error('Crisis contact info must be less than 200 characters');
    }
  }

  // Clean up inactive profiles to prevent memory leaks
  cleanupInactiveProfiles() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    for (const [userId, profile] of this.profiles.entries()) {
      if (profile.lastActive < sixMonthsAgo) {
        this.profiles.delete(userId);
        console.log(`Cleaned up inactive profile for user: ${userId}`);
      }
    }
  }

  // Get system statistics
  getSystemStats() {
    const totalUsers = this.profiles.size;
    const activeUsers = Array.from(this.profiles.values()).filter(
      profile => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return profile.lastActive >= oneWeekAgo;
      }
    ).length;

    return {
      totalUsers,
      activeUsers,
      timestamp: new Date().toISOString()
    };
  }
}

// Singleton instance
export const userService = new UserService();

// Clean up inactive profiles every day
setInterval(() => {
  userService.cleanupInactiveProfiles();
}, 24 * 60 * 60 * 1000);