import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EmailService, EmailParams } from '../../src/services/email-service';
import { AppError } from '../../src/utils/logger';

// Mock dependencies but not the service itself
vi.mock('../../src/utils/config', () => ({
  config: {
    getEmailConfig: vi.fn().mockReturnValue({
      apiKey: 'test-api-key',
      senderEmail: 'test@example.com',
      senderName: 'Test Sender',
      templatesDir: './test/templates'
    }),
    get: vi.fn().mockImplementation((key, defaultValue) => defaultValue)
  }
}));

vi.mock('../../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  },
  AppError: class extends Error {
    statusCode: number;
    constructor(message: string, statusCode = 500) {
      super(message);
      this.name = 'AppError';
      this.statusCode = statusCode;
    }
  }
}));

describe('EmailService', () => {
  let service: EmailService;
  let resendMock: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create a fresh instance for each test
    service = new EmailService();
    
    // Create a mock for Resend
    resendMock = {
      emails: {
        send: vi.fn().mockResolvedValue({ id: 'mock-email-id', to: 'recipient@example.com', subject: 'Test Subject', success: true })
      }
    };
    
    // Replace the Resend client with our mock
    (service as any).resend = resendMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      const instance = new EmailService();
      expect(instance).toBeInstanceOf(EmailService);
    });

    it('should initialize with custom config', () => {
      const customConfig = {
        apiKey: 'custom-api-key',
        senderEmail: 'custom@example.com',
        senderName: 'Custom Sender',
        templatesDir: './custom-templates',
        retryCount: 5,
        retryDelay: 2000
      };
      
      const instance = new EmailService(customConfig);
      
      // Check that private properties are set correctly
      expect((instance as any).apiKey).toBe(customConfig.apiKey);
      expect((instance as any).senderEmail).toBe(customConfig.senderEmail);
      expect((instance as any).senderName).toBe(customConfig.senderName);
      expect((instance as any).templatesDir).toBe(customConfig.templatesDir);
      expect((instance as any).retryCount).toBe(customConfig.retryCount);
      expect((instance as any).retryDelay).toBe(customConfig.retryDelay);
    });
  });

  describe('loadTemplate', () => {
    it('should load a template and replace variables', async () => {
      const variables = {
        name: 'John',
        date: '2025-04-01',
        time: '14:00',
        duration: '30',
        topic: 'Test Call'
      };
      
      const result = await service.loadTemplate('call-confirmation', variables);
      
      expect(result).toContain('Hello John');
      expect(result).toContain('2025-04-01');
      expect(result).toContain('14:00');
      expect(result).toContain('Test Call');
    });
    
    it('should throw an error for unknown template', async () => {
      await expect(service.loadTemplate('non-existent-template')).rejects.toThrow('Email template not found');
    });
  });

  describe('sendEmail', () => {
    it('should send an email successfully', async () => {
      const emailParams: EmailParams = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test email content'
      };
      
      const result = await service.sendEmail(emailParams);
      
      expect(result).toEqual({ id: 'mock-email-id', to: 'recipient@example.com', subject: 'Test Subject', success: true });
    });
    
    it('should throw an error if email fails to send', async () => {
      // Mock the Resend send method to throw an error
      resendMock.emails.send.mockRejectedValueOnce(new Error('Send failed'));
      
      const emailParams: EmailParams = {
        to: 'error@example.com',
        subject: 'Test Subject',
        text: 'Test email content'
      };
      
      await expect(service.sendEmail(emailParams)).rejects.toThrow('Failed to send email: Send failed');
    });
    
    it('should throw an error for invalid email address', async () => {
      // Mock the isValidEmail method to return false
      vi.spyOn(service, 'isValidEmail').mockReturnValueOnce(false);
      
      const emailParams: EmailParams = {
        to: '',  // Empty email
        subject: 'Test Subject',
        text: 'Test email content'
      };
      
      await expect(service.sendEmail(emailParams)).rejects.toThrow('Invalid recipient email');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(service.isValidEmail('test@example.com')).toBe(true);
      expect(service.isValidEmail('test.name+tag@example.co.uk')).toBe(true);
    });
    
    it('should invalidate incorrect email addresses', () => {
      expect(service.isValidEmail('')).toBe(false);
      expect(service.isValidEmail('test@')).toBe(false);
      expect(service.isValidEmail('test@example')).toBe(false);
      expect(service.isValidEmail('@example.com')).toBe(false);
    });
  });

  describe('convertHtmlToPlainText', () => {
    it('should convert HTML to plain text', () => {
      const html = '<h1>Test</h1><p>This is a <strong>test</strong> paragraph.</p>';
      const plainText = service.convertHtmlToPlainText(html);
      expect(plainText).toBe('Test This is a test paragraph.');
    });
  });

  describe('sendCallConfirmation', () => {
    it('should send a call confirmation email', async () => {
      const callDetails = {
        recipientName: 'John Doe',
        recipientEmail: 'john@example.com',
        formattedDate: '2025-04-01',
        formattedTime: '14:00',
        duration: '30',
        topic: 'Test Call',
        calendarEvent: 'BEGIN:VCALENDAR\nEND:VCALENDAR'
      };
      
      // Spy on the sendEmail method
      const sendEmailSpy = vi.spyOn(service, 'sendEmail').mockResolvedValueOnce({ id: 'mock-email-id', success: true });
      
      await service.sendCallConfirmation('john@example.com', callDetails);
      
      // Check that sendEmail was called with the right parameters
      expect(sendEmailSpy).toHaveBeenCalledWith({
        to: 'john@example.com',
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
    });
  });

  describe('sendRescheduleNotification', () => {
    it('should send a reschedule notification email', async () => {
      const callDetails = {
        recipientName: 'John Doe',
        recipientEmail: 'john@example.com',
        formattedDate: '2025-04-02',
        formattedTime: '15:00',
        oldFormattedDate: '2025-04-01',
        oldFormattedTime: '14:00',
        duration: '30',
        topic: 'Test Call',
        calendarEvent: 'BEGIN:VCALENDAR\nEND:VCALENDAR'
      };
      
      const reason = 'speaker unavailable';
      
      // Spy on the sendEmail method
      const sendEmailSpy = vi.spyOn(service, 'sendEmail').mockResolvedValueOnce({ id: 'mock-email-id', success: true });
      
      await service.sendRescheduleNotification('john@example.com', callDetails, reason);
      
      // Check that sendEmail was called with the right parameters
      expect(sendEmailSpy).toHaveBeenCalledWith({
        to: 'john@example.com',
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
          reason: reason
        },
        calendarEvent: callDetails.calendarEvent
      });
    });
    
    it('should use default reason if none provided', async () => {
      const callDetails = {
        recipientName: 'John Doe',
        recipientEmail: 'john@example.com',
        formattedDate: '2025-04-02',
        formattedTime: '15:00',
        oldFormattedDate: '2025-04-01',
        oldFormattedTime: '14:00',
        duration: '30',
        topic: 'Test Call',
        calendarEvent: 'BEGIN:VCALENDAR\nEND:VCALENDAR'
      };
      
      // Spy on the sendEmail method
      const sendEmailSpy = vi.spyOn(service, 'sendEmail').mockResolvedValueOnce({ id: 'mock-email-id', success: true });
      
      await service.sendRescheduleNotification('john@example.com', callDetails);
      
      // Check that the default reason was used
      const callParams = sendEmailSpy.mock.calls[0][0] as any;
      expect(callParams.variables.reason).toBe('scheduling conflict');
    });
  });

  describe('sendCancellationNotification', () => {
    it('should send a cancellation notification email', async () => {
      const callDetails = {
        recipientName: 'John Doe',
        recipientEmail: 'john@example.com',
        formattedDate: '2025-04-01',
        formattedTime: '14:00',
        duration: '30',
        topic: 'Test Call'
      };
      
      const reason = 'emergency situation';
      
      // Spy on the sendEmail method
      const sendEmailSpy = vi.spyOn(service, 'sendEmail').mockResolvedValueOnce({ id: 'mock-email-id', success: true });
      
      await service.sendCancellationNotification('john@example.com', callDetails, reason);
      
      // Check that sendEmail was called with the right parameters
      expect(sendEmailSpy).toHaveBeenCalledWith({
        to: 'john@example.com',
        subject: 'Your Call Has Been Cancelled',
        templateName: 'call-cancellation',
        variables: {
          name: callDetails.recipientName,
          date: callDetails.formattedDate,
          time: callDetails.formattedTime,
          topic: callDetails.topic,
          reason: reason
        }
      });
    });
    
    it('should use default reason if none provided', async () => {
      const callDetails = {
        recipientName: 'John Doe',
        recipientEmail: 'john@example.com',
        formattedDate: '2025-04-01',
        formattedTime: '14:00',
        duration: '30',
        topic: 'Test Call'
      };
      
      // Spy on the sendEmail method
      const sendEmailSpy = vi.spyOn(service, 'sendEmail').mockResolvedValueOnce({ id: 'mock-email-id', success: true });
      
      await service.sendCancellationNotification('john@example.com', callDetails);
      
      // Check that the default reason was used
      const callParams = sendEmailSpy.mock.calls[0][0] as any;
      expect(callParams.variables.reason).toBe('unforeseen circumstances');
    });
  });
});