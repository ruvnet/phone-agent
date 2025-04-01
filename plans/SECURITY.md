# Security Guidelines

This document outlines security best practices for the AI Phone Agent application.

## API Key Management

### Best Practices

1. **Never commit API keys to version control**
   - Store API keys in environment variables
   - Use `.dev.vars` for local development (included in `.gitignore`)
   - Use Cloudflare Workers secrets for production

2. **Rotate API keys regularly**
   - Implement a key rotation schedule (e.g., every 90 days)
   - Update keys immediately if a breach is suspected

3. **Use the principle of least privilege**
   - Create API keys with only the permissions needed
   - Use different keys for development and production

4. **Monitor API key usage**
   - Enable logging for API key usage
   - Set up alerts for unusual activity

### Implementation in AI Phone Agent

The application uses environment variables to store sensitive API keys:

```typescript
// Example from utils/config.ts
export function getBlandAiConfig(): BlandAiConfig {
  return {
    apiKey: env.BLAND_AI_API_KEY || '',
    webhookSecret: env.BLAND_AI_WEBHOOK_SECRET || '',
    agentId: env.BLAND_AI_AGENT_ID || '',
    baseUrl: env.BLAND_AI_BASE_URL || 'https://api.bland.ai',
    maxCallDuration: parseInt(env.MAX_CALL_DURATION_MINUTES || '30') * 60,
    defaultRetryCount: parseInt(env.DEFAULT_RETRY_COUNT || '3')
  };
}
```

## Data Privacy Considerations

### Call Data

1. **Minimize data collection**
   - Only collect data necessary for the application to function
   - Define clear data retention policies

2. **Secure data storage**
   - Use Cloudflare KV for storing call data
   - Implement encryption for sensitive data
   - Set appropriate TTL (Time To Live) values for stored data

3. **Data access controls**
   - Implement proper authentication for API endpoints
   - Use HTTPS for all communications
   - Validate input data to prevent injection attacks

### Personal Information

1. **Handle personal information with care**
   - Obtain consent before collecting personal information
   - Provide clear privacy policies
   - Implement data subject access and deletion capabilities

2. **Minimize exposure of personal data**
   - Only include necessary personal information in logs
   - Mask or truncate sensitive data in logs and error reports
   - Implement proper error handling to prevent data leakage

## Security Features Implemented

### Webhook Verification

The application verifies incoming webhooks from Bland.ai using a shared secret:

```typescript
// Example webhook verification (conceptual)
function verifyWebhookSignature(request, secret) {
  const signature = request.headers.get('X-Bland-Signature');
  const payload = await request.text();
  const expectedSignature = computeHmac(payload, secret);
  
  return signature === expectedSignature;
}
```

### Error Handling

Proper error handling prevents leaking sensitive information:

```typescript
// Example from index.ts
try {
  // Process request
} catch (error) {
  logger.error('Error handling request', error);
  
  // Return sanitized error response
  return new Response(
    JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'error'
    }),
    {
      status: error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
```

### Input Validation

All API endpoints validate input data to prevent injection attacks:

```typescript
// Example from handleScheduleRequest
if (!schedulePayload.phoneNumber || !schedulePayload.scheduledTime) {
  return new Response(JSON.stringify({
    status: 'error',
    error: 'Missing required fields: phoneNumber and scheduledTime are required'
  }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

## Security Recommendations

1. **Enable Cloudflare security features**
   - Enable Cloudflare WAF (Web Application Firewall)
   - Configure rate limiting to prevent abuse
   - Use Cloudflare Access for administrative endpoints

2. **Implement monitoring and alerting**
   - Set up logging for security-relevant events
   - Configure alerts for suspicious activities
   - Regularly review logs for security issues

3. **Regular security reviews**
   - Conduct periodic security assessments
   - Keep dependencies up to date
   - Follow security best practices for Cloudflare Workers

4. **Disaster recovery plan**
   - Implement backup procedures for critical data
   - Document incident response procedures
   - Test recovery processes regularly

## Reporting Security Issues

If you discover a security vulnerability in the AI Phone Agent, please report it by sending an email to security@example.com. Please do not disclose security vulnerabilities publicly until they have been addressed by the maintainers.