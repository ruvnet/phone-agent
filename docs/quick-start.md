# Quick Start Guide

This guide will help you get the Phone Agent system up and running quickly.

## Prerequisites

Before you begin, ensure you have the following:

- [Node.js](https://nodejs.org/) 18 or later
- npm or yarn package manager
- [Cloudflare account](https://dash.cloudflare.com/sign-up) (for deployment)
- [Bland.ai account](https://www.bland.ai/) (for phone call functionality)
- [Resend account](https://resend.com/) (for email functionality)

## Installation

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

Create a `.env` file in the root directory based on the `.env.example` template:

```bash
cp .env.example .env
```

Edit the `.env` file and fill in your API keys and configuration values.

## Configuration

The Phone Agent requires several environment variables to be configured:

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `WEBHOOK_SIGNING_SECRET` | The signing secret from Resend |
| `TARGET_WEBHOOK_URL` | The URL of your target webhook |
| `TARGET_WEBHOOK_AUTH_TOKEN` | The authentication token for your target webhook |
| `BLAND_AI_API_KEY` | Your Bland.ai API key |
| `BLAND_AI_AGENT_ID` | Your Bland.ai agent ID |
| `RESEND_API_KEY` | Your Resend API key |
| `SENDER_EMAIL` | The email address to send from |
| `SENDER_NAME` | The name to display as the sender |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DEBUG_WEBHOOKS` | Enable debug logging for webhooks | `false` |
| `STORE_FAILED_PAYLOADS` | Store failed webhook payloads | `true` |
| `DEFAULT_TIMEZONE` | Default timezone for calendar events | `UTC` |
| `MAX_CALL_DURATION` | Maximum call duration in minutes | `30` |

## Running Locally

To start the development server:

```bash
npm run dev
```

This will start a local server at http://localhost:8788.

## Testing the Installation

1. Verify the API is working by accessing the info endpoint:

```bash
curl http://localhost:8788/api
```

You should receive a JSON response with basic API information.

2. Test the webhook endpoint (requires a valid Resend webhook signature):

```bash
# This is a simplified example - actual testing requires proper signature generation
curl -X POST http://localhost:8788/api/webhook \
  -H "Content-Type: application/json" \
  -H "Resend-Signature: <signature>" \
  -d '{"type":"email.sent","data":{"id":"example-id"}}'
```

## Next Steps

- [Configure Resend webhooks](./webhook-integration.md) to send events to your application
- [Set up Bland.ai agent](./services/bland-service.md) with your specific requirements
- [Explore the API documentation](./api-reference.md) to understand available endpoints
- [Review the deployment guide](./deployment-guide.md) for production deployment

## Troubleshooting

If you encounter issues during setup:

- Verify all required environment variables are set correctly
- Check the console for error messages
- Ensure your API keys are valid and have the necessary permissions
- See the [Troubleshooting guide](./troubleshooting.md) for common issues and solutions