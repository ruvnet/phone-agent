# Webhook Integration Guide

This guide explains how to integrate the Phone Agent with Resend webhooks and how to configure your own webhook endpoints to receive processed events.

## Overview

The Phone Agent acts as a webhook processor that:

1. Receives webhooks from Resend
2. Validates the webhook signature
3. Transforms the payload into a standardized format
4. Forwards the transformed payload to your target webhook endpoint

## Resend Webhook Setup

### Creating a Webhook in Resend

1. Log in to your [Resend Dashboard](https://resend.com/dashboard)
2. Navigate to **Webhooks** in the sidebar
3. Click **Add Webhook**
4. Enter the URL of your Phone Agent webhook endpoint:
   ```
   https://your-app-name.pages.dev/api/webhook
   ```
5. Select the events you want to receive:
   - `email.sent`
   - `email.delivered`
   - `email.delivery_delayed`
   - `email.complained`
   - `email.bounced`
   - `email.opened`
   - `email.clicked`
6. Save the webhook configuration
7. Copy the signing secret provided by Resend

### Configuring the Phone Agent

Add the Resend webhook signing secret to your environment variables:

```
WEBHOOK_SIGNING_SECRET=your_resend_signing_secret
```

## Target Webhook Configuration

### Setting Up Your Target Webhook

The Phone Agent forwards processed webhooks to your target webhook endpoint. Configure your target webhook URL and authentication token in the environment variables:

```
TARGET_WEBHOOK_URL=https://your-target-webhook.com
TARGET_WEBHOOK_AUTH_TOKEN=your_auth_token
```

### Target Webhook Authentication

The Phone Agent adds an `Authorization` header to forwarded webhook requests:

```
Authorization: Bearer your_auth_token
```

Ensure your target webhook endpoint validates this token.

## Webhook Payload Format

### Original Resend Payload

Example of an original Resend webhook payload:

```json
{
  "type": "email.delivered",
  "data": {
    "id": "email_123456",
    "object": "email",
    "to": ["recipient@example.com"],
    "from": "sender@example.com",
    "subject": "Hello World",
    "created_at": "2023-04-01T12:00:00.000Z",
    "delivered_at": "2023-04-01T12:00:05.000Z"
  }
}
```

### Transformed Payload

The Phone Agent transforms the Resend payload into a standardized format:

```json
{
  "id": "webhook_123456",
  "timestamp": 1680350405,
  "eventType": "email.delivered",
  "emailId": "email_123456",
  "recipient": "recipient@example.com",
  "sender": "sender@example.com",
  "subject": "Hello World",
  "metadata": {
    "createdAt": "2023-04-01T12:00:00.000Z",
    "deliveredAt": "2023-04-01T12:00:05.000Z"
  },
  "originalPayload": {
    // Original Resend payload
  }
}
```

## Webhook Signature Verification

The Phone Agent verifies the authenticity of incoming webhooks using the Resend signature.

### How Signature Verification Works

1. Resend includes a signature in the `Resend-Signature` header
2. The signature is created by hashing the request body with the webhook signing secret
3. The Phone Agent recreates this hash and compares it to the provided signature
4. If the signatures match, the webhook is considered valid

### Implementing Your Own Verification

If you need to implement your own verification:

```typescript
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  timestamp: string,
  secret: string
): boolean {
  // Create the signed payload
  const signedPayload = `${timestamp}.${payload}`;
  
  // Create the expected signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  
  // Compare signatures using a timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

## Error Handling and Retries

### Failed Webhook Storage

If a webhook fails to be delivered to your target endpoint, the Phone Agent can store it for later processing. Enable this feature with:

```
STORE_FAILED_PAYLOADS=true
```

### Retry Strategy

The Phone Agent implements an exponential backoff strategy for retrying failed webhook deliveries:

1. First retry: 5 seconds after failure
2. Second retry: 15 seconds after first retry
3. Third retry: 45 seconds after second retry
4. Fourth retry: 2 minutes after third retry
5. Fifth retry: 5 minutes after fourth retry

After five failed attempts, the webhook is marked as permanently failed.

## Debugging Webhooks

Enable webhook debugging to log detailed information about webhook processing:

```
DEBUG_WEBHOOKS=true
```

When debugging is enabled, the Phone Agent logs:
- Incoming webhook details
- Signature verification results
- Transformation process
- Forwarding attempts
- Error details

## Security Best Practices

1. **Keep Secrets Secure**: Store your webhook signing secret securely and never expose it in client-side code
2. **Use HTTPS**: Always use HTTPS for webhook endpoints
3. **Validate All Inputs**: Validate and sanitize all data from webhooks before processing
4. **Implement Rate Limiting**: Protect your webhook endpoints from abuse with rate limiting
5. **Monitor Webhook Activity**: Set up monitoring and alerting for unusual webhook activity

## Troubleshooting

### Common Issues

#### Invalid Signature Errors

- Verify that the correct signing secret is configured
- Check if the webhook was created after the signing secret was last rotated
- Ensure the request body is not modified before verification

#### Webhook Timeout

- Ensure your webhook processing completes within the timeout limit (typically 10 seconds)
- For long-running tasks, acknowledge the webhook quickly and process asynchronously

#### Missing Events

- Verify that you've subscribed to the correct event types in Resend
- Check your logs for any errors in webhook processing
- Ensure your target webhook endpoint is accessible

## Testing Webhooks

### Local Testing

For local testing, you can use tools like [Stripe CLI](https://stripe.com/docs/stripe-cli) or [Smee.io](https://smee.io/) to forward webhooks to your local development environment.

### Webhook Simulation

You can simulate Resend webhooks for testing:

```bash
curl -X POST http://localhost:8788/api/webhook \
  -H "Content-Type: application/json" \
  -H "Resend-Signature: <generated_signature>" \
  -H "Resend-Timestamp: <current_timestamp>" \
  -d '{
    "type": "email.delivered",
    "data": {
      "id": "test_email_id",
      "object": "email",
      "to": ["test@example.com"],
      "from": "sender@example.com",
      "subject": "Test Email",
      "created_at": "2023-04-01T12:00:00.000Z",
      "delivered_at": "2023-04-01T12:00:05.000Z"
    }
  }'
```

To generate a valid signature for testing, you can use this script:

```javascript
const crypto = require('crypto');

function generateSignature(payload, timestamp, secret) {
  const signedPayload = `${timestamp}.${payload}`;
  return crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
}

const payload = JSON.stringify({
  type: "email.delivered",
  data: {
    id: "test_email_id",
    object: "email",
    to: ["test@example.com"],
    from: "sender@example.com",
    subject: "Test Email",
    created_at: "2023-04-01T12:00:00.000Z",
    delivered_at: "2023-04-01T12:00:05.000Z"
  }
});

const timestamp = Math.floor(Date.now() / 1000).toString();
const secret = "your_webhook_signing_secret";
const signature = generateSignature(payload, timestamp, secret);

console.log(`Timestamp: ${timestamp}`);
console.log(`Signature: ${signature}`);