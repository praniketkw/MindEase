import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Alert,
  Divider,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Message as MessageIcon,
  Language as LanguageIcon,
  LocalHospital as HospitalIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';

interface CrisisSupportPageProps {
  isVisible: boolean;
  onClose: () => void;
  emergencyResources?: any[];
  onContactResource?: (resource: any) => void;
}

const CrisisSupportPage: React.FC<CrisisSupportPageProps> = ({
  onClose,
}) => {
  const resources = [
    {
      name: '988 Suicide & Crisis Lifeline',
      contact: 'Call or Text 988',
      description: '24/7 free and confidential support for people in distress, prevention and crisis resources.',
      available: '24/7',
      icon: <PhoneIcon />,
      color: '#dc2626',
      action: 'tel:988',
    },
    {
      name: 'Crisis Text Line',
      contact: 'Text HOME to 741741',
      description: 'Free 24/7 support via text message. Trained crisis counselors available immediately.',
      available: '24/7',
      icon: <MessageIcon />,
      color: '#2563eb',
      action: 'sms:741741',
    },
    {
      name: 'International Crisis Lines',
      contact: 'Find Your Country',
      description: 'Crisis centers and hotlines available worldwide in multiple languages.',
      available: '24/7',
      icon: <LanguageIcon />,
      color: '#059669',
      action: 'https://www.iasp.info/resources/Crisis_Centres/',
    },
    {
      name: 'Emergency Services',
      contact: 'Call 911',
      description: 'For immediate life-threatening emergencies. Police, fire, and medical assistance.',
      available: '24/7',
      icon: <HospitalIcon />,
      color: '#ea580c',
      action: 'tel:911',
    },
  ];

  const handleResourceClick = (action: string) => {
    if (action.startsWith('http')) {
      window.open(action, '_blank');
    } else {
      window.location.href = action;
    }
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 70px)',
        bgcolor: '#f8f9fa',
        py: 4,
      }}
    >
      <Container maxWidth="md">
        {/* Back Button */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onClose}
          sx={{
            mb: 3,
            color: '#64748b',
            '&:hover': {
              bgcolor: '#f1f5f9',
            },
          }}
        >
          Back to Chat
        </Button>

        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 3,
            borderRadius: 3,
            bgcolor: 'white',
            border: '1px solid #e2e8f0',
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
              boxShadow: '0 8px 24px rgba(220, 38, 38, 0.25)',
            }}
          >
            <HospitalIcon sx={{ fontSize: 40, color: 'white' }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a202c', mb: 2 }}>
            Crisis Support Resources
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b', maxWidth: 600, mx: 'auto', lineHeight: 1.7 }}>
            If you're in crisis or need immediate support, these resources are available 24/7.
            You're not alone, and help is always available.
          </Typography>
        </Paper>

        {/* Important Notice */}
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
            border: '1px solid #fecaca',
            '& .MuiAlert-icon': {
              fontSize: 28,
            },
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
            If you're in immediate danger, call 911 or your local emergency number.
          </Typography>
          <Typography variant="body2">
            These services are free, confidential, and staffed by trained professionals who care.
          </Typography>
        </Alert>

        {/* Resources Grid */}
        <Box sx={{ display: 'grid', gap: 2, mb: 4 }}>
          {resources.map((resource, index) => (
            <Card
              key={index}
              elevation={0}
              sx={{
                borderRadius: 3,
                border: '1px solid #e2e8f0',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 2,
                      backgroundColor: resource.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      flexShrink: 0,
                      boxShadow: `0 4px 14px ${resource.color}40`,
                    }}
                  >
                    {resource.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a202c' }}>
                        {resource.name}
                      </Typography>
                      <Chip
                        label={resource.available}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          bgcolor: '#dcfce7',
                          color: '#166534',
                          border: '1px solid #bbf7d0',
                        }}
                      />
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        color: resource.color,
                        fontWeight: 700,
                        mb: 1,
                        fontSize: '1rem',
                      }}
                    >
                      {resource.contact}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 2, lineHeight: 1.6 }}>
                      {resource.description}
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => handleResourceClick(resource.action)}
                      sx={{
                        bgcolor: resource.color,
                        color: 'white',
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 3,
                        boxShadow: 'none',
                        '&:hover': {
                          bgcolor: resource.color,
                          filter: 'brightness(0.9)',
                          boxShadow: 'none',
                        },
                      }}
                    >
                      Contact Now
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Additional Information */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            bgcolor: 'white',
            border: '1px solid #e2e8f0',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a202c', mb: 2 }}>
            What to Expect When You Call
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1a202c', mb: 0.5 }}>
                • You'll speak with a trained counselor
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', pl: 2, lineHeight: 1.6 }}>
                All counselors are trained to listen and provide support without judgment.
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1a202c', mb: 0.5 }}>
                • Your call is confidential
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', pl: 2, lineHeight: 1.6 }}>
                What you share stays private unless you're in immediate danger.
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1a202c', mb: 0.5 }}>
                • They're there to help, not judge
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', pl: 2, lineHeight: 1.6 }}>
                Crisis counselors are compassionate professionals who want to support you.
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Footer Message */}
        <Box sx={{ textAlign: 'center', mt: 4, p: 3, bgcolor: '#f1f5f9', borderRadius: 3 }}>
          <Typography variant="body1" sx={{ color: '#1a202c', fontWeight: 600, mb: 1 }}>
            Remember: Reaching out for help is a sign of strength, not weakness.
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            You matter, and your life has value. Help is available.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default CrisisSupportPage;
