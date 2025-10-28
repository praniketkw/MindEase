import { AzureConfigService } from '../config/azure-config';
import { AzureOpenAIServiceImpl } from './azure-openai.service';
import { AzureLanguageServiceImpl } from './azure-language.service';
import { AzureContentSafetyServiceImpl } from './azure-content-safety.service';
import { AzureSpeechServiceImpl } from './azure-speech.service';
import { ConversationServiceImpl } from './conversation.service';
import { EmotionAnalysisService } from './emotion-analysis.service';
import { SafetyMonitorServiceImpl } from './safety-monitor.service';
import { VoiceInterfaceService } from './voice-interface.service';
import { ContextManagerService } from './context-manager.service';

export class AzureServiceFactory {
  private static instance: AzureServiceFactory;
  private config: AzureConfigService;
  
  // Service instances
  private openAIService?: AzureOpenAIServiceImpl;
  private languageService?: AzureLanguageServiceImpl;
  private contentSafetyService?: AzureContentSafetyServiceImpl;
  private speechService?: AzureSpeechServiceImpl;
  private conversationService?: ConversationServiceImpl;
  private emotionAnalysisService?: EmotionAnalysisService;
  private safetyMonitorService?: SafetyMonitorServiceImpl;
  private voiceInterfaceService?: VoiceInterfaceService;
  private contextManagerService?: ContextManagerService;

  private constructor() {
    this.config = AzureConfigService.getInstance();
  }

  public static getInstance(): AzureServiceFactory {
    if (!AzureServiceFactory.instance) {
      AzureServiceFactory.instance = new AzureServiceFactory();
    }
    return AzureServiceFactory.instance;
  }

  public getOpenAIService(): AzureOpenAIServiceImpl {
    if (!this.openAIService) {
      const openAIConfig = this.config.getOpenAIConfig();
      this.openAIService = new AzureOpenAIServiceImpl(
        openAIConfig.endpoint,
        openAIConfig.apiKey,
        openAIConfig.deploymentName
      );
    }
    return this.openAIService;
  }

  public getLanguageService(): AzureLanguageServiceImpl {
    if (!this.languageService) {
      const languageConfig = this.config.getLanguageConfig();
      this.languageService = new AzureLanguageServiceImpl(
        languageConfig.endpoint,
        languageConfig.apiKey
      );
    }
    return this.languageService;
  }

  public getContentSafetyService(): AzureContentSafetyServiceImpl {
    if (!this.contentSafetyService) {
      const safetyConfig = this.config.getContentSafetyConfig();
      this.contentSafetyService = new AzureContentSafetyServiceImpl(
        safetyConfig.endpoint,
        safetyConfig.apiKey
      );
    }
    return this.contentSafetyService;
  }

  public getSpeechService(): AzureSpeechServiceImpl {
    if (!this.speechService) {
      const speechConfig = this.config.getSpeechConfig();
      this.speechService = new AzureSpeechServiceImpl(
        speechConfig.subscriptionKey,
        speechConfig.region
      );
    }
    return this.speechService;
  }

  public getConversationService(): ConversationServiceImpl {
    if (!this.conversationService) {
      const openAIConfig = this.config.getOpenAIConfig();
      this.conversationService = new ConversationServiceImpl(
        openAIConfig.endpoint,
        openAIConfig.apiKey,
        openAIConfig.deploymentName
      );
    }
    return this.conversationService;
  }

  public getEmotionAnalysisService(): EmotionAnalysisService {
    if (!this.emotionAnalysisService) {
      const languageConfig = this.config.getLanguageConfig();
      this.emotionAnalysisService = new EmotionAnalysisService(
        languageConfig.endpoint,
        languageConfig.apiKey
      );
    }
    return this.emotionAnalysisService;
  }

  public getSafetyMonitorService(): SafetyMonitorServiceImpl {
    if (!this.safetyMonitorService) {
      const safetyConfig = this.config.getContentSafetyConfig();
      this.safetyMonitorService = new SafetyMonitorServiceImpl(
        safetyConfig.endpoint,
        safetyConfig.apiKey
      );
    }
    return this.safetyMonitorService;
  }

  public getVoiceInterfaceService(): VoiceInterfaceService {
    if (!this.voiceInterfaceService) {
      const speechConfig = this.config.getSpeechConfig();
      const openAIConfig = this.config.getOpenAIConfig();
      const languageConfig = this.config.getLanguageConfig();
      
      this.voiceInterfaceService = new VoiceInterfaceService(
        speechConfig.subscriptionKey,
        speechConfig.region,
        openAIConfig.endpoint,
        openAIConfig.apiKey,
        openAIConfig.deploymentName,
        languageConfig.endpoint,
        languageConfig.apiKey
      );
    }
    return this.voiceInterfaceService;
  }

  public getContextManagerService(): ContextManagerService {
    if (!this.contextManagerService) {
      this.contextManagerService = new ContextManagerService();
    }
    return this.contextManagerService;
  }

  public async healthCheck(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, {
      status: 'healthy' | 'degraded' | 'unhealthy';
      configured: boolean;
      error?: string;
    }>;
  }> {
    const serviceStatus = this.config.getServiceStatus();
    const results: Record<string, any> = {};
    
    // Check each service
    for (const [serviceName, isConfigured] of Object.entries(serviceStatus)) {
      results[serviceName] = {
        configured: isConfigured,
        status: isConfigured ? 'healthy' : 'unhealthy',
        error: isConfigured ? undefined : 'Service not configured'
      };
    }

    // Determine overall health
    const healthyServices = Object.values(results).filter(r => r.status === 'healthy').length;
    const totalServices = Object.keys(results).length;
    
    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyServices === totalServices) {
      overall = 'healthy';
    } else if (healthyServices >= totalServices * 0.5) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }

    return {
      overall,
      services: results
    };
  }

  public getServiceCapabilities(): {
    conversation: boolean;
    emotionAnalysis: boolean;
    crisisDetection: boolean;
    voiceInterface: boolean;
    multilingual: boolean;
  } {
    const serviceStatus = this.config.getServiceStatus();
    
    return {
      conversation: serviceStatus.openai,
      emotionAnalysis: serviceStatus.language,
      crisisDetection: serviceStatus.contentSafety,
      voiceInterface: serviceStatus.speech,
      multilingual: serviceStatus.translator || false
    };
  }

  public async initializeServices(): Promise<void> {
    try {
      console.log('Initializing Azure AI services...');
      
      // Pre-initialize critical services
      if (this.config.isServiceConfigured('openai')) {
        this.getOpenAIService();
        console.log('✓ Azure OpenAI Service initialized');
      }
      
      if (this.config.isServiceConfigured('language')) {
        this.getLanguageService();
        this.getEmotionAnalysisService();
        console.log('✓ Azure Language Service initialized');
      }
      
      if (this.config.isServiceConfigured('contentSafety')) {
        this.getContentSafetyService();
        this.getSafetyMonitorService();
        console.log('✓ Azure Content Safety Service initialized');
      }
      
      if (this.config.isServiceConfigured('speech')) {
        this.getSpeechService();
        console.log('✓ Azure Speech Service initialized');
      }

      // Initialize composite services
      this.getConversationService();
      this.getContextManagerService();
      
      if (this.config.isServiceConfigured('speech') && 
          this.config.isServiceConfigured('openai') && 
          this.config.isServiceConfigured('language')) {
        this.getVoiceInterfaceService();
        console.log('✓ Voice Interface Service initialized');
      }

      console.log('Azure AI services initialization complete');
      
    } catch (error) {
      console.error('Error initializing Azure services:', error);
      throw error;
    }
  }

  public async shutdown(): Promise<void> {
    try {
      console.log('Shutting down Azure AI services...');
      
      // Clean up any resources if needed
      // Most Azure SDK clients don't require explicit cleanup
      
      // Clear service instances
      this.openAIService = undefined;
      this.languageService = undefined;
      this.contentSafetyService = undefined;
      this.speechService = undefined;
      this.conversationService = undefined;
      this.emotionAnalysisService = undefined;
      this.safetyMonitorService = undefined;
      this.voiceInterfaceService = undefined;
      this.contextManagerService = undefined;
      
      console.log('Azure AI services shutdown complete');
      
    } catch (error) {
      console.error('Error shutting down Azure services:', error);
    }
  }
}