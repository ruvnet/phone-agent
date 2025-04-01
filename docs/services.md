# Services Overview

This document provides an overview of the core services that power the Phone Agent system.

## Service Architecture

The Phone Agent follows a service-oriented architecture where each service is responsible for a specific domain of functionality. Services are designed to be:

- **Modular**: Each service has a specific responsibility
- **Reusable**: Services can be used across different parts of the application
- **Testable**: Services can be tested in isolation
- **Maintainable**: Services encapsulate their implementation details

## Core Services

### Bland.ai Service

The [Bland.ai Service](./services/bland-service.md) manages phone call scheduling and status tracking using the Bland.ai platform.

**Key Responsibilities**:
- Schedule automated phone calls
- Retrieve call details and status
- Cancel or reschedule existing calls
- Process webhook events from Bland.ai
- Track call progress and outcomes

**Key Features**:
- Customizable call parameters
- Call status tracking
- Recording and transcript access
- Webhook event processing

### Email Service

The [Email Service](./services/email-service.md) handles all email communications, including notifications for call scheduling, rescheduling, and cancellations.

**Key Responsibilities**:
- Send customized emails using templates
- Attach calendar events to emails
- Send call confirmation emails
- Send call rescheduling notifications
- Send call cancellation notifications

**Key Features**:
- Email templating
- Calendar event attachments
- Email validation
- HTML and plain text support

### Calendar Service

The [Calendar Service](./services/calendar-service.md) manages calendar-related functionality, including generating iCalendar events and parsing calendar data.

**Key Responsibilities**:
- Generate iCalendar (.ics) files for scheduled calls
- Parse iCalendar content into structured event objects
- Extract dial-in information from calendar descriptions
- Extract conference details from calendar descriptions

**Key Features**:
- iCalendar generation
- Calendar event parsing
- Conference detail extraction
- Timezone handling

### Storage Service

The Storage Service provides data persistence capabilities for the Phone Agent system.

**Key Responsibilities**:
- Store call data
- Retrieve call data
- Store failed webhook payloads
- Manage data expiration

**Key Features**:
- Key-value storage
- Data expiration policies
- Error handling
- Retry mechanisms

### Agent Scheduling Service

The Agent Scheduling Service coordinates the scheduling of agent calls.

**Key Responsibilities**:
- Manage agent availability
- Coordinate call scheduling
- Handle scheduling conflicts
- Optimize agent utilization

**Key Features**:
- Availability checking
- Conflict resolution
- Schedule optimization
- Agent assignment

## Service Interactions

The services interact with each other to provide complete functionality:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Bland.ai       │────▶│  Storage        │────▶│  Email          │
│  Service        │     │  Service        │     │  Service        │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                        │                       │
        │                        │                       │
        ▼                        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Agent          │────▶│  Calendar       │────▶│  Webhook        │
│  Scheduling     │     │  Service        │     │  Processing     │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Example Workflow: Call Scheduling

1. **Agent Scheduling Service** checks agent availability
2. **Bland.ai Service** schedules the call
3. **Calendar Service** generates a calendar event
4. **Email Service** sends a confirmation email with the calendar attachment
5. **Storage Service** stores the call details

### Example Workflow: Webhook Processing

1. **Webhook Handler** receives a webhook from Resend
2. **Security Utils** verify the webhook signature
3. **Webhook Transformer** transforms the payload
4. **Webhook Forwarder** forwards the webhook to the target endpoint
5. **Storage Service** stores failed webhooks (if applicable)

## Service Configuration

Each service can be configured through environment variables and/or programmatic configuration:

### Environment Variables

Services read their configuration from environment variables:

```
# Bland.ai Service
BLAND_AI_API_KEY=your_api_key
BLAND_AI_AGENT_ID=your_agent_id

# Email Service
RESEND_API_KEY=your_resend_api_key
SENDER_EMAIL=your_sender_email
SENDER_NAME=Your Sender Name

# Calendar Service
DEFAULT_TIMEZONE=UTC

# Storage Service
STORE_FAILED_PAYLOADS=true
```

### Programmatic Configuration

Services can also be configured programmatically:

```typescript
import { BlandAiService } from '../services/bland-service';
import { EmailService } from '../services/email-service';
import { CalendarService } from '../services/calendar-service';

// Configure Bland.ai Service
const blandService = new BlandAiService({
  apiKey: 'your_api_key',
  agentId: 'your_agent_id',
  baseUrl: 'https://api.bland.ai',
  maxCallDuration: 30
});

// Configure Email Service
const emailService = new EmailService({
  apiKey: 'your_resend_api_key',
  senderEmail: 'noreply@yourdomain.com',
  senderName: 'Your Company Name'
});

// Configure Calendar Service
const calendarService = new CalendarService({
  timezone: 'America/New_York'
});
```

## Service Implementation

Services are implemented as TypeScript classes with clear interfaces:

```typescript
export class ExampleService {
  private config: ExampleServiceConfig;
  
  constructor(options: ExampleServiceConfig = {}) {
    // Initialize configuration with defaults and options
    this.config = {
      ...defaultConfig,
      ...options
    };
  }
  
  async performAction(params: ActionParams): Promise<ActionResult> {
    // Implementation
  }
  
  // Other methods...
}

// Create and export a singleton instance
export const exampleService = new ExampleService();
```

## Error Handling

Services implement comprehensive error handling:

- **AppError Class**: Custom error class with error codes and messages
- **Error Categorization**: Errors are categorized for appropriate handling
- **Retry Logic**: Automatic retry for transient errors
- **Logging**: Detailed error logging for debugging

Example error handling:

```typescript
try {
  // Perform an operation that might fail
  const result = await someOperation();
  return result;
} catch (error) {
  if (error instanceof AppError) {
    // Handle known application errors
    logger.error(`Application error: ${error.message}`, { code: error.code });
    throw error;
  } else if (axios.isAxiosError(error)) {
    // Handle API errors
    const status = error.response?.status;
    const errorData = error.response?.data;
    
    if (status === 429) {
      throw new AppError('Rate limit exceeded. Please try again later.', 429);
    } else if (status === 401) {
      throw new AppError('Authentication failed. Please check your API key.', 401);
    }
  }
  
  // Handle unknown errors
  logger.error(`Unknown error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  throw new AppError(`Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
}
```

## Testing Services

Services are designed to be easily testable:

- **Mock Implementations**: Mock versions of services for testing
- **Dependency Injection**: Services accept dependencies for easier testing
- **Interface-Based Design**: Services implement interfaces for easier mocking

Example test for a service:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmailService } from '../../src/services/email-service';

describe('EmailService', () => {
  let emailService: EmailService;
  
  beforeEach(() => {
    // Create a new instance for each test
    emailService = new EmailService({
      apiKey: 'test-api-key',
      senderEmail: 'test@example.com',
      senderName: 'Test Sender'
    });
    
    // Mock external dependencies
    vi.spyOn(emailService as any, 'sendWithResend').mockResolvedValue({
      id: 'test-email-id',
      success: true
    });
  });
  
  it('should send an email', async () => {
    const result = await emailService.sendEmail({
      to: 'recipient@example.com',
      subject: 'Test Email',
      text: 'This is a test email'
    });
    
    expect(result).toEqual({
      id: 'test-email-id',
      success: true
    });
    expect(emailService as any).sendWithResend).toHaveBeenCalledWith({
      from: 'Test Sender <test@example.com>',
      to: 'recipient@example.com',
      subject: 'Test Email',
      text: 'This is a test email'
    });
  });
});
```

## Service Documentation

Each service has detailed documentation:

- **API Reference**: Detailed documentation of methods and parameters
- **Configuration Options**: Available configuration options
- **Examples**: Usage examples for common scenarios
- **Error Handling**: Information about error handling
- **Integration**: How the service integrates with other services

## Best Practices for Using Services

1. **Use Singleton Instances**: Use the exported singleton instances when possible
2. **Handle Errors**: Always handle potential errors from service methods
3. **Validate Inputs**: Validate inputs before passing them to services
4. **Use TypeScript Interfaces**: Use the provided TypeScript interfaces for type safety
5. **Follow Examples**: Refer to the examples in the documentation

## Extending Services

To extend or customize a service:

1. **Subclass the Service**: Create a subclass that extends the base service
2. **Override Methods**: Override specific methods to customize behavior
3. **Add New Methods**: Add new methods for additional functionality
4. **Create a New Instance**: Create and export a new instance of your extended service

Example:

```typescript
import { EmailService } from '../services/email-service';

class CustomEmailService extends EmailService {
  constructor(options = {}) {
    super(options);
  }
  
  // Override an existing method
  async sendEmail(params) {
    // Custom logic before sending
    console.log('Sending custom email:', params);
    
    // Call the parent method
    return super.sendEmail(params);
  }
  
  // Add a new method
  async sendCustomNotification(to, subject, content) {
    return this.sendEmail({
      to,
      subject,
      html: `<div class="custom-notification">${content}</div>`,
      text: content
    });
  }
}

// Create and export a singleton instance
export const customEmailService = new CustomEmailService();
```

## Service Monitoring

Services include monitoring capabilities:

- **Logging**: Comprehensive logging of operations
- **Performance Metrics**: Tracking of performance metrics
- **Error Tracking**: Detailed error tracking
- **Health Checks**: Service health monitoring

## Further Reading

- [Bland.ai Service Documentation](./services/bland-service.md)
- [Email Service Documentation](./services/email-service.md)
- [Calendar Service Documentation](./services/calendar-service.md)
- [API Reference](./api-reference.md)
- [Architecture Overview](./architecture.md)