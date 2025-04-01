# Development Server Guide

This guide explains the different development server options available for the Phone Agent application.

## Development Server Options

The Phone Agent application provides three different development server options to accommodate various development environments and requirements:

### 1. Standard Wrangler Development Server

The standard method uses Cloudflare's Wrangler CLI to run a local development server that closely mimics the Cloudflare Pages production environment.

```bash
npm run dev
```

**Pros:**
- Most accurate representation of the production environment
- Full support for Cloudflare Workers features
- Automatic reloading on file changes

**Cons:**
- May have compatibility issues with certain Linux distributions due to GLIBC requirements
- Requires more system resources

**Port:** 8788

### 2. Custom Express Development Server

A custom Express.js server that provides API endpoints and static file serving without requiring Wrangler.

```bash
npm run dev:local
```

**Pros:**
- Works on systems with GLIBC compatibility issues
- Lighter weight than Wrangler
- Provides mock implementations of Cloudflare-specific features

**Cons:**
- May not perfectly replicate all Cloudflare Pages behaviors
- Requires Express.js dependency

**Port:** 8787

### 3. Minimal Node.js Development Server

A lightweight server using only Node.js built-in modules (http, fs, path, url) with no external dependencies.

```bash
npm run dev:minimal
```

**Pros:**
- Maximum compatibility across all environments
- No external dependencies required
- Smallest resource footprint
- Simple and easy to understand/modify

**Cons:**
- Most basic implementation
- Limited feature set compared to other options
- No automatic reloading

**Port:** 8787

## Checking Server Status

You can verify that your development server is running correctly by using the server status check script:

```bash
npm run check
```

This script will:
1. Check if the server is running
2. Test all API endpoints
3. Provide a summary of the results

## API Endpoints

All development servers provide the following API endpoints:

### GET /api

Returns information about the API, including available endpoints and version.

**Example:**
```bash
curl http://localhost:8787/api
```

### POST /api/webhook

Processes webhook payloads from email services and phone call providers.

**Example:**
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"sender":"test@example.com","subject":"Test Webhook","body":"This is a test"}' \
  http://localhost:8787/api/webhook
```

### GET /api/schedule

Retrieves scheduling information for a specific request.

**Example:**
```bash
curl http://localhost:8787/api/schedule?requestId=test123
```

### POST /api/schedule/cancel

Cancels a scheduled call.

**Example:**
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"requestId":"test123","reason":"Testing cancellation"}' \
  http://localhost:8787/api/schedule/cancel
```

## Troubleshooting

### Server Won't Start

If you encounter issues starting the server:

1. Check if another process is already using the required port (8787 or 8788)
2. Ensure you have the necessary dependencies installed (`npm install`)
3. Verify that your `.env` file exists and contains the required variables
4. Try a different development server option

### API Endpoints Not Working

If the server starts but API endpoints return errors:

1. Check the server logs for error messages
2. Verify that you're using the correct port (8787 for dev:local and dev:minimal, 8788 for standard dev)
3. Ensure your request format is correct (proper JSON for POST requests)
4. Try running the server status check: `npm run check`

### GLIBC Compatibility Issues

If you see errors related to GLIBC when using Wrangler:

```
Error: /lib/x86_64-linux-gnu/libc.so.6: version 'GLIBC_2.28' not found
```

Switch to one of the alternative development servers:

```bash
# Option 1: Custom Express server
npm run dev:local

# Option 2: Minimal Node.js server
npm run dev:minimal
```

## Environment Variables

All development servers will attempt to load environment variables from a `.env` file in the project root. Make sure this file exists and contains the necessary variables.

See the `.env.example` file for a list of required variables.