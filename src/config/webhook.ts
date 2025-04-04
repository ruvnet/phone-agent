/**
 * Webhook configuration settings
 */

export interface WebhookConfig {
  // Resend webhook configuration
  resend: {
    // The secret used to validate webhook signatures
    signingSecret: string;
    // The header containing the signature
    signatureHeader: string;
    // The header containing the timestamp
    timestampHeader: string;
    // Maximum age of webhook requests (in seconds) to prevent replay attacks
    maxAge: number;
  };
  
  // Target webhook configuration
  target: {
    // The URL of the target webhook
    url: string;
    // The authentication token for the target webhook
    authToken: string;
    // The header name for authentication
    authHeader: string;
    // Maximum number of retry attempts for failed requests
    maxRetries: number;
    // Initial delay between retries (in ms)
    retryDelay: number;
  };
  
  // General webhook settings
  general: {
    // Whether to enable debug logging
    debug: boolean;
    // Whether to store failed webhook payloads
    storeFailedPayloads: boolean;
  };
}

/**
 * Get environment variables from Cloudflare environment
 * This function should be called with the env object from the request context
 */
export function getEnvVars(env: any = {}) {
  return {
    WEBHOOK_SIGNING_SECRET: env.WEBHOOK_SIGNING_SECRET || '',
    TARGET_WEBHOOK_URL: env.TARGET_WEBHOOK_URL || '',
    TARGET_WEBHOOK_AUTH_TOKEN: env.TARGET_WEBHOOK_AUTH_TOKEN || '',
    DEBUG_WEBHOOKS: env.DEBUG_WEBHOOKS === 'true',
    STORE_FAILED_PAYLOADS: env.STORE_FAILED_PAYLOADS === 'true',
  };
}

/**
 * Default webhook configuration
 * Values will be populated from environment variables at runtime
 */
export const webhookConfig: WebhookConfig = {
  resend: {
    signingSecret: '', // Will be populated at runtime
    signatureHeader: 'svix-signature',
    timestampHeader: 'svix-timestamp',
    maxAge: 300, // 5 minutes
  },
  target: {
    url: '', // Will be populated at runtime
    authToken: '', // Will be populated at runtime
    authHeader: 'Authorization',
    maxRetries: 3,
    retryDelay: 1000, // 1 second
  },
  general: {
    debug: false, // Will be populated at runtime
    storeFailedPayloads: true, // Will be populated at runtime
  },
};

/**
 * Initialize the webhook configuration with environment variables
 * @param env The environment variables object
 */
export function initWebhookConfig(env: any = {}) {
  const envVars = getEnvVars(env);
  
  webhookConfig.resend.signingSecret = envVars.WEBHOOK_SIGNING_SECRET;
  webhookConfig.target.url = envVars.TARGET_WEBHOOK_URL;
  webhookConfig.target.authToken = envVars.TARGET_WEBHOOK_AUTH_TOKEN;
  webhookConfig.general.debug = envVars.DEBUG_WEBHOOKS;
  webhookConfig.general.storeFailedPayloads = envVars.STORE_FAILED_PAYLOADS;
  
  return webhookConfig;
}

/**
 * Validate the webhook configuration
 * @returns An array of error messages, or an empty array if the configuration is valid
 */
export function validateWebhookConfig(): string[] {
  const errors: string[] = [];
  
  if (!webhookConfig.resend.signingSecret) {
    errors.push('Missing Resend webhook signing secret');
  }
  
  if (!webhookConfig.target.url) {
    errors.push('Missing target webhook URL');
  }
  
  if (!webhookConfig.target.authToken) {
    errors.push('Missing target webhook authentication token');
  }
  
  return errors;
}