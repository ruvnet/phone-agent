#!/bin/bash
# Script to set up local development environment

# Exit on error
set -e

# Display help information
function show_help {
  echo "Usage: ./scripts/setup-local.sh [options]"
  echo ""
  echo "Options:"
  echo "  -e, --environment <env>  Source environment for variables (dev, staging, prod)"
  echo "  -h, --help               Show this help message"
  echo ""
  echo "Examples:"
  echo "  ./scripts/setup-local.sh -e dev"
  echo "  ./scripts/setup-local.sh"
}

# Default values
ENVIRONMENT="dev"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -e|--environment)
      ENVIRONMENT="$2"
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

echo "=== Setting up local development environment ==="
echo "Using $ENVIRONMENT environment as source"

# Check if .env file exists
ENV_FILE=".env.$ENVIRONMENT"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Warning: Environment file $ENV_FILE not found"
  echo "Creating a template file..."
  
  cat > "$ENV_FILE" << EOL
# Environment variables for $ENVIRONMENT environment
# Replace these values with your actual configuration

# Webhook configuration
WEBHOOK_SIGNING_SECRET=your_signing_secret_here
TARGET_WEBHOOK_URL=https://your-target-webhook.com
TARGET_WEBHOOK_AUTH_TOKEN=your_auth_token_here

# Optional settings
DEBUG_WEBHOOKS=true
STORE_FAILED_PAYLOADS=true
EOL

  echo "Created template file $ENV_FILE"
  echo "Please edit this file with your actual configuration"
fi

# Create .dev.vars file for local development
echo "Creating .dev.vars file for local development..."
cat "$ENV_FILE" | grep -v '^#' | grep '=' > .dev.vars

# Install dependencies
echo "Installing dependencies..."
npm install

# Set up git hooks
echo "Setting up git hooks..."
if [[ -d ".git" ]]; then
  # Create pre-commit hook
  mkdir -p .git/hooks
  cat > .git/hooks/pre-commit << EOL
#!/bin/bash
# Pre-commit hook to run linting and tests

echo "Running linting..."
npm run lint

echo "Running tests..."
npm test

# If any command fails, exit with non-zero status
exit \$?
EOL

  chmod +x .git/hooks/pre-commit
  echo "Git hooks set up successfully"
else
  echo "Warning: Not a git repository, skipping git hooks setup"
fi

echo "=== Local development environment set up successfully ==="
echo ""
echo "To start the development server, run:"
echo "npm run dev"