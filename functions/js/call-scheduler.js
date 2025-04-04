export async function onRequest(context) {
  const jsContent = `/**
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
  
  const minDateTime = \`\${year}-\${month}-\${day}T\${hours}:\${minutes}\`;
  
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
    
    if (form) form.reset();
    if (response) {
      response.innerHTML = '';
      response.className = 'hidden';
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
  
  // Validate form data
  if (!name || !phone || !datetime) {
    showResponse('error', 'Please fill in all required fields.');
    return;
  }
  
  // Validate phone number format
  const phoneRegex = /^\\+?[1-9]\\d{1,14}$/;
  if (!phoneRegex.test(phone.replace(/\\s+/g, ''))) {
    showResponse('error', 'Please enter a valid phone number.');
    return;
  }
  
  // Disable submit button
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  
  try {
    // Prepare data for API
    const scheduledTime = new Date(datetime).toISOString();
    
    const requestData = {
      name,
      phone: phone.replace(/\\s+/g, ''), // Remove spaces
      scheduledTime,
      topic: topic || 'General discussion'
    };
    
    // Send API request
    const response = await fetch('/api/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      // Show success message
      showResponse('success', \`
        <h3>Call Scheduled Successfully!</h3>
        <p>Your call has been scheduled for \${formatDateTime(scheduledTime)}.</p>
        <p>Request ID: \${data.requestId}</p>
        <p>We'll call you at the scheduled time.</p>
      \`);
      
      // Reset form
      e.target.reset();
    } else {
      // Show error message
      showResponse('error', \`
        <h3>Error</h3>
        <p>\${data.message || 'Failed to schedule call. Please try again.'}</p>
      \`);
    }
  } catch (error) {
    console.error('Error scheduling call:', error);
    showResponse('error', \`
      <h3>Error</h3>
      <p>An unexpected error occurred. Please try again later.</p>
    \`);
  } finally {
    // Re-enable submit button
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-phone-alt"></i> Schedule Call';
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
  
  return \`\${formattedDate} at \${formattedTime}\`;
}`;

  return new Response(jsContent, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}