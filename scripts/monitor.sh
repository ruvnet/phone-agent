#!/bin/bash
# Script for monitoring and debugging Cloudflare Pages deployments

# Exit on error
set -e

# Display help information
function show_help {
  echo "Usage: ./scripts/monitor.sh [options] [command]"
  echo ""
  echo "Commands:"
  echo "  logs        View deployment logs"
  echo "  status      Check deployment status"
  echo "  metrics     View performance metrics"
  echo ""
  echo "Options:"
  echo "  -e, --environment <env>  Target environment (dev, staging, prod)"
  echo "  -p, --project <name>     Cloudflare Pages project name"
  echo "  -t, --tail               Tail logs (only for 'logs' command)"
  echo "  -h, --help               Show this help message"
  echo ""
  echo "Examples:"
  echo "  ./scripts/monitor.sh logs -e prod -p my-webhook-project -t"
  echo "  ./scripts/monitor.sh status -e staging -p my-webhook-project"
}

# Default values
ENVIRONMENT="dev"
PROJECT_NAME=""
TAIL_LOGS=false
COMMAND=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    logs|status|metrics)
      COMMAND="$1"
      shift
      ;;
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
    -t|--tail)
      TAIL_LOGS=true
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

# Validate command
if [[ -z "$COMMAND" ]]; then
  echo "Error: Command is required"
  show_help
  exit 1
fi

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

# Map environment to branch
if [[ "$ENVIRONMENT" == "dev" ]]; then
  BRANCH="dev"
elif [[ "$ENVIRONMENT" == "staging" ]]; then
  BRANCH="staging"
else
  BRANCH="main"
fi

echo "=== Monitoring $PROJECT_NAME in $ENVIRONMENT environment ==="

case $COMMAND in
  logs)
    echo "Fetching logs..."
    if [[ "$TAIL_LOGS" == true ]]; then
      echo "Tailing logs (press Ctrl+C to stop)..."
      npx wrangler pages deployment tail --project-name "$PROJECT_NAME" --branch "$BRANCH"
    else
      npx wrangler pages deployment list --project-name "$PROJECT_NAME" --branch "$BRANCH" | head -n 10
      echo ""
      echo "To view detailed logs for a specific deployment, use:"
      echo "npx wrangler pages deployment tail <deployment-id> --project-name \"$PROJECT_NAME\""
    fi
    ;;
  status)
    echo "Checking deployment status..."
    npx wrangler pages deployment list --project-name "$PROJECT_NAME" --branch "$BRANCH" | head -n 5
    ;;
  metrics)
    echo "Fetching performance metrics..."
    echo "Note: This is a placeholder. Actual metrics collection would depend on your monitoring setup."
    echo ""
    echo "Suggested monitoring approaches:"
    echo "1. Use Cloudflare Analytics in the dashboard"
    echo "2. Set up custom metrics collection in your application"
    echo "3. Integrate with a third-party monitoring service"
    ;;
  *)
    echo "Error: Unknown command: $COMMAND"
    show_help
    exit 1
    ;;
esac

echo "=== Monitoring completed ==="