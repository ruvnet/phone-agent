# Development Guide

This guide provides comprehensive information for developers working on the Phone Agent project, including setup instructions, coding standards, testing procedures, and best practices.

## Development Environment Setup

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18 or later
- **npm**: Usually comes with Node.js
- **Git**: For version control
- **Wrangler CLI**: For local development with Cloudflare Pages
- **Visual Studio Code** (recommended): With TypeScript and ESLint extensions

### Initial Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/phone-agent.git
cd phone-agent
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit the `.env` file with your development credentials.

4. Set up local development environment:

```bash
npm run setup
```

This script will:
- Configure Wrangler for local development
- Create a `.dev.vars` file with your environment variables
- Set up pre-commit hooks for code quality

### Running the Development Server

Start the local development server:

```bash
npm run dev
```

This will start a local server at http://localhost:8788 that simulates the Cloudflare Pages environment.

## Project Structure

The Phone Agent project follows a structured organization:

```
/
├── functions/                # Cloudflare Pages Functions (serverless endpoints)
│   ├── api/                  # API endpoints
│   │   ├── index.js          # API info endpoint
│   │   ├── schedule.js       # Call scheduling endpoint
│   │   └── webhook.js        # Webhook processing endpoint
│   └── static.js             # Static file handler
├── public/                   # Static assets
├── src/
│   ├── config/               # Configuration files
│   │   └── webhook.ts        # Webhook configuration
│   ├── services/             # Core services
│   │   ├── agent-scheduling-service.ts
│   │   ├── bland-service.ts
│   │   ├── calendar-service.ts
│   │   ├── email-service.ts
│   │   ├── index.ts
│   │   └── storage-service.ts
│   ├── types/                # TypeScript type definitions
│   │   ├── bland.ts
│   │   ├── global.d.ts
│   │   └── webhook.ts
│   ├── utils/                # Utility functions
│   │   ├── config.ts
│   │   ├── logger.ts
│   │   └── security.ts
│   └── webhooks/             # Webhook processing logic
│       ├── forwarder.ts
│       ├── handler.ts
│       └── transformer.ts
├── test/                     # Tests
│   ├── integration/          # Integration tests
│   ├── mocks/                # Test mocks
│   ├── services/             # Service tests
│   ├── utils/                # Utility tests
│   └── webhooks/             # Webhook tests
├── _routes.json              # Cloudflare Pages routing configuration
├── package.json              # Project configuration
├── tsconfig.json             # TypeScript configuration
└── wrangler.toml             # Wrangler configuration
```

## Development Workflow

### Feature Development Process

1. **Create a Branch**: Create a new branch for your feature:

```bash
git checkout -b feature/your-feature-name
```

2. **Implement the Feature**: Write the code for your feature, following the coding standards.

3. **Write Tests**: Add tests for your feature in the appropriate test directory.

4. **Run Tests**: Ensure all tests pass:

```bash
npm test
```

5. **Format and Lint**: Format your code and check for linting issues:

```bash
npm run format
npm run lint
```

6. **Commit Changes**: Commit your changes with a descriptive message:

```bash
git add .
git commit -m "Add feature: your feature description"
```

7. **Push Changes**: Push your branch to the remote repository:

```bash
git push origin feature/your-feature-name
```

8. **Create a Pull Request**: Create a pull request for review.

### Code Review Process

All code changes should go through a code review process:

1. **Self-Review**: Review your own code before submitting for review
2. **Peer Review**: Have at least one other developer review your code
3. **Address Feedback**: Address any feedback from the review
4. **Final Approval**: Get final approval before merging

### Continuous Integration

The project uses GitHub Actions for continuous integration:

- **Automated Tests**: All tests are run on pull requests
- **Linting**: Code is linted to ensure quality
- **Build Verification**: The build process is verified
- **Preview Deployments**: Pull requests are deployed to a preview environment

## Coding Standards

### TypeScript Guidelines

- Use TypeScript for all new code
- Define interfaces for all data structures
- Use proper type annotations
- Avoid using `any` type when possible
- Use async/await for asynchronous code

### Naming Conventions

- **Files**: Use kebab-case for filenames (e.g., `webhook-handler.ts`)
- **Classes**: Use PascalCase for class names (e.g., `EmailService`)
- **Interfaces**: Use PascalCase with a descriptive name (e.g., `WebhookPayload`)
- **Functions**: Use camelCase for function names (e.g., `sendEmail`)
- **Variables**: Use camelCase for variable names (e.g., `userEmail`)
- **Constants**: Use UPPER_SNAKE_CASE for constants (e.g., `MAX_RETRY_COUNT`)

### Code Formatting

The project uses Prettier for code formatting:

- 2 spaces for indentation
- Single quotes for strings
- Semicolons at the end of statements
- No trailing commas
- 80 character line length limit

### Error Handling

- Use the `AppError` class for application errors
- Include appropriate error codes and messages
- Log errors with the logger utility
- Handle errors at the appropriate level
- Provide user-friendly error messages

### Comments and Documentation

- Use JSDoc comments for functions and classes
- Document parameters, return values, and thrown errors
- Include examples where appropriate
- Keep comments up-to-date with code changes
- Use inline comments sparingly and only when necessary

## Testing

### Testing Framework

The project uses Vitest for testing:

- **Unit Tests**: Test individual functions and classes
- **Integration Tests**: Test interactions between components
- **Mock Objects**: Use mock objects for external dependencies

### Writing Tests

Follow these guidelines when writing tests:

1. **Test Structure**: Use the Arrange-Act-Assert pattern
2. **Test Naming**: Use descriptive names that indicate what is being tested
3. **Test Coverage**: Aim for high test coverage, especially for critical paths
4. **Mocking**: Use mocks for external dependencies
5. **Test Independence**: Tests should be independent and not rely on each other

### Running Tests

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

### Test Examples

#### Unit Test Example

```typescript
import { describe, it, expect, vi } from 'vitest';
import { validateResendPayload } from '../src/webhooks/transformer';

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
  
  it('should return isValid false for invalid payload', () => {
    const payload = {
      type: 'email.sent'
      // Missing data field
    };
    
    const result = validateResendPayload(payload);
    
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Missing required field');
  });
});
```

#### Integration Test Example

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processWebhook } from '../src/webhooks/handler';
import { verifyWebhookSignature } from '../src/utils/security';

// Mock dependencies
vi.mock('../src/utils/security', () => ({
  verifyWebhookSignature: vi.fn()
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
    
    // Mock signature verification to return valid
    verifyWebhookSignature.mockReturnValue({ isValid: true });
    
    // Act
    const result = await processWebhook(requestData);
    
    // Assert
    expect(result.success).toBe(true);
    expect(result.webhookId).toBeDefined();
    expect(result.eventType).toBe('email.sent');
  });
});
```

## Debugging

### Local Debugging

For local debugging:

1. Enable debug mode in your `.dev.vars` file:

```
DEBUG_WEBHOOKS=true
```

2. Use console logging for debugging:

```typescript
console.log('Debug info:', data);
```

3. Check the terminal output for logs.

### Remote Debugging

For debugging in deployed environments:

1. Use the monitoring script:

```bash
npm run logs
```

2. Filter logs for specific information:

```bash
npm run logs -- --filter "webhook"
```

3. Check the Cloudflare dashboard for logs and errors.

## Working with External Services

### Bland.ai Integration

- Use the `BlandAiService` for all interactions with Bland.ai
- Configure the service with your API key and agent ID
- Handle rate limiting and API errors appropriately
- Test with mock responses in development

### Resend Integration

- Use the `EmailService` for all email operations
- Configure the service with your Resend API key
- Use email templates for consistent formatting
- Test with mock responses in development

### Webhook Processing

- Use the webhook handler for processing incoming webhooks
- Verify webhook signatures for security
- Transform payloads into a standardized format
- Forward webhooks to the target endpoint

## Deployment

### Development Deployment

Deploy to the development environment:

```bash
npm run deploy:dev
```

### Staging Deployment

Deploy to the staging environment:

```bash
npm run deploy:staging
```

### Production Deployment

Deploy to the production environment:

```bash
npm run deploy:prod
```

## Best Practices

### Security Best Practices

- Never commit sensitive information (API keys, secrets) to version control
- Use environment variables for configuration
- Validate and sanitize all input
- Implement proper authentication and authorization
- Verify webhook signatures
- Use HTTPS for all communications

### Performance Best Practices

- Minimize external API calls
- Implement caching where appropriate
- Use asynchronous processing for long-running tasks
- Optimize database queries
- Monitor performance metrics

### Code Quality Best Practices

- Follow the coding standards
- Write comprehensive tests
- Use code reviews
- Refactor regularly
- Keep dependencies up-to-date

## Troubleshooting

### Common Issues

#### Webhook Signature Verification Failures

- Verify that the correct signing secret is configured
- Check if the webhook was created after the signing secret was last rotated
- Ensure the request body is not modified before verification

#### API Rate Limiting

- Implement exponential backoff for retries
- Cache responses where appropriate
- Monitor API usage

#### Environment Variable Issues

- Verify that all required variables are set
- Check for typos in variable names
- Ensure variables are available in the correct environment

## Contributing

### Contribution Guidelines

1. **Fork the Repository**: Fork the repository to your GitHub account
2. **Create a Branch**: Create a branch for your changes
3. **Make Changes**: Make your changes following the coding standards
4. **Write Tests**: Add tests for your changes
5. **Submit a Pull Request**: Submit a pull request with your changes
6. **Code Review**: Address any feedback from the code review
7. **Merge**: Once approved, your changes will be merged

### Reporting Issues

Report issues using the GitHub issue tracker:

1. **Search Existing Issues**: Check if the issue has already been reported
2. **Create a New Issue**: If not, create a new issue
3. **Provide Details**: Include steps to reproduce, expected behavior, and actual behavior
4. **Include Environment**: Specify your environment (OS, Node.js version, etc.)
5. **Add Labels**: Add appropriate labels to the issue