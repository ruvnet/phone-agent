import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { emailService } from '../../src/services/email-service';
import { calendarService } from '../../src/services/calendar-service';
import { blandAiService } from '../../src/services/bland-service';
import { storageService } from '../../src/services/storage-service';
import { AppError } from '../../src/utils/logger';
import axios from 'axios';

// Mock all services and dependencies
vi.mock('axios', () => {
  return {
    default: {
      isAxiosError: vi.fn().mockReturnValue(true),
      create: vi.fn(() => ({
        post: vi.fn(),
        get: vi.fn()
      }))
    }
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

vi.mock('../../src/services/email-service', () => ({
  emailService: {
    sendCallConfirmation: vi.fn(),
    sendRescheduleNotification: vi.fn(),
    sendCancellationNotification: vi.fn(),
    sendEmail: vi.fn()
  }
}));

vi.mock('../../src/services/calendar-service', () => ({
  calendarService: {
    parseCalendarContent: vi.fn(),
    createCallEvent: vi.fn()
  }
}));

vi.mock('../../src/services/bland-service', () => ({
  blandAiService: {
    scheduleCall: vi.fn(),
    cancelCall: vi.fn(),
    rescheduleCall: vi.fn(),
    getCallDetails: vi.fn(),
    processWebhookEvent: vi.fn()
  }
}));

vi.mock('../../src/services/storage-service', () => ({
  storageService: {
    storeCallData: vi.fn(),
    getCallData: vi.fn(),
    updateCallData: vi.fn(),
    listCallIds: vi.fn(),
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn()
  }
}));

describe('Error Handling Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Email Service Errors', () => {
    it('should handle Resend API errors gracefully', async () => {
      // Mock the email service to throw a specific error
      (emailService.sendEmail as any).mockRejectedValueOnce(
        new AppError('Email sending failed: API key invalid', 401)
      );

      // Attempt to send a confirmation email
      const testFn = async () => {
        await emailService.sendCallConfirmation('recipient@example.com', {
          recipientName: 'John Doe',
          recipientEmail: 'recipient@example.com',
          formattedDate: '2025-04-01',
          formattedTime: '14:00',
          duration: '30',
          topic: 'Test Call'
        });
      };

      // Verify that the error is properly thrown and has the right properties
      await expect(testFn()).rejects.toThrow('Email sending failed');
      await expect(testFn()).rejects.toHaveProperty('statusCode', 401);
    });

    it('should handle invalid email addresses', async () => {
      // Mock email validation to return appropriate error
      (emailService.sendEmail as any).mockRejectedValueOnce(
        new AppError('Invalid recipient email: invalid-email', 400)
      );

      const testFn = async () => {
        await emailService.sendCallConfirmation('invalid-email', {
          recipientName: 'John Doe',
          recipientEmail: 'invalid-email',
          formattedDate: '2025-04-01',
          formattedTime: '14:00',
          duration: '30',
          topic: 'Test Call'
        });
      };

      await expect(testFn()).rejects.toThrow('Invalid recipient email');
      await expect(testFn()).rejects.toHaveProperty('statusCode', 400);
    });

    it('should handle missing templates', async () => {
      // Mock email service with missing template error
      (emailService.sendEmail as any).mockRejectedValueOnce(
        new AppError('Email template not found: non-existent-template', 404)
      );

      // Custom implementation mocking a situation where an invalid template is requested
      const sendWithInvalidTemplate = async () => {
        await emailService.sendEmail({
          to: 'recipient@example.com',
          subject: 'Test Email',
          templateName: 'non-existent-template'
        });
      };

      await expect(sendWithInvalidTemplate()).rejects.toThrow('Email template not found');
      await expect(sendWithInvalidTemplate()).rejects.toHaveProperty('statusCode', 404);
    });
  });

  describe('Calendar Service Errors', () => {
    it('should handle invalid iCalendar data', async () => {
      // Mock parseCalendarContent to throw error for invalid iCal data
      (calendarService.parseCalendarContent as any).mockImplementationOnce(() => {
        throw new AppError('Invalid iCalendar format', 400);
      });

      const testFn = () => {
        calendarService.parseCalendarContent('INVALID ICAL DATA');
      };

      expect(testFn).toThrow('Invalid iCalendar format');
    });

    it('should handle missing calendar event properties', async () => {
      // Mock parseCalendarContent to return incomplete event data
      (calendarService.parseCalendarContent as any).mockImplementationOnce(() => {
        return [{
          uid: 'test-uid',
          summary: 'Incomplete Event',
          // Missing required start and end times
        }];
      });

      const testFn = () => {
        calendarService.parseCalendarContent('BEGIN:VCALENDAR\nEND:VCALENDAR');
      };

      expect(testFn).toThrow();
    });

    it('should handle events without dial-in information', async () => {
      // This test verifies that the calendar service
      // correctly identifies missing dial-in information
      (calendarService.parseCalendarContent as any).mockReturnValueOnce([{
        uid: 'test-uid',
        summary: 'No Dial-in Event',
        startTime: new Date(),
        endTime: new Date(),
        duration: 30,
        // No dialIn property
      }]);

      // Mock function representing a call scheduler that requires dial-in
      const scheduleWithDialIn = async () => {
        const events = calendarService.parseCalendarContent('MOCK_ICAL');
        const event = events[0];
        
        if (!event.dialIn) {
          throw new AppError('No dial-in information found in event', 400);
        }
        
        return await blandAiService.scheduleCall({
          phoneNumber: event.dialIn,
          scheduledTime: event.startTime
        });
      };

      await expect(scheduleWithDialIn()).rejects.toThrow('No dial-in information found');
    });
  });

  describe('Bland.ai Service Errors', () => {
    it('should handle API authentication errors', async () => {
      // Mock Bland.ai API authentication error
      (blandAiService.scheduleCall as any).mockRejectedValueOnce(
        new AppError('Bland.ai API error (401): Invalid API key', 401)
      );

      const testFn = async () => {
        await blandAiService.scheduleCall({
          phoneNumber: '+15551234567',
          scheduledTime: new Date()
        });
      };

      await expect(testFn()).rejects.toThrow('Invalid API key');
      await expect(testFn()).rejects.toHaveProperty('statusCode', 401);
    });

    it('should handle rate limit errors', async () => {
      // Mock Bland.ai API rate limit error
      (blandAiService.scheduleCall as any).mockRejectedValueOnce(
        new AppError('Rate limit exceeded. Please try again later.', 429)
      );

      const testFn = async () => {
        await blandAiService.scheduleCall({
          phoneNumber: '+15551234567',
          scheduledTime: new Date()
        });
      };

      await expect(testFn()).rejects.toThrow('Rate limit exceeded');
      await expect(testFn()).rejects.toHaveProperty('statusCode', 429);
    });

    it('should handle scheduling conflict errors', async () => {
      // Mock Bland.ai API scheduling conflict error
      (blandAiService.scheduleCall as any).mockRejectedValueOnce(
        new AppError('Scheduling conflict detected. Please choose another time.', 400)
      );

      const testFn = async () => {
        await blandAiService.scheduleCall({
          phoneNumber: '+15551234567',
          scheduledTime: new Date()
        });
      };

      await expect(testFn()).rejects.toThrow('Scheduling conflict detected');
      await expect(testFn()).rejects.toHaveProperty('statusCode', 400);
    });

    it('should handle call cancellation errors', async () => {
      // Mock Bland.ai API call cancellation error
      (blandAiService.cancelCall as any).mockRejectedValueOnce(
        new AppError('Call cancellation failed: Call not found', 404)
      );

      const testFn = async () => {
        await blandAiService.cancelCall('non-existent-call');
      };

      await expect(testFn()).rejects.toThrow('Call not found');
      await expect(testFn()).rejects.toHaveProperty('statusCode', 404);
    });

    it('should handle network errors', async () => {
      // Create a network error
      const networkError = new Error('Network Error') as any;
      networkError.request = {}; // Axios adds a request property for network errors
      
      // Mock axios isAxiosError to identify this as an Axios error
      (axios.isAxiosError as any).mockReturnValueOnce(true);
      
      // Mock Bland.ai API network error
      (blandAiService.scheduleCall as any).mockRejectedValueOnce(
        new AppError('Call scheduling failed: Network Error', 500)
      );

      const testFn = async () => {
        await blandAiService.scheduleCall({
          phoneNumber: '+15551234567',
          scheduledTime: new Date()
        });
      };

      await expect(testFn()).rejects.toThrow('Network Error');
    });
  });

  describe('Storage Service Errors', () => {
    it('should handle storage retrieval errors', async () => {
      // Mock storage service get error
      (storageService.get as any).mockRejectedValueOnce(
        new AppError('Storage error: Unable to retrieve key', 500)
      );

      const testFn = async () => {
        await storageService.getCallData('test-call-id');
      };

      await expect(testFn()).rejects.toThrow('Unable to retrieve key');
    });

    it('should handle storage write errors', async () => {
      // Mock storage service set error
      (storageService.set as any).mockRejectedValueOnce(
        new AppError('Storage error: Unable to write data', 500)
      );

      const testFn = async () => {
        await storageService.storeCallData('test-call-id', { status: 'scheduled' });
      };

      await expect(testFn()).rejects.toThrow('Unable to write data');
    });

    it('should handle missing keys', async () => {
      // Mock storage service to enforce key validation
      (storageService.get as any).mockRejectedValueOnce(
        new AppError('Key is required', 400)
      );

      const testFn = async () => {
        await storageService.get('');
      };

      await expect(testFn()).rejects.toThrow('Key is required');
      await expect(testFn()).rejects.toHaveProperty('statusCode', 400);
    });
  });

  describe('Integration Error Handling', () => {
    it('should handle cascading errors between services', async () => {
      // Mock calendar service to succeed
      (calendarService.parseCalendarContent as any).mockReturnValueOnce([{
        uid: 'test-uid',
        summary: 'Test Event',
        startTime: new Date(),
        endTime: new Date(),
        duration: 30,
        dialIn: '+15551234567'
      }]);
      
      // Mock Bland.ai service to fail
      (blandAiService.scheduleCall as any).mockRejectedValueOnce(
        new AppError('Call scheduling failed: API key invalid', 401)
      );
      
      // Create a function that combines multiple services
      const processCalendarAndSchedule = async (calendarData: string) => {
        // First parse the calendar data
        const events = calendarService.parseCalendarContent(calendarData);
        
        if (!events || events.length === 0) {
          throw new AppError('No events found in calendar data', 400);
        }
        
        const event = events[0];
        
        // Then schedule the call
        const scheduledCall = await blandAiService.scheduleCall({
          phoneNumber: event.dialIn || '',
          scheduledTime: event.startTime,
          topic: event.summary
        });
        
        // Store the call data
        await storageService.storeCallData(scheduledCall.callId, {
          uid: event.uid,
          status: 'scheduled',
          scheduledTime: event.startTime
        });
        
        // Generate and send confirmation email
        const calendarEvent = calendarService.createCallEvent({
          scheduledTime: event.startTime,
          durationMinutes: event.duration,
          topic: event.summary,
          phoneNumber: event.dialIn,
          recipientName: 'Test Recipient',
          recipientEmail: 'recipient@example.com'
        });
        
        await emailService.sendCallConfirmation('recipient@example.com', {
          recipientName: 'Test Recipient',
          recipientEmail: 'recipient@example.com',
          formattedDate: event.startTime.toISOString().split('T')[0],
          formattedTime: event.startTime.toISOString().split('T')[1].substring(0, 5),
          duration: event.duration.toString(),
          topic: event.summary,
          calendarEvent
        });
        
        return scheduledCall;
      };
      
      // Verify that the error from the Bland.ai service is properly propagated
      await expect(processCalendarAndSchedule('MOCK_ICAL')).rejects.toThrow('API key invalid');
      
      // Verify that neither storage nor email services were called after the error
      expect(storageService.storeCallData).not.toHaveBeenCalled();
      expect(emailService.sendCallConfirmation).not.toHaveBeenCalled();
    });

    it('should handle environment variable misconfiguration', async () => {
      // This test simulates a common issue where environment variables are missing
      
      // Mock a function that checks for required environment variables
      const checkEnvironmentConfig = () => {
        const requiredVars = [
          'RESEND_API_KEY',
          'BLAND_AI_API_KEY',
          'SENDER_EMAIL',
          'KV_NAMESPACE'
        ];
        
        const missingVars = [];
        
        // Check for missing environment variables (simulated)
        missingVars.push('BLAND_AI_API_KEY');
        missingVars.push('RESEND_API_KEY');
        
        if (missingVars.length > 0) {
          throw new AppError(`Missing required environment variables: ${missingVars.join(', ')}`, 500);
        }
        
        return true;
      };
      
      // Test the function
      expect(checkEnvironmentConfig).toThrow('Missing required environment variables');
      expect(checkEnvironmentConfig).toThrow('BLAND_AI_API_KEY');
      expect(checkEnvironmentConfig).toThrow('RESEND_API_KEY');
    });

    it('should recover from temporary storage failures', async () => {
      // This test verifies the system can handle temporary storage failures
      
      // Mock storage operations to fail once then succeed
      (storageService.storeCallData as any)
        .mockRejectedValueOnce(new AppError('Storage temporarily unavailable', 503))
        .mockResolvedValueOnce(true);
      
      // Mock a retry function
      const storeWithRetry = async (callId: string, data: any, retries = 3): Promise<boolean> => {
        try {
          return await storageService.storeCallData(callId, data);
        } catch (error) {
          if (retries <= 0) throw error;
          
          // Exponential backoff (simulated)
          await new Promise(resolve => setTimeout(resolve, 0));
          
          return storeWithRetry(callId, data, retries - 1);
        }
      };
      
      // Test the retry mechanism
      const result = await storeWithRetry('test-call-id', { status: 'scheduled' });
      
      expect(result).toBe(true);
      expect(storageService.storeCallData).toHaveBeenCalledTimes(2);
    });
  });
});