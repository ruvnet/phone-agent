# Phone Agent

A Cloudflare Pages application that provides AI phone agent capabilities, including scheduling calls, managing calendars, and handling email notifications.

## Architecture

This application follows a simplified architecture using Cloudflare Pages Functions:

```
┌─────────┐     ┌───────────────────┐     ┌─────────────────┐
│ Resend  │────▶│ Cloudflare Pages  │────▶│ Bland.ai API    │
└─────────┘     └───────────────────┘     └─────────────────┘
    │                    │                        │
    │                    │                        │
    ▼                    ▼                        ▼
Email Events      Process Webhooks         Schedule Calls
                  Manage Calendar          Handle Phone Calls
                  Send Notifications
```

## Features

- **AI Phone Agent**: Schedule and manage automated phone calls using Bland.ai
- **Calendar Integration**: Create and manage calendar events for scheduled calls
- **Email Notifications**: Send confirmation, rescheduling, and cancellation emails
- **Webhook Processing**: Handle webhooks from email and phone call services
- **Secure Storage**: Store call and scheduling data securely
- **Error Handling**: Comprehensive error handling and reporting

## Project Structure

```
/
├── functions/                # Pages Functions (serverless API endpoints)
│   ├── api/                  # API endpoints
│   │   ├── webhook.js        # Webhook handler
│   │   ├── schedule.js       # Call scheduling handler
│   │   └── index.js          # API info endpoint
│   └── static.js             # Static file handler
├── public/                   # Static assets
├── src/
│   ├── config/               # Configuration
│   ├── services/             # Core services
│   │   ├── agent-scheduling-service.ts  # Call scheduling service
│   │   ├── bland-service.ts             # Bland.ai integration
│   │   ├── calendar-service.ts          # Calendar management
│   │   ├── email-service.ts             # Email notifications
│   │   └── storage-service.ts           # Data storage
│   ├── types/                # TypeScript type definitions
│   ├── utils/                # Utility functions
│   └── webhooks/             # Webhook processing logic
├── test/                     # Tests
│   ├── integration/          # Integration tests
│   ├── services/             # Service tests
│   └── ...                   # Other tests
├── scripts/                  # Development and deployment scripts
│   ├── dev-server.js         # Custom development server
│   ├── minimal-server.js     # Minimal development server
│   └── ...                   # Other scripts
├── _routes.json              # Cloudflare Pages routing configuration
└── package.json              # Project configuration
```

## Environment Variables

The application requires the following environment variables:

- `WEBHOOK_SIGNING_SECRET`: The signing secret from Resend
- `TARGET_WEBHOOK_URL`: The URL of your target webhook
- `TARGET_WEBHOOK_AUTH_TOKEN`: The authentication token for your target webhook
- `DEBUG_WEBHOOKS`: Set to "true" to enable debug logging (optional)
- `STORE_FAILED_PAYLOADS`: Set to "true" to store failed webhook payloads (optional)
- `RESEND_API_KEY`: API key for Resend email service
- `SENDER_EMAIL`: Email address to use as sender
- `SENDER_NAME`: Name to use as sender
- `DEFAULT_TIMEZONE`: Default timezone for date/time formatting
- `BLAND_AI_API_KEY`: API key for Bland.ai service
- `BLAND_AI_BASE_URL`: Base URL for Bland.ai API
- `MAX_CALL_DURATION_MINUTES`: Maximum call duration in minutes
- `DEFAULT_RETRY_COUNT`: Default number of retries for API calls

## Development

### Prerequisites

- Node.js 18 or later
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/phone-agent.git
cd phone-agent
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file with your environment variables (see `.env.example` for reference).

### Running Locally

There are three ways to run the application locally:

#### Option 1: Using Wrangler (Standard Method)

Start the development server using Wrangler:

```bash
npm run dev
```

This will start a local server at http://localhost:8788.

#### Option 2: Using Custom Development Server (GLIBC Compatibility Issues)

If you encounter GLIBC compatibility issues with Wrangler, use our custom development server:

```bash
npm run dev:local
```

This will start a local Express server at http://localhost:8787 that mimics the Cloudflare Pages environment.

#### Option 3: Using Minimal Development Server (Most Compatible)

For environments with dependency issues or compatibility problems, use our minimal server that relies only on Node.js built-in modules:

```bash
npm run dev:minimal
```

This will start a lightweight HTTP server at http://localhost:8787 with mock API endpoints.

### Testing the API

You can test the API endpoints using curl:

```bash
# Get API information
curl http://localhost:8787/api

# Get schedule information
curl http://localhost:8787/api/schedule?requestId=test123

# Test webhook endpoint
curl -X POST -H "Content-Type: application/json" \
  -d '{"sender":"test@example.com","subject":"Test Webhook","body":"This is a test"}' \
  http://localhost:8787/api/webhook

# Cancel a scheduled call
curl -X POST -H "Content-Type: application/json" \
  -d '{"requestId":"test123","reason":"Testing cancellation"}' \
  http://localhost:8787/api/schedule/cancel
```

### Testing

Run the tests:

```bash
npm test
```

Run the tests with coverage:

```bash
npm run test:coverage
```

## Deployment

### Deploying to Cloudflare Pages

1. Log in to the Cloudflare dashboard and create a new Pages project.

2. Connect your GitHub repository.

3. Configure the build settings:
   - Build command: `npm run build`
   - Build output directory: `/`

4. Add your environment variables in the Cloudflare dashboard.

5. Deploy the application.

Alternatively, you can deploy using the Wrangler CLI:

```bash
npm run deploy
```

## Setting Up Webhooks

### Resend Webhooks

1. Log in to your Resend account.
2. Navigate to the Webhooks section.
3. Click "Add Webhook".
4. Enter the URL of your Cloudflare Pages application (e.g., `https://your-app.pages.dev/api/webhook`).
5. Select the events you want to receive (e.g., `email.sent`, `email.delivered`, etc.).
6. Save the webhook configuration.
7. Copy the signing secret for use in your environment variables.

### Bland.ai Webhooks

1. Log in to your Bland.ai account.
2. Navigate to the Webhooks section.
3. Configure a webhook endpoint pointing to your application (e.g., `https://your-app.pages.dev/api/webhook`).
4. Select the call events you want to receive.
5. Save the webhook configuration.

## Troubleshooting

### Common Issues

#### Wrangler Compatibility Issues

If you encounter GLIBC compatibility issues with Wrangler, try using one of our alternative development servers:

```bash
# Option 1: Custom Express server
npm run dev:local

# Option 2: Minimal Node.js server
npm run dev:minimal
```

#### API Endpoint Not Found

If you receive a "Cannot GET /api" error, make sure you're using the correct server and port. The API endpoints are available at:

- http://localhost:8787/api (for dev:local and dev:minimal)
- http://localhost:8788/api (for standard Wrangler dev)

## License

MIT