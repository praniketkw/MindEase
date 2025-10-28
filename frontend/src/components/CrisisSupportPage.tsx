import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Chat as ChatIcon,
  Web as WebIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  LocalHospital as EmergencyIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Favorite as HeartIcon,
  Psychology as MindIcon,
  Group as GroupIcon,
  LocalHospital as HospitalIcon,
} from '@mui/icons-material';
import { CrisisSupportProps, EmergencyResource } from '../interfaces/components';

const CrisisSupportPage: React.FC<CrisisSupportProps> = ({
  isVisible,
  onClose,
  emergencyResources,
  onContactResource,
}) => {
  const [selectedResource, setSelectedResource] = useState<EmergencyResource | null>(null);
  const [showContactDialog, setShowContactDialog] = useState(false);

  // Default emergency resources if none provided
  const defaultResources: EmergencyResource[] = [
    {
      name: '988 Suicide & Crisis Lifeline',
      phone: '988',
      website: 'https://988lifeline.org',
      description: '24/7 free and confidential support for people in distress, prevention and crisis resources.',
      availability: '24/7',
      location: 'United States',
    },
    {
      name: 'Crisis Text Line',
      phone: 'Text HOME to 741741',
      website: 'https://www.crisistextline.org',
      description: 'Free, 24/7 support for those in crisis. Text with a trained crisis counselor.',
      availability: '24/7',
      location: 'United States, Canada, UK',
    },
    {
      name: 'National Alliance on Mental Illness',
      phone: '1-800-950-NAMI (6264)',
      website: 'https://www.nami.org',
      description: 'Information, referrals, and support for individuals and families affected by mental illness.',
      availability: 'Mon-Fri 10am-10pm ET',
      location: 'United States',
    },
    {
      name: 'International Association for Suicide Prevention',
      phone: 'Various by country',
      website: 'https://www.iasp.info/resources/Crisis_Centres',
      description: 'Directory of crisis centers and helplines worldwide.',
      availability: 'Varies by location',
      location: 'International',
    },
  ];

  const resources = emergencyResources.length > 0 ? emergencyResources : defaultResources;

  const handleContactResource = (resource: EmergencyResource) => {
    setSelectedResource(resource);
    setShowContactDialog(true);
    onContactResource(resource);
  };

  const handlePhoneCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleWebsiteOpen = (website: string) => {
    window.open(website, '_blank', 'noopener,noreferrer');
  };

  const getResourceIcon = (name: string) => {
    if (name.toLowerCase().includes('suicide') || name.toLowerCase().includes('crisis')) {
      return <EmergencyIcon color="error" />;
    }
    if (name.toLowerCase().includes('text')) {
      return <ChatIcon color="primary" />;
    }
    if (name.toLowerCase().includes('hospital')) {
      return <HospitalIcon color="error" />;
    }
    return <MindIcon color="primary" />;
  };

  const copingStrategies = [
    {
      title: 'Immediate Grounding Techniques',
      strategies: [
        '5-4-3-2-1 Technique: Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste',
        'Deep breathing: Breathe in for 4 counts, hold for 4, breathe out for 6',
        'Cold water on your face or hold ice cubes',
        'Listen to calming music or nature sounds',
      ],
    },
    {
      title: 'Reach Out for Support',
      strategies: [
        'Call a trusted friend or family member',
        'Contact your therapist or counselor',
        'Visit a local emergency room if in immediate danger',
        'Use the crisis resources listed above',
      ],
    },
    {
      title: 'Self-Care Activities',
      strategies: [
        'Take a warm shower or bath',
        'Go for a walk in nature',
        'Practice gentle stretching or yoga',
        'Write in a journal about your feelings',
      ],
    },
  ];

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', p: 2 }}>
      {/* Emergency Alert Header */}
      <Alert 
        severity="error" 
        sx={{ 
          mb: 3, 
          borderRadius: 2,
          '& .MuiAlert-message': { width: '100%' }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              Crisis Support Resources
            </Typography>
            <Typography variant="body2">
              If you're having thoughts of self-harm or suicide, please reach out for help immediately. You are not alone.
            </Typography>
          </Box>
          {onClose && (
            <IconButton onClick={onClose} sx={{ color: 'error.main' }}>
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </Alert>

      <Grid container spacing={3}>
        {/* Emergency Resources */}
        <Grid item xs={12} md={8}>
          <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmergencyIcon color="error" />
              Emergency Resources
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              These resources are available 24/7 and provide immediate support during crisis situations.
            </Typography>

            <Grid container spacing={2}>
              {resources.map((resource, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Card 
                    elevation={2}
                    sx={{ 
                      height: '100%',
                      borderRadius: 2,
                      border: '2px solid',
                      borderColor: 'error.light',
                      '&:hover': {
                        borderColor: 'error.main',
                        boxShadow: 4,
                      },
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
                        {getResourceIcon(resource.name)}
                        <Typography variant="h6" sx={{ fontWeight: 'bold', flex: 1 }}>
                          {resource.name}
                        </Typography>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {resource.description}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        <Chip
                          icon={<ScheduleIcon />}
                          label={resource.availability}
                          size="small"
                          color="success"
                        />
                        {resource.location && (
                          <Chip
                            icon={<LocationIcon />}
                            label={resource.location}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </CardContent>
                    
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<PhoneIcon />}
                        onClick={() => handlePhoneCall(resource.phone)}
                        fullWidth
                        sx={{ mb: 1 }}
                      >
                        {resource.phone}
                      </Button>
                      
                      {resource.website && (
                        <Button
                          variant="outlined"
                          startIcon={<WebIcon />}
                          onClick={() => handleWebsiteOpen(resource.website!)}
                          fullWidth
                          size="small"
                        >
                          Visit Website
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Coping Strategies */}
          <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <HeartIcon color="primary" />
              Immediate Coping Strategies
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Try these techniques while waiting for professional help or when feeling overwhelmed.
            </Typography>

            {copingStrategies.map((category, index) => (
              <Accordion key={index} sx={{ mb: 1, borderRadius: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {category.title}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    {category.strategies.map((strategy, strategyIndex) => (
                      <ListItem key={strategyIndex} sx={{ py: 0.5 }}>
                        <ListItemIcon>
                          <Chip label={strategyIndex + 1} size="small" color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={strategy} />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            ))}
          </Paper>
        </Grid>

        {/* Sidebar Information */}
        <Grid item xs={12} md={4}>
          {/* Warning Signs */}
          <Card elevation={1} sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'error.main' }}>
                When to Seek Immediate Help
              </Typography>
              
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <EmergencyIcon color="error" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Thoughts of self-harm or suicide" />
                </ListItem>
                
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <EmergencyIcon color="error" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Feeling like you might hurt yourself or others" />
                </ListItem>
                
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <EmergencyIcon color="error" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Severe panic or anxiety attacks" />
                </ListItem>
                
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <EmergencyIcon color="error" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Feeling completely hopeless or trapped" />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Support Information */}
          <Card elevation={1} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                Remember
              </Typography>
              
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <HeartIcon color="primary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="You are not alone"
                    secondary="Many people care about you and want to help"
                  />
                </ListItem>
                
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <HeartIcon color="primary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="This feeling will pass"
                    secondary="Crisis situations are temporary"
                  />
                </ListItem>
                
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <HeartIcon color="primary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Help is available"
                    secondary="Professional support is just a call away"
                  />
                </ListItem>
                
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <HeartIcon color="primary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="You matter"
                    secondary="Your life has value and meaning"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Contact Confirmation Dialog */}
      <Dialog
        open={showContactDialog}
        onClose={() => setShowContactDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Contacting {selectedResource?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            You're about to contact {selectedResource?.name}. This is a great step in getting the support you need.
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            If this is a life-threatening emergency, please call 911 or go to your nearest emergency room immediately.
          </Alert>
          
          <Typography variant="body2" color="text.secondary">
            Remember: It's okay to ask for help. You're being brave by reaching out.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowContactDialog(false)}>
            Close
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              if (selectedResource) {
                handlePhoneCall(selectedResource.phone);
              }
              setShowContactDialog(false);
            }}
          >
            Continue to Contact
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CrisisSupportPage;