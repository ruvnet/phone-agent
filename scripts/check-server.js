/**
 * Server Status Checker
 * 
 * This script checks if the development server is running and displays its status.
 * It can be used to verify that the API endpoints are accessible.
 */

const http = require('http');

// Configuration
const HOST = 'localhost';
const PORT = process.env.PORT || 8787;
const ENDPOINTS = [
  { method: 'GET', path: '/api', name: 'API Info' },
  { method: 'GET', path: '/api/schedule?requestId=test123', name: 'Schedule Info' },
  { method: 'POST', path: '/api/webhook', name: 'Webhook Handler' },
  { method: 'POST', path: '/api/schedule/cancel', name: 'Schedule Cancellation' }
];

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

/**
 * Make an HTTP request to the specified endpoint
 */
function makeRequest(method, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: method,
      timeout: 3000, // 3 second timeout
      headers: {}
    };

    // Add headers for POST requests
    if (method === 'POST') {
      options.headers['Content-Type'] = 'application/json';
    }

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    // Send a body for POST requests
    if (method === 'POST') {
      if (path === '/api/webhook') {
        req.write(JSON.stringify({
          sender: 'test@example.com',
          subject: 'Server Check',
          body: 'This is an automated server check'
        }));
      } else if (path === '/api/schedule/cancel') {
        req.write(JSON.stringify({
          requestId: 'test123',
          reason: 'Server check'
        }));
      }
    }
    
    req.end();
  });
}

/**
 * Check if the server is running and test all endpoints
 */
async function checkServer() {
  console.log(`${colors.bright}${colors.blue}Phone Agent Server Status Check${colors.reset}\n`);
  console.log(`${colors.cyan}Checking server at ${HOST}:${PORT}...${colors.reset}\n`);
  
  let serverRunning = false;
  
  try {
    // First check if the server is running at all
    await makeRequest('GET', '/');
    serverRunning = true;
    console.log(`${colors.green}✓ Server is running${colors.reset}\n`);
  } catch (error) {
    console.log(`${colors.red}✗ Server is not running${colors.reset}`);
    console.log(`${colors.yellow}Error: ${error.message}${colors.reset}\n`);
    console.log(`${colors.yellow}Please start the server using one of the following commands:${colors.reset}`);
    console.log(`${colors.cyan}  npm run dev${colors.reset}          - Standard Wrangler development server`);
    console.log(`${colors.cyan}  npm run dev:local${colors.reset}    - Custom Express development server`);
    console.log(`${colors.cyan}  npm run dev:minimal${colors.reset}  - Minimal Node.js development server\n`);
    process.exit(1);
  }
  
  // If server is running, check all endpoints
  if (serverRunning) {
    console.log(`${colors.bright}API Endpoint Status:${colors.reset}\n`);
    
    const results = [];
    
    for (const endpoint of ENDPOINTS) {
      process.stdout.write(`  Testing ${endpoint.method} ${endpoint.path} (${endpoint.name})... `);
      
      try {
        const response = await makeRequest(endpoint.method, endpoint.path);
        
        if (response.statusCode >= 200 && response.statusCode < 300) {
          console.log(`${colors.green}✓ OK (${response.statusCode})${colors.reset}`);
          results.push({
            endpoint: endpoint,
            status: 'success',
            statusCode: response.statusCode
          });
        } else {
          console.log(`${colors.yellow}⚠ Warning (${response.statusCode})${colors.reset}`);
          results.push({
            endpoint: endpoint,
            status: 'warning',
            statusCode: response.statusCode
          });
        }
      } catch (error) {
        console.log(`${colors.red}✗ Failed (${error.message})${colors.reset}`);
        results.push({
          endpoint: endpoint,
          status: 'error',
          error: error.message
        });
      }
    }
    
    // Print summary
    console.log(`\n${colors.bright}Summary:${colors.reset}`);
    
    const successful = results.filter(r => r.status === 'success').length;
    const warnings = results.filter(r => r.status === 'warning').length;
    const errors = results.filter(r => r.status === 'error').length;
    
    console.log(`  ${colors.green}${successful} endpoints successful${colors.reset}`);
    console.log(`  ${colors.yellow}${warnings} endpoints with warnings${colors.reset}`);
    console.log(`  ${colors.red}${errors} endpoints with errors${colors.reset}\n`);
    
    if (errors > 0) {
      console.log(`${colors.yellow}Some endpoints are not working correctly. Check the server logs for more details.${colors.reset}\n`);
      process.exit(1);
    } else if (warnings > 0) {
      console.log(`${colors.yellow}All endpoints are accessible, but some returned unexpected status codes.${colors.reset}\n`);
      process.exit(0);
    } else {
      console.log(`${colors.green}All endpoints are working correctly!${colors.reset}\n`);
      process.exit(0);
    }
  }
}

// Run the check
checkServer().catch(error => {
  console.error(`${colors.red}Unexpected error: ${error.message}${colors.reset}`);
  process.exit(1);
});