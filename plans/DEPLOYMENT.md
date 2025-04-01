# Deployment Guide

This guide provides detailed instructions for deploying the AI Phone Agent to different environments.

## Prerequisites

Before deploying, ensure you have:

1. A Cloudflare account with Workers enabled
2. The Wrangler CLI installed (`npm install -g wrangler`)
3. A Resend account for email handling
4. A Bland.ai account for AI phone agent capabilities
5. All required API keys and credentials

## Local Development Environment

### Setting Up Local Environment

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ai-phone-agent.git
   cd ai-phone-agent
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.dev.vars` file in the project root:
   ```
   # Email service configuration
   RESEND_API_KEY=your_resend_api_key_here
   SENDER_EMAIL=noreply@example.com
   SENDER_NAME=AI Phone Agent
   
   # Calendar service configuration
   DEFAULT_TIMEZONE=UTC
   
   # Bland.ai service configuration
   BLAND_AI_API_KEY=your_bland_ai_api_key_here
   BLAND_AI_WEBHOOK_SECRET=your_bland_ai_webhook_secret_here
   BLAND_AI_AGENT_ID=your_bland_ai_agent_id_here
   BLAND_AI_BASE_URL=https://api.bland.ai
   MAX_CALL_DURATION_MINUTES=30
   DEFAULT_RETRY_COUNT=2
   ```

4. Create KV namespaces for local development:
   ```bash
   npx wrangler kv:namespace create "AI_PHONE_AGENT_DEV"
   ```

5. Update `wrangler.jsonc` with your KV namespace ID:
   ```json
   "kv_namespaces": [
     {
       "binding": "AI_PHONE_AGENT",
       "id": "your_production_kv_namespace_id_here",
       "preview_id": "your_dev_kv_namespace_id_here"
     }
   ]
   ```

6. Start the local development server:
   ```bash
   npm run dev
   ```

### Testing Locally

When running locally, you can use tools like [ngrok](https://ngrok.com/) to expose your local server to the internet for webhook testing:

1. Install ngrok:
   ```bash
   npm install -g ngrok
   ```

2. Start ngrok to expose your local server:
   ```bash
   ngrok http 8787
   ```

3. Use the ngrok URL for webhook configuration in Resend and Bland.ai:
   - Resend webhook: `https://your-ngrok-url.ngrok.io/api/email`
   - Bland.ai webhook: `https://your-ngrok-url.ngrok.io/api/bland/webhook`

## Staging Environment

### Setting Up Staging Environment

1. Create KV namespaces for staging:
   ```bash
   npx wrangler kv:namespace create "AI_PHONE_AGENT_STAGING"
   ```

2. Create a `wrangler.staging.jsonc` file:
   ```json
   {
     "name": "ai-phone-agent-staging",
     "compatibility_date": "2023-12-01",
     "main": "src/index.ts",
     "kv_namespaces": [
       {
         "binding": "AI_PHONE_AGENT",
         "id": "your_staging_kv_namespace_id_here"
       }
     ],
     "vars": {
       "DEFAULT_TIMEZONE": "UTC",
       "MAX_CALL_DURATION_MINUTES": "30",
       "DEFAULT_RETRY_COUNT": "2"
     }
   }
   ```

3. Add a staging deployment script to `package.json`:
   ```json
   "scripts": {
     "deploy:staging": "wrangler deploy --config wrangler.staging.jsonc"
   }
   ```

4. Deploy to staging:
   ```bash
   npm run deploy:staging
   ```

5. Set up environment variables in the Cloudflare dashboard:
   - Go to Workers & Pages > ai-phone-agent-staging > Settings > Variables
   - Add all the environment variables from your `.dev.vars` file

### Testing in Staging

1. Configure webhooks to point to your staging environment:
   - Resend webhook: `https://ai-phone-agent-staging.your-subdomain.workers.dev/api/email`
   - Bland.ai webhook: `https://ai-phone-agent-staging.your-subdomain.workers.dev/api/bland/webhook`

2. Run integration tests against the staging environment:
   ```bash
   WORKER_URL=https://ai-phone-agent-staging.your-subdomain.workers.dev npm test -- test/integration
   ```

## Production Environment

### Setting Up Production Environment

1. Create KV namespaces for production:
   ```bash
   npx wrangler kv:namespace create "AI_PHONE_AGENT_PROD"
   ```

2. Update `wrangler.jsonc` with your production KV namespace ID:
   ```json
   "kv_namespaces": [
     {
       "binding": "AI_PHONE_AGENT",
       "id": "your_production_kv_namespace_id_here",
       "preview_id": "your_dev_kv_namespace_id_here"
     }
   ]
   ```

3. Deploy to production:
   ```bash
   npm run deploy
   ```

4. Set up environment variables in the Cloudflare dashboard:
   - Go to Workers & Pages > ai-phone-agent > Settings > Variables
   - Add all the environment variables from your `.dev.vars` file
   - Ensure you use production API keys and credentials

### Production Security Considerations

1. **API Keys**: Use production API keys with appropriate permissions
2. **Webhook Secrets**: Use strong, unique webhook secrets
3. **Rate Limiting**: Configure rate limiting in Cloudflare dashboard
4. **Access Control**: Consider using Cloudflare Access to protect administrative endpoints
5. **Monitoring**: Set up monitoring and alerting for your worker

### Configuring Webhooks for Production

1. In your Resend dashboard, set up a webhook:
   - URL: `https://ai-phone-agent.your-subdomain.workers.dev/api/email`
   - Events: Select email events you want to receive
   - Format: JSON

2. In your Bland.ai dashboard, configure the webhook:
   - URL: `https://ai-phone-agent.your-subdomain.workers.dev/api/bland/webhook`
   - Secret: Set a secure webhook secret
   - Update the `BLAND_AI_WEBHOOK_SECRET` environment variable with the same secret

## Custom Domain Setup

To use a custom domain for your AI Phone Agent:

1. Add your domain to Cloudflare:
   - Go to your Cloudflare dashboard
   - Add your domain and configure DNS settings

2. Create a Worker Route:
   - Go to Workers & Pages > ai-phone-agent > Triggers > Routes
   - Add a route: `api.yourdomain.com/*` pointing to your worker

3. Update webhook URLs to use your custom domain:
   - Resend webhook: `https://api.yourdomain.com/api/email`
   - Bland.ai webhook: `https://api.yourdomain.com/api/bland/webhook`

## Continuous Integration/Continuous Deployment (CI/CD)

### GitHub Actions Setup

Create a `.github/workflows/deploy.yml` file:

```yaml
name: Deploy

on:
  push:
    branches:
      - main
      - staging

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Deploy to staging
        if: github.ref == 'refs/heads/staging'
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          wranglerVersion: '3'
          command: deploy --config wrangler.staging.jsonc
      - name: Deploy to production
        if: github.ref == 'refs/heads/main'
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          wranglerVersion: '3'
          command: deploy
```

### Setting Up GitHub Secrets

1. Go to your GitHub repository > Settings > Secrets and variables > Actions
2. Add the following secrets:
   - `CF_API_TOKEN`: Your Cloudflare API token with Workers permissions

## Monitoring and Logging

### Cloudflare Analytics

1. Go to Workers & Pages > ai-phone-agent > Analytics
2. Monitor:
   - Request volume
   - CPU time
   - Error rates
   - Status codes

### Custom Logging

1. Use the built-in logger utility for structured logging:
   ```typescript
   import { logger } from './utils/logger';
   
   logger.info('Processing request', { requestId, path });
   logger.error('Error occurred', error);
   ```

2. Set up log forwarding to a service like Datadog or Logtail:
   - Configure log forwarding in Cloudflare dashboard
   - Set up alerts for error conditions

## Rollback Procedure

If you need to roll back a deployment:

1. Find the previous version in the Cloudflare dashboard:
   - Go to Workers & Pages > ai-phone-agent > Deployments
   - Locate the previous stable version

2. Roll back using the dashboard:
   - Click on the three dots next to the version
   - Select "Rollback to this version"

3. Or roll back using Wrangler:
   ```bash
   npx wrangler rollback
   ```

4. Verify the rollback was successful:
   - Check the worker is responding correctly
   - Test key functionality

## Troubleshooting Deployment Issues

### Common Issues and Solutions

1. **Worker fails to deploy**:
   - Check for syntax errors in your code
   - Verify wrangler.jsonc is correctly formatted
   - Ensure you have the necessary permissions

2. **Environment variables not working**:
   - Verify environment variables are set in the Cloudflare dashboard
   - Check for typos in variable names
   - Restart the worker after changing environment variables

3. **KV storage issues**:
   - Verify KV namespace IDs are correct
   - Check KV binding names match your code
   - Ensure you have the necessary permissions for KV operations

4. **Webhook integration issues**:
   - Verify webhook URLs are correct and accessible
   - Check webhook secrets match
   - Look for error messages in the Cloudflare logs

### Getting Help

If you encounter issues that you can't resolve:

1. Check the Cloudflare Workers documentation: https://developers.cloudflare.com/workers/
2. Search for similar issues on the Cloudflare Community forums
3. Contact Cloudflare support if you have a paid plan
4. Open an issue on the project's GitHub repository