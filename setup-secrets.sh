#!/bin/bash
# Script to set up Cloudflare Worker secrets from .env file

# Load environment variables from .env
source .env

# Set up secrets for production environment
echo "Setting up secrets for production environment..."

# Webhook secrets
echo "Setting WEBHOOK_SIGNING_SECRET..."
echo "$WEBHOOK_SIGNING_SECRET" | npx wrangler secret put WEBHOOK_SIGNING_SECRET --env production

echo "Setting TARGET_WEBHOOK_URL..."
echo "$TARGET_WEBHOOK_URL" | npx wrangler secret put TARGET_WEBHOOK_URL --env production

echo "Setting TARGET_WEBHOOK_AUTH_TOKEN..."
echo "$TARGET_WEBHOOK_AUTH_TOKEN" | npx wrangler secret put TARGET_WEBHOOK_AUTH_TOKEN --env production

# API keys
echo "Setting RESEND_API_KEY..."
echo "$RESEND_API_KEY" | npx wrangler secret put RESEND_API_KEY --env production

echo "Setting BLAND_AI_API_KEY..."
echo "$BLAND_AI_API_KEY" | npx wrangler secret put BLAND_AI_API_KEY --env production

echo "All secrets have been set up successfully!"