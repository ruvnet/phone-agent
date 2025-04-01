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
 * Default webhook configuration
 * Values are overridden by environment variables
 */
export const webhookConfig: WebhookConfig = {
  resend: {
    signingSecret: process.env.WEBHOOK_SIGNING_SECRET || '',
    signatureHeader: 'svix-signature',
    timestampHeader: 'svix-timestamp',
    maxAge: 300, // 5 minutes
  },
  target: {
    url: process.env.TARGET_WEBHOOK_URL || '',
    authToken: process.env.TARGET_WEBHOOK_AUTH_TOKEN || '',
    authHeader: 'Authorization',
    maxRetries: 3,
    retryDelay: 1000, // 1 second
  },
  general: {
    debug: process.env.DEBUG_WEBHOOKS === 'true',
    storeFailedPayloads: process.env.STORE_FAILED_PAYLOADS === 'true',
  },
};

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