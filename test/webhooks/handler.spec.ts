import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processWebhook, createWebhookResponse } from '../../src/webhooks/handler';
import { WebhookProcessingResult, TransformedWebhookPayload } from '../../src/types/webhook';
import { webhookConfig } from '../../src/config/webhook';

// Mock the dependencies
vi.mock('../../src/utils/security', () => ({
  verifyWebhookSignature: vi.fn(),
}));

vi.mock('../../src/webhooks/transformer', () => ({
  validateResendPayload: vi.fn(),
  transformResendWebhook: vi.fn(),
}));

vi.mock('../../src/webhooks/forwarder', () => ({
  forwardWebhook: vi.fn(),
  storeFailedWebhook: vi.fn(),
}));

// Import the mocked functions
import { verifyWebhookSignature } from '../../src/utils/security';
import { validateResendPayload, transformResendWebhook } from '../../src/webhooks/transformer';
import { forwardWebhook, storeFailedWebhook } from '../../src/webhooks/forwarder';

describe('Webhook Handler', () => {
  // Sample webhook request data
  const sampleRequestData = {
    body: '{"type":"email.sent","data":{"id":"email_123"}}',
    headers: {
      'svix-signature': 'v1,valid_signature',
      'svix-timestamp': Math.floor(Date.now() / 1000).toString(),
    },
  };
  
  // Sample transformed payload
  const sampleTransformedPayload: TransformedWebhookPayload = {
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
    metadata: {},
  };
  
  // Sample webhook processing result
  const sampleSuccessResult: WebhookProcessingResult = {
    success: true,
    webhookId: 'test_webhook_id',
    eventType: 'email.sent',
    timestamp: Math.floor(Date.now() / 1000),
    statusCode: 200,
  };
  
  const sampleErrorResult: WebhookProcessingResult = {
    success: false,
    webhookId: 'test_webhook_id',
    eventType: 'email.sent',
    timestamp: Math.floor(Date.now() / 1000),
    error: 'Test error',
    statusCode: 500,
  };
  
  beforeEach(() => {
    // Reset all mocks
    vi.resetAllMocks();
    
    // Set up default mock implementations
    vi.mocked(verifyWebhookSignature).mockReturnValue({ isValid: true });
    vi.mocked(validateResendPayload).mockReturnValue({ isValid: true });
    vi.mocked(transformResendWebhook).mockReturnValue(sampleTransformedPayload);
    vi.mocked(forwardWebhook).mockResolvedValue(sampleSuccessResult);
  });
  
  describe('processWebhook', () => {
    it('should process a valid webhook successfully', async () => {
      const result = await processWebhook(sampleRequestData);
      
      // Check that all functions were called with the correct arguments
      expect(verifyWebhookSignature).toHaveBeenCalledWith(
        sampleRequestData.body,
        sampleRequestData.headers['svix-signature'],
        sampleRequestData.headers['svix-timestamp']
      );
      
      expect(validateResendPayload).toHaveBeenCalled();
      expect(transformResendWebhook).toHaveBeenCalled();
      expect(forwardWebhook).toHaveBeenCalledWith(sampleTransformedPayload);
      
      // Check the result
      expect(result).toEqual(sampleSuccessResult);
    });
    
    it('should reject a webhook with invalid signature', async () => {
      // Mock an invalid signature
      vi.mocked(verifyWebhookSignature).mockReturnValue({
        isValid: false,
        error: 'Invalid signature',
      });
      
      const result = await processWebhook(sampleRequestData);
      
      // Check that only the signature verification was called
      expect(verifyWebhookSignature).toHaveBeenCalled();
      expect(validateResendPayload).not.toHaveBeenCalled();
      expect(transformResendWebhook).not.toHaveBeenCalled();
      expect(forwardWebhook).not.toHaveBeenCalled();
      
      // Check the result
      expect(result).toEqual({
        success: false,
        webhookId: 'invalid_signature',
        eventType: 'unknown',
        timestamp: expect.any(Number),
        error: 'Invalid signature',
      });
    });
    
    it('should handle invalid JSON payload', async () => {
      // Create a request with invalid JSON
      const invalidJsonRequest = {
        body: 'not valid json',
        headers: sampleRequestData.headers,
      };
      
      const result = await processWebhook(invalidJsonRequest);
      
      // Check that only the signature verification was called
      expect(verifyWebhookSignature).toHaveBeenCalled();
      expect(validateResendPayload).not.toHaveBeenCalled();
      expect(transformResendWebhook).not.toHaveBeenCalled();
      expect(forwardWebhook).not.toHaveBeenCalled();
      
      // Check the result
      expect(result).toEqual({
        success: false,
        webhookId: 'invalid_json',
        eventType: 'unknown',
        timestamp: expect.any(Number),
        error: expect.stringContaining('Invalid JSON payload'),
      });
    });
    
    it('should handle invalid payload structure', async () => {
      // Mock an invalid payload structure
      vi.mocked(validateResendPayload).mockReturnValue({
        isValid: false,
        error: 'Missing required fields',
      });
      
      const result = await processWebhook(sampleRequestData);
      
      // Check that validation was called but transformation and forwarding were not
      expect(verifyWebhookSignature).toHaveBeenCalled();
      expect(validateResendPayload).toHaveBeenCalled();
      expect(transformResendWebhook).not.toHaveBeenCalled();
      expect(forwardWebhook).not.toHaveBeenCalled();
      
      // Check the result
      expect(result).toEqual({
        success: false,
        webhookId: 'invalid_payload',
        eventType: expect.any(String),
        timestamp: expect.any(Number),
        error: 'Missing required fields',
      });
    });
    
    it('should handle forwarding failures', async () => {
      // Mock a forwarding failure
      vi.mocked(forwardWebhook).mockResolvedValue(sampleErrorResult);
      
      const result = await processWebhook(sampleRequestData);
      
      // Check that all functions were called
      expect(verifyWebhookSignature).toHaveBeenCalled();
      expect(validateResendPayload).toHaveBeenCalled();
      expect(transformResendWebhook).toHaveBeenCalled();
      expect(forwardWebhook).toHaveBeenCalled();
      
      // Check that storeFailedWebhook was called
      expect(storeFailedWebhook).toHaveBeenCalledWith(
        sampleTransformedPayload,
        'Test error'
      );
      
      // Check the result
      expect(result).toEqual(sampleErrorResult);
    });
    
    it('should handle unexpected errors', async () => {
      // Mock an unexpected error
      vi.mocked(transformResendWebhook).mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      
      const result = await processWebhook(sampleRequestData);
      
      // Check the result
      expect(result).toEqual({
        success: false,
        webhookId: 'error',
        eventType: 'unknown',
        timestamp: expect.any(Number),
        error: 'Error processing webhook: Unexpected error',
      });
    });
  });
  
  describe('createWebhookResponse', () => {
    it('should create a success response', () => {
      const response = createWebhookResponse(sampleSuccessResult);
      
      expect(response).toEqual({
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Webhook processed successfully',
          webhookId: 'test_webhook_id',
        }),
      });
    });
    
    it('should create a 401 response for invalid signatures', () => {
      const result: WebhookProcessingResult = {
        success: false,
        webhookId: 'invalid_signature',
        eventType: 'unknown',
        timestamp: Math.floor(Date.now() / 1000),
        error: 'Invalid webhook signature',
      };
      
      const response = createWebhookResponse(result);
      
      expect(response).toEqual({
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          message: 'Invalid webhook signature',
          error: 'Invalid webhook signature',
        }),
      });
    });
    
    it('should create a 400 response for invalid payloads', () => {
      const result: WebhookProcessingResult = {
        success: false,
        webhookId: 'invalid_payload',
        eventType: 'unknown',
        timestamp: Math.floor(Date.now() / 1000),
        error: 'Invalid payload structure',
      };
      
      const response = createWebhookResponse(result);
      
      expect(response).toEqual({
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'Invalid webhook payload',
          error: 'Invalid payload structure',
        }),
      });
    });
    
    it('should create a 500 response for other errors', () => {
      const result: WebhookProcessingResult = {
        success: false,
        webhookId: 'error',
        eventType: 'unknown',
        timestamp: Math.floor(Date.now() / 1000),
        error: 'Internal server error',
      };
      
      const response = createWebhookResponse(result);
      
      expect(response).toEqual({
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: 'Error processing webhook',
          error: 'Internal server error',
        }),
      });
    });
  });
});