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

# Function to start the development server
start_dev_server() {
  print_info "Starting development server..."
  
  # Check if we have a custom dev server script
  if [ -f scripts/dev-server.js ]; then
    print_info "Using custom dev server from scripts/dev-server.js"
    node scripts/dev-server.js
  else
    # If no custom server, use a simple static file server
    print_info "Using simple static file server for public directory"
    npx serve public
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
  
  # Create a simple Express server to handle API requests if not using Wrangler
  if [ ! -f scripts/dev-server.js ]; then
    print_info "Creating temporary Express server for API functions"
    
    # Create a temporary server file
    cat > temp-server.js << 'EOF'
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 8787;

// Serve static files from public directory
app.use(express.static('public'));
app.use(express.json());

// Load API functions
const functionsDir = path.join(__dirname, 'functions/api');
if (fs.existsSync(functionsDir)) {
  fs.readdirSync(functionsDir).forEach(file => {
    if (file.endsWith('.js')) {
      const functionName = file.replace('.js', '');
      const functionPath = path.join(functionsDir, file);
      try {
        const functionModule = require(functionPath);
        if (typeof functionModule.onRequest === 'function') {
          app.all(`/api/${functionName === 'index' ? '' : functionName}*`, async (req, res) => {
            try {
              // Create a context object similar to what Cloudflare Pages provides
              const context = {
                request: new Request(`http://${req.headers.host}${req.url}`, {
                  method: req.method,
                  headers: req.headers,
                  body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
                }),
                env: process.env,
                params: req.params
              };
              
              const response = await functionModule.onRequest(context);
              
              // Send the response
              res.status(response.status || 200);
              for (const [key, value] of response.headers.entries()) {
                res.setHeader(key, value);
              }
              
              const responseText = await response.text();
              res.send(responseText);
            } catch (error) {
              console.error(`Error in API function ${functionName}:`, error);
              res.status(500).json({ error: 'Internal Server Error' });
            }
          });
          console.log(`Registered API endpoint: /api/${functionName === 'index' ? '' : functionName}`);
        }
      } catch (error) {
        console.error(`Failed to load API function ${functionName}:`, error);
      }
    }
  });
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Press Ctrl+C to stop the server`);
});
EOF
    
    print_info "Starting Express server for local development"
    node temp-server.js
  else
    start_dev_server
  fi
else
  # No functions directory, just start the dev server
  start_dev_server
fi