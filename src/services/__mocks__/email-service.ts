// Manual mock for EmailService
export class EmailService {
  apiKey: string;
  senderEmail: string;
  senderName: string;
  templatesDir: string;
  retryCount: number;
  retryDelay: number;
  resend: any;

  constructor(options: any = {}) {
    this.apiKey = options.apiKey || 'test-api-key';
    this.senderEmail = options.senderEmail || 'test-system@example.com';
    this.senderName = options.senderName || 'Test System';
    this.templatesDir = options.templatesDir || './templates/email';
    this.retryCount = options.retryCount || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.resend = {
      emails: {
        send: vi.fn().mockResolvedValue({ id: 'mock-email-id', success: true })
      }
    };
  }

  async loadTemplate(templateName: string, variables: Record<string, string> = {}): Promise<string> {
    if (templateName === 'call-confirmation') {
      let template = `
        <h1>Your Call Has Been Scheduled</h1>
        <p>Hello {{name}},</p>
        <p>Your call has been scheduled for {{date}} at {{time}} for {{duration}} minutes.</p>
        <p>Topic: {{topic}}</p>
      `;
      
      // Replace variables
      Object.entries(variables).forEach(([key, value]) => {
        template = template.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });
      
      return template;
    } else if (templateName === 'call-reschedule') {
      let template = `
        <h1>Your Call Has Been Rescheduled</h1>
        <p>Hello {{name}},</p>
        <p>Your call originally scheduled for {{oldDate}} at {{oldTime}} has been rescheduled.</p>
        <p>New date: {{newDate}} at {{newTime}} for {{duration}} minutes.</p>
        <p>Topic: {{topic}}</p>
        <p>Reason: {{reason}}</p>
      `;
      
      // Replace variables
      Object.entries(variables).forEach(([key, value]) => {
        template = template.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });
      
      return template;
    } else if (templateName === 'call-cancellation') {
      let template = `
        <h1>Your Call Has Been Cancelled</h1>
        <p>Hello {{name}},</p>
        <p>Your call scheduled for {{date}} at {{time}} has been cancelled.</p>
        <p>Topic: {{topic}}</p>
        <p>Reason: {{reason}}</p>
      `;
      
      // Replace variables
      Object.entries(variables).forEach(([key, value]) => {
        template = template.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });
      
      return template;
    } else {
      throw new Error('Email template not found');
    }
  }

  async sendEmail(params: any): Promise<any> {
    if (!this.isValidEmail(params.to)) {
      throw new Error('Invalid recipient email');
    }
    
    if (params.to === 'error@example.com') {
      throw new Error('Failed to send email: Send failed');
    }
    
    return { id: 'mock-email-id', success: true };
  }

  isValidEmail(email: string): boolean {
    if (!email) return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  convertHtmlToPlainText(html: string): string {
    if (!html) return '';
    
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async sendCallConfirmation(to: string, callDetails: any): Promise<any> {
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

  async sendRescheduleNotification(to: string, callDetails: any, reason?: string): Promise<any> {
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

  async sendCancellationNotification(to: string, callDetails: any, reason?: string): Promise<any> {
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

// Add vi for mocking
import { vi } from 'vitest';

// Export EmailParams interface
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