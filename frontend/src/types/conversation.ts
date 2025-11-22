export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  type: 'text' | 'voice';
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  lastActive: Date;
}

export interface ConversationStore {
  activeConversationId: string | null;
  conversations: Record<string, Conversation>;
}
