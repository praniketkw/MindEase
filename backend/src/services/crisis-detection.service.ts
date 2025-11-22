interface CrisisResult {
  isCrisis: boolean;
  level: 'none' | 'low' | 'medium' | 'high' | 'critical';
  indicators: string[];
  resources: CrisisResource[];
}

interface CrisisResource {
  name: string;
  contact: string;
  description: string;
  available: string;
}

export class CrisisDetectionService {
  private criticalKeywords = [
    'suicide', 'kill myself', 'end my life', 'want to die',
    'better off dead', 'no reason to live', 'can\'t go on',
  ];

  private highRiskKeywords = [
    'self harm', 'hurt myself', 'cutting', 'overdose',
    'hopeless', 'worthless', 'can\'t take it anymore',
  ];

  private mediumRiskKeywords = [
    'depressed', 'anxious', 'panic', 'scared', 'alone',
    'nobody cares', 'give up', 'exhausted', 'overwhelmed',
  ];

  private crisisResources: CrisisResource[] = [
    {
      name: '988 Suicide & Crisis Lifeline',
      contact: 'Call or text 988',
      description: '24/7 free and confidential support for people in distress',
      available: '24/7',
    },
    {
      name: 'Crisis Text Line',
      contact: 'Text HOME to 741741',
      description: 'Free 24/7 support via text message',
      available: '24/7',
    },
    {
      name: 'International Association for Suicide Prevention',
      contact: 'https://www.iasp.info/resources/Crisis_Centres/',
      description: 'Find crisis centers worldwide',
      available: '24/7',
    },
    {
      name: 'Emergency Services',
      contact: 'Call 911 (US) or your local emergency number',
      description: 'For immediate life-threatening emergencies',
      available: '24/7',
    },
  ];

  detectCrisis(message: string): CrisisResult {
    const lowerMessage = message.toLowerCase();
    const indicators: string[] = [];
    let level: CrisisResult['level'] = 'none';

    // Check for critical keywords
    for (const keyword of this.criticalKeywords) {
      if (lowerMessage.includes(keyword)) {
        indicators.push(`Critical indicator: "${keyword}"`);
        level = 'critical';
      }
    }

    // Check for high risk keywords
    if (level !== 'critical') {
      for (const keyword of this.highRiskKeywords) {
        if (lowerMessage.includes(keyword)) {
          indicators.push(`High risk indicator: "${keyword}"`);
          level = 'high';
        }
      }
    }

    // Check for medium risk keywords
    if (level === 'none') {
      for (const keyword of this.mediumRiskKeywords) {
        if (lowerMessage.includes(keyword)) {
          indicators.push(`Concern indicator: "${keyword}"`);
          level = 'medium';
        }
      }
    }

    const isCrisis = level === 'critical' || level === 'high';

    return {
      isCrisis,
      level,
      indicators,
      resources: isCrisis ? this.crisisResources : [],
    };
  }

  getCrisisResources(): CrisisResource[] {
    return this.crisisResources;
  }
}
