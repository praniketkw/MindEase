import { Conversation, ConversationStore, Message } from '../types/conversation';

const STORAGE_KEY = 'mindease_conversations';

export class ConversationService {
  private static generateId(): string {
    return `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generateTitle(firstMessage: string): string {
    const maxLength = 50;
    const cleaned = firstMessage.trim();
    if (cleaned.length <= maxLength) {
      return cleaned;
    }
    return cleaned.substring(0, maxLength) + '...';
  }

  static loadStore(): ConversationStore {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        Object.values(parsed.conversations).forEach((conv: any) => {
          conv.createdAt = new Date(conv.createdAt);
          conv.lastActive = new Date(conv.lastActive);
          conv.messages.forEach((msg: any) => {
            msg.timestamp = new Date(msg.timestamp);
          });
        });
        return parsed;
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }

    // Return empty store
    return {
      activeConversationId: null,
      conversations: {},
    };
  }

  static saveStore(store: ConversationStore): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (error) {
      console.error('Failed to save conversations:', error);
    }
  }

  static createConversation(firstMessage?: string): Conversation {
    const now = new Date();
    const id = this.generateId();
    
    const conversation: Conversation = {
      id,
      title: firstMessage ? this.generateTitle(firstMessage) : `Conversation ${new Date().toLocaleDateString()}`,
      messages: [],
      createdAt: now,
      lastActive: now,
    };

    return conversation;
  }

  static getActiveConversation(store: ConversationStore): Conversation | null {
    if (!store.activeConversationId) {
      return null;
    }
    return store.conversations[store.activeConversationId] || null;
  }

  static setActiveConversation(store: ConversationStore, conversationId: string): ConversationStore {
    return {
      ...store,
      activeConversationId: conversationId,
    };
  }

  static addConversation(store: ConversationStore, conversation: Conversation): ConversationStore {
    return {
      ...store,
      conversations: {
        ...store.conversations,
        [conversation.id]: conversation,
      },
      activeConversationId: conversation.id,
    };
  }

  static updateConversation(store: ConversationStore, conversationId: string, updates: Partial<Conversation>): ConversationStore {
    const conversation = store.conversations[conversationId];
    if (!conversation) {
      return store;
    }

    return {
      ...store,
      conversations: {
        ...store.conversations,
        [conversationId]: {
          ...conversation,
          ...updates,
          lastActive: new Date(),
        },
      },
    };
  }

  static deleteConversation(store: ConversationStore, conversationId: string): ConversationStore {
    const { [conversationId]: deleted, ...remainingConversations } = store.conversations;
    
    let newActiveId = store.activeConversationId;
    if (store.activeConversationId === conversationId) {
      // Set active to most recent conversation
      const sorted = Object.values(remainingConversations).sort(
        (a, b) => b.lastActive.getTime() - a.lastActive.getTime()
      );
      newActiveId = sorted.length > 0 ? sorted[0].id : null;
    }

    return {
      conversations: remainingConversations,
      activeConversationId: newActiveId,
    };
  }

  static addMessage(store: ConversationStore, conversationId: string, message: Message): ConversationStore {
    const conversation = store.conversations[conversationId];
    if (!conversation) {
      return store;
    }

    const updatedMessages = [...conversation.messages, message];
    
    // Update title if this is the first user message
    let newTitle = conversation.title;
    if (conversation.messages.length === 0 && message.sender === 'user') {
      newTitle = this.generateTitle(message.content);
    }

    return this.updateConversation(store, conversationId, {
      messages: updatedMessages,
      title: newTitle,
    });
  }

  static getAllConversations(store: ConversationStore): Conversation[] {
    return Object.values(store.conversations).sort(
      (a, b) => b.lastActive.getTime() - a.lastActive.getTime()
    );
  }

  static clearAllConversations(): ConversationStore {
    const store: ConversationStore = {
      activeConversationId: null,
      conversations: {},
    };
    this.saveStore(store);
    return store;
  }
}
