import React from 'react';
import { Box, Avatar, Paper } from '@mui/material';
import { Psychology as PsychologyIcon } from '@mui/icons-material';

const TypingIndicator: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-start',
        mb: 2,
        alignItems: 'flex-start',
        gap: 1,
      }}
    >
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

      <Paper
        elevation={1}
        sx={{
          p: 2,
          backgroundColor: 'white',
          borderRadius: '20px 20px 20px 4px',
          minWidth: '80px',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          {[0, 1, 2].map((index) => (
            <Box
              key={index}
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: 'primary.main',
                opacity: 0.4,
                animation: 'typing 1.4s ease-in-out infinite',
                animationDelay: `${index * 0.2}s`,
                '@keyframes typing': {
                  '0%, 60%, 100%': {
                    transform: 'translateY(0)',
                    opacity: 0.4,
                  },
                  '30%': {
                    transform: 'translateY(-10px)',
                    opacity: 1,
                  },
                },
              }}
            />
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default TypingIndicator;