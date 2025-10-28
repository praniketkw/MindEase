import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  Chip,
  Fade,
  Tooltip,
} from '@mui/material';
import {
  Send as SendIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
} from '@mui/icons-material';
import { ChatInterfaceProps } from '../interfaces/components';
import MessageComponent from './MessageComponent';
import VoiceInterface from './VoiceInterface';
import TypingIndicator from './TypingIndicator';

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
  voiceEnabled,
  onToggleVoice,
  emotionalInsights,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when not in voice mode
  useEffect(() => {
    if (!isVoiceMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVoiceMode]);

  const handleSendTextMessage = () => {
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim(), 'text');
      setInputValue('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendTextMessage();
    }
  };

  const handleVoiceInput = (audioBlob: Blob) => {
    setIsProcessingVoice(true);
    // Convert blob to base64 or handle as needed
    // For now, simulate voice processing
    setTimeout(() => {
      onSendMessage('Voice message processed', 'voice');
      setIsProcessingVoice(false);
    }, 2000);
  };

  const handleToggleVoiceMode = () => {
    setIsVoiceMode(!isVoiceMode);
    if (isListening) {
      setIsListening(false);
    }
  };

  const handlePlayAudio = (text: string) => {
    // Implement text-to-speech functionality
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: 2, 
          borderRadius: '12px 12px 0 0',
          background: 'linear-gradient(135deg, #2196f3 0%, #21cbf3 100%)',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="h1">
            MindEase Chat
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={voiceEnabled ? 'Voice enabled' : 'Voice disabled'}>
              <IconButton 
                onClick={onToggleVoice}
                sx={{ color: 'white' }}
                size="small"
              >
                {voiceEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
              </IconButton>
            </Tooltip>
            {emotionalInsights && (
              <Chip 
                label={`Mood: ${emotionalInsights.sentiment.positive > 0.6 ? 'Positive' : 
                       emotionalInsights.sentiment.negative > 0.6 ? 'Negative' : 'Neutral'}`}
                size="small"
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                }}
              />
            )}
          </Box>
        </Box>
      </Paper>

      {/* Messages Area */}
      <Paper 
        elevation={0}
        sx={{ 
          flex: 1, 
          overflow: 'auto',
          p: 2,
          backgroundColor: '#fafafa',
          borderRadius: 0,
        }}
      >
        <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
          {messages.map((message) => (
            <MessageComponent
              key={message.id}
              message={message}
              onPlayAudio={voiceEnabled ? handlePlayAudio : undefined}
              showEmotionalTone={true}
            />
          ))}
          
          {isLoading && (
            <Fade in={isLoading}>
              <Box>
                <TypingIndicator />
              </Box>
            </Fade>
          )}
          
          <div ref={messagesEndRef} />
        </Box>
      </Paper>

      {/* Input Area */}
      <Paper 
        elevation={2}
        sx={{ 
          p: 2,
          borderRadius: '0 0 12px 12px',
          backgroundColor: 'white',
        }}
      >
        <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
          {isVoiceMode ? (
            <VoiceInterface
              onVoiceInput={handleVoiceInput}
              onToggleListening={() => setIsListening(!isListening)}
              isListening={isListening}
              isProcessing={isProcessingVoice}
              isEnabled={voiceEnabled}
            />
          ) : (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
              <TextField
                ref={inputRef}
                fullWidth
                multiline
                maxRows={4}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Share your thoughts or feelings..."
                variant="outlined"
                disabled={isLoading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '20px',
                    backgroundColor: '#f8f9fa',
                  },
                }}
              />
              
              {voiceEnabled && (
                <Tooltip title={isVoiceMode ? 'Switch to text' : 'Switch to voice'}>
                  <IconButton
                    onClick={handleToggleVoiceMode}
                    color="primary"
                    sx={{ 
                      backgroundColor: isVoiceMode ? 'primary.main' : 'transparent',
                      color: isVoiceMode ? 'white' : 'primary.main',
                      '&:hover': {
                        backgroundColor: isVoiceMode ? 'primary.dark' : 'primary.light',
                      },
                    }}
                  >
                    {isVoiceMode ? <MicOffIcon /> : <MicIcon />}
                  </IconButton>
                </Tooltip>
              )}
              
              <Tooltip title="Send message">
                <span>
                  <IconButton
                    onClick={handleSendTextMessage}
                    disabled={!inputValue.trim() || isLoading}
                    color="primary"
                    sx={{
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                      '&:disabled': {
                        backgroundColor: 'grey.300',
                        color: 'grey.500',
                      },
                    }}
                  >
                    {isLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <SendIcon />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default ChatInterface;