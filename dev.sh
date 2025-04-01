#!/bin/bash

# dev.sh - Local development script for phone-agent
# This script provides an alternative to running wrangler directly when
# there are GLIBC compatibility issues

# Make script exit on error
set -e

# Print colorful messages
print_info() {
  echo -e "\033[0;34m[INFO]\033[0m $1"
}

print_success() {
  echo -e "\033[0;32m[SUCCESS]\033[0m $1"
}

print_error() {
  echo -e "\033[0;31m[ERROR]\033[0m $1"
}

print_warning() {
  echo -e "\033[0;33m[WARNING]\033[0m $1"
}

# Check if .env file exists and load it
if [ -f .env ]; then
  print_info "Loading environment variables from .env file"
  # Don't export directly, as it can cause issues with special characters
  # Instead, we'll source the file in a safer way
  set -a
  source .env
  set +a
elif [ -f .env.example ]; then
  print_info "No .env file found, creating one from .env.example"
  cp .env.example .env
  print_warning "Please update the .env file with your actual values"
  set -a
  source .env
  set +a
else
  print_warning "No .env or .env.example file found. Environment variables may be missing."
fi

# Check if node is installed
if ! command -v node &> /dev/null; then
  print_error "Node.js is not installed. Please install Node.js to continue."
  exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
  print_error "npm is not installed. Please install npm to continue."
  exit 1
fi

# Function to display usage information
show_usage() {
  echo "Usage: ./dev.sh [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  --help, -h       Show this help message"
  echo "  --express, -e    Use Express server (default if available)"
  echo "  --minimal, -m    Use minimal Node.js server"
  echo "  --wrangler, -w   Try to use Wrangler (may have compatibility issues)"
  echo ""
  echo "Examples:"
  echo "  ./dev.sh                 # Use the best available server"
  echo "  ./dev.sh --minimal       # Force use of minimal server"
  echo "  ./dev.sh --express       # Force use of Express server"
  echo "  ./dev.sh --wrangler      # Try to use Wrangler"
}

# Parse command line arguments
SERVER_TYPE=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --help|-h)
      show_usage
      exit 0
      ;;
    --express|-e)
      SERVER_TYPE="express"
      shift
      ;;
    --minimal|-m)
      SERVER_TYPE="minimal"
      shift
      ;;
    --wrangler|-w)
      SERVER_TYPE="wrangler"
      shift
      ;;
    *)
      print_error "Unknown option: $1"
      show_usage
      exit 1
      ;;
  esac
done

# Function to start the minimal development server
start_minimal_server() {
  print_info "Starting minimal Node.js development server..."
  
  if [ -f scripts/minimal-server.js ]; then
    print_info "Using minimal server from scripts/minimal-server.js"
    node scripts/minimal-server.js
  else
    print_error "Minimal server script not found at scripts/minimal-server.js"
    exit 1
  fi
}

# Function to start the Express development server
start_express_server() {
  print_info "Starting Express development server..."
  
  if [ -f scripts/dev-server.js ]; then
    print_info "Using Express server from scripts/dev-server.js"
    node scripts/dev-server.js
  else
    print_error "Express server script not found at scripts/dev-server.js"
    exit 1
  fi
}

# Function to start Wrangler development server
start_wrangler_server() {
  print_info "Attempting to start Wrangler development server..."
  
  if npx wrangler --version &> /dev/null; then
    print_info "Wrangler is available, starting Pages development server"
    npx wrangler pages dev public --compatibility-date=2023-06-01
  else
    print_error "Wrangler is not available or has compatibility issues"
    print_warning "Falling back to Express server"
    start_express_server
  fi
}

# Function to build the project
build_project() {
  print_info "Building project..."
  npm run build
}

# Check if functions directory exists
if [ -d functions ]; then
  print_info "Functions directory detected. Setting up API handlers..."
fi

# Determine which server to start based on command line arguments or availability
if [ "$SERVER_TYPE" = "minimal" ]; then
  start_minimal_server
elif [ "$SERVER_TYPE" = "express" ]; then
  start_express_server
elif [ "$SERVER_TYPE" = "wrangler" ]; then
  start_wrangler_server
else
  # Auto-detect best server to use
  if [ -f scripts/minimal-server.js ]; then
    print_info "Minimal server detected, using it for maximum compatibility"
    start_minimal_server
  elif [ -f scripts/dev-server.js ]; then
    print_info "Express server detected, using it for better feature support"
    start_express_server
  else
    print_info "No custom server scripts found, attempting to use Wrangler"
    start_wrangler_server
  fi
fi