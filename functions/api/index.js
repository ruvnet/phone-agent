/**
 * Default API endpoint
 * 
 * @param {Request} request The incoming request
 * @param {Object} env Environment variables
 * @param {Object} ctx Context object
 * @returns {Response} The response
 */
export async function onRequest(request, env, ctx) {
  return new Response(
    JSON.stringify({
      success: true,
      message: 'Phone Agent API is running',
      version: '1.0.0',
      endpoints: [
        {
          path: '/api/webhook',
          methods: ['POST'],
          description: 'Webhook endpoint for Resend email events',
        }
      ],
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}