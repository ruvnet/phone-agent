# Testing Guide

This guide provides comprehensive information about testing the Phone Agent system, including testing strategies, frameworks, and best practices.

## Testing Overview

The Phone Agent system employs a multi-layered testing approach to ensure reliability, functionality, and performance:

- **Unit Tests**: Test individual functions and components in isolation
- **Integration Tests**: Test interactions between components
- **End-to-End Tests**: Test complete workflows from start to finish
- **Mock Testing**: Test with simulated external dependencies
- **Performance Testing**: Test system performance under load

## Testing Framework

### Vitest

The Phone Agent uses [Vitest](https://vitest.dev/) as its primary testing framework:

- **Fast Execution**: Vitest is optimized for speed
- **TypeScript Support**: Native TypeScript support
- **ESM Support**: Support for ES modules
- **Watch Mode**: Automatic test re-running on file changes
- **Coverage Reporting**: Built-in code coverage reporting

### Test Directory Structure

Tests are organized in a structured directory hierarchy:

```
/test
├── integration/          # Integration tests
│   ├── bland-agent-scheduling.spec.ts
│   ├── email-webhook-flow.spec.ts
│   └── error-handling.spec.ts
├── mocks/                # Mock implementations
│   ├── agent-scheduling-service.ts
│   ├── bland-service.ts
│   ├── calendar-service.ts
│   ├── config.ts
│   ├── email-service.ts
│   ├── index.ts
│   └── storage-service.ts
├── services/             # Service tests
│   ├── bland-service.spec.ts
│   ├── calendar-service.spec.ts
│   ├── email-service.spec.ts
│   └── storage-service.spec.ts
├── utils/                # Utility tests
│   └── security.spec.ts
├── webhooks/             # Webhook tests
│   ├── forwarder.spec.ts
│   ├── handler.spec.ts
│   └── transformer.spec.ts
├── env.d.ts              # Environment type definitions
├── index.spec.ts         # Main entry point tests
├── setup.ts              # Test setup configuration
└── tsconfig.json         # TypeScript configuration for tests
```

## Running Tests

### Basic Test Commands

Run all tests:

```bash
npm test
```

Run tests in watch mode (for development):

```bash
npm run test:watch
```

Run tests with coverage report:

```bash
npm run test:coverage
```

### Running Specific Tests

Run a specific test file:

```bash
npm test -- webhooks/handler.spec.ts
```

Run tests matching a specific pattern:

```bash
npm test -- -t "webhook verification"
```

## Unit Testing

### Unit Testing Approach

Unit tests focus on testing individual functions and components in isolation:

- Each function is tested independently
- External dependencies are mocked
- Edge cases and error conditions are tested
- Tests are fast and deterministic

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { validateResendPayload } from '../../src/webhooks/transformer';

describe('validateResendPayload', () => {
  it('should return isValid true for valid payload', () => {
    const payload = {
      type: 'email.sent',
      data: {
        id: 'test-id',
        object: 'email'
      }
    };
    
    const result = validateResendPayload(payload);
    
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });
  
  it('should return isValid false for missing data field', () => {
    const payload = {
      type: 'email.sent'
      // Missing data field
    };
    
    const result = validateResendPayload(payload);
    
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Missing required field');
  });
  
  it('should return isValid false for missing type field', () => {
    const payload = {
      // Missing type field
      data: {
        id: 'test-id',
        object: 'email'
      }
    };
    
    const result = validateResendPayload(payload);
    
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Missing required field');
  });
});
```

## Integration Testing

### Integration Testing Approach

Integration tests focus on testing interactions between components:

- Multiple components are tested together
- External dependencies may be mocked
- Focus on component interactions
- Test realistic scenarios

### Integration Test Example

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processWebhook } from '../../src/webhooks/handler';
import { verifyWebhookSignature } from '../../src/utils/security';
import { transformResendWebhook } from '../../src/webhooks/transformer';
import { forwardWebhook } from '../../src/webhooks/forwarder';

// Mock dependencies
vi.mock('../../src/utils/security', () => ({
  verifyWebhookSignature: vi.fn()
}));

vi.mock('../../src/webhooks/transformer', () => ({
  validateResendPayload: vi.fn().mockReturnValue({ isValid: true }),
  transformResendWebhook: vi.fn()
}));

vi.mock('../../src/webhooks/forwarder', () => ({
  forwardWebhook: vi.fn(),
  storeFailedWebhook: vi.fn()
}));

describe('processWebhook integration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  
  it('should process valid webhook successfully', async () => {
    // Arrange
    const requestData = {
      body: JSON.stringify({
        type: 'email.sent',
        data: { id: 'test-id', object: 'email' }
      }),
      headers: {
        'resend-signature': 'valid-signature',
        'resend-timestamp': '1234567890'
      }
    };
    
    const transformedPayload = {
      id: 'webhook-id',
      eventType: 'email.sent',
      emailId: 'test-id',
      timestamp: 1234567890
    };
    
    // Mock signature verification to return valid
    verifyWebhookSignature.mockReturnValue({ isValid: true });
    
    // Mock transformer to return transformed payload
    transformResendWebhook.mockReturnValue(transformedPayload);
    
    // Mock forwarder to return success
    forwardWebhook.mockResolvedValue({
      success: true,
      webhookId: 'webhook-id',
      eventType: 'email.sent',
      timestamp: 1234567890
    });
    
    // Act
    const result = await processWebhook(requestData);
    
    // Assert
    expect(result.success).toBe(true);
    expect(result.webhookId).toBe('webhook-id');
    expect(result.eventType).toBe('email.sent');
    expect(verifyWebhookSignature).toHaveBeenCalledWith(
      requestData.body,
      'valid-signature',
      '1234567890'
    );
    expect(transformResendWebhook).toHaveBeenCalled();
    expect(forwardWebhook).toHaveBeenCalledWith(transformedPayload);
  });
});
```

## Mocking

### Mocking Approach

The Phone Agent uses mocks to simulate external dependencies:

- **Service Mocks**: Mock implementations of services
- **API Mocks**: Mock responses from external APIs
- **Environment Mocks**: Mock environment variables and configuration

### Mock Implementation Example

```typescript
// src/services/__mocks__/email-service.ts
import { EmailParams } from '../../services/email-service';

export class MockEmailService {
  private sentEmails: EmailParams[] = [];
  
  async sendEmail(params: EmailParams): Promise<any> {
    this.sentEmails.push(params);
    return { id: 'mock-email-id', success: true };
  }
  
  async loadTemplate(templateName: string, variables: Record<string, string> = {}): Promise<string> {
    return `Mock template: ${templateName} with variables: ${JSON.stringify(variables)}`;
  }
  
  async sendCallConfirmation(to: string, callDetails: any): Promise<any> {
    return this.sendEmail({
      to,
      subject: 'Your Call Has Been Scheduled',
      text: `Mock confirmation for ${callDetails.recipientName}`
    });
  }
  
  getSentEmails(): EmailParams[] {
    return this.sentEmails;
  }
  
  reset(): void {
    this.sentEmails = [];
  }
}

export const emailService = new MockEmailService();
```

### Using Mocks in Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { emailService } from '../../src/services/__mocks__/email-service';
import { scheduleCall } from '../../src/controllers/schedule-controller';

vi.mock('../../src/services/email-service');

describe('scheduleCall', () => {
  beforeEach(() => {
    // Reset the mock before each test
    (emailService as any).reset();
  });
  
  it('should send confirmation email when call is scheduled', async () => {
    // Arrange
    const request = {
      phoneNumber: '+15551234567',
      scheduledTime: '2025-04-01T14:00:00Z',
      recipientName: 'John Doe',
      recipientEmail: 'john.doe@example.com',
      sendConfirmationEmail: true
    };
    
    // Act
    await scheduleCall(request);
    
    // Assert
    const sentEmails = (emailService as any).getSentEmails();
    expect(sentEmails.length).toBe(1);
    expect(sentEmails[0].to).toBe('john.doe@example.com');
    expect(sentEmails[0].subject).toContain('Scheduled');
  });
});
```

## Test Coverage

### Coverage Metrics

The Phone Agent tracks several coverage metrics:

- **Statement Coverage**: Percentage of statements executed
- **Branch Coverage**: Percentage of branches executed
- **Function Coverage**: Percentage of functions called
- **Line Coverage**: Percentage of lines executed

### Running Coverage Reports

Generate a coverage report:

```bash
npm run test:coverage
```

This will create a coverage report in the `coverage` directory.

### Coverage Thresholds

The project enforces minimum coverage thresholds:

- Statement Coverage: 80%
- Branch Coverage: 75%
- Function Coverage: 80%
- Line Coverage: 80%

## Test-Driven Development (TDD)

The Phone Agent encourages a test-driven development approach:

1. **Write a Test**: Start by writing a test for the functionality
2. **Run the Test**: Verify that the test fails (red)
3. **Implement the Code**: Write the minimum code to pass the test
4. **Run the Test Again**: Verify that the test passes (green)
5. **Refactor**: Improve the code while keeping the tests passing
6. **Repeat**: Continue the cycle for additional functionality

## Testing External Services

### Testing Bland.ai Integration

For testing Bland.ai integration:

- Use mock responses for Bland.ai API calls
- Test different response scenarios (success, error, etc.)
- Verify correct handling of API responses
- Test error handling and retry logic

### Testing Email Functionality

For testing email functionality:

- Use mock implementations of the email service
- Verify email content and formatting
- Test template rendering with different variables
- Verify attachment handling

### Testing Webhook Processing

For testing webhook processing:

- Generate mock webhook payloads
- Test signature verification with valid and invalid signatures
- Verify payload transformation
- Test forwarding to target endpoints

## Continuous Integration Testing

### CI/CD Pipeline

The Phone Agent uses GitHub Actions for continuous integration testing:

- Tests run automatically on pull requests
- Tests run on multiple Node.js versions
- Coverage reports are generated
- Linting is performed
- Build verification is done

### CI Configuration

Example GitHub Actions workflow:

```yaml
name: Test

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
    - run: npm ci
    - run: npm run lint
    - run: npm test
    - run: npm run test:coverage
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
```

## Testing Best Practices

### General Testing Guidelines

1. **Test Independence**: Tests should be independent and not rely on each other
2. **Descriptive Names**: Use descriptive test names that explain what is being tested
3. **Arrange-Act-Assert**: Structure tests with clear arrangement, action, and assertion phases
4. **Single Responsibility**: Each test should test one specific thing
5. **Fast Execution**: Tests should run quickly to enable frequent testing
6. **Deterministic Results**: Tests should produce the same results each time they run
7. **Test Edge Cases**: Include tests for edge cases and error conditions
8. **Avoid Test Logic**: Keep test logic simple and avoid complex conditionals

### Code Quality in Tests

1. **DRY Tests**: Use helper functions and setup/teardown to avoid repetition
2. **Clean Test Data**: Use clear, minimal test data
3. **Avoid Magic Numbers/Strings**: Use constants or variables with descriptive names
4. **Consistent Formatting**: Follow the same code style in tests as in production code
5. **Meaningful Assertions**: Make assertions that verify important behavior

## Troubleshooting Tests

### Common Test Issues

#### Tests Failing Intermittently

**Possible Causes**:
- Time-dependent tests
- Order-dependent tests
- External dependencies
- Race conditions

**Solutions**:
- Make tests time-independent
- Ensure tests are independent
- Mock external dependencies
- Fix race conditions

#### Slow Tests

**Possible Causes**:
- Too many tests
- Inefficient test setup
- External API calls
- Unnecessary operations

**Solutions**:
- Run tests in parallel
- Optimize test setup
- Mock external APIs
- Remove unnecessary operations

#### Mock Issues

**Possible Causes**:
- Incorrect mock implementation
- Mock not being used
- Mock reset issues
- Partial mocking problems

**Solutions**:
- Verify mock implementation
- Check import paths
- Reset mocks between tests
- Use proper partial mocking techniques

## Resources

### Testing Documentation

- [Vitest Documentation](https://vitest.dev/guide/)
- [TypeScript Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Test-Driven Development Guide](https://www.agilealliance.org/glossary/tdd/)

### Testing Tools

- [Vitest](https://vitest.dev/) - Testing framework
- [c8](https://github.com/bcoe/c8) - Coverage reporting
- [Mock Service Worker](https://mswjs.io/) - API mocking
- [Faker.js](https://fakerjs.dev/) - Test data generation