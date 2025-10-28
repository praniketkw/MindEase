import { AzureLanguageServiceImpl } from './azure-language.service';
import { EmotionalAnalysis } from '../../../shared/types';
import { AzureServiceError } from '../interfaces/azure-services';

export class EmotionAnalysisService {
  private languageService: AzureLanguageServiceImpl;

  constructor(endpoint: string, apiKey: string) {
    this.languageService = new AzureLanguageServiceImpl(endpoint, apiKey);
  }

  async analyzeEmotionalContent(text: string): Promise<EmotionalAnalysis> {
    try {
      // Use the comprehensive analysis from Azure Language service
      return await this.languageService.performComprehensiveEmotionalAnalysis(text);
    } catch (error) {
      console.error('Error in emotional analysis:', error);
      
      // Fallback to basic analysis if Azure service fails
      return this.performBasicEmotionalAnalysis(text);
    }
  }

  async analyzeEmotionalTrends(texts: string[], timeframe: 'day' | 'week' | 'month'): Promise<{
    overallTrend: 'improving' | 'stable' | 'declining';
    dominantEmotions: string[];
    averageMood: number;
    keyInsights: string[];
  }> {
    try {
      const analyses = await Promise.all(
        texts.map(text => this.analyzeEmotionalContent(text))
      );

      return this.calculateEmotionalTrends(analyses, timeframe);
    } catch (error) {
      console.error('Error analyzing emotional trends:', error);
      
      return {
        overallTrend: 'stable',
        dominantEmotions: ['neutral'],
        averageMood: 3,
        keyInsights: ['Unable to analyze trends at this time']
      };
    }
  }

  async identifyEmotionalPatterns(userHistory: EmotionalAnalysis[]): Promise<{
    patterns: EmotionalPattern[];
    triggers: string[];
    copingStrategies: string[];
    recommendations: string[];
  }> {
    try {
      const patterns = this.extractEmotionalPatterns(userHistory);
      const triggers = this.identifyCommonTriggers(userHistory);
      const copingStrategies = this.identifyEffectiveCoping(userHistory);
      const recommendations = this.generateRecommendations(patterns, triggers, copingStrategies);

      return {
        patterns,
        triggers,
        copingStrategies,
        recommendations
      };
    } catch (error) {
      console.error('Error identifying emotional patterns:', error);
      
      return {
        patterns: [],
        triggers: [],
        copingStrategies: [],
        recommendations: ['Continue regular check-ins to build pattern analysis']
      };
    }
  }

  async detectEmotionalCrisis(text: string, userHistory?: EmotionalAnalysis[]): Promise<{
    crisisDetected: boolean;
    riskLevel: 'low' | 'medium' | 'high' | 'crisis';
    indicators: string[];
    recommendedActions: string[];
  }> {
    try {
      const analysis = await this.analyzeEmotionalContent(text);
      const crisisIndicators = this.identifyCrisisIndicators(text, analysis);
      const riskLevel = this.assessRiskLevel(analysis, userHistory);

      return {
        crisisDetected: riskLevel === 'crisis' || crisisIndicators.length > 2,
        riskLevel,
        indicators: crisisIndicators,
        recommendedActions: this.generateCrisisRecommendations(riskLevel, crisisIndicators)
      };
    } catch (error) {
      console.error('Error in crisis detection:', error);
      
      // Conservative approach - flag for manual review if analysis fails
      return {
        crisisDetected: false,
        riskLevel: 'medium',
        indicators: ['Analysis unavailable - manual review recommended'],
        recommendedActions: ['Contact support if you need immediate help']
      };
    }
  }

  private performBasicEmotionalAnalysis(text: string): EmotionalAnalysis {
    const lowerText = text.toLowerCase();
    
    // Enhanced keyword-based analysis
    const emotionKeywords = {
      joy: ['happy', 'excited', 'great', 'wonderful', 'amazing', 'fantastic', 'love', 'joy', 'pleased', 'delighted'],
      sadness: ['sad', 'depressed', 'down', 'upset', 'crying', 'hurt', 'lonely', 'empty', 'miserable', 'heartbroken'],
      anger: ['angry', 'mad', 'furious', 'annoyed', 'frustrated', 'irritated', 'hate', 'rage', 'outraged'],
      fear: ['scared', 'afraid', 'worried', 'anxious', 'nervous', 'panic', 'terrified', 'frightened', 'concerned'],
      surprise: ['surprised', 'shocked', 'unexpected', 'sudden', 'amazed', 'astonished'],
      disgust: ['disgusted', 'sick', 'revolted', 'appalled', 'repulsed']
    };

    const emotions = {};
    let totalEmotionScore = 0;

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      const score = keywords.reduce((count, keyword) => {
        return count + (lowerText.includes(keyword) ? 1 : 0);
      }, 0) / keywords.length;
      
      emotions[emotion] = Math.min(score * 2, 1); // Scale and cap at 1
      totalEmotionScore += emotions[emotion];
    }

    // Calculate sentiment based on emotions
    const positive = emotions.joy;
    const negative = Math.max(emotions.sadness, emotions.anger, emotions.fear);
    const neutral = Math.max(0, 1 - positive - negative);

    return {
      sentiment: { positive, neutral, negative },
      emotions: emotions as any,
      keyPhrases: this.extractBasicKeyPhrases(text),
      stressIndicators: this.identifyBasicStressIndicators(text),
      copingMechanisms: this.identifyBasicCopingMechanisms(text)
    };
  }

  private calculateEmotionalTrends(analyses: EmotionalAnalysis[], timeframe: string): {
    overallTrend: 'improving' | 'stable' | 'declining';
    dominantEmotions: string[];
    averageMood: number;
    keyInsights: string[];
  } {
    if (analyses.length === 0) {
      return {
        overallTrend: 'stable',
        dominantEmotions: ['neutral'],
        averageMood: 3,
        keyInsights: ['No data available for analysis']
      };
    }

    // Calculate average mood scores
    const moodScores = analyses.map(analysis => {
      const positive = analysis.sentiment.positive;
      const negative = analysis.sentiment.negative;
      return 1 + (positive * 4) - (negative * 2); // Convert to 1-5 scale
    });

    const averageMood = moodScores.reduce((sum, score) => sum + score, 0) / moodScores.length;

    // Determine trend
    const firstHalf = moodScores.slice(0, Math.floor(moodScores.length / 2));
    const secondHalf = moodScores.slice(Math.floor(moodScores.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
    
    let overallTrend: 'improving' | 'stable' | 'declining';
    if (secondHalfAvg > firstHalfAvg + 0.5) {
      overallTrend = 'improving';
    } else if (secondHalfAvg < firstHalfAvg - 0.5) {
      overallTrend = 'declining';
    } else {
      overallTrend = 'stable';
    }

    // Find dominant emotions
    const emotionTotals = {
      joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0, disgust: 0
    };

    analyses.forEach(analysis => {
      Object.keys(emotionTotals).forEach(emotion => {
        emotionTotals[emotion] += analysis.emotions[emotion] || 0;
      });
    });

    const dominantEmotions = Object.entries(emotionTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([emotion]) => emotion);

    // Generate insights
    const keyInsights = this.generateTrendInsights(overallTrend, dominantEmotions, averageMood, timeframe);

    return {
      overallTrend,
      dominantEmotions,
      averageMood: Math.max(1, Math.min(5, averageMood)),
      keyInsights
    };
  }

  private extractEmotionalPatterns(history: EmotionalAnalysis[]): EmotionalPattern[] {
    // Simplified pattern extraction
    const patterns: EmotionalPattern[] = [];
    
    if (history.length < 3) return patterns;

    // Look for recurring emotional states
    const emotionSequences = history.map(analysis => {
      const emotions = analysis.emotions;
      return Object.entries(emotions)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 2)
        .map(([emotion]) => emotion);
    });

    // Find common sequences
    const sequenceMap = new Map<string, number>();
    for (let i = 0; i < emotionSequences.length - 1; i++) {
      const sequence = `${emotionSequences[i][0]} -> ${emotionSequences[i + 1][0]}`;
      sequenceMap.set(sequence, (sequenceMap.get(sequence) || 0) + 1);
    }

    // Convert to patterns
    sequenceMap.forEach((frequency, sequence) => {
      if (frequency > 1) {
        patterns.push({
          pattern: sequence,
          frequency,
          triggers: [], // Would be enhanced with more sophisticated analysis
          outcomes: []
        });
      }
    });

    return patterns;
  }

  private identifyCommonTriggers(history: EmotionalAnalysis[]): string[] {
    const allTriggers = history.flatMap(analysis => analysis.stressIndicators);
    const triggerCounts = new Map<string, number>();
    
    allTriggers.forEach(trigger => {
      triggerCounts.set(trigger, (triggerCounts.get(trigger) || 0) + 1);
    });

    return Array.from(triggerCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([trigger]) => trigger);
  }

  private identifyEffectiveCoping(history: EmotionalAnalysis[]): string[] {
    const allCoping = history.flatMap(analysis => analysis.copingMechanisms);
    const copingCounts = new Map<string, number>();
    
    allCoping.forEach(coping => {
      copingCounts.set(coping, (copingCounts.get(coping) || 0) + 1);
    });

    return Array.from(copingCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([coping]) => coping);
  }

  private generateRecommendations(
    patterns: EmotionalPattern[], 
    triggers: string[], 
    copingStrategies: string[]
  ): string[] {
    const recommendations: string[] = [];

    if (triggers.length > 0) {
      recommendations.push(`Consider developing strategies for managing: ${triggers.slice(0, 2).join(', ')}`);
    }

    if (copingStrategies.length > 0) {
      recommendations.push(`Continue using effective coping strategies: ${copingStrategies.slice(0, 2).join(', ')}`);
    }

    if (patterns.length > 0) {
      recommendations.push('Your emotional patterns suggest regular check-ins could be beneficial');
    }

    if (recommendations.length === 0) {
      recommendations.push('Keep tracking your emotions to identify helpful patterns');
    }

    return recommendations;
  }

  private identifyCrisisIndicators(text: string, analysis: EmotionalAnalysis): string[] {
    const indicators: string[] = [];
    const lowerText = text.toLowerCase();

    // Crisis keywords
    const crisisKeywords = [
      'suicide', 'kill myself', 'end it all', 'not worth living', 'better off dead',
      'hurt myself', 'self harm', 'cut myself', 'overdose', 'jump off'
    ];

    crisisKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        indicators.push(`crisis language: ${keyword}`);
      }
    });

    // Severe emotional distress
    if (analysis.sentiment.negative > 0.9) {
      indicators.push('extremely negative sentiment');
    }

    if (analysis.emotions.sadness > 0.8 && analysis.emotions.fear > 0.6) {
      indicators.push('severe emotional distress');
    }

    // Hopelessness indicators
    const hopelessnessKeywords = ['hopeless', 'no point', 'give up', 'can\'t go on', 'no way out'];
    hopelessnessKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        indicators.push(`hopelessness: ${keyword}`);
      }
    });

    return indicators;
  }

  private assessRiskLevel(analysis: EmotionalAnalysis, history?: EmotionalAnalysis[]): 'low' | 'medium' | 'high' | 'crisis' {
    const negativeScore = analysis.sentiment.negative;
    const stressLevel = analysis.stressIndicators.length;
    
    // Check for crisis indicators
    if (analysis.keyPhrases.some(phrase => 
      phrase.toLowerCase().includes('suicide') || 
      phrase.toLowerCase().includes('kill') ||
      phrase.toLowerCase().includes('hurt myself')
    )) {
      return 'crisis';
    }

    // High risk assessment
    if (negativeScore > 0.8 && stressLevel > 2) return 'high';
    if (negativeScore > 0.6 || stressLevel > 1) return 'medium';
    
    return 'low';
  }

  private generateCrisisRecommendations(riskLevel: string, indicators: string[]): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'crisis') {
      recommendations.push('Contact emergency services (911) immediately if you are in immediate danger');
      recommendations.push('Call the 988 Suicide & Crisis Lifeline: 988');
      recommendations.push('Reach out to a trusted friend, family member, or counselor right now');
    } else if (riskLevel === 'high') {
      recommendations.push('Consider contacting the 988 Suicide & Crisis Lifeline: 988');
      recommendations.push('Reach out to your campus counseling center');
      recommendations.push('Talk to a trusted friend or family member about how you\'re feeling');
    } else if (riskLevel === 'medium') {
      recommendations.push('Consider scheduling an appointment with a counselor');
      recommendations.push('Practice self-care and stress management techniques');
      recommendations.push('Reach out to your support network');
    }

    return recommendations;
  }

  private extractBasicKeyPhrases(text: string): string[] {
    return text.split(/[.!?]+/)
      .filter(sentence => sentence.trim().length > 0)
      .slice(0, 3)
      .map(sentence => sentence.trim().substring(0, 50));
  }

  private identifyBasicStressIndicators(text: string): string[] {
    const stressKeywords = ['stressed', 'overwhelmed', 'pressure', 'deadline', 'exam', 'busy'];
    const lowerText = text.toLowerCase();
    
    return stressKeywords.filter(keyword => lowerText.includes(keyword));
  }

  private identifyBasicCopingMechanisms(text: string): string[] {
    const copingKeywords = ['breathe', 'exercise', 'talk', 'music', 'sleep', 'relax'];
    const lowerText = text.toLowerCase();
    
    return copingKeywords.filter(keyword => lowerText.includes(keyword));
  }

  private generateTrendInsights(trend: string, emotions: string[], mood: number, timeframe: string): string[] {
    const insights: string[] = [];

    if (trend === 'improving') {
      insights.push(`Your emotional wellbeing has been improving over the past ${timeframe}`);
    } else if (trend === 'declining') {
      insights.push(`Your mood has been declining over the past ${timeframe} - consider reaching out for support`);
    } else {
      insights.push(`Your emotional state has been relatively stable over the past ${timeframe}`);
    }

    if (emotions.includes('sadness') && emotions.includes('fear')) {
      insights.push('You\'ve been experiencing a mix of sadness and anxiety - this is common during stressful periods');
    }

    if (mood < 2.5) {
      insights.push('Your average mood has been quite low - please consider professional support');
    } else if (mood > 3.5) {
      insights.push('Your overall mood has been positive - keep up the good work!');
    }

    return insights;
  }
}

interface EmotionalPattern {
  pattern: string;
  frequency: number;
  triggers: string[];
  outcomes: string[];
}