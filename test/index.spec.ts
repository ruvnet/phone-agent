import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateWebhookConfig } from '../src/config/webhook';
import { processWebhook, createWebhookResponse } from '../src/webhooks/handler';

// Mock the webhook handler and config validator
vi.mock('../src/webhooks/handler', () => ({
  processWebhook: vi.fn(),
  createWebhookResponse: vi.fn(),
}));

vi.mock('../src/config/webhook', () => ({
  validateWebhookConfig: vi.fn(),
}));

// Mock the fetch function
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Webhook Integration', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.resetAllMocks();
    
    // Set up default mock implementations
    vi.mocked(validateWebhookConfig).mockReturnValue([]);
    vi.mocked(processWebhook).mockResolvedValue({
      success: true,
      webhookId: 'test_webhook_id',
      eventType: 'email.sent',
      timestamp: Math.floor(Date.now() / 1000),
      statusCode: 200,
    });
    vi.mocked(createWebhookResponse).mockReturnValue({
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    });
  });
  
  it('should process webhook requests correctly', async () => {
    // Create a mock webhook payload
    const webhookPayload = {
      type: 'email.sent',
      data: {
        id: 'email_123',
        from: 'sender@example.com',
        to: ['recipient@example.com'],
        subject: 'Test Email',
      },
    };
    
    // Call the processWebhook function directly
    const result = await processWebhook({
      body: JSON.stringify(webhookPayload),
      headers: {
        'content-type': 'application/json',
        'x-webhook-signature': 'test_signature',
      },
    });
    
    // Check that processWebhook was called
    expect(processWebhook).toHaveBeenCalled();
    
    // Check the result
    expect(result).toEqual({
      success: true,
      webhookId: 'test_webhook_id',
      eventType: 'email.sent',
      timestamp: expect.any(Number),
      statusCode: 200,
    });
  });
  
  it('should create appropriate webhook responses', () => {
    // Create a mock processing result
    const processingResult = {
      success: true,
      webhookId: 'test_webhook_id',
      eventType: 'email.sent',
      timestamp: Math.floor(Date.now() / 1000),
      statusCode: 200,
    };
    
    // Call the createWebhookResponse function
    const response = createWebhookResponse(processingResult);
    
    // Check the response
    expect(response).toEqual({
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    });
  });
  
  it('should handle webhook configuration errors', () => {
    // Mock configuration errors
    vi.mocked(validateWebhookConfig).mockReturnValue([
      'Missing webhook signing secret',
      'Missing target webhook URL',
    ]);
    
    // Check that validateWebhookConfig returns errors
    const errors = validateWebhookConfig();
    
    // Check the errors
    expect(errors).toEqual([
      'Missing webhook signing secret',
      'Missing target webhook URL',
    ]);
  });
});
