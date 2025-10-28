import React from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Chip,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Person as PersonIcon,
  Psychology as PsychologyIcon,
} from '@mui/icons-material';
import { MessageProps } from '../interfaces/components';

const MessageComponent: React.FC<MessageProps> = ({
  message,
  onPlayAudio,
  onReact,
  showEmotionalTone = false,
}) => {
  const isUser = message.sender === 'user';
  const isVoice = message.type === 'voice';

  const formatTime = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(timestamp);
  };

  const getEmotionalToneColor = () => {
    if (!message.emotionalTone) return 'default';
    
    const { sentiment } = message.emotionalTone;
    if (sentiment.positive > 0.6) return 'success';
    if (sentiment.negative > 0.6) return 'error';
    return 'default';
  };

  const getDominantEmotion = () => {
    if (!message.emotionalTone) return null;
    
    const emotions = message.emotionalTone.emotions;
    const maxEmotion = Object.entries(emotions).reduce((a, b) => 
      emotions[a[0] as keyof typeof emotions] > emotions[b[0] as keyof typeof emotions] ? a : b
    );
    
    return maxEmotion[1] > 0.3 ? maxEmotion[0] : null;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 2,
        alignItems: 'flex-start',
        gap: 1,
      }}
    >
      {!isUser && (
        <Avatar
          sx={{
            bgcolor: 'primary.main',
            width: 32,
            height: 32,
            mt: 0.5,
          }}
        >
          <PsychologyIcon fontSize="small" />
        </Avatar>
      )}

      <Box
        sx={{
          maxWidth: '70%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isUser ? 'flex-end' : 'flex-start',
        }}
      >
        <Paper
          elevation={1}
          sx={{
            p: 2,
            backgroundColor: isUser ? 'primary.main' : 'white',
            color: isUser ? 'white' : 'text.primary',
            borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
            position: 'relative',
            minWidth: '120px',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Typography
              variant="body1"
              sx={{
                flex: 1,
                wordBreak: 'break-word',
                lineHeight: 1.4,
              }}
            >
              {message.content}
            </Typography>

            {isVoice && onPlayAudio && (
              <Tooltip title="Play audio">
                <IconButton
                  size="small"
                  onClick={() => onPlayAudio(message.content)}
                  sx={{
                    color: isUser ? 'white' : 'primary.main',
                    ml: 1,
                  }}
                >
                  <PlayIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {/* Message metadata */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 1,
              gap: 1,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                opacity: 0.7,
                fontSize: '0.75rem',
              }}
            >
              {formatTime(message.timestamp)}
              {isVoice && ' • Voice'}
            </Typography>

            {showEmotionalTone && message.emotionalTone && getDominantEmotion() && (
              <Chip
                label={getDominantEmotion()}
                size="small"
                color={getEmotionalToneColor() as any}
                sx={{
                  height: '20px',
                  fontSize: '0.7rem',
                  opacity: 0.8,
                }}
              />
            )}
          </Box>
        </Paper>

        {/* Emotional insights for user messages */}
        {isUser && showEmotionalTone && message.emotionalTone && (
          <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {message.emotionalTone.keyPhrases.slice(0, 3).map((phrase, index) => (
              <Chip
                key={index}
                label={phrase}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: '0.7rem',
                  height: '20px',
                  opacity: 0.7,
                }}
              />
            ))}
          </Box>
        )}
      </Box>

      {isUser && (
        <Avatar
          sx={{
            bgcolor: 'secondary.main',
            width: 32,
            height: 32,
            mt: 0.5,
          }}
        >
          <PersonIcon fontSize="small" />
        </Avatar>
      )}
    </Box>
  );
};

export default MessageComponent;