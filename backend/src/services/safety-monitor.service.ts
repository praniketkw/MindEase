import { SafetyMonitorService, CrisisResponse, SafetyEvent, RiskAssessment } from '../interfaces/services';
import { AzureContentSafetyServiceImpl } from './azure-content-safety.service';
import { SafetyResult, EmergencyResource } from '../interfaces/azure-services';

export class SafetyMonitorServiceImpl implements SafetyMonitorService {
  private contentSafetyService: AzureContentSafetyServiceImpl;
  private safetyEvents: Map<string, SafetyEvent[]> = new Map();

  constructor(endpoint: string, apiKey: string) {
    this.contentSafetyService = new AzureContentSafetyServiceImpl(endpoint, apiKey);
  }

  async checkContent(text: string): Promise<SafetyResult> {
    try {
      return await this.contentSafetyService.analyzeText(text);
    } catch (error) {
      console.error('Error checking content safety:', error);
      
      // Return conservative safety result if service fails
      return {
        isSafe: false,
        riskLevel: 'medium',
        categories: [],
        confidence: 0.5
      };
    }
  }

  async handleCrisisDetection(userId: string, content: string): Promise<CrisisResponse> {
    try {
      const crisisResult = await this.contentSafetyService.detectCrisis(content);
      
      // Log the crisis event
      await this.logSafetyEvent(userId, {
        type: 'crisis_detected',
        severity: this.mapRiskLevelToSeverity(crisisResult.riskLevel),
        timestamp: new Date(),
        context: `Crisis detection: ${crisisResult.riskLevel}`,
        actionTaken: 'Crisis response initiated'
      });

      // Generate appropriate response
      const response: CrisisResponse = {
        immediate: crisisResult.riskLevel === 'crisis',
        resources: crisisResult.emergencyResources,
        responseMessage: this.generateCrisisResponseMessage(crisisResult.riskLevel, crisisResult.indicators),
        followUpRequired: crisisResult.riskLevel === 'crisis' || crisisResult.riskLevel === 'high'
      };

      return response;

    } catch (error) {
      console.error('Error handling crisis detection:', error);
      
      // Return conservative crisis response
      return {
        immediate: true,
        resources: await this.getEmergencyResources(),
        responseMessage: this.generateFallbackCrisisMessage(),
        followUpRequired: true
      };
    }
  }

  async getEmergencyResources(location?: string): Promise<EmergencyResource[]> {
    // Base emergency resources
    const resources: EmergencyResource[] = [
      {
        name: '988 Suicide & Crisis Lifeline',
        phone: '988',
        website: 'https://988lifeline.org',
        description: 'Free and confidential emotional support to people in suicidal crisis or emotional distress 24 hours a day, 7 days a week',
        availability: '24/7',
        location: 'United States'
      },
      {
        name: 'Crisis Text Line',
        phone: 'Text HOME to 741741',
        website: 'https://www.crisistextline.org',
        description: 'Free, 24/7 support for those in crisis. Text with a trained Crisis Counselor',
        availability: '24/7',
        location: 'United States, Canada, UK'
      },
      {
        name: 'National Alliance on Mental Illness (NAMI)',
        phone: '1-800-950-NAMI (6264)',
        website: 'https://www.nami.org',
        description: 'Information, referrals and support for people with mental health conditions',
        availability: 'Monday-Friday 10am-10pm ET',
        location: 'United States'
      },
      {
        name: 'International Association for Suicide Prevention',
        phone: 'Various by country',
        website: 'https://www.iasp.info/resources/Crisis_Centres/',
        description: 'Crisis centers and helplines worldwide',
        availability: 'Varies by location',
        location: 'International'
      }
    ];

    // Add location-specific resources if provided
    if (location) {
      resources.push(...this.getLocationSpecificResources(location));
    }

    // Add university-specific resources
    resources.push({
      name: 'Campus Counseling Services',
      phone: 'Contact your university directly',
      description: 'Most universities provide free or low-cost mental health services for students',
      availability: 'Varies by institution',
      location: 'Campus-based'
    });

    return resources;
  }

  async logSafetyEvent(userId: string, event: SafetyEvent): Promise<void> {
    try {
      if (!this.safetyEvents.has(userId)) {
        this.safetyEvents.set(userId, []);
      }

      const userEvents = this.safetyEvents.get(userId)!;
      userEvents.push(event);

      // Keep only the last 50 events per user
      if (userEvents.length > 50) {
        this.safetyEvents.set(userId, userEvents.slice(-50));
      }

      // Log to console for monitoring (in production, this would go to a proper logging system)
      console.log(`Safety Event - User: ${userId}, Type: ${event.type}, Severity: ${event.severity}`);

    } catch (error) {
      console.error('Error logging safety event:', error);
    }
  }

  async assessRiskLevel(userId: string, recentActivity: string[]): Promise<RiskAssessment> {
    try {
      const userEvents = this.safetyEvents.get(userId) || [];
      const recentEvents = userEvents.filter(event => 
        Date.now() - event.timestamp.getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
      );

      // Analyze recent activity for patterns
      const riskFactors: string[] = [];
      let riskLevel: 'low' | 'medium' | 'high' | 'crisis' = 'low';

      // Check for crisis events
      const crisisEvents = recentEvents.filter(event => event.severity === 'critical');
      if (crisisEvents.length > 0) {
        riskLevel = 'crisis';
        riskFactors.push('Recent crisis events detected');
      }

      // Check for escalating pattern
      const highSeverityEvents = recentEvents.filter(event => 
        event.severity === 'high' || event.severity === 'critical'
      );
      if (highSeverityEvents.length >= 3 && riskLevel !== 'crisis') {
        riskLevel = 'high';
        riskFactors.push('Multiple high-severity events in recent period');
      }

      // Analyze content patterns
      const contentAnalysis = await this.analyzeContentPatterns(recentActivity);
      if (contentAnalysis.concerningPatterns.length > 0) {
        riskFactors.push(...contentAnalysis.concerningPatterns);
        if (riskLevel === 'low') {
          riskLevel = contentAnalysis.suggestedRiskLevel;
        }
      }

      // Generate recommendations
      const recommendations = this.generateRiskRecommendations(riskLevel, riskFactors);

      return {
        riskLevel,
        factors: riskFactors,
        recommendations,
        monitoringRequired: riskLevel === 'high' || riskLevel === 'crisis'
      };

    } catch (error) {
      console.error('Error assessing risk level:', error);
      
      return {
        riskLevel: 'medium',
        factors: ['Unable to complete risk assessment'],
        recommendations: ['Manual review recommended', 'Consider professional consultation'],
        monitoringRequired: true
      };
    }
  }

  private mapRiskLevelToSeverity(riskLevel: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (riskLevel) {
      case 'crisis': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      default: return 'low';
    }
  }

  private generateCrisisResponseMessage(riskLevel: string, indicators: string[]): string {
    const baseMessage = "I'm very concerned about what you've shared with me. ";
    
    switch (riskLevel) {
      case 'crisis':
        return baseMessage + "Your safety is the most important thing right now. Please reach out for immediate help using the resources below. You don't have to go through this alone, and there are people who want to help you.";
      
      case 'high':
        return baseMessage + "It sounds like you're going through an incredibly difficult time. Please consider reaching out for professional support - you deserve help and care. The resources below can provide immediate assistance.";
      
      case 'medium':
        return baseMessage + "I can hear that you're struggling, and I want you to know that support is available. Consider talking to someone you trust or reaching out to one of the resources below.";
      
      default:
        return "I'm here to listen and support you. If you're having thoughts of hurting yourself or others, please reach out for help immediately.";
    }
  }

  private generateFallbackCrisisMessage(): string {
    return "I'm concerned about your wellbeing and want to make sure you have access to support. If you're having thoughts of hurting yourself or are in crisis, please reach out for help immediately. Your life has value and there are people who want to help you.";
  }

  private getLocationSpecificResources(location: string): EmergencyResource[] {
    const locationResources: Record<string, EmergencyResource[]> = {
      'canada': [
        {
          name: 'Talk Suicide Canada',
          phone: '1-833-456-4566',
          website: 'https://talksuicide.ca',
          description: '24/7 bilingual suicide prevention service',
          availability: '24/7',
          location: 'Canada'
        }
      ],
      'uk': [
        {
          name: 'Samaritans',
          phone: '116 123',
          website: 'https://www.samaritans.org',
          description: 'Free support for anyone in emotional distress',
          availability: '24/7',
          location: 'United Kingdom'
        }
      ],
      'australia': [
        {
          name: 'Lifeline Australia',
          phone: '13 11 14',
          website: 'https://www.lifeline.org.au',
          description: '24-hour crisis support and suicide prevention',
          availability: '24/7',
          location: 'Australia'
        }
      ]
    };

    return locationResources[location.toLowerCase()] || [];
  }

  private async analyzeContentPatterns(recentActivity: string[]): Promise<{
    concerningPatterns: string[];
    suggestedRiskLevel: 'low' | 'medium' | 'high' | 'crisis';
  }> {
    const concerningPatterns: string[] = [];
    let suggestedRiskLevel: 'low' | 'medium' | 'high' | 'crisis' = 'low';

    if (recentActivity.length === 0) {
      return { concerningPatterns, suggestedRiskLevel };
    }

    // Analyze patterns across recent messages
    const combinedText = recentActivity.join(' ').toLowerCase();
    
    // Check for escalating negative language
    const negativeWords = ['worse', 'terrible', 'awful', 'hopeless', 'pointless', 'unbearable'];
    const negativeCount = negativeWords.reduce((count, word) => 
      count + (combinedText.split(word).length - 1), 0);
    
    if (negativeCount > 5) {
      concerningPatterns.push('Escalating negative language patterns');
      suggestedRiskLevel = 'medium';
    }

    // Check for isolation indicators
    const isolationWords = ['alone', 'nobody', 'isolated', 'abandoned', 'rejected'];
    const isolationCount = isolationWords.reduce((count, word) => 
      count + (combinedText.split(word).length - 1), 0);
    
    if (isolationCount > 3) {
      concerningPatterns.push('Social isolation indicators');
      if (suggestedRiskLevel === 'low') suggestedRiskLevel = 'medium';
    }

    // Check for help-seeking behavior (positive indicator)
    const helpSeekingWords = ['help', 'support', 'talk', 'counselor', 'therapy'];
    const helpSeekingCount = helpSeekingWords.reduce((count, word) => 
      count + (combinedText.split(word).length - 1), 0);
    
    if (helpSeekingCount > 2) {
      concerningPatterns.push('Positive: Help-seeking behavior detected');
    }

    return { concerningPatterns, suggestedRiskLevel };
  }

  private generateRiskRecommendations(riskLevel: string, factors: string[]): string[] {
    const recommendations: string[] = [];

    switch (riskLevel) {
      case 'crisis':
        recommendations.push('Immediate professional intervention required');
        recommendations.push('24/7 monitoring and support');
        recommendations.push('Emergency contact activation');
        recommendations.push('Safety planning with mental health professional');
        break;

      case 'high':
        recommendations.push('Schedule immediate appointment with mental health professional');
        recommendations.push('Increase check-in frequency');
        recommendations.push('Activate support network');
        recommendations.push('Consider crisis safety planning');
        break;

      case 'medium':
        recommendations.push('Schedule appointment with counselor or therapist');
        recommendations.push('Regular check-ins and monitoring');
        recommendations.push('Encourage social support engagement');
        recommendations.push('Provide coping strategy resources');
        break;

      default:
        recommendations.push('Continue regular monitoring');
        recommendations.push('Maintain supportive communication');
        recommendations.push('Provide preventive mental health resources');
        break;
    }

    return recommendations;
  }
}