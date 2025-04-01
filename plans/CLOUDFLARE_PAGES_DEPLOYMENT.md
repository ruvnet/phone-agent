# Cloudflare Pages Deployment Guide

This guide explains how to deploy the Phone Agent application to Cloudflare Pages with Functions.

## Prerequisites

- A Cloudflare account
- Node.js and npm installed locally
- Git repository for your project

## Local Development

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd phone-agent
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your configuration:
   ```
   RESEND_API_KEY=your_resend_api_key
   BLAND_AI_API_KEY=your_bland_api_key
   SENDER_EMAIL=noreply@example.com
   SENDER_NAME=AI Phone Agent
   DEFAULT_TIMEZONE=UTC
   ENVIRONMENT=development
   DEBUG_MODE=true
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Deployment to Cloudflare Pages

### Option 1: Deploy via Cloudflare Dashboard

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Pages** > **Create a project** > **Connect to Git**
3. Select your repository and configure the build settings:
   - **Project name**: `phone-agent` (or your preferred name)
   - **Production branch**: `main` (or your default branch)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Click **Save and Deploy**

### Option 2: Deploy via CLI

1. Install Wrangler CLI globally:
   ```bash
   npm install -g wrangler
   ```

2. Log in to Cloudflare:
   ```bash
   wrangler login
   ```

3. Build your project:
   ```bash
   npm run build
   ```

4. Deploy to Cloudflare Pages:
   ```bash
   npm run deploy
   ```
   or
   ```bash
   wrangler pages publish dist
   ```

## Environment Variables

Set the following environment variables in the Cloudflare Pages dashboard:

1. Go to your Pages project
2. Navigate to **Settings** > **Environment variables**
3. Add the following variables:
   - `RESEND_API_KEY`: Your Resend API key
   - `BLAND_AI_API_KEY`: Your Bland.ai API key
   - `SENDER_EMAIL`: Email address for sending notifications
   - `SENDER_NAME`: Name for sending notifications
   - `DEFAULT_TIMEZONE`: Default timezone (e.g., UTC)
   - `ENVIRONMENT`: Set to `production` for production deployment
   - `DEBUG_MODE`: Set to `false` for production deployment

## KV Storage Setup

1. Create a KV namespace in the Cloudflare dashboard:
   - Go to **Workers & Pages** > **KV**
   - Click **Create namespace**
   - Name it `phone_agent_storage` (or your preferred name)

2. Bind the KV namespace to your Pages project:
   - Go to your Pages project
   - Navigate to **Settings** > **Functions** > **KV namespace bindings**
   - Click **Add binding**
   - **Variable name**: `PHONE_AGENT_STORAGE`
   - **KV namespace**: Select your created namespace

## Testing Your Deployment

After deployment, your application will be available at:
- `https://<project-name>.pages.dev`

API endpoints will be accessible at:
- `https://<project-name>.pages.dev/api/webhook`
- `https://<project-name>.pages.dev/api/schedule`

## Troubleshooting

### Common Issues

1. **Environment Variables Not Working**
   - Ensure you've set them correctly in the Cloudflare dashboard
   - Remember that environment variables are different for production and preview environments

2. **KV Storage Issues**
   - Verify the KV namespace binding is correctly set up
   - Check that the variable name matches what your code expects

3. **Functions Not Executing**
   - Ensure your `_routes.json` file is correctly configured
   - Check the Functions logs in the Cloudflare dashboard

### Viewing Logs

To view logs for your Pages Functions:
1. Go to your Pages project in the Cloudflare dashboard
2. Navigate to **Functions** > **Logs**

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/platform/functions/)
- [Cloudflare KV Storage](https://developers.cloudflare.com/workers/runtime-apis/kv/)