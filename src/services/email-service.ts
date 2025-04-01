import { config } from '../utils/config';
import { AppError, logger } from '../utils/logger';

// Import Resend if available
let Resend: any;
try {
  // Use dynamic import for Resend in Cloudflare Workers environment
  // This will be handled by the bundler
  Resend = (globalThis as any).Resend;
} catch (error) {
  logger.warn('Resend package not found, email functionality will be limited');
}

/**
 * Interface for email parameters
 */
export interface EmailParams {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType?: string;
  }>;
  templateName?: string;
  variables?: Record<string, string>;
  calendarEvent?: string;
}

/**
 * Interface for email service configuration
 */
export interface EmailServiceConfig {
  apiKey?: string;
  senderEmail?: string;
  senderName?: string;
  templatesDir?: string;
  retryCount?: number;
  retryDelay?: number;
}

/**
 * Service for sending emails
 */
export class EmailService {
  private apiKey: string;
  private senderEmail: string;
  private senderName: string;
  private templatesDir: string;
  private retryCount: number;
  private retryDelay: number;
  private resend: any;

  /**
   * Create a new email service
   * @param options Configuration options
   */
  constructor(options: EmailServiceConfig = {}) {
    // Get email config with fallback
    const defaultConfig = config.getEmailConfig ? config.getEmailConfig() : {
      apiKey: '',
      senderEmail: 'system@aiphone.agent',
      senderName: 'AI Phone Agent',
      templatesDir: './templates/email'
    };
    
    this.apiKey = options.apiKey || 
                 (defaultConfig && defaultConfig.apiKey) || 
                 config.get('RESEND_API_KEY', '');
                 
    this.senderEmail = options.senderEmail || 
                      (defaultConfig && defaultConfig.senderEmail) || 
                      config.get('SENDER_EMAIL', 'system@aiphone.agent');
                      
    this.senderName = options.senderName || 
                     (defaultConfig && defaultConfig.senderName) || 
                     config.get('SENDER_NAME', 'AI Phone Agent');
                     
    this.templatesDir = options.templatesDir || 
                       (defaultConfig && defaultConfig.templatesDir) || 
                       './templates/email';
                       
    this.retryCount = options.retryCount || 3;
    this.retryDelay = options.retryDelay || 1000;
    
    // Initialize Resend client if API key is available
    if (Resend && this.apiKey) {
      this.resend = new Resend(this.apiKey);
    }
  }

  /**
   * Load an email template and replace variables
   * @param templateName Name of the template
   * @param variables Variables to replace in the template
   * @returns Promise resolving to the processed template
   */
  async loadTemplate(templateName: string, variables: Record<string, string> = {}): Promise<string> {
    try {
      // In a real implementation, this would load from a file or database
      // For testing, we'll simulate template loading
      let templateContent = '';
      
      if (templateName === 'call-confirmation') {
        templateContent = `
          <h1>Your Call Has Been Scheduled</h1>
          <p>Hello {{name}},</p>
          <p>Your call has been scheduled for {{date}} at {{time}} for {{duration}} minutes.</p>
          <p>Topic: {{topic}}</p>
        `;
      } else if (templateName === 'call-reschedule') {
        templateContent = `
          <h1>Your Call Has Been Rescheduled</h1>
          <p>Hello {{name}},</p>
          <p>Your call originally scheduled for {{oldDate}} at {{oldTime}} has been rescheduled.</p>
          <p>New date: {{newDate}} at {{newTime}} for {{duration}} minutes.</p>
          <p>Topic: {{topic}}</p>
          <p>Reason: {{reason}}</p>
        `;
      } else if (templateName === 'call-cancellation') {
        templateContent = `
          <h1>Your Call Has Been Cancelled</h1>
          <p>Hello {{name}},</p>
          <p>Your call scheduled for {{date}} at {{time}} has been cancelled.</p>
          <p>Topic: {{topic}}</p>
          <p>Reason: {{reason}}</p>
        `;
      } else {
        throw new AppError('Email template not found', 404);
      }
      
      // Replace variables in the template
      Object.entries(variables).forEach(([key, value]) => {
        templateContent = templateContent.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });
      
      return templateContent;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to load email template: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  }

  /**
   * Send an email
   * @param params Email parameters
   * @returns Promise resolving to the send result
   */
  async sendEmail(params: EmailParams): Promise<any> {
    try {
      // Validate email address
      if (!this.isValidEmail(params.to)) {
        throw new AppError('Invalid recipient email', 400);
      }
      
      // Process template if provided
      if (params.templateName) {
        const html = await this.loadTemplate(params.templateName, params.variables || {});
        params.html = html;
        
        // Generate plain text version if not provided
        if (!params.text) {
          params.text = this.convertHtmlToPlainText(html);
        }
      }
      
      // Ensure we have either HTML or text content
      if (!params.html && !params.text) {
        throw new AppError('Email content is required', 400);
      }
      
      // Add calendar event as attachment if provided
      if (params.calendarEvent) {
        params.attachments = params.attachments || [];
        params.attachments.push({
          filename: 'event.ics',
          content: params.calendarEvent,
          contentType: 'text/calendar'
        });
      }
      
      // Set sender information
      const from = params.from || `${this.senderName} <${this.senderEmail}>`;
      
      // Send email using Resend
      if (this.resend) {
        const result = await this.resend.emails.send({
          from,
          to: params.to,
          subject: params.subject,
          html: params.html,
          text: params.text,
          reply_to: params.replyTo,
          attachments: params.attachments
        });
        
        return result;
      } else {
        // Log email for development/testing
        logger.info(`[DEV] Email would be sent: ${JSON.stringify({
          from,
          to: params.to,
          subject: params.subject,
          hasHtml: !!params.html,
          hasText: !!params.text,
          hasAttachments: params.attachments?.length || 0
        })}`);
        
        return { id: 'mock-email-id', success: true };
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  }

  /**
   * Validate an email address
   * @param email Email address to validate
   * @returns True if valid, false otherwise
   */
  isValidEmail(email: string): boolean {
    if (!email) return false;
    
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Convert HTML to plain text
   * @param html HTML content
   * @returns Plain text version
   */
  convertHtmlToPlainText(html: string): string {
    if (!html) return '';
    
    // Very basic HTML to text conversion
    // In a real implementation, this would use a proper HTML-to-text library
    return html
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ')     // Normalize whitespace
      .trim();                  // Trim leading/trailing whitespace
  }

  /**
   * Send a call confirmation email
   * @param to Recipient email
   * @param callDetails Call details
   * @returns Promise resolving to the send result
   */
  async sendCallConfirmation(to: string, callDetails: {
    recipientName: string;
    recipientEmail?: string;
    formattedDate: string;
    formattedTime: string;
    duration: string;
    topic: string;
    calendarEvent?: string;
  }): Promise<any> {
    return this.sendEmail({
      to,
      subject: 'Your Call Has Been Scheduled',
      templateName: 'call-confirmation',
      variables: {
        name: callDetails.recipientName,
        date: callDetails.formattedDate,
        time: callDetails.formattedTime,
        duration: callDetails.duration,
        topic: callDetails.topic
      },
      calendarEvent: callDetails.calendarEvent
    });
  }

  /**
   * Send a reschedule notification email
   * @param to Recipient email
   * @param callDetails Call details
   * @param reason Optional reason for rescheduling
   * @returns Promise resolving to the send result
   */
  async sendRescheduleNotification(to: string, callDetails: {
    recipientName: string;
    recipientEmail?: string;
    formattedDate: string;
    formattedTime: string;
    oldFormattedDate: string;
    oldFormattedTime: string;
    duration: string;
    topic: string;
    calendarEvent?: string;
  }, reason?: string): Promise<any> {
    return this.sendEmail({
      to,
      subject: 'Your Call Has Been Rescheduled',
      templateName: 'call-reschedule',
      variables: {
        name: callDetails.recipientName,
        oldDate: callDetails.oldFormattedDate,
        oldTime: callDetails.oldFormattedTime,
        newDate: callDetails.formattedDate,
        newTime: callDetails.formattedTime,
        duration: callDetails.duration,
        topic: callDetails.topic,
        reason: reason || 'scheduling conflict'
      },
      calendarEvent: callDetails.calendarEvent
    });
  }

  /**
   * Send a cancellation notification email
   * @param to Recipient email
   * @param callDetails Call details
   * @param reason Optional reason for cancellation
   * @returns Promise resolving to the send result
   */
  async sendCancellationNotification(to: string, callDetails: {
    recipientName: string;
    recipientEmail?: string;
    formattedDate: string;
    formattedTime: string;
    duration: string;
    topic: string;
  }, reason?: string): Promise<any> {
    return this.sendEmail({
      to,
      subject: 'Your Call Has Been Cancelled',
      templateName: 'call-cancellation',
      variables: {
        name: callDetails.recipientName,
        date: callDetails.formattedDate,
        time: callDetails.formattedTime,
        topic: callDetails.topic,
        reason: reason || 'unforeseen circumstances'
      }
    });
  }
}

// Create and export a singleton instance
export const emailService = new EmailService();