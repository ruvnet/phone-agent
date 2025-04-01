# Resend Webhook Forwarder

A Cloudflare Pages application that receives webhooks from Resend, validates them, transforms the payload, and forwards them to a target webhook endpoint.

## Architecture

This application follows a simplified architecture using Cloudflare Pages Functions:

```
┌─────────┐     ┌───────────────────┐     ┌─────────────────┐
│ Resend  │────▶│ Cloudflare Pages  │────▶│ Target Webhook  │
└─────────┘     └───────────────────┘     └─────────────────┘
    │                    │                        │
    │                    │                        │
    ▼                    ▼                        ▼
Email Events      Transform Payload       Process Payload
                 Validate Signature
                   Add Auth Token
```

## Features

- **Webhook Signature Validation**: Verifies the authenticity of incoming webhooks using HMAC signatures
- **Payload Transformation**: Converts Resend webhook payloads into a standardized format
- **Secure Forwarding**: Forwards transformed payloads to a target endpoint with authentication
- **Retry Logic**: Implements exponential backoff for failed webhook deliveries
- **Error Handling**: Comprehensive error handling and reporting
- **Failed Webhook Storage**: Option to store failed webhooks for later processing

## Project Structure

```
/
├── functions/                # Pages Functions (serverless API endpoints)
│   ├── api/                  # API endpoints
│   │   ├── webhook.js        # Webhook handler
│   │   └── index.js          # API info endpoint
│   └── static.js             # Static file handler
├── public/                   # Static assets
├── src/
│   ├── config/               # Configuration
│   ├── types/                # TypeScript type definitions
│   ├── utils/                # Utility functions
│   └── webhooks/             # Webhook processing logic
├── test/                     # Tests
│   ├── webhooks/             # Webhook tests
│   └── ...                   # Other tests
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

## Development

### Prerequisites

- Node.js 18 or later
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/resend-webhook-forwarder.git
cd resend-webhook-forwarder
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.dev.vars` file with your environment variables:

```
WEBHOOK_SIGNING_SECRET=your_signing_secret
TARGET_WEBHOOK_URL=https://your-target-webhook.com
TARGET_WEBHOOK_AUTH_TOKEN=your_auth_token
DEBUG_WEBHOOKS=true
STORE_FAILED_PAYLOADS=true
```

### Running Locally

Start the development server:

```bash
npm run dev
```

This will start a local server at http://localhost:8788.

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

## Setting Up Resend Webhooks

1. Log in to your Resend account.
2. Navigate to the Webhooks section.
3. Click "Add Webhook".
4. Enter the URL of your Cloudflare Pages application (e.g., `https://your-app.pages.dev/api/webhook`).
5. Select the events you want to receive (e.g., `email.sent`, `email.delivered`, etc.).
6. Save the webhook configuration.
7. Copy the signing secret for use in your environment variables.

## License

MIT