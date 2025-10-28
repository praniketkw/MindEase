// API Interfaces for Frontend-Backend Communication

import { 
  Message, 
  EmotionalAnalysis, 
  JournalEntry, 
  UserProfile, 
  CopingStrategy 
} from '../../../shared/types';

// Base API Response Interface
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// Authentication API
export interface LoginRequest {
  userId: string;
  sessionToken?: string;
}

export interface LoginResponse {
  token: string;
  user: UserProfile;
  expiresAt: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  expiresAt: string;
}

// Chat API
export interface SendMessageRequest {
  content: string;
  type: 'text' | 'voice';
  sessionId?: string;
}

export interface SendMessageResponse {
  response: string;
  messageId: string;
  emotionalAnalysis: EmotionalAnalysis;
  suggestedActions: string[];
  crisisDetected: boolean;
  audioResponse?: string; // base64 encoded audio
}

export interface GetConversationHistoryRequest {
  limit?: number;
  offset?: number;
  sessionId?: string;
}

export interface GetConversationHistoryResponse {
  messages: Message[];
  totalCount: number;
  hasMore: boolean;
}

// Voice API
export interface ProcessVoiceRequest {
  audioData: string; // base64 encoded audio
  format: 'wav' | 'mp3' | 'webm';
  sessionId?: string;
}

export interface ProcessVoiceResponse {
  transcription: string;
  response: string;
  emotionalAnalysis: EmotionalAnalysis;
  audioResponse?: string; // base64 encoded audio
  confidence: number;
}

export interface TextToSpeechRequest {
  text: string;
  voice?: string;
  speed?: number;
  pitch?: number;
}

export interface TextToSpeechResponse {
  audioData: string; // base64 encoded audio
  duration: number;
}

// Journal API
export interface CreateJournalEntryRequest {
  content: string;
  type: 'text' | 'voice';
  mood?: number;
  tags?: string[];
}

export interface CreateJournalEntryResponse {
  entry: JournalEntry;
  insights: JournalInsights;
}

export interface GetJournalEntriesRequest {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
  tags?: string[];
}

export interface GetJournalEntriesResponse {
  entries: JournalEntry[];
  totalCount: number;
  hasMore: boolean;
}

export interface GetJournalInsightsRequest {
  timeframe: 'week' | 'month' | 'year';
}

export interface GetJournalInsightsResponse {
  insights: JournalInsights;
  trends: EmotionalTrends;
  recommendations: string[];
}

export interface JournalInsights {
  totalEntries: number;
  averageMood: number;
  moodTrend: 'improving' | 'stable' | 'declining';
  frequentThemes: string[];
  suggestedActions: string[];
}

export interface EmotionalTrends {
  moodOverTime: MoodDataPoint[];
  emotionDistribution: EmotionDistribution[];
  themeAnalysis: ThemeAnalysis[];
}

export interface MoodDataPoint {
  date: string;
  mood: number;
  dominantEmotion: string;
}

export interface EmotionDistribution {
  emotion: string;
  percentage: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface ThemeAnalysis {
  theme: string;
  frequency: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  relatedEmotions: string[];
}

// User Profile API
export interface UpdateUserProfileRequest {
  preferences?: {
    voiceEnabled?: boolean;
    language?: string;
    checkInFrequency?: 'daily' | 'weekly' | 'custom';
    communicationStyle?: 'formal' | 'casual';
    crisisContactInfo?: string;
  };
  emotionalBaseline?: {
    averageMood?: number;
    commonThemes?: string[];
    preferredCopingStrategies?: string[];
    riskFactors?: string[];
  };
}

export interface UpdateUserProfileResponse {
  profile: UserProfile;
  message: string;
}

export interface GetUserProfileResponse {
  profile: UserProfile;
  lastActivity: string;
  accountStatus: 'active' | 'inactive' | 'suspended';
}

export interface ResetUserDataRequest {
  confirmationCode: string;
  keepPreferences?: boolean;
}

export interface ResetUserDataResponse {
  success: boolean;
  message: string;
  newUserId?: string;
}

// Coping Strategies API
export interface GetCopingStrategiesRequest {
  category?: 'breathing' | 'grounding' | 'cognitive' | 'physical' | 'social';
  recommended?: boolean;
}

export interface GetCopingStrategiesResponse {
  strategies: CopingStrategy[];
  recommended: CopingStrategy[];
  personalizedSuggestions: string[];
}

export interface RecordStrategyUsageRequest {
  strategyId: string;
  effectiveness: number; // 1-5 scale
  context?: string;
  duration?: number; // in minutes
}

export interface RecordStrategyUsageResponse {
  success: boolean;
  updatedStrategy: CopingStrategy;
  newRecommendations?: CopingStrategy[];
}

export interface AddCustomStrategyRequest {
  name: string;
  description: string;
  category: 'breathing' | 'grounding' | 'cognitive' | 'physical' | 'social';
  instructions?: string;
}

export interface AddCustomStrategyResponse {
  strategy: CopingStrategy;
  message: string;
}

// Crisis Support API
export interface GetEmergencyResourcesRequest {
  location?: string;
  type?: 'hotline' | 'chat' | 'text' | 'local';
}

export interface GetEmergencyResourcesResponse {
  resources: EmergencyResource[];
  localResources: EmergencyResource[];
  immediateActions: string[];
}

export interface EmergencyResource {
  name: string;
  phone: string;
  website?: string;
  description: string;
  availability: string;
  location?: string;
  type: 'hotline' | 'chat' | 'text' | 'local';
}

export interface ReportCrisisRequest {
  content: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  immediateHelp: boolean;
}

export interface ReportCrisisResponse {
  resources: EmergencyResource[];
  responseMessage: string;
  followUpScheduled: boolean;
  referenceId: string;
}

// Analytics API
export interface GetUserAnalyticsRequest {
  timeframe: 'week' | 'month' | 'year';
  includeComparisons?: boolean;
}

export interface GetUserAnalyticsResponse {
  summary: UserAnalyticsSummary;
  emotionalJourney: EmotionalJourneyData;
  progressMetrics: ProgressMetric[];
  insights: string[];
}

export interface UserAnalyticsSummary {
  totalInteractions: number;
  averageMood: number;
  moodTrend: 'improving' | 'stable' | 'declining';
  mostActiveDay: string;
  preferredInteractionType: 'text' | 'voice';
}

export interface EmotionalJourneyData {
  milestones: JourneyMilestone[];
  overallProgress: 'positive' | 'neutral' | 'concerning';
  keyInsights: string[];
}

export interface JourneyMilestone {
  date: string;
  type: 'improvement' | 'setback' | 'breakthrough' | 'stable_period';
  description: string;
  emotionalState: string;
}

export interface ProgressMetric {
  name: string;
  value: number;
  previousValue: number;
  trend: 'improving' | 'stable' | 'declining';
  description: string;
}

// Health Check API
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: ServiceStatus[];
  timestamp: string;
  version: string;
}

export interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastChecked: string;
  error?: string;
}

// Error Response Interface
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  requestId: string;
}

// Pagination Interface
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// WebSocket Message Types
export interface WebSocketMessage {
  type: 'message' | 'typing' | 'emotion_update' | 'crisis_alert' | 'system_notification';
  payload: any;
  timestamp: string;
  sessionId: string;
}

export interface TypingIndicator {
  isTyping: boolean;
  userId: string;
}

export interface EmotionUpdate {
  emotionalAnalysis: EmotionalAnalysis;
  suggestions: string[];
}

export interface SystemNotification {
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  action?: {
    label: string;
    url: string;
  };
}