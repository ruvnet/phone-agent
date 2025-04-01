import { 
  ResendWebhookPayload, 
  ResendEventType, 
  TransformedWebhookPayload 
} from '../types/webhook';
import { generateWebhookId } from '../utils/security';

/**
 * Transform a Resend webhook payload into a standardized format
 * 
 * @param payload The original Resend webhook payload
 * @returns A transformed webhook payload
 */
export function transformResendWebhook(
  payload: ResendWebhookPayload
): TransformedWebhookPayload {
  // Extract common data
  const { type, data, created_at } = payload;
  const { id, from, to, subject, created_at: emailCreatedAt } = data;
  
  // Create the base transformed payload
  const transformedPayload: TransformedWebhookPayload = {
    id: generateWebhookId(),
    timestamp: Math.floor(Date.now() / 1000),
    source: 'resend',
    eventType: type,
    emailId: id,
    emailData: {
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      sentAt: emailCreatedAt,
    },
    eventData: {},
    metadata: {
      originalTimestamp: created_at,
    },
  };
  
  // Add event-specific data
  switch (type) {
    case ResendEventType.EMAIL_BOUNCED:
      transformedPayload.eventData = {
        bounceCode: (payload.data as any).bounce?.code || '',
        bounceDescription: (payload.data as any).bounce?.description || '',
      };
      break;
      
    case ResendEventType.EMAIL_OPENED:
      transformedPayload.eventData = {
        ipAddress: (payload.data as any).email?.ip_address || '',
        userAgent: (payload.data as any).email?.user_agent || '',
      };
      break;
      
    case ResendEventType.EMAIL_CLICKED:
      transformedPayload.eventData = {
        ipAddress: (payload.data as any).email?.ip_address || '',
        userAgent: (payload.data as any).email?.user_agent || '',
        url: (payload.data as any).email?.url || '',
      };
      break;
      
    case ResendEventType.EMAIL_COMPLAINED:
      // No additional data for complaints
      break;
      
    case ResendEventType.EMAIL_DELIVERED:
      // No additional data for deliveries
      break;
      
    case ResendEventType.EMAIL_DELIVERY_DELAYED:
      // No additional data for delays
      break;
      
    case ResendEventType.EMAIL_SENT:
      // No additional data for sent events
      break;
      
    default:
      // Handle unknown event types
      transformedPayload.eventData = {
        unknownEventType: type,
      };
  }
  
  return transformedPayload;
}

/**
 * Validate that a payload has the required fields for transformation
 * 
 * @param payload The payload to validate
 * @returns An object with validation result and optional error message
 */
export function validateResendPayload(
  payload: any
): { isValid: boolean; error?: string } {
  // Check if payload is an object
  if (!payload || typeof payload !== 'object') {
    return { isValid: false, error: 'Payload is not an object' };
  }
  
  // Check for required fields
  if (!payload.type) {
    return { isValid: false, error: 'Missing event type' };
  }
  
  if (!payload.data) {
    return { isValid: false, error: 'Missing data object' };
  }
  
  if (!payload.data.id) {
    return { isValid: false, error: 'Missing email ID' };
  }
  
  if (!payload.data.from) {
    return { isValid: false, error: 'Missing sender email' };
  }
  
  if (!payload.data.to) {
    return { isValid: false, error: 'Missing recipient email(s)' };
  }
  
  // Check if the event type is valid
  const validEventTypes = Object.values(ResendEventType);
  if (!validEventTypes.includes(payload.type as ResendEventType)) {
    return { 
      isValid: false, 
      error: `Invalid event type: ${payload.type}. Expected one of: ${validEventTypes.join(', ')}` 
    };
  }
  
  return { isValid: true };
}