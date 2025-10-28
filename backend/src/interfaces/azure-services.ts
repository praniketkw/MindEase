// Azure AI Services Integration Interfaces

import { EmotionalAnalysis, ConversationContext } from '../../../shared/types';

// Azure OpenAI Service Interface
export interface AzureOpenAIService {
  generateResponse(context: ConversationContext, userMessage: string): Promise<ConversationResponse>;
  generateEmpathicResponse(emotionalState: string, userMessage: string): Promise<string>;
  createPersonalizedPrompt(userHistory: string[], currentMood: string): Promise<string>;
}

export interface ConversationResponse {
  response: string;
  emotionalAnalysis: EmotionalAnalysis;
  suggestedActions: string[];
  crisisDetected: boolean;
  audioResponse?: Buffer;
  copingStrategies?: {
    id: string;
    name: string;
    description: string;
    reason: string;
    personalizedInstructions?: string;
  }[];
}

// Azure AI Language Service Interface
export interface AzureLanguageService {
  analyzeSentiment(text: string): Promise<SentimentResult>;
  extractKeyPhrases(text: string): Promise<string[]>;
  recognizeEntities(text: string): Promise<EntityResult[]>;
  classifyText(text: string): Promise<ClassificationResult>;
  detectLanguage(text: string): Promise<LanguageDetectionResult>;
}

export interface SentimentResult {
  sentiment: 'positive' | 'neutral' | 'negative';
  confidenceScores: {
    positive: number;
    neutral: number;
    negative: number;
  };
  sentences: SentenceSentiment[];
}

export interface SentenceSentiment {
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  confidenceScores: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface EntityResult {
  text: string;
  category: string;
  subcategory?: string;
  confidenceScore: number;
  offset: number;
  length: number;
}

export interface ClassificationResult {
  category: string;
  confidenceScore: number;
}

export interface LanguageDetectionResult {
  language: string;
  confidenceScore: number;
}

// Azure Content Safety Service Interface
export interface AzureContentSafetyService {
  analyzeText(text: string): Promise<SafetyResult>;
  detectCrisis(text: string): Promise<CrisisDetectionResult>;
  moderateContent(text: string): Promise<ModerationResult>;
}

export interface SafetyResult {
  isSafe: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'crisis';
  categories: SafetyCategory[];
  confidence: number;
}

export interface SafetyCategory {
  category: 'hate' | 'self_harm' | 'sexual' | 'violence';
  severity: number;
}

export interface CrisisDetectionResult {
  crisisDetected: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'crisis';
  indicators: string[];
  recommendedActions: string[];
  emergencyResources: EmergencyResource[];
}

export interface ModerationResult {
  blocked: boolean;
  reason?: string;
  categories: string[];
}

export interface EmergencyResource {
  name: string;
  phone: string;
  website?: string;
  description: string;
  availability: string;
}

// Azure Speech Service Interface
export interface AzureSpeechService {
  speechToText(audioBuffer: Buffer): Promise<SpeechToTextResult>;
  textToSpeech(text: string, voiceSettings?: VoiceSettings): Promise<Buffer>;
  detectSpeechEmotion(audioBuffer: Buffer): Promise<SpeechEmotionResult>;
}

export interface SpeechToTextResult {
  text: string;
  confidence: number;
  duration: number;
  language?: string;
}

export interface VoiceSettings {
  voice: string;
  speed: number;
  pitch: number;
  volume: number;
}

export interface SpeechEmotionResult {
  emotions: {
    [emotion: string]: number;
  };
  dominantEmotion: string;
  confidence: number;
}

// Azure AI Translator Service Interface (for multilingual support)
export interface AzureTranslatorService {
  translateText(text: string, targetLanguage: string, sourceLanguage?: string): Promise<TranslationResult>;
  detectLanguage(text: string): Promise<LanguageDetectionResult>;
  getSupportedLanguages(): Promise<string[]>;
}

export interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
}

// Service Configuration Interfaces
export interface AzureServiceConfig {
  openai: {
    endpoint: string;
    apiKey: string;
    deploymentName: string;
    apiVersion: string;
  };
  language: {
    endpoint: string;
    apiKey: string;
  };
  contentSafety: {
    endpoint: string;
    apiKey: string;
  };
  speech: {
    subscriptionKey: string;
    region: string;
  };
  translator?: {
    subscriptionKey: string;
    region: string;
  };
}

// Error handling interfaces
export class AzureServiceError extends Error {
  constructor(
    public service: string,
    public errorCode: string,
    public retryable: boolean,
    message: string
  ) {
    super(message);
    this.name = 'AzureServiceError';
  }
}

export interface ServiceHealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastChecked: Date;
  error?: string;
}