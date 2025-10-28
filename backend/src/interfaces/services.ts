// Core Service Interfaces for MindEase Backend

import { 
  UserProfile, 
  JournalEntry, 
  ConversationContext, 
  EmotionalAnalysis,
  CopingStrategy,
  EmergencyResource
} from '../../../shared/types';
import { ConversationResponse, SafetyResult, CrisisDetectionResult } from './azure-services';

// Conversation Service Interface
export interface ConversationService {
  processMessage(userId: string, message: string): Promise<ConversationResponse>;
  processVoiceInput(userId: string, audioBlob: Buffer): Promise<ConversationResponse>;
  generateResponse(context: ConversationContext): Promise<string>;
  analyzeEmotion(text: string): Promise<EmotionalAnalysis>;
  getConversationContext(userId: string): Promise<ConversationContext>;
  updateConversationContext(userId: string, context: ConversationContext): Promise<void>;
}

// Safety Monitor Service Interface
export interface SafetyMonitorService {
  checkContent(text: string): Promise<SafetyResult>;
  handleCrisisDetection(userId: string, content: string): Promise<CrisisResponse>;
  getEmergencyResources(location?: string): Promise<EmergencyResource[]>;
  logSafetyEvent(userId: string, event: SafetyEvent): Promise<void>;
  assessRiskLevel(userId: string, recentActivity: string[]): Promise<RiskAssessment>;
}

export interface CrisisResponse {
  immediate: boolean;
  resources: EmergencyResource[];
  responseMessage: string;
  followUpRequired: boolean;
}

export interface SafetyEvent {
  type: 'crisis_detected' | 'risk_pattern' | 'content_flagged';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  context: string;
  actionTaken: string;
}

export interface RiskAssessment {
  riskLevel: 'low' | 'medium' | 'high' | 'crisis';
  factors: string[];
  recommendations: string[];
  monitoringRequired: boolean;
}

// User Profile Service Interface
export interface UserProfileService {
  createProfile(userId: string): Promise<UserProfile>;
  getProfile(userId: string): Promise<UserProfile | null>;
  updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile>;
  updateEmotionalSummary(userId: string, analysis: EmotionalAnalysis): Promise<void>;
  getPersonalizationData(userId: string): Promise<PersonalizationData>;
  resetUserData(userId: string): Promise<void>;
  deleteProfile(userId: string): Promise<boolean>;
}

export interface PersonalizationData {
  preferredTopics: string[];
  effectiveCopingStrategies: CopingStrategy[];
  communicationStyle: string;
  emotionalPatterns: EmotionalPattern[];
  riskFactors: string[];
}

export interface EmotionalPattern {
  pattern: string;
  frequency: number;
  triggers: string[];
  outcomes: string[];
}

// Journal Service Interface
export interface JournalService {
  createEntry(userId: string, content: string, type: 'text' | 'voice'): Promise<JournalEntry>;
  getEntries(userId: string, limit?: number, offset?: number): Promise<JournalEntry[]>;
  getEntry(userId: string, entryId: string): Promise<JournalEntry | null>;
  updateEntry(userId: string, entryId: string, updates: Partial<JournalEntry>): Promise<JournalEntry>;
  deleteEntry(userId: string, entryId: string): Promise<boolean>;
  analyzeEmotionalTrends(userId: string, timeframe: 'week' | 'month' | 'year'): Promise<EmotionalTrends>;
  generateInsights(userId: string): Promise<JournalInsights>;
}

export interface EmotionalTrends {
  timeframe: string;
  moodTrend: MoodDataPoint[];
  dominantEmotions: string[];
  keyThemes: string[];
  improvementAreas: string[];
}

export interface MoodDataPoint {
  date: Date;
  mood: number;
  dominantEmotion: string;
}

export interface JournalInsights {
  totalEntries: number;
  averageMood: number;
  moodTrend: 'improving' | 'stable' | 'declining';
  frequentThemes: string[];
  suggestedActions: string[];
}

// Coping Strategy Service Interface
export interface CopingStrategyService {
  getStrategies(userId: string): Promise<CopingStrategy[]>;
  getRecommendedStrategies(userId: string, currentMood: string): Promise<CopingStrategy[]>;
  recordStrategyUsage(userId: string, strategyId: string, effectiveness: number): Promise<void>;
  addCustomStrategy(userId: string, strategy: Omit<CopingStrategy, 'id'>): Promise<CopingStrategy>;
  updateStrategyEffectiveness(userId: string, strategyId: string, effectiveness: number): Promise<void>;
  getStrategyAnalytics(userId: string): Promise<StrategyAnalytics>;
}

export interface StrategyAnalytics {
  mostEffective: CopingStrategy[];
  leastEffective: CopingStrategy[];
  usagePatterns: StrategyUsagePattern[];
  recommendations: string[];
}

export interface StrategyUsagePattern {
  strategy: string;
  usageFrequency: number;
  effectivenessScore: number;
  preferredContexts: string[];
}

// Encryption Service Interface
export interface EncryptionService {
  encrypt(data: string, key: string): Promise<string>;
  decrypt(encryptedData: string, key: string): Promise<string>;
  generateKey(): Promise<string>;
  hashPassword(password: string): Promise<string>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
}

// Database Service Interface
export interface DatabaseService {
  initialize(): Promise<void>;
  close(): Promise<void>;
  backup(): Promise<string>;
  restore(backupPath: string): Promise<void>;
  healthCheck(): Promise<boolean>;
  migrate(): Promise<void>;
}

// Authentication Service Interface
export interface AuthenticationService {
  generateToken(userId: string): Promise<string>;
  verifyToken(token: string): Promise<string | null>;
  refreshToken(token: string): Promise<string>;
  revokeToken(token: string): Promise<void>;
  createSession(userId: string): Promise<string>;
  validateSession(sessionId: string): Promise<boolean>;
}

// Notification Service Interface (for check-ins and alerts)
export interface NotificationService {
  scheduleCheckIn(userId: string, frequency: 'daily' | 'weekly' | 'custom', time?: string): Promise<void>;
  sendCheckInReminder(userId: string): Promise<void>;
  cancelScheduledCheckIns(userId: string): Promise<void>;
  sendCrisisAlert(userId: string, details: string): Promise<void>;
}

// Analytics Service Interface
export interface AnalyticsService {
  trackUserInteraction(userId: string, interaction: UserInteraction): Promise<void>;
  generateUserReport(userId: string, timeframe: string): Promise<UserReport>;
  getSystemMetrics(): Promise<SystemMetrics>;
  trackEmotionalJourney(userId: string): Promise<EmotionalJourney>;
}

export interface UserInteraction {
  type: 'message' | 'journal_entry' | 'voice_input' | 'strategy_use';
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface UserReport {
  userId: string;
  timeframe: string;
  totalInteractions: number;
  emotionalSummary: EmotionalAnalysis;
  progressIndicators: ProgressIndicator[];
  recommendations: string[];
}

export interface ProgressIndicator {
  metric: string;
  value: number;
  trend: 'improving' | 'stable' | 'declining';
  description: string;
}

export interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  averageResponseTime: number;
  serviceHealth: Record<string, boolean>;
  errorRate: number;
}

export interface EmotionalJourney {
  userId: string;
  startDate: Date;
  milestones: JourneyMilestone[];
  overallProgress: 'positive' | 'neutral' | 'concerning';
  insights: string[];
}

export interface JourneyMilestone {
  date: Date;
  type: 'improvement' | 'setback' | 'breakthrough' | 'stable_period';
  description: string;
  emotionalState: string;
}