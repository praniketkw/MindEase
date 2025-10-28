import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  TextField,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Security as SecurityIcon,
  VolumeUp as VolumeIcon,
  Language as LanguageIcon,
  Schedule as ScheduleIcon,
  Psychology as StyleIcon,
  Download as ExportIcon,
  DeleteForever as DeleteIcon,
  Shield as PrivacyIcon,
  Notifications as NotificationIcon,
  Palette as ThemeIcon,
  Accessibility as AccessibilityIcon,
} from '@mui/icons-material';
import { SettingsProps } from '../interfaces/components';
import { UserProfile, UserPreferences } from '../../../shared/types';

const SettingsPage: React.FC<SettingsProps> = ({
  userProfile,
  onUpdateProfile,
  onResetData,
  onExportData,
  isLoading,
}) => {
  const [preferences, setPreferences] = useState<UserPreferences>(userProfile.preferences);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState('');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [crisisContact, setCrisisContact] = useState(userProfile.preferences.crisisContactInfo || '');

  const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
    const updatedPreferences = { ...preferences, [key]: value };
    setPreferences(updatedPreferences);
    
    const updatedProfile: Partial<UserProfile> = {
      ...userProfile,
      preferences: updatedPreferences,
    };
    
    onUpdateProfile(updatedProfile);
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 3000);
  };

  const handleCrisisContactChange = (contact: string) => {
    setCrisisContact(contact);
    handlePreferenceChange('crisisContactInfo', contact);
  };

  const handleResetData = () => {
    if (resetConfirmation.toLowerCase() === 'delete my data') {
      onResetData();
      setShowResetDialog(false);
      setResetConfirmation('');
    }
  };

  const settingSections = [
    {
      title: 'Communication Preferences',
      icon: <VolumeIcon />,
      settings: [
        {
          key: 'voiceEnabled',
          label: 'Voice Input/Output',
          description: 'Enable voice recording and text-to-speech features',
          type: 'switch',
          value: preferences.voiceEnabled,
        },
        {
          key: 'language',
          label: 'Language',
          description: 'Choose your preferred language for communication',
          type: 'select',
          value: preferences.language,
          options: [
            { value: 'en', label: 'English' },
            { value: 'es', label: 'Español' },
            { value: 'fr', label: 'Français' },
            { value: 'de', label: 'Deutsch' },
            { value: 'zh', label: '中文' },
          ],
        },
        {
          key: 'communicationStyle',
          label: 'Communication Style',
          description: 'How would you like MindEase to communicate with you?',
          type: 'select',
          value: preferences.communicationStyle,
          options: [
            { value: 'casual', label: 'Casual & Friendly' },
            { value: 'formal', label: 'Professional & Formal' },
          ],
        },
      ],
    },
    {
      title: 'Check-in & Notifications',
      icon: <ScheduleIcon />,
      settings: [
        {
          key: 'checkInFrequency',
          label: 'Check-in Frequency',
          description: 'How often would you like MindEase to check in with you?',
          type: 'select',
          value: preferences.checkInFrequency,
          options: [
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'custom', label: 'Custom Schedule' },
          ],
        },
      ],
    },
    {
      title: 'Privacy & Safety',
      icon: <PrivacyIcon />,
      settings: [
        {
          key: 'crisisContactInfo',
          label: 'Emergency Contact',
          description: 'Optional: Add a trusted contact for crisis situations',
          type: 'text',
          value: crisisContact,
          placeholder: 'Phone number or email (optional)',
        },
      ],
    },
  ];

  return (
    <Box sx={{ maxWidth: '1000px', mx: 'auto', p: 2 }}>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Customize your MindEase experience and manage your privacy preferences.
        </Typography>
      </Paper>

      {/* Success Alert */}
      {showSuccessAlert && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings updated successfully!
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Settings Sections */}
        <Grid item xs={12} md={8}>
          {settingSections.map((section, sectionIndex) => (
            <Card key={sectionIndex} elevation={1} sx={{ mb: 3, borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {section.icon}
                  <Typography variant="h6" sx={{ ml: 1, fontWeight: 'bold' }}>
                    {section.title}
                  </Typography>
                </Box>

                <List>
                  {section.settings.map((setting, settingIndex) => (
                    <ListItem key={settingIndex} sx={{ px: 0 }}>
                      <ListItemText
                        primary={setting.label}
                        secondary={setting.description}
                      />
                      <ListItemSecondaryAction>
                        {setting.type === 'switch' && (
                          <FormControlLabel
                            control={
                              <Switch
                                checked={setting.value as boolean}
                                onChange={(e) => handlePreferenceChange(setting.key as keyof UserPreferences, e.target.checked)}
                                disabled={isLoading}
                              />
                            }
                            label=""
                          />
                        )}
                        
                        {setting.type === 'select' && (
                          <FormControl size="small" sx={{ minWidth: 150 }}>
                            <Select
                              value={setting.value}
                              onChange={(e) => handlePreferenceChange(setting.key as keyof UserPreferences, e.target.value)}
                              disabled={isLoading}
                            >
                              {setting.options?.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                        
                        {setting.type === 'text' && (
                          <TextField
                            size="small"
                            value={setting.value}
                            onChange={(e) => {
                              if (setting.key === 'crisisContactInfo') {
                                handleCrisisContactChange(e.target.value);
                              }
                            }}
                            placeholder={setting.placeholder}
                            disabled={isLoading}
                            sx={{ minWidth: 200 }}
                          />
                        )}
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          ))}
        </Grid>

        {/* Data Management Sidebar */}
        <Grid item xs={12} md={4}>
          <Card elevation={1} sx={{ borderRadius: 2, mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SecurityIcon />
                <Typography variant="h6" sx={{ ml: 1, fontWeight: 'bold' }}>
                  Data Management
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Manage your personal data and privacy settings.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<ExportIcon />}
                  onClick={onExportData}
                  disabled={isLoading}
                  fullWidth
                >
                  Export My Data
                </Button>
                
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setShowResetDialog(true)}
                  disabled={isLoading}
                  fullWidth
                >
                  Reset All Data
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Privacy Information */}
          <Card elevation={1} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PrivacyIcon />
                <Typography variant="h6" sx={{ ml: 1, fontWeight: 'bold' }}>
                  Privacy & Security
                </Typography>
              </Box>
              
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Chip label="✓" color="success" size="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Local Storage"
                    secondary="All data stored locally on your device"
                  />
                </ListItem>
                
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Chip label="✓" color="success" size="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="End-to-End Encryption"
                    secondary="Your conversations are encrypted"
                  />
                </ListItem>
                
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Chip label="✓" color="success" size="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="No Data Sharing"
                    secondary="We never share your personal data"
                  />
                </ListItem>
                
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Chip label="✓" color="success" size="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Full Control"
                    secondary="Delete or export your data anytime"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Reset Data Confirmation Dialog */}
      <Dialog
        open={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main' }}>
          Reset All Data
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            This action cannot be undone. All your conversations, journal entries, and settings will be permanently deleted.
          </Alert>
          
          <Typography variant="body2" sx={{ mb: 2 }}>
            To confirm, please type "delete my data" in the field below:
          </Typography>
          
          <TextField
            fullWidth
            value={resetConfirmation}
            onChange={(e) => setResetConfirmation(e.target.value)}
            placeholder="delete my data"
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResetDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleResetData}
            color="error"
            variant="contained"
            disabled={resetConfirmation.toLowerCase() !== 'delete my data'}
          >
            Delete All Data
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingsPage;