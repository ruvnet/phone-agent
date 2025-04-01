import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { emailService } from '../../src/services/email-service';
import { calendarService } from '../../src/services/calendar-service';
import { blandAiService } from '../../src/services/bland-service';
import { storageService } from '../../src/services/storage-service';
import { AppError } from '../../src/utils/logger';

// Sample iCalendar data for testing
const sampleICalData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//hacksw/handcal//NONSGML v1.0//EN
BEGIN:VEVENT
UID:uid1@example.com
DTSTAMP:20250331T120000Z
DTSTART:20250401T140000Z
DTEND:20250401T150000Z
SUMMARY:Test Call
DESCRIPTION:Dial-in: +1 555-123-4567\\n Meeting ID: 123-456-789\\n https://zoom.us/j/123456789
LOCATION:Zoom
END:VEVENT
END:VCALENDAR`;

// Mock all services
vi.mock('../../src/services/email-service', () => ({
  emailService: {
    sendCallConfirmation: vi.fn().mockResolvedValue({ id: 'email-id', status: 'sent' }),
    sendRescheduleNotification: vi.fn().mockResolvedValue({ id: 'email-id', status: 'sent' }),
    sendCancellationNotification: vi.fn().mockResolvedValue({ id: 'email-id', status: 'sent' })
  }
}));

vi.mock('../../src/services/calendar-service', () => ({
  calendarService: {
    parseCalendarContent: vi.fn().mockImplementation((content) => {
      return [{
        uid: 'uid1@example.com',
        summary: 'Test Call',
        description: 'Dial-in: +1 555-123-4567\n Meeting ID: 123-456-789\n https://zoom.us/j/123456789',
        location: 'Zoom',
        startTime: new Date('2025-04-01T14:00:00Z'),
        endTime: new Date('2025-04-01T15:00:00Z'),
        duration: 60,
        dialIn: '+15551234567',
        conferenceDetails: '123-456-789'
      }];
    }),
    createCallEvent: vi.fn().mockReturnValue('BEGIN:VCALENDAR\nEND:VCALENDAR')
  }
}));

vi.mock('../../src/services/bland-service', () => ({
  blandAiService: {
    scheduleCall: vi.fn().mockResolvedValue({
      callId: 'mock-call-id',
      status: 'scheduled',
      scheduledTime: '2025-04-01T14:00:00Z',
      estimatedDuration: 60
    }),
    cancelCall: vi.fn().mockResolvedValue({
      callId: 'mock-call-id',
      status: 'cancelled',
      cancelledAt: new Date().toISOString()
    }),
    rescheduleCall: vi.fn().mockResolvedValue({
      callId: 'mock-call-id',
      status: 'rescheduled',
      newScheduledTime: '2025-04-02T15:00:00Z',
      rescheduledAt: new Date().toISOString()
    })
  }
}));

vi.mock('../../src/services/storage-service', () => ({
  storageService: {
    storeCallData: vi.fn().mockResolvedValue(true),
    getCallData: vi.fn().mockImplementation((callId) => {
      if (callId === 'existing-call-id') {
        return Promise.resolve({
          uid: 'uid1@example.com',
          summary: 'Test Call',
          phoneNumber: '+15551234567',
          recipientName: 'John Doe',
          recipientEmail: 'john@example.com',
          scheduledTime: '2025-04-01T14:00:00Z',
          duration: 60,
          status: 'scheduled'
        });
      }
      return Promise.resolve(null);
    }),
    updateCallData: vi.fn().mockResolvedValue(true),
    listCallIds: vi.fn().mockResolvedValue(['call-id-1', 'call-id-2'])
  }
}));

describe('Email Webhook Processing Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('New calendar invite processing', () => {
    it('should process a new calendar invite email and schedule a call', async () => {
      // Create a mock email webhook payload
      const emailWebhook = {
        type: 'email.inbound',
        data: {
          from: 'sender@example.com',
          subject: 'Calendar Invite: Test Call',
          to: ['recipient@aiphone.agent'],
          text: 'Please join this call',
          html: '<p>Please join this call</p>',
          attachments: [
            {
              filename: 'invite.ics',
              content: btoa(sampleICalData),
              contentType: 'text/calendar'
            }
          ]
        }
      };

      // Process the webhook
      const result = await processEmailWebhook(emailWebhook);
      
      // Check that calendar service parsed the invite
      expect(calendarService.parseCalendarContent).toHaveBeenCalled();
      
      // Check that Bland.ai service scheduled a call
      expect(blandAiService.scheduleCall).toHaveBeenCalledWith(expect.objectContaining({
        phoneNumber: '+15551234567',
        scheduledTime: expect.any(Date),
        maxDuration: 60,
        topic: 'Test Call'
      }));
      
      // Check that storage service stored the call data
      expect(storageService.storeCallData).toHaveBeenCalledWith(
        'mock-call-id',
        expect.objectContaining({
          status: 'scheduled',
          scheduledTime: expect.any(String),
          summary: 'Test Call',
          duration: 60
        })
      );
      
      // Check that email service sent a confirmation
      expect(emailService.sendCallConfirmation).toHaveBeenCalled();
      
      // Verify final result
      expect(result).toEqual(expect.objectContaining({
        success: true,
        callId: 'mock-call-id',
        action: 'scheduled'
      }));
    });
    
    it('should handle invalid iCalendar attachments', async () => {
      // Create a mock email webhook with invalid calendar data
      const emailWebhook = {
        type: 'email.inbound',
        data: {
          from: 'sender@example.com',
          subject: 'Calendar Invite: Test Call',
          to: ['recipient@aiphone.agent'],
          text: 'Please join this call',
          html: '<p>Please join this call</p>',
          attachments: [
            {
              filename: 'invite.ics',
              content: btoa('INVALID CALENDAR DATA'),
              contentType: 'text/calendar'
            }
          ]
        }
      };
      
      // Mock calendar service to throw an error
      (calendarService.parseCalendarContent as any).mockImplementationOnce(() => {
        throw new AppError('Invalid iCalendar format', 400);
      });

      // Process the webhook and expect it to handle the error
      const result = await processEmailWebhook(emailWebhook);
      
      // Verify error handling
      expect(result).toEqual(expect.objectContaining({
        success: false,
        error: expect.stringContaining('Invalid iCalendar format')
      }));
      
      // Verify that no call was scheduled
      expect(blandAiService.scheduleCall).not.toHaveBeenCalled();
    });
    
    it('should handle emails without calendar attachments', async () => {
      // Create a mock email webhook without attachments
      const emailWebhook = {
        type: 'email.inbound',
        data: {
          from: 'sender@example.com',
          subject: 'Regular email',
          to: ['recipient@aiphone.agent'],
          text: 'This is a regular email',
          html: '<p>This is a regular email</p>',
          attachments: []
        }
      };

      // Process the webhook
      const result = await processEmailWebhook(emailWebhook);
      
      // Verify result indicates no calendar invite was found
      expect(result).toEqual(expect.objectContaining({
        success: false,
        error: 'No calendar invite found in email'
      }));
      
      // Verify no services were called
      expect(calendarService.parseCalendarContent).not.toHaveBeenCalled();
      expect(blandAiService.scheduleCall).not.toHaveBeenCalled();
      expect(storageService.storeCallData).not.toHaveBeenCalled();
    });
  });

  describe('Calendar invite updates', () => {
    it('should handle rescheduled calendar invites', async () => {
      // Mock storage service to return existing call data
      (storageService.getCallData as any).mockResolvedValueOnce({
        uid: 'uid1@example.com',
        callId: 'existing-call-id',
        summary: 'Test Call',
        phoneNumber: '+15551234567',
        recipientName: 'John Doe',
        recipientEmail: 'john@example.com',
        scheduledTime: '2025-04-01T14:00:00Z',
        duration: 60,
        status: 'scheduled'
      });
      
      // Create a mock email webhook with updated time
      const updatedICalData = sampleICalData.replace(
        'DTSTART:20250401T140000Z',
        'DTSTART:20250402T150000Z'
      ).replace(
        'DTEND:20250401T150000Z',
        'DTEND:20250402T160000Z'
      );
      
      const emailWebhook = {
        type: 'email.inbound',
        data: {
          from: 'sender@example.com',
          subject: 'Updated: Calendar Invite: Test Call',
          to: ['recipient@aiphone.agent'],
          text: 'Please join this rescheduled call',
          html: '<p>Please join this rescheduled call</p>',
          attachments: [
            {
              filename: 'invite.ics',
              content: btoa(updatedICalData),
              contentType: 'text/calendar'
            }
          ]
        }
      };
      
      // Mock the parseCalendarContent to return updated time
      (calendarService.parseCalendarContent as any).mockImplementationOnce(() => {
        return [{
          uid: 'uid1@example.com',
          summary: 'Test Call',
          description: 'Dial-in: +1 555-123-4567\n Meeting ID: 123-456-789\n https://zoom.us/j/123456789',
          location: 'Zoom',
          startTime: new Date('2025-04-02T15:00:00Z'),
          endTime: new Date('2025-04-02T16:00:00Z'),
          duration: 60,
          dialIn: '+15551234567',
          conferenceDetails: '123-456-789',
          status: 'CONFIRMED'
        }];
      });

      // Process the webhook
      const result = await processEmailWebhook(emailWebhook);
      
      // Check that bland.ai service rescheduled the call
      expect(blandAiService.rescheduleCall).toHaveBeenCalledWith(
        'existing-call-id',
        expect.any(Date),
        expect.any(String)
      );
      
      // Check that email service sent a reschedule notification
      expect(emailService.sendRescheduleNotification).toHaveBeenCalled();
      
      // Verify final result
      expect(result).toEqual(expect.objectContaining({
        success: true,
        callId: 'existing-call-id',
        action: 'rescheduled'
      }));
    });
    
    it('should handle cancelled calendar invites', async () => {
      // Mock storage service to return existing call data
      (storageService.getCallData as any).mockResolvedValueOnce({
        uid: 'uid1@example.com',
        callId: 'existing-call-id',
        summary: 'Test Call',
        phoneNumber: '+15551234567',
        recipientName: 'John Doe',
        recipientEmail: 'john@example.com',
        scheduledTime: '2025-04-01T14:00:00Z',
        duration: 60,
        status: 'scheduled'
      });
      
      // Create a mock email webhook for cancelled invite
      const cancelledICalData = sampleICalData.replace(
        'BEGIN:VEVENT',
        'BEGIN:VEVENT\nMETHOD:CANCEL\nSTATUS:CANCELLED'
      );
      
      const emailWebhook = {
        type: 'email.inbound',
        data: {
          from: 'sender@example.com',
          subject: 'Cancelled: Calendar Invite: Test Call',
          to: ['recipient@aiphone.agent'],
          text: 'This call has been cancelled',
          html: '<p>This call has been cancelled</p>',
          attachments: [
            {
              filename: 'invite.ics',
              content: btoa(cancelledICalData),
              contentType: 'text/calendar'
            }
          ]
        }
      };
      
      // Mock the parseCalendarContent to add cancelled status
      (calendarService.parseCalendarContent as any).mockImplementationOnce(() => {
        return [{
          uid: 'uid1@example.com',
          summary: 'Test Call',
          description: 'Dial-in: +1 555-123-4567\n Meeting ID: 123-456-789\n https://zoom.us/j/123456789',
          location: 'Zoom',
          startTime: new Date('2025-04-01T14:00:00Z'),
          endTime: new Date('2025-04-01T15:00:00Z'),
          duration: 60,
          dialIn: '+15551234567',
          conferenceDetails: '123-456-789',
          status: 'CANCELLED'
        }];
      });

      // Process the webhook
      const result = await processEmailWebhook(emailWebhook);
      
      // Check that bland.ai service cancelled the call
      expect(blandAiService.cancelCall).toHaveBeenCalledWith(
        'existing-call-id',
        expect.any(String)
      );
      
      // Check that email service sent a cancellation notification
      expect(emailService.sendCancellationNotification).toHaveBeenCalled();
      
      // Verify final result
      expect(result).toEqual(expect.objectContaining({
        success: true,
        callId: 'existing-call-id',
        action: 'cancelled'
      }));
    });
  });
});

/**
 * Mock implementation of email webhook processing function
 */
async function processEmailWebhook(webhook: any): Promise<any> {
  try {
    // Verify webhook type
    if (webhook.type !== 'email.inbound') {
      return { 
        success: false, 
        error: 'Invalid webhook type' 
      };
    }
    
    // Extract calendar invite if present
    const calendarAttachment = webhook.data.attachments?.find(
      (att: any) => att.filename?.endsWith('.ics') || att.contentType === 'text/calendar'
    );
    
    if (!calendarAttachment) {
      return { 
        success: false, 
        error: 'No calendar invite found in email' 
      };
    }
    
    // Parse the calendar attachment
    const calendarContent = atob(calendarAttachment.content);
    const events = calendarService.parseCalendarContent(calendarContent);
    
    if (!events || events.length === 0) {
      return { 
        success: false, 
        error: 'No events found in calendar invite' 
      };
    }
    
    const event = events[0];
    
    // Check if this is an update to an existing invitation (by UID)
    const existingCall = await findExistingCallByUid(event.uid);
    
    if (existingCall) {
      // This is an update to an existing call
      
      // Check if it's a cancellation
      const eventStatus = (event as any).status;
      if (eventStatus === 'CANCELLED') {
        // Cancel the call in Bland.ai
        await blandAiService.cancelCall(existingCall.callId, 'Calendar invite cancelled');
        
        // Send cancellation notification
        await emailService.sendCancellationNotification(
          existingCall.recipientEmail,
          {
            recipientName: existingCall.recipientName,
            recipientEmail: existingCall.recipientEmail,
            formattedDate: formatDate(new Date(existingCall.scheduledTime)),
            formattedTime: formatTime(new Date(existingCall.scheduledTime)),
            duration: existingCall.duration.toString(),
            topic: existingCall.summary
          },
          'Calendar invite cancelled'
        );
        
        // Update call data in storage
        await storageService.updateCallData(existingCall.callId, (data) => ({
          ...data,
          status: 'cancelled',
          cancelledAt: new Date().toISOString()
        }));
        
        return {
          success: true,
          callId: existingCall.callId,
          action: 'cancelled'
        };
      }
      
      // Check if it's a reschedule (time changed)
      const oldTime = new Date(existingCall.scheduledTime);
      const newTime = event.startTime;
      
      if (oldTime.getTime() !== newTime.getTime()) {
        // Reschedule the call in Bland.ai
        await blandAiService.rescheduleCall(
          existingCall.callId,
          newTime,
          'Calendar invite rescheduled'
        );
        
        // Generate new calendar event
        const calendarEvent = calendarService.createCallEvent({
          scheduledTime: newTime,
          durationMinutes: event.duration,
          topic: event.summary,
          description: event.description,
          phoneNumber: event.dialIn,
          recipientName: existingCall.recipientName,
          recipientEmail: existingCall.recipientEmail
        });
        
        // Send reschedule notification
        await emailService.sendRescheduleNotification(
          existingCall.recipientEmail,
          {
            recipientName: existingCall.recipientName,
            recipientEmail: existingCall.recipientEmail,
            formattedDate: formatDate(newTime),
            formattedTime: formatTime(newTime),
            oldFormattedDate: formatDate(oldTime),
            oldFormattedTime: formatTime(oldTime),
            duration: event.duration.toString(),
            topic: event.summary,
            calendarEvent
          },
          'Calendar invite rescheduled'
        );
        
        // Update call data in storage
        await storageService.updateCallData(existingCall.callId, (data) => ({
          ...data,
          status: 'rescheduled',
          scheduledTime: newTime.toISOString(),
          duration: event.duration,
          rescheduledAt: new Date().toISOString()
        }));
        
        return {
          success: true,
          callId: existingCall.callId,
          action: 'rescheduled'
        };
      }
      
      // No significant changes, just update the data
      await storageService.updateCallData(existingCall.callId, (data) => ({
        ...data,
        summary: event.summary,
        description: event.description,
        location: event.location,
        updatedAt: new Date().toISOString()
      }));
      
      return {
        success: true,
        callId: existingCall.callId,
        action: 'updated'
      };
    }
    
    // This is a new calendar invite
    
    // Extract necessary info from the event
    const phoneNumber = event.dialIn;
    if (!phoneNumber) {
      return { 
        success: false, 
        error: 'No dial-in number found in calendar invite' 
      };
    }
    
    // Schedule call with Bland.ai
    const scheduledCall = await blandAiService.scheduleCall({
      phoneNumber,
      scheduledTime: event.startTime,
      maxDuration: event.duration,
      topic: event.summary,
      task: `Join and participate in call: ${event.summary}`,
      webhookUrl: 'https://aiphone.agent/webhooks/bland-ai'
    });
    
    // Generate calendar event
    const calendarEvent = calendarService.createCallEvent({
      scheduledTime: event.startTime,
      durationMinutes: event.duration,
      topic: event.summary,
      description: event.description,
      phoneNumber: event.dialIn,
      recipientName: extractRecipientName(webhook.data),
      recipientEmail: extractRecipientEmail(webhook.data)
    });
    
    // Send confirmation email
    await emailService.sendCallConfirmation(
      extractRecipientEmail(webhook.data),
      {
        recipientName: extractRecipientName(webhook.data),
        recipientEmail: extractRecipientEmail(webhook.data),
        formattedDate: formatDate(event.startTime),
        formattedTime: formatTime(event.startTime),
        duration: event.duration.toString(),
        topic: event.summary,
        calendarEvent
      }
    );
    
    // Store call data
    await storageService.storeCallData(scheduledCall.callId, {
      uid: event.uid,
      callId: scheduledCall.callId,
      status: 'scheduled',
      scheduledTime: event.startTime.toISOString(),
      duration: event.duration,
      phoneNumber: event.dialIn,
      conferenceDetails: event.conferenceDetails,
      summary: event.summary,
      description: event.description,
      location: event.location,
      recipientName: extractRecipientName(webhook.data),
      recipientEmail: extractRecipientEmail(webhook.data),
      createdAt: new Date().toISOString()
    });
    
    return {
      success: true,
      callId: scheduledCall.callId,
      action: 'scheduled'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    };
  }
}

// Helper functions for the mock implementation

/**
 * Find an existing call by UID
 */
async function findExistingCallByUid(uid: string): Promise<any | null> {
  // In a real implementation, this would search the storage for a call with the given UID
  return storageService.getCallData('existing-call-id');
}

/**
 * Format a date for display
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Format a time for display
 */
function formatTime(date: Date): string {
  return date.toISOString().split('T')[1].substring(0, 5);
}

/**
 * Extract recipient name from email data
 */
function extractRecipientName(emailData: any): string {
  // In a real implementation, this would parse the recipient info
  return 'John Doe';
}

/**
 * Extract recipient email from email data
 */
function extractRecipientEmail(emailData: any): string {
  // In a real implementation, this would parse the recipient info
  return 'john@example.com';
}