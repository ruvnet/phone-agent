/**
 * Types for webhook payloads and events
 */

/**
 * Resend webhook event types
 */
export enum ResendEventType {
  EMAIL_SENT = 'email.sent',
  EMAIL_DELIVERED = 'email.delivered',
  EMAIL_DELIVERY_DELAYED = 'email.delivery_delayed',
  EMAIL_COMPLAINED = 'email.complained',
  EMAIL_BOUNCED = 'email.bounced',
  EMAIL_OPENED = 'email.opened',
  EMAIL_CLICKED = 'email.clicked',
}

/**
 * Base interface for Resend webhook payloads
 */
export interface ResendWebhookBase {
  created_at: string;
  data: {
    id: string;
    object: string;
    created_at: string;
    to: string[];
    from: string;
    subject: string;
    html?: string;
    text?: string;
    bcc?: string[];
    cc?: string[];
    reply_to?: string[];
    last_event?: string;
  };
}

/**
 * Interface for email.sent events
 */
export interface ResendEmailSentWebhook extends ResendWebhookBase {
  type: ResendEventType.EMAIL_SENT;
}

/**
 * Interface for email.delivered events
 */
export interface ResendEmailDeliveredWebhook extends ResendWebhookBase {
  type: ResendEventType.EMAIL_DELIVERED;
}

/**
 * Interface for email.delivery_delayed events
 */
export interface ResendEmailDeliveryDelayedWebhook extends ResendWebhookBase {
  type: ResendEventType.EMAIL_DELIVERY_DELAYED;
}

/**
 * Interface for email.complained events
 */
export interface ResendEmailComplainedWebhook extends ResendWebhookBase {
  type: ResendEventType.EMAIL_COMPLAINED;
}

/**
 * Interface for email.bounced events
 */
export interface ResendEmailBouncedWebhook extends ResendWebhookBase {
  type: ResendEventType.EMAIL_BOUNCED;
  data: ResendWebhookBase['data'] & {
    bounce: {
      code: string;
      description: string;
    };
  };
}

/**
 * Interface for email.opened events
 */
export interface ResendEmailOpenedWebhook extends ResendWebhookBase {
  type: ResendEventType.EMAIL_OPENED;
  data: ResendWebhookBase['data'] & {
    email: {
      ip_address: string;
      user_agent: string;
    };
  };
}

/**
 * Interface for email.clicked events
 */
export interface ResendEmailClickedWebhook extends ResendWebhookBase {
  type: ResendEventType.EMAIL_CLICKED;
  data: ResendWebhookBase['data'] & {
    email: {
      ip_address: string;
      user_agent: string;
      url: string;
    };
  };
}

/**
 * Union type for all Resend webhook payloads
 */
export type ResendWebhookPayload =
  | ResendEmailSentWebhook
  | ResendEmailDeliveredWebhook
  | ResendEmailDeliveryDelayedWebhook
  | ResendEmailComplainedWebhook
  | ResendEmailBouncedWebhook
  | ResendEmailOpenedWebhook
  | ResendEmailClickedWebhook;

/**
 * Interface for transformed webhook payload
 */
export interface TransformedWebhookPayload {
  id: string;
  timestamp: number;
  source: 'resend';
  eventType: string;
  emailId: string;
  emailData: {
    from: string;
    to: string[];
    subject: string;
    sentAt: string;
  };
  eventData: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Interface for webhook processing result
 */
export interface WebhookProcessingResult {
  success: boolean;
  webhookId: string;
  eventType: string;
  timestamp: number;
  error?: string;
  statusCode?: number;
}