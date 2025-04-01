import { processWebhook, createWebhookResponse } from './webhooks/handler';
import { validateWebhookConfig } from './config/webhook';

// Define FetchEvent interface for Cloudflare Workers
interface FetchEvent extends Event {
  request: Request;
  respondWith(response: Response | Promise<Response>): void;
}

// Declare the addEventListener function for Cloudflare Workers
declare function addEventListener(
  type: 'fetch',
  handler: (event: FetchEvent) => void
): void;

/**
 * Main entry point for the Cloudflare Worker
 * Handles incoming webhook requests from Resend
 */
addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(handleRequest(event.request));
});

/**
 * Handle an incoming HTTP request
 * 
 * @param request The incoming request
 * @returns A response
 */
async function handleRequest(request: Request): Promise<Response> {
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
    const headers: Record<string, string> = {};
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
