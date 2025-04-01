import { v4 as uuidv4 } from 'uuid';
import { config } from '../utils/config';
import { AppError, logger } from '../utils/logger';

// Try to import ICAL.js
let ICAL: any;
try {
  // Use global ICAL if available in Cloudflare Workers environment
  ICAL = (globalThis as any).ICAL;
} catch (error) {
  logger.warn('ical.js package not found, calendar functionality will be limited');
}

/**
 * Interface for calendar service configuration
 */
export interface CalendarServiceConfig {
  timezone?: string;
}

/**
 * Interface for calendar event details
 */
export interface CalendarEvent {
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

/**
 * Interface for parsed calendar event
 */
export interface ParsedCalendarEvent {
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

/**
 * Interface for call event details
 */
export interface CallEventDetails {
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

/**
 * Service for calendar operations
 */
export class CalendarService {
  private defaultTimezone: string;

  /**
   * Create a new calendar service
   * @param options Configuration options
   */
  constructor(options: CalendarServiceConfig = {}) {
    // Get calendar config with default fallback
    const calendarConfig = config.getCalendarConfig ? config.getCalendarConfig() : { timezone: 'UTC' };
    
    // Set timezone with fallbacks
    this.defaultTimezone = options.timezone || 
                          (calendarConfig && calendarConfig.timezone) || 
                          config.get('DEFAULT_TIMEZONE', 'UTC');
  }

  /**
   * Parse iCalendar content into event objects
   * @param calendarContent iCalendar content string
   * @returns Array of parsed calendar events
   */
  parseCalendarContent(calendarContent: string): ParsedCalendarEvent[] {
    try {
      if (!ICAL) {
        throw new AppError('ICAL.js library not available', 500);
      }

      // Parse the iCalendar content
      const jcalData = ICAL.parse(calendarContent);
      const comp = new ICAL.Component(jcalData);
      const events = comp.getAllSubcomponents('vevent');
      
      return events.map((event: any) => {
        const icalEvent = new ICAL.Event(event);
        const description = icalEvent.description || '';
        
        // Get start and end times
        const startTime = icalEvent.startDate.toJSDate();
        let endTime: Date;
        let duration: number;
        
        if (icalEvent.endDate) {
          endTime = icalEvent.endDate.toJSDate();
          // Calculate duration in minutes
          duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
        } else {
          // Default to 30 minutes if no end time
          duration = 30;
          endTime = new Date(startTime.getTime() + duration * 60000);
        }
        
        // Extract dial-in and conference details from description
        const dialIn = this.extractDialInInfo(description);
        const conferenceDetails = this.extractConferenceDetails(description);
        
        return {
          uid: icalEvent.uid,
          summary: icalEvent.summary,
          description: icalEvent.description,
          location: icalEvent.location,
          startTime,
          endTime,
          duration,
          dialIn,
          conferenceDetails
        };
      });
    } catch (error) {
      logger.error(`Failed to parse calendar content: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new AppError(`Invalid calendar format: ${error instanceof Error ? error.message : 'Unknown error'}`, 400);
    }
  }

  /**
   * Extract dial-in information from text
   * @param text Text to extract from
   * @returns Extracted phone number or undefined
   */
  extractDialInInfo(text?: string): string | undefined {
    if (!text) return undefined;
    
    // Match various phone number formats
    const phoneRegex = /(?:dial-in|phone|call)(?:\s*(?:number|#)?)?:?\s*(?:\+?1\s*)?(?:\(?([0-9]{3})\)?[-.\s]?)?([0-9]{3})[-.\s]?([0-9]{4})/i;
    const match = text.match(phoneRegex);
    
    if (match) {
      // Format the phone number consistently
      const areaCode = match[1] || '';
      const prefix = match[2] || '';
      const lineNumber = match[3] || '';
      
      // If we have a full phone number
      if (areaCode && prefix && lineNumber) {
        // Check if there's a +1 in the original text
        if (text.includes('+1')) {
          return `+1${areaCode}${prefix}${lineNumber}`;
        }
        return `${areaCode}${prefix}${lineNumber}`;
      }
    }
    
    return undefined;
  }

  /**
   * Extract conference details from text
   * @param text Text to extract from
   * @returns Extracted conference details or undefined
   */
  extractConferenceDetails(text?: string): string | undefined {
    if (!text) return undefined;
    
    // Match meeting IDs, access codes, or conference URLs
    const meetingIdRegex = /(?:meeting|conference)(?:\s*(?:id|code|#)?)?:?\s*([0-9]{3}[-.\s]?[0-9]{3}[-.\s]?[0-9]{3})/i;
    const accessCodeRegex = /(?:access|passcode)(?:\s*(?:code|#)?)?:?\s*([0-9]{5,})/i;
    const urlRegex = /(https?:\/\/(?:www\.)?(?:zoom|teams|meet)\.(?:us|com|google\.com)\/[^\s]+)/i;
    
    // Try each regex in order
    const meetingMatch = text.match(meetingIdRegex);
    if (meetingMatch) return meetingMatch[1];
    
    const accessMatch = text.match(accessCodeRegex);
    if (accessMatch) return accessMatch[1];
    
    const urlMatch = text.match(urlRegex);
    if (urlMatch) return urlMatch[1];
    
    return undefined;
  }

  /**
   * Generate an iCalendar event
   * @param eventDetails Event details
   * @returns iCalendar formatted string
   */
  generateCalendarEvent(eventDetails: CalendarEvent): string {
    try {
      if (!ICAL) {
        throw new AppError('ICAL.js library not available', 500);
      }

      // Create a new VCALENDAR component
      const calendar = new ICAL.Component(['vcalendar', [], []]);
      calendar.updatePropertyWithValue('prodid', '-//AI Phone Agent//Calendar//EN');
      calendar.updatePropertyWithValue('version', '2.0');
      
      // Create a VEVENT component
      const event = new ICAL.Component(['vevent', [], []]);
      
      // Add UID (generate if not provided)
      const uid = eventDetails.uid || `${uuidv4()}@aiphone.agent`;
      event.updatePropertyWithValue('uid', uid);
      
      // Add creation timestamp
      event.updatePropertyWithValue('dtstamp', ICAL.Time.now());
      
      // Add summary (title)
      event.updatePropertyWithValue('summary', eventDetails.summary);
      
      // Add description if provided
      if (eventDetails.description) {
        event.updatePropertyWithValue('description', eventDetails.description);
      }
      
      // Add location if provided
      if (eventDetails.location) {
        event.updatePropertyWithValue('location', eventDetails.location);
      }
      
      // Convert start time to ICAL.Time
      const startDate = eventDetails.start instanceof Date 
        ? eventDetails.start 
        : new Date(eventDetails.start);
      
      const icalStartTime = ICAL.Time.fromJSDate(startDate);
      event.updatePropertyWithValue('dtstart', icalStartTime);
      
      // Handle end time or duration
      if (eventDetails.end) {
        const endDate = eventDetails.end instanceof Date 
          ? eventDetails.end 
          : new Date(eventDetails.end);
        
        const icalEndTime = ICAL.Time.fromJSDate(endDate);
        event.updatePropertyWithValue('dtend', icalEndTime);
      } else if (eventDetails.duration) {
        // Calculate end time based on duration (in minutes)
        const endDate = new Date(startDate.getTime() + eventDetails.duration * 60000);
        const icalEndTime = ICAL.Time.fromJSDate(endDate);
        event.updatePropertyWithValue('dtend', icalEndTime);
      }
      
      // Add organizer if provided
      if (eventDetails.organizer) {
        const { name, email } = eventDetails.organizer;
        const organizerProp = event.updatePropertyWithValue('organizer', `mailto:${email}`);
        organizerProp.setParameter('cn', name);
      }
      
      // Add attendees if provided
      if (eventDetails.attendees && eventDetails.attendees.length > 0) {
        eventDetails.attendees.forEach(attendee => {
          const { name, email, role = 'REQ-PARTICIPANT', status = 'NEEDS-ACTION' } = attendee;
          const attendeeProp = event.addPropertyWithValue('attendee', `mailto:${email}`);
          attendeeProp.setParameter('cn', name);
          attendeeProp.setParameter('role', role);
          attendeeProp.setParameter('partstat', status);
          attendeeProp.setParameter('rsvp', 'TRUE');
        });
      }
      
      // Add the event to the calendar
      calendar.addSubcomponent(event);
      
      // Convert to iCalendar format
      return calendar.toString();
    } catch (error) {
      logger.error(`Failed to generate calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new AppError(`Calendar generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  }

  /**
   * Create a calendar event for a scheduled call
   * @param callDetails Call details
   * @returns iCalendar formatted string
   */
  createCallEvent(callDetails: CallEventDetails): string {
    try {
      const { 
        scheduledTime, 
        durationMinutes, 
        topic = 'Scheduled Call',
        description = '',
        phoneNumber,
        recipientName,
        recipientEmail,
        agentName = 'AI Phone Agent',
        agentEmail
      } = callDetails;
      
      // Get email config with fallback
      const emailConfig = config.getEmailConfig ? config.getEmailConfig() : { senderEmail: 'system@aiphone.agent' };
      
      // Use provided agent email or get from config with fallback
      const senderEmail = agentEmail || 
                         (emailConfig && emailConfig.senderEmail) || 
                         config.get('SENDER_EMAIL', 'system@aiphone.agent');
      
      // Convert scheduledTime to Date if it's a string
      const startTime = scheduledTime instanceof Date 
        ? scheduledTime 
        : new Date(scheduledTime);
      
      // Calculate end time
      const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
      
      // Build location string
      const location = phoneNumber ? `Phone: ${phoneNumber}` : 'Phone Call';
      
      // Create event details
      const eventDetails: CalendarEvent = {
        summary: topic,
        description,
        location,
        start: startTime,
        end: endTime,
        organizer: {
          name: agentName,
          email: senderEmail
        },
        attendees: [
          {
            name: recipientName,
            email: recipientEmail,
            role: 'REQ-PARTICIPANT',
            status: 'NEEDS-ACTION'
          }
        ]
      };
      
      // Generate the calendar event
      return this.generateCalendarEvent(eventDetails);
    } catch (error) {
      logger.error(`Failed to create call event: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new AppError(`Call event creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  }
}

// Create and export a singleton instance
export const calendarService = new CalendarService();