/**
 * API Index Endpoint
 * 
 * This endpoint provides basic information about the API and serves as a health check.
 */

export async function onRequest(context) {
  const { request, env } = context;
  
  // Get environment information (safely)
  const environment = env.NODE_ENV || 'production';
  
  // Create response with API information
  const apiInfo = {
    name: "Phone Agent API",
    version: "1.0.0",
    status: "operational",
    environment: environment,
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
        path: "/api/schedule/cancel",
        method: "POST",
        description: "Cancel a scheduled call"
      }
    ]
  };
  
  // Return JSON response
  return new Response(JSON.stringify(apiInfo, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}