import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  List,
  ListItemButton,
} from '@mui/material';
import {
  Chat as ChatIcon,
  LocalHospital as EmergencyIcon,
  MoreVert as MoreIcon,
  DeleteForever as ClearIcon,
  Info as InfoIcon,
  Psychology as PsychologyIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Conversation } from '../types/conversation';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  unreadNotifications?: number;
  userProfile: any;
  conversations: Conversation[];
  activeConversationId: string | null;
  onNewConversation: () => void;
  onSwitchConversation: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
  onClearAllHistory: () => void;
}

const Navigation: React.FC<NavigationProps> = ({
  currentPage,
  onNavigate,
  conversations,
  activeConversationId,
  onNewConversation,
  onSwitchConversation,
  onDeleteConversation,
  onClearAllHistory,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [conversationsAnchorEl, setConversationsAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleConversationsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setConversationsAnchorEl(event.currentTarget);
  };

  const handleConversationsMenuClose = () => {
    setConversationsAnchorEl(null);
  };

  const handleNewConversationClick = () => {
    handleConversationsMenuClose();
    onNewConversation();
  };

  const handleSwitchConversation = (conversationId: string) => {
    handleConversationsMenuClose();
    onSwitchConversation(conversationId);
  };

  const handleDeleteConversation = (conversationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onDeleteConversation(conversationId);
  };

  const handleClearAllHistoryClick = () => {
    handleMenuClose();
    onClearAllHistory();
  };

  const handleAboutClick = () => {
    handleMenuClose();
    alert('MindEase v2.0\n\nA privacy-first mental health companion powered by Anthropic Claude 3.5 Haiku.\n\nYour conversations are stored only on your device and never sent to our servers.\n\nIn crisis? Call 988 or text HOME to 741741.');
  };

  return (
    <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid #e2e8f0' }}>
      <Toolbar sx={{ justifyContent: 'space-between', py: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.25)',
            }}
          >
            <PsychologyIcon sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 700, color: '#1a202c', letterSpacing: '-0.02em', fontSize: '1.25rem' }}>
              MindEase
            </Typography>
            <Chip
              label="Privacy-First"
              size="small"
              sx={{
                height: 20,
                fontSize: '0.7rem',
                fontWeight: 600,
                bgcolor: '#dcfce7',
                color: '#166534',
                border: '1px solid #bbf7d0',
              }}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Conversations" arrow>
            <IconButton
              onClick={handleConversationsMenuOpen}
              sx={{
                color: '#64748b',
                '&:hover': { bgcolor: '#f1f5f9' },
              }}
            >
              <ChatIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="New Conversation" arrow>
            <IconButton
              onClick={onNewConversation}
              sx={{
                color: '#6366f1',
                bgcolor: '#eef2ff',
                '&:hover': { bgcolor: '#e0e7ff' },
              }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Crisis Support - Available 24/7" arrow>
            <IconButton
              onClick={() => onNavigate('crisis-support')}
              sx={{
                color: '#dc2626',
                bgcolor: currentPage === 'crisis-support' ? '#fee2e2' : '#fef2f2',
                border: '1px solid #fecaca',
                '&:hover': { bgcolor: '#fee2e2' },
              }}
            >
              <EmergencyIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Menu" arrow>
            <IconButton onClick={handleMenuOpen} sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}>
              <MoreIcon />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={conversationsAnchorEl}
            open={Boolean(conversationsAnchorEl)}
            onClose={handleConversationsMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: {
                mt: 1,
                borderRadius: 2,
                minWidth: 300,
                maxHeight: 400,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid #e2e8f0',
              },
            }}
          >
            <MenuItem onClick={handleNewConversationClick}>
              <ListItemIcon>
                <AddIcon fontSize="small" sx={{ color: '#6366f1' }} />
              </ListItemIcon>
              <ListItemText>New Conversation</ListItemText>
            </MenuItem>
            <Divider />
            <List dense sx={{ py: 0 }}>
              {conversations.map((conv) => (
                <ListItemButton
                  key={conv.id}
                  selected={conv.id === activeConversationId}
                  onClick={() => handleSwitchConversation(conv.id)}
                  sx={{
                    py: 1,
                    '&.Mui-selected': {
                      bgcolor: '#eef2ff',
                    },
                  }}
                >
                  <ListItemText
                    primary={conv.title}
                    secondary={new Date(conv.lastActive).toLocaleDateString()}
                    primaryTypographyProps={{
                      noWrap: true,
                      fontSize: '0.875rem',
                    }}
                    secondaryTypographyProps={{
                      fontSize: '0.75rem',
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    sx={{ ml: 1 }}
                  >
                    <DeleteIcon fontSize="small" sx={{ color: '#dc2626' }} />
                  </IconButton>
                </ListItemButton>
              ))}
            </List>
          </Menu>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: {
                mt: 1,
                borderRadius: 2,
                minWidth: 200,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid #e2e8f0',
              },
            }}
          >
            <MenuItem onClick={handleClearAllHistoryClick}>
              <ListItemIcon>
                <ClearIcon fontSize="small" sx={{ color: '#dc2626' }} />
              </ListItemIcon>
              <ListItemText>Clear All History</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleAboutClick}>
              <ListItemIcon>
                <InfoIcon fontSize="small" sx={{ color: '#6366f1' }} />
              </ListItemIcon>
              <ListItemText>About & Privacy</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
