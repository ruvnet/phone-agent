// Mock configuration utility for testing
export const config = {
  getEmailConfig: () => ({
    apiKey: 'test-api-key',
    senderEmail: 'test@example.com',
    senderName: 'Test Sender',
    templatesDir: './test/templates'
  }),
  
  getCalendarConfig: () => ({
    timezone: 'America/New_York',
    cacheDir: './test/cache'
  }),
  
  getBlandAiConfig: () => ({
    apiKey: 'test-bland-api-key',
    webhookSecret: 'test-webhook-secret',
    agentId: 'test-agent-id',
    baseUrl: 'https://api.bland.ai',
    maxCallDuration: 30,
    defaultRetryCount: 2
  }),
  
  get: (key: string, defaultValue?: string) => {
    const mockValues: Record<string, string> = {
      'RESEND_API_KEY': 'test-api-key',
      'SENDER_EMAIL': 'test@example.com',
      'SENDER_NAME': 'Test Sender',
      'DEFAULT_TIMEZONE': 'America/New_York',
      'BLAND_AI_API_KEY': 'test-bland-api-key',
      'BLAND_AI_WEBHOOK_SECRET': 'test-webhook-secret',
      'BLAND_AI_AGENT_ID': 'test-agent-id',
      'BLAND_AI_BASE_URL': 'https://api.bland.ai',
      'MAX_CALL_DURATION_MINUTES': '30',
      'DEFAULT_RETRY_COUNT': '2'
    };
    
    return mockValues[key] || defaultValue || '';
  },
  
  getNumber: (key: string, defaultValue: number) => {
    const mockValues: Record<string, number> = {
      'MAX_CALL_DURATION_MINUTES': 30,
      'DEFAULT_RETRY_COUNT': 2
    };
    
    return mockValues[key] !== undefined ? mockValues[key] : defaultValue;
  },
  
  getBoolean: (key: string, defaultValue: boolean) => {
    const mockValues: Record<string, boolean> = {
      'DEBUG_MODE': true,
      'ENABLE_LOGGING': true
    };
    
    return mockValues[key] !== undefined ? mockValues[key] : defaultValue;
  },
  
  isDevelopment: () => true
};