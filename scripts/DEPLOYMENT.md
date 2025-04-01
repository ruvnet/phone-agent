# Deployment Guide

This document provides detailed instructions for deploying the Resend Webhook Forwarder to Cloudflare Pages.

## Prerequisites

- Cloudflare account with Pages access
- Node.js 18 or later
- npm or yarn
- Git

## Deployment Options

There are two ways to deploy the application:

1. **Automated Deployment**: Using the provided scripts
2. **Manual Deployment**: Through the Cloudflare Dashboard

## Automated Deployment

### 1. Set Up Environment Variables

First, create environment-specific configuration files:

```bash
# Create environment files
touch .env.dev .env.staging .env.prod
```

Edit each file to include the necessary environment variables:

```
# Required variables
WEBHOOK_SIGNING_SECRET=your_signing_secret_here
TARGET_WEBHOOK_URL=https://your-target-webhook.com
TARGET_WEBHOOK_AUTH_TOKEN=your_auth_token_here

# Optional variables
DEBUG_WEBHOOKS=true
STORE_FAILED_PAYLOADS=true
```

### 2. Create a Cloudflare Pages Project

If you haven't already created a Pages project:

```bash
# Create a new Pages project
npx wrangler pages project create resend-webhook-forwarder
```

### 3. Set Up Environment Variables in Cloudflare

Use the provided script to set up environment variables:

```bash
# For development environment
npm run setup:env -- -e dev -p resend-webhook-forwarder

# For staging environment
npm run setup:env -- -e staging -p resend-webhook-forwarder

# For production environment
npm run setup:env -- -e prod -p resend-webhook-forwarder
```

### 4. Deploy the Application

Use the provided scripts to deploy to different environments:

```bash
# Deploy to development
npm run deploy:dev

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:prod
```

You can also include a deployment message:

```bash
npm run deploy:prod -- -m "Initial production deployment"
```

## Manual Deployment

### 1. Build the Application

```bash
# Install dependencies
npm install

# Build the application
npm run build
```

### 2. Deploy via Cloudflare Dashboard

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Pages**
3. Click **Create a project** or select your existing project
4. Connect your GitHub repository or upload your files directly
5. Configure the build settings:
   - Build command: `npm run build`
   - Build output directory: `/`
6. Add your environment variables in the **Environment variables** section
7. Click **Save and Deploy**

## Monitoring Deployments

### Check Deployment Status

```bash
# Check the status of deployments
npm run status -- -p resend-webhook-forwarder -e prod
```

### View Deployment Logs

```bash
# View logs for the latest deployment
npm run logs -- -p resend-webhook-forwarder -e prod
```

## Rollback Procedure

If you need to roll back to a previous deployment:

1. Find the deployment ID you want to roll back to:

```bash
npx wrangler pages deployment list --project-name resend-webhook-forwarder
```

2. Roll back to that deployment:

```bash
npx wrangler pages deployment rollback <deployment-id> --project-name resend-webhook-forwarder
```

## Continuous Integration

For CI/CD pipelines, you can use the deployment scripts in your workflow:

### GitHub Actions Example

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main
      - staging
      - dev

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build
        run: npm run build
        
      - name: Deploy to Cloudflare Pages
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: |
          if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
            npx wrangler pages publish . --project-name resend-webhook-forwarder
          elif [[ "${{ github.ref }}" == "refs/heads/staging" ]]; then
            npx wrangler pages publish . --project-name resend-webhook-forwarder --branch staging
          else
            npx wrangler pages publish . --project-name resend-webhook-forwarder --branch dev
          fi
```

## Troubleshooting

### Common Issues

1. **Deployment Fails with Authentication Error**

   Make sure your Cloudflare API token has the correct permissions:
   - Account.Cloudflare Pages: Edit
   - User.API Tokens: Edit

2. **Environment Variables Not Working**

   Verify that environment variables are set correctly:
   ```bash
   npx wrangler pages project env list --project-name resend-webhook-forwarder --env prod
   ```

3. **Functions Not Executing**

   Check that your `_routes.json` file is correctly configured and that your functions are in the right directory structure.

4. **Build Errors**

   If you encounter build errors, check the build logs:
   ```bash
   npm run logs -- -p resend-webhook-forwarder -e prod
   ```

## Best Practices

1. **Always test before deploying to production**
   
   Deploy to development or staging first, and verify functionality before deploying to production.

2. **Use meaningful deployment messages**
   
   Include descriptive messages with your deployments to track changes over time.

3. **Set up monitoring and alerts**
   
   Configure monitoring to be notified of any issues with your deployment.

4. **Implement progressive rollouts**
   
   For critical changes, consider implementing a progressive rollout strategy.

5. **Keep secrets secure**
   
   Never commit sensitive information like API keys or signing secrets to your repository.