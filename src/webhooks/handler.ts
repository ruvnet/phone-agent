import { webhookConfig } from '../config/webhook';
import { ResendWebhookPayload, WebhookProcessingResult } from '../types/webhook';
import { verifyWebhookSignature } from '../utils/security';
import { validateResendPayload, transformResendWebhook } from './transformer';
import { forwardWebhook, storeFailedWebhook } from './forwarder';

/**
 * Interface for webhook request data
 */
interface WebhookRequestData {
  body: string;
  headers: Record<string, string>;
}

/**
 * Process a webhook request from Resend
 * 
 * @param requestData The webhook request data
 * @returns A promise that resolves to a webhook processing result
 */
export async function processWebhook(
  requestData: WebhookRequestData
): Promise<WebhookProcessingResult> {
  const { body, headers } = requestData;
  
  try {
    // Get signature and timestamp from headers
    const signature = headers[webhookConfig.resend.signatureHeader];
    const timestamp = headers[webhookConfig.resend.timestampHeader];
    
    // Verify the webhook signature
    const signatureResult = await verifyWebhookSignature(body, signature, timestamp);
    
    if (!signatureResult.isValid) {
      return {
        success: false,
        webhookId: 'invalid_signature',
        eventType: 'unknown',
        timestamp: Math.floor(Date.now() / 1000),
        error: signatureResult.error || 'Invalid webhook signature',
      };
    }
    
    // Parse the payload
    let payload: ResendWebhookPayload;
    try {
      payload = JSON.parse(body) as ResendWebhookPayload;
    } catch (error) {
      return {
        success: false,
        webhookId: 'invalid_json',
        eventType: 'unknown',
        timestamp: Math.floor(Date.now() / 1000),
        error: `Invalid JSON payload: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
    
    // Validate the payload structure
    const validationResult = validateResendPayload(payload);
    if (!validationResult.isValid) {
      return {
        success: false,
        webhookId: 'invalid_payload',
        eventType: payload.type || 'unknown',
        timestamp: Math.floor(Date.now() / 1000),
        error: validationResult.error || 'Invalid payload structure',
      };
    }
    
    // Transform the payload
    const transformedPayload = transformResendWebhook(payload);
    
    // Log the webhook if debug is enabled
    if (webhookConfig.general.debug) {
      console.log(`Processing webhook: ${transformedPayload.id}`);
      console.log('Event type:', transformedPayload.eventType);
      console.log('Email ID:', transformedPayload.emailId);
    }
    
    // Forward the webhook to the target endpoint
    const forwardResult = await forwardWebhook(transformedPayload);
    
    // If forwarding failed and storage is enabled, store the failed webhook
    if (!forwardResult.success && webhookConfig.general.storeFailedPayloads) {
      storeFailedWebhook(transformedPayload, forwardResult.error || 'Unknown error');
    }
    
    return forwardResult;
  } catch (error) {
    // Handle any unexpected errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      success: false,
      webhookId: 'error',
      eventType: 'unknown',
      timestamp: Math.floor(Date.now() / 1000),
      error: `Error processing webhook: ${errorMessage}`,
    };
  }
}

/**
 * Create a response for the webhook request
 * 
 * @param result The webhook processing result
 * @returns An object with status code and response body
 */
export function createWebhookResponse(
  result: WebhookProcessingResult
): { statusCode: number; body: string } {
  if (result.success) {
    // Return 200 OK for successful processing
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Webhook processed successfully',
        webhookId: result.webhookId,
      }),
    };
  } else if (result.error?.includes('Invalid webhook signature')) {
    // Return 401 Unauthorized for invalid signatures
    return {
      statusCode: 401,
      body: JSON.stringify({
        success: false,
        message: 'Invalid webhook signature',
        error: result.error,
      }),
    };
  } else if (
    result.error?.includes('Invalid JSON payload') ||
    result.error?.includes('Invalid payload structure')
  ) {
    // Return 400 Bad Request for invalid payloads
    return {
      statusCode: 400,
      body: JSON.stringify({
        success: false,
        message: 'Invalid webhook payload',
        error: result.error,
      }),
    };
  } else {
    // Return 500 Internal Server Error for other errors
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Error processing webhook',
        error: result.error || 'Unknown error',
      }),
    };
  }
}