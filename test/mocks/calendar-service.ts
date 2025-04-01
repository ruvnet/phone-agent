// Mock implementation of calendar service for testing
export class CalendarService {
  parseCalendarContent(content: string) {
    return [
      {
        uid: 'uid1@example.com',
        summary: 'Test Meeting',
        description: 'Dial-in: +1 555-123-4567\n Meeting ID: 123-456-789\n https://zoom.us/j/123456789',
        location: 'Zoom',
        startTime: new Date('2025-04-01T14:00:00Z'),
        endTime: new Date('2025-04-01T15:00:00Z'),
        duration: 60,
        dialIn: '+15551234567',
        conferenceDetails: '123-456-789'
      }
    ];
  }

  extractDialInInfo(text: string | undefined) {
    if (!text) return undefined;
    if (text.includes('+15551234567')) return '+15551234567';
    return undefined;
  }

  extractConferenceDetails(text: string | undefined) {
    if (!text) return undefined;
    if (text.includes('123-456-789')) return '123-456-789';
    return undefined;
  }

  generateCalendarEvent(eventDetails: any) {
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${eventDetails.uid || 'test-uid'}
SUMMARY:${eventDetails.summary || 'Test Event'}
DTSTART:20250401T140000Z
DTEND:20250401T150000Z
DESCRIPTION:${eventDetails.description || 'Test Description'}
LOCATION:${eventDetails.location || 'Test Location'}
END:VEVENT
END:VCALENDAR`;
  }

  createCallEvent(callDetails: any) {
    return this.generateCalendarEvent({
      uid: `call-${callDetails.callId}`,
      summary: callDetails.topic || 'Scheduled Call',
      description: `Phone: ${callDetails.phoneNumber}\nDetails: ${callDetails.conferenceDetails || ''}`,
      location: 'Phone Call'
    });
  }
}

export const calendarService = new CalendarService();