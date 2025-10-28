import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Mood,
  Psychology,
  Schedule
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface MoodPattern {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  averageMood: number;
  moodTrend: 'improving' | 'stable' | 'declining';
  concerningIndicators: string[];
  lastAnalyzed: Date;
}

interface MoodDataPoint {
  date: string;
  mood: number;
  stress: number;
  label: string;
}

interface CheckInTrigger {
  type: 'mood_decline' | 'stress_spike' | 'inactivity' | 'concerning_language' | 'scheduled';
  severity: 'low' | 'medium' | 'high';
  description: string;
  threshold: number;
}

interface MoodPatternChartProps {
  userId: string;
  onCheckInRequested?: () => void;
}

const MoodPatternChart: React.FC<MoodPatternChartProps> = ({
  userId,
  onCheckInRequested
}) => {
  const [moodPattern, setMoodPattern] = useState<MoodPattern | null>(null);
  const [triggers, setTriggers] = useState<CheckInTrigger[]>([]);
  const [moodData, setMoodData] = useState<MoodDataPoint[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(30);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMoodPattern();
    analyzeTriggers();
  }, [userId, selectedPeriod]);

  const loadMoodPattern = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/check-in/mood-pattern?days=${selectedPeriod}`, {
        headers: {
          'user-id': userId
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load mood pattern');
      }

      const data = await response.json();
      setMoodPattern(data.moodPattern);
      
      // Generate sample mood data for visualization
      // In a real app, this would come from actual check-in data
      generateMoodData(data.moodPattern);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mood pattern');
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeTriggers = async () => {
    try {
      const response = await fetch('/api/check-in/analyze-patterns', {
        headers: {
          'user-id': userId
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTriggers(data.triggers || []);
      }
    } catch (err) {
      console.error('Failed to analyze triggers:', err);
    }
  };

  const generateMoodData = (pattern: MoodPattern) => {
    // Generate sample data points for the chart
    const data: MoodDataPoint[] = [];
    const days = selectedPeriod;
    const baselineMood = pattern.averageMood;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Generate mood with some variation around baseline
      let mood = baselineMood + (Math.random() - 0.5) * 2;
      
      // Apply trend
      if (pattern.moodTrend === 'improving') {
        mood += (days - i) * 0.02;
      } else if (pattern.moodTrend === 'declining') {
        mood -= (days - i) * 0.02;
      }
      
      mood = Math.max(1, Math.min(5, mood));
      
      // Generate stress level (inverse correlation with mood)
      const stress = Math.max(1, Math.min(5, 6 - mood + (Math.random() - 0.5)));
      
      data.push({
        date: date.toISOString().split('T')[0],
        mood: Math.round(mood * 10) / 10,
        stress: Math.round(stress * 10) / 10,
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    
    setMoodData(data);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp color="success" />;
      case 'declining':
        return <TrendingDown color="error" />;
      default:
        return <TrendingFlat color="action" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'success';
      case 'declining':
        return 'error';
      default:
        return 'default';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getMoodLabel = (mood: number): string => {
    if (mood >= 4.5) return 'Very Good';
    if (mood >= 3.5) return 'Good';
    if (mood >= 2.5) return 'Neutral';
    if (mood >= 1.5) return 'Low';
    return 'Very Low';
  };

  const handleCheckInRequest = () => {
    if (onCheckInRequested) {
      onCheckInRequested();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Typography>Loading mood pattern...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  if (!moodPattern) {
    return (
      <Alert severity="info">
        No mood pattern data available. Complete a few check-ins to see your trends.
      </Alert>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Pattern Summary */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Mood Pattern Summary
              </Typography>
              
              <Box display="flex" alignItems="center" mb={2}>
                <Mood sx={{ mr: 1, color: moodPattern.averageMood >= 3 ? 'success.main' : 'warning.main' }} />
                <Typography variant="body1">
                  Average Mood: {getMoodLabel(moodPattern.averageMood)} ({moodPattern.averageMood.toFixed(1)}/5)
                </Typography>
              </Box>

              <Box display="flex" alignItems="center" mb={2}>
                {getTrendIcon(moodPattern.moodTrend)}
                <Chip 
                  label={moodPattern.moodTrend.charAt(0).toUpperCase() + moodPattern.moodTrend.slice(1)}
                  color={getTrendColor(moodPattern.moodTrend) as any}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Box>

              <FormControl size="small" sx={{ minWidth: 120, mb: 2 }}>
                <InputLabel>Time Period</InputLabel>
                <Select
                  value={selectedPeriod}
                  label="Time Period"
                  onChange={(e) => setSelectedPeriod(e.target.value as number)}
                >
                  <MenuItem value={7}>Last 7 days</MenuItem>
                  <MenuItem value={30}>Last 30 days</MenuItem>
                  <MenuItem value={90}>Last 3 months</MenuItem>
                </Select>
              </FormControl>

              {moodPattern.concerningIndicators.length > 0 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Areas of attention:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {moodPattern.concerningIndicators.map((indicator, index) => (
                      <Chip 
                        key={index}
                        label={indicator}
                        size="small"
                        color="warning"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Triggers and Recommendations */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Check-in Recommendations
              </Typography>

              {triggers.length > 0 ? (
                <Box>
                  {triggers.map((trigger, index) => (
                    <Alert 
                      key={index}
                      severity={getSeverityColor(trigger.severity) as any}
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="body2">
                        {trigger.description}
                      </Typography>
                    </Alert>
                  ))}
                  
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleCheckInRequest}
                    startIcon={<Psychology />}
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    Start Check-in Now
                  </Button>
                </Box>
              ) : (
                <Box>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Your patterns look stable. Keep up the good work!
                  </Alert>
                  
                  <Button
                    variant="outlined"
                    onClick={handleCheckInRequest}
                    startIcon={<Schedule />}
                    fullWidth
                  >
                    Optional Check-in
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Mood Chart */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Mood & Stress Trends
              </Typography>
              
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={moodData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    domain={[1, 5]}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `${value}/5`,
                      name === 'mood' ? 'Mood' : 'Stress'
                    ]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="mood" 
                    stroke="#4caf50" 
                    strokeWidth={2}
                    dot={{ fill: '#4caf50', strokeWidth: 2, r: 4 }}
                    name="mood"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="stress" 
                    stroke="#f44336" 
                    strokeWidth={2}
                    dot={{ fill: '#f44336', strokeWidth: 2, r: 4 }}
                    name="stress"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MoodPatternChart;