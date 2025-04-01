# API Documentation

This document provides detailed information about the API endpoints available in the AI Phone Agent.

## Base URL

All API endpoints are relative to your Cloudflare Worker URL:

```
https://your-worker-url.workers.dev
```

## Authentication

Currently, the API does not implement authentication. It is recommended to implement an authentication mechanism before exposing the API to public networks.

## Endpoints

### Email Webhook

```
POST /api/email
```

This endpoint receives email webhook events from Resend, extracts calendar attachments, and schedules AI agents for conference calls.

#### Request Headers

| Header          | Description                                |
|-----------------|-------------------------------------------|
| Content-Type    | Must be `application/json`                |

#### Request Body

The request body should contain the email payload from Resend:

```json
{
  "to": "recipient@example.com",
  "from": "sender@example.com",
  "subject": "Meeting Invitation",
  "text": "Please join our meeting.",
  "html": "<p>Please join our meeting.</p>",
  "attachments": [
    {
      "filename": "invite.ics",
      "content": "BASE64_ENCODED_CALENDAR_CONTENT",
      "contentType": "text/calendar"
    }
  ]
}
```

#### Response

**Success Response (200 OK)**

```json
{
  "status": "success",
  "callId": "call_abc123",
  "scheduledTime": "2023-12-31T12:00:00Z"
}
```

**No Calendar Attachment (200 OK)**

```json
{
  "status": "no_calendar_attachment"
}
```

**No Events Found (200 OK)**

```json
{
  "status": "no_events_found"
}
```

**No Dial-In Found (200 OK)**

```json
{
  "status": "no_dial_in_found"
}
```

**Error Response (4xx/5xx)**

```json
{
  "status": "error",
  "error": "Error message"
}
```

### Bland.ai Webhook

```
POST /api/bland/webhook
```

This endpoint receives webhook events from Bland.ai and updates call status in storage.

#### Request Headers

| Header          | Description                                |
|-----------------|-------------------------------------------|
| Content-Type    | Must be `application/json`                |
| X-Bland-Signature | Signature for webhook verification (if configured) |

#### Request Body

The request body contains the webhook event from Bland.ai:

```json
{
  "type": "call.started",
  "call_id": "call_abc123",
  "timestamp": "2023-12-31T12:00:00Z",
  "data": {
    "duration_estimate": 1800
  }
}
```

Common event types:
- `call.started`: Call has started
- `call.ended`: Call has completed
- `call.failed`: Call failed to connect

#### Response

**Success Response (200 OK)**

```json
{
  "status": "success",
  "result": {
    "success": true,
    "message": "Call status updated to in_progress"
  }
}
```

**Error Response (4xx/5xx)**

```json
{
  "status": "error",
  "error": "Error message"
}
```

### Schedule Call

```
POST /api/schedule
```

This endpoint allows manual scheduling of calls with the AI agent.

#### Request Headers

| Header          | Description                                |
|-----------------|-------------------------------------------|
| Content-Type    | Must be `application/json`                |

#### Request Body

```json
{
  "phoneNumber": "+1234567890",
  "scheduledTime": "2023-12-31T12:00:00Z",
  "duration": 30,
  "topic": "Project Discussion",
  "recipientName": "John Doe",
  "recipientEmail": "john@example.com",
  "task": "Join the project discussion call",
  "goal": "Provide updates on project status and answer questions"
}
```

| Field           | Type   | Required | Description                                |
|-----------------|--------|----------|--------------------------------------------|
| phoneNumber     | string | Yes      | Phone number to call (E.164 format)        |
| scheduledTime   | string | Yes      | ISO 8601 formatted date and time           |
| duration        | number | No       | Call duration in minutes (default: 30)     |
| topic           | string | No       | Call topic or subject                      |
| recipientName   | string | No       | Name of the recipient                      |
| recipientEmail  | string | No       | Email of the recipient for notifications   |
| task            | string | No       | Specific task for the AI agent             |
| goal            | string | No       | Goal or objective for the call             |

#### Response

**Success Response (200 OK)**

```json
{
  "status": "success",
  "callId": "call_abc123",
  "scheduledTime": "2023-12-31T12:00:00Z"
}
```

**Error Response (400 Bad Request)**

```json
{
  "status": "error",
  "error": "Missing required fields: phoneNumber and scheduledTime are required"
}
```

**Error Response (4xx/5xx)**

```json
{
  "status": "error",
  "error": "Error message"
}
```

### Health Check

```
GET /api/health
```

This endpoint provides a simple health check to verify the worker is running.

#### Response

**Success Response (200 OK)**

```json
{
  "status": "ok"
}
```

## Error Handling

All API endpoints follow a consistent error handling pattern:

1. Client errors (4xx) indicate problems with the request that the client should fix
2. Server errors (5xx) indicate problems on the server side
3. All error responses include a descriptive error message

Example error response:

```json
{
  "status": "error",
  "error": "Specific error message"
}
```

## Rate Limiting

Currently, the API does not implement rate limiting. It is recommended to configure rate limiting at the Cloudflare level to prevent abuse.

## Webhook Integration

### Setting Up Resend Webhook

1. Log in to your Resend dashboard
2. Navigate to the Webhooks section
3. Create a new webhook with the following settings:
   - URL: `https://your-worker-url.workers.dev/api/email`
   - Events: Select email events you want to receive
   - Format: JSON

### Setting Up Bland.ai Webhook

1. Log in to your Bland.ai dashboard
2. Navigate to the API settings
3. Configure the webhook URL:
   - URL: `https://your-worker-url.workers.dev/api/bland/webhook`
   - Secret: Set a secure webhook secret
4. Update the `BLAND_AI_WEBHOOK_SECRET` environment variable with the same secret

## Example API Usage

### Scheduling a Call (cURL)

```bash
curl -X POST https://your-worker-url.workers.dev/api/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "scheduledTime": "2023-12-31T12:00:00Z",
    "duration": 30,
    "topic": "Project Discussion",
    "recipientName": "John Doe",
    "recipientEmail": "john@example.com"
  }'
```

### Scheduling a Call (JavaScript)

```javascript
async function scheduleCall() {
  const response = await fetch('https://your-worker-url.workers.dev/api/schedule', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      phoneNumber: '+1234567890',
      scheduledTime: '2023-12-31T12:00:00Z',
      duration: 30,
      topic: 'Project Discussion',
      recipientName: 'John Doe',
      recipientEmail: 'john@example.com'
    })
  });
  
  const data = await response.json();
  console.log(data);
}
```

## Future API Enhancements

Planned enhancements for the API include:

1. Authentication and authorization
2. Rate limiting
3. Additional endpoints for call management:
   - GET /api/calls - List scheduled calls
   - GET /api/calls/{callId} - Get call details
   - PUT /api/calls/{callId}/reschedule - Reschedule a call
   - DELETE /api/calls/{callId} - Cancel a call
4. Webhook signature verification for enhanced security
5. Pagination for list endpoints
6. Filtering and sorting options