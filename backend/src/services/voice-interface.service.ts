import { AzureSpeechServiceImpl } from './azure-speech.service';
import { ConversationServiceImpl } from './conversation.service';
import { EmotionAnalysisService } from './emotion-analysis.service';
import { ConversationResponse } from '../interfaces/azure-services';
import { EmotionalAnalysis } from '../../../shared/types';

export class VoiceInterfaceService {
  private speechService: AzureSpeechServiceImpl;
  private conversationService: ConversationServiceImpl;
  private emotionAnalysisService: EmotionAnalysisService;

  constructor(
    speechSubscriptionKey: string,
    speechRegion: string,
    openAIEndpoint: string,
    openAIApiKey: string,
    deploymentName: string,
    languageEndpoint: string,
    languageApiKey: string
  ) {
    this.speechService = new AzureSpeechServiceImpl(speechSubscriptionKey, speechRegion);
    this.conversationService = new ConversationServiceImpl(openAIEndpoint, openAIApiKey, deploymentName);
    this.emotionAnalysisService = new EmotionAnalysisService(languageEndpoint, languageApiKey);
  }

  async processVoiceInput(userId: string, audioBuffer: Buffer): Promise<{
    transcription: string;
    response: ConversationResponse;
    audioResponse: Buffer;
    emotionalAnalysis: EmotionalAnalysis;
  }> {
    try {
      // Step 1: Validate audio format
      const isValidAudio = await this.speechService.validateAudioFormat(audioBuffer);
      if (!isValidAudio) {
        throw new Error('Invalid audio format or corrupted audio data');
      }

      // Step 2: Convert speech to text
      const speechResult = await this.speechService.speechToText(audioBuffer);
      console.log(`Voice transcription: "${speechResult.text}" (confidence: ${speechResult.confidence})`);

      if (!speechResult.text || speechResult.text.trim().length === 0) {
        throw new Error('No speech was detected in the audio');
      }

      // Step 3: Analyze emotional content from both speech and text
      const [textEmotionalAnalysis, speechEmotionResult] = await Promise.all([
        this.emotionAnalysisService.analyzeEmotionalContent(speechResult.text),
        this.speechService.detectSpeechEmotion(audioBuffer)
      ]);

      // Combine text and speech emotion analysis
      const combinedEmotionalAnalysis = this.combineEmotionalAnalyses(
        textEmotionalAnalysis, 
        speechEmotionResult
      );

      // Step 4: Generate conversational response
      const conversationResponse = await this.conversationService.processMessage(
        userId, 
        speechResult.text
      );

      // Update the response with our enhanced emotional analysis
      conversationResponse.emotionalAnalysis = combinedEmotionalAnalysis;

      // Step 5: Generate empathetic audio response
      const dominantEmotion = speechEmotionResult.dominantEmotion;
      const audioResponse = await this.speechService.createSupportiveResponse(
        dominantEmotion,
        conversationResponse.response
      );

      return {
        transcription: speechResult.text,
        response: conversationResponse,
        audioResponse,
        emotionalAnalysis: combinedEmotionalAnalysis
      };

    } catch (error) {
      console.error('Error processing voice input:', error);
      
      // Return fallback response
      const fallbackResponse = await this.createFallbackVoiceResponse(error.message);
      return fallbackResponse;
    }
  }

  async generateVoiceResponse(text: string, userEmotion?: string): Promise<Buffer> {
    try {
      const emotion = userEmotion || 'neutral';
      return await this.speechService.createSupportiveResponse(emotion, text);
    } catch (error) {
      console.error('Error generating voice response:', error);
      
      // Return simple text-to-speech as fallback
      return await this.speechService.textToSpeech(text);
    }
  }

  async transcribeAudio(audioBuffer: Buffer): Promise<{
    text: string;
    confidence: number;
    duration: number;
    emotionalTone: string;
  }> {
    try {
      const [speechResult, emotionResult] = await Promise.all([
        this.speechService.speechToText(audioBuffer),
        this.speechService.detectSpeechEmotion(audioBuffer)
      ]);

      return {
        text: speechResult.text,
        confidence: speechResult.confidence,
        duration: speechResult.duration,
        emotionalTone: emotionResult.dominantEmotion
      };

    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    }
  }

  async analyzeVoiceEmotion(audioBuffer: Buffer): Promise<{
    emotions: { [emotion: string]: number };
    dominantEmotion: string;
    confidence: number;
    insights: string[];
  }> {
    try {
      const emotionResult = await this.speechService.detectSpeechEmotion(audioBuffer);
      const insights = this.generateEmotionalInsights(emotionResult);

      return {
        emotions: emotionResult.emotions,
        dominantEmotion: emotionResult.dominantEmotion,
        confidence: emotionResult.confidence,
        insights
      };

    } catch (error) {
      console.error('Error analyzing voice emotion:', error);
      
      return {
        emotions: { neutral: 1.0 },
        dominantEmotion: 'neutral',
        confidence: 0.5,
        insights: ['Unable to analyze emotional content from voice']
      };
    }
  }

  async getVoiceSettings(userPreferences?: any): Promise<{
    availableVoices: string[];
    recommendedVoice: string;
    defaultSettings: any;
  }> {
    try {
      const availableVoices = await this.speechService.getAvailableVoices();
      
      // Recommend voice based on user preferences or default to empathetic voice
      const recommendedVoice = this.selectRecommendedVoice(userPreferences);
      
      const defaultSettings = {
        voice: recommendedVoice,
        speed: 95,
        pitch: 0,
        volume: 85
      };

      return {
        availableVoices,
        recommendedVoice,
        defaultSettings
      };

    } catch (error) {
      console.error('Error getting voice settings:', error);
      
      return {
        availableVoices: ['en-US-JennyNeural'],
        recommendedVoice: 'en-US-JennyNeural',
        defaultSettings: {
          voice: 'en-US-JennyNeural',
          speed: 95,
          pitch: 0,
          volume: 85
        }
      };
    }
  }

  async processJournalVoiceEntry(userId: string, audioBuffer: Buffer): Promise<{
    transcription: string;
    emotionalAnalysis: EmotionalAnalysis;
    themes: string[];
    mood: number;
    insights: string[];
  }> {
    try {
      // Transcribe the voice journal entry
      const transcriptionResult = await this.transcribeAudio(audioBuffer);
      
      // Perform comprehensive emotional analysis
      const emotionalAnalysis = await this.emotionAnalysisService.analyzeEmotionalContent(
        transcriptionResult.text
      );

      // Extract themes and calculate mood
      const themes = this.extractJournalThemes(transcriptionResult.text, emotionalAnalysis);
      const mood = this.calculateMoodScore(emotionalAnalysis);
      const insights = this.generateJournalInsights(emotionalAnalysis, themes);

      return {
        transcription: transcriptionResult.text,
        emotionalAnalysis,
        themes,
        mood,
        insights
      };

    } catch (error) {
      console.error('Error processing journal voice entry:', error);
      throw error;
    }
  }

  private combineEmotionalAnalyses(
    textAnalysis: EmotionalAnalysis, 
    speechAnalysis: any
  ): EmotionalAnalysis {
    // Combine text-based and speech-based emotional analysis
    const combinedEmotions = { ...textAnalysis.emotions };
    
    // Weight speech emotions and blend with text emotions
    Object.keys(speechAnalysis.emotions).forEach(emotion => {
      if (combinedEmotions[emotion] !== undefined) {
        // Average the two analyses, giving slight preference to speech (60/40)
        combinedEmotions[emotion] = (
          combinedEmotions[emotion] * 0.4 + 
          speechAnalysis.emotions[emotion] * 0.6
        );
      }
    });

    return {
      ...textAnalysis,
      emotions: combinedEmotions,
      keyPhrases: [
        ...textAnalysis.keyPhrases,
        `Speech emotion: ${speechAnalysis.dominantEmotion}`
      ]
    };
  }

  private async createFallbackVoiceResponse(errorMessage: string): Promise<{
    transcription: string;
    response: ConversationResponse;
    audioResponse: Buffer;
    emotionalAnalysis: EmotionalAnalysis;
  }> {
    const fallbackText = "I'm having trouble processing your voice message right now. I'm still here to support you - could you try speaking again or use text instead?";
    
    const fallbackResponse: ConversationResponse = {
      response: fallbackText,
      emotionalAnalysis: {
        sentiment: { positive: 0.3, neutral: 0.4, negative: 0.3 },
        emotions: { joy: 0.2, sadness: 0.2, anger: 0.1, fear: 0.1, surprise: 0.1, disgust: 0.1 },
        keyPhrases: ['technical difficulty'],
        stressIndicators: [],
        copingMechanisms: []
      },
      suggestedActions: ['Try speaking again', 'Use text input', 'Check microphone'],
      crisisDetected: false
    };

    const audioResponse = await this.speechService.textToSpeech(fallbackText);

    return {
      transcription: `[Error: ${errorMessage}]`,
      response: fallbackResponse,
      audioResponse,
      emotionalAnalysis: fallbackResponse.emotionalAnalysis
    };
  }

  private generateEmotionalInsights(emotionResult: any): string[] {
    const insights: string[] = [];
    const { emotions, dominantEmotion, confidence } = emotionResult;

    if (confidence < 0.5) {
      insights.push('Emotional analysis has low confidence - results may be less accurate');
    }

    switch (dominantEmotion) {
      case 'sadness':
        insights.push('Your voice conveys sadness - it\'s okay to feel this way');
        break;
      case 'anger':
        insights.push('I can hear frustration in your voice - let\'s work through this together');
        break;
      case 'fear':
        insights.push('Your voice suggests anxiety - you\'re safe here to express your feelings');
        break;
      case 'joy':
        insights.push('I can hear positivity in your voice - that\'s wonderful');
        break;
      default:
        insights.push('Your emotional tone has been noted and will help me support you better');
    }

    // Check for mixed emotions
    const emotionScores = Object.values(emotions) as number[];
    const highEmotions = emotionScores.filter(score => score > 0.3).length;
    
    if (highEmotions > 2) {
      insights.push('You seem to be experiencing mixed emotions - this is completely normal');
    }

    return insights;
  }

  private selectRecommendedVoice(userPreferences?: any): string {
    // Default to empathetic female voice
    let recommendedVoice = 'en-US-JennyNeural';

    if (userPreferences) {
      if (userPreferences.gender === 'male') {
        recommendedVoice = 'en-US-GuyNeural';
      } else if (userPreferences.accent === 'british') {
        recommendedVoice = 'en-GB-SoniaNeural';
      } else if (userPreferences.accent === 'australian') {
        recommendedVoice = 'en-AU-NatashaNeural';
      }
    }

    return recommendedVoice;
  }

  private extractJournalThemes(text: string, analysis: EmotionalAnalysis): string[] {
    const themes = [...analysis.keyPhrases];
    
    // Add emotion-based themes
    const dominantEmotions = Object.entries(analysis.emotions)
      .filter(([, score]) => score > 0.4)
      .map(([emotion]) => emotion);
    
    themes.push(...dominantEmotions.map(emotion => `emotional theme: ${emotion}`));
    
    // Add stress indicators as themes
    themes.push(...analysis.stressIndicators.map(indicator => `stress: ${indicator}`));
    
    return themes.slice(0, 8); // Limit to top 8 themes
  }

  private calculateMoodScore(analysis: EmotionalAnalysis): number {
    const { positive, negative } = analysis.sentiment;
    
    // Convert sentiment to 1-5 mood scale
    const moodScore = 1 + (positive * 4) - (negative * 2);
    return Math.max(1, Math.min(5, Math.round(moodScore)));
  }

  private generateJournalInsights(analysis: EmotionalAnalysis, themes: string[]): string[] {
    const insights: string[] = [];
    
    if (analysis.sentiment.negative > 0.6) {
      insights.push('This entry shows you\'re going through a difficult time');
    } else if (analysis.sentiment.positive > 0.6) {
      insights.push('This entry reflects positive emotions and experiences');
    }
    
    if (analysis.stressIndicators.length > 0) {
      insights.push(`Stress indicators detected: ${analysis.stressIndicators.slice(0, 2).join(', ')}`);
    }
    
    if (analysis.copingMechanisms.length > 0) {
      insights.push(`Positive coping strategies mentioned: ${analysis.copingMechanisms.join(', ')}`);
    }
    
    const emotionalThemes = themes.filter(theme => theme.startsWith('emotional theme:'));
    if (emotionalThemes.length > 1) {
      insights.push('You\'re experiencing complex emotions - this shows emotional awareness');
    }
    
    return insights;
  }
}