/**
 * Call Scheduler Module
 * Handles the scheduling of AI agent calls through the modal interface
 */

document.addEventListener('DOMContentLoaded', function() {
  // Load the modal HTML
  loadModalComponent();
  
  // Initialize event listeners
  initEventListeners();
  
  // Set minimum date for datetime picker
  setMinimumDateTime();
});

/**
 * Load the modal component HTML
 */
function loadModalComponent() {
  fetch('/components/call-modal.html')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to load modal component');
      }
      return response.text();
    })
    .then(html => {
      // Append the modal HTML to the body
      const modalContainer = document.createElement('div');
      modalContainer.innerHTML = html;
      document.body.appendChild(modalContainer);
      
      // Initialize modal events after it's loaded
      initModalEvents();
    })
    .catch(error => {
      console.error('Error loading modal component:', error);
    });
}

/**
 * Initialize event listeners for the schedule button
 */
function initEventListeners() {
  // Add click event for the schedule call button
  document.getElementById('schedule-call-btn')?.addEventListener('click', function(e) {
    e.preventDefault();
    openModal();
  });
}

/**
 * Initialize modal-specific event listeners
 */
function initModalEvents() {
  // Close button functionality
  const closeBtn = document.querySelector('.close-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }
  
  // Close modal when clicking outside
  window.addEventListener('click', function(e) {
    const modal = document.getElementById('call-modal');
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // Form submission
  const form = document.getElementById('schedule-call-form');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }
  
  // Call now checkbox
  const callNowCheckbox = document.getElementById('call-now');
  const datetimeInput = document.getElementById('datetime');
  const scheduleButton = document.getElementById('schedule-button');
  
  if (callNowCheckbox && datetimeInput && scheduleButton) {
    callNowCheckbox.addEventListener('change', function() {
      if (this.checked) {
        // Disable datetime input and update button text
        datetimeInput.disabled = true;
        scheduleButton.innerHTML = '<i class="fas fa-phone-alt"></i> Call Now';
      } else {
        // Enable datetime input and restore button text
        datetimeInput.disabled = false;
        scheduleButton.innerHTML = '<i class="fas fa-phone-alt"></i> Schedule Call';
      }
    });
  }
}

/**
 * Set minimum date and time for the datetime picker
 */
function setMinimumDateTime() {
  // Set minimum date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0); // 9:00 AM
  
  // Format date for datetime-local input
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  const hours = String(tomorrow.getHours()).padStart(2, '0');
  const minutes = String(tomorrow.getMinutes()).padStart(2, '0');
  
  const minDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
  
  // Set the min attribute when the modal is opened
  const datetimeInput = document.getElementById('datetime');
  if (datetimeInput) {
    datetimeInput.setAttribute('min', minDateTime);
    datetimeInput.value = minDateTime;
  }
}

/**
 * Open the modal
 */
function openModal() {
  const modal = document.getElementById('call-modal');
  if (modal) {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent scrolling
    setMinimumDateTime(); // Update the minimum date/time
  }
}

/**
 * Close the modal
 */
function closeModal() {
  const modal = document.getElementById('call-modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = ''; // Restore scrolling
    
    // Reset form and response
    const form = document.getElementById('schedule-call-form');
    const response = document.getElementById('form-response');
    const callNowCheckbox = document.getElementById('call-now');
    const datetimeInput = document.getElementById('datetime');
    const scheduleButton = document.getElementById('schedule-button');
    
    if (form) form.reset();
    if (response) {
      response.innerHTML = '';
      response.className = 'hidden';
    }
    
    // Reset call now option
    if (callNowCheckbox && callNowCheckbox.checked) {
      callNowCheckbox.checked = false;
      if (datetimeInput) datetimeInput.disabled = false;
      if (scheduleButton) scheduleButton.innerHTML = '<i class="fas fa-phone-alt"></i> Schedule Call';
    }
    
    // Clear any call status check intervals
    if (window.callStatusInterval) {
      clearInterval(window.callStatusInterval);
      window.callStatusInterval = null;
    }
  }
}

/**
 * Handle form submission
 * @param {Event} e - Form submit event
 */
async function handleFormSubmit(e) {
  e.preventDefault();
  
  // Get form data
  const name = document.getElementById('name').value;
  const phone = document.getElementById('phone').value;
  const datetime = document.getElementById('datetime').value;
  const topic = document.getElementById('topic').value;
  const callNow = document.getElementById('call-now').checked;
  
  // Validate form data
  if (!name || !phone || (!callNow && !datetime)) {
    showResponse('error', 'Please fill in all required fields.');
    return;
  }
  
  // Validate phone number format
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phone.replace(/\s+/g, ''))) {
    showResponse('error', 'Please enter a valid phone number.');
    return;
  }
  
  // Disable submit button
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  
  try {
    // Prepare data for API
    let scheduledTime;
    
    if (callNow) {
      // Set scheduled time to now + 1 minute for immediate calls
      scheduledTime = new Date(Date.now() + 60000).toISOString();
    } else {
      scheduledTime = new Date(datetime).toISOString();
    }
    
    const requestData = {
      name,
      phone: phone.replace(/\s+/g, ''), // Remove spaces
      scheduledTime,
      topic: topic || 'General discussion',
      immediate: callNow
    };
    
    // Always use the local API endpoint when running locally
    // This avoids CORS issues with the Cloudflare Pages domain
    const apiUrl = '/api/schedule';
    
    console.log('Sending request to:', apiUrl);
    
    // Send API request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      // Show success message
      if (callNow) {
        showResponse('success', `
          <h3>Call Initiated!</h3>
          <p>We're calling you right now at ${phone}.</p>
          <p>Request ID: ${data.requestId}</p>
          <p>Call ID: ${data.callId || 'N/A'}</p>
          <p>Please answer your phone when it rings.</p>
          <div id="call-status">
            <p>Call Status: <span id="status-text">Initiating...</span></p>
            <div class="progress-bar">
              <div class="progress-bar-inner" id="progress-bar"></div>
            </div>
          </div>
        `);
        
        // If we have a call ID, start checking the status
        if (data.callId) {
          startCallStatusCheck(data.callId);
        }
      } else {
        showResponse('success', `
          <h3>Call Scheduled Successfully!</h3>
          <p>Your call has been scheduled for ${formatDateTime(scheduledTime)}.</p>
          <p>Request ID: ${data.requestId}</p>
          <p>We'll call you at the scheduled time.</p>
        `);
      }
      
      // Reset form
      e.target.reset();
      
      // Reset call now option if it was checked
      if (callNow) {
        const datetimeInput = document.getElementById('datetime');
        if (datetimeInput) datetimeInput.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-phone-alt"></i> Schedule Call';
      }
    } else {
      // Show error message
      showResponse('error', `
        <h3>Error</h3>
        <p>${data.message || 'Failed to schedule call. Please try again.'}</p>
      `);
    }
  } catch (error) {
    console.error('Error scheduling call:', error);
    showResponse('error', `
      <h3>Error</h3>
      <p>An unexpected error occurred. Please try again later.</p>
      <p class="error-details">${error.message}</p>
    `);
  } finally {
    // Re-enable submit button
    submitBtn.disabled = false;
    submitBtn.innerHTML = document.getElementById('call-now').checked ? 
      '<i class="fas fa-phone-alt"></i> Call Now' : 
      '<i class="fas fa-phone-alt"></i> Schedule Call';
  }
}

/**
 * Start checking call status periodically
 * @param {string} callId - The Bland.ai call ID
 */
function startCallStatusCheck(callId) {
  // Clear any existing interval
  if (window.callStatusInterval) {
    clearInterval(window.callStatusInterval);
  }
  
  // Update status immediately
  checkCallStatus(callId);
  
  // Then check every 5 seconds
  window.callStatusInterval = setInterval(() => {
    checkCallStatus(callId);
  }, 5000);
}

/**
 * Check the status of a call
 * @param {string} callId - The Bland.ai call ID
 */
async function checkCallStatus(callId) {
  try {
    const response = await fetch(`/api/schedule?callId=${callId}`);
    const data = await response.json();
    
    if (response.ok && data.success) {
      // Update the status text
      const statusText = document.getElementById('status-text');
      if (statusText) {
        statusText.textContent = data.status || 'Unknown';
      }
      
      // Update progress bar based on status
      const progressBar = document.getElementById('progress-bar');
      if (progressBar) {
        let progress = 0;
        
        switch (data.status) {
          case 'queued':
            progress = 10;
            break;
          case 'in-progress':
            progress = 50;
            break;
          case 'completed':
            progress = 100;
            clearInterval(window.callStatusInterval);
            break;
          case 'failed':
            progress = 100;
            statusText.textContent = 'Failed: ' + (data.details?.error_message || 'Unknown error');
            clearInterval(window.callStatusInterval);
            break;
          default:
            progress = 25;
        }
        
        progressBar.style.width = `${progress}%`;
      }
      
      // If call is completed or failed, stop checking
      if (data.status === 'completed' || data.status === 'failed') {
        clearInterval(window.callStatusInterval);
        window.callStatusInterval = null;
      }
    } else {
      console.error('Error checking call status:', data.message);
    }
  } catch (error) {
    console.error('Error checking call status:', error);
  }
}

/**
 * Show response message
 * @param {string} type - Response type ('success' or 'error')
 * @param {string} message - Response message
 */
function showResponse(type, message) {
  const responseEl = document.getElementById('form-response');
  if (responseEl) {
    responseEl.innerHTML = message;
    responseEl.className = type === 'success' ? 'response-success' : 'response-error';
  }
}

/**
 * Format date and time for display
 * @param {string} isoString - ISO date string
 * @returns {string} Formatted date and time
 */
function formatDateTime(isoString) {
  const date = new Date(isoString);
  
  // Format date: Apr 15, 2025
  const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  const formattedDate = date.toLocaleDateString('en-US', dateOptions);
  
  // Format time: 3:30 PM
  const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
  const formattedTime = date.toLocaleTimeString('en-US', timeOptions);
  
  return `${formattedDate} at ${formattedTime}`;
}