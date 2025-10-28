import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { EmotionalTrendsData } from '../interfaces/components';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface EmotionalInsightsChartProps {
  trends: EmotionalTrendsData;
}

const EmotionalInsightsChart: React.FC<EmotionalInsightsChartProps> = ({ trends }) => {
  // Mood over time chart data
  const moodChartData = {
    labels: trends.moodOverTime.map(point => 
      new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ),
    datasets: [
      {
        label: 'Mood Score',
        data: trends.moodOverTime.map(point => point.mood),
        borderColor: '#2196f3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#2196f3',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  const moodChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Mood Trend Over Time',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
        ticks: {
          stepSize: 1,
          callback: function(value: any) {
            const labels = ['😢', '😔', '😐', '🙂', '😊'];
            return labels[value - 1] || value;
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  // Emotion distribution chart data
  const emotionChartData = {
    labels: trends.dominantEmotions.map(emotion => 
      emotion.emotion.charAt(0).toUpperCase() + emotion.emotion.slice(1)
    ),
    datasets: [
      {
        data: trends.dominantEmotions.map(emotion => emotion.frequency),
        backgroundColor: trends.dominantEmotions.map(emotion => emotion.color),
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const emotionChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: 'Emotion Distribution',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
    },
  };

  const getThemeColor = (sentiment: 'positive' | 'neutral' | 'negative') => {
    switch (sentiment) {
      case 'positive': return 'success';
      case 'negative': return 'error';
      default: return 'default';
    }
  };

  return (
    <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Emotional Insights
      </Typography>

      <Grid container spacing={3}>
        {/* Mood Trend Chart */}
        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ height: '300px', backgroundColor: 'grey.50' }}>
            <CardContent sx={{ height: '100%', p: 2 }}>
              <Box sx={{ height: '100%' }}>
                <Line data={moodChartData} options={moodChartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Emotion Distribution */}
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ height: '300px', backgroundColor: 'grey.50' }}>
            <CardContent sx={{ height: '100%', p: 2 }}>
              <Box sx={{ height: '100%' }}>
                <Doughnut data={emotionChartData} options={emotionChartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Key Themes */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ backgroundColor: 'grey.50' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Recurring Themes
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {trends.keyThemes.map((theme, index) => (
                  <Chip
                    key={index}
                    label={`${theme.theme} (${theme.count})`}
                    color={getThemeColor(theme.sentiment) as any}
                    variant="outlined"
                    sx={{ mb: 1 }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Weekly Summary */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ backgroundColor: 'grey.50' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Weekly Summary
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Average Mood:
                </Typography>
                <Chip
                  label={`${trends.weeklyAverage.toFixed(1)} / 5.0`}
                  color={trends.weeklyAverage >= 3.5 ? 'success' : trends.weeklyAverage >= 2.5 ? 'warning' : 'error'}
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Most Common Emotions:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {trends.dominantEmotions.slice(0, 3).map((emotion, index) => (
                  <Chip
                    key={index}
                    label={emotion.emotion}
                    size="small"
                    sx={{ 
                      backgroundColor: emotion.color,
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default EmotionalInsightsChart;