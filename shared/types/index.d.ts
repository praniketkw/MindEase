export interface Message {
    id: string;
    content: string;
    sender: 'user' | 'assistant';
    timestamp: Date;
    emotionalTone?: EmotionalAnalysis;
    type: 'text' | 'voice';
}
export interface EmotionalAnalysis {
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
    stressIndicators: string[];
    copingMechanisms: string[];
}
export interface UserProfile {
    id: string;
    createdAt: Date;
    preferences: UserPreferences;
    emotionalBaseline: EmotionalBaseline;
    encryptionKey: string;
}
export interface UserPreferences {
    voiceEnabled: boolean;
    language: string;
    checkInFrequency: 'daily' | 'weekly' | 'custom';
    communicationStyle: 'formal' | 'casual';
    crisisContactInfo?: string;
}
export interface EmotionalBaseline {
    averageMood: number;
    commonThemes: string[];
    preferredCopingStrategies: string[];
    riskFactors: string[];
}
export interface JournalEntry {
    id: string;
    userId: string;
    content: string;
    contentType: 'text' | 'voice';
    timestamp: Date;
    emotionalAnalysis: EmotionalAnalysis;
    themes: string[];
    mood: number;
    copingStrategiesUsed: string[];
}
export interface ConversationContext {
    userId: string;
    recentMessages: MessageSummary[];
    emotionalState: EmotionalState;
    personalizedPrompts: string[];
    safetyFlags: SafetyFlag[];
    sessionId: string;
}
export interface MessageSummary {
    timestamp: Date;
    emotionalTone: string;
    keyThemes: string[];
    userMood: number;
}
export interface EmotionalState {
    currentMood: number;
    dominantEmotion: string;
    stressLevel: number;
    riskLevel: 'low' | 'medium' | 'high' | 'crisis';
}
export interface SafetyFlag {
    type: 'content_warning' | 'crisis_indicator' | 'risk_pattern';
    severity: 'low' | 'medium' | 'high';
    timestamp: Date;
    context: string;
}
export interface CopingStrategy {
    id: string;
    name: string;
    description: string;
    category: 'breathing' | 'grounding' | 'cognitive' | 'physical' | 'social';
    effectivenessScore: number;
    usageCount: number;
    lastUsed?: Date;
}
export interface EmergencyResource {
    name: string;
    phone: string;
    website?: string;
    description: string;
    availability: string;
    location?: string;
}
//# sourceMappingURL=index.d.ts.map