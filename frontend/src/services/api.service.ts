const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
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

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async sendMessage(message: string, conversationHistory: Message[]): Promise<ChatResponse> {
    return this.request<ChatResponse>('/api/chat/message', {
      method: 'POST',
      body: JSON.stringify({
        message,
        conversationHistory,
      }),
    });
  }

  async checkCrisis(message: string): Promise<CrisisCheckResponse> {
    return this.request<CrisisCheckResponse>('/api/chat/crisis-check', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async healthCheck(): Promise<any> {
    return this.request('/health');
  }
}

export const apiService = new ApiService();
