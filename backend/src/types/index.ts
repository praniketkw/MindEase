export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  type: 'text' | 'voice';
}

export interface ChatResponse {
  response: string;
  crisisDetected: boolean;
  crisisLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  suggestedResources?: any[];
  timestamp: string;
}

export interface CrisisCheckResponse {
  isCrisis: boolean;
  level: 'none' | 'low' | 'medium' | 'high' | 'critical';
  indicators: string[];
  resources: any[];
  timestamp: string;
}
