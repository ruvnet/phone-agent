/**
 * API Configuration Endpoint
 * 
 * This endpoint provides configuration information for the client-side application,
 * including the target webhook URL for API calls.
 */

export async function onRequest(context) {
  const { env, request } = context;
  
  // Get the environment variables
  const targetWebhookUrl = env.TARGET_WEBHOOK_URL || 'https://phone-agent.pages.dev/api/schedule';
  const debug = env.DEBUG_WEBHOOKS === 'true';
  
  // Create the configuration object
  const config = {
    targetWebhookUrl,
    environment: env.NODE_ENV || 'production',
    debug,
    timestamp: new Date().toISOString()
  };
  
  // Return the configuration as JSON
  return new Response(JSON.stringify(config, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}