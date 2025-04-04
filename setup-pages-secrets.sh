#!/bin/bash
# Script to set up Cloudflare Pages secrets from .env file

# Load environment variables from .env
source .env

# Set up secrets for the Pages project
echo "Setting up secrets for the Pages project..."

# Webhook secrets
echo "Setting WEBHOOK_SIGNING_SECRET..."
echo "$WEBHOOK_SIGNING_SECRET" | npx wrangler pages secret put WEBHOOK_SIGNING_SECRET

echo "Setting TARGET_WEBHOOK_URL..."
echo "$TARGET_WEBHOOK_URL" | npx wrangler pages secret put TARGET_WEBHOOK_URL

echo "Setting TARGET_WEBHOOK_AUTH_TOKEN..."
echo "$TARGET_WEBHOOK_AUTH_TOKEN" | npx wrangler pages secret put TARGET_WEBHOOK_AUTH_TOKEN

# API keys
echo "Setting RESEND_API_KEY..."
echo "$RESEND_API_KEY" | npx wrangler pages secret put RESEND_API_KEY

echo "Setting BLAND_AI_API_KEY..."
echo "$BLAND_AI_API_KEY" | npx wrangler pages secret put BLAND_AI_API_KEY

echo "All secrets have been set up successfully!"