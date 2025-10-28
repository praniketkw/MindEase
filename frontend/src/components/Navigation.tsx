import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Badge,
  Tooltip,
  Avatar,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Book as JournalIcon,
  Settings as SettingsIcon,
  LocalHospital as EmergencyIcon,
  Person as PersonIcon,
  Psychology as CheckInIcon,
  TrendingUp as MoodIcon,
} from '@mui/icons-material';
import { NavigationProps } from '../interfaces/components';

const Navigation: React.FC<NavigationProps> = ({
  currentPage,
  onNavigate,
  unreadNotifications = 0,
  userProfile,
}) => {
  const navigationItems = [
    {
      id: 'chat',
      label: 'Chat',
      icon: <ChatIcon />,
      path: '/chat',
    },
    {
      id: 'journal',
      label: 'Journal',
      icon: <JournalIcon />,
      path: '/journal',
    },
    {
      id: 'check-in',
      label: 'Check-in',
      icon: <CheckInIcon />,
      path: '/check-in',
    },
    {
      id: 'mood-patterns',
      label: 'Mood Patterns',
      icon: <MoodIcon />,
      path: '/mood-patterns',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <SettingsIcon />,
      path: '/settings',
    },
    {
      id: 'crisis-support',
      label: 'Crisis Support',
      icon: <EmergencyIcon />,
      path: '/crisis-support',
      urgent: true,
    },
  ];

  const handleNavigation = (itemId: string) => {
    onNavigate(itemId);
    // In a real app, you'd use React Router's navigate here
    window.history.pushState({}, '', navigationItems.find(item => item.id === itemId)?.path || '/');
  };

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{ 
        backgroundColor: 'white',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Logo and Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #2196f3 0%, #21cbf3 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            MindEase
          </Typography>
        </Box>

        {/* Navigation Items */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {navigationItems.map((item) => (
            <Tooltip key={item.id} title={item.label}>
              <IconButton
                onClick={() => handleNavigation(item.id)}
                sx={{
                  color: currentPage === item.id ? 'primary.main' : 'text.secondary',
                  backgroundColor: currentPage === item.id ? 'primary.light' : 'transparent',
                  '&:hover': {
                    backgroundColor: item.urgent ? 'error.light' : 'primary.light',
                    color: item.urgent ? 'error.main' : 'primary.main',
                  },
                  ...(item.urgent && {
                    color: 'error.main',
                    '&:hover': {
                      backgroundColor: 'error.light',
                    },
                  }),
                }}
              >
                {item.id === 'crisis-support' && unreadNotifications > 0 ? (
                  <Badge badgeContent={unreadNotifications} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </IconButton>
            </Tooltip>
          ))}

          {/* User Profile */}
          {userProfile && (
            <Tooltip title="User Profile">
              <IconButton
                sx={{
                  ml: 2,
                  color: 'text.secondary',
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    backgroundColor: 'secondary.main',
                  }}
                >
                  <PersonIcon fontSize="small" />
                </Avatar>
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;