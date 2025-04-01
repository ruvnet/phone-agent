# Environment Configuration

This document provides detailed information about the environment variables used in the Phone Agent application and how to configure them for different environments.

## Environment Variables Overview

Environment variables are used to configure the Phone Agent without modifying the code. They control API keys, webhook endpoints, debugging options, and other configuration settings.

## Required Environment Variables

The following environment variables are required for the Phone Agent to function properly:

### Webhook Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `WEBHOOK_SIGNING_SECRET` | The signing secret from Resend used to verify webhook authenticity | `whsec_abcdef123456` |
| `TARGET_WEBHOOK_URL` | The URL where transformed webhooks will be forwarded | `https://example.com/webhook` |
| `TARGET_WEBHOOK_AUTH_TOKEN` | Authentication token for the target webhook | `token_abcdef123456` |

### Bland.ai Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `BLAND_AI_API_KEY` | Your Bland.ai API key | `bland_api_abcdef123456` |
| `BLAND_AI_AGENT_ID` | Your Bland.ai agent ID | `agent_abcdef123456` |

### Email Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `RESEND_API_KEY` | Your Resend API key | `re_abcdef123456` |
| `SENDER_EMAIL` | Email address to send from | `noreply@yourdomain.com` |
| `SENDER_NAME` | Name to display as the sender | `Your Company Name` |

## Optional Environment Variables

These variables are optional and have default values:

### Webhook Options

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `DEBUG_WEBHOOKS` | Enable debug logging for webhooks | `false` | `true` |
| `STORE_FAILED_PAYLOADS` | Store failed webhook payloads for retry | `true` | `false` |

### Bland.ai Options

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `BLAND_AI_WEBHOOK_SECRET` | Secret for Bland.ai webhooks | `null` | `whsec_bland_abcdef123456` |
| `BLAND_AI_BASE_URL` | Base URL for Bland.ai API | `https://api.bland.ai` | `https://api.test.bland.ai` |
| `MAX_CALL_DURATION` | Maximum call duration in minutes | `30` | `45` |
| `DEFAULT_VOICE_ID` | Default voice ID to use | `null` | `voice_abcdef123456` |

### Calendar Options

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `DEFAULT_TIMEZONE` | Default timezone for calendar events | `UTC` | `America/New_York` |

## Configuration Methods

There are several ways to configure environment variables for the Phone Agent:

### Local Development

For local development, create a `.dev.vars` file in the root directory:

```
WEBHOOK_SIGNING_SECRET=your_signing_secret
TARGET_WEBHOOK_URL=https://your-target-webhook.com
TARGET_WEBHOOK_AUTH_TOKEN=your_auth_token
BLAND_AI_API_KEY=your_bland_ai_api_key
BLAND_AI_AGENT_ID=your_bland_ai_agent_id
RESEND_API_KEY=your_resend_api_key
SENDER_EMAIL=your_sender_email
SENDER_NAME=Your Sender Name
DEBUG_WEBHOOKS=true
```

### Cloudflare Pages Dashboard

For production deployment, set environment variables in the Cloudflare Pages Dashboard:

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Pages** > **Your project** > **Settings** > **Environment variables**
3. Add each environment variable and its value
4. Mark sensitive variables as "Encrypted"
5. Choose the environments where each variable should be available (Production, Preview, or both)

### Wrangler CLI

You can also set environment variables using the Wrangler CLI:

```bash
# Set a secret (encrypted) environment variable
npx wrangler secret put WEBHOOK_SIGNING_SECRET
# Enter your secret when prompted

# Set a regular environment variable
npx wrangler pages env set TARGET_WEBHOOK_URL https://your-target-webhook.com
```

## Environment-Specific Configuration

You can configure different values for different environments (development, staging, production):

### Using the Cloudflare Dashboard

1. Go to **Pages** > **Your project** > **Settings** > **Environment variables**
2. When adding a variable, select the environment:
   - **Production**: For the production branch
   - **Preview**: For all other branches

### Using the Wrangler CLI

```bash
# Set for production environment
npx wrangler pages env set VARIABLE_NAME value --branch=main

# Set for preview environment
npx wrangler pages env set VARIABLE_NAME value --preview
```

## Accessing Environment Variables in Code

Environment variables are accessed in the code using the `config` utility:

```typescript
import { config } from '../utils/config';

// Get a specific variable with a default fallback
const apiKey = config.get('API_KEY', 'default_value');

// Get a group of related variables
const emailConfig = config.getEmailConfig();
```

## Security Best Practices

1. **Never commit environment variables to version control**
2. **Use encrypted variables for sensitive information**
3. **Rotate API keys and secrets regularly**
4. **Limit access to environment variable configuration**
5. **Use different values for different environments**
6. **Audit environment variable usage periodically**

## Troubleshooting

### Common Issues

#### Environment Variables Not Available

If your application can't access environment variables:

1. Verify that the variables are correctly set in your environment
2. Check for typos in variable names
3. Ensure you're using the correct method to access variables
4. For Cloudflare Pages, redeploy after adding new variables

#### Local vs. Production Differences

If your application behaves differently in local development vs. production:

1. Compare the environment variables between environments
2. Check for environment-specific code paths
3. Verify that all required variables are set in both environments

## Environment Variable Templates

### Local Development Template (.dev.vars)

```
# Webhook Configuration
WEBHOOK_SIGNING_SECRET=your_signing_secret
TARGET_WEBHOOK_URL=https://your-target-webhook.com
TARGET_WEBHOOK_AUTH_TOKEN=your_auth_token

# Bland.ai Configuration
BLAND_AI_API_KEY=your_bland_ai_api_key
BLAND_AI_AGENT_ID=your_bland_ai_agent_id
BLAND_AI_WEBHOOK_SECRET=your_bland_ai_webhook_secret
BLAND_AI_BASE_URL=https://api.bland.ai
MAX_CALL_DURATION=30
DEFAULT_VOICE_ID=your_default_voice_id

# Email Configuration
RESEND_API_KEY=your_resend_api_key
SENDER_EMAIL=your_sender_email
SENDER_NAME=Your Sender Name

# Calendar Configuration
DEFAULT_TIMEZONE=UTC

# Debug Options
DEBUG_WEBHOOKS=true
STORE_FAILED_PAYLOADS=true
```

### Production Environment Variables

For production, ensure all the same variables are set in your Cloudflare Pages environment variables configuration, with appropriate production values.

## Migrating Environment Variables

When migrating to a new environment or server:

1. Export the environment variables from the current environment
2. Review and update values as needed for the new environment
3. Import the variables into the new environment
4. Test the application to ensure all variables are correctly set

## Environment Variable Validation

The Phone Agent validates required environment variables on startup. If a required variable is missing, the application will log an error and may not function correctly.

You can manually validate your environment configuration by running:

```bash
npm run validate-env
```

This will check for required variables and report any issues.