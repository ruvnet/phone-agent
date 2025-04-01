#!/bin/bash
# Script to set up environment variables for Cloudflare Pages

# Exit on error
set -e

# Display help information
function show_help {
  echo "Usage: ./scripts/setup-env.sh [options]"
  echo ""
  echo "Options:"
  echo "  -e, --environment <env>  Target environment (dev, staging, prod)"
  echo "  -p, --project <name>     Cloudflare Pages project name"
  echo "  -h, --help               Show this help message"
  echo ""
  echo "Examples:"
  echo "  ./scripts/setup-env.sh -e dev -p my-webhook-project"
  echo "  ./scripts/setup-env.sh -e prod -p my-webhook-project"
}

# Default values
ENVIRONMENT="dev"
PROJECT_NAME=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -e|--environment)
      ENVIRONMENT="$2"
      shift
      shift
      ;;
    -p|--project)
      PROJECT_NAME="$2"
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

# Validate project name
if [[ -z "$PROJECT_NAME" ]]; then
  echo "Error: Project name is required"
  show_help
  exit 1
fi

echo "=== Setting up environment variables for $ENVIRONMENT environment ==="
echo "Project: $PROJECT_NAME"

# Check if .env file exists
ENV_FILE=".env.$ENVIRONMENT"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: Environment file $ENV_FILE not found"
  echo "Please create this file with your environment variables"
  exit 1
fi

# Read environment variables from file
echo "Reading environment variables from $ENV_FILE..."
ENV_VARS=$(cat "$ENV_FILE" | grep -v '^#' | grep '=')

# Set environment variables in Cloudflare Pages
echo "Setting environment variables in Cloudflare Pages..."
while IFS= read -r line; do
  if [[ ! -z "$line" ]]; then
    KEY=$(echo "$line" | cut -d '=' -f 1)
    VALUE=$(echo "$line" | cut -d '=' -f 2-)
    
    echo "Setting $KEY..."
    npx wrangler pages project env set --project-name "$PROJECT_NAME" "$KEY" "$VALUE" --env "$ENVIRONMENT"
  fi
done <<< "$ENV_VARS"

echo "=== Environment variables set successfully ==="
echo ""
echo "To view the current environment variables, run:"
echo "npx wrangler pages project env list --project-name \"$PROJECT_NAME\" --env \"$ENVIRONMENT\""