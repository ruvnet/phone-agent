import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyWebhookSignature, generateAuthHeader, generateWebhookId } from '../../src/utils/security';
import { webhookConfig } from '../../src/config/webhook';

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
      maxRetries: 3,
      retryDelay: 100,
    },
    general: {
      debug: false,
      storeFailedPayloads: false,
    },
  },
}));

describe('Security Utilities', () => {
  describe('verifyWebhookSignature', () => {
    const payload = '{"type":"email.sent","data":{"id":"test_id"}}';
    let timestamp: string;
    let signature: string;
    
    beforeEach(() => {
      // Generate a timestamp that's within the valid range
      const now = Math.floor(Date.now() / 1000);
      timestamp = now.toString();
      
      // Generate a valid signature
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', 'test_secret');
      hmac.update(`${timestamp}.${payload}`);
      const expectedSignature = hmac.digest('hex');
      signature = `v1,${expectedSignature}`;
    });
    
    it('should return isValid=true for a valid signature', () => {
      const result = verifyWebhookSignature(payload, signature, timestamp);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
    
    it('should return isValid=false for an invalid signature', () => {
      const invalidSignature = 'v1,invalid_signature';
      const result = verifyWebhookSignature(payload, invalidSignature, timestamp);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
    
    it('should return isValid=false for a missing signature', () => {
      const result = verifyWebhookSignature(payload, '', timestamp);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing signature');
    });
    
    it('should return isValid=false for a missing timestamp', () => {
      const result = verifyWebhookSignature(payload, signature, '');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing timestamp');
    });
    
    it('should return isValid=false for a missing payload', () => {
      const result = verifyWebhookSignature('', signature, timestamp);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing payload');
    });
    
    it('should return isValid=false for an expired timestamp', () => {
      const expiredTimestamp = (Math.floor(Date.now() / 1000) - 600).toString(); // 10 minutes ago
      const result = verifyWebhookSignature(payload, signature, expiredTimestamp);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Webhook too old');
    });
    
    it('should return isValid=false for an invalid timestamp format', () => {
      const result = verifyWebhookSignature(payload, signature, 'not_a_number');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid timestamp format');
    });
  });
  
  describe('generateAuthHeader', () => {
    it('should generate a valid Bearer token', () => {
      const authHeader = generateAuthHeader();
      expect(authHeader).toBe('Bearer test_auth_token');
    });
  });
  
  describe('generateWebhookId', () => {
    it('should generate a unique ID with the correct prefix', () => {
      const id = generateWebhookId();
      expect(id).toMatch(/^wh_\d+_[a-z0-9]+$/);
    });
    
    it('should generate different IDs on each call', () => {
      const id1 = generateWebhookId();
      const id2 = generateWebhookId();
      expect(id1).not.toBe(id2);
    });
  });
});