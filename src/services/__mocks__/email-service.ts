// Mock implementation of email service for testing
export class EmailService {
  async loadTemplate(templateName: string, variables: Record<string, string> = {}): Promise<string> {
    // Return a simple template with variables replaced
    let template = '';
    
    if (templateName === 'call-confirmation') {
      template = `Hello {{name}}, your call is scheduled for {{date}} at {{time}}`;
    } else if (templateName === 'call-reschedule') {
      template = `Hello {{name}}, your call has been rescheduled from {{oldDate}} to {{newDate}}`;
    } else if (templateName === 'call-cancellation') {
      template = `Hello {{name}}, your call scheduled for {{date}} has been cancelled`;
    } else {
      template = `Template: ${templateName}`;
    }
    
    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      template = template.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    
    return template;
  }
  
  async sendEmail(params: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
    from?: string;
    replyTo?: string;
    attachments?: any[];
    templateName?: string;
    variables?: Record<string, string>;
    calendarEvent?: string;
  }): Promise<any> {
    // Return a mock success response
    return {
      id: 'mock-email-id',
      to: params.to,
      subject: params.subject,
      success: true
    };
  }
  
  isValidEmail(email: string): boolean {
    return email.includes('@') && email.includes('.');
  }
  
  convertHtmlToPlainText(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }
  
  async sendCallConfirmation(to: string, callDetails: {
    recipientName: string;
    recipientEmail?: string;
    formattedDate: string;
    formattedTime: string;
    duration: string;
    topic: string;
    calendarEvent?: string;
  }): Promise<any> {
    return {
      id: 'mock-email-id',
      to,
      subject: 'Your Call Has Been Scheduled',
      success: true
    };
  }
  
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
    return {
      id: 'mock-email-id',
      to,
      subject: 'Your Call Has Been Rescheduled',
      success: true
    };
  }
  
  async sendCancellationNotification(to: string, callDetails: {
    recipientName: string;
    recipientEmail?: string;
    formattedDate: string;
    formattedTime: string;
    duration: string;
    topic: string;
  }, reason?: string): Promise<any> {
    return {
      id: 'mock-email-id',
      to,
      subject: 'Your Call Has Been Cancelled',
      success: true
    };
  }
}

export const emailService = new EmailService();