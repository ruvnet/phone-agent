#!/bin/bash
# Deployment script for Cloudflare Pages

# Exit on error
set -e

# Display help information
function show_help {
  echo "Usage: ./scripts/deploy.sh [options]"
  echo ""
  echo "Options:"
  echo "  -e, --environment <env>  Deployment environment (dev, staging, prod)"
  echo "  -m, --message <message>  Deployment message"
  echo "  -h, --help               Show this help message"
  echo ""
  echo "Examples:"
  echo "  ./scripts/deploy.sh -e dev -m \"Initial deployment\""
  echo "  ./scripts/deploy.sh -e prod"
}

# Default values
ENVIRONMENT="dev"
MESSAGE="Deployment $(date +'%Y-%m-%d %H:%M:%S')"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -e|--environment)
      ENVIRONMENT="$2"
      shift
      shift
      ;;
    -m|--message)
      MESSAGE="$2"
      shift
      shift
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

# Validate environment
if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "prod" ]]; then
  echo "Error: Invalid environment. Must be one of: dev, staging, prod"
  exit 1
fi

# Map environment to branch
if [[ "$ENVIRONMENT" == "dev" ]]; then
  BRANCH="dev"
elif [[ "$ENVIRONMENT" == "staging" ]]; then
  BRANCH="staging"
else
  BRANCH="main"
fi

echo "=== Deploying to $ENVIRONMENT environment ==="
echo "Deployment message: $MESSAGE"

# Run tests
echo "Running tests..."
npm test

# Build the project
echo "Building the project..."
npm run build

# Deploy to Cloudflare Pages
echo "Deploying to Cloudflare Pages..."
if [[ "$ENVIRONMENT" == "prod" ]]; then
  npx wrangler pages publish . --commit-message "$MESSAGE"
else
  npx wrangler pages publish . --branch "$BRANCH" --commit-message "$MESSAGE"
fi

echo "=== Deployment completed successfully ==="