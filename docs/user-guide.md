# User Guide

This comprehensive guide explains how to use the Phone Agent system for scheduling automated phone calls, managing email notifications, and handling calendar events.

## Getting Started

### Overview

The Phone Agent system allows you to:

- Schedule automated phone calls using AI voice technology
- Send email notifications for call scheduling, rescheduling, and cancellations
- Generate calendar events for scheduled calls
- Process email-related webhooks

### Access Requirements

To use the Phone Agent, you'll need:

- Access credentials for the Phone Agent API
- A Bland.ai account with API access
- A Resend account for email functionality
- Appropriate webhook endpoints configured

## Scheduling Phone Calls

### Basic Call Scheduling

To schedule a phone call:

1. Prepare the call details:
   - Recipient's phone number
   - Scheduled date and time
   - Recipient's name and email
   - Call topic or purpose
   - Call duration (optional, defaults to 30 minutes)

2. Make a request to the scheduling API:

```bash
curl -X POST https://your-app-name.pages.dev/api/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -d '{
    "phoneNumber": "+15551234567",
    "scheduledTime": "2025-04-01T14:00:00Z",
    "recipientName": "John Doe",
    "recipientEmail": "john.doe@example.com",
    "topic": "Follow-up Discussion",
    "maxDuration": 30,
    "recordCall": true,
    "sendConfirmationEmail": true
  }'
```

3. The system will:
   - Schedule the call with Bland.ai
   - Send a confirmation email to the recipient
   - Attach a calendar event to the email

### Advanced Call Scheduling

For more advanced call scheduling, you can include additional parameters:

- **Agent Configuration**: Customize the AI agent's behavior
- **Voice Selection**: Choose a specific voice for the call
- **Custom Webhook**: Specify a custom webhook for call status updates
- **Agent Instructions**: Provide specific instructions for the call

Example:

```bash
curl -X POST https://your-app-name.pages.dev/api/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -d '{
    "phoneNumber": "+15551234567",
    "scheduledTime": "2025-04-01T14:00:00Z",
    "recipientName": "John Doe",
    "recipientEmail": "john.doe@example.com",
    "topic": "Product Demo",
    "maxDuration": 45,
    "recordCall": true,
    "sendConfirmationEmail": true,
    "voiceId": "voice_abc123",
    "agentConfig": {
      "name": "Sales Representative",
      "goals": [
        "Demonstrate product features",
        "Answer customer questions",
        "Collect feedback"
      ],
      "constraints": [
        "Be polite and professional",
        "Respect the customer's time",
        "Do not make unrealistic promises"
      ]
    },
    "webhookUrl": "https://your-custom-webhook.com/call-updates"
  }'
```

## Managing Scheduled Calls

### Viewing Call Details

To view details of a scheduled call:

```bash
curl -X GET https://your-app-name.pages.dev/api/calls/CALL_ID \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

This will return detailed information about the call, including:
- Call status
- Scheduled time
- Recipient information
- Call duration
- Recording and transcript URLs (if available)

### Rescheduling Calls

To reschedule a call:

```bash
curl -X POST https://your-app-name.pages.dev/api/calls/CALL_ID/reschedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -d '{
    "newScheduledTime": "2025-04-02T15:00:00Z",
    "reason": "Scheduling conflict",
    "sendNotification": true
  }'
```

The system will:
- Reschedule the call with Bland.ai
- Send a rescheduling notification to the recipient
- Attach an updated calendar event to the email

### Cancelling Calls

To cancel a scheduled call:

```bash
curl -X POST https://your-app-name.pages.dev/api/calls/CALL_ID/cancel \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -d '{
    "reason": "No longer needed",
    "sendNotification": true
  }'
```

The system will:
- Cancel the call with Bland.ai
- Send a cancellation notification to the recipient

## Email Notifications

### Call Confirmation Emails

When a call is scheduled, the system can send a confirmation email to the recipient. This email includes:

- Call details (date, time, duration, topic)
- Calendar attachment (.ics file) for easy scheduling
- Personalized greeting with the recipient's name

Example confirmation email:

```
Subject: Your Call Has Been Scheduled

Hello John,

Your call has been scheduled for April 1, 2025 at 2:00 PM for 30 minutes.

Topic: Follow-up Discussion

Please find attached a calendar invitation for this call.

Best regards,
AI Phone Agent
```

### Rescheduling Notifications

When a call is rescheduled, the system can send a notification email to the recipient. This email includes:

- Original call details
- New call details
- Reason for rescheduling
- Updated calendar attachment

Example rescheduling email:

```
Subject: Your Call Has Been Rescheduled

Hello John,

Your call originally scheduled for April 1, 2025 at 2:00 PM has been rescheduled.

New date: April 2, 2025 at 3:00 PM for 30 minutes.

Topic: Follow-up Discussion

Reason: Scheduling conflict

Please find attached an updated calendar invitation for this call.

Best regards,
AI Phone Agent
```

### Cancellation Notifications

When a call is cancelled, the system can send a notification email to the recipient. This email includes:

- Original call details
- Reason for cancellation

Example cancellation email:

```
Subject: Your Call Has Been Cancelled

Hello John,

Your call scheduled for April 1, 2025 at 2:00 PM has been cancelled.

Topic: Follow-up Discussion

Reason: No longer needed

Best regards,
AI Phone Agent
```

## Calendar Integration

### Calendar Events

The Phone Agent generates iCalendar (.ics) files for scheduled calls. These files can be opened by most calendar applications, including:

- Google Calendar
- Microsoft Outlook
- Apple Calendar
- Yahoo Calendar

The calendar events include:

- Event title (call topic)
- Start and end times
- Phone number information
- Organizer and attendee information

### Adding Events to Your Calendar

When you receive an email with a calendar attachment:

1. Open the email
2. Click on the calendar attachment (.ics file)
3. Your calendar application should open automatically
4. Review the event details
5. Click "Add to Calendar" or equivalent
6. The event will be added to your calendar with appropriate reminders

## Call Recordings and Transcripts

### Accessing Call Recordings

After a call is completed, you can access the recording (if enabled):

```bash
curl -X GET https://your-app-name.pages.dev/api/calls/CALL_ID/recording \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

This will return a URL where you can download or stream the call recording.

### Accessing Call Transcripts

After a call is completed, you can access the transcript (if available):

```bash
curl -X GET https://your-app-name.pages.dev/api/calls/CALL_ID/transcript \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

This will return the transcript of the call in text format.

## Webhook Integration

### Setting Up Webhooks

To receive updates about email events, you can set up webhooks in your Resend account:

1. Log in to your [Resend Dashboard](https://resend.com/dashboard)
2. Navigate to **Webhooks** in the sidebar
3. Click **Add Webhook**
4. Enter the URL of your Phone Agent webhook endpoint:
   ```
   https://your-app-name.pages.dev/api/webhook
   ```
5. Select the events you want to receive
6. Save the webhook configuration
7. Copy the signing secret provided by Resend

### Webhook Events

The Phone Agent processes the following webhook events from Resend:

| Event Type | Description |
|------------|-------------|
| `email.sent` | Triggered when an email is sent |
| `email.delivered` | Triggered when an email is delivered |
| `email.delivery_delayed` | Triggered when email delivery is delayed |
| `email.complained` | Triggered when a recipient marks the email as spam |
| `email.bounced` | Triggered when an email bounces |
| `email.opened` | Triggered when an email is opened |
| `email.clicked` | Triggered when a link in an email is clicked |

### Webhook Security

Webhooks are secured using signature verification:

1. Resend includes a signature in the `Resend-Signature` header
2. The Phone Agent verifies this signature using your webhook signing secret
3. If the signature is valid, the webhook is processed
4. If the signature is invalid, the webhook is rejected

## Troubleshooting

### Common Issues

#### Call Scheduling Failures

**Issue**: Call scheduling fails with an error.

**Solution**:
- Verify that the phone number is in the correct format (E.164 format recommended: +15551234567)
- Ensure the scheduled time is in the future
- Check that all required fields are provided
- Verify your API key and permissions

#### Email Delivery Issues

**Issue**: Confirmation emails are not being delivered.

**Solution**:
- Check that the recipient email address is valid
- Verify your Resend API key and permissions
- Check your email logs in the Resend dashboard
- Ensure your domain has proper DKIM/SPF records

#### Webhook Processing Issues

**Issue**: Webhooks are not being processed.

**Solution**:
- Verify that the webhook URL is correct and accessible
- Check that the webhook signing secret is correctly configured
- Ensure the webhook payload format matches what's expected
- Check your webhook logs for specific error messages

### Getting Help

If you encounter issues that you cannot resolve:

1. Check the [Troubleshooting Guide](./troubleshooting.md) for more detailed solutions
2. Contact support at support@yourdomain.com
3. Provide detailed information about the issue, including:
   - Error messages
   - Request payloads
   - Timestamps
   - Any relevant logs or IDs

## Best Practices

### Call Scheduling

- Schedule calls at least 15 minutes in the future to allow for processing
- Provide clear and specific topics for calls
- Keep call durations reasonable (15-45 minutes recommended)
- Test with non-production phone numbers before using in production

### Email Notifications

- Ensure recipient email addresses are valid and verified
- Use clear and descriptive subject lines
- Include all relevant information in the email body
- Test email templates with various data to ensure proper rendering

### Security

- Keep your API tokens and webhook secrets secure
- Regularly rotate your API tokens
- Use HTTPS for all API requests
- Validate and sanitize all input data
- Monitor for unusual activity or unauthorized access attempts

## Glossary

- **API Token**: Authentication token used to access the Phone Agent API
- **Bland.ai**: AI-powered phone call service used by Phone Agent
- **Call ID**: Unique identifier for a scheduled call
- **iCalendar**: Standard format for calendar data exchange (.ics files)
- **Resend**: Email delivery service used by Phone Agent
- **Webhook**: HTTP callback that delivers real-time notifications
- **Webhook Signature**: Cryptographic signature used to verify webhook authenticity