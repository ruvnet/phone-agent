import axios, { AxiosInstance } from 'axios';
import { config } from '../utils/config';
import { AppError, logger } from '../utils/logger';
import { storageService } from './storage-service';
import { emailService } from './email-service';
import { calendarService } from './calendar-service';
import { BlandAiCallOptions, BlandAiWebhookEvent } from '../types/bland';

/**
 * Status of a Bland.ai call
 */
export type BlandAiCallStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'failed' | 'unknown';

/**
 * Interface for Bland.ai call details
 */
export interface BlandAiCallDetails {
  callId: string;
  phoneNumber: string;
  scheduledTime: string;
  status: BlandAiCallStatus;
  topic?: string;
  recipientName?: string;
  recipientEmail?: string;
  agentId?: string;
  voiceId?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  endedAt?: string;
  failedAt?: string;
  failureReason?: string;
  recordingUrl?: string;
  transcriptUrl?: string;
  duration?: number;
  cancelledAt?: string;
}

/**
 * Interface for Bland.ai service configuration
 */
export interface BlandAiServiceConfig {
  apiKey?: string;
  apiUrl?: string;
  defaultVoiceId?: string;
  defaultAgentId?: string;
  retryCount?: number;
  retryDelay?: number;
}

/**
 * Service for interacting with Bland.ai API
 */
export class BlandAiService {
  private apiKey: string;
  private apiUrl: string;
  private defaultVoiceId: string;
  private defaultAgentId: string;
  private retryCount: number;
  private retryDelay: number;
  private axiosClient: AxiosInstance;

  /**
   * Create a new Bland.ai service
   * @param options Configuration options
   */
  constructor(options: BlandAiServiceConfig = {}) {
    const defaultConfig = config.getBlandAiConfig();
    
    this.apiKey = options.apiKey || defaultConfig.apiKey || '';
    this.apiUrl = options.apiUrl || defaultConfig.baseUrl || 'https://api.bland.ai';
    this.defaultVoiceId = options.defaultVoiceId || '';
    this.defaultAgentId = options.defaultAgentId || defaultConfig.agentId || '';
    this.retryCount = options.retryCount || defaultConfig.defaultRetryCount || 3;
    this.retryDelay = options.retryDelay || 1000;
    
    // Create axios client with default config
    this.axiosClient = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 seconds
    });
  }

  /**
   * Schedule a call with Bland.ai
   * @param options Call options
   * @returns Promise resolving to the scheduled call details
   */
  async scheduleCall(options: BlandAiCallOptions): Promise<BlandAiCallDetails> {
    try {
      const { phoneNumber, scheduledTime } = options;
      
      if (!phoneNumber) {
        throw new AppError('Phone number is required', 400);
      }
      
      if (!scheduledTime) {
        throw new AppError('Scheduled time is required', 400);
      }
      
      // Build the call payload
      const payload = this.buildCallPayload(options);
      
      // Make the API call
      const response = await this.axiosClient.post('/v1/calls', payload);
      
      // Extract the call details
      const callDetails: BlandAiCallDetails = {
        callId: response.data.call_id,
        phoneNumber,
        scheduledTime: typeof scheduledTime === 'string' ? scheduledTime : scheduledTime.toISOString(),
        status: 'scheduled',
        topic: options.topic || options.task || 'Scheduled Call',
        recipientName: options.recipientName || '',
        recipientEmail: options.recipientEmail,
        agentId: payload.agent_id,
        voiceId: payload.voice_id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Store the call details
      await storageService.storeCallData(callDetails.callId, callDetails);
      
      // If recipient email is provided, send a confirmation
      if (options.recipientEmail && options.sendConfirmation !== false) {
        try {
          // Format date and time for email
          const date = new Date(scheduledTime);
          const formattedDate = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
          const formattedTime = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          
          // Generate calendar event if needed
          let calendarEvent;
          if (options.addCalendarEvent !== false) {
            calendarEvent = calendarService.createCallEvent({
              scheduledTime: date,
              durationMinutes: options.durationMinutes || (options.maxDuration ? Math.floor(options.maxDuration / 60) : 15),
              topic: options.topic || options.task,
              description: options.description || options.goal,
              phoneNumber,
              recipientName: options.recipientName || 'Recipient',
              recipientEmail: options.recipientEmail
            });
          }
          
          // Send confirmation email
          await emailService.sendCallConfirmation(options.recipientEmail, {
            recipientName: options.recipientName || 'Recipient',
            formattedDate,
            formattedTime,
            duration: `${options.durationMinutes || (options.maxDuration ? Math.floor(options.maxDuration / 60) : 15)} minutes`,
            topic: options.topic || options.task || 'Scheduled Call',
            calendarEvent
          });
        } catch (emailError) {
          // Log but don't fail if email sending fails
          logger.warn(`Failed to send confirmation email: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`);
        }
      }
      
      return callDetails;
    } catch (error) {
      // Handle specific API errors
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorData = error.response?.data;
        
        if (status === 429) {
          throw new AppError('Rate limit exceeded. Please try again later.', 429);
        } else if (status === 400 && errorData?.error?.includes('scheduling conflict')) {
          throw new AppError('Scheduling conflict detected. Please choose another time.', 400);
        } else if (status === 401) {
          throw new AppError('Authentication failed. Please check your API key.', 401);
        }
      }
      
      throw new AppError(`Call scheduling failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  }

  /**
   * Build the payload for a call
   * @param options Call options
   * @returns Call payload object
   */
  private buildCallPayload(options: BlandAiCallOptions): any {
    const { phoneNumber, scheduledTime } = options;
    
    // Validate required fields
    if (!phoneNumber) {
      throw new AppError('Phone number is required', 400);
    }
    
    if (!scheduledTime) {
      throw new AppError('Scheduled time is required', 400);
    }
    
    // Ensure scheduled time is in the future
    const scheduledDate = typeof scheduledTime === 'string' 
      ? new Date(scheduledTime) 
      : scheduledTime;
    
    if (scheduledDate <= new Date()) {
      throw new AppError('Scheduled time must be in the future', 400);
    }
    
    // Convert Date to ISO string if needed
    const scheduledTimeStr = typeof scheduledTime === 'string' 
      ? scheduledTime 
      : scheduledTime.toISOString();
    
    // Build the payload
    const payload: any = {
      phone_number: phoneNumber,
      scheduled_time: scheduledTimeStr,
      voice_id: options.voiceId || this.defaultVoiceId,
      agent_id: options.agentId || this.defaultAgentId,
      task: options.topic || options.task || 'Scheduled Call',
      reduce_latency: true,
      wait_for_greeting: true
    };
    
    // Add optional fields if provided
    if (options.maxDuration) {
      payload.max_duration = options.maxDuration;
    } else if (options.durationMinutes) {
      payload.max_duration = options.durationMinutes * 60;
    }
    
    if (options.description || options.goal) {
      payload.description = options.description || options.goal;
    }
    
    if (options.recordCall !== undefined) {
      payload.record = options.recordCall;
    }
    
    if (options.webhookUrl) {
      payload.webhook_url = options.webhookUrl;
    }
    
    if (options.agentConfig) {
      payload.agent_config = options.agentConfig;
    }
    
    return payload;
  }

  /**
   * Get details for a specific call
   * @param callId Call ID
   * @returns Promise resolving to the call details
   */
  async getCallDetails(callId: string): Promise<BlandAiCallDetails> {
    try {
      // First try to get from storage
      const storedDetails = await storageService.getCallData(callId);
      
      if (storedDetails) {
        return storedDetails;
      }
      
      // If not in storage, fetch from API
      const response = await this.axiosClient.get(`/v1/calls/${callId}`);
      
      // Map API response to our format
      const callDetails: BlandAiCallDetails = {
        callId: response.data.call_id,
        phoneNumber: response.data.phone_number,
        scheduledTime: response.data.scheduled_time,
        status: this.mapApiStatusToInternal(response.data.status),
        topic: response.data.task,
        agentId: response.data.agent_id,
        voiceId: response.data.voice_id,
        createdAt: response.data.created_at,
        updatedAt: response.data.updated_at || response.data.created_at,
        recordingUrl: response.data.recording_url,
        transcriptUrl: response.data.transcript_url,
        duration: response.data.duration
      };
      
      // Store for future reference
      await storageService.storeCallData(callId, callDetails);
      
      return callDetails;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new AppError(`Call not found: ${callId}`, 404);
      }
      
      throw new AppError(`Failed to get call details: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  }

  /**
   * Cancel a scheduled call
   * @param callId Call ID to cancel
   * @param reason Optional reason for cancellation
   * @returns Promise resolving to the cancellation result
   */
  async cancelCall(callId: string, reason?: string): Promise<{ success: boolean; message: string; cancelledAt: string }> {
    try {
      // Get current call details
      const callDetails = await this.getCallDetails(callId);
      
      // Make API call to cancel
      await this.axiosClient.post(`/v1/calls/${callId}/cancel`);
      
      // Update status in storage
      const cancelledAt = new Date().toISOString();
      const updatedDetails = {
        ...callDetails,
        status: 'cancelled' as BlandAiCallStatus,
        updatedAt: cancelledAt,
        cancelledAt: cancelledAt
      };
      
      await storageService.storeCallData(callId, updatedDetails);
      
      // Send cancellation email if we have recipient info
      if (callDetails.recipientEmail) {
        try {
          const date = new Date(callDetails.scheduledTime);
          const formattedDate = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
          const formattedTime = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          
          await emailService.sendCancellationNotification(
            callDetails.recipientEmail,
            {
              recipientName: callDetails.recipientName || 'Recipient',
              formattedDate,
              formattedTime,
              duration: '15 minutes', // Default if not specified
              topic: callDetails.topic || 'Scheduled Call'
            },
            reason
          );
        } catch (emailError) {
          // Log but don't fail if email sending fails
          logger.warn(`Failed to send cancellation email: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`);
        }
      }
      
      return { 
        success: true, 
        message: 'Call cancelled successfully',
        cancelledAt
      };
    } catch (error) {
      throw new AppError(`Call cancellation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  }

  /**
   * Reschedule a call
   * @param callId Call ID to reschedule
   * @param newScheduledTime New scheduled time
   * @param reason Optional reason for rescheduling
   * @returns Promise resolving to the rescheduling result
   */
  async rescheduleCall(
    callId: string,
    newScheduledTime: string | Date,
    reason?: string
  ): Promise<{ success: boolean; message: string; newScheduledTime: string }> {
    try {
      // Get current call details
      const callDetails = await this.getCallDetails(callId);
      
      // Convert Date to ISO string if needed
      const newTimeStr = typeof newScheduledTime === 'string' 
        ? newScheduledTime 
        : newScheduledTime.toISOString();
      
      // Make API call to reschedule
      await this.axiosClient.post(`/v1/calls/${callId}/reschedule`, {
        scheduled_time: newTimeStr
      });
      
      // Store old scheduled time for email notification
      const oldScheduledTime = callDetails.scheduledTime;
      
      // Update details in storage
      const updatedDetails = {
        ...callDetails,
        scheduledTime: newTimeStr,
        updatedAt: new Date().toISOString()
      };
      
      await storageService.storeCallData(callId, updatedDetails);
      
      // Send rescheduling email if we have recipient info
      if (callDetails.recipientEmail) {
        try {
          // Format old date/time
          const oldDate = new Date(oldScheduledTime);
          const oldFormattedDate = oldDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
          const oldFormattedTime = oldDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          
          // Format new date/time
          const newDate = new Date(newTimeStr);
          const newFormattedDate = newDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
          const newFormattedTime = newDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          
          // Generate updated calendar event
          let calendarEvent;
          try {
            calendarEvent = calendarService.createCallEvent({
              scheduledTime: newDate,
              durationMinutes: 15, // Default if not specified
              topic: callDetails.topic,
              phoneNumber: callDetails.phoneNumber,
              recipientName: callDetails.recipientName || 'Recipient',
              recipientEmail: callDetails.recipientEmail
            });
          } catch (calendarError) {
            logger.warn(`Failed to generate calendar event: ${calendarError instanceof Error ? calendarError.message : 'Unknown error'}`);
          }
          
          await emailService.sendRescheduleNotification(
            callDetails.recipientEmail,
            {
              recipientName: callDetails.recipientName || 'Recipient',
              formattedDate: newFormattedDate,
              formattedTime: newFormattedTime,
              oldFormattedDate,
              oldFormattedTime,
              duration: '15 minutes', // Default if not specified
              topic: callDetails.topic || 'Scheduled Call',
              calendarEvent
            },
            reason
          );
        } catch (emailError) {
          // Log but don't fail if email sending fails
          logger.warn(`Failed to send rescheduling email: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`);
        }
      }
      
      return { 
        success: true, 
        message: 'Call rescheduled successfully',
        newScheduledTime: newTimeStr
      };
    } catch (error) {
      throw new AppError(`Call rescheduling failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  }

  /**
   * Process a webhook event from Bland.ai
   * @param event Webhook event data
   * @returns Promise resolving to the processing result
   */
  async processWebhookEvent(event: BlandAiWebhookEvent): Promise<{ success: boolean; message: string }> {
    try {
      logger.info(`Processing webhook event: ${event.type} for call ${event.call_id}`);
      
      // Handle different event types
      switch (event.type) {
        case 'call.started':
          return await this.handleCallStarted(event);
        
        case 'call.ended':
          return await this.handleCallEnded(event);
        
        case 'call.failed':
          return await this.handleCallFailed(event);
        
        default:
          logger.warn(`Unknown webhook event type: ${event.type}`);
          return { success: true, message: `Unhandled event type: ${event.type}` };
      }
    } catch (error) {
      logger.error(`Webhook processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { 
        success: false, 
        message: `Failed to process webhook: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Handle call.started webhook event
   * @param event Webhook event data
   * @returns Promise resolving to the handling result
   */
  private async handleCallStarted(event: BlandAiWebhookEvent): Promise<{ success: boolean; message: string }> {
    try {
      const callId = event.call_id;
      
      // Get current call details
      const callDetails = await storageService.getCallData(callId);
      
      if (!callDetails) {
        logger.warn(`Call not found in storage: ${callId}`);
        // Fetch from API instead
        await this.getCallDetails(callId);
        return { success: true, message: 'Call details fetched from API' };
      }
      
      // Update status
      const updatedDetails = {
        ...callDetails,
        status: 'in_progress' as BlandAiCallStatus,
        updatedAt: new Date().toISOString(),
        startedAt: event.timestamp || new Date().toISOString()
      };
      
      await storageService.storeCallData(callId, updatedDetails);
      
      return { success: true, message: 'Call status updated to in_progress' };
    } catch (error) {
      logger.error(`Failed to handle call.started: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, message: `Error handling call.started: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Handle call.ended webhook event
   * @param event Webhook event data
   * @returns Promise resolving to the handling result
   */
  private async handleCallEnded(event: BlandAiWebhookEvent): Promise<{ success: boolean; message: string }> {
    try {
      const callId = event.call_id;
      
      // Get current call details
      const callDetails = await storageService.getCallData(callId);
      
      if (!callDetails) {
        logger.warn(`Call not found in storage: ${callId}`);
        // Fetch from API instead
        await this.getCallDetails(callId);
        return { success: true, message: 'Call details fetched from API' };
      }
      
      // Update status and details
      const updatedDetails = {
        ...callDetails,
        status: 'completed' as BlandAiCallStatus,
        updatedAt: new Date().toISOString(),
        endedAt: event.timestamp || new Date().toISOString(),
        duration: event.data?.duration,
        recordingUrl: event.data?.recording_url,
        transcriptUrl: event.data?.transcript_url
      };
      
      await storageService.storeCallData(callId, updatedDetails);
      
      return { success: true, message: 'Call status updated to completed' };
    } catch (error) {
      logger.error(`Failed to handle call.ended: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, message: `Error handling call.ended: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Handle call.failed webhook event
   * @param event Webhook event data
   * @returns Promise resolving to the handling result
   */
  private async handleCallFailed(event: BlandAiWebhookEvent): Promise<{ success: boolean; message: string }> {
    try {
      const callId = event.call_id;
      
      // Get current call details
      const callDetails = await storageService.getCallData(callId);
      
      if (!callDetails) {
        logger.warn(`Call not found in storage: ${callId}`);
        // Fetch from API instead
        await this.getCallDetails(callId);
        return { success: true, message: 'Call details fetched from API' };
      }
      
      // Update status and details
      const updatedDetails = {
        ...callDetails,
        status: 'failed' as BlandAiCallStatus,
        updatedAt: new Date().toISOString(),
        failedAt: event.timestamp || new Date().toISOString(),
        failureReason: event.data?.reason || 'Unknown failure'
      };
      
      await storageService.storeCallData(callId, updatedDetails);
      
      return { success: true, message: 'Call status updated to failed' };
    } catch (error) {
      logger.error(`Failed to handle call.failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, message: `Error handling call.failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Map API status to internal status
   * @param apiStatus Status from API
   * @returns Internal status
   */
  private mapApiStatusToInternal(apiStatus: string): BlandAiCallStatus {
    switch (apiStatus) {
      case 'scheduled':
        return 'scheduled';
      case 'in_progress':
        return 'in_progress';
      case 'completed':
        return 'completed';
      case 'cancelled':
        return 'cancelled';
      case 'failed':
        return 'failed';
      default:
        return 'unknown';
    }
  }
}

// Create and export a singleton instance
export const blandAiService = new BlandAiService();