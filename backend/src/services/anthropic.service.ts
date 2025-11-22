import Anthropic from '@anthropic-ai/sdk';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export class AnthropicService {
  private client: Anthropic;
  private model: string = 'claude-3-5-haiku-20241022';

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    this.client = new Anthropic({
      apiKey: apiKey,
    });
  }

  async chat(userMessage: string, conversationHistory: Message[] = []) {
    const systemPrompt = `You are MindEase, a compassionate and empathetic AI mental health companion designed to support students, especially international and university students adjusting to new environments.

Your core principles:
1. **Empathy First**: Always respond with warmth, understanding, and validation
2. **Active Listening**: Acknowledge emotions and reflect back what you hear
3. **Non-Judgmental**: Create a safe space free from criticism
4. **Supportive**: Offer gentle encouragement and coping strategies
5. **Crisis Aware**: Recognize signs of crisis and provide appropriate resources

Guidelines:
- Use a warm, conversational tone (casual but professional)
- Validate feelings before offering suggestions
- Ask open-ended questions to encourage expression
- Suggest evidence-based coping strategies when appropriate
- Never diagnose or replace professional help
- If crisis indicators appear, gently encourage professional support
- Respect boundaries and privacy
- Be culturally sensitive

Remember: You're a supportive companion, not a therapist. Your goal is to provide emotional support, active listening, and helpful resources while encouraging professional help when needed.`;

    try {
      const messages: Anthropic.MessageParam[] = [
        ...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: 'user' as const,
          content: userMessage,
        },
      ];

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages,
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return {
          content: content.text,
          model: response.model,
          usage: response.usage,
        };
      }

      throw new Error('Unexpected response type from Claude');
    } catch (error: any) {
      console.error('Anthropic API error:', error);
      throw error;
    }
  }

  async analyzeSentiment(text: string): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    emotions: string[];
    confidence: number;
  }> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 256,
        system: 'You are an emotion analysis expert. Analyze the emotional content of text and respond ONLY with valid JSON in this exact format: {"sentiment": "positive|neutral|negative", "emotions": ["emotion1", "emotion2"], "confidence": 0.0-1.0}',
        messages: [{
          role: 'user',
          content: `Analyze the emotional content of this text: "${text}"`,
        }],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const analysis = JSON.parse(content.text);
        return analysis;
      }

      throw new Error('Unexpected response type');
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      // Fallback to simple analysis
      return {
        sentiment: 'neutral',
        emotions: [],
        confidence: 0.5,
      };
    }
  }
}
