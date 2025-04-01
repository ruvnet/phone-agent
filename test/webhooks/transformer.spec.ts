import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { transformResendWebhook, validateResendPayload } from '../../src/webhooks/transformer';
import { ResendEventType, ResendWebhookPayload } from '../../src/types/webhook';

// Mock the security utility to return a predictable webhook ID
vi.mock('../../src/utils/security', () => ({
  generateWebhookId: () => 'test_webhook_id',
}));

describe('Webhook Transformer', () => {
  // Mock date for consistent timestamps
  const originalDateNow = Date.now;
  const mockTimestamp = 1617184800000; // 2021-03-31T12:00:00.000Z
  
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockTimestamp);
  });
  
  afterEach(() => {
    vi.useRealTimers();
    Date.now = originalDateNow;
  });
  
  describe('transformResendWebhook', () => {
    it('should transform an email.sent webhook correctly', () => {
      const payload: ResendWebhookPayload = {
        type: ResendEventType.EMAIL_SENT,
        created_at: '2021-03-31T11:55:00.000Z',
        data: {
          id: 'email_123',
          object: 'email',
          created_at: '2021-03-31T11:55:00.000Z',
          to: ['recipient@example.com'],
          from: 'sender@example.com',
          subject: 'Test Email',
          html: '<p>Test content</p>',
          last_event: 'sent',
        },
      };
      
      const transformed = transformResendWebhook(payload);
      
      expect(transformed).toEqual({
        id: 'test_webhook_id',
        timestamp: Math.floor(mockTimestamp / 1000),
        source: 'resend',
        eventType: ResendEventType.EMAIL_SENT,
        emailId: 'email_123',
        emailData: {
          from: 'sender@example.com',
          to: ['recipient@example.com'],
          subject: 'Test Email',
          sentAt: '2021-03-31T11:55:00.000Z',
        },
        eventData: {},
        metadata: {
          originalTimestamp: '2021-03-31T11:55:00.000Z',
        },
      });
    });
    
    it('should transform an email.bounced webhook correctly', () => {
      const payload: ResendWebhookPayload = {
        type: ResendEventType.EMAIL_BOUNCED,
        created_at: '2021-03-31T11:55:00.000Z',
        data: {
          id: 'email_123',
          object: 'email',
          created_at: '2021-03-31T11:55:00.000Z',
          to: ['recipient@example.com'],
          from: 'sender@example.com',
          subject: 'Test Email',
          html: '<p>Test content</p>',
          last_event: 'bounced',
          bounce: {
            code: '550',
            description: 'Mailbox not found',
          },
        },
      } as any; // Using 'any' to bypass TypeScript checking for the test
      
      const transformed = transformResendWebhook(payload);
      
      expect(transformed).toEqual({
        id: 'test_webhook_id',
        timestamp: Math.floor(mockTimestamp / 1000),
        source: 'resend',
        eventType: ResendEventType.EMAIL_BOUNCED,
        emailId: 'email_123',
        emailData: {
          from: 'sender@example.com',
          to: ['recipient@example.com'],
          subject: 'Test Email',
          sentAt: '2021-03-31T11:55:00.000Z',
        },
        eventData: {
          bounceCode: '550',
          bounceDescription: 'Mailbox not found',
        },
        metadata: {
          originalTimestamp: '2021-03-31T11:55:00.000Z',
        },
      });
    });
    
    it('should transform an email.opened webhook correctly', () => {
      const payload: ResendWebhookPayload = {
        type: ResendEventType.EMAIL_OPENED,
        created_at: '2021-03-31T11:55:00.000Z',
        data: {
          id: 'email_123',
          object: 'email',
          created_at: '2021-03-31T11:55:00.000Z',
          to: ['recipient@example.com'],
          from: 'sender@example.com',
          subject: 'Test Email',
          html: '<p>Test content</p>',
          last_event: 'opened',
          email: {
            ip_address: '192.168.1.1',
            user_agent: 'Mozilla/5.0',
          },
        },
      } as any; // Using 'any' to bypass TypeScript checking for the test
      
      const transformed = transformResendWebhook(payload);
      
      expect(transformed).toEqual({
        id: 'test_webhook_id',
        timestamp: Math.floor(mockTimestamp / 1000),
        source: 'resend',
        eventType: ResendEventType.EMAIL_OPENED,
        emailId: 'email_123',
        emailData: {
          from: 'sender@example.com',
          to: ['recipient@example.com'],
          subject: 'Test Email',
          sentAt: '2021-03-31T11:55:00.000Z',
        },
        eventData: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
        metadata: {
          originalTimestamp: '2021-03-31T11:55:00.000Z',
        },
      });
    });
    
    it('should handle string recipient correctly', () => {
      const payload: ResendWebhookPayload = {
        type: ResendEventType.EMAIL_SENT,
        created_at: '2021-03-31T11:55:00.000Z',
        data: {
          id: 'email_123',
          object: 'email',
          created_at: '2021-03-31T11:55:00.000Z',
          to: 'recipient@example.com' as any, // Using 'any' to simulate a string instead of array
          from: 'sender@example.com',
          subject: 'Test Email',
          html: '<p>Test content</p>',
          last_event: 'sent',
        },
      };
      
      const transformed = transformResendWebhook(payload);
      
      expect(transformed.emailData.to).toEqual(['recipient@example.com']);
    });
  });
  
  describe('validateResendPayload', () => {
    it('should validate a valid payload', () => {
      const payload = {
        type: ResendEventType.EMAIL_SENT,
        data: {
          id: 'email_123',
          from: 'sender@example.com',
          to: ['recipient@example.com'],
          subject: 'Test Email',
        },
      };
      
      const result = validateResendPayload(payload);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
    
    it('should reject a non-object payload', () => {
      const result = validateResendPayload('not an object');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Payload is not an object');
    });
    
    it('should reject a payload with missing type', () => {
      const payload = {
        data: {
          id: 'email_123',
          from: 'sender@example.com',
          to: ['recipient@example.com'],
          subject: 'Test Email',
        },
      };
      
      const result = validateResendPayload(payload);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing event type');
    });
    
    it('should reject a payload with missing data', () => {
      const payload = {
        type: ResendEventType.EMAIL_SENT,
      };
      
      const result = validateResendPayload(payload);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing data object');
    });
    
    it('should reject a payload with missing email ID', () => {
      const payload = {
        type: ResendEventType.EMAIL_SENT,
        data: {
          from: 'sender@example.com',
          to: ['recipient@example.com'],
          subject: 'Test Email',
        },
      };
      
      const result = validateResendPayload(payload);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing email ID');
    });
    
    it('should reject a payload with an invalid event type', () => {
      const payload = {
        type: 'invalid.event.type',
        data: {
          id: 'email_123',
          from: 'sender@example.com',
          to: ['recipient@example.com'],
          subject: 'Test Email',
        },
      };
      
      const result = validateResendPayload(payload);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid event type');
    });
  });
});