/**
 * API endpoint for scheduling AI agent calls
 * This runs as a Cloudflare Worker
 * 
 * @module schedule-api
 */

/**
 * Environment variables that should be configured in your Cloudflare dashboard:
 * - BLAND_AI_API_KEY: API key for the Bland.ai service
 * - BLAND_AI_BASE_URL: Base URL for the Bland.ai API (default: https://api.bland.ai)
 * - NOTIFICATION_EMAIL: Email to notify about new call requests
 * - ENABLE_LOGGING: Whether to enable detailed logging (true/false)
 */

/**
 * Handles POST requests to schedule a call
 * @param {Object} context - The request context from Cloudflare
 * @returns {Response} - JSON response
 */
export async function onRequestPost(context) {
  try {
    // Get request data
    const request = context.request;
    const data = await request.json();
    
    // Get environment variables
    const env = context.env || {};
    const enableLogging = env.ENABLE_LOGGING === 'true';
    const blandApiKey = env.BLAND_AI_API_KEY;
    const blandBaseUrl = env.BLAND_AI_BASE_URL || 'https://api.bland.ai';
    
    // Log request if logging is enabled
    if (enableLogging) {
      console.log('Schedule request received:', {
        timestamp: new Date().toISOString(),
        ip: request.headers.get('CF-Connecting-IP'),
        data: { ...data, phone: '***REDACTED***' } // Redact sensitive information
      });
    }
    
    // Validate required fields
    const requiredFields = ['name', 'phone'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return createErrorResponse(`Missing required field: ${field}`, 400);
      }
    }
    
    // Validate phone number format
    const phoneRegex = /^\+?[0-9\s\-\(\)]{8,20}$/;
    if (!phoneRegex.test(data.phone)) {
      return createErrorResponse('Invalid phone number format', 400);
    }
    
    // Check if this is an immediate call or scheduled call
    const isImmediate = data.immediate === true;
    
    if (!isImmediate && !data.scheduledTime) {
      return createErrorResponse('Scheduled time is required for non-immediate calls', 400);
    }
    
    // For scheduled calls, validate scheduled time is in the future
    if (!isImmediate) {
      const scheduledDate = new Date(data.scheduledTime);
      const now = new Date();
      if (scheduledDate <= now) {
        return createErrorResponse('Scheduled time must be in the future', 400);
      }
    }
    
    // Generate a unique request ID
    const requestId = generateRequestId();
    
    // For immediate calls, make the call now using Bland.ai API
    if (isImmediate) {
      if (!blandApiKey) {
        return createErrorResponse('Bland.ai API key not configured', 500);
      }
      
      try {
        // Format the phone number (remove spaces, etc.)
        const formattedPhone = data.phone.replace(/\s+/g, '');
        
        // Prepare the topic/task for the call
        const topic = data.topic || 'General discussion';
        const task = `Call with ${data.name} to discuss: ${topic}`;
        
        // Make the API call to Bland.ai
        const blandResponse = await fetch(`${blandBaseUrl}/v1/calls`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': blandApiKey
          },
          body: JSON.stringify({
            phone_number: formattedPhone,
            task: task,
            reduce_latency: true,
            voice_id: 'rachel', // You can make this configurable
            wait_for_greeting: true,
            max_duration: 30 // 30 minutes max call duration
          })
        });
        
        // Parse the response
        const blandData = await blandResponse.json();
        
        if (blandResponse.ok && blandData.status === 'success') {
          // Return success response with Bland.ai call details
          return new Response(
            JSON.stringify({
              success: true,
              requestId: requestId,
              message: 'Call initiated successfully',
              callId: blandData.call_id,
              immediate: true
            }),
            { 
              status: 200,
              headers: getResponseHeaders()
            }
          );
        } else {
          // Return error from Bland.ai
          return createErrorResponse(`Failed to initiate call: ${blandData.message || 'Unknown error'}`, 500);
        }
      } catch (error) {
        console.error('Error making Bland.ai API call:', error);
        return createErrorResponse(`Failed to initiate call: ${error.message}`, 500);
      }
    } else {
      // For scheduled calls, we would store the request and schedule it
      // This is a simplified implementation - in production you would:
      // 1. Store the request in a database
      // 2. Set up a scheduled task to make the call at the specified time
      // 3. Send confirmation emails/SMS
      
      // Return success response for scheduled calls
      return new Response(
        JSON.stringify({
          success: true,
          requestId: requestId,
          message: 'Call scheduled successfully',
          scheduledTime: data.scheduledTime
        }),
        { 
          status: 200,
          headers: getResponseHeaders()
        }
      );
    }
    
  } catch (error) {
    // Log the error (in production, use proper error logging)
    console.error('Error processing schedule request:', error);
    
    // Return error response
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * Handles GET requests to check call status
 * @param {Object} context - The request context from Cloudflare
 * @returns {Response} - JSON response
 */
export async function onRequestGet(context) {
  try {
    // Get query parameters
    const url = new URL(context.request.url);
    const callId = url.searchParams.get('callId');
    
    // Get environment variables
    const env = context.env || {};
    const blandApiKey = env.BLAND_AI_API_KEY;
    const blandBaseUrl = env.BLAND_AI_BASE_URL || 'https://api.bland.ai';
    
    // Validate call ID
    if (!callId) {
      return createErrorResponse('Missing callId parameter', 400);
    }
    
    // Check if Bland.ai API key is configured
    if (!blandApiKey) {
      return createErrorResponse('Bland.ai API key not configured', 500);
    }
    
    try {
      // Make the API call to Bland.ai to check call status
      const blandResponse = await fetch(`${blandBaseUrl}/v1/calls/${callId}`, {
        method: 'GET',
        headers: {
          'Authorization': blandApiKey
        }
      });
      
      // Parse the response
      const blandData = await blandResponse.json();
      
      if (blandResponse.ok) {
        // Return call status
        return new Response(
          JSON.stringify({
            success: true,
            callId: callId,
            status: blandData.status,
            details: blandData
          }),
          { 
            status: 200,
            headers: getResponseHeaders()
          }
        );
      } else {
        // Return error from Bland.ai
        return createErrorResponse(`Failed to get call status: ${blandData.message || 'Unknown error'}`, 500);
      }
    } catch (error) {
      console.error('Error checking call status:', error);
      return createErrorResponse(`Failed to check call status: ${error.message}`, 500);
    }
  } catch (error) {
    // Log the error
    console.error('Error processing status request:', error);
    
    // Return error response
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * Handles OPTIONS requests for CORS preflight
 * @returns {Response} - Empty response with CORS headers
 */
export function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: getResponseHeaders()
  });
}

/**
 * Creates a standardized error response
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @returns {Response} - JSON response with error details
 */
function createErrorResponse(message, status = 400) {
  return new Response(
    JSON.stringify({ 
      success: false, 
      message: message 
    }),
    { 
      status: status,
      headers: getResponseHeaders()
    }
  );
}

/**
 * Generates a unique request ID
 * @returns {string} - Unique ID
 */
function generateRequestId() {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 7);
  return `req_${timestamp}_${randomStr}`;
}

/**
 * Gets standard response headers including CORS headers
 * @returns {Object} - Headers object
 */
function getResponseHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
    'Access-Control-Max-Age': '86400'
  };
}