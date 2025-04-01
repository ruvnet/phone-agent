# Bland.ai Service

The Bland.ai service is a core component of the Phone Agent system that manages automated phone calls using the [Bland.ai](https://www.bland.ai/) platform.

## Overview

The Bland.ai service provides functionality to:

- Schedule phone calls with customizable parameters
- Retrieve call details and status
- Cancel or reschedule existing calls
- Process webhook events from Bland.ai
- Track call progress and outcomes

## Configuration

### Environment Variables

The Bland.ai service requires the following environment variables:

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `BLAND_AI_API_KEY` | Your Bland.ai API key | Yes | - |
| `BLAND_AI_AGENT_ID` | Your Bland.ai agent ID | Yes | - |
| `BLAND_AI_WEBHOOK_SECRET` | Secret for Bland.ai webhooks | No | - |
| `BLAND_AI_BASE_URL` | Base URL for Bland.ai API | No | `https://api.bland.ai` |
| `MAX_CALL_DURATION` | Maximum call duration in minutes | No | `30` |
| `DEFAULT_VOICE_ID` | Default voice ID to use | No | - |

### Service Configuration

The Bland.ai service can be configured programmatically:

```typescript
import { BlandAiService } from '../services/bland-service';

const blandService = new BlandAiService({
  apiKey: 'your_api_key',
  agentId: 'your_agent_id',
  baseUrl: 'https://api.bland.ai',
  maxCallDuration: 30,
  defaultRetryCount: 3,
  defaultVoiceId: 'your_voice_id',
  retryDelay: 1000
});
```

## API Reference

### Schedule a Call

Schedule a new phone call with Bland.ai.

```typescript
async scheduleCall(options: BlandAiCallOptions): Promise<any>
```

#### Parameters

The `BlandAiCallOptions` object includes:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `phoneNumber` | string | Yes | The phone number to call |
| `scheduledTime` | string \| Date | Yes | When to schedule the call |
| `agentId` | string | No | Specific agent ID (defaults to configured agent) |
| `task` | string | No | Description of the call purpose |
| `maxDuration` | number | No | Maximum call duration in minutes |
| `recipientName` | string | No | Name of the call recipient |
| `recipientEmail` | string | No | Email of the call recipient |
| `topic` | string | No | Topic of the call |
| `scheduledBy` | string | No | Who scheduled the call |
| `agentConfig` | object | No | Configuration for the AI agent |
| `voiceId` | string | No | Specific voice ID to use |
| `webhookUrl` | string | No | URL for call status webhooks |
| `recordCall` | boolean | No | Whether to record the call |

#### Returns

```json
{
  "callId": "call_abc123",
  "status": "scheduled",
  "scheduledTime": "2025-04-01T14:00:00Z",
  "estimatedDuration": 30
}
```

#### Example

```typescript
const result = await blandAiService.scheduleCall({
  phoneNumber: "+15551234567",
  scheduledTime: "2025-04-01T14:00:00Z",
  recipientName: "John Doe",
  recipientEmail: "john.doe@example.com",
  topic: "Follow-up Discussion",
  maxDuration: 30,
  recordCall: true
});
```

### Get Call Details

Retrieve details for a specific call.

```typescript
async getCallDetails(callId: string): Promise<any>
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `callId` | string | Yes | ID of the call to retrieve |

#### Returns

```json
{
  "id": "call_abc123",
  "status": "scheduled",
  "scheduled_time": "2025-04-01T14:00:00Z",
  "estimated_duration": 30
}
```

#### Example

```typescript
const callDetails = await blandAiService.getCallDetails("call_abc123");
```

### Cancel a Call

Cancel a scheduled call.

```typescript
async cancelCall(callId: string, reason?: string): Promise<any>
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `callId` | string | Yes | ID of the call to cancel |
| `reason` | string | No | Reason for cancellation |

#### Returns

```json
{
  "callId": "call_abc123",
  "status": "cancelled",
  "cancelledAt": "2025-04-01T13:00:00Z"
}
```

#### Example

```typescript
const result = await blandAiService.cancelCall(
  "call_abc123", 
  "Customer requested cancellation"
);
```

### Reschedule a Call

Reschedule an existing call to a new time.

```typescript
async rescheduleCall(
  callId: string,
  newScheduledTime: string | Date,
  reason?: string
): Promise<any>
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `callId` | string | Yes | ID of the call to reschedule |
| `newScheduledTime` | string \| Date | Yes | New scheduled time |
| `reason` | string | No | Reason for rescheduling |

#### Returns

```json
{
  "callId": "call_abc123",
  "status": "rescheduled",
  "newScheduledTime": "2025-04-02T14:00:00Z",
  "rescheduledAt": "2025-04-01T13:00:00Z"
}
```

#### Example

```typescript
const result = await blandAiService.rescheduleCall(
  "call_abc123",
  "2025-04-02T14:00:00Z",
  "Scheduling conflict"
);
```

### Process Webhook Event

Process a webhook event from Bland.ai.

```typescript
async processWebhookEvent(event: BlandAiWebhookEvent): Promise<any>
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `event` | BlandAiWebhookEvent | Yes | Webhook event data |

#### Returns

The return value depends on the event type:

For `call.started` events:
```json
{
  "status": "call_started",
  "callId": "call_abc123",
  "timestamp": "2025-04-01T14:00:00Z"
}
```

For `call.ended` events:
```json
{
  "status": "call_ended",
  "callId": "call_abc123",
  "timestamp": "2025-04-01T14:30:00Z"
}
```

For `call.failed` events:
```json
{
  "status": "call_failed",
  "callId": "call_abc123",
  "timestamp": "2025-04-01T14:05:00Z",
  "error": "No answer"
}
```

#### Example

```typescript
const result = await blandAiService.processWebhookEvent({
  type: "call.started",
  call_id: "call_abc123",
  timestamp: "2025-04-01T14:00:00Z",
  data: {}
});
```

## Call Status Types

The Bland.ai service tracks calls with the following status types:

| Status | Description |
|--------|-------------|
| `scheduled` | Call is scheduled for the future |
| `in_progress` | Call is currently in progress |
| `completed` | Call has completed successfully |
| `cancelled` | Call was cancelled before it started |
| `failed` | Call failed to connect or complete |
| `unknown` | Call status could not be determined |

## Call Details Interface

The `BlandAiCallDetails` interface represents a call's complete information:

```typescript
interface BlandAiCallDetails {
  callId: string;
  phoneNumber: string;
  scheduledTime: string;
  status: BlandAiCallStatus;
  topic?: string;
  recipientName?: string;
  recipientEmail?: string;
  agentId?: string;
  voiceId?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  endedAt?: string;
  failedAt?: string;
  failureReason?: string;
  recordingUrl?: string;
  transcriptUrl?: string;
  duration?: number;
  cancelledAt?: string;
}
```

## Webhook Events

The Bland.ai service processes the following webhook events:

| Event Type | Description |
|------------|-------------|
| `call.scheduled` | A call has been scheduled |
| `call.started` | A call has started |
| `call.ended` | A call has ended successfully |
| `call.failed` | A call has failed |
| `call.cancelled` | A call has been cancelled |

## Error Handling

The Bland.ai service implements comprehensive error handling:

- API errors are caught and transformed into appropriate `AppError` instances
- Rate limiting errors (429) are specifically handled
- Authentication errors (401) are specifically handled
- Scheduling conflicts (400 with specific error message) are specifically handled
- Network errors are caught and reported

## Integration with Other Services

The Bland.ai service integrates with:

- **Storage Service**: To store and retrieve call data
- **Email Service**: To send notifications about call status changes
- **Calendar Service**: To manage calendar events for scheduled calls

## Best Practices

1. **Error Handling**: Always handle potential errors when calling Bland.ai service methods
2. **Validation**: Validate phone numbers and scheduled times before calling the service
3. **Webhooks**: Set up proper webhook handling to track call status changes
4. **Monitoring**: Monitor call success rates and durations
5. **Testing**: Use test mode for development and testing

## Examples

### Complete Call Scheduling Flow

```typescript
import { blandAiService } from '../services/bland-service';
import { emailService } from '../services/email-service';
import { calendarService } from '../services/calendar-service';

async function scheduleCustomerCall(customerData) {
  try {
    // Schedule the call
    const callResult = await blandAiService.scheduleCall({
      phoneNumber: customerData.phoneNumber,
      scheduledTime: customerData.preferredTime,
      recipientName: customerData.name,
      recipientEmail: customerData.email,
      topic: "Product Demo",
      maxDuration: 30,
      recordCall: true
    });
    
    // Generate calendar event
    const calendarEvent = calendarService.createCallEvent({
      scheduledTime: customerData.preferredTime,
      durationMinutes: 30,
      topic: "Product Demo",
      description: "Scheduled product demonstration call",
      phoneNumber: customerData.phoneNumber,
      recipientName: customerData.name,
      recipientEmail: customerData.email
    });
    
    // Send confirmation email
    await emailService.sendCallConfirmation(
      customerData.email,
      {
        recipientName: customerData.name,
        recipientEmail: customerData.email,
        formattedDate: formatDate(customerData.preferredTime),
        formattedTime: formatTime(customerData.preferredTime),
        duration: "30 minutes",
        topic: "Product Demo",
        calendarEvent
      }
    );
    
    return callResult;
  } catch (error) {
    console.error("Failed to schedule call:", error);
    throw error;
  }
}