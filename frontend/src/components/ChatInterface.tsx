import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  Fade,
  Container,
  Avatar,
} from '@mui/material';
import {
  Send as SendIcon,
  Psychology as PsychologyIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import TypingIndicator from './TypingIndicator';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  type: 'text' | 'voice';
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string, type: 'text' | 'voice') => void;
  isLoading: boolean;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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

  return (
    <Box 
      sx={{ 
        height: 'calc(100vh - 70px)',
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: '#f8f9fa',
      }}
    >
      {/* Messages Area */}
      <Box 
        sx={{ 
          flex: 1, 
          overflow: 'auto',
          py: 4,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#cbd5e0',
            borderRadius: '10px',
            '&:hover': {
              background: '#a0aec0',
            },
          },
        }}
      >
        <Container maxWidth="md">
          {messages.length === 0 && (
            <Fade in timeout={800}>
              <Box
                sx={{
                  textAlign: 'center',
                  py: 12,
                }}
              >
                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: '30px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 4,
                    boxShadow: '0 20px 60px rgba(99, 102, 241, 0.3)',
                  }}
                >
                  <PsychologyIcon sx={{ fontSize: 60, color: 'white' }} />
                </Box>
                <Typography 
                  variant="h3" 
                  sx={{ 
                    mb: 2, 
                    fontWeight: 700,
                    color: '#1a202c',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Welcome to MindEase
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: '#64748b', 
                    maxWidth: 600, 
                    mx: 'auto',
                    fontWeight: 400,
                    lineHeight: 1.6,
                  }}
                >
                  A safe space to share your thoughts and feelings. I'm here to listen and support you.
                </Typography>
                <Box
                  sx={{
                    mt: 4,
                    display: 'flex',
                    gap: 2,
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <Paper
                    sx={{
                      px: 3,
                      py: 1.5,
                      borderRadius: '12px',
                      bgcolor: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
                      🔒 100% Private
                    </Typography>
                  </Paper>
                  <Paper
                    sx={{
                      px: 3,
                      py: 1.5,
                      borderRadius: '12px',
                      bgcolor: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
                      🤖 AI-Powered
                    </Typography>
                  </Paper>
                  <Paper
                    sx={{
                      px: 3,
                      py: 1.5,
                      borderRadius: '12px',
                      bgcolor: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
                      💙 Always Here
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            </Fade>
          )}

          {messages.map((message) => (
            <Fade in key={message.id} timeout={400}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                  mb: 3,
                  gap: 2,
                }}
              >
                {message.sender === 'assistant' && (
                  <Avatar
                    sx={{
                      bgcolor: '#6366f1',
                      width: 40,
                      height: 40,
                      boxShadow: '0 4px 14px rgba(99, 102, 241, 0.25)',
                    }}
                  >
                    <PsychologyIcon sx={{ fontSize: 24 }} />
                  </Avatar>
                )}

                <Paper
                  elevation={0}
                  sx={{
                    maxWidth: '75%',
                    px: 3,
                    py: 2,
                    borderRadius: message.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    backgroundColor: message.sender === 'user' 
                      ? '#6366f1'
                      : 'white',
                    color: message.sender === 'user' ? 'white' : '#1a202c',
                    border: message.sender === 'assistant' ? '1px solid #e2e8f0' : 'none',
                    boxShadow: message.sender === 'user' 
                      ? '0 4px 14px rgba(99, 102, 241, 0.25)'
                      : '0 2px 8px rgba(0, 0, 0, 0.04)',
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      lineHeight: 1.7,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontSize: '0.95rem',
                    }}
                  >
                    {message.content}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 1,
                      opacity: 0.7,
                      fontSize: '0.75rem',
                    }}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Typography>
                </Paper>

                {message.sender === 'user' && (
                  <Avatar
                    sx={{
                      bgcolor: '#8b5cf6',
                      width: 40,
                      height: 40,
                      boxShadow: '0 4px 14px rgba(139, 92, 246, 0.25)',
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 24 }} />
                  </Avatar>
                )}
              </Box>
            </Fade>
          ))}
          
          {isLoading && (
            <Fade in timeout={300}>
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Avatar
                  sx={{
                    bgcolor: '#6366f1',
                    width: 40,
                    height: 40,
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.25)',
                  }}
                >
                  <PsychologyIcon sx={{ fontSize: 24 }} />
                </Avatar>
                <Paper
                  elevation={0}
                  sx={{
                    px: 3,
                    py: 2,
                    borderRadius: '20px 20px 20px 4px',
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  }}
                >
                  <TypingIndicator />
                </Paper>
              </Box>
            </Fade>
          )}
          
          <div ref={messagesEndRef} />
        </Container>
      </Box>

      {/* Input Area */}
      <Paper 
        elevation={0}
        sx={{ 
          borderTop: '1px solid #e2e8f0',
          bgcolor: 'white',
        }}
      >
        <Container maxWidth="md" sx={{ py: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
            <TextField
              inputRef={inputRef}
              fullWidth
              multiline
              maxRows={4}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              variant="outlined"
              disabled={isLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '16px',
                  backgroundColor: '#f8f9fa',
                  fontSize: '0.95rem',
                  '& fieldset': {
                    borderColor: '#e2e8f0',
                    borderWidth: '1px',
                  },
                  '&:hover fieldset': {
                    borderColor: '#cbd5e0',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#6366f1',
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputBase-input': {
                  py: 1.5,
                  px: 2,
                },
              }}
            />
            
            <IconButton
              onClick={handleSendTextMessage}
              disabled={!inputValue.trim() || isLoading}
              sx={{
                width: 48,
                height: 48,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  transform: 'scale(1.05)',
                },
                '&:disabled': {
                  background: '#e2e8f0',
                  color: '#94a3b8',
                },
                transition: 'all 0.2s',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.25)',
              }}
            >
              {isLoading ? (
                <CircularProgress size={20} sx={{ color: 'white' }} />
              ) : (
                <SendIcon sx={{ fontSize: 20 }} />
              )}
            </IconButton>
          </Box>

          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 2,
              textAlign: 'center',
              color: '#94a3b8',
              fontSize: '0.75rem',
            }}
          >
            🔒 Your conversations are private and stored only on your device
          </Typography>
        </Container>
      </Paper>
    </Box>
  );
};

export default ChatInterface;
