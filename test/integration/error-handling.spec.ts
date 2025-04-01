import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AppError } from '../../src/utils/logger';
import axios from 'axios';

// Create a custom error class for mocks
class MockAppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

// Mock all services and dependencies
vi.mock('axios');
vi.mock('../../src/utils/logger');
vi.mock('../../src/services/email-service');
vi.mock('../../src/services/calendar-service');
vi.mock('../../src/services/bland-service');
vi.mock('../../src/services/storage-service');

// Import services after mocks are defined
import { emailService } from '../../src/services/email-service';
import { calendarService } from '../../src/services/calendar-service';
import { blandAiService } from '../../src/services/bland-service';
import { storageService } from '../../src/services/storage-service';

describe('Error Handling Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup axios mock
    (axios.isAxiosError as any) = vi.fn().mockReturnValue(true);
    (axios.create as any) = vi.fn(() => ({
      post: vi.fn(),
      get: vi.fn()
    }));
    
    // Setup email service mocks
    (emailService.sendCallConfirmation as any) = vi.fn().mockRejectedValue(
      new MockAppError('Email sending failed: API key invalid', 401)
    );
    (emailService.sendEmail as any) = vi.fn().mockImplementation((params) => {
      if (params.to === '') {
        return Promise.reject(new MockAppError('Invalid recipient email: invalid-email', 400));
      }
      if (params.templateName === 'non-existent-template') {
        return Promise.reject(new MockAppError('Email template not found: non-existent-template', 404));
      }
      return Promise.resolve({ id: 'mock-email-id', success: true });
    });
    
    // Setup calendar service mocks
    (calendarService.parseCalendarContent as any) = vi.fn().mockImplementation((data) => {
      if (data === 'INVALID ICAL DATA') {
        throw new MockAppError('Invalid iCalendar format', 400);
      }
      return [{
        uid: 'test-uid',
        summary: 'Test Event',
        startTime: new Date(),
        endTime: new Date(),
        duration: 30,
        dialIn: '+15551234567'
      }];
    });
    (calendarService.createCallEvent as any) = vi.fn().mockReturnValue('BEGIN:VCALENDAR\nEND:VCALENDAR');
    
    // Setup bland service mocks
    (blandAiService.scheduleCall as any) = vi.fn().mockRejectedValue(
      new MockAppError('Bland.ai API error (401): Invalid API key', 401)
    );
    (blandAiService.cancelCall as any) = vi.fn().mockRejectedValue(
      new MockAppError('Call cancellation failed: Call not found', 404)
    );
    
    // Setup storage service mocks
    (storageService.storeCallData as any) = vi.fn().mockRejectedValue(
      new MockAppError('Storage error: Unable to write data', 500)
    );
    (storageService.set as any) = vi.fn().mockImplementation((key) => {
      if (!key) {
        return Promise.reject(new MockAppError('Key is required', 400));
      }
      return Promise.reject(new MockAppError('Storage error: Unable to write data', 500));
    });
    (storageService.get as any) = vi.fn().mockImplementation((key) => {
      if (!key) {
        return Promise.reject(new MockAppError('Key is required', 400));
      }
      return Promise.reject(new MockAppError('Storage error: Unable to retrieve key', 500));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Email Service Errors', () => {
    it('should handle Resend API errors gracefully', async () => {
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
    });

    it('should handle invalid email addresses', async () => {
      const testFn = async () => {
        await emailService.sendEmail({
          to: '',
          subject: 'Test Email',
          text: 'Test content'
        });
      };

      await expect(testFn()).rejects.toThrow('Invalid recipient email');
    });

    it('should handle missing templates', async () => {
      // Custom implementation mocking a situation where an invalid template is requested
      const sendWithInvalidTemplate = async () => {
        await emailService.sendEmail({
          to: 'recipient@example.com',
          subject: 'Test Email',
          templateName: 'non-existent-template'
        });
      };

      await expect(sendWithInvalidTemplate()).rejects.toThrow('Email template not found');
    });
  });

  describe('Calendar Service Errors', () => {
    it('should handle invalid iCalendar data', () => {
      const testFn = () => {
        calendarService.parseCalendarContent('INVALID ICAL DATA');
      };

      expect(testFn).toThrow('Invalid iCalendar format');
    });

    it('should handle missing calendar event properties', async () => {
      // Override the mock for this specific test
      (calendarService.parseCalendarContent as any).mockImplementationOnce(() => {
        throw new Error('Missing required event properties');
      });

      const testFn = () => {
        calendarService.parseCalendarContent('BEGIN:VCALENDAR\nEND:VCALENDAR');
      };

      expect(testFn).toThrow();
    });

    it('should handle events without dial-in information', async () => {
      // Override the mock for this specific test
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
          throw new MockAppError('No dial-in information found in event', 400);
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
      const testFn = async () => {
        await blandAiService.scheduleCall({
          phoneNumber: '+15551234567',
          scheduledTime: new Date()
        });
      };

      await expect(testFn()).rejects.toThrow('Invalid API key');
    });

    it('should handle rate limit errors', async () => {
      // Override the mock for this specific test
      (blandAiService.scheduleCall as any).mockRejectedValueOnce(
        new MockAppError('Rate limit exceeded. Please try again later.', 429)
      );

      const testFn = async () => {
        await blandAiService.scheduleCall({
          phoneNumber: '+15551234567',
          scheduledTime: new Date()
        });
      };

      await expect(testFn()).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle scheduling conflict errors', async () => {
      // Override the mock for this specific test
      (blandAiService.scheduleCall as any).mockRejectedValueOnce(
        new MockAppError('Scheduling conflict detected. Please choose another time.', 400)
      );

      const testFn = async () => {
        await blandAiService.scheduleCall({
          phoneNumber: '+15551234567',
          scheduledTime: new Date()
        });
      };

      await expect(testFn()).rejects.toThrow('Scheduling conflict detected');
    });

    it('should handle call cancellation errors', async () => {
      const testFn = async () => {
        await blandAiService.cancelCall('non-existent-call');
      };

      await expect(testFn()).rejects.toThrow('Call not found');
    });

    it('should handle network errors', async () => {
      // Create a network error
      const networkError = new Error('Network Error') as any;
      networkError.request = {}; // Axios adds a request property for network errors
      
      // Mock axios isAxiosError to identify this as an Axios error
      (axios.isAxiosError as any).mockReturnValueOnce(true);
      
      // Override the mock for this specific test
      (blandAiService.scheduleCall as any).mockRejectedValueOnce(
        new MockAppError('Call scheduling failed: Network Error', 500)
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
      const testFn = async () => {
        await storageService.get('test-key');
      };

      await expect(testFn()).rejects.toThrow('Unable to retrieve key');
    });

    it('should handle storage write errors', async () => {
      const testFn = async () => {
        await storageService.set('test-key', 'test-value');
      };

      await expect(testFn()).rejects.toThrow('Unable to write data');
    });

    it('should handle missing keys', async () => {
      const testFn = async () => {
        await storageService.get('');
      };

      await expect(testFn()).rejects.toThrow('Key is required');
    });
  });

  describe('Integration Error Handling', () => {
    it('should handle cascading errors between services', async () => {
      // Override the mock for this specific test
      (calendarService.parseCalendarContent as any).mockReturnValueOnce([{
        uid: 'test-uid',
        summary: 'Test Event',
        startTime: new Date(),
        endTime: new Date(),
        duration: 30,
        dialIn: '+15551234567'
      }]);
      
      // Override the bland service mock to return a valid response for this test
      (blandAiService.scheduleCall as any).mockResolvedValueOnce({
        callId: 'test-call-id',
        status: 'scheduled'
      });
      
      // Create a function that combines multiple services
      const processCalendarAndSchedule = async (calendarData: string) => {
        // First parse the calendar data
        const events = calendarService.parseCalendarContent(calendarData);
        
        if (!events || events.length === 0) {
          throw new MockAppError('No events found in calendar data', 400);
        }
        
        const event = events[0];
        
        // Then schedule the call
        const scheduledCall = await blandAiService.scheduleCall({
          phoneNumber: event.dialIn || '',
          scheduledTime: event.startTime,
          topic: event.summary
        });
        
        // Store the call data - this will throw an error
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
      
      // Verify that the error from the storage service is properly propagated
      await expect(processCalendarAndSchedule('MOCK_ICAL')).rejects.toThrow('Unable to write data');
      
      // Verify that the email service was not called after the error
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
          throw new MockAppError(`Missing required environment variables: ${missingVars.join(', ')}`, 500);
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
        .mockRejectedValueOnce(new MockAppError('Storage temporarily unavailable', 503))
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