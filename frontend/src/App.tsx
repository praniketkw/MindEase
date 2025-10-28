import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container, Box } from '@mui/material';
import ChatInterface from './components/ChatInterface';
import JournalingInterface from './components/JournalingInterface';
import SettingsPage from './components/SettingsPage';
import CrisisSupportPage from './components/CrisisSupportPage';
import CheckInInterface from './components/CheckInInterface';
import MoodPatternChart from './components/MoodPatternChart';
import Navigation from './components/Navigation';
import { Message, UserProfile } from './types';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkInTrigger, setCheckInTrigger] = useState<'scheduled' | 'pattern_detected' | 'manual'>('manual');

  useEffect(() => {
    // Initialize user profile - in a real app this would come from API/storage
    const defaultProfile: UserProfile = {
      id: 'user-1',
      createdAt: new Date(),
      preferences: {
        voiceEnabled: true,
        language: 'en',
        checkInFrequency: 'weekly',
        communicationStyle: 'casual',
      },
      emotionalBaseline: {
        averageMood: 3,
        commonThemes: [],
        preferredCopingStrategies: [],
        riskFactors: [],
      },
      encryptionKey: 'temp-key',
    };
    setUserProfile(defaultProfile);

    // Add welcome message
    const welcomeMessage: Message = {
      id: 'welcome-1',
      content: "Hello! I'm MindEase, your AI companion for mental health support. I'm here to listen, provide emotional support, and help you on your wellness journey. How are you feeling today?",
      sender: 'assistant',
      timestamp: new Date(),
      type: 'text',
    };
    setMessages([welcomeMessage]);
  }, []);

  const handleSendMessage = async (content: string, type: 'text' | 'voice') => {
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      content,
      sender: 'user',
      timestamp: new Date(),
      type,
    };

    setMessages(prev => [...prev, userMessage]);

    // Simulate AI response - in real app this would call the backend API
    setTimeout(() => {
      const aiResponse: Message = {
        id: `ai-${Date.now()}`,
        content: "Thank you for sharing that with me. I'm here to listen and support you. Can you tell me more about how you're feeling?",
        sender: 'assistant',
        timestamp: new Date(),
        type: 'text',
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const handleCheckInRequest = (trigger: 'scheduled' | 'pattern_detected' | 'manual' = 'manual') => {
    setCheckInTrigger(trigger);
    setShowCheckIn(true);
  };

  const handleCheckInComplete = (results: any) => {
    console.log('Check-in completed:', results);
    setShowCheckIn(false);
    // Could show results or navigate to insights
  };

  const handleCheckInClose = () => {
    setShowCheckIn(false);
  };

  if (!userProfile) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navigation
          currentPage={currentPage}
          onNavigate={handleNavigate}
          userProfile={userProfile}
        />

        <Container maxWidth="lg" sx={{ flex: 1, py: 2 }}>
          <Routes>
            <Route
              path="/chat"
              element={
                <ChatInterface
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={false}
                  voiceEnabled={userProfile.preferences.voiceEnabled}
                  onToggleVoice={() => { }}
                />
              }
            />
            <Route
              path="/journal"
              element={
                <JournalingInterface
                  entries={[]}
                  onCreateEntry={() => { }}
                  onViewInsights={() => { }}
                  onDeleteEntry={() => { }}
                  isLoading={false}
                />
              }
            />
            <Route
              path="/settings"
              element={
                <SettingsPage
                  userProfile={userProfile}
                  onUpdateProfile={(updates) => {
                    if (userProfile) {
                      setUserProfile({ ...userProfile, ...updates });
                    }
                  }}
                  onResetData={() => { }}
                  onExportData={() => { }}
                  isLoading={false}
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
            <Route
              path="/check-in"
              element={
                <CheckInInterface
                  userId={userProfile.id}
                  onComplete={handleCheckInComplete}
                  onClose={() => handleNavigate('chat')}
                  triggeredBy={checkInTrigger}
                />
              }
            />
            <Route
              path="/mood-patterns"
              element={
                <MoodPatternChart
                  userId={userProfile.id}
                  onCheckInRequested={() => handleCheckInRequest('manual')}
                />
              }
            />
            <Route path="/" element={<Navigate to="/chat" replace />} />
          </Routes>
        </Container>
      </Box>
    </Router>
  );
};

export default App;