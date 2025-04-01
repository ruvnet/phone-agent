# Deployment Guide

This guide provides detailed instructions for deploying the Phone Agent application to Cloudflare Pages.

## Prerequisites

Before deploying, ensure you have:

- A [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Cloudflare Pages](https://pages.cloudflare.com/) enabled on your account
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed (optional, for CLI deployment)
- Your environment variables ready (see [Environment Configuration](./environment-configuration.md))

## Deployment Options

There are two ways to deploy the Phone Agent:

1. **GitHub Integration**: Connect your GitHub repository to Cloudflare Pages
2. **Direct Upload**: Use the Wrangler CLI to deploy directly from your local machine

## GitHub Integration Deployment

### Step 1: Connect Your Repository

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Pages** > **Create a project** > **Connect to Git**
3. Select GitHub as your Git provider and authenticate
4. Select your Phone Agent repository from the list

### Step 2: Configure Build Settings

Configure the build settings with the following values:

- **Project name**: Choose a name for your project (e.g., `phone-agent`)
- **Production branch**: `main` (or your default branch)
- **Build command**: `npm run build`
- **Build output directory**: `/` (root directory)
- **Root directory**: `/` (root directory)

### Step 3: Add Environment Variables

1. In the build settings page, scroll down to the **Environment variables** section
2. Add all required environment variables (see list below)
3. Make sure to mark sensitive variables as "Encrypted"

### Step 4: Deploy

1. Click **Save and Deploy**
2. Cloudflare will build and deploy your application
3. Once complete, you'll receive a URL for your deployed application (e.g., `https://phone-agent.pages.dev`)

## CLI Deployment

### Step 1: Configure Wrangler

Ensure your `wrangler.toml` file is properly configured:

```toml
name = "phone-agent"
compatibility_date = "2023-06-01"

[build]
command = "npm run build"

[site]
bucket = "./"
```

### Step 2: Set Up Environment Variables

Create a `.dev.vars` file for local development:

```
WEBHOOK_SIGNING_SECRET=your_signing_secret
TARGET_WEBHOOK_URL=https://your-target-webhook.com
TARGET_WEBHOOK_AUTH_TOKEN=your_auth_token
BLAND_AI_API_KEY=your_bland_ai_api_key
BLAND_AI_AGENT_ID=your_bland_ai_agent_id
RESEND_API_KEY=your_resend_api_key
SENDER_EMAIL=your_sender_email
SENDER_NAME=Your Sender Name
```

For production, you'll need to set these variables in Cloudflare:

```bash
npx wrangler secret put WEBHOOK_SIGNING_SECRET
# Enter your secret when prompted
```

Repeat for each environment variable.

### Step 3: Deploy

Use the deployment script:

```bash
npm run deploy
```

Or deploy manually with Wrangler:

```bash
npx wrangler pages deploy
```

## Environment Variables

The following environment variables are required for deployment:

| Variable | Description | Required |
|----------|-------------|----------|
| `WEBHOOK_SIGNING_SECRET` | Signing secret from Resend | Yes |
| `TARGET_WEBHOOK_URL` | URL of your target webhook | Yes |
| `TARGET_WEBHOOK_AUTH_TOKEN` | Authentication token for your target webhook | Yes |
| `BLAND_AI_API_KEY` | Your Bland.ai API key | Yes |
| `BLAND_AI_AGENT_ID` | Your Bland.ai agent ID | Yes |
| `BLAND_AI_WEBHOOK_SECRET` | Secret for Bland.ai webhooks | No |
| `BLAND_AI_BASE_URL` | Base URL for Bland.ai API | No |
| `RESEND_API_KEY` | Your Resend API key | Yes |
| `SENDER_EMAIL` | Email address to send from | Yes |
| `SENDER_NAME` | Name to display as sender | Yes |
| `DEBUG_WEBHOOKS` | Enable webhook debugging | No |
| `STORE_FAILED_PAYLOADS` | Store failed webhook payloads | No |
| `DEFAULT_TIMEZONE` | Default timezone for calendar events | No |

## Multi-Environment Deployment

For deploying to multiple environments (development, staging, production), use the environment-specific deployment scripts:

```bash
# Deploy to development
npm run deploy:dev

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:prod
```

Each environment can have its own configuration using Cloudflare's environment variables.

## Custom Domains

To use a custom domain with your Phone Agent deployment:

1. In the Cloudflare Dashboard, go to **Pages** > **Your project**
2. Click on **Custom domains**
3. Click **Set up a custom domain**
4. Enter your domain name and follow the instructions
5. Update your DNS settings as directed by Cloudflare

## Monitoring and Logs

### Viewing Logs

To view logs for your deployed application:

```bash
npm run logs
```

Or through the Cloudflare Dashboard:

1. Go to **Pages** > **Your project**
2. Click on **Functions**
3. Click on **Logs**

### Monitoring Status

Check the status of your deployment:

```bash
npm run status
```

## Rollbacks

If you need to roll back to a previous deployment:

1. In the Cloudflare Dashboard, go to **Pages** > **Your project**
2. Click on **Deployments**
3. Find the deployment you want to roll back to
4. Click the three dots menu and select **Rollback to this deployment**

## Continuous Integration/Continuous Deployment (CI/CD)

For automated deployments, you can set up a CI/CD pipeline using GitHub Actions:

1. Create a `.github/workflows/deploy.yml` file in your repository
2. Add the following content:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main  # or your default branch

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy --project-name=phone-agent
```

3. Add your Cloudflare API token and account ID as secrets in your GitHub repository settings

## Troubleshooting Deployment Issues

### Build Failures

If your build fails:

1. Check the build logs for specific errors
2. Verify that all dependencies are correctly installed
3. Ensure your Node.js version is compatible (Node.js 18+)
4. Check that your build command is correct

### Function Errors

If your functions are not working:

1. Check the function logs for errors
2. Verify that all required environment variables are set
3. Ensure your functions are in the correct directory (`/functions`)
4. Check that your `_routes.json` file is correctly configured

### Environment Variable Issues

If your application can't access environment variables:

1. Verify that all variables are correctly set in the Cloudflare Dashboard
2. Check for typos in variable names
3. Ensure you're accessing variables correctly in your code
4. Restart your deployment after adding new variables

## Security Considerations

1. **Environment Variables**: Always use environment variables for sensitive information
2. **API Keys**: Regularly rotate API keys and secrets
3. **Access Control**: Limit access to your Cloudflare account and deployment pipeline
4. **Monitoring**: Set up monitoring and alerts for unusual activity
5. **HTTPS**: Ensure all communications use HTTPS