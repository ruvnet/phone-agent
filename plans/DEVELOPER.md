# Developer Documentation

This document provides technical information for developers working on the AI Phone Agent project.

## Architecture Overview

The AI Phone Agent is built as a Cloudflare Worker that integrates with Resend for email processing, Bland.ai for phone agent capabilities, and Cloudflare KV for data storage.

### High-Level Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Email with │     │ AI Phone    │     │  Bland.ai   │
│  Calendar   │────▶│ Agent       │────▶│  Phone      │
│  Attachment │     │ Worker      │     │  Agent      │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          │
                    ┌─────▼─────┐
                    │ Cloudflare│
                    │ KV Storage│
                    └───────────┘
```

### Request Flow

1. **Email Processing**:
   - Resend forwards emails to the `/api/email` endpoint
   - Worker extracts calendar attachments
   - Calendar events are parsed to find dial-in information
   - Bland.ai agent is scheduled to join the call

2. **Webhook Processing**:
   - Bland.ai sends call status updates to `/api/bland/webhook`
   - Worker processes these events and updates call status in KV storage

3. **Manual Scheduling**:
   - API clients can directly schedule calls via `/api/schedule`
   - Worker validates the request and schedules the call with Bland.ai

## Service Descriptions

### Agent Scheduling Service

The Agent Scheduling Service (`agent-scheduling-service.ts`) orchestrates the entire call scheduling process:

- **scheduleAgentCall**: Schedules a new call with Bland.ai, generates a calendar event, sends a confirmation email, and stores call data
- **rescheduleAgentCall**: Reschedules an existing call, updates the calendar event, and sends a notification
- **cancelAgentCall**: Cancels a scheduled call and sends a cancellation notification
- **processAgentCallWebhook**: Processes webhook events from Bland.ai and updates call status

```typescript
// Example usage
import { scheduleAgentCall } from './services/agent-scheduling-service';

const result = await scheduleAgentCall({
  phoneNumber: "+1234567890",
  scheduledTime: new Date("2023-12-31T12:00:00Z"),
  duration: 30,
  recipientName: "John Doe",
  recipientEmail: "john@example.com",
  topic: "Project Discussion"
});
```

### Bland.ai Service

The Bland.ai Service (`bland-service.ts`) handles direct interactions with the Bland.ai API:

- **scheduleCall**: Schedules a call with Bland.ai
- **getCallDetails**: Retrieves details for a specific call
- **cancelCall**: Cancels a scheduled call
- **rescheduleCall**: Reschedules an existing call
- **processWebhookEvent**: Processes webhook events from Bland.ai

```typescript
// Example usage
import { blandAiService } from './services/bland-service';

const callDetails = await blandAiService.scheduleCall({
  phoneNumber: "+1234567890",
  scheduledTime: new Date("2023-12-31T12:00:00Z"),
  maxDuration: 1800, // 30 minutes in seconds
  topic: "Project Discussion"
});
```

### Calendar Service

The Calendar Service (`calendar-service.ts`) handles calendar-related functionality:

- **parseCalendarContent**: Parses iCalendar (.ics) content to extract events
- **createCallEvent**: Generates an iCalendar event for a scheduled call

```typescript
// Example usage
import { calendarService } from './services/calendar-service';

// Parse calendar content
const events = calendarService.parseCalendarContent(icsContent);

// Create calendar event
const calendarEvent = calendarService.createCallEvent({
  scheduledTime: new Date("2023-12-31T12:00:00Z"),
  durationMinutes: 30,
  topic: "Project Discussion",
  phoneNumber: "+1234567890",
  recipientName: "John Doe",
  recipientEmail: "john@example.com"
});
```

### Email Service

The Email Service (`email-service.ts`) handles email communications:

- **sendCallConfirmation**: Sends a confirmation email for a scheduled call
- **sendRescheduleNotification**: Sends a notification when a call is rescheduled
- **sendCancellationNotification**: Sends a notification when a call is cancelled

```typescript
// Example usage
import { emailService } from './services/email-service';

await emailService.sendCallConfirmation(
  "recipient@example.com",
  {
    recipientName: "John Doe",
    formattedDate: "Monday, December 31, 2023",
    formattedTime: "12:00 PM",
    duration: "30 minutes",
    topic: "Project Discussion",
    calendarEvent: icsContent
  }
);
```

### Storage Service

The Storage Service (`storage-service.ts`) handles data persistence using Cloudflare KV:

- **storeCallData**: Stores call data in KV storage
- **getCallData**: Retrieves call data from KV storage
- **updateCallData**: Updates existing call data in KV storage
- **deleteCallData**: Deletes call data from KV storage

```typescript
// Example usage
import { storageService } from './services/storage-service';

// Store call data
await storageService.storeCallData("call_abc123", {
  callId: "call_abc123",
  status: "scheduled",
  scheduledTime: "2023-12-31T12:00:00Z"
});

// Get call data
const callData = await storageService.getCallData("call_abc123");

// Update call data
await storageService.updateCallData("call_abc123", (data) => ({
  ...data,
  status: "completed"
}));
```

## Testing Approach

The project uses Vitest for testing, with tests organized into:

- **Unit Tests**: Test individual functions and components in isolation
- **Integration Tests**: Test interactions between multiple components
- **End-to-End Tests**: Test complete workflows from start to finish

### Test Structure

```
test/
├── setup.ts                 # Test setup and configuration
├── index.spec.ts            # Main worker tests
├── services/                # Service-specific tests
│   ├── bland-service.spec.ts
│   ├── calendar-service.spec.ts
│   ├── email-service.spec.ts
│   └── storage-service.spec.ts
└── integration/             # Integration tests
    ├── bland-agent-scheduling.spec.ts
    ├── email-webhook-flow.spec.ts
    └── error-handling.spec.ts
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- test/services/bland-service.spec.ts

# Run tests with coverage
npm test -- --coverage
```

### Mocking External Services

For testing, external services are mocked to avoid making actual API calls:

```typescript
// Example of mocking Bland.ai API
vi.mock('axios', () => ({
  default: {
    create: () => ({
      post: vi.fn().mockResolvedValue({
        data: {
          call_id: 'mock_call_id',
          status: 'scheduled'
        }
      }),
      get: vi.fn().mockResolvedValue({
        data: {
          call_id: 'mock_call_id',
          status: 'completed'
        }
      })
    })
  },
  isAxiosError: vi.fn().mockReturnValue(false)
}));
```

## How to Contribute

### Development Workflow

1. **Fork the repository**:
   - Create a fork of the repository on GitHub
   - Clone your fork locally

2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**:
   - Follow the coding style and conventions
   - Add tests for new functionality
   - Update documentation as needed

4. **Run tests**:
   ```bash
   npm test
   ```

5. **Submit a pull request**:
   - Push your changes to your fork
   - Create a pull request against the main repository
   - Describe your changes in detail

### Coding Standards

- Use TypeScript for all new code
- Follow the existing code style and formatting
- Use meaningful variable and function names
- Add JSDoc comments for public functions and interfaces
- Keep functions small and focused on a single responsibility

### Pull Request Process

1. Ensure all tests pass
2. Update documentation to reflect any changes
3. Add a clear description of the changes and their purpose
4. Reference any related issues in the pull request description
5. Wait for code review and address any feedback

## Troubleshooting

### Common Issues

1. **API Key Issues**:
   - Ensure all required API keys are set in environment variables
   - Check that API keys have the necessary permissions
   - Verify API keys are valid and not expired

2. **Deployment Issues**:
   - Ensure Wrangler is properly configured
   - Check that KV namespaces are correctly set up
   - Verify environment variables are set in Cloudflare dashboard

3. **Webhook Issues**:
   - Ensure webhook URLs are correctly configured in Resend and Bland.ai
   - Check that webhook secrets match
   - Verify that webhook endpoints are publicly accessible

### Debugging

1. **Local Debugging**:
   - Use `console.log` statements for debugging (removed in production)
   - Run the worker locally with `npm run dev`
   - Use the browser developer tools to inspect requests and responses

2. **Production Debugging**:
   - Check Cloudflare Worker logs in the dashboard
   - Use structured logging with the logger utility
   - Set up alerts for error conditions

## Deployment Process

1. **Testing Environment**:
   - Deploy to a testing environment first
   - Verify functionality in the testing environment
   - Run integration tests against the testing environment

2. **Production Deployment**:
   - Deploy to production using `npm run deploy`
   - Verify functionality in production
   - Monitor for any issues after deployment

3. **Rollback Procedure**:
   - If issues are detected, roll back to the previous version
   - Investigate and fix issues in the testing environment
   - Re-deploy when issues are resolved