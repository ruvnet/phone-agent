/**
 * Configuration utility for the AI Phone Agent
 * Adapted for Cloudflare Pages environment
 */

import { logger } from './logger';

/**
 * Interface for email configuration
 */
interface EmailConfig {
  apiKey: string;
  senderEmail: string;
  senderName: string;
  templatesDir: string;
}

/**
 * Interface for calendar configuration
 */
interface CalendarConfig {
  timezone: string;
  cacheDir?: string;
}

/**
 * Interface for Bland.ai configuration
 */
interface BlandAiConfig {
  apiKey: string;
  webhookSecret?: string;
  agentId?: string;
  baseUrl: string;
  maxCallDuration: number;
  defaultRetryCount: number;
}

/**
 * Configuration class for managing environment variables
 */
class Config {
  private env: Record<string, string | undefined>;
  private isDev: boolean;
  
  /**
   * Creates a new Config instance
   */
  constructor() {
    // For Cloudflare Pages, environment variables are available via process.env
    // or through the context.env in Pages Functions
    this.env = typeof process !== 'undefined' && process.env 
      ? process.env 
      : (typeof globalThis.env !== 'undefined' ? globalThis.env : {});
    
    // Determine if we're in development mode
    this.isDev = this.get('ENVIRONMENT', 'development') !== 'production';
    
    logger.debug('Config initialized', { isDev: this.isDev });
  }
  
  /**
   * Gets a configuration value
   * @param key - Configuration key
   * @param defaultValue - Default value if not found
   * @returns Configuration value
   */
  get(key: string, defaultValue?: string): string {
    const value = this.env[key];
    
    if (value === undefined && defaultValue === undefined) {
      logger.warn(`Configuration key not found: ${key}`);
    }
    
    return value !== undefined ? value : (defaultValue || '');
  }
  
  /**
   * Gets a numeric configuration value
   * @param key - Configuration key
   * @param defaultValue - Default value if not found
   * @returns Numeric configuration value
   */
  getNumber(key: string, defaultValue: number): number {
    const value = this.env[key];
    
    if (value === undefined) {
      return defaultValue;
    }
    
    const numValue = Number(value);
    
    if (isNaN(numValue)) {
      logger.warn(`Invalid numeric configuration value for ${key}: ${value}`);
      return defaultValue;
    }
    
    return numValue;
  }
  
  /**
   * Gets a boolean configuration value
   * @param key - Configuration key
   * @param defaultValue - Default value if not found
   * @returns Boolean configuration value
   */
  getBoolean(key: string, defaultValue: boolean): boolean {
    const value = this.env[key];
    
    if (value === undefined) {
      return defaultValue;
    }
    
    return value.toLowerCase() === 'true' || value === '1';
  }
  
  /**
   * Checks if we're in development mode
   * @returns True if in development mode
   */
  isDevelopment(): boolean {
    return this.isDev;
  }
  
  /**
   * Gets email configuration
   * @returns Email configuration
   */
  getEmailConfig(): EmailConfig {
    return {
      apiKey: this.get('RESEND_API_KEY', ''),
      senderEmail: this.get('SENDER_EMAIL', 'noreply@example.com'),
      senderName: this.get('SENDER_NAME', 'AI Phone Agent'),
      templatesDir: this.get('EMAIL_TEMPLATES_DIR', './templates/email')
    };
  }
  
  /**
   * Gets calendar configuration
   * @returns Calendar configuration
   */
  getCalendarConfig(): CalendarConfig {
    return {
      timezone: this.get('DEFAULT_TIMEZONE', 'UTC'),
      cacheDir: this.get('CALENDAR_CACHE_DIR')
    };
  }
  
  /**
   * Gets Bland.ai configuration
   * @returns Bland.ai configuration
   */
  getBlandAiConfig(): BlandAiConfig {
    return {
      apiKey: this.get('BLAND_AI_API_KEY', ''),
      webhookSecret: this.get('BLAND_AI_WEBHOOK_SECRET'),
      agentId: this.get('BLAND_AI_AGENT_ID'),
      baseUrl: this.get('BLAND_AI_BASE_URL', 'https://api.bland.ai'),
      maxCallDuration: this.getNumber('MAX_CALL_DURATION_MINUTES', 30),
      defaultRetryCount: this.getNumber('DEFAULT_RETRY_COUNT', 2)
    };
  }
}

// Export a default instance for convenience
export const config = new Config();