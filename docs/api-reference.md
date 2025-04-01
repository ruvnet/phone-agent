# API Reference

This document provides detailed information about the Phone Agent API endpoints, request/response formats, and authentication methods.

## Base URL

When deployed, the API is available at:

```
https://your-app-name.pages.dev/api
```

For local development, the base URL is:

```
http://localhost:8788/api
```

## Authentication

API endpoints that require authentication use a token-based authentication method. Include the token in the `Authorization` header:

```
Authorization: Bearer YOUR_API_TOKEN
```

## API Endpoints

### Info Endpoint

Returns basic information about the API.

- **URL**: `/api`
- **Method**: `GET`
- **Authentication**: None

#### Response

```json
{
  "name": "Phone Agent API",
  "version": "1.0.0",
  "status": "operational"
}
```

### Webhook Endpoint

Receives webhooks from Resend, processes them, and forwards them to the target webhook.

- **URL**: `/api/webhook`
- **Method**: `POST`
- **Authentication**: Signature-based (Resend webhook signature)
- **Headers**:
  - `Resend-Signature`: Signature from Resend
  - `Resend-Timestamp`: Timestamp of the webhook
  - `Content-Type`: `application/json`

#### Request Body

The request body should be a valid Resend webhook payload. Example:

```json
{
  "type": "email.sent",
  "data": {
    "id": "email_id",
    "object": "email",
    "to": ["recipient@example.com"],
    "from": "sender@example.com",
    "subject": "Hello World",
    "created_at": "2023-04-01T12:00:00.000Z"
  }
}
```

#### Response

**Success Response (200 OK)**:

```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "webhookId": "webhook_id"
}
```

**Error Responses**:

- **401 Unauthorized**: Invalid webhook signature
  ```json
  {
    "success": false,
    "message": "Invalid webhook signature",
    "error": "Signature verification failed"
  }
  ```

- **400 Bad Request**: Invalid payload
  ```json
  {
    "success": false,
    "message": "Invalid webhook payload",
    "error": "Missing required fields"
  }
  ```

- **500 Internal Server Error**: Processing error
  ```json
  {
    "success": false,
    "message": "Error processing webhook",
    "error": "Error details"
  }
  ```

### Schedule Endpoint

Schedules a phone call using Bland.ai.

- **URL**: `/api/schedule`
- **Method**: `POST`
- **Authentication**: Required
- **Headers**:
  - `Authorization`: `Bearer YOUR_API_TOKEN`
  - `Content-Type`: `application/json`

#### Request Body

```json
{
  "phoneNumber": "+15551234567",
  "scheduledTime": "2025-04-01T14:00:00Z",
  "recipientName": "John Doe",
  "recipientEmail": "john.doe@example.com",
  "topic": "Follow-up Discussion",
  "maxDuration": 30,
  "agentId": "optional-agent-id",
  "voiceId": "optional-voice-id",
  "recordCall": true,
  "sendConfirmationEmail": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `phoneNumber` | String | Yes | The phone number to call |
| `scheduledTime` | String | Yes | ISO 8601 formatted date and time |
| `recipientName` | String | Yes | Name of the call recipient |
| `recipientEmail` | String | Yes | Email of the call recipient |
| `topic` | String | No | Topic of the call |
| `maxDuration` | Number | No | Maximum call duration in minutes (default: 30) |
| `agentId` | String | No | Specific Bland.ai agent ID to use |
| `voiceId` | String | No | Specific voice ID to use |
| `recordCall` | Boolean | No | Whether to record the call (default: true) |
| `sendConfirmationEmail` | Boolean | No | Whether to send a confirmation email (default: true) |

#### Response

**Success Response (200 OK)**:

```json
{
  "success": true,
  "callId": "call_id",
  "status": "scheduled",
  "scheduledTime": "2025-04-01T14:00:00Z",
  "estimatedDuration": 30
}
```

**Error Responses**:

- **400 Bad Request**: Invalid request
  ```json
  {
    "success": false,
    "message": "Invalid request",
    "error": "Phone number is required"
  }
  ```

- **401 Unauthorized**: Authentication failed
  ```json
  {
    "success": false,
    "message": "Authentication failed",
    "error": "Invalid API token"
  }
  ```

- **500 Internal Server Error**: Server error
  ```json
  {
    "success": false,
    "message": "Server error",
    "error": "Failed to schedule call"
  }
  ```

## Webhook Events

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

## Error Handling

All API endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error summary",
  "error": "Detailed error message"
}
```

HTTP status codes are used appropriately:
- `200`: Success
- `400`: Bad Request (client error)
- `401`: Unauthorized (authentication failed)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error (server error)

## Rate Limiting

API endpoints may be subject to rate limiting. When rate limited, the API will respond with a `429 Too Many Requests` status code.

## API Versioning

The current API version is v1. The version is implicit in the current implementation.

Future API versions will be accessible via URL path versioning (e.g., `/api/v2/webhook`).