// Backend types for MindEase application

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  type: 'text' | 'voice';
}

export interface UserProfile {
  id: string;
  createdAt: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  voiceEnabled: boolean;
  language: string;
  checkInFrequency: 'daily' | 'weekly' | 'custom';
  communicationStyle: 'formal' | 'casual';
  crisisContactInfo?: string;
}

export interface ConversationResponse {
  response: string;
  crisisDetected: boolean;
  suggestedActions: string[];
}

export interface EmergencyResource {
  name: string;
  phone: string;
  website?: string;
  description: string;
  availability: string;
}