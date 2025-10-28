import { ContentSafetyClient, AzureKeyCredential } from '@azure/ai-content-safety';
import { 
  AzureContentSafetyService, 
  SafetyResult, 
  CrisisDetectionResult, 
  ModerationResult,
  SafetyCategory,
  EmergencyResource,
  AzureServiceError 
} from '../interfaces/azure-services';

export class AzureContentSafetyServiceImpl implements AzureContentSafetyService {
  private client: ContentSafetyClient;

  constructor(endpoint: string, apiKey: string) {
    this.client = new ContentSafetyClient(endpoint, new AzureKeyCredential(apiKey));
  }

  async analyzeText(text: string): Promise<SafetyResult> {
    try {
      const result = await this.client.analyzeText({
        text: text
      });

      const categories: SafetyCategory[] = [];
      let highestSeverity = 0;

      // Process each category result
      if (result.categoriesAnalysis) {
        for (const analysis of result.categoriesAnalysis) {
          categories.push({
            category: analysis.category as 'hate' | 'self_harm' | 'sexual' | 'violence',
            severity: analysis.severity || 0
          });
          
          if (analysis.severity && analysis.severity > highestSeverity) {
            highestSeverity = analysis.severity;
          }
        }
      }

      const riskLevel = this.determineRiskLevel(highestSeverity, categories);
      const isSafe = riskLevel === 'low';

      return {
        isSafe,
        riskLevel,
        categories,
        confidence: this.calculateConfidence(categories)
      };

    } catch (error) {
      throw new AzureServiceError(
        'ContentSafety',
        error.code || 'CONTENT_ANALYSIS_ERROR',
        this.isRetryableError(error),
        `Failed to analyze content safety: ${error.message}`
      );
    }
  }

  async detectCrisis(text: string): Promise<CrisisDetectionResult> {
    try {
      // First, run standard content safety analysis
      const safetyResult = await this.analyzeText(text);
      
      // Enhanced crisis detection with mental health specific analysis
      const crisisAnalysis = await this.performMentalHealthCrisisAnalysis(text);
      
      // Combine results
      const crisisDetected = this.isCrisisDetected(safetyResult, crisisAnalysis);
      const riskLevel = this.assessCrisisRiskLevel(safetyResult, crisisAnalysis);
      const indicators = this.extractCrisisIndicators(text, safetyResult, crisisAnalysis);
      const recommendedActions = this.generateCrisisActions(riskLevel, indicators);
      const emergencyResources = this.getEmergencyResourcesForCrisis(riskLevel);

      return {
        crisisDetected,
        riskLevel,
        indicators,
        recommendedActions,
        emergencyResources
      };

    } catch (error) {
      console.error('Error in crisis detection:', error);
      
      // Conservative fallback - flag potential crisis for manual review
      return {
        crisisDetected: true,
        riskLevel: 'medium',
        indicators: ['Analysis unavailable - manual review required'],
        recommendedActions: [
          'If you are in immediate danger, call 911',
          'Contact the 988 Suicide & Crisis Lifeline: 988',
          'Reach out to a trusted person for support'
        ],
        emergencyResources: this.getEmergencyResourcesForCrisis('medium')
      };
    }
  }

  async moderateContent(text: string): Promise<ModerationResult> {
    try {
      const safetyResult = await this.analyzeText(text);
      
      // Determine if content should be blocked
      const shouldBlock = this.shouldBlockContent(safetyResult);
      const reason = shouldBlock ? this.generateModerationReason(safetyResult) : undefined;
      const flaggedCategories = safetyResult.categories
        .filter(cat => cat.severity >= 4)
        .map(cat => cat.category);

      return {
        blocked: shouldBlock,
        reason,
        categories: flaggedCategories
      };

    } catch (error) {
      throw new AzureServiceError(
        'ContentSafety',
        error.code || 'CONTENT_MODERATION_ERROR',
        this.isRetryableError(error),
        `Failed to moderate content: ${error.message}`
      );
    }
  }

  private async performMentalHealthCrisisAnalysis(text: string): Promise<{
    suicidalIdeation: boolean;
    selfHarmRisk: boolean;
    severeDistress: boolean;
    hopelessness: boolean;
    immediateRisk: boolean;
  }> {
    const lowerText = text.toLowerCase();
    
    // Suicidal ideation keywords
    const suicidalKeywords = [
      'kill myself', 'suicide', 'end my life', 'take my own life', 'not worth living',
      'better off dead', 'want to die', 'end it all', 'no reason to live'
    ];
    
    // Self-harm keywords
    const selfHarmKeywords = [
      'hurt myself', 'cut myself', 'self harm', 'self-harm', 'harm myself',
      'cut my', 'burn myself', 'overdose', 'pills'
    ];
    
    // Severe distress keywords
    const distressKeywords = [
      'can\'t take it anymore', 'breaking point', 'can\'t go on', 'too much pain',
      'unbearable', 'torture', 'agony', 'suffering'
    ];
    
    // Hopelessness keywords
    const hopelessnessKeywords = [
      'hopeless', 'no hope', 'pointless', 'no point', 'give up', 'no way out',
      'trapped', 'stuck forever', 'never get better', 'no future'
    ];
    
    // Immediate risk keywords
    const immediateRiskKeywords = [
      'tonight', 'today', 'right now', 'going to', 'plan to', 'ready to',
      'have the', 'got the', 'found a way'
    ];

    return {
      suicidalIdeation: suicidalKeywords.some(keyword => lowerText.includes(keyword)),
      selfHarmRisk: selfHarmKeywords.some(keyword => lowerText.includes(keyword)),
      severeDistress: distressKeywords.some(keyword => lowerText.includes(keyword)),
      hopelessness: hopelessnessKeywords.some(keyword => lowerText.includes(keyword)),
      immediateRisk: immediateRiskKeywords.some(keyword => lowerText.includes(keyword))
    };
  }

  private determineRiskLevel(severity: number, categories: SafetyCategory[]): 'low' | 'medium' | 'high' | 'crisis' {
    // Check for self-harm category specifically
    const selfHarmCategory = categories.find(cat => cat.category === 'self_harm');
    
    if (selfHarmCategory && selfHarmCategory.severity >= 6) {
      return 'crisis';
    }
    
    if (severity >= 6) return 'high';
    if (severity >= 4) return 'medium';
    return 'low';
  }

  private calculateConfidence(categories: SafetyCategory[]): number {
    if (categories.length === 0) return 0.5;
    
    const avgSeverity = categories.reduce((sum, cat) => sum + cat.severity, 0) / categories.length;
    return Math.min(avgSeverity / 7, 1); // Normalize to 0-1 range
  }

  private isCrisisDetected(safetyResult: SafetyResult, crisisAnalysis: any): boolean {
    // Crisis is detected if:
    // 1. High risk level from content safety
    // 2. Suicidal ideation detected
    // 3. Self-harm risk with immediate indicators
    
    return safetyResult.riskLevel === 'crisis' ||
           crisisAnalysis.suicidalIdeation ||
           (crisisAnalysis.selfHarmRisk && crisisAnalysis.immediateRisk);
  }

  private assessCrisisRiskLevel(safetyResult: SafetyResult, crisisAnalysis: any): 'low' | 'medium' | 'high' | 'crisis' {
    // Immediate crisis
    if (crisisAnalysis.suicidalIdeation && crisisAnalysis.immediateRisk) {
      return 'crisis';
    }
    
    // High risk
    if (crisisAnalysis.suicidalIdeation || 
        (crisisAnalysis.selfHarmRisk && crisisAnalysis.severeDistress) ||
        safetyResult.riskLevel === 'crisis') {
      return 'high';
    }
    
    // Medium risk
    if (crisisAnalysis.selfHarmRisk || 
        crisisAnalysis.severeDistress ||
        crisisAnalysis.hopelessness ||
        safetyResult.riskLevel === 'high') {
      return 'medium';
    }
    
    return 'low';
  }

  private extractCrisisIndicators(text: string, safetyResult: SafetyResult, crisisAnalysis: any): string[] {
    const indicators: string[] = [];
    
    if (crisisAnalysis.suicidalIdeation) {
      indicators.push('Suicidal ideation detected');
    }
    
    if (crisisAnalysis.selfHarmRisk) {
      indicators.push('Self-harm risk identified');
    }
    
    if (crisisAnalysis.severeDistress) {
      indicators.push('Severe emotional distress');
    }
    
    if (crisisAnalysis.hopelessness) {
      indicators.push('Expressions of hopelessness');
    }
    
    if (crisisAnalysis.immediateRisk) {
      indicators.push('Immediate risk indicators');
    }
    
    // Add content safety categories
    safetyResult.categories.forEach(category => {
      if (category.severity >= 4) {
        indicators.push(`${category.category} content detected (severity: ${category.severity})`);
      }
    });
    
    return indicators;
  }

  private generateCrisisActions(riskLevel: string, indicators: string[]): string[] {
    const actions: string[] = [];
    
    switch (riskLevel) {
      case 'crisis':
        actions.push('🚨 IMMEDIATE ACTION REQUIRED');
        actions.push('If you are in immediate danger, call 911 now');
        actions.push('Call the 988 Suicide & Crisis Lifeline: 988 (available 24/7)');
        actions.push('Go to your nearest emergency room');
        actions.push('Contact a trusted friend or family member immediately');
        actions.push('Do not leave yourself alone');
        break;
        
      case 'high':
        actions.push('Contact the 988 Suicide & Crisis Lifeline: 988');
        actions.push('Reach out to your campus counseling center immediately');
        actions.push('Contact a mental health professional');
        actions.push('Inform a trusted friend or family member about how you\'re feeling');
        actions.push('Consider going to an emergency room if feelings worsen');
        break;
        
      case 'medium':
        actions.push('Schedule an appointment with a counselor or therapist');
        actions.push('Contact your campus mental health services');
        actions.push('Reach out to a trusted friend, family member, or mentor');
        actions.push('Consider calling a mental health helpline for support');
        actions.push('Practice immediate self-care and safety planning');
        break;
        
      default:
        actions.push('Continue monitoring your mental health');
        actions.push('Consider talking to someone you trust');
        actions.push('Practice self-care strategies');
        break;
    }
    
    return actions;
  }

  private getEmergencyResourcesForCrisis(riskLevel: string): EmergencyResource[] {
    const resources: EmergencyResource[] = [
      {
        name: '988 Suicide & Crisis Lifeline',
        phone: '988',
        website: 'https://988lifeline.org',
        description: 'Free and confidential emotional support 24/7',
        availability: '24/7'
      },
      {
        name: 'Crisis Text Line',
        phone: 'Text HOME to 741741',
        website: 'https://www.crisistextline.org',
        description: 'Free, 24/7 support via text message',
        availability: '24/7'
      }
    ];

    if (riskLevel === 'crisis' || riskLevel === 'high') {
      resources.unshift({
        name: 'Emergency Services',
        phone: '911',
        description: 'For immediate life-threatening emergencies',
        availability: '24/7'
      });
    }

    // Add international student specific resources
    resources.push(
      {
        name: 'International Student Crisis Support',
        phone: '1-800-366-8288',
        website: 'https://www.internationalstudents.org/crisis-support',
        description: 'Specialized support for international students',
        availability: '24/7'
      },
      {
        name: 'Campus Counseling Center',
        phone: 'Contact your university',
        description: 'On-campus mental health services',
        availability: 'Business hours (emergency services available 24/7)'
      }
    );

    return resources;
  }

  private shouldBlockContent(safetyResult: SafetyResult): boolean {
    // Block content with high severity in harmful categories
    return safetyResult.categories.some(category => 
      category.severity >= 6 && 
      ['hate', 'violence'].includes(category.category)
    );
  }

  private generateModerationReason(safetyResult: SafetyResult): string {
    const flaggedCategories = safetyResult.categories
      .filter(cat => cat.severity >= 4)
      .map(cat => cat.category);
    
    if (flaggedCategories.length === 0) {
      return 'Content flagged for review';
    }
    
    return `Content contains ${flaggedCategories.join(', ')} that may be harmful`;
  }

  private isRetryableError(error: any): boolean {
    const retryableCodes = ['429', '500', '502', '503', '504', 'ECONNRESET', 'ETIMEDOUT'];
    return retryableCodes.includes(error.code) || retryableCodes.includes(error.status?.toString());
  }
}