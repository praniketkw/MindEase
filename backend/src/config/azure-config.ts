import { AzureServiceConfig } from '../interfaces/azure-services';
import * as dotenv from 'dotenv';

dotenv.config();

export class AzureConfigService {
  private static instance: AzureConfigService;
  private config: AzureServiceConfig;

  private constructor() {
    this.config = this.loadConfiguration();
    this.validateConfiguration();
  }

  public static getInstance(): AzureConfigService {
    if (!AzureConfigService.instance) {
      AzureConfigService.instance = new AzureConfigService();
    }
    return AzureConfigService.instance;
  }

  public getConfig(): AzureServiceConfig {
    return this.config;
  }

  public getOpenAIConfig() {
    return this.config.openai;
  }

  public getLanguageConfig() {
    return this.config.language;
  }

  public getContentSafetyConfig() {
    return this.config.contentSafety;
  }

  public getSpeechConfig() {
    return this.config.speech;
  }

  public getTranslatorConfig() {
    return this.config.translator;
  }

  private loadConfiguration(): AzureServiceConfig {
    return {
      openai: {
        endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
        apiKey: process.env.AZURE_OPENAI_API_KEY || '',
        deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4',
        apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview'
      },
      language: {
        endpoint: process.env.AZURE_LANGUAGE_ENDPOINT || '',
        apiKey: process.env.AZURE_LANGUAGE_API_KEY || ''
      },
      contentSafety: {
        endpoint: process.env.AZURE_CONTENT_SAFETY_ENDPOINT || '',
        apiKey: process.env.AZURE_CONTENT_SAFETY_API_KEY || ''
      },
      speech: {
        subscriptionKey: process.env.AZURE_SPEECH_KEY || '',
        region: process.env.AZURE_SPEECH_REGION || 'eastus'
      },
      translator: process.env.AZURE_TRANSLATOR_KEY ? {
        subscriptionKey: process.env.AZURE_TRANSLATOR_KEY,
        region: process.env.AZURE_TRANSLATOR_REGION || 'global'
      } : undefined
    };
  }

  private validateConfiguration(): void {
    const errors: string[] = [];

    // Validate OpenAI configuration
    if (!this.config.openai.endpoint) {
      errors.push('AZURE_OPENAI_ENDPOINT is required');
    }
    if (!this.config.openai.apiKey) {
      errors.push('AZURE_OPENAI_API_KEY is required');
    }
    if (!this.config.openai.deploymentName) {
      errors.push('AZURE_OPENAI_DEPLOYMENT_NAME is required');
    }

    // Validate Language service configuration
    if (!this.config.language.endpoint) {
      errors.push('AZURE_LANGUAGE_ENDPOINT is required');
    }
    if (!this.config.language.apiKey) {
      errors.push('AZURE_LANGUAGE_API_KEY is required');
    }

    // Validate Content Safety configuration
    if (!this.config.contentSafety.endpoint) {
      errors.push('AZURE_CONTENT_SAFETY_ENDPOINT is required');
    }
    if (!this.config.contentSafety.apiKey) {
      errors.push('AZURE_CONTENT_SAFETY_API_KEY is required');
    }

    // Validate Speech service configuration
    if (!this.config.speech.subscriptionKey) {
      errors.push('AZURE_SPEECH_KEY is required');
    }
    if (!this.config.speech.region) {
      errors.push('AZURE_SPEECH_REGION is required');
    }

    if (errors.length > 0) {
      console.warn('Azure configuration warnings:', errors);
      console.warn('Some services may not function properly without proper configuration.');
    }
  }

  public isServiceConfigured(service: 'openai' | 'language' | 'contentSafety' | 'speech' | 'translator'): boolean {
    switch (service) {
      case 'openai':
        return !!(this.config.openai.endpoint && this.config.openai.apiKey);
      case 'language':
        return !!(this.config.language.endpoint && this.config.language.apiKey);
      case 'contentSafety':
        return !!(this.config.contentSafety.endpoint && this.config.contentSafety.apiKey);
      case 'speech':
        return !!(this.config.speech.subscriptionKey && this.config.speech.region);
      case 'translator':
        return !!(this.config.translator?.subscriptionKey);
      default:
        return false;
    }
  }

  public getServiceStatus(): Record<string, boolean> {
    return {
      openai: this.isServiceConfigured('openai'),
      language: this.isServiceConfigured('language'),
      contentSafety: this.isServiceConfigured('contentSafety'),
      speech: this.isServiceConfigured('speech'),
      translator: this.isServiceConfigured('translator')
    };
  }
}