/**
 * Custom development server for phone-agent
 * 
 * This server provides a local development environment that mimics Cloudflare Pages
 * without requiring Wrangler, avoiding GLIBC compatibility issues.
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

// Create a mock KV namespace for development
const mockKV = {
  store: new Map(),
  get: async (key) => {
    console.log(`[KV] GET ${key}`);
    return mockKV.store.get(key);
  },
  put: async (key, value, options) => {
    console.log(`[KV] PUT ${key}`);
    mockKV.store.set(key, value);
    return true;
  },
  delete: async (key) => {
    console.log(`[KV] DELETE ${key}`);
    return mockKV.store.delete(key);
  },
  list: async (options) => {
    console.log(`[KV] LIST ${options?.prefix || ''}`);
    const keys = [];
    const prefix = options?.prefix || '';
    const limit = options?.limit || 1000;
    
    for (const key of mockKV.store.keys()) {
      if (key.startsWith(prefix)) {
        keys.push({ name: key });
        if (keys.length >= limit) break;
      }
    }
    
    return { keys };
  }
};

// Mock storage service for development
const mockStorageService = {
  get: async (key) => {
    return mockKV.get(key);
  },
  set: async (key, value) => {
    return mockKV.put(key, JSON.stringify(value));
  },
  delete: async (key) => {
    return mockKV.delete(key);
  },
  list: async (prefix) => {
    const result = await mockKV.list({ prefix });
    return result.keys.map(k => k.name);
  }
};

// Mock webhook handler for development
const mockWebhookHandler = {
  processWebhook: async (payload, options) => {
    console.log('[WEBHOOK] Processing webhook payload:', payload);
    return {
      success: true,
      requestId: `req_${Date.now()}`,
      message: 'Webhook processed successfully (mock)'
    };
  }
};

// Setup API routes - IMPORTANT: Define routes without trailing slashes
app.get('/api', async (req, res) => {
  try {
    console.log('[API] GET /api - Info endpoint accessed');
    
    // Get environment information (safely)
    const environment = process.env.NODE_ENV || 'development';
    
    // Create response with API information
    const apiInfo = {
      name: "Phone Agent API",
      version: "1.0.0",
      status: "operational",
      environment: environment,
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
  } catch (error) {
    console.error('Error in API endpoint:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

app.post('/api/webhook', async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

app.get('/api/schedule', async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error retrieving schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

app.post('/api/schedule/cancel', async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error cancelling schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Try to load API functions from the functions/api directory, but don't fail if they don't work
const functionsDir = path.join(__dirname, '../functions/api');
if (fs.existsSync(functionsDir)) {
  fs.readdirSync(functionsDir).forEach(file => {
    if (file.endsWith('.js')) {
      const functionName = file.replace('.js', '');
      const functionPath = path.join(functionsDir, file);
      try {
        console.log(`Attempting to load API function: ${functionName}`);
        // We don't actually load these since we've implemented the routes directly above
        // This is just for logging purposes
      } catch (error) {
        console.error(`Failed to load API function ${functionName}:`, error);
      }
    }
  });
}

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