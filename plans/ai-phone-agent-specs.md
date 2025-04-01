# AI Phone Agent Specifications

## System Overview

The AI Phone Agent is a service that handles phone calls using AI, manages calendar invites, sends email notifications, and schedules calls through the Bland.ai API. The system needs to be modular, testable, and secure with proper environment variable management.

## 1. Email Handling with Resend API

### Requirements

- Send confirmation emails after successful call scheduling
- Send rescheduling notifications when calls are moved
- Send cancellation emails when calls are canceled
- Include calendar invites as attachments in emails
- Support HTML and plain text email formats
- Track email delivery status
- Handle email sending failures gracefully

### Edge Cases

- Email service unavailability
- Invalid recipient email addresses
- Rate limiting by Resend API
- Email delivery failures
- Large attachment handling

### Environment Variables

```
RESEND_API_KEY=
SENDER_EMAIL=
SENDER_NAME=
EMAIL_TEMPLATES_DIR=
```

### Pseudocode - Email Service Module

```javascript
/**
 * Email Service Module
 * Handles all email communications using Resend API
 * @module EmailService
 */

// @test: Should initialize with valid API key
class EmailService {
  constructor(config) {
    this.apiKey = config.apiKey || process.env.RESEND_API_KEY;
    this.senderEmail = config.senderEmail || process.env.SENDER_EMAIL;
    this.senderName = config.senderName || process.env.SENDER_NAME;
    this.templatesDir = config.templatesDir || process.env.EMAIL_TEMPLATES_DIR;
    
    // @test: Should throw error if API key is missing
    if (!this.apiKey) {
      throw new Error('Resend API key is required');
    }
    
    this.client = new ResendClient(this.apiKey);
    this.retryCount = config.retryCount || 3;
    this.retryDelay = config.retryDelay || 1000; // ms
  }
  
  /**
   * Loads an email template and replaces variables
   * @test: Should load template and replace variables correctly
   */
  async loadTemplate(templateName, variables) {
    try {
      const templatePath = path.join(this.templatesDir, `${templateName}.html`);
      let template = await fs.readFile(templatePath, 'utf8');
      
      // Replace variables in template
      Object.entries(variables).forEach(([key, value]) => {
        template = template.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });
      
      return template;
    } catch (error) {
      logger.error(`Failed to load email template: ${templateName}`, error);
      throw new Error(`Email template error: ${error.message}`);
    }
  }
  
  /**
   * Sends an email with optional calendar invite attachment
   * @test: Should send email with correct parameters
   * @test: Should handle attachment correctly
   */
  async sendEmail(options) {
    const { to, subject, templateName, variables, calendarEvent, attachments = [] } = options;
    
    try {
      // @test: Should validate email address format
      if (!this.isValidEmail(to)) {
        throw new Error(`Invalid recipient email: ${to}`);
      }
      
      const htmlContent = await this.loadTemplate(templateName, variables);
      const plainTextContent = this.convertHtmlToPlainText(htmlContent);
      
      const emailPayload = {
        from: `${this.senderName} <${this.senderEmail}>`,
        to,
        subject,
        html: htmlContent,
        text: plainTextContent,
        attachments: [...attachments]
      };
      
      // Add calendar invite if provided
      if (calendarEvent) {
        emailPayload.attachments.push({
          filename: 'invite.ics',
          content: calendarEvent,
          contentType: 'text/calendar'
        });
      }
      
      // @test: Should retry on temporary failures
      return await this.sendWithRetry(emailPayload);
    } catch (error) {
      logger.error(`Email sending failed to ${to}`, error);
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }
  
  /**
   * Sends email with retry logic for transient failures
   * @test: Should retry specified number of times
   */
  async sendWithRetry(emailPayload, attempt = 1) {
    try {
      const response = await this.client.sendEmail(emailPayload);
      logger.info(`Email sent successfully to ${emailPayload.to}`, { id: response.id });
      return response;
    } catch (error) {
      if (this.isRetryableError(error) && attempt < this.retryCount) {
        logger.warn(`Retrying email send (${attempt}/${this.retryCount})`, { error: error.message });
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        return this.sendWithRetry(emailPayload, attempt + 1);
      }
      throw error;
    }
  }
  
  /**
   * Determines if an error is retryable
   * @test: Should correctly identify retryable errors
   */
  isRetryableError(error) {
    // Retryable errors: rate limits, temporary server issues, network problems
    return error.status >= 500 || error.status === 429 || error.code === 'ECONNRESET';
  }
  
  /**
   * Validates email format
   * @test: Should validate email format correctly
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Converts HTML content to plain text
   * @test: Should convert HTML to readable plain text
   */
  convertHtmlToPlainText(html) {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  /**
   * Sends a confirmation email for a scheduled call
   * @test: Should send confirmation with correct details
   */
  async sendCallConfirmation(recipient, callDetails) {
    return this.sendEmail({
      to: recipient,
      subject: 'Your Call Has Been Scheduled',
      templateName: 'call-confirmation',
      variables: {
        name: callDetails.recipientName,
        date: callDetails.formattedDate,
        time: callDetails.formattedTime,
        duration: callDetails.duration,
        topic: callDetails.topic
      },
      calendarEvent: callDetails.calendarEvent
    });
  }
  
  /**
   * Sends a rescheduling notification
   * @test: Should send rescheduling email with updated details
   */
  async sendRescheduleNotification(recipient, callDetails, reason) {
    return this.sendEmail({
      to: recipient,
      subject: 'Your Call Has Been Rescheduled',
      templateName: 'call-reschedule',
      variables: {
        name: callDetails.recipientName,
        oldDate: callDetails.oldFormattedDate,
        oldTime: callDetails.oldFormattedTime,
        newDate: callDetails.formattedDate,
        newTime: callDetails.formattedTime,
        duration: callDetails.duration,
        topic: callDetails.topic,
        reason: reason || 'scheduling conflict'
      },
      calendarEvent: callDetails.calendarEvent
    });
  }
  
  /**
   * Sends a cancellation notification
   * @test: Should send cancellation with correct details
   */
  async sendCancellationNotification(recipient, callDetails, reason) {
    return this.sendEmail({
      to: recipient,
      subject: 'Your Call Has Been Cancelled',
      templateName: 'call-cancellation',
      variables: {
        name: callDetails.recipientName,
        date: callDetails.formattedDate,
        time: callDetails.formattedTime,
        topic: callDetails.topic,
        reason: reason || 'unforeseen circumstances'
      }
    });
  }
}

module.exports = EmailService;
```

## 2. Calendar Invite Parsing using ical.js

### Requirements

- Parse incoming calendar invites from email attachments
- Extract event details (date, time, duration, participants, etc.)
- Handle different calendar formats (iCal, .ics)
- Generate calendar invites for scheduled calls
- Support timezone conversions
- Handle recurring events

### Edge Cases

- Malformed calendar files
- Timezone inconsistencies
- All-day events vs. timed events
- Recurring event patterns
- Cancelled or updated events
- Multiple attendees and roles

### Environment Variables

```
DEFAULT_TIMEZONE=
CALENDAR_CACHE_DIR=
```

### Pseudocode - Calendar Service Module

```javascript
/**
 * Calendar Service Module
 * Handles parsing and generating calendar invites using ical.js
 * @module CalendarService
 */

// @test: Should initialize with default timezone
class CalendarService {
  constructor(config = {}) {
    this.defaultTimezone = config.timezone || process.env.DEFAULT_TIMEZONE || 'UTC';
    this.cacheDir = config.cacheDir || process.env.CALENDAR_CACHE_DIR;
    
    // Create cache directory if it doesn't exist
    if (this.cacheDir && !fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }
  
  /**
   * Parses an iCalendar file and extracts event details
   * @test: Should parse valid iCal file correctly
   * @test: Should handle malformed iCal files
   */
  async parseCalendarFile(filePath) {
    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      return this.parseCalendarContent(fileContent);
    } catch (error) {
      logger.error(`Failed to parse calendar file: ${filePath}`, error);
      throw new Error(`Calendar parsing error: ${error.message}`);
    }
  }
  
  /**
   * Parses iCalendar content string
   * @test: Should extract all relevant event properties
   */
  parseCalendarContent(content) {
    try {
      const jcalData = ICAL.parse(content);
      const comp = new ICAL.Component(jcalData);
      const events = comp.getAllSubcomponents('vevent').map(vevent => {
        const event = new ICAL.Event(vevent);
        
        // Extract basic event details
        const startDate = event.startDate;
        const endDate = event.endDate;
        const duration = endDate.subtractDate(startDate).toSeconds();
        
        // Handle timezone conversion
        const startInLocalTime = this.convertToTimezone(startDate, this.defaultTimezone);
        const endInLocalTime = this.convertToTimezone(endDate, this.defaultTimezone);
        
        // Extract attendees
        const attendees = vevent.getAllProperties('attendee').map(attendeeProp => {
          const cn = attendeeProp.getParameter('cn');
          const email = attendeeProp.getFirstValue().replace('mailto:', '');
          const role = attendeeProp.getParameter('role') || 'REQ-PARTICIPANT';
          const status = attendeeProp.getParameter('partstat') || 'NEEDS-ACTION';
          
          return {
            name: cn,
            email,
            role,
            status
          };
        });
        
        // Extract organizer
        const organizerProp = vevent.getFirstProperty('organizer');
        const organizer = organizerProp ? {
          name: organizerProp.getParameter('cn'),
          email: organizerProp.getFirstValue().replace('mailto:', '')
        } : null;
        
        // Handle recurrence
        const isRecurring = event.isRecurring();
        const recurrenceRule = isRecurring ? this.parseRecurrenceRule(event) : null;
        
        return {
          uid: event.uid,
          summary: event.summary,
          description: event.description,
          location: event.location,
          start: {
            dateTime: startInLocalTime.toJSDate(),
            timezone: startDate.zone ? startDate.zone.tzid : 'UTC'
          },
          end: {
            dateTime: endInLocalTime.toJSDate(),
            timezone: endDate.zone ? endDate.zone.tzid : 'UTC'
          },
          duration: {
            seconds: duration,
            minutes: Math.floor(duration / 60),
            hours: Math.floor(duration / 3600)
          },
          isAllDay: startDate.isDate,
          organizer,
          attendees,
          status: event.status,
          created: event.created ? event.created.toJSDate() : null,
          lastModified: event.lastModified ? event.lastModified.toJSDate() : null,
          isRecurring,
          recurrenceRule
        };
      });
      
      return events;
    } catch (error) {
      logger.error('Failed to parse calendar content', error);
      throw new Error(`Calendar content parsing error: ${error.message}`);
    }
  }
  
  /**
   * Parses recurrence rule from an event
   * @test: Should correctly parse different recurrence patterns
   */
  parseRecurrenceRule(event) {
    if (!event.isRecurring()) return null;
    
    const rrule = event.component.getFirstPropertyValue('rrule');
    if (!rrule) return null;
    
    return {
      frequency: rrule.freq,
      interval: rrule.interval || 1,
      count: rrule.count,
      until: rrule.until ? new ICAL.Time(rrule.until).toJSDate() : null,
      byDay: rrule.byDay,
      byMonth: rrule.byMonth,
      byMonthDay: rrule.byMonthDay,
      exceptions: event.exdate ? event.exdate.map(ex => ex.toJSDate()) : []
    };
  }
  
  /**
   * Converts an ICAL.Time to a specific timezone
   * @test: Should convert between timezones correctly
   */
  convertToTimezone(time, timezone) {
    if (!time) return null;
    
    // Clone the time to avoid modifying the original
    const newTime = time.clone();
    
    // If the time is already in the target timezone, return it
    if (newTime.zone && newTime.zone.tzid === timezone) {
      return newTime;
    }
    
    // Convert to the target timezone
    try {
      const tzid = ICAL.TimezoneService.get(timezone);
      return newTime.convertToZone(tzid);
    } catch (error) {
      logger.warn(`Timezone conversion failed: ${timezone}`, error);
      return newTime;
    }
  }
  
  /**
   * Generates an iCalendar event string
   * @test: Should generate valid iCal content
   */
  generateCalendarEvent(eventDetails) {
    try {
      // Create a new ICAL component
      const calendar = new ICAL.Component(['vcalendar', [], []]);
      calendar.updatePropertyWithValue('prodid', '-//AI Phone Agent//EN');
      calendar.updatePropertyWithValue('version', '2.0');
      calendar.updatePropertyWithValue('calscale', 'GREGORIAN');
      calendar.updatePropertyWithValue('method', 'REQUEST');
      
      // Create the event component
      const event = new ICAL.Component(['vevent', [], []]);
      
      // Set basic event properties
      const uid = eventDetails.uid || this.generateUid();
      event.updatePropertyWithValue('uid', uid);
      event.updatePropertyWithValue('summary', eventDetails.summary);
      
      if (eventDetails.description) {
        event.updatePropertyWithValue('description', eventDetails.description);
      }
      
      if (eventDetails.location) {
        event.updatePropertyWithValue('location', eventDetails.location);
      }
      
      // Set dates
      const startTime = new ICAL.Time({
        year: eventDetails.start.getFullYear(),
        month: eventDetails.start.getMonth() + 1,
        day: eventDetails.start.getDate(),
        hour: eventDetails.start.getHours(),
        minute: eventDetails.start.getMinutes(),
        second: eventDetails.start.getSeconds(),
        isDate: false
      });
      
      const endTime = new ICAL.Time({
        year: eventDetails.end.getFullYear(),
        month: eventDetails.end.getMonth() + 1,
        day: eventDetails.end.getDate(),
        hour: eventDetails.end.getHours(),
        minute: eventDetails.end.getMinutes(),
        second: eventDetails.end.getSeconds(),
        isDate: false
      });
      
      // Set timezone if provided
      if (eventDetails.timezone) {
        try {
          const timezone = ICAL.TimezoneService.get(eventDetails.timezone);
          startTime.zone = timezone;
          endTime.zone = timezone;
        } catch (error) {
          logger.warn(`Timezone not found: ${eventDetails.timezone}`, error);
          // Fall back to UTC
          startTime.zone = ICAL.Timezone.utcTimezone;
          endTime.zone = ICAL.Timezone.utcTimezone;
        }
      } else {
        // Default to UTC
        startTime.zone = ICAL.Timezone.utcTimezone;
        endTime.zone = ICAL.Timezone.utcTimezone;
      }
      
      event.updatePropertyWithValue('dtstart', startTime);
      event.updatePropertyWithValue('dtend', endTime);
      
      // Add creation timestamp
      const now = new ICAL.Time.fromJSDate(new Date(), false);
      event.updatePropertyWithValue('dtstamp', now);
      event.updatePropertyWithValue('created', now);
      
      // Add organizer if provided
      if (eventDetails.organizer) {
        const organizerProp = event.updatePropertyWithValue(
          'organizer', 
          `mailto:${eventDetails.organizer.email}`
        );
        if (eventDetails.organizer.name) {
          organizerProp.setParameter('cn', eventDetails.organizer.name);
        }
      }
      
      // Add attendees if provided
      if (eventDetails.attendees && eventDetails.attendees.length > 0) {
        eventDetails.attendees.forEach(attendee => {
          const attendeeProp = event.addPropertyWithValue(
            'attendee', 
            `mailto:${attendee.email}`
          );
          
          if (attendee.name) {
            attendeeProp.setParameter('cn', attendee.name);
          }
          
          attendeeProp.setParameter('role', attendee.role || 'REQ-PARTICIPANT');
          attendeeProp.setParameter('partstat', attendee.status || 'NEEDS-ACTION');
          attendeeProp.setParameter('rsvp', 'TRUE');
        });
      }
      
      // Add the event to the calendar
      calendar.addSubcomponent(event);
      
      // Generate the iCalendar string
      return calendar.toString();
    } catch (error) {
      logger.error('Failed to generate calendar event', error);
      throw new Error(`Calendar generation error: ${error.message}`);
    }
  }
  
  /**
   * Generates a unique identifier for calendar events
   * @test: Should generate unique IDs
   */
  generateUid() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@aiphone.agent`;
  }
  
  /**
   * Creates a calendar event for a scheduled call
   * @test: Should create event with correct call details
   */
  createCallEvent(callDetails) {
    const startTime = new Date(callDetails.scheduledTime);
    const endTime = new Date(startTime.getTime() + (callDetails.durationMinutes * 60 * 1000));
    
    const eventDetails = {
      summary: callDetails.topic || 'Scheduled Call',
      description: callDetails.description || 'Call scheduled via AI Phone Agent',
      location: callDetails.phoneNumber ? `Phone: ${callDetails.phoneNumber}` : 'Phone Call',
      start: startTime,
      end: endTime,
      timezone: callDetails.timezone || this.defaultTimezone,
      organizer: {
        name: callDetails.agentName || 'AI Phone Agent',
        email: callDetails.agentEmail || process.env.SENDER_EMAIL
      },
      attendees: [
        {
          name: callDetails.recipientName,
          email: callDetails.recipientEmail,
          role: 'REQ-PARTICIPANT',
          status: 'NEEDS-ACTION'
        }
      ]
    };
    
    return this.generateCalendarEvent(eventDetails);
  }
}

module.exports = CalendarService;
```

## 3. Bland.ai Agent Scheduling and Configuration

### Requirements

- Configure Bland.ai agent with proper parameters
- Schedule calls at specific times
- Handle call status updates and webhooks
- Support different call types and scenarios
- Manage agent availability and scheduling conflicts
- Track call outcomes and transcripts

### Edge Cases

- API rate limiting
- Call scheduling conflicts
- Failed calls and retries
- Handling no-shows
- Timezone mismatches
- Call duration limits
- Handling unexpected agent responses

### Environment Variables

```
BLAND_AI_API_KEY=
BLAND_AI_WEBHOOK_SECRET=
BLAND_AI_AGENT_ID=
BLAND_AI_BASE_URL=
MAX_CALL_DURATION_MINUTES=
DEFAULT_RETRY_COUNT=
```

### Pseudocode - Bland.ai Service Module

```javascript
/**
 * Bland.ai Service Module
 * Handles all interactions with the Bland.ai API for call scheduling
 * @module BlandAiService
 */

// @test: Should initialize with valid API key
class BlandAiService {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.BLAND_AI_API_KEY;
    this.webhookSecret = config.webhookSecret || process.env.BLAND_AI_WEBHOOK_SECRET;
    this.agentId = config.agentId || process.env.BLAND_AI_AGENT_ID;
    this.baseUrl = config.baseUrl || process.env.BLAND_AI_BASE_URL || 'https://api.bland.ai';
    this.maxCallDuration = config.maxCallDuration || process.env.MAX_CALL_DURATION_MINUTES || 30;
    this.defaultRetryCount = config.defaultRetryCount || process.env.DEFAULT_RETRY_COUNT || 2;
    
    // @test: Should throw error if API key is missing
    if (!this.apiKey) {
      throw new Error('Bland.ai API key is required');
    }
    
    // @test: Should throw error if agent ID is missing
    if (!this.agentId) {
      throw new Error('Bland.ai agent ID is required');
    }
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }
  
  /**
   * Schedules a call with the Bland.ai API
   * @test: Should schedule call with correct parameters
   */
  async scheduleCall(callDetails) {
    try {
      const payload = this.buildCallPayload(callDetails);
      
      const response = await this.client.post('/calls', payload);
      
      logger.info('Call scheduled successfully', {
        callId: response.data.id,
        phoneNumber: callDetails.phoneNumber,
        scheduledTime: callDetails.scheduledTime
      });
      
      return {
        callId: response.data.id,
        status: response.data.status,
        scheduledTime: response.data.scheduled_time,
        estimatedDuration: response.data.estimated_duration || this.maxCallDuration
      };
    } catch (error) {
      logger.error('Failed to schedule call', {
        error: error.message,
        phoneNumber: callDetails.phoneNumber,
        scheduledTime: callDetails.scheduledTime
      });
      
      // Handle specific API errors
      if (error.response) {
        const statusCode = error.response.status;
        const errorData = error.response.data;
        
        if (statusCode === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else if (statusCode === 400 && errorData.error.includes('scheduling conflict')) {
          throw new Error('Scheduling conflict detected. Please choose another time.');
        } else {
          throw new Error(`Bland.ai API error (${statusCode}): ${errorData.error || 'Unknown error'}`);
        }
      }
      
      throw new Error(`Call scheduling failed: ${error.message}`);
    }
  }
  
  /**
   * Builds the call payload for the Bland.ai API
   * @test: Should build payload with all required fields
   */
  buildCallPayload(callDetails) {
    // Validate required fields
    if (!callDetails.phoneNumber) {
      throw new Error('Phone number is required');
    }
    
    if (!callDetails.scheduledTime) {
      throw new Error('Scheduled time is required');
    }
    
    // Format the scheduled time as ISO string if it's a Date object
    const scheduledTime = callDetails.scheduledTime instanceof Date 
      ? callDetails.scheduledTime.toISOString()
      : callDetails.scheduledTime;
    
    // Build the base payload
    const payload = {
      phone_number: callDetails.phoneNumber,
      scheduled_time: scheduledTime,
      agent_id: callDetails.agentId || this.agentId,
      task: callDetails.task || 'Make a scheduled call',
      max_duration: callDetails.maxDuration || this.maxCallDuration,
      webhook_url: callDetails.webhookUrl,
      metadata: {
        callId: callDetails.callId || uuidv4(),
        recipientName: callDetails.recipientName,
        recipientEmail: callDetails.recipientEmail,
        topic: callDetails.topic,
        scheduledBy: callDetails.scheduledBy || 'AI Phone Agent'
      }
    };
    
    // Add optional fields if provided
    if (callDetails.voiceId) {
      payload.voice_id = callDetails.voiceId;
    }
    
    if (callDetails.recordCall !== undefined) {
      payload.record_call = callDetails.recordCall;
    }
    
    if (callDetails.agentConfig) {
      payload.agent_config = callDetails.agentConfig;
    } else {
      // Default agent configuration
      payload.agent_config = {
        name: callDetails.agentName || 'AI Assistant',
        goals: [
          callDetails.goal || 'Have a productive conversation about the scheduled topic'
        ],
        constraints: [
          'Be polite and professional',
          'Respect the caller\'s time',
          'Stay on topic',
          `Keep the call under ${this.maxCallDuration} minutes`
        ],
        tools: callDetails.tools || []
      };
    }
    
    return payload;
  }
  
  /**
   * Retrieves call details from the Bland.ai API
   * @test: Should retrieve call details correctly
   */
  async getCallDetails(callId) {
    try {
      const response = await this.client.get(`/calls/${callId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to retrieve call details for call ID: ${callId}`, error);
      throw new Error(`Call details retrieval failed: ${error.message}`);
    }
  }
  
  /**
   * Cancels a scheduled call
   * @test: Should cancel call successfully
   */
  async cancelCall(callId, reason) {
    try {
      const response = await this.client.post(`/calls/${callId}/cancel`, {
        reason: reason || 'Cancelled by user'
      });
      
      logger.info(`Call ${callId} cancelled successfully`, {
        reason,
        status: response.data.status
      });
      
      return {
        callId,
        status: response.data.status,
        cancelledAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Failed to cancel call ${callId}`, error);
      throw new Error(`Call cancellation failed: ${error.message}`);
    }
  }
  
  /**
   * Reschedules a call to a new time
   * @test: Should reschedule call to new time
   */
  async rescheduleCall(callId, newScheduledTime, reason) {
    try {
      // Format the scheduled time as ISO string if it's a Date object
      const scheduledTime = newScheduledTime instanceof Date 
        ? newScheduledTime.toISOString()
        : newScheduledTime;
      
      const response = await this.client.post(`/calls/${callId}/reschedule`, {
        scheduled_time: scheduledTime,
        reason: reason || 'Rescheduled by user'
      });
      
      logger.info(`Call ${callId} rescheduled successfully`, {
        newScheduledTime: scheduledTime,
        reason,
        status: response.data.status
      });
      
      return {
        callId,
        status: response.data.status,
        newScheduledTime: response.data.scheduled_time,
        rescheduledAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Failed to reschedule call ${callId}`, error);
      throw new Error(`Call rescheduling failed: ${error.message}`);
    }
  }
  
  /**
   * Validates a webhook signature from Bland.ai
   * @test: Should validate webhook signatures correctly
   */
  validateWebhookSignature(signature, body) {
    if (!this.webhookSecret) {
      logger.warn('Webhook secret not configured, skipping signature validation');
      return true;
    }
    
    try {
      const hmac = crypto.createHmac('sha256', this.webhookSecret);
      const expectedSignature = hmac.update(JSON.stringify(body)).digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      logger.error('Webhook signature validation failed', error);
      return false;
    }
  }
  
  /**
   * Processes a webhook event from Bland.ai
   * @test: Should process different webhook event types
   */
  async processWebhookEvent(event) {
    const eventType = event.type;
    const callId = event.call_id;
    
    logger.info(`Processing webhook event: ${eventType}`, { callId });
    
    switch (eventType) {
      case 'call.started':
        return this.handleCallStarted(event);
      
      case 'call.ended':
        return this.handleCallEnded(event);
      
