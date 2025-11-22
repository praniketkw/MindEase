import React from 'react';
import { Box } from '@mui/material';

const TypingIndicator: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 0.75,
        alignItems: 'center',
        py: 0.5,
      }}
    >
      {[0, 1, 2].map((index) => (
        <Box
          key={index}
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#6366f1',
            animation: 'bounce 1.4s infinite ease-in-out',
            animationDelay: `${index * 0.16}s`,
            '@keyframes bounce': {
              '0%, 80%, 100%': {
                transform: 'scale(0.8)',
                opacity: 0.5,
              },
              '40%': {
                transform: 'scale(1.2)',
                opacity: 1,
              },
            },
          }}
        />
      ))}
    </Box>
  );
};

export default TypingIndicator;
