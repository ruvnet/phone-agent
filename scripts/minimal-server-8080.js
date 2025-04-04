/**
 * Minimal development server for phone-agent
 * 
 * This server provides a basic local development environment with mock API endpoints
 * using only Node.js built-in modules to avoid dependency issues.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8080; // Changed port to 8080
const PUBLIC_DIR = path.join(__dirname, '../public');

// MIME types for different file extensions
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain'
};

// Load environment variables from .env file if it exists
try {
  if (fs.existsSync(path.join(__dirname, '../.env'))) {
    const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match && match[1] && !match[1].startsWith('#')) {
        process.env[match[1].trim()] = match[2].trim().replace(/^["'](.*)["']$/, '$1');
      }
    });
    console.log('Loaded environment variables from .env file');
  }
} catch (error) {
  console.warn('Failed to load .env file:', error.message);
}

// Parse JSON request body
const parseJsonBody = async (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (body) {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(new Error('Invalid JSON'));
        }
      } else {
        resolve({});
      }
    });
    req.on('error', reject);
  });
};

// Send JSON response
const sendJsonResponse = (res, data, statusCode = 200) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data, null, 2));
};

// Serve static file
const serveStaticFile = (req, res, filePath) => {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // If the file doesn't exist, try serving index.html
        if (filePath !== path.join(PUBLIC_DIR, 'index.html')) {
          serveStaticFile(req, res, path.join(PUBLIC_DIR, 'index.html'));
        } else {
          res.writeHead(404);
          res.end('404 Not Found');
        }
      } else {
        res.writeHead(500);
        res.end('500 Internal Server Error');
        console.error(`Error reading file ${filePath}:`, err);
      }
      return;
    }
    
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
};

// API handlers
const apiHandlers = {
  // GET /api - API information
  'GET /api': (req, res) => {
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
          path: "/api/schedule",
          method: "POST",
          description: "Schedule a new call"
        },
        {
          path: "/api/schedule/cancel",
          method: "POST",
          description: "Cancel a scheduled call"
        }
      ]
    };
    
    sendJsonResponse(res, apiInfo);
  },
  
  // POST /api/webhook - Process webhook
  'POST /api/webhook': async (req, res) => {
    console.log('[API] POST /api/webhook - Webhook endpoint accessed');
    
    try {
      const payload = await parseJsonBody(req);
      
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
      
      sendJsonResponse(res, response);
    } catch (error) {
      console.error('Error processing webhook:', error);
      sendJsonResponse(res, {
        success: false,
        error: 'Internal server error',
        message: error.message
      }, 500);
    }
  },
  
  // GET /api/schedule - Get schedule information
  'GET /api/schedule': (req, res) => {
    console.log('[API] GET /api/schedule - Schedule endpoint accessed');
    
    const parsedUrl = url.parse(req.url, true);
    const { requestId, email } = parsedUrl.query;
    
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
    
    sendJsonResponse(res, {
      success: true,
      schedule
    });
  },
  
  // POST /api/schedule - Schedule a new call
  'POST /api/schedule': async (req, res) => {
    console.log('[API] POST /api/schedule - Schedule endpoint accessed');
    
    try {
      const payload = await parseJsonBody(req);
      const { name, phone, scheduledTime, topic } = payload;
      
      // Validate required fields
      if (!name || !phone || !scheduledTime) {
        sendJsonResponse(res, {
          success: false,
          error: 'Bad Request',
          message: 'Missing required fields: name, phone, and scheduledTime are required'
        }, 400);
        return;
      }
      
      // Generate a unique request ID
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      
      // Mock successful response
      sendJsonResponse(res, {
        success: true,
        requestId: requestId,
        message: 'Call scheduled successfully',
        scheduledTime: scheduledTime,
        details: {
          name,
          phone: phone.substring(0, 3) + '****' + phone.substring(phone.length - 4), // Mask phone number
          topic: topic || 'General discussion'
        }
      });
    } catch (error) {
      console.error('Error scheduling call:', error);
      sendJsonResponse(res, {
        success: false,
        error: 'Internal server error',
        message: error.message
      }, 500);
    }
  },
  
  // POST /api/schedule/cancel - Cancel a scheduled call
  'POST /api/schedule/cancel': async (req, res) => {
    console.log('[API] POST /api/schedule/cancel - Cancel endpoint accessed');
    
    try {
      const payload = await parseJsonBody(req);
      const { requestId, reason } = payload;
      
      if (!requestId) {
        sendJsonResponse(res, {
          success: false,
          error: 'Bad Request',
          message: 'requestId is required'
        }, 400);
        return;
      }
      
      sendJsonResponse(res, {
        success: true,
        message: `Call ${requestId} successfully cancelled`,
        reason: reason || 'User requested cancellation'
      });
    } catch (error) {
      console.error('Error cancelling schedule:', error);
      sendJsonResponse(res, {
        success: false,
        error: 'Internal server error',
        message: error.message
      }, 500);
    }
  }
};

// Create HTTP server
const server = http.createServer(async (req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  const parsedUrl = url.parse(req.url);
  const pathname = parsedUrl.pathname;
  
  // Handle API requests
  if (pathname.startsWith('/api')) {
    const apiKey = `${req.method} ${pathname.replace(/\/$/, '')}`;
    
    if (apiHandlers[apiKey]) {
      apiHandlers[apiKey](req, res);
    } else {
      console.log(`[API] ${req.method} ${pathname} - Endpoint not found`);
      sendJsonResponse(res, {
        success: false,
        error: 'Not Found',
        message: `API endpoint ${pathname} not found or method ${req.method} not supported`
      }, 404);
    }
    return;
  }
  
  // Serve static files
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  
  // If the path doesn't have an extension, assume it's a route and serve index.html
  if (!path.extname(filePath) && !fs.existsSync(filePath)) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }
  
  serveStaticFile(req, res, filePath);
});

// Start the server
server.listen(PORT, () => {
  console.log(`
┌─────────────────────────────────────────────────┐
│                                                 │
│   Phone Agent Development Server                │
│                                                 │
│   Server running at http://localhost:${PORT}      │
│                                                 │
│   API endpoints available at:                   │
│     - GET  /api                                 │
│     - POST /api/webhook                         │
│     - GET  /api/schedule                        │
│     - POST /api/schedule                        │
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
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\nShutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});