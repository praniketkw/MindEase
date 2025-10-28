import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { 
  AzureSpeechService, 
  SpeechToTextResult, 
  VoiceSettings, 
  SpeechEmotionResult,
  AzureServiceError 
} from '../interfaces/azure-services';

export class AzureSpeechServiceImpl implements AzureSpeechService {
  private speechConfig: sdk.SpeechConfig;

  constructor(subscriptionKey: string, region: string) {
    this.speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, region);
    
    // Configure for optimal mental health conversation settings
    this.speechConfig.speechRecognitionLanguage = 'en-US';
    this.speechConfig.outputFormat = sdk.OutputFormat.Detailed;
    
    // Set speech synthesis voice (empathetic, calm voice)
    this.speechConfig.speechSynthesisVoiceName = 'en-US-JennyNeural';
  }

  async speechToText(audioBuffer: Buffer): Promise<SpeechToTextResult> {
    return new Promise((resolve, reject) => {
      try {
        // Create audio config from buffer
        const audioConfig = this.createAudioConfigFromBuffer(audioBuffer);
        const recognizer = new sdk.SpeechRecognizer(this.speechConfig, audioConfig);

        let recognizedText = '';
        let confidence = 0;
        let duration = 0;
        const startTime = Date.now();

        recognizer.recognizing = (s, e) => {
          console.log(`RECOGNIZING: Text=${e.result.text}`);
        };

        recognizer.recognized = (s, e) => {
          if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
            recognizedText = e.result.text;
            confidence = this.extractConfidenceScore(e.result);
            duration = Date.now() - startTime;
            console.log(`RECOGNIZED: Text=${recognizedText}, Confidence=${confidence}`);
          } else if (e.result.reason === sdk.ResultReason.NoMatch) {
            console.log('NOMATCH: Speech could not be recognized.');
          }
        };

        recognizer.canceled = (s, e) => {
          console.log(`CANCELED: Reason=${e.reason}`);
          
          if (e.reason === sdk.CancellationReason.Error) {
            reject(new AzureServiceError(
              'Speech',
              e.errorCode || 'SPEECH_RECOGNITION_ERROR',
              this.isRetryableError(e.errorCode),
              `Speech recognition failed: ${e.errorDetails}`
            ));
          }
        };

        recognizer.sessionStopped = (s, e) => {
          console.log('Session stopped event.');
          recognizer.stopContinuousRecognitionAsync();
          
          resolve({
            text: recognizedText || '',
            confidence: confidence,
            duration: duration,
            language: 'en-US'
          });
        };

        // Start recognition
        recognizer.recognizeOnceAsync(
          (result) => {
            if (result.reason === sdk.ResultReason.RecognizedSpeech) {
              resolve({
                text: result.text,
                confidence: this.extractConfidenceScore(result),
                duration: Date.now() - startTime,
                language: 'en-US'
              });
            } else {
              reject(new AzureServiceError(
                'Speech',
                'NO_SPEECH_RECOGNIZED',
                false,
                'No speech was recognized from the audio'
              ));
            }
            recognizer.close();
          },
          (error) => {
            reject(new AzureServiceError(
              'Speech',
              'RECOGNITION_ERROR',
              this.isRetryableError(error),
              `Speech recognition error: ${error}`
            ));
            recognizer.close();
          }
        );

      } catch (error) {
        reject(new AzureServiceError(
          'Speech',
          'SETUP_ERROR',
          false,
          `Failed to set up speech recognition: ${error.message}`
        ));
      }
    });
  }

  async textToSpeech(text: string, voiceSettings?: VoiceSettings): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        // Apply voice settings if provided
        if (voiceSettings) {
          this.applyVoiceSettings(voiceSettings);
        }

        // Create SSML for more natural, empathetic speech
        const ssml = this.createEmpathicSSML(text, voiceSettings);
        
        const synthesizer = new sdk.SpeechSynthesizer(this.speechConfig);

        synthesizer.speakSsmlAsync(
          ssml,
          (result) => {
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
              console.log('Speech synthesis completed.');
              const audioBuffer = Buffer.from(result.audioData);
              resolve(audioBuffer);
            } else {
              reject(new AzureServiceError(
                'Speech',
                'SYNTHESIS_FAILED',
                false,
                `Speech synthesis failed: ${result.errorDetails}`
              ));
            }
            synthesizer.close();
          },
          (error) => {
            reject(new AzureServiceError(
              'Speech',
              'SYNTHESIS_ERROR',
              this.isRetryableError(error),
              `Speech synthesis error: ${error}`
            ));
            synthesizer.close();
          }
        );

      } catch (error) {
        reject(new AzureServiceError(
          'Speech',
          'SETUP_ERROR',
          false,
          `Failed to set up speech synthesis: ${error.message}`
        ));
      }
    });
  }

  async detectSpeechEmotion(audioBuffer: Buffer): Promise<SpeechEmotionResult> {
    try {
      // First, convert speech to text
      const speechResult = await this.speechToText(audioBuffer);
      
      // Analyze the text for emotional content (basic implementation)
      // In a full implementation, you might use Azure's emotion recognition from speech
      const emotions = this.analyzeTextualEmotions(speechResult.text);
      
      return {
        emotions,
        dominantEmotion: this.findDominantEmotion(emotions),
        confidence: speechResult.confidence
      };

    } catch (error) {
      throw new AzureServiceError(
        'Speech',
        'EMOTION_DETECTION_ERROR',
        this.isRetryableError(error),
        `Failed to detect speech emotion: ${error.message}`
      );
    }
  }

  private createAudioConfigFromBuffer(audioBuffer: Buffer): sdk.AudioConfig {
    // Create a push audio input stream
    const pushStream = sdk.AudioInputStream.createPushStream();
    
    // Push the audio data
    pushStream.write(audioBuffer);
    pushStream.close();
    
    return sdk.AudioConfig.fromStreamInput(pushStream);
  }

  private extractConfidenceScore(result: sdk.SpeechRecognitionResult): number {
    try {
      // Try to extract confidence from detailed results
      if (result.json) {
        const jsonResult = JSON.parse(result.json);
        if (jsonResult.NBest && jsonResult.NBest.length > 0) {
          return jsonResult.NBest[0].Confidence || 0.8;
        }
      }
      
      // Default confidence based on result reason
      switch (result.reason) {
        case sdk.ResultReason.RecognizedSpeech:
          return 0.8;
        case sdk.ResultReason.NoMatch:
          return 0.0;
        default:
          return 0.5;
      }
    } catch (error) {
      console.warn('Could not extract confidence score:', error);
      return 0.7; // Default confidence
    }
  }

  private applyVoiceSettings(settings: VoiceSettings): void {
    // Apply voice settings to speech config
    if (settings.voice) {
      this.speechConfig.speechSynthesisVoiceName = settings.voice;
    }
    
    // Note: Speed, pitch, and volume are applied in SSML
  }

  private createEmpathicSSML(text: string, settings?: VoiceSettings): string {
    const voice = settings?.voice || 'en-US-JennyNeural';
    const rate = settings?.speed ? `${settings.speed}%` : '95%'; // Slightly slower for empathy
    const pitch = settings?.pitch ? `${settings.pitch}Hz` : '+0Hz';
    const volume = settings?.volume ? `${settings.volume}%` : '90%'; // Slightly softer

    // Clean and prepare text for SSML
    const cleanText = this.prepareTextForSSML(text);
    
    return `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
        <voice name="${voice}">
          <prosody rate="${rate}" pitch="${pitch}" volume="${volume}">
            <emphasis level="moderate">
              ${cleanText}
            </emphasis>
          </prosody>
        </voice>
      </speak>
    `.trim();
  }

  private prepareTextForSSML(text: string): string {
    // Escape XML special characters
    let cleanText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

    // Add natural pauses for empathetic delivery
    cleanText = cleanText
      .replace(/\. /g, '. <break time="500ms"/> ')
      .replace(/\? /g, '? <break time="300ms"/> ')
      .replace(/! /g, '! <break time="400ms"/> ');

    // Emphasize supportive phrases
    cleanText = cleanText
      .replace(/(I understand|I hear you|I'm here|You're not alone)/gi, 
               '<emphasis level="strong">$1</emphasis>')
      .replace(/(It's okay|That's valid|You matter)/gi, 
               '<emphasis level="moderate">$1</emphasis>');

    return cleanText;
  }

  private analyzeTextualEmotions(text: string): { [emotion: string]: number } {
    const lowerText = text.toLowerCase();
    
    // Basic emotion detection from text
    const emotionKeywords = {
      sadness: ['sad', 'depressed', 'down', 'upset', 'hurt', 'crying'],
      joy: ['happy', 'excited', 'great', 'good', 'wonderful', 'amazing'],
      anger: ['angry', 'mad', 'frustrated', 'annoyed', 'furious'],
      fear: ['scared', 'afraid', 'worried', 'anxious', 'nervous'],
      surprise: ['surprised', 'shocked', 'unexpected', 'wow'],
      neutral: ['okay', 'fine', 'normal', 'usual']
    };

    const emotions: { [emotion: string]: number } = {};
    
    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      const score = keywords.reduce((count, keyword) => {
        return count + (lowerText.includes(keyword) ? 1 : 0);
      }, 0) / keywords.length;
      
      emotions[emotion] = Math.min(score * 2, 1); // Scale and cap at 1
    }

    return emotions;
  }

  private findDominantEmotion(emotions: { [emotion: string]: number }): string {
    let dominantEmotion = 'neutral';
    let maxScore = 0;

    for (const [emotion, score] of Object.entries(emotions)) {
      if (score > maxScore) {
        maxScore = score;
        dominantEmotion = emotion;
      }
    }

    return dominantEmotion;
  }

  private isRetryableError(error: any): boolean {
    const retryableErrors = [
      'ConnectionFailure',
      'ServiceTimeout',
      'ServiceUnavailable',
      'TooManyRequests'
    ];
    
    return retryableErrors.includes(error) || 
           (typeof error === 'string' && error.includes('timeout'));
  }

  // Utility methods for voice interface
  async getAvailableVoices(): Promise<string[]> {
    // Return list of available empathetic voices suitable for mental health conversations
    return [
      'en-US-JennyNeural',    // Warm, caring female voice
      'en-US-AriaNeural',     // Friendly, supportive female voice
      'en-US-GuyNeural',      // Calm, reassuring male voice
      'en-US-DavisNeural',    // Gentle, understanding male voice
      'en-GB-SoniaNeural',    // British, professional yet warm
      'en-AU-NatashaNeural'   // Australian, approachable
    ];
  }

  async validateAudioFormat(audioBuffer: Buffer): Promise<boolean> {
    try {
      // Basic validation - check if buffer has audio-like characteristics
      if (!audioBuffer || audioBuffer.length < 1000) {
        return false; // Too small to be meaningful audio
      }

      // Check for common audio file headers (WAV, MP3, etc.)
      const header = audioBuffer.slice(0, 12);
      const headerString = header.toString('ascii');
      
      // WAV file check
      if (headerString.includes('RIFF') && headerString.includes('WAVE')) {
        return true;
      }
      
      // MP3 file check
      if (header[0] === 0xFF && (header[1] & 0xE0) === 0xE0) {
        return true;
      }
      
      // For other formats, assume valid if size is reasonable
      return audioBuffer.length > 1000 && audioBuffer.length < 10 * 1024 * 1024; // 10MB max
      
    } catch (error) {
      console.warn('Audio format validation error:', error);
      return false;
    }
  }

  async createSupportiveResponse(userEmotion: string, responseText: string): Promise<Buffer> {
    // Create contextually appropriate voice settings based on detected emotion
    const voiceSettings: VoiceSettings = this.getEmotionAppropriateVoiceSettings(userEmotion);
    
    // Generate empathetic response with appropriate tone
    return await this.textToSpeech(responseText, voiceSettings);
  }

  private getEmotionAppropriateVoiceSettings(emotion: string): VoiceSettings {
    const baseSettings: VoiceSettings = {
      voice: 'en-US-JennyNeural',
      speed: 95,
      pitch: 0,
      volume: 85
    };

    switch (emotion.toLowerCase()) {
      case 'sadness':
        return {
          ...baseSettings,
          speed: 90,  // Slower, more gentle
          pitch: -10, // Slightly lower pitch
          volume: 80  // Softer volume
        };
      
      case 'anger':
        return {
          ...baseSettings,
          speed: 85,  // Much slower, calming
          pitch: -15, // Lower, more soothing
          volume: 75  // Quieter, less stimulating
        };
      
      case 'fear':
      case 'anxiety':
        return {
          ...baseSettings,
          speed: 88,  // Slow and steady
          pitch: -5,  // Slightly lower
          volume: 82  // Reassuring volume
        };
      
      case 'joy':
        return {
          ...baseSettings,
          speed: 100, // Normal pace
          pitch: 5,   // Slightly higher, more positive
          volume: 90  // Normal volume
        };
      
      default:
        return baseSettings;
    }
  }
}