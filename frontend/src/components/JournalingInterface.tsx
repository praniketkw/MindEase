import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Chip,
  Grid,
  Tabs,
  Tab,
  InputAdornment,
  Tooltip,
  Fade,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Mic as MicIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  Insights as InsightsIcon,
  TrendingUp as TrendingUpIcon,
  Mood as MoodIcon,
  DateRange as DateRangeIcon,
} from '@mui/icons-material';
import { JournalingProps } from '../interfaces/components';
import { JournalEntry } from '../../../shared/types';
import VoiceInterface from './VoiceInterface';
import EmotionalInsightsChart from './EmotionalInsightsChart';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const JournalingInterface: React.FC<JournalingProps> = ({
  entries,
  onCreateEntry,
  onViewInsights,
  onDeleteEntry,
  isLoading,
  emotionalTrends,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [newEntryContent, setNewEntryContent] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingEntry, setIsCreatingEntry] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const textFieldRef = useRef<HTMLInputElement>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleCreateEntry = async () => {
    if (!newEntryContent.trim()) return;
    
    setIsCreatingEntry(true);
    try {
      await onCreateEntry(newEntryContent.trim(), 'text');
      setNewEntryContent('');
      setIsVoiceMode(false);
    } finally {
      setIsCreatingEntry(false);
    }
  };

  const handleVoiceEntry = async (audioBlob: Blob) => {
    setIsCreatingEntry(true);
    try {
      // In a real app, this would convert audio to text first
      await onCreateEntry('Voice journal entry processed', 'voice');
      setIsVoiceMode(false);
    } finally {
      setIsCreatingEntry(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && event.ctrlKey) {
      handleCreateEntry();
    }
  };

  const filteredEntries = entries.filter(entry =>
    entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.themes.some(theme => theme.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getMoodColor = (mood: number) => {
    if (mood >= 4) return 'success';
    if (mood >= 3) return 'warning';
    return 'error';
  };

  const getMoodEmoji = (mood: number) => {
    if (mood >= 4.5) return '😊';
    if (mood >= 3.5) return '🙂';
    if (mood >= 2.5) return '😐';
    if (mood >= 1.5) return '😔';
    return '😢';
  };

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', p: 2 }}>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Journal
          </Typography>
          <Button
            variant="contained"
            startIcon={<InsightsIcon />}
            onClick={() => {
              setShowInsights(!showInsights);
              onViewInsights();
            }}
            sx={{ borderRadius: 2 }}
          >
            {showInsights ? 'Hide' : 'Show'} Insights
          </Button>
        </Box>
        
        <Typography variant="body1" color="text.secondary">
          Express your thoughts and feelings. Track your emotional journey over time.
        </Typography>
      </Paper>

      {/* Emotional Insights */}
      <Fade in={showInsights}>
        <Box sx={{ mb: 3 }}>
          {emotionalTrends && (
            <EmotionalInsightsChart trends={emotionalTrends} />
          )}
        </Box>
      </Fade>

      {/* Tabs */}
      <Paper elevation={1} sx={{ borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="New Entry" icon={<AddIcon />} />
          <Tab label="Journal History" icon={<DateRangeIcon />} />
        </Tabs>

        {/* New Entry Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Create New Journal Entry
            </Typography>
            
            {!isVoiceMode ? (
              <Box sx={{ mb: 3 }}>
                <TextField
                  ref={textFieldRef}
                  fullWidth
                  multiline
                  rows={6}
                  value={newEntryContent}
                  onChange={(e) => setNewEntryContent(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="How are you feeling today? What's on your mind?"
                  variant="outlined"
                  disabled={isCreatingEntry}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title="Switch to voice input">
                          <IconButton
                            onClick={() => setIsVoiceMode(true)}
                            edge="end"
                          >
                            <MicIcon />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Press Ctrl+Enter to save quickly
                  </Typography>
                  
                  <Button
                    variant="contained"
                    onClick={handleCreateEntry}
                    disabled={!newEntryContent.trim() || isCreatingEntry}
                    startIcon={isCreatingEntry ? <CircularProgress size={16} /> : <AddIcon />}
                    sx={{ borderRadius: 2 }}
                  >
                    {isCreatingEntry ? 'Saving...' : 'Save Entry'}
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box sx={{ mb: 3 }}>
                <VoiceInterface
                  onVoiceInput={handleVoiceEntry}
                  onToggleListening={() => {}}
                  isListening={false}
                  isProcessing={isCreatingEntry}
                  isEnabled={true}
                />
                
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setIsVoiceMode(false)}
                    disabled={isCreatingEntry}
                  >
                    Switch to Text
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* Journal History Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Your Journal Entries ({entries.length})
              </Typography>
              
              <TextField
                size="small"
                placeholder="Search entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: '250px' }}
              />
            </Box>

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : filteredEntries.length === 0 ? (
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  backgroundColor: 'grey.50',
                  borderRadius: 2,
                }}
              >
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {entries.length === 0 ? 'No journal entries yet' : 'No entries match your search'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {entries.length === 0 
                    ? 'Start by creating your first journal entry above.'
                    : 'Try adjusting your search terms.'}
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={2}>
                {filteredEntries.map((entry) => (
                  <Grid item xs={12} md={6} key={entry.id}>
                    <Card
                      elevation={1}
                      sx={{
                        borderRadius: 2,
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 3,
                        },
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(entry.timestamp)}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              icon={<MoodIcon />}
                              label={`${getMoodEmoji(entry.mood)} ${entry.mood.toFixed(1)}`}
                              size="small"
                              color={getMoodColor(entry.mood) as any}
                              variant="outlined"
                            />
                            {entry.contentType === 'voice' && (
                              <Chip
                                icon={<MicIcon />}
                                label="Voice"
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </Box>

                        <Typography
                          variant="body2"
                          sx={{
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.5,
                          }}
                        >
                          {entry.content}
                        </Typography>

                        {entry.themes.length > 0 && (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                            {entry.themes.slice(0, 3).map((theme, index) => (
                              <Chip
                                key={index}
                                label={theme}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            ))}
                            {entry.themes.length > 3 && (
                              <Chip
                                label={`+${entry.themes.length - 3} more`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', opacity: 0.7 }}
                              />
                            )}
                          </Box>
                        )}

                        {entry.emotionalAnalysis && (
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {entry.emotionalAnalysis.keyPhrases.slice(0, 2).map((phrase, index) => (
                              <Chip
                                key={index}
                                label={phrase}
                                size="small"
                                sx={{
                                  fontSize: '0.65rem',
                                  height: '20px',
                                  backgroundColor: 'primary.light',
                                  color: 'primary.contrastText',
                                }}
                              />
                            ))}
                          </Box>
                        )}
                      </CardContent>

                      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                        <Button
                          size="small"
                          startIcon={<TrendingUpIcon />}
                          onClick={() => onViewInsights()}
                        >
                          View Insights
                        </Button>
                        
                        <Tooltip title="Delete entry">
                          <IconButton
                            size="small"
                            onClick={() => onDeleteEntry(entry.id)}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default JournalingInterface;