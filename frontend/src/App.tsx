import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container, Box, Alert, Snackbar } from '@mui/material';
import ChatInterface from './components/ChatInterface';
import CrisisSupportPage from './components/CrisisSupportPage';
import Navigation from './components/Navigation';
import { apiService } from './services/api.service';
import { ConversationService } from './services/conversation.service';
import { Message, ConversationStore } from './types/conversation';

interface UserProfile {
  id: string;
  preferences: {
    voiceEnabled: boolean;
    language: string;
    communicationStyle: 'formal' | 'casual';
  };
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('chat');
  const [store, setStore] = useState<ConversationStore>(() => ConversationService.loadStore());
  const [userProfile] = useState<UserProfile>({
    id: 'user-local',
    preferences: {
      voiceEnabled: true,
      language: 'en',
      communicationStyle: 'casual',
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crisisAlert, setCrisisAlert] = useState<any>(null);

  const activeConversation = ConversationService.getActiveConversation(store);
  const messages = activeConversation?.messages || [];

  useEffect(() => {
    // Initialize with a conversation if none exists
    if (Object.keys(store.conversations).length === 0) {
      const newConversation = ConversationService.createConversation();
      const welcomeMessage: Message = {
        id: 'welcome-1',
        content: "Hello! I'm MindEase, your AI companion for mental health support. I'm here to listen, provide emotional support, and help you on your wellness journey. How are you feeling today?",
        sender: 'assistant',
        timestamp: new Date(),
        type: 'text',
      };
      
      let updatedStore = ConversationService.addConversation(store, newConversation);
      updatedStore = ConversationService.addMessage(updatedStore, newConversation.id, welcomeMessage);
      setStore(updatedStore);
      ConversationService.saveStore(updatedStore);
    }

    // Check backend health
    apiService.healthCheck().catch(() => {
      console.warn('Backend health check failed');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Save store to localStorage whenever it changes
    ConversationService.saveStore(store);
  }, [store]);

  const handleSendMessage = async (content: string, type: 'text' | 'voice') => {
    if (!activeConversation) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      content,
      sender: 'user',
      timestamp: new Date(),
      type,
    };

    // Add user message to store
    let updatedStore = ConversationService.addMessage(store, activeConversation.id, userMessage);
    setStore(updatedStore);
    setIsLoading(true);
    setError(null);

    try {
      // Convert messages to API format
      const conversationHistory = messages.map(m => ({
        role: m.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: m.content,
      }));

      const response = await apiService.sendMessage(content, conversationHistory);

      // Check for crisis
      if (response.crisisDetected) {
        setCrisisAlert({
          level: response.crisisLevel,
          resources: response.suggestedResources,
        });
      }

      const aiResponse: Message = {
        id: `ai-${Date.now()}`,
        content: response.response,
        sender: 'assistant',
        timestamp: new Date(),
        type: 'text',
      };

      // Add AI response to store
      updatedStore = ConversationService.addMessage(updatedStore, activeConversation.id, aiResponse);
      setStore(updatedStore);
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setError(err.message || 'Failed to send message. Please try again.');
      
      // Add error message to chat
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment. If you're in crisis, please contact 988 (Suicide & Crisis Lifeline) or your local emergency services.",
        sender: 'assistant',
        timestamp: new Date(),
        type: 'text',
      };
      updatedStore = ConversationService.addMessage(updatedStore, activeConversation.id, errorMessage);
      setStore(updatedStore);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const handleNewConversation = () => {
    const newConversation = ConversationService.createConversation();
    const welcomeMessage: Message = {
      id: 'welcome-1',
      content: "Hello! I'm MindEase, your AI companion for mental health support. I'm here to listen, provide emotional support, and help you on your wellness journey. How are you feeling today?",
      sender: 'assistant',
      timestamp: new Date(),
      type: 'text',
    };
    
    let updatedStore = ConversationService.addConversation(store, newConversation);
    updatedStore = ConversationService.addMessage(updatedStore, newConversation.id, welcomeMessage);
    setStore(updatedStore);
  };

  const handleSwitchConversation = (conversationId: string) => {
    const updatedStore = ConversationService.setActiveConversation(store, conversationId);
    setStore(updatedStore);
  };

  const handleDeleteConversation = (conversationId: string) => {
    if (window.confirm('Are you sure you want to delete this conversation? This cannot be undone.')) {
      const updatedStore = ConversationService.deleteConversation(store, conversationId);
      setStore(updatedStore);
      
      // If no conversations left, create a new one
      if (Object.keys(updatedStore.conversations).length === 0) {
        handleNewConversation();
      }
    }
  };

  const handleClearAllHistory = () => {
    if (window.confirm('Are you sure you want to clear all conversation history? This cannot be undone.')) {
      const clearedStore = ConversationService.clearAllConversations();
      setStore(clearedStore);
      
      // Create a new conversation
      handleNewConversation();
    }
  };

  return (
    <Router>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
        <Navigation
          currentPage={currentPage}
          onNavigate={handleNavigate}
          userProfile={userProfile}
          conversations={ConversationService.getAllConversations(store)}
          activeConversationId={store.activeConversationId}
          onNewConversation={handleNewConversation}
          onSwitchConversation={handleSwitchConversation}
          onDeleteConversation={handleDeleteConversation}
          onClearAllHistory={handleClearAllHistory}
        />

        <Container maxWidth="lg" sx={{ flex: 1, py: 3 }}>
          <Routes>
            <Route
              path="/chat"
              element={
                <ChatInterface
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  voiceEnabled={userProfile.preferences.voiceEnabled}
                  onToggleVoice={() => { }}
                />
              }
            />
            <Route
              path="/crisis-support"
              element={
                <CrisisSupportPage
                  isVisible={true}
                  onClose={() => handleNavigate('chat')}
                  emergencyResources={[]}
                  onContactResource={() => { }}
                />
              }
            />
            <Route path="/" element={<Navigate to="/chat" replace />} />
          </Routes>
        </Container>

        {/* Error Snackbar */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Snackbar>

        {/* Crisis Alert */}
        <Snackbar
          open={!!crisisAlert}
          autoHideDuration={10000}
          onClose={() => setCrisisAlert(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            severity="warning" 
            onClose={() => setCrisisAlert(null)}
            action={
              <button onClick={() => handleNavigate('crisis-support')}>
                View Resources
              </button>
            }
          >
            We detected you might be in distress. Please consider reaching out to crisis support resources.
          </Alert>
        </Snackbar>
      </Box>
    </Router>
  );
};

export default App;