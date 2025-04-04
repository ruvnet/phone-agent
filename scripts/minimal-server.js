/**
 * Minimal development server for phone-agent
 * 
 * This server provides a basic local development environment with mock API endpoints
 * using only Node.js built-in modules to avoid dependency issues.
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8787;
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

// Make a request to the Cloudflare Pages API
const callCloudflareApi = async (method, path, data = null) => {
  // Get the Cloudflare endpoint from environment variables
  const cloudflareEndpoint = process.env.CLOUDFLARE_SCHEDULE_ENDPOINT || 'https://phone-agent.pages.dev/api/schedule';
  const cloudflareApiToken = process.env.CLOUDFLARE_API_TOKEN || '';
  
  // Parse the URL to get hostname, path, etc.
  const parsedUrl = new URL(cloudflareEndpoint);
  const baseUrl = parsedUrl.origin;
  const apiPath = parsedUrl.pathname + (path ? path : '');
  
  console.log(`[CLOUDFLARE] Making ${method} request to ${baseUrl}${apiPath}`);
  
  return new Promise((resolve, reject) => {
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    // Add authorization if token is available
    if (cloudflareApiToken) {
      options.headers['Authorization'] = `Bearer ${cloudflareApiToken}`;
    }
    
    // For GET requests with query parameters
    let fullPath = apiPath;
    if (method === 'GET' && data) {
      const queryParams = new URLSearchParams(data).toString();
      fullPath = `${apiPath}?${queryParams}`;
    }
    
    // Create the request
    const req = https.request(`${baseUrl}${fullPath}`, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          console.log(`[CLOUDFLARE] Response status: ${res.statusCode}`);
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsedData);
          } else {
            console.error(`[CLOUDFLARE] API error: ${parsedData.message || 'Unknown error'}`);
            reject(new Error(parsedData.message || 'API request failed'));
          }
        } catch (error) {
          console.error('[CLOUDFLARE] Error parsing response:', error);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('[CLOUDFLARE] Request error:', error);
      reject(error);
    });
    
    // Send data for POST/PUT requests
    if ((method === 'POST' || method === 'PUT') && data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
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
          path: "/api/config",
          method: "GET",
          description: "Get API configuration"
        },
        {
          path: "/api/webhook",
          method: "POST",
          description: "Process email notifications and calendar invites"
        },
        {
          path: "/api/schedule",
          method: "POST",
          description: "Schedule a call with the AI agent"
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
    
    sendJsonResponse(res, apiInfo);
  },
  
  // GET /api/config - Get API configuration
  'GET /api/config': (req, res) => {
    console.log('[API] GET /api/config - Config endpoint accessed');
    
    // Return the configuration from environment variables
    const config = {
      cloudflareEndpoint: process.env.CLOUDFLARE_SCHEDULE_ENDPOINT || 'https://phone-agent.pages.dev/api/schedule',
      environment: process.env.NODE_ENV || 'development',
      debug: process.env.DEBUG_WEBHOOKS === 'true',
      timestamp: new Date().toISOString()
    };
    
    sendJsonResponse(res, config);
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
  'GET /api/schedule': async (req, res) => {
    console.log('[API] GET /api/schedule - Schedule endpoint accessed');
    
    try {
      const parsedUrl = url.parse(req.url, true);
      const { callId } = parsedUrl.query;
      
      if (callId) {
        // If callId is provided, forward the request to Cloudflare
        console.log(`[API] Checking status for call ID: ${callId}`);
        
        try {
          const callStatus = await callCloudflareApi('GET', '', { callId });
          sendJsonResponse(res, callStatus);
        } catch (error) {
          console.error('Error checking call status:', error);
          sendJsonResponse(res, {
            success: false,
            error: 'Failed to check call status',
            message: error.message
          }, 500);
        }
      } else {
        // If no callId, return mock schedule data
        const requestId = parsedUrl.query.requestId;
        const email = parsedUrl.query.email;
        
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
      }
    } catch (error) {
      console.error('Error processing schedule request:', error);
      sendJsonResponse(res, {
        success: false,
        error: 'Internal server error',
        message: error.message
      }, 500);
    }
  },
  
  // POST /api/schedule - Schedule a call
  'POST /api/schedule': async (req, res) => {
    console.log('[API] POST /api/schedule - Schedule call endpoint accessed');
    
    try {
      const payload = await parseJsonBody(req);
      const { name, phone, scheduledTime, topic, immediate } = payload;
      
      // Validate required fields
      if (!name || !phone || !scheduledTime) {
        sendJsonResponse(res, {
          success: false,
          error: 'Bad Request',
          message: 'Missing required fields'
        }, 400);
        return;
      }
      
      console.log('[CALL SCHEDULED]', {
        name,
        phone: phone.substring(0, 3) + '****' + phone.substring(phone.length - 4), // Mask phone number
        scheduledTime,
        topic,
        immediate: !!immediate
      });
      
      // Forward the request to the Cloudflare Pages API
      try {
        console.log('[API] Forwarding call request to Cloudflare Pages API');
        
        const response = await callCloudflareApi('POST', '', payload);
        
        // Return the response from Cloudflare
        sendJsonResponse(res, response);
      } catch (error) {
        console.error('Error making call through Cloudflare API:', error);
        sendJsonResponse(res, {
          success: false,
          error: 'Failed to schedule call',
          message: error.message
        }, 500);
      }
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
      
      // Forward the cancel request to Cloudflare
      try {
        console.log(`[API] Forwarding cancel request for ID: ${requestId}`);
        
        const response = await callCloudflareApi('POST', '/cancel', payload);
        
        // Return the response from Cloudflare
        sendJsonResponse(res, response);
      } catch (error) {
        console.error('Error cancelling call through Cloudflare API:', error);
        
        // If the Cloudflare API fails, return a mock success response
        sendJsonResponse(res, {
          success: true,
          message: `Call ${requestId} successfully cancelled`,
          reason: reason || 'User requested cancellation'
        });
      }
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
│     - GET  /api/config                          │
│     - POST /api/webhook                         │
│     - GET  /api/schedule                        │
│     - POST /api/schedule                        │
│     - POST /api/schedule/cancel                 │
│                                                 │
│   Using Cloudflare API: ${process.env.CLOUDFLARE_SCHEDULE_ENDPOINT || 'https://phone-agent.pages.dev/api/schedule'}
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