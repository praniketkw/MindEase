import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container, Box, Alert, Snackbar } from '@mui/material';
import ChatInterface from './components/ChatInterface';
import CrisisSupportPage from './components/CrisisSupportPage';
import Navigation from './components/Navigation';
import { apiService } from './services/api.service';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  type: 'text' | 'voice';
}

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
  const [messages, setMessages] = useState<Message[]>([]);
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

  useEffect(() => {
    // Load messages from localStorage (privacy-first: client-side only)
    const savedMessages = localStorage.getItem('mindease_messages');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        })));
      } catch (e) {
        console.error('Failed to load messages:', e);
      }
    } else {
      // Add welcome message
      const welcomeMessage: Message = {
        id: 'welcome-1',
        content: "Hello! I'm MindEase, your AI companion for mental health support. I'm here to listen, provide emotional support, and help you on your wellness journey. How are you feeling today?",
        sender: 'assistant',
        timestamp: new Date(),
        type: 'text',
      };
      setMessages([welcomeMessage]);
    }

    // Check backend health
    apiService.healthCheck().catch(() => {
      console.warn('Backend health check failed');
    });
  }, []);

  useEffect(() => {
    // Save messages to localStorage (privacy-first: client-side only)
    if (messages.length > 0) {
      localStorage.setItem('mindease_messages', JSON.stringify(messages));
    }
  }, [messages]);

  const handleSendMessage = async (content: string, type: 'text' | 'voice') => {
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      content,
      sender: 'user',
      timestamp: new Date(),
      type,
    };

    setMessages(prev => [...prev, userMessage]);
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

      setMessages(prev => [...prev, aiResponse]);
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
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your conversation history? This cannot be undone.')) {
      setMessages([]);
      localStorage.removeItem('mindease_messages');
      
      // Add welcome message
      const welcomeMessage: Message = {
        id: 'welcome-1',
        content: "Hello! I'm MindEase, your AI companion for mental health support. I'm here to listen, provide emotional support, and help you on your wellness journey. How are you feeling today?",
        sender: 'assistant',
        timestamp: new Date(),
        type: 'text',
      };
      setMessages([welcomeMessage]);
    }
  };

  return (
    <Router>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
        <Navigation
          currentPage={currentPage}
          onNavigate={handleNavigate}
          userProfile={userProfile}
          onClearHistory={handleClearHistory}
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