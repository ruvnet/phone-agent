import { processWebhook, createWebhookResponse } from '../../src/webhooks/handler';
import { validateWebhookConfig } from '../../src/config/webhook';

/**
 * Handle webhook requests from Resend
 * 
 * @param {Request} request The incoming request
 * @param {Object} env Environment variables
 * @param {Object} ctx Context object
 * @returns {Response} The response
 */
export async function onRequest(request, env, ctx) {
  // Only allow POST requests for webhooks
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  // Validate the webhook configuration
  const configErrors = validateWebhookConfig();
  if (configErrors.length > 0) {
    console.error('Webhook configuration errors:', configErrors);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Webhook configuration error',
        errors: configErrors,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  try {
    // Clone the request to read the body
    const clonedRequest = request.clone();
    
    // Read the request body as text
    const body = await clonedRequest.text();
    
    // Extract headers
    const headers = {};
    clonedRequest.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });
    
    // Process the webhook
    const result = await processWebhook({ body, headers });
    
    // Create the response
    const { statusCode, body: responseBody } = createWebhookResponse(result);
    
    // Return the response
    return new Response(responseBody, {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Handle any unexpected errors
    console.error('Unexpected error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}