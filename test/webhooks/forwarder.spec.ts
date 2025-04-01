import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { forwardWebhook, storeFailedWebhook } from '../../src/webhooks/forwarder';
import { TransformedWebhookPayload } from '../../src/types/webhook';
import { webhookConfig } from '../../src/config/webhook';

// Mock the fetch function
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock the console.error function
const originalConsoleError = console.error;
console.error = vi.fn();

// Mock the webhook config
vi.mock('../../src/config/webhook', () => ({
  webhookConfig: {
    resend: {
      signingSecret: 'test_secret',
      signatureHeader: 'svix-signature',
      timestampHeader: 'svix-timestamp',
      maxAge: 300,
    },
    target: {
      url: 'https://example.com/webhook',
      authToken: 'test_auth_token',
      authHeader: 'Authorization',
      maxRetries: 2,
      retryDelay: 10, // Short delay for tests
    },
    general: {
      debug: false,
      storeFailedPayloads: true,
    },
  },
}));

// Mock the security utility
vi.mock('../../src/utils/security', () => ({
  generateAuthHeader: () => 'Bearer test_auth_token',
}));

describe('Webhook Forwarder', () => {
  // Sample transformed webhook payload
  const samplePayload: TransformedWebhookPayload = {
    id: 'test_webhook_id',
    timestamp: Math.floor(Date.now() / 1000),
    source: 'resend',
    eventType: 'email.sent',
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
  };
  
  beforeEach(() => {
    // Reset mocks before each test
    mockFetch.mockReset();
    vi.mocked(console.error).mockReset();
  });
  
  afterAll(() => {
    // Restore original console.error
    console.error = originalConsoleError;
  });
  
  describe('forwardWebhook', () => {
    it('should successfully forward a webhook', async () => {
      // Mock a successful response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
      });
      
      const result = await forwardWebhook(samplePayload);
      
      // Check that fetch was called with the correct arguments
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        webhookConfig.target.url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [webhookConfig.target.authHeader]: 'Bearer test_auth_token',
            'X-Webhook-Source': 'resend-forwarder',
            'X-Webhook-ID': samplePayload.id,
          },
          body: JSON.stringify(samplePayload),
        }
      );
      
      // Check the result
      expect(result).toEqual({
        success: true,
        webhookId: samplePayload.id,
        eventType: samplePayload.eventType,
        timestamp: samplePayload.timestamp,
        statusCode: 200,
      });
    });
    
    it('should handle a failed response from the target webhook', async () => {
      // Mock a failed response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: () => Promise.resolve('Invalid payload'),
      });
      
      const result = await forwardWebhook(samplePayload);
      
      // Check that fetch was called
      expect(mockFetch).toHaveBeenCalledTimes(1);
      
      // Check the result
      expect(result).toEqual({
        success: false,
        webhookId: samplePayload.id,
        eventType: samplePayload.eventType,
        timestamp: samplePayload.timestamp,
        statusCode: 400,
        error: 'Target webhook returned error: 400 Bad Request. Response: Invalid payload',
      });
    });
    
    it('should retry on server errors', async () => {
      // Mock a server error followed by a successful response
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: () => Promise.resolve('Server error'),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
        });
      
      const result = await forwardWebhook(samplePayload);
      
      // Check that fetch was called twice (initial + 1 retry)
      expect(mockFetch).toHaveBeenCalledTimes(2);
      
      // Check the result
      expect(result).toEqual({
        success: true,
        webhookId: samplePayload.id,
        eventType: samplePayload.eventType,
        timestamp: samplePayload.timestamp,
        statusCode: 200,
      });
    });
    
    it('should handle network errors', async () => {
      // Mock a network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      const result = await forwardWebhook(samplePayload);
      
      // Check that fetch was called
      expect(mockFetch).toHaveBeenCalledTimes(1);
      
      // Check the result
      expect(result).toEqual({
        success: false,
        webhookId: samplePayload.id,
        eventType: samplePayload.eventType,
        timestamp: samplePayload.timestamp,
        error: 'Error forwarding webhook: Network error',
      });
    });
    
    it('should handle missing target URL', async () => {
      // Temporarily modify the webhook config
      const originalUrl = webhookConfig.target.url;
      webhookConfig.target.url = '';
      
      const result = await forwardWebhook(samplePayload);
      
      // Restore the original URL
      webhookConfig.target.url = originalUrl;
      
      // Check that fetch was not called
      expect(mockFetch).not.toHaveBeenCalled();
      
      // Check the result
      expect(result).toEqual({
        success: false,
        webhookId: samplePayload.id,
        eventType: samplePayload.eventType,
        timestamp: samplePayload.timestamp,
        error: 'Target webhook URL not configured',
      });
    });
    
    it('should exhaust retries on persistent server errors', async () => {
      // Mock multiple server errors
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: () => Promise.resolve('Server error 1'),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
          text: () => Promise.resolve('Server error 2'),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 502,
          statusText: 'Bad Gateway',
          text: () => Promise.resolve('Server error 3'),
        });
      
      const result = await forwardWebhook(samplePayload);
      
      // Check that fetch was called maxRetries + 1 times
      expect(mockFetch).toHaveBeenCalledTimes(webhookConfig.target.maxRetries + 1);
      
      // Check the result
      expect(result).toEqual({
        success: false,
        webhookId: samplePayload.id,
        eventType: samplePayload.eventType,
        timestamp: samplePayload.timestamp,
        statusCode: 502,
        error: 'Target webhook returned error: 502 Bad Gateway. Response: Server error 3',
      });
    });
  });
  
  describe('storeFailedWebhook', () => {
    it('should log the failed webhook when storage is enabled', () => {
      storeFailedWebhook(samplePayload, 'Test error');
      
      // Check that console.error was called
      expect(console.error).toHaveBeenCalledTimes(2);
      expect(vi.mocked(console.error).mock.calls[0][0]).toBe('Failed to process webhook test_webhook_id: Test error');
      expect(vi.mocked(console.error).mock.calls[1][0]).toBe('Payload:');
    });
    
    it('should not log when storage is disabled', () => {
      // Temporarily modify the webhook config
      const originalStoreFailedPayloads = webhookConfig.general.storeFailedPayloads;
      webhookConfig.general.storeFailedPayloads = false;
      
      storeFailedWebhook(samplePayload, 'Test error');
      
      // Restore the original setting
      webhookConfig.general.storeFailedPayloads = originalStoreFailedPayloads;
      
      // Check that console.error was not called
      expect(console.error).not.toHaveBeenCalled();
    });
  });
});