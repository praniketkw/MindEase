import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Slider,
  LinearProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Mood,
  Psychology,
  TrendingUp,
  TrendingDown,
  Schedule,
  CheckCircle
} from '@mui/icons-material';

interface CheckInSession {
  id: string;
  triggeredBy: 'scheduled' | 'pattern_detected' | 'manual';
  concerningPatterns?: string[];
}

interface CheckInQuestion {
  id: number;
  text: string;
  type: 'scale' | 'text';
}

interface CheckInInsight {
  type: 'positive' | 'neutral' | 'concerning';
  message: string;
}

interface CheckInRecommendation {
  title: string;
  description: string;
  action?: string;
}

interface CheckInInterfaceProps {
  userId: string;
  onComplete?: (results: any) => void;
  onClose?: () => void;
  triggeredBy?: 'scheduled' | 'pattern_detected' | 'manual';
  concerningPatterns?: string[];
}

const CheckInInterface: React.FC<CheckInInterfaceProps> = ({
  userId,
  onComplete,
  onClose,
  triggeredBy = 'manual',
  concerningPatterns
}) => {
  const [session, setSession] = useState<CheckInSession | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<{ [key: string]: string }>({});
  const [moodScore, setMoodScore] = useState<number>(3);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [followUpNeeded, setFollowUpNeeded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCheckIn();
  }, []);

  const startCheckIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/check-in/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId
        },
        body: JSON.stringify({
          triggeredBy,
          concerningPatterns
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start check-in');
      }

      const data = await response.json();
      setSession(data.session);
      setQuestions(data.questions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start check-in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponse = async (answer: string) => {
    if (!session || !questions[currentQuestionIndex]) return;

    const question = questions[currentQuestionIndex];
    setResponses(prev => ({ ...prev, [question]: answer }));

    try {
      await fetch(`/api/check-in/${session.id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId
        },
        body: JSON.stringify({
          question,
          answer
        })
      });

      // Move to next question or complete
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        await completeCheckIn();
      }
    } catch (err) {
      setError('Failed to save response');
    }
  };

  const completeCheckIn = async () => {
    if (!session) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/check-in/${session.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId
        }
      });

      if (!response.ok) {
        throw new Error('Failed to complete check-in');
      }

      const data = await response.json();
      setInsights(data.insights);
      setRecommendations(data.recommendations);
      setFollowUpNeeded(data.followUpNeeded);
      setIsComplete(true);

      if (onComplete) {
        onComplete(data);
      }
    } catch (err) {
      setError('Failed to complete check-in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoodChange = (event: Event, newValue: number | number[]) => {
    setMoodScore(newValue as number);
  };

  const handleTextResponse = (value: string) => {
    handleResponse(value);
  };

  const handleScaleResponse = () => {
    handleResponse(moodScore.toString());
  };

  const getMoodLabel = (value: number): string => {
    const labels = ['Very Low', 'Low', 'Neutral', 'Good', 'Very Good'];
    return labels[value - 1] || 'Neutral';
  };

  const getMoodColor = (value: number): string => {
    if (value <= 2) return '#f44336'; // Red
    if (value === 3) return '#ff9800'; // Orange
    return '#4caf50'; // Green
  };

  const getProgressPercentage = (): number => {
    if (questions.length === 0) return 0;
    return ((currentQuestionIndex + 1) / questions.length) * 100;
  };

  const renderCurrentQuestion = () => {
    if (!questions[currentQuestionIndex]) return null;

    const question = questions[currentQuestionIndex];
    const isScaleQuestion = question.includes('scale of 1-5') || question.includes('feeling today');

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Typography>
          
          <LinearProgress 
            variant="determinate" 
            value={getProgressPercentage()} 
            sx={{ mb: 3 }}
          />

          <Typography variant="body1" sx={{ mb: 3 }}>
            {question}
          </Typography>

          {isScaleQuestion ? (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current mood: {getMoodLabel(moodScore)}
              </Typography>
              
              <Slider
                value={moodScore}
                onChange={handleMoodChange}
                min={1}
                max={5}
                step={1}
                marks={[
                  { value: 1, label: '1' },
                  { value: 2, label: '2' },
                  { value: 3, label: '3' },
                  { value: 4, label: '4' },
                  { value: 5, label: '5' }
                ]}
                sx={{
                  color: getMoodColor(moodScore),
                  mb: 3
                }}
              />
              
              <Button
                variant="contained"
                onClick={handleScaleResponse}
                fullWidth
                startIcon={<Mood />}
              >
                Continue
              </Button>
            </Box>
          ) : (
            <TextResponseInput onSubmit={handleTextResponse} />
          )}
        </CardContent>
      </Card>
    );
  };

  const renderResults = () => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <CheckCircle color="success" sx={{ mr: 1 }} />
          <Typography variant="h5">Check-in Complete</Typography>
        </Box>

        {insights.length > 0 && (
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Insights
            </Typography>
            {insights.map((insight, index) => (
              <Alert 
                key={index} 
                severity={followUpNeeded ? "warning" : "info"} 
                sx={{ mb: 1 }}
              >
                {insight}
              </Alert>
            ))}
          </Box>
        )}

        {recommendations.length > 0 && (
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Recommendations
            </Typography>
            <List>
              {recommendations.map((recommendation, index) => (
                <ListItem key={index}>
                  <ListItemText primary={recommendation} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {followUpNeeded && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Based on your responses, we recommend continuing our conversations and considering additional support resources.
          </Alert>
        )}

        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            onClick={onClose}
            fullWidth
          >
            Close
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  const renderConcerningPatterns = () => {
    if (!concerningPatterns || concerningPatterns.length === 0) return null;

    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2" gutterBottom>
          This check-in was triggered because we noticed:
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {concerningPatterns.map((pattern, index) => (
            <Chip 
              key={index} 
              label={pattern.replace('_', ' ')} 
              size="small" 
              color="primary" 
            />
          ))}
        </Box>
      </Alert>
    );
  };

  if (isLoading && !session) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <LinearProgress sx={{ width: '100%' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={startCheckIn}>
          Retry
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  return (
    <Box maxWidth="md" mx="auto" p={2}>
      <Typography variant="h4" gutterBottom align="center">
        Mental Health Check-in
      </Typography>

      {renderConcerningPatterns()}

      {isComplete ? renderResults() : renderCurrentQuestion()}
    </Box>
  );
};

interface TextResponseInputProps {
  onSubmit: (value: string) => void;
}

const TextResponseInput: React.FC<TextResponseInputProps> = ({ onSubmit }) => {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value.trim());
      setValue('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Box>
      <TextField
        fullWidth
        multiline
        rows={3}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Share your thoughts..."
        variant="outlined"
        sx={{ mb: 2 }}
      />
      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={!value.trim()}
        fullWidth
        startIcon={<Psychology />}
      >
        Continue
      </Button>
    </Box>
  );
};

export default CheckInInterface;