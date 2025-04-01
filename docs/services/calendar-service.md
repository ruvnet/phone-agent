# Calendar Service

The Calendar Service is a core component of the Phone Agent system that handles calendar-related functionality, including generating iCalendar events and parsing calendar data.

## Overview

The Calendar Service provides functionality to:

- Generate iCalendar (.ics) files for scheduled calls
- Parse iCalendar content into structured event objects
- Extract dial-in information from calendar descriptions
- Extract conference details from calendar descriptions
- Create calendar events for scheduled calls

## Configuration

### Environment Variables

The Calendar Service uses the following environment variables:

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DEFAULT_TIMEZONE` | Default timezone for calendar events | No | `UTC` |

### Service Configuration

The Calendar Service can be configured programmatically:

```typescript
import { CalendarService } from '../services/calendar-service';

const calendarService = new CalendarService({
  timezone: 'America/New_York'
});
```

## API Reference

### Parse Calendar Content

Parse iCalendar content into structured event objects.

```typescript
parseCalendarContent(calendarContent: string): ParsedCalendarEvent[]
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `calendarContent` | string | Yes | iCalendar content to parse |

#### Returns

An array of `ParsedCalendarEvent` objects:

```typescript
interface ParsedCalendarEvent {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  dialIn?: string;
  conferenceDetails?: string;
}
```

#### Example

```typescript
const events = calendarService.parseCalendarContent(iCalendarString);
```

### Extract Dial-In Information

Extract phone number information from text.

```typescript
extractDialInInfo(text?: string): string | undefined
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `text` | string | No | Text to extract from |

#### Returns

Extracted phone number or `undefined` if none found.

#### Example

```typescript
const phoneNumber = calendarService.extractDialInInfo(
  "Join by phone: +1 (555) 123-4567"
);
// Returns: "5551234567"
```

### Extract Conference Details

Extract conference details (meeting IDs, access codes, URLs) from text.

```typescript
extractConferenceDetails(text?: string): string | undefined
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `text` | string | No | Text to extract from |

#### Returns

Extracted conference details or `undefined` if none found.

#### Example

```typescript
const meetingDetails = calendarService.extractConferenceDetails(
  "Join Zoom: https://zoom.us/j/123456789"
);
// Returns: "https://zoom.us/j/123456789"
```

### Generate Calendar Event

Generate an iCalendar event.

```typescript
generateCalendarEvent(eventDetails: CalendarEvent): string
```

#### Parameters

The `CalendarEvent` object includes:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `uid` | string | No | Unique identifier for the event |
| `summary` | string | Yes | Event title |
| `description` | string | No | Event description |
| `location` | string | No | Event location |
| `start` | Date \| string | Yes | Start time |
| `end` | Date \| string | No | End time |
| `duration` | number | No | Duration in minutes (if no end time) |
| `organizer` | Object | No | Event organizer details |
| `attendees` | Array | No | Event attendees |

#### Returns

iCalendar formatted string.

#### Example

```typescript
const iCalString = calendarService.generateCalendarEvent({
  summary: "Product Demo Call",
  description: "Scheduled product demonstration call",
  location: "Phone: +15551234567",
  start: new Date("2025-04-01T14:00:00Z"),
  duration: 30,
  organizer: {
    name: "AI Phone Agent",
    email: "system@aiphone.agent"
  },
  attendees: [
    {
      name: "John Doe",
      email: "john.doe@example.com",
      role: "REQ-PARTICIPANT",
      status: "NEEDS-ACTION"
    }
  ]
});
```

### Create Call Event

Create a calendar event for a scheduled call.

```typescript
createCallEvent(callDetails: CallEventDetails): string
```

#### Parameters

The `CallEventDetails` object includes:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `scheduledTime` | Date \| string | Yes | When the call is scheduled |
| `durationMinutes` | number | Yes | Call duration in minutes |
| `topic` | string | No | Topic of the call |
| `description` | string | No | Call description |
| `phoneNumber` | string | No | Phone number for the call |
| `recipientName` | string | Yes | Name of the call recipient |
| `recipientEmail` | string | Yes | Email of the call recipient |
| `agentName` | string | No | Name of the agent |
| `agentEmail` | string | No | Email of the agent |

#### Returns

iCalendar formatted string.

#### Example

```typescript
const iCalString = calendarService.createCallEvent({
  scheduledTime: new Date("2025-04-01T14:00:00Z"),
  durationMinutes: 30,
  topic: "Product Demo",
  description: "Scheduled product demonstration call",
  phoneNumber: "+15551234567",
  recipientName: "John Doe",
  recipientEmail: "john.doe@example.com",
  agentName: "AI Phone Agent",
  agentEmail: "system@aiphone.agent"
});
```

## Calendar Event Interface

The `CalendarEvent` interface represents the data needed to generate a calendar event:

```typescript
interface CalendarEvent {
  uid?: string;
  summary: string;
  description?: string;
  location?: string;
  start: Date | string;
  end?: Date | string;
  duration?: number;
  organizer?: {
    name: string;
    email: string;
  };
  attendees?: Array<{
    name: string;
    email: string;
    role?: string;
    status?: string;
  }>;
}
```

## Parsed Calendar Event Interface

The `ParsedCalendarEvent` interface represents a parsed calendar event:

```typescript
interface ParsedCalendarEvent {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  dialIn?: string;
  conferenceDetails?: string;
}
```

## Call Event Details Interface

The `CallEventDetails` interface represents the data needed to create a call event:

```typescript
interface CallEventDetails {
  scheduledTime: Date | string;
  durationMinutes: number;
  topic?: string;
  description?: string;
  phoneNumber?: string;
  recipientName: string;
  recipientEmail: string;
  agentName?: string;
  agentEmail?: string;
}
```

## iCalendar Format

The Calendar Service generates iCalendar files that conform to the [RFC 5545](https://tools.ietf.org/html/rfc5545) standard. The generated files include:

- VCALENDAR component with version and product ID
- VEVENT component with all event details
- UID for unique event identification
- DTSTAMP for creation timestamp
- DTSTART for event start time
- DTEND for event end time
- SUMMARY for event title
- DESCRIPTION for event description (optional)
- LOCATION for event location (optional)
- ORGANIZER for event organizer (optional)
- ATTENDEE for each event attendee (optional)

Example iCalendar output:

```
BEGIN:VCALENDAR
PRODID:-//AI Phone Agent//Calendar//EN
VERSION:2.0
BEGIN:VEVENT
UID:12345678-1234-1234-1234-123456789012@aiphone.agent
DTSTAMP:20250401T133000Z
SUMMARY:Product Demo Call
DESCRIPTION:Scheduled product demonstration call
LOCATION:Phone: +15551234567
DTSTART:20250401T140000Z
DTEND:20250401T143000Z
ORGANIZER;CN=AI Phone Agent:mailto:system@aiphone.agent
ATTENDEE;CN=John Doe;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:john.doe@example.com
END:VEVENT
END:VCALENDAR
```

## Integration with Email Service

The Calendar Service integrates with the Email Service to attach calendar events to emails:

```typescript
import { calendarService } from '../services/calendar-service';
import { emailService } from '../services/email-service';

// Generate a calendar event
const calendarEvent = calendarService.createCallEvent({
  scheduledTime: new Date("2025-04-01T14:00:00Z"),
  durationMinutes: 30,
  topic: "Product Demo",
  recipientName: "John Doe",
  recipientEmail: "john.doe@example.com"
});

// Send an email with the calendar event attached
await emailService.sendEmail({
  to: "john.doe@example.com",
  subject: "Your Scheduled Call",
  html: "<h1>Your Call Has Been Scheduled</h1><p>See the attached calendar event.</p>",
  calendarEvent
});
```

## Error Handling

The Calendar Service implements comprehensive error handling:

- Missing ICAL.js library errors are caught and reported
- Invalid calendar format errors are caught and reported
- Date parsing errors are caught and reported
- Calendar generation errors are caught and reported

## Best Practices

1. **Timezone Handling**: Always specify a timezone for calendar events
2. **Duration vs. End Time**: Provide either an end time or a duration, not both
3. **Unique IDs**: Use unique IDs for calendar events to prevent duplicates
4. **Validation**: Validate dates and times before creating calendar events
5. **Testing**: Test calendar events with different calendar applications

## Examples

### Complete Calendar Workflow

```typescript
import { calendarService } from '../services/calendar-service';
import { emailService } from '../services/email-service';
import { blandAiService } from '../services/bland-service';

async function scheduleCallWithCalendar(callData) {
  try {
    // Schedule the call with Bland.ai
    const callResult = await blandAiService.scheduleCall({
      phoneNumber: callData.phoneNumber,
      scheduledTime: callData.scheduledTime,
      recipientName: callData.recipientName,
      recipientEmail: callData.recipientEmail,
      topic: callData.topic
    });
    
    // Generate a calendar event
    const calendarEvent = calendarService.createCallEvent({
      scheduledTime: callData.scheduledTime,
      durationMinutes: callData.duration || 30,
      topic: callData.topic,
      description: callData.description,
      phoneNumber: callData.phoneNumber,
      recipientName: callData.recipientName,
      recipientEmail: callData.recipientEmail
    });
    
    // Format date and time for display
    const formattedDate = formatDate(callData.scheduledTime);
    const formattedTime = formatTime(callData.scheduledTime);
    
    // Send confirmation email with calendar attachment
    await emailService.sendCallConfirmation(
      callData.recipientEmail,
      {
        recipientName: callData.recipientName,
        recipientEmail: callData.recipientEmail,
        formattedDate,
        formattedTime,
        duration: `${callData.duration || 30} minutes`,
        topic: callData.topic,
        calendarEvent
      }
    );
    
    return {
      callId: callResult.callId,
      calendarEventCreated: true,
      emailSent: true
    };
  } catch (error) {
    console.error("Failed to schedule call with calendar:", error);
    throw error;
  }
}
```

### Parsing Calendar Invitations

```typescript
import { calendarService } from '../services/calendar-service';

function processCalendarInvitation(iCalString) {
  try {
    // Parse the calendar content
    const events = calendarService.parseCalendarContent(iCalString);
    
    if (events.length === 0) {
      return { success: false, message: "No events found in calendar data" };
    }
    
    // Process the first event
    const event = events[0];
    
    // Extract dial-in information if not already extracted
    const dialIn = event.dialIn || calendarService.extractDialInInfo(event.description);
    
    // Extract conference details if not already extracted
    const conferenceDetails = event.conferenceDetails || 
                             calendarService.extractConferenceDetails(event.description);
    
    return {
      success: true,
      event: {
        title: event.summary,
        startTime: event.startTime,
        endTime: event.endTime,
        duration: event.duration,
        location: event.location,
        description: event.description,
        dialIn,
        conferenceDetails
      }
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Failed to process calendar invitation: ${error.message}` 
    };
  }
}