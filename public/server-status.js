/**
 * Server Status Script
 * 
 * This script checks the server status by pinging the API endpoints
 * and updates the UI accordingly.
 */

document.addEventListener('DOMContentLoaded', function() {
  // Add a status indicator to the header
  const headerContent = document.querySelector('.header-content');
  if (headerContent) {
    const statusIndicator = document.createElement('div');
    statusIndicator.className = 'server-status';
    statusIndicator.innerHTML = `
      <div class="status-indicator checking"></div>
      <span class="status-text">Checking server...</span>
    `;
    headerContent.appendChild(statusIndicator);
    
    // Check server status
    checkServerStatus();
  }
  
  // Add event listeners to API endpoints to show details
  const endpoints = document.querySelectorAll('.endpoint');
  endpoints.forEach(endpoint => {
    const url = endpoint.querySelector('.url').textContent;
    const testButton = document.createElement('button');
    testButton.className = 'test-endpoint-btn';
    testButton.textContent = 'Test Endpoint';
    testButton.onclick = () => testEndpoint(url);
    
    const endpointUrl = endpoint.querySelector('.endpoint-url');
    endpointUrl.appendChild(testButton);
  });
});

/**
 * Check the server status by pinging the API
 */
function checkServerStatus() {
  fetch('/api')
    .then(response => {
      updateStatusIndicator(response.ok);
      return response.json();
    })
    .then(data => {
      console.log('Server status:', data);
    })
    .catch(error => {
      console.error('Server status check failed:', error);
      updateStatusIndicator(false);
    });
}

/**
 * Update the status indicator in the UI
 */
function updateStatusIndicator(isOnline) {
  const statusIndicator = document.querySelector('.status-indicator');
  const statusText = document.querySelector('.status-text');
  
  if (statusIndicator && statusText) {
    statusIndicator.classList.remove('checking', 'online', 'offline');
    
    if (isOnline) {
      statusIndicator.classList.add('online');
      statusText.textContent = 'Server Online';
    } else {
      statusIndicator.classList.add('offline');
      statusText.textContent = 'Server Offline';
    }
  }
}

/**
 * Test an API endpoint and show the result
 */
function testEndpoint(url) {
  const method = url.startsWith('/api/webhook') ? 'POST' : 'GET';
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  // Add a sample body for POST requests
  if (method === 'POST') {
    options.body = JSON.stringify({
      sender: 'test@example.com',
      subject: 'Test Webhook',
      body: 'This is a test webhook request',
      timestamp: new Date().toISOString()
    });
  }
  
  // Create a modal to show the response
  const modal = document.createElement('div');
  modal.className = 'endpoint-test-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Testing ${url}</h3>
        <button class="close-modal">&times;</button>
      </div>
      <div class="modal-body">
        <div class="request-details">
          <h4>Request</h4>
          <pre><code>${JSON.stringify(options, null, 2)}</code></pre>
        </div>
        <div class="response-details">
          <h4>Response</h4>
          <div class="loading">
            <div class="spinner"></div>
            <span>Waiting for response...</span>
          </div>
          <pre class="response-data" style="display:none;"><code></code></pre>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Add event listener to close button
  modal.querySelector('.close-modal').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  // Make the API request
  fetch(url, options)
    .then(response => {
      const statusText = response.ok ? 'Success' : 'Error';
      const statusClass = response.ok ? 'success' : 'error';
      
      modal.querySelector('.loading').style.display = 'none';
      const responseData = modal.querySelector('.response-data');
      responseData.style.display = 'block';
      
      return response.text().then(text => {
        let formattedResponse;
        try {
          // Try to parse as JSON
          const json = JSON.parse(text);
          formattedResponse = JSON.stringify(json, null, 2);
        } catch (e) {
          // If not JSON, use as is
          formattedResponse = text;
        }
        
        responseData.querySelector('code').textContent = 
          `Status: ${response.status} ${statusText}\n\n${formattedResponse}`;
        responseData.classList.add(statusClass);
      });
    })
    .catch(error => {
      modal.querySelector('.loading').style.display = 'none';
      const responseData = modal.querySelector('.response-data');
      responseData.style.display = 'block';
      responseData.querySelector('code').textContent = `Error: ${error.message}`;
      responseData.classList.add('error');
    });
}