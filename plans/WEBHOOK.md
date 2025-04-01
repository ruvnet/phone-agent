# Webhook Integration Documentation

This document provides detailed information about the webhook integration between Resend and your target system.

## Overview

The webhook integration allows you to receive real-time notifications about email events from Resend and forward them to your own systems. This enables you to build automated workflows, track email performance, and respond to email events in real-time.

## Architecture

The webhook integration uses a Cloudflare Worker as an intermediary between Resend and your target system. This provides several benefits:

1. **Security**: The worker validates webhook signatures to ensure they come from Resend
2. **Transformation**: The worker transforms the webhook payload into a standardized format
3. **Reliability**: The worker implements retry logic for failed webhook deliveries
4. **Monitoring**: The worker provides logging and error tracking

## Webhook Flow

```
┌─────────┐     ┌───────────────────┐     ┌─────────────────┐
│ Resend  │────▶│ Cloudflare Worker │────▶│ Target Webhook  │
└─────────┘     └───────────────────┘     └─────────────────┘
    │                    │                        │
    │                    │                        │
    ▼                    ▼                        ▼
Email Events      Transform Payload       Process Payload
                 Validate Signature
                   Add Auth Token
```

1. Resend sends a webhook to the Cloudflare Worker when an email event occurs
2. The worker validates the webhook signature to ensure it came from Resend
3. The worker transforms the webhook payload into a standardized format
4. The worker adds authentication and forwards the payload to your target webhook
5. Your target webhook processes the payload and responds with a success or error

## Setting Up Resend Webhooks

1. Log in to your Resend account
2. Navigate to the Webhooks section
3. Click "Add Webhook"
4. Enter the URL of your Cloudflare Worker (e.g., `https://your-worker.your-subdomain.workers.dev`)
5. Select the events you want to receive (e.g., `email.sent`, `email.delivered`, etc.)
6. Save the webhook configuration
7. Copy the signing secret for use in your worker configuration

## Configuring the Cloudflare Worker

The worker requires the following environment variables:

- `WEBHOOK_SIGNING_SECRET`: The signing secret from Resend
- `TARGET_WEBHOOK_URL`: The URL of your target webhook
- `TARGET_WEBHOOK_AUTH_TOKEN`: The authentication token for your target webhook
- `DEBUG_WEBHOOKS`: Set to "true" to enable debug logging (optional)
- `STORE_FAILED_PAYLOADS`: Set to "true" to store failed webhook payloads (optional)

You can set these variables in the Cloudflare dashboard or using the Wrangler CLI:

```bash
wrangler secret put WEBHOOK_SIGNING_SECRET
wrangler secret put TARGET_WEBHOOK_URL
wrangler secret put TARGET_WEBHOOK_AUTH_TOKEN
```

## Webhook Payload Format

### Incoming Resend Webhook

```json
{
  "type": "email.sent",
  "created_at": "2023-04-01T12:00:00.000Z",
  "data": {
    "id": "email_123abc",
    "object": "email",
    "created_at": "2023-04-01T12:00:00.000Z",
    "to": ["recipient@example.com"],
    "from": "sender@example.com",
    "subject": "Hello World",
    "html": "<p>Hello World</p>",
    "text": "Hello World",
    "last_event": "sent"
  }
}
```

### Transformed Webhook Payload

```json
{
  "id": "wh_1680350400_abc123",
  "timestamp": 1680350400,
  "source": "resend",
  "eventType": "email.sent",
  "emailId": "email_123abc",
  "emailData": {
    "from": "sender@example.com",
    "to": ["recipient@example.com"],
    "subject": "Hello World",
    "sentAt": "2023-04-01T12:00:00.000Z"
  },
  "eventData": {},
  "metadata": {
    "originalTimestamp": "2023-04-01T12:00:00.000Z"
  }
}
```

## Supported Event Types

The following event types are supported:

- `email.sent`: Triggered when an email is sent
- `email.delivered`: Triggered when an email is delivered
- `email.delivery_delayed`: Triggered when an email delivery is delayed
- `email.complained`: Triggered when a recipient marks an email as spam
- `email.bounced`: Triggered when an email bounces
- `email.opened`: Triggered when a recipient opens an email
- `email.clicked`: Triggered when a recipient clicks a link in an email

## Security Considerations

### Webhook Signatures

Resend signs each webhook request with a signature that you can verify to ensure the webhook came from Resend. The worker automatically validates these signatures using the `WEBHOOK_SIGNING_SECRET` environment variable.

### HTTPS

All communication between Resend, the Cloudflare Worker, and your target webhook should use HTTPS to ensure the data is encrypted in transit.

### Authentication

The worker adds an authentication token to the request to your target webhook using the `TARGET_WEBHOOK_AUTH_TOKEN` environment variable. Your target webhook should validate this token to ensure the request came from the worker.

## Troubleshooting

### Webhook Not Received

If your target webhook is not receiving events:

1. Check the Cloudflare Worker logs for errors
2. Verify that the `TARGET_WEBHOOK_URL` is correct
3. Ensure that the Cloudflare Worker is deployed and running
4. Check that the Resend webhook is configured correctly

### Invalid Signature Errors

If you're seeing invalid signature errors:

1. Verify that the `WEBHOOK_SIGNING_SECRET` matches the secret from Resend
2. Check that the webhook request is not being modified in transit
3. Ensure that the clock on your server is synchronized (time drift can cause signature validation to fail)

### Failed Webhook Deliveries

If webhooks are failing to deliver to your target webhook:

1. Check that your target webhook is accessible from the internet
2. Verify that your target webhook is returning a 2xx status code
3. Ensure that your target webhook can process the payload format
4. Check for any rate limiting or firewall rules that might be blocking the requests

## Monitoring and Logging

The worker logs information about webhook processing, including:

- Webhook received events
- Signature validation results
- Transformation results
- Forwarding results
- Error details

You can view these logs in the Cloudflare dashboard or using the Wrangler CLI:

```bash
wrangler tail
```

## Rate Limiting

Resend may send a large number of webhooks during peak times. Ensure that your target webhook can handle the expected volume of requests. Consider implementing rate limiting or queuing if necessary.

## Further Resources

- [Resend Webhook Documentation](https://resend.com/docs/webhooks)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Webhook Best Practices](https://webhooks.fyi/)