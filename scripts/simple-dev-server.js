/**
 * Simple development server for phone-agent
 * 
 * This server provides a basic local development environment with mock API endpoints.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 8787;

// Middleware for parsing JSON and serving static files
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// Load environment variables from .env file if it exists
try {
  if (fs.existsSync(path.join(__dirname, '../.env'))) {
    require('dotenv').config({ path: path.join(__dirname, '../.env') });
    console.log('Loaded environment variables from .env file');
  }
} catch (error) {
  console.warn('Failed to load .env file:', error.message);
}

// API Routes
app.get('/api', (req, res) => {
  console.log('[API] GET /api - Info endpoint accessed');
  
  const apiInfo = {
    name: "Phone Agent API",
    version: "1.0.0",
    status: "operational",
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    endpoints: [
      {
        path: "/api",
        method: "GET",
        description: "API information and health check"
      },
      {
        path: "/api/webhook",
        method: "POST",
        description: "Process email notifications and calendar invites"
      },
      {
        path: "/api/schedule",
        method: "GET",
        description: "Retrieve scheduling information"
      },
      {
        path: "/api/schedule/cancel",
        method: "POST",
        description: "Cancel a scheduled call"
      }
    ]
  };
  
  res.json(apiInfo);
});

app.post('/api/webhook', (req, res) => {
  console.log('[API] POST /api/webhook - Webhook endpoint accessed');
  const payload = req.body;
  
  // Log the webhook payload if debugging is enabled
  const debugWebhooks = process.env.DEBUG_WEBHOOKS === 'true';
  if (debugWebhooks) {
    console.log('Webhook payload:', JSON.stringify(payload, null, 2));
  }
  
  // Process the webhook (mock implementation for development)
  const response = {
    success: true,
    requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    message: 'Webhook received successfully',
    timestamp: new Date().toISOString(),
    payload: {
      sender: payload.sender || 'unknown',
      subject: payload.subject || 'No subject',
      hasAttachments: Array.isArray(payload.attachments) && payload.attachments.length > 0
    }
  };
  
  res.json(response);
});

app.get('/api/schedule', (req, res) => {
  console.log('[API] GET /api/schedule - Schedule endpoint accessed');
  const { requestId, email } = req.query;
  
  // Mock schedule data
  const schedule = {
    id: requestId || "call_" + Math.random().toString(36).substring(2, 8),
    status: "scheduled",
    scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    duration: 30,
    participants: [
      {
        name: "John Doe",
        email: email || "john@example.com",
        role: "organizer"
      },
      {
        name: "AI Agent",
        role: "attendee"
      }
    ]
  };
  
  res.json({
    success: true,
    schedule
  });
});

app.post('/api/schedule/cancel', (req, res) => {
  console.log('[API] POST /api/schedule/cancel - Cancel endpoint accessed');
  const { requestId, reason } = req.body;
  
  if (!requestId) {
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'requestId is required'
    });
  }
  
  res.json({
    success: true,
    message: `Call ${requestId} successfully cancelled`,
    reason: reason || 'User requested cancellation'
  });
});

// Add a catch-all route for API requests that don't match any defined routes
app.all('/api/*', (req, res) => {
  console.log(`[API] ${req.method} ${req.path} - Endpoint not found`);
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `API endpoint ${req.path} not found or method ${req.method} not supported`
  });
});

// Start the server
app.listen(port, () => {
  console.log(`
┌─────────────────────────────────────────────────┐
│                                                 │
│   Phone Agent Development Server                │
│                                                 │
│   Server running at http://localhost:${port}      │
│                                                 │
│   API endpoints available at:                   │
│     - GET  /api                                 │
│     - POST /api/webhook                         │
│     - GET  /api/schedule                        │
│     - POST /api/schedule/cancel                 │
│                                                 │
│   Press Ctrl+C to stop the server               │
│                                                 │
└─────────────────────────────────────────────────┘
  `);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down server...');
  process.exit(0);
});