# Email Service

The Email Service is a core component of the Phone Agent system that handles all email communications, including call confirmations, rescheduling notifications, and cancellation notices.

## Overview

The Email Service provides functionality to:

- Send customized emails using templates
- Attach calendar events to emails
- Send call confirmation emails
- Send call rescheduling notifications
- Send call cancellation notifications
- Validate email addresses
- Convert HTML content to plain text

## Configuration

### Environment Variables

The Email Service requires the following environment variables:

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `RESEND_API_KEY` | Your Resend API key | Yes | - |
| `SENDER_EMAIL` | Email address to send from | Yes | `system@aiphone.agent` |
| `SENDER_NAME` | Name to display as the sender | No | `AI Phone Agent` |

### Service Configuration

The Email Service can be configured programmatically:

```typescript
import { EmailService } from '../services/email-service';

const emailService = new EmailService({
  apiKey: 'your_resend_api_key',
  senderEmail: 'noreply@yourdomain.com',
  senderName: 'Your Company Name',
  templatesDir: './templates/email',
  retryCount: 3,
  retryDelay: 1000
});
```

## API Reference

### Send Email

Send a customized email.

```typescript
async sendEmail(params: EmailParams): Promise<any>
```

#### Parameters

The `EmailParams` object includes:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `to` | string | Yes | Recipient email address |
| `subject` | string | Yes | Email subject line |
| `html` | string | No | HTML content of the email |
| `text` | string | No | Plain text content of the email |
| `from` | string | No | Sender email (defaults to configured sender) |
| `replyTo` | string | No | Reply-to email address |
| `attachments` | Array | No | Email attachments |
| `templateName` | string | No | Name of the template to use |
| `variables` | Object | No | Variables to replace in the template |
| `calendarEvent` | string | No | iCalendar event to attach |

#### Returns

```json
{
  "id": "email_abc123",
  "success": true
}
```

#### Example

```typescript
const result = await emailService.sendEmail({
  to: "recipient@example.com",
  subject: "Important Information",
  html: "<h1>Hello!</h1><p>This is an important message.</p>",
  text: "Hello! This is an important message.",
  replyTo: "support@yourdomain.com"
});
```

### Load Template

Load an email template and replace variables.

```typescript
async loadTemplate(templateName: string, variables: Record<string, string> = {}): Promise<string>
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `templateName` | string | Yes | Name of the template to load |
| `variables` | Object | No | Variables to replace in the template |

#### Returns

The processed template as an HTML string.

#### Example

```typescript
const htmlContent = await emailService.loadTemplate('call-confirmation', {
  name: 'John Doe',
  date: 'April 1, 2025',
  time: '2:00 PM',
  duration: '30 minutes',
  topic: 'Product Demo'
});
```

### Send Call Confirmation

Send a call confirmation email.

```typescript
async sendCallConfirmation(to: string, callDetails: {
  recipientName: string;
  recipientEmail?: string;
  formattedDate: string;
  formattedTime: string;
  duration: string;
  topic: string;
  calendarEvent?: string;
}): Promise<any>
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `to` | string | Yes | Recipient email address |
| `callDetails` | Object | Yes | Details of the scheduled call |

#### Returns

```json
{
  "id": "email_abc123",
  "success": true
}
```

#### Example

```typescript
const result = await emailService.sendCallConfirmation(
  "john.doe@example.com",
  {
    recipientName: "John Doe",
    formattedDate: "April 1, 2025",
    formattedTime: "2:00 PM",
    duration: "30 minutes",
    topic: "Product Demo",
    calendarEvent: iCalendarString
  }
);
```

### Send Reschedule Notification

Send a notification about a rescheduled call.

```typescript
async sendRescheduleNotification(to: string, callDetails: {
  recipientName: string;
  recipientEmail?: string;
  formattedDate: string;
  formattedTime: string;
  oldFormattedDate: string;
  oldFormattedTime: string;
  duration: string;
  topic: string;
  calendarEvent?: string;
}, reason?: string): Promise<any>
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `to` | string | Yes | Recipient email address |
| `callDetails` | Object | Yes | Details of the rescheduled call |
| `reason` | string | No | Reason for rescheduling |

#### Returns

```json
{
  "id": "email_abc123",
  "success": true
}
```

#### Example

```typescript
const result = await emailService.sendRescheduleNotification(
  "john.doe@example.com",
  {
    recipientName: "John Doe",
    formattedDate: "April 2, 2025",
    formattedTime: "3:00 PM",
    oldFormattedDate: "April 1, 2025",
    oldFormattedTime: "2:00 PM",
    duration: "30 minutes",
    topic: "Product Demo",
    calendarEvent: updatedICalendarString
  },
  "Scheduling conflict"
);
```

### Send Cancellation Notification

Send a notification about a cancelled call.

```typescript
async sendCancellationNotification(to: string, callDetails: {
  recipientName: string;
  recipientEmail?: string;
  formattedDate: string;
  formattedTime: string;
  duration: string;
  topic: string;
}, reason?: string): Promise<any>
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `to` | string | Yes | Recipient email address |
| `callDetails` | Object | Yes | Details of the cancelled call |
| `reason` | string | No | Reason for cancellation |

#### Returns

```json
{
  "id": "email_abc123",
  "success": true
}
```

#### Example

```typescript
const result = await emailService.sendCancellationNotification(
  "john.doe@example.com",
  {
    recipientName: "John Doe",
    formattedDate: "April 1, 2025",
    formattedTime: "2:00 PM",
    duration: "30 minutes",
    topic: "Product Demo"
  },
  "Customer requested cancellation"
);
```

### Validate Email

Validate an email address.

```typescript
isValidEmail(email: string): boolean
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | Yes | Email address to validate |

#### Returns

`true` if the email is valid, `false` otherwise.

#### Example

```typescript
const isValid = emailService.isValidEmail("john.doe@example.com");
```

### Convert HTML to Plain Text

Convert HTML content to plain text.

```typescript
convertHtmlToPlainText(html: string): string
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `html` | string | Yes | HTML content to convert |

#### Returns

Plain text version of the HTML content.

#### Example

```typescript
const plainText = emailService.convertHtmlToPlainText("<h1>Hello!</h1><p>This is a test.</p>");
// Returns: "Hello! This is a test."
```

## Email Templates

The Email Service includes several built-in templates:

### Call Confirmation Template

Used for confirming scheduled calls.

```html
<h1>Your Call Has Been Scheduled</h1>
<p>Hello {{name}},</p>
<p>Your call has been scheduled for {{date}} at {{time}} for {{duration}} minutes.</p>
<p>Topic: {{topic}}</p>
```

### Call Reschedule Template

Used for notifying about rescheduled calls.

```html
<h1>Your Call Has Been Rescheduled</h1>
<p>Hello {{name}},</p>
<p>Your call originally scheduled for {{oldDate}} at {{oldTime}} has been rescheduled.</p>
<p>New date: {{newDate}} at {{newTime}} for {{duration}} minutes.</p>
<p>Topic: {{topic}}</p>
<p>Reason: {{reason}}</p>
```

### Call Cancellation Template

Used for notifying about cancelled calls.

```html
<h1>Your Call Has Been Cancelled</h1>
<p>Hello {{name}},</p>
<p>Your call scheduled for {{date}} at {{time}} has been cancelled.</p>
<p>Topic: {{topic}}</p>
<p>Reason: {{reason}}</p>
```

## Calendar Event Attachments

The Email Service can attach iCalendar (.ics) files to emails, which allows recipients to add events to their calendar applications.

To attach a calendar event:

```typescript
import { calendarService } from './calendar-service';

// Generate a calendar event
const calendarEvent = calendarService.createCallEvent({
  scheduledTime: new Date('2025-04-01T14:00:00Z'),
  durationMinutes: 30,
  topic: "Product Demo",
  description: "Scheduled product demonstration call",
  phoneNumber: "+15551234567",
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

The Email Service implements comprehensive error handling:

- Email validation errors are caught and reported
- Template loading errors are caught and reported
- API errors from Resend are caught and transformed into appropriate `AppError` instances
- Network errors are caught and reported

## Integration with Other Services

The Email Service integrates with:

- **Calendar Service**: To attach calendar events to emails
- **Bland.ai Service**: To send notifications about call status changes

## Best Practices

1. **Templates**: Use templates for consistent email formatting
2. **Plain Text**: Always provide a plain text alternative for HTML emails
3. **Validation**: Validate email addresses before sending
4. **Error Handling**: Always handle potential errors when sending emails
5. **Testing**: Test email templates with various data to ensure proper rendering

## Examples

### Complete Email Workflow

```typescript
import { emailService } from '../services/email-service';
import { calendarService } from '../services/calendar-service';

async function sendCallConfirmationWithCalendar(callData) {
  try {
    // Format date and time for display
    const formattedDate = formatDate(callData.scheduledTime);
    const formattedTime = formatTime(callData.scheduledTime);
    
    // Generate calendar event
    const calendarEvent = calendarService.createCallEvent({
      scheduledTime: callData.scheduledTime,
      durationMinutes: callData.duration,
      topic: callData.topic,
      description: `Scheduled call about: ${callData.topic}`,
      phoneNumber: callData.phoneNumber,
      recipientName: callData.recipientName,
      recipientEmail: callData.recipientEmail
    });
    
    // Send confirmation email with calendar attachment
    const result = await emailService.sendCallConfirmation(
      callData.recipientEmail,
      {
        recipientName: callData.recipientName,
        recipientEmail: callData.recipientEmail,
        formattedDate,
        formattedTime,
        duration: `${callData.duration} minutes`,
        topic: callData.topic,
        calendarEvent
      }
    );
    
    return result;
  } catch (error) {
    console.error("Failed to send call confirmation:", error);
    throw error;
  }
}