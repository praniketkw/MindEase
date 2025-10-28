import { TextAnalyticsClient, AzureKeyCredential } from '@azure/ai-text-analytics';
import { 
  AzureLanguageService, 
  SentimentResult, 
  EntityResult, 
  ClassificationResult, 
  LanguageDetectionResult,
  AzureServiceError 
} from '../interfaces/azure-services';
import { EmotionalAnalysis } from '../../../shared/types';

export class AzureLanguageServiceImpl implements AzureLanguageService {
  private client: TextAnalyticsClient;

  constructor(endpoint: string, apiKey: string) {
    this.client = new TextAnalyticsClient(endpoint, new AzureKeyCredential(apiKey));
  }

  async analyzeSentiment(text: string): Promise<SentimentResult> {
    try {
      const results = await this.client.analyzeSentiment([text]);
      const result = results[0];

      if (result.error) {
        throw new Error(result.error.message);
      }

      return {
        sentiment: result.sentiment,
        confidenceScores: result.confidenceScores,
        sentences: result.sentences.map(sentence => ({
          text: sentence.text,
          sentiment: sentence.sentiment,
          confidenceScores: sentence.confidenceScores
        }))
      };

    } catch (error) {
      throw new AzureServiceError(
        'Language',
        error.code || 'SENTIMENT_ANALYSIS_ERROR',
        this.isRetryableError(error),
        `Failed to analyze sentiment: ${error.message}`
      );
    }
  }

  async extractKeyPhrases(text: string): Promise<string[]> {
    try {
      const results = await this.client.extractKeyPhrases([text]);
      const result = results[0];

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.keyPhrases;

    } catch (error) {
      throw new AzureServiceError(
        'Language',
        error.code || 'KEY_PHRASE_EXTRACTION_ERROR',
        this.isRetryableError(error),
        `Failed to extract key phrases: ${error.message}`
      );
    }
  }

  async recognizeEntities(text: string): Promise<EntityResult[]> {
    try {
      const results = await this.client.recognizeEntities([text]);
      const result = results[0];

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.entities.map(entity => ({
        text: entity.text,
        category: entity.category,
        subcategory: entity.subcategory,
        confidenceScore: entity.confidenceScore,
        offset: entity.offset,
        length: entity.length
      }));

    } catch (error) {
      throw new AzureServiceError(
        'Language',
        error.code || 'ENTITY_RECOGNITION_ERROR',
        this.isRetryableError(error),
        `Failed to recognize entities: ${error.message}`
      );
    }
  }

  async classifyText(text: string): Promise<ClassificationResult> {
    try {
      // For mental health context, we'll implement custom classification
      // This is a simplified version - in production, you'd train custom models
      const classification = await this.performMentalHealthClassification(text);
      return classification;

    } catch (error) {
      throw new AzureServiceError(
        'Language',
        error.code || 'TEXT_CLASSIFICATION_ERROR',
        this.isRetryableError(error),
        `Failed to classify text: ${error.message}`
      );
    }
  }

  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    try {
      const results = await this.client.detectLanguage([text]);
      const result = results[0];

      if (result.error) {
        throw new Error(result.error.message);
      }

      const primaryLanguage = result.primaryLanguage;
      return {
        language: primaryLanguage.iso6391Name,
        confidenceScore: primaryLanguage.confidenceScore
      };

    } catch (error) {
      throw new AzureServiceError(
        'Language',
        error.code || 'LANGUAGE_DETECTION_ERROR',
        this.isRetryableError(error),
        `Failed to detect language: ${error.message}`
      );
    }
  }

  async performComprehensiveEmotionalAnalysis(text: string): Promise<EmotionalAnalysis> {
    try {
      // Perform multiple analyses in parallel
      const [sentimentResult, keyPhrases, entities] = await Promise.all([
        this.analyzeSentiment(text),
        this.extractKeyPhrases(text),
        this.recognizeEntities(text)
      ]);

      // Extract stress indicators and coping mechanisms
      const stressIndicators = this.identifyStressIndicators(text, keyPhrases, entities);
      const copingMechanisms = this.identifyCopingMechanisms(text, keyPhrases);

      // Convert sentiment to emotion scores
      const emotions = this.convertSentimentToEmotions(sentimentResult, text);

      return {
        sentiment: sentimentResult.confidenceScores,
        emotions,
        keyPhrases,
        stressIndicators,
        copingMechanisms
      };

    } catch (error) {
      console.error('Error in comprehensive emotional analysis:', error);
      
      // Return fallback analysis
      return this.createFallbackEmotionalAnalysis(text);
    }
  }

  private async performMentalHealthClassification(text: string): Promise<ClassificationResult> {
    // Simplified mental health classification based on keywords and patterns
    const lowerText = text.toLowerCase();
    
    const categories = {
      'anxiety': ['anxious', 'worried', 'nervous', 'panic', 'stress', 'overwhelmed', 'fear'],
      'depression': ['sad', 'depressed', 'hopeless', 'empty', 'worthless', 'tired', 'lonely'],
      'academic_stress': ['exam', 'study', 'grade', 'assignment', 'deadline', 'school', 'university'],
      'social_issues': ['friends', 'relationship', 'social', 'isolated', 'rejected', 'bullying'],
      'adjustment_issues': ['homesick', 'culture', 'adapt', 'foreign', 'different', 'belong'],
      'positive_coping': ['better', 'improving', 'hopeful', 'grateful', 'progress', 'support']
    };

    let bestCategory = 'general';
    let highestScore = 0;

    for (const [category, keywords] of Object.entries(categories)) {
      const score = keywords.reduce((count, keyword) => {
        return count + (lowerText.includes(keyword) ? 1 : 0);
      }, 0) / keywords.length;

      if (score > highestScore) {
        highestScore = score;
        bestCategory = category;
      }
    }

    return {
      category: bestCategory,
      confidenceScore: Math.min(highestScore * 2, 1) // Scale to 0-1 range
    };
  }

  private convertSentimentToEmotions(sentimentResult: SentimentResult, text: string): {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    disgust: number;
  } {
    const lowerText = text.toLowerCase();
    
    // Base emotions from sentiment
    let joy = sentimentResult.confidenceScores.positive;
    let sadness = sentimentResult.confidenceScores.negative * 0.7;
    let anger = 0;
    let fear = 0;
    let surprise = 0.1;
    let disgust = 0.1;

    // Enhance with keyword-based emotion detection
    const emotionKeywords = {
      joy: ['happy', 'excited', 'great', 'wonderful', 'amazing', 'fantastic', 'love', 'joy'],
      sadness: ['sad', 'depressed', 'down', 'upset', 'crying', 'hurt', 'lonely', 'empty'],
      anger: ['angry', 'mad', 'furious', 'annoyed', 'frustrated', 'irritated', 'hate'],
      fear: ['scared', 'afraid', 'worried', 'anxious', 'nervous', 'panic', 'terrified'],
      surprise: ['surprised', 'shocked', 'unexpected', 'sudden', 'amazed'],
      disgust: ['disgusted', 'sick', 'revolted', 'appalled']
    };

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      const keywordScore = keywords.reduce((count, keyword) => {
        return count + (lowerText.includes(keyword) ? 1 : 0);
      }, 0) / keywords.length;

      switch (emotion) {
        case 'joy':
          joy = Math.max(joy, keywordScore);
          break;
        case 'sadness':
          sadness = Math.max(sadness, keywordScore);
          break;
        case 'anger':
          anger = Math.max(anger, keywordScore);
          break;
        case 'fear':
          fear = Math.max(fear, keywordScore);
          break;
        case 'surprise':
          surprise = Math.max(surprise, keywordScore);
          break;
        case 'disgust':
          disgust = Math.max(disgust, keywordScore);
          break;
      }
    }

    return {
      joy: Math.min(joy, 1),
      sadness: Math.min(sadness, 1),
      anger: Math.min(anger, 1),
      fear: Math.min(fear, 1),
      surprise: Math.min(surprise, 1),
      disgust: Math.min(disgust, 1)
    };
  }

  private identifyStressIndicators(text: string, keyPhrases: string[], entities: EntityResult[]): string[] {
    const stressIndicators: string[] = [];
    const lowerText = text.toLowerCase();

    // Keyword-based stress indicators
    const stressKeywords = [
      'overwhelmed', 'stressed', 'pressure', 'burden', 'exhausted', 'tired',
      'deadline', 'exam', 'assignment', 'workload', 'busy', 'rushing'
    ];

    stressKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        stressIndicators.push(`stress keyword: ${keyword}`);
      }
    });

    // Key phrase analysis for stress
    keyPhrases.forEach(phrase => {
      const lowerPhrase = phrase.toLowerCase();
      if (lowerPhrase.includes('too much') || lowerPhrase.includes('can\'t handle') || 
          lowerPhrase.includes('breaking point') || lowerPhrase.includes('falling behind')) {
        stressIndicators.push(`stress phrase: ${phrase}`);
      }
    });

    // Entity-based stress indicators
    entities.forEach(entity => {
      if (entity.category === 'DateTime' && lowerText.includes('deadline')) {
        stressIndicators.push('time pressure detected');
      }
      if (entity.category === 'Organization' && lowerText.includes('work')) {
        stressIndicators.push('work-related stress');
      }
    });

    return stressIndicators.slice(0, 5); // Limit to top 5 indicators
  }

  private identifyCopingMechanisms(text: string, keyPhrases: string[]): string[] {
    const copingMechanisms: string[] = [];
    const lowerText = text.toLowerCase();

    const copingKeywords = {
      'breathing': ['breathe', 'breathing', 'breath'],
      'exercise': ['exercise', 'walk', 'run', 'gym', 'workout'],
      'social_support': ['talk', 'friend', 'family', 'support', 'help'],
      'mindfulness': ['meditation', 'mindful', 'present', 'focus'],
      'creative': ['music', 'art', 'write', 'journal', 'creative'],
      'rest': ['sleep', 'rest', 'relax', 'break', 'pause']
    };

    for (const [mechanism, keywords] of Object.entries(copingKeywords)) {
      const found = keywords.some(keyword => lowerText.includes(keyword));
      if (found) {
        copingMechanisms.push(mechanism);
      }
    }

    // Check key phrases for coping strategies
    keyPhrases.forEach(phrase => {
      const lowerPhrase = phrase.toLowerCase();
      if (lowerPhrase.includes('feel better') || lowerPhrase.includes('calm down') ||
          lowerPhrase.includes('taking care') || lowerPhrase.includes('self care')) {
        copingMechanisms.push('self-care');
      }
    });

    return copingMechanisms;
  }

  private createFallbackEmotionalAnalysis(text: string): EmotionalAnalysis {
    // Simple fallback analysis when Azure services fail
    const lowerText = text.toLowerCase();
    
    const positiveWords = ['good', 'great', 'happy', 'better', 'fine', 'okay'];
    const negativeWords = ['bad', 'sad', 'terrible', 'awful', 'worse', 'difficult'];
    
    const positiveCount = positiveWords.reduce((count, word) => 
      count + (lowerText.includes(word) ? 1 : 0), 0);
    const negativeCount = negativeWords.reduce((count, word) => 
      count + (lowerText.includes(word) ? 1 : 0), 0);
    
    const positive = positiveCount / positiveWords.length;
    const negative = negativeCount / negativeWords.length;
    const neutral = 1 - (positive + negative);

    return {
      sentiment: {
        positive: Math.min(positive, 1),
        neutral: Math.max(neutral, 0),
        negative: Math.min(negative, 1)
      },
      emotions: {
        joy: positive * 0.8,
        sadness: negative * 0.8,
        anger: negative * 0.3,
        fear: negative * 0.4,
        surprise: 0.1,
        disgust: 0.1
      },
      keyPhrases: text.split('.').slice(0, 3).map(s => s.trim()),
      stressIndicators: lowerText.includes('stress') ? ['stress detected'] : [],
      copingMechanisms: []
    };
  }

  private isRetryableError(error: any): boolean {
    const retryableCodes = ['429', '500', '502', '503', '504', 'ECONNRESET', 'ETIMEDOUT'];
    return retryableCodes.includes(error.code) || retryableCodes.includes(error.status?.toString());
  }
}