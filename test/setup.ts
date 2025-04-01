/**
 * Test setup file for Vitest
 * This file is executed before running tests
 */

// Import Vitest utilities
import { vi } from 'vitest';

// Define FetchEvent interface for testing
declare global {
  interface FetchEvent extends Event {
    readonly request: Request;
    respondWith(response: Response | Promise<Response>): void;
  }
  
  // Add addEventListener for Cloudflare Workers
  function addEventListener(
    type: 'fetch',
    handler: (event: FetchEvent) => void
  ): void;
}

// Set NODE_ENV to 'test'
process.env.NODE_ENV = 'test';

// Create a namespace for the global fetch function
const globalFetch = global.fetch;

// Mock fetch if it doesn't exist
if (!globalFetch) {
  global.fetch = vi.fn() as any;
}

// Mock addEventListener for Cloudflare Workers
(global as any).addEventListener = vi.fn();

// Mock console methods for tests
console.log = vi.fn();
console.error = vi.fn();
console.warn = vi.fn();
console.info = vi.fn();

// Create a mock for environment variables
process.env = {
  ...process.env,
  WEBHOOK_SIGNING_SECRET: 'test_signing_secret',
  TARGET_WEBHOOK_URL: 'https://example.com/webhook',
  TARGET_WEBHOOK_AUTH_TOKEN: 'test_auth_token',
  DEBUG_WEBHOOKS: 'false',
  STORE_FAILED_PAYLOADS: 'true',
  RESEND_API_KEY: 'test-api-key',
  SENDER_EMAIL: 'test@example.com',
  SENDER_NAME: 'Test Sender',
  DEFAULT_TIMEZONE: 'America/New_York',
  BLAND_AI_API_KEY: 'test-bland-api-key',
  BLAND_AI_WEBHOOK_SECRET: 'test-webhook-secret',
  BLAND_AI_AGENT_ID: 'test-agent-id',
  BLAND_AI_BASE_URL: 'https://api.bland.ai',
  MAX_CALL_DURATION_MINUTES: '30',
  DEFAULT_RETRY_COUNT: '2'
};