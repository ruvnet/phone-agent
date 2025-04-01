import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CalendarService } from '../../src/services/calendar-service';
import { AppError } from '../../src/utils/logger';
import ICAL from 'ical.js';

// Mock dependencies
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
      getCalendarConfig: vi.fn().mockReturnValue({
        timezone: 'America/New_York',
      }),
      getEmailConfig: vi.fn().mockReturnValue({
        senderEmail: 'test-system@example.com',
      }),
    }
  };
});

describe('CalendarService', () => {
  let calendarService: CalendarService;

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

  beforeEach(() => {
    calendarService = new CalendarService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default timezone', () => {
      const service = new CalendarService();
      expect(service).toBeInstanceOf(CalendarService);
      expect((service as any).defaultTimezone).toBe('America/New_York');
    });

    it('should initialize with custom timezone', () => {
      const service = new CalendarService({ timezone: 'Europe/London' });
      expect((service as any).defaultTimezone).toBe('Europe/London');
    });
  });

  describe('parseCalendarContent', () => {
    it('should parse valid iCalendar content', () => {
      const events = calendarService.parseCalendarContent(sampleICalData);
      
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        uid: 'uid1@example.com',
        summary: 'Test Call',
        startTime: expect.any(Date),
        endTime: expect.any(Date),
        duration: 60, // 1 hour
        location: 'Zoom',
      });
    });

    it('should extract dial-in and conference details', () => {
      const events = calendarService.parseCalendarContent(sampleICalData);
      
      expect(events[0].dialIn).toBe('+15551234567');
      expect(events[0].conferenceDetails).toBe('123-456-789');
    });

    it('should handle missing end time with default duration', () => {
      const calendarData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//hacksw/handcal//NONSGML v1.0//EN
BEGIN:VEVENT
UID:uid1@example.com
DTSTAMP:20250331T120000Z
DTSTART:20250401T140000Z
SUMMARY:Test Call
END:VEVENT
END:VCALENDAR`;

      const events = calendarService.parseCalendarContent(calendarData);
      
      expect(events).toHaveLength(1);
      expect(events[0].duration).toBe(30); // Default 30 minutes
    });

    it('should throw an error for invalid iCalendar content', () => {
      const invalidData = 'NOT A VALID ICAL FORMAT';
      
      expect(() => calendarService.parseCalendarContent(invalidData)).toThrow();
    });
  });

  describe('extractDialInInfo', () => {
    it('should extract phone numbers with different formats', () => {
      expect(calendarService.extractDialInInfo('Dial-in: +1 555-123-4567')).toBe('+15551234567');
      expect(calendarService.extractDialInInfo('Phone: (555) 123-4567')).toBe('5551234567');
      expect(calendarService.extractDialInInfo('Join by phone: 555.123.4567')).toBe('5551234567');
    });

    it('should return undefined if no phone number is found', () => {
      expect(calendarService.extractDialInInfo('No phone number here')).toBeUndefined();
      expect(calendarService.extractDialInInfo(undefined)).toBeUndefined();
    });
  });

  describe('extractConferenceDetails', () => {
    it('should extract meeting IDs and passcodes', () => {
      expect(calendarService.extractConferenceDetails('Meeting ID: 123-456-789')).toBe('123-456-789');
      expect(calendarService.extractConferenceDetails('Access code: 12345')).toBe('12345');
      expect(calendarService.extractConferenceDetails('Join Zoom: https://zoom.us/j/123456789')).toBe('https://zoom.us/j/123456789');
    });

    it('should return undefined if no conference details are found', () => {
      expect(calendarService.extractConferenceDetails('No conference details here')).toBeUndefined();
      expect(calendarService.extractConferenceDetails(undefined)).toBeUndefined();
    });
  });

  describe('generateCalendarEvent', () => {
    it('should generate a valid iCalendar event', () => {
      const start = new Date('2025-04-01T14:00:00Z');
      const end = new Date('2025-04-01T15:00:00Z');
      
      const eventDetails = {
        summary: 'Test Event',
        description: 'Test Description',
        location: 'Test Location',
        start,
        end,
        organizer: {
          name: 'Test Organizer',
          email: 'organizer@example.com'
        },
        attendees: [
          {
            name: 'Test Attendee',
            email: 'attendee@example.com',
            role: 'REQ-PARTICIPANT',
            status: 'NEEDS-ACTION'
          }
        ]
      };
      
      const iCalString = calendarService.generateCalendarEvent(eventDetails);
      
      // Verify it's a valid iCalendar format
      expect(iCalString).toContain('BEGIN:VCALENDAR');
      expect(iCalString).toContain('BEGIN:VEVENT');
      expect(iCalString).toContain('SUMMARY:Test Event');
      expect(iCalString).toContain('DESCRIPTION:Test Description');
      expect(iCalString).toContain('LOCATION:Test Location');
      expect(iCalString).toContain('ORGANIZER;CN=Test Organizer:mailto:organizer@example.com');
      expect(iCalString).toContain('ATTENDEE;CN=Test Attendee;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:attendee@example.com');
      expect(iCalString).toContain('END:VEVENT');
      expect(iCalString).toContain('END:VCALENDAR');
      
      // Parse it back to ensure it's valid
      const jcalData = ICAL.parse(iCalString);
      const comp = new ICAL.Component(jcalData);
      const events = comp.getAllSubcomponents('vevent');
      
      expect(events).toHaveLength(1);
    });

    it('should generate a valid event with minimal details', () => {
      const start = new Date('2025-04-01T14:00:00Z');
      const end = new Date('2025-04-01T15:00:00Z');
      
      const eventDetails = {
        summary: 'Test Event',
        start,
        end
      };
      
      const iCalString = calendarService.generateCalendarEvent(eventDetails);
      
      // Verify it's a valid iCalendar format
      expect(iCalString).toContain('BEGIN:VCALENDAR');
      expect(iCalString).toContain('BEGIN:VEVENT');
      expect(iCalString).toContain('SUMMARY:Test Event');
      expect(iCalString).toContain('END:VEVENT');
      expect(iCalString).toContain('END:VCALENDAR');
      
      // Parse it back to ensure it's valid
      const jcalData = ICAL.parse(iCalString);
      const comp = new ICAL.Component(jcalData);
      const events = comp.getAllSubcomponents('vevent');
      
      expect(events).toHaveLength(1);
    });

    it('should use provided uid if available', () => {
      const start = new Date('2025-04-01T14:00:00Z');
      const end = new Date('2025-04-01T15:00:00Z');
      
      const eventDetails = {
        uid: 'test-uid-123',
        summary: 'Test Event',
        start,
        end
      };
      
      const iCalString = calendarService.generateCalendarEvent(eventDetails);
      
      expect(iCalString).toContain('UID:test-uid-123');
    });

    it('should generate a uid if not provided', () => {
      const start = new Date('2025-04-01T14:00:00Z');
      const end = new Date('2025-04-01T15:00:00Z');
      
      const eventDetails = {
        summary: 'Test Event',
        start,
        end
      };
      
      const iCalString = calendarService.generateCalendarEvent(eventDetails);
      
      // The UID should contain the mock UUID value
      expect(iCalString).toContain('UID:');
      expect(iCalString).toContain('mock-uuid-value');
    });
  });

  describe('createCallEvent', () => {
    it('should create a calendar event for a scheduled call', () => {
      const scheduledTime = new Date('2025-04-01T14:00:00Z');
      
      const callDetails = {
        scheduledTime,
        durationMinutes: 30,
        topic: 'Test Call',
        description: 'Test Call Description',
        phoneNumber: '+1 555-123-4567',
        recipientName: 'Test Recipient',
        recipientEmail: 'recipient@example.com',
        agentName: 'Test Agent',
        agentEmail: 'agent@example.com'
      };
      
      const iCalString = calendarService.createCallEvent(callDetails);
      
      // Verify it's a valid iCalendar format with expected content
      expect(iCalString).toContain('BEGIN:VCALENDAR');
      expect(iCalString).toContain('BEGIN:VEVENT');
      expect(iCalString).toContain('SUMMARY:Test Call');
      expect(iCalString).toContain('DESCRIPTION:Test Call Description');
      expect(iCalString).toContain('LOCATION:Phone: +1 555-123-4567');
      expect(iCalString).toContain('ORGANIZER;CN=Test Agent:mailto:agent@example.com');
      expect(iCalString).toContain('ATTENDEE;CN=Test Recipient;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:recipient@example.com');
      expect(iCalString).toContain('END:VEVENT');
      expect(iCalString).toContain('END:VCALENDAR');
    });

    it('should handle string dates for scheduled time', () => {
      const callDetails = {
        scheduledTime: '2025-04-01T14:00:00Z',
        durationMinutes: 30,
        topic: 'Test Call',
        recipientName: 'Test Recipient',
        recipientEmail: 'recipient@example.com'
      };
      
      const iCalString = calendarService.createCallEvent(callDetails);
      
      // Parse it back to ensure it's valid
      const jcalData = ICAL.parse(iCalString);
      const comp = new ICAL.Component(jcalData);
      const events = comp.getAllSubcomponents('vevent');
      
      expect(events).toHaveLength(1);
      
      // The event should have the correct start time
      const eventObj = new ICAL.Event(events[0]);
      expect(eventObj.startDate.toJSDate().toISOString()).toContain('2025-04-01T14:00:00');
    });

    it('should use default values when optional fields are not provided', () => {
      const scheduledTime = new Date('2025-04-01T14:00:00Z');
      
      const callDetails = {
        scheduledTime,
        durationMinutes: 30,
        recipientName: 'Test Recipient',
        recipientEmail: 'recipient@example.com'
      };
      
      const iCalString = calendarService.createCallEvent(callDetails);
      
      // Default summary should be used
      expect(iCalString).toContain('SUMMARY:Scheduled Call');
      
      // Default location should be used
      expect(iCalString).toContain('LOCATION:Phone Call');
      
      // Default organizer should be used
      expect(iCalString).toContain('ORGANIZER;CN=AI Phone Agent:mailto:test-system@example.com');
    });
  });
});