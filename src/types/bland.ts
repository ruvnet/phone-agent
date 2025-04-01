/**
 * Type definitions for Bland.ai API
 */

/**
 * Interface for Bland.ai service configuration
 */
export interface BlandAiConfig {
  apiKey: string;
  webhookSecret: string;
  agentId: string;
  baseUrl: string;
  maxCallDuration: number;
  defaultRetryCount: number;
}

/**
 * Interface for call options when scheduling with Bland.ai
 */
export interface BlandAiCallOptions {
  phoneNumber: string;
  scheduledTime: Date | string;
  task?: string;
  maxDuration?: number;
  webhookUrl?: string;
  agentId?: string;
  voiceId?: string;
  recordCall?: boolean;
  recipientName?: string;
  recipientEmail?: string;
  topic?: string;
  scheduledBy?: string;
  callId?: string;
  goal?: string;
  agentName?: string;
  agentConfig?: {
    name: string;
    goals: string[];
    constraints: string[];
  };
  // Additional properties for email and calendar functionality
  sendConfirmation?: boolean;
  addCalendarEvent?: boolean;
  durationMinutes?: number;
  description?: string;
}

/**
 * Interface for webhook event from Bland.ai
 */
export interface BlandAiWebhookEvent {
  type: string;
  call_id: string;
  timestamp: string;
  data?: any;
}

/**
 * Legacy interface for backward compatibility
 */
export interface WebhookEvent extends BlandAiWebhookEvent {}