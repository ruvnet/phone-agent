import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import axios from 'axios';
import { BlandAiService } from '../../src/services/bland-service';
import { AppError } from '../../src/utils/logger';

// Mock dependencies
vi.mock('axios', () => {
  const mockAxios = {
    create: vi.fn(() => ({
      post: vi.fn(),
      get: vi.fn()
    })),
    isAxiosError: vi.fn()
  };
  return {
    default: mockAxios,
    isAxiosError: vi.fn()
  };
});

vi.mock('uuid', () => {
  return {
    v4: vi.fn().mockReturnValue('mock-uuid-value')
  };
});

vi.mock('../../src/utils/logger', () => {
  return {
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    },
    AppError: class extends Error {
      statusCode: number;
      constructor(message: string, statusCode = 500) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
      }
    }
  };
});

vi.mock('../../src/utils/config', () => {
  return {
    config: {
      getBlandAiConfig: vi.fn().mockReturnValue({
        apiKey: 'test-api-key',
        webhookSecret: 'test-webhook-secret',
        agentId: 'test-agent-id',
        baseUrl: 'https://api.test.bland.ai',
        maxCallDuration: 30,
        defaultRetryCount: 3
      }),
      isDevelopment: vi.fn().mockReturnValue(false),
      get: vi.fn()
    }
  };
});

// Mock storage service
vi.mock('../../src/services/storage-service', () => {
  return {
    storageService: {
      getCallData: vi.fn().mockResolvedValue({
        callId: 'mock-call-id',
        phoneNumber: '+15551234567',
        scheduledTime: '2025-04-01T14:00:00Z',
        status: 'scheduled',
        createdAt: '2025-04-01T10:00:00Z',
        updatedAt: '2025-04-01T10:00:00Z'
      }),
      storeCallData: vi.fn().mockResolvedValue(true)
    }
  };
});

// Mock email service
vi.mock('../../src/services/email-service', () => {
  return {
    emailService: {
      sendCallNotification: vi.fn().mockResolvedValue(true)
    }
  };
});

// Mock calendar service
vi.mock('../../src/services/calendar-service', () => {
  return {
    calendarService: {
      addCallToCalendar: vi.fn().mockResolvedValue('calendar-event-id')
    }
  };
});

describe('BlandAiService', () => {
  let blandAiService: BlandAiService;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create a mock axios instance
    mockAxiosInstance = {
      post: vi.fn().mockResolvedValue({
        data: {
          id: 'mock-call-id',
          status: 'scheduled',
          scheduled_time: '2025-04-01T14:00:00Z',
          estimated_duration: 30
        }
      }),
      get: vi.fn().mockResolvedValue({
        data: {
          id: 'mock-call-id',
          status: 'scheduled',
          scheduled_time: '2025-04-01T14:00:00Z',
          estimated_duration: 30
        }
      })
    };
    
    // Set the mock axios.create to return our mockAxiosInstance
    (axios.create as any).mockReturnValue(mockAxiosInstance);
    
    // Create a new instance of BlandAiService
    blandAiService = new BlandAiService();
    
    // Replace the axios client with our mock
    (blandAiService as any).client = mockAxiosInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default config values', () => {
      const service = new BlandAiService();
      
      expect(service).toBeInstanceOf(BlandAiService);
      expect((service as any).apiKey).toBe('test-api-key');
      expect((service as any).webhookSecret).toBe('test-webhook-secret');
      expect((service as any).agentId).toBe('test-agent-id');
      expect((service as any).baseUrl).toBe('https://api.test.bland.ai');
      expect((service as any).maxCallDuration).toBe(30);
      expect((service as any).defaultRetryCount).toBe(3);
    });

    it('should initialize with custom config values', () => {
      const customConfig = {
        apiKey: 'custom-api-key',
        webhookSecret: 'custom-secret',
        agentId: 'custom-agent-id',
        baseUrl: 'https://custom.api.bland.ai',
        maxCallDuration: 45,
        defaultRetryCount: 5
      };
      
      const service = new BlandAiService(customConfig);
      
      expect(service).toBeInstanceOf(BlandAiService);
      expect((service as any).apiKey).toBe('custom-api-key');
      expect((service as any).webhookSecret).toBe('custom-secret');
      expect((service as any).agentId).toBe('custom-agent-id');
      expect((service as any).baseUrl).toBe('https://custom.api.bland.ai');
      expect((service as any).maxCallDuration).toBe(45);
      expect((service as any).defaultRetryCount).toBe(5);
    });

    it('should create an axios client with the correct configuration', () => {
      const service = new BlandAiService();
      
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.test.bland.ai',
        headers: {
          'Authorization': 'Bearer test-api-key',
          'Content-Type': 'application/json'
        }
      });
    });
  });

  describe('scheduleCall', () => {
    it('should successfully schedule a call', async () => {
      const options = {
        phoneNumber: '+15551234567',
        scheduledTime: '2025-04-01T14:00:00Z',
        task: 'Test call',
        maxDuration: 30,
        webhookUrl: 'https://example.com/webhook',
        recipientName: 'John Doe',
        recipientEmail: 'john@example.com',
        topic: 'Test Topic'
      };
      
      // Spy on the buildCallPayload method
      const buildPayloadSpy = vi.spyOn(blandAiService as any, 'buildCallPayload');
      
      const result = await blandAiService.scheduleCall(options);
      
      expect(buildPayloadSpy).toHaveBeenCalledWith(options);
      expect(result).toEqual({
        callId: expect.any(String),
        status: 'scheduled',
        scheduledTime: options.scheduledTime,
        estimatedDuration: options.maxDuration
      });
    });

    it('should throw an error if API call fails', async () => {
      const options = {
        phoneNumber: '+15551234567',
        scheduledTime: '2025-04-01T14:00:00Z'
      };
      
      // Mock axios to reject
      mockAxiosInstance.post.mockRejectedValueOnce(new Error('API failed'));
      
      await expect(blandAiService.scheduleCall(options)).rejects.toThrow('Call scheduling failed: API failed');
    });

    it('should handle rate limit errors properly', async () => {
      const options = {
        phoneNumber: '+15551234567',
        scheduledTime: '2025-04-01T14:00:00Z'
      };
      
      // Create a rate limit error
      const rateLimitError = new Error('Rate limit exceeded') as any;
      rateLimitError.response = {
        status: 429,
        data: { error: 'Rate limit exceeded' }
      };
      
      // Make axios.isAxiosError return true for our error
      (axios.isAxiosError as any).mockReturnValueOnce(true);
      
      // Mock axios to reject with our error
      mockAxiosInstance.post.mockRejectedValueOnce(rateLimitError);
      
      await expect(blandAiService.scheduleCall(options)).rejects.toThrow('Rate limit exceeded. Please try again later.');
      expect((axios.isAxiosError as any)).toHaveBeenCalled();
    });

    it('should handle scheduling conflict errors properly', async () => {
      const options = {
        phoneNumber: '+15551234567',
        scheduledTime: '2025-04-01T14:00:00Z'
      };
      
      // Create a scheduling conflict error
      const conflictError = new Error('Scheduling conflict') as any;
      conflictError.response = {
        status: 400,
        data: { error: 'scheduling conflict detected' }
      };
      
      // Make axios.isAxiosError return true for our error
      (axios.isAxiosError as any).mockReturnValueOnce(true);
      
      // Mock axios to reject with our error
      mockAxiosInstance.post.mockRejectedValueOnce(conflictError);
      
      await expect(blandAiService.scheduleCall(options)).rejects.toThrow('Scheduling conflict detected. Please choose another time.');
      expect((axios.isAxiosError as any)).toHaveBeenCalled();
    });
  });

  describe('buildCallPayload', () => {
    it('should throw an error if phone number is missing', () => {
      const options = {
        phoneNumber: '',
        scheduledTime: '2025-04-01T14:00:00Z'
      };
      
      expect(() => (blandAiService as any).buildCallPayload(options)).toThrow('Phone number is required');
    });

    it('should throw an error if scheduled time is missing', () => {
      const options = {
        phoneNumber: '+15551234567',
        scheduledTime: ''
      };
      
      expect(() => (blandAiService as any).buildCallPayload(options)).toThrow('Scheduled time is required');
    });

    it('should build a valid payload with minimal options', () => {
      const options = {
        phoneNumber: '+15551234567',
        scheduledTime: '2025-04-01T14:00:00Z'
      };
      
      const payload = (blandAiService as any).buildCallPayload(options);
      
      expect(payload).toEqual({
        phone_number: '+15551234567',
        scheduled_time: '2025-04-01T14:00:00Z',
        agent_id: 'test-agent-id',
        task: 'Make a scheduled call',
        max_duration: 30,
        metadata: {
          callId: 'mock-uuid-value',
          recipientName: undefined,
          recipientEmail: undefined,
          topic: undefined,
          scheduledBy: 'AI Phone Agent'
        },
        agent_config: {
          name: 'AI Assistant',
          goals: [
            'Have a productive conversation about the scheduled topic'
          ],
          constraints: [
            'Be polite and professional',
            'Respect the caller\'s time',
            'Stay on topic',
            'Keep the call under 30 minutes'
          ]
        }
      });
    });

    it('should build a valid payload with all options', () => {
      const options = {
        phoneNumber: '+15551234567',
        scheduledTime: '2025-04-01T14:00:00Z',
        task: 'Custom task',
        maxDuration: 45,
        webhookUrl: 'https://example.com/webhook',
        agentId: 'custom-agent-id',
        voiceId: 'custom-voice',
        recordCall: true,
        recipientName: 'John Doe',
        recipientEmail: 'john@example.com',
        topic: 'Test Topic',
        scheduledBy: 'Test User',
        callId: 'custom-call-id',
        goal: 'Have a great conversation',
        agentName: 'Custom Agent',
        agentConfig: {
          name: 'Custom Agent',
          goals: ['Custom goal'],
          constraints: ['Custom constraint']
        }
      };
      
      const payload = (blandAiService as any).buildCallPayload(options);
      
      expect(payload).toEqual({
        phone_number: '+15551234567',
        scheduled_time: '2025-04-01T14:00:00Z',
        agent_id: 'custom-agent-id',
        task: 'Custom task',
        max_duration: 45,
        webhook_url: 'https://example.com/webhook',
        voice_id: 'custom-voice',
        record_call: true,
        metadata: {
          callId: 'custom-call-id',
          recipientName: 'John Doe',
          recipientEmail: 'john@example.com',
          topic: 'Test Topic',
          scheduledBy: 'Test User'
        },
        agent_config: {
          name: 'Custom Agent',
          goals: ['Custom goal'],
          constraints: ['Custom constraint']
        }
      });
    });

    it('should convert Date objects to ISO strings', () => {
      const scheduledTime = new Date('2025-04-01T14:00:00Z');
      
      const options = {
        phoneNumber: '+15551234567',
        scheduledTime
      };
      
      const payload = (blandAiService as any).buildCallPayload(options);
      
      expect(payload.scheduled_time).toBe('2025-04-01T14:00:00.000Z');
    });
  });

  describe('getCallDetails', () => {
    it('should get call details successfully', async () => {
      const result = await blandAiService.getCallDetails('mock-call-id');
      
      expect(result).toEqual({
        id: 'mock-call-id',
        status: 'scheduled',
        scheduled_time: expect.any(String),
        estimated_duration: 30
      });
    });

    it('should throw an error if API call fails', async () => {
      // Mock axios to reject
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('API failed'));
      
      await expect(blandAiService.getCallDetails('mock-call-id')).rejects.toThrow('Call details retrieval failed: API failed');
    });
  });

  describe('cancelCall', () => {
    it('should cancel a call successfully', async () => {
      const result = await blandAiService.cancelCall('mock-call-id', 'Test reason');
      
      expect(result).toEqual({
        callId: 'mock-call-id',
        status: 'cancelled',
        cancelledAt: expect.any(String)
      });
    });

    it('should throw an error if API call fails', async () => {
      // Mock axios to reject
      mockAxiosInstance.post.mockRejectedValueOnce(new Error('API failed'));
      
      await expect(blandAiService.cancelCall('mock-call-id')).rejects.toThrow('Call cancellation failed: API failed');
    });
  });

  describe('rescheduleCall', () => {
    it('should reschedule a call successfully', async () => {
      const newTime = '2025-04-02T15:00:00Z';
      
      const result = await blandAiService.rescheduleCall('mock-call-id', newTime, 'Test reason');
      
      expect(result).toEqual({
        callId: 'mock-call-id',
        status: 'rescheduled',
        newScheduledTime: newTime,
        rescheduledAt: expect.any(String)
      });
    });

    it('should convert Date objects to ISO strings', async () => {
      const newTime = new Date('2025-04-02T15:00:00Z');
      
      const result = await blandAiService.rescheduleCall('mock-call-id', newTime);
      
      expect(result.newScheduledTime).toBe('2025-04-02T15:00:00.000Z');
    });

    it('should throw an error if API call fails', async () => {
      // Mock axios to reject
      mockAxiosInstance.post.mockRejectedValueOnce(new Error('API failed'));
      
      await expect(blandAiService.rescheduleCall('mock-call-id', '2025-04-02T15:00:00Z')).rejects.toThrow('Call rescheduling failed: API failed');
    });
  });

  describe('processWebhookEvent', () => {
    it('should process call.started event correctly', async () => {
      const event = {
        type: 'call.started',
        call_id: 'mock-call-id',
        timestamp: '2025-04-01T14:00:00Z'
      };
      
      // Spy on the handler method
      const handlerSpy = vi.spyOn(blandAiService as any, 'handleCallStarted');
      
      const result = await blandAiService.processWebhookEvent(event);
      
      expect(handlerSpy).toHaveBeenCalledWith(event);
      expect(result).toEqual({
        status: 'call_started',
        callId: 'mock-call-id',
        timestamp: expect.any(String)
      });
    });

    it('should process call.ended event correctly', async () => {
      const event = {
        type: 'call.ended',
        call_id: 'mock-call-id',
        timestamp: '2025-04-01T14:30:00Z'
      };
      
      // Spy on the handler method
      const handlerSpy = vi.spyOn(blandAiService as any, 'handleCallEnded');
      
      const result = await blandAiService.processWebhookEvent(event);
      
      expect(handlerSpy).toHaveBeenCalledWith(event);
      expect(result).toEqual({
        status: 'call_ended',
        callId: 'mock-call-id',
        timestamp: expect.any(String)
      });
    });

    it('should process call.failed event correctly', async () => {
      const event = {
        type: 'call.failed',
        call_id: 'mock-call-id',
        timestamp: '2025-04-01T14:05:00Z',
        data: {
          error: 'Connection failed'
        }
      };
      
      // Spy on the handler method
      const handlerSpy = vi.spyOn(blandAiService as any, 'handleCallFailed');
      
      const result = await blandAiService.processWebhookEvent(event);
      
      expect(handlerSpy).toHaveBeenCalledWith(event);
      expect(result).toEqual({
        status: 'call_failed',
        callId: 'mock-call-id',
        timestamp: expect.any(String),
        error: 'Connection failed'
      });
    });

    it('should handle unknown event types', async () => {
      const event = {
        type: 'unknown.event',
        call_id: 'mock-call-id',
        timestamp: '2025-04-01T14:00:00Z'
      };
      
      const result = await blandAiService.processWebhookEvent(event);
      
      expect(result).toEqual({
        status: 'unknown_event',
        callId: 'mock-call-id'
      });
    });
  });
});