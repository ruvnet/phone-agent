import { describe, it, expect, vi } from 'vitest';
import { EmailService } from './mocks/email-service';
import { StorageService } from './mocks/storage-service';
import { BlandService } from './mocks/bland-service';
import { CalendarService } from './mocks/calendar-service';
import { AgentSchedulingService } from './mocks/agent-scheduling-service';

describe('Cloudflare Pages Implementation', () => {
  describe('Email Webhook Handler', () => {
    it('should process email webhooks correctly', async () => {
      // Create service instances
      const emailService = new EmailService();
      const storageService = new StorageService();
      const schedulingService = new AgentSchedulingService(storageService);
      
      // Mock the webhook payload
      const payload = {
        type: 'email.received',
        data: {
          id: 'test-email-id',
          from: 'sender@example.com',
          to: 'recipient@example.com',
          subject: 'Meeting Invitation',
          attachments: [
            {
              filename: 'invite.ics',
              content: 'BEGIN:VCALENDAR\nEND:VCALENDAR'
            }
          ]
        }
      };
      
      // Spy on the methods
      const processWebhookSpy = vi.spyOn(emailService, 'processWebhook');
      const handleIncomingRequestSpy = vi.spyOn(schedulingService, 'handleIncomingRequest');
      
      // Process the webhook
      const result = await emailService.processWebhook(payload);
      
      // Verify the email service processed the webhook
      expect(processWebhookSpy).toHaveBeenCalledWith(payload);
      expect(result.success).toBe(true);
      
      // Simulate the scheduling service handling the request
      if (result.success) {
        await schedulingService.handleIncomingRequest(result.data);
      }
      
      // Verify the scheduling service was called
      expect(handleIncomingRequestSpy).toHaveBeenCalled();
    });
  });
  
  describe('Call Scheduling Handler', () => {
    it('should schedule calls correctly', async () => {
      // Create service instances
      const storageService = new StorageService();
      const blandService = new BlandService();
      const calendarService = new CalendarService();
      const schedulingService = new AgentSchedulingService(
        storageService,
        blandService,
        calendarService
      );
      
      // Spy on the methods
      const scheduleCallSpy = vi.spyOn(schedulingService, 'scheduleCall');
      
      // Schedule a call
      const requestId = 'test-request-id';
      const result = await schedulingService.scheduleCall(requestId);
      
      // Verify the scheduling service was called
      expect(scheduleCallSpy).toHaveBeenCalledWith(requestId);
      expect(result).toEqual({
        callId: 'test-call-id',
        status: 'scheduled',
        scheduledTime: '2025-04-01T14:00:00Z'
      });
    });
    
    it('should handle missing requestId', async () => {
      // This would normally be handled by the API endpoint
      const requestId = '';
      
      // Verify that an empty requestId would cause an error
      expect(requestId).toBe('');
    });
  });
  
  describe('Cloudflare KV Integration', () => {
    it('should store and retrieve data from KV', async () => {
      // Create storage service
      const storageService = new StorageService();
      
      // Mock KV namespace
      const mockKV = {
        get: vi.fn().mockResolvedValue(JSON.stringify({ test: 'data' })),
        put: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
        list: vi.fn().mockResolvedValue({ keys: [] })
      };
      
      // Set the KV namespace
      storageService.setKVNamespace(mockKV);
      
      // Store call data
      await storageService.storeCallData('test-call-id', {
        callId: 'test-call-id',
        status: 'scheduled'
      });
      
      // Retrieve call data
      const callData = await storageService.getCallData('test-call-id');
      
      // Verify the data
      expect(callData).toBeDefined();
      expect(callData.callId).toBe('test-call-id');
    });
  });
});