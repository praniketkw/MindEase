import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  IconButton,
  Typography,
  CircularProgress,
  Fade,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Stop as StopIcon,
  VolumeUp as VolumeUpIcon,
} from '@mui/icons-material';
import { VoiceInterfaceProps } from '../interfaces/components';

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  onVoiceInput,
  onToggleListening,
  isListening,
  isProcessing,
  isEnabled,
  onPlayResponse,
}) => {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSupported, setIsSupported] = useState(true);
  const audioChunks = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout>();
  const animationRef = useRef<number>();

  useEffect(() => {
    // Check if browser supports media recording
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setIsSupported(false);
      return;
    }

    // Initialize media recorder when component mounts
    const initializeRecorder = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100,
          }
        });
        
        const recorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus',
        });

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.current.push(event.data);
          }
        };

        recorder.onstop = () => {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
          onVoiceInput(audioBlob);
          audioChunks.current = [];
        };

        setMediaRecorder(recorder);

        // Set up audio level monitoring
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        microphone.connect(analyser);
        analyser.fftSize = 256;

        const updateAudioLevel = () => {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255);
          
          if (isListening) {
            animationRef.current = requestAnimationFrame(updateAudioLevel);
          }
        };

        if (isListening) {
          updateAudioLevel();
        }

      } catch (error) {
        console.error('Error accessing microphone:', error);
        setIsSupported(false);
      }
    };

    if (isEnabled) {
      initializeRecorder();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isEnabled, isListening, onVoiceInput]);

  useEffect(() => {
    if (isListening && mediaRecorder) {
      // Start recording
      audioChunks.current = [];
      mediaRecorder.start(100); // Collect data every 100ms
      setRecordingTime(0);
      
      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else if (mediaRecorder && mediaRecorder.state === 'recording') {
      // Stop recording
      mediaRecorder.stop();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isListening, mediaRecorder]);

  const handleToggleRecording = () => {
    if (!isEnabled || !isSupported) return;
    onToggleListening();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isSupported) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          textAlign: 'center',
          backgroundColor: 'error.light',
          color: 'error.contrastText',
          borderRadius: 2,
        }}
      >
        <Typography variant="body2">
          Voice recording is not supported in your browser. Please use text input instead.
        </Typography>
      </Paper>
    );
  }

  if (!isEnabled) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          textAlign: 'center',
          backgroundColor: 'warning.light',
          color: 'warning.contrastText',
          borderRadius: 2,
        }}
      >
        <Typography variant="body2">
          Voice input is disabled. Enable it in settings to use this feature.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        p: 2,
      }}
    >
      {/* Recording Status */}
      <Fade in={isListening || isProcessing}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            backgroundColor: isListening ? 'error.light' : 'info.light',
            color: isListening ? 'error.contrastText' : 'info.contrastText',
            borderRadius: 2,
            textAlign: 'center',
            minWidth: '200px',
          }}
        >
          <Typography variant="body2">
            {isProcessing ? 'Processing your voice...' : 
             isListening ? `Recording... ${formatTime(recordingTime)}` : 
             'Ready to record'}
          </Typography>
        </Paper>
      </Fade>

      {/* Voice Visualizer */}
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Animated rings for recording */}
        {isListening && (
          <>
            <Box
              sx={{
                position: 'absolute',
                width: `${80 + audioLevel * 40}px`,
                height: `${80 + audioLevel * 40}px`,
                borderRadius: '50%',
                border: '2px solid',
                borderColor: 'error.main',
                opacity: 0.3,
                animation: 'pulse 1.5s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%': {
                    transform: 'scale(1)',
                    opacity: 0.3,
                  },
                  '50%': {
                    transform: 'scale(1.1)',
                    opacity: 0.1,
                  },
                  '100%': {
                    transform: 'scale(1.2)',
                    opacity: 0,
                  },
                },
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                width: `${60 + audioLevel * 20}px`,
                height: `${60 + audioLevel * 20}px`,
                borderRadius: '50%',
                backgroundColor: 'error.main',
                opacity: 0.2,
              }}
            />
          </>
        )}

        {/* Main record button */}
        <Tooltip title={isListening ? 'Stop recording' : 'Start recording'}>
          <span>
            <IconButton
              onClick={handleToggleRecording}
              disabled={isProcessing}
              sx={{
                width: 64,
                height: 64,
                backgroundColor: isListening ? 'error.main' : 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: isListening ? 'error.dark' : 'primary.dark',
                },
                '&:disabled': {
                  backgroundColor: 'grey.400',
                },
              }}
            >
              {isProcessing ? (
                <CircularProgress size={24} color="inherit" />
              ) : isListening ? (
                <StopIcon />
              ) : (
                <MicIcon />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Instructions */}
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ textAlign: 'center', maxWidth: '300px' }}
      >
        {isProcessing ? 'Converting your speech to text...' :
         isListening ? 'Speak now. Click the stop button when finished.' :
         'Click the microphone to start recording your voice message.'}
      </Typography>

      {/* Test TTS Button (for development) */}
      {onPlayResponse && (
        <Tooltip title="Test text-to-speech">
          <IconButton
            onClick={() => onPlayResponse('This is a test of the text to speech feature.')}
            size="small"
            sx={{ opacity: 0.7 }}
          >
            <VolumeUpIcon />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default VoiceInterface;