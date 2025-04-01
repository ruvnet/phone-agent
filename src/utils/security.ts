import { createHmac, timingSafeEqual } from 'crypto';
import { webhookConfig } from '../config/webhook';

/**
 * Interface for webhook signature verification
 */
export interface SignatureVerificationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Verify a webhook signature using HMAC
 * 
 * @param payload The raw request body as a string
 * @param signature The signature from the request headers
 * @param timestamp The timestamp from the request headers
 * @returns A result object indicating if the signature is valid
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  timestamp: string
): SignatureVerificationResult {
  try {
    // Check if required parameters are provided
    if (!payload) {
      return { isValid: false, error: 'Missing payload' };
    }
    
    if (!signature) {
      return { isValid: false, error: 'Missing signature' };
    }
    
    if (!timestamp) {
      return { isValid: false, error: 'Missing timestamp' };
    }
    
    // Check if the webhook is too old (prevent replay attacks)
    const timestampNum = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    
    if (isNaN(timestampNum)) {
      return { isValid: false, error: 'Invalid timestamp format' };
    }
    
    if (now - timestampNum > webhookConfig.resend.maxAge) {
      return { 
        isValid: false, 
        error: `Webhook too old: ${now - timestampNum}s (max age: ${webhookConfig.resend.maxAge}s)` 
      };
    }
    
    // Get the signing secret from config
    const secret = webhookConfig.resend.signingSecret;
    
    if (!secret) {
      return { isValid: false, error: 'Webhook signing secret not configured' };
    }
    
    // Parse the signature header (format: v1,signature1,v2,signature2)
    const signatureParts = signature.split(',');
    let signatureV1: string | null = null;
    
    // Find the v1 signature
    for (let i = 0; i < signatureParts.length - 1; i += 2) {
      if (signatureParts[i] === 'v1') {
        signatureV1 = signatureParts[i + 1];
        break;
      }
    }
    
    if (!signatureV1) {
      return { isValid: false, error: 'Missing v1 signature' };
    }
    
    // Create the signature message (timestamp + '.' + payload)
    const signatureMessage = `${timestamp}.${payload}`;
    
    // Create the expected signature
    const hmac = createHmac('sha256', secret);
    hmac.update(signatureMessage);
    const expectedSignature = hmac.digest('hex');
    
    // Compare signatures using constant-time comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(signatureV1);
    const expectedBuffer = Buffer.from(expectedSignature);
    
    // Ensure the buffers are the same length for timingSafeEqual
    if (signatureBuffer.length !== expectedBuffer.length) {
      return { isValid: false, error: 'Invalid signature length' };
    }
    
    const isValid = timingSafeEqual(signatureBuffer, expectedBuffer);
    
    return { isValid };
  } catch (error) {
    return { 
      isValid: false, 
      error: `Error verifying signature: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Generate an authorization header value for the target webhook
 * 
 * @returns The authorization header value
 */
export function generateAuthHeader(): string {
  const { authToken } = webhookConfig.target;
  return `Bearer ${authToken}`;
}

/**
 * Generate a unique ID for a webhook request
 * 
 * @returns A unique ID string
 */
export function generateWebhookId(): string {
  return `wh_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}