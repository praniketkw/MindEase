// Frontend Component Interfaces for MindEase

import { Message, EmotionalAnalysis, JournalEntry, UserProfile, CopingStrategy } from '../types';

// Chat Interface Component Props
export interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string, type: 'text' | 'voice') => void;
  isLoading: boolean;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  emotionalInsights?: EmotionalAnalysis;
}

// Voice Interface Component Props
export interface VoiceInterfaceProps {
  onVoiceInput: (audioBlob: Blob) => void;
  onToggleListening: () => void;
  isListening: boolean;
  isProcessing: boolean;
  isEnabled: boolean;
  onPlayResponse?: (text: string) => void;
}

// Journaling Interface Component Props
export interface JournalingProps {
  entries: JournalEntry[];
  onCreateEntry: (content: string, type: 'text' | 'voice') => void;
  onViewInsights: () => void;
  onDeleteEntry: (entryId: string) => void;
  isLoading: boolean;
  emotionalTrends?: EmotionalTrendsData;
}

export interface EmotionalTrendsData {
  moodOverTime: MoodDataPoint[];
  dominantEmotions: EmotionFrequency[];
  keyThemes: ThemeFrequency[];
  weeklyAverage: number;
}

export interface MoodDataPoint {
  date: string;
  mood: number;
  dominantEmotion: string;
}

export interface EmotionFrequency {
  emotion: string;
  frequency: number;
  color: string;
}

export interface ThemeFrequency {
  theme: string;
  count: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

// Settings Interface Component Props
export interface SettingsProps {
  userProfile: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onResetData: () => void;
  onExportData: () => void;
  isLoading: boolean;
}

// Crisis Support Component Props
export interface CrisisSupportProps {
  isVisible: boolean;
  onClose: () => void;
  emergencyResources: EmergencyResource[];
  onContactResource: (resource: EmergencyResource) => void;
}

export interface EmergencyResource {
  name: string;
  phone: string;
  website?: string;
  description: string;
  availability: string;
  location?: string;
}

// Coping Strategies Component Props
export interface CopingStrategiesProps {
  strategies: CopingStrategy[];
  onUseStrategy: (strategyId: string) => void;
  onRateStrategy: (strategyId: string, effectiveness: number) => void;
  onAddCustomStrategy: (strategy: Omit<CopingStrategy, 'id'>) => void;
  recommendedStrategies: CopingStrategy[];
  isLoading: boolean;
}

// Emotional Insights Component Props
export interface EmotionalInsightsProps {
  analysis: EmotionalAnalysis;
  trends: EmotionalTrendsData;
  onViewDetails: () => void;
  showDetailed: boolean;
}

// Message Component Props
export interface MessageProps {
  message: Message;
  onPlayAudio?: (text: string) => void;
  onReact?: (messageId: string, reaction: string) => void;
  showEmotionalTone?: boolean;
}

// Loading Component Props
export interface LoadingProps {
  message?: string;
  type?: 'spinner' | 'dots' | 'pulse';
  size?: 'small' | 'medium' | 'large';
}

// Error Boundary Component Props
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

// Navigation Component Props
export interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  unreadNotifications?: number;
  userProfile?: UserProfile;
}

// Theme Provider Props
export interface ThemeProviderProps {
  children: React.ReactNode;
  theme: 'light' | 'dark' | 'auto';
  onThemeChange: (theme: 'light' | 'dark' | 'auto') => void;
}

// Accessibility Props
export interface AccessibilityProps {
  ariaLabel?: string;
  ariaDescribedBy?: string;
  role?: string;
  tabIndex?: number;
  onKeyDown?: (event: React.KeyboardEvent) => void;
}

// Form Component Props
export interface FormProps {
  onSubmit: (data: FormData) => void;
  isLoading: boolean;
  errors?: Record<string, string>;
  children: React.ReactNode;
}

// Input Component Props
export interface InputProps extends AccessibilityProps {
  type: 'text' | 'email' | 'password' | 'textarea';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
}

// Button Component Props
export interface ButtonProps extends AccessibilityProps {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

// Modal Component Props
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  closeOnOverlayClick?: boolean;
}

// Chart Component Props
export interface ChartProps {
  data: ChartData;
  type: 'line' | 'bar' | 'pie' | 'doughnut';
  options?: ChartOptions;
  height?: number;
  width?: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
}

export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  plugins?: {
    legend?: {
      display: boolean;
      position?: 'top' | 'bottom' | 'left' | 'right';
    };
    title?: {
      display: boolean;
      text: string;
    };
  };
  scales?: {
    x?: {
      display: boolean;
      title?: {
        display: boolean;
        text: string;
      };
    };
    y?: {
      display: boolean;
      title?: {
        display: boolean;
        text: string;
      };
    };
  };
}

// Notification Component Props
export interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  onClose: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Search Component Props
export interface SearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  suggestions?: string[];
  isLoading?: boolean;
}

// Pagination Component Props
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  maxVisiblePages?: number;
}

// Hook Interfaces
export interface UseVoiceRecording {
  isRecording: boolean;
  isSupported: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  audioBlob: Blob | null;
  error: string | null;
}

export interface UseEmotionalAnalysis {
  analyze: (text: string) => Promise<EmotionalAnalysis>;
  isAnalyzing: boolean;
  error: string | null;
}

export interface UseLocalStorage<T> {
  value: T | null;
  setValue: (value: T) => void;
  removeValue: () => void;
  error: string | null;
}