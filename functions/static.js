/**
 * Static file handler
 * 
 * @param {Request} request The incoming request
 * @param {Object} env Environment variables
 * @param {Object} ctx Context object
 * @returns {Response} The response
 */
export async function onRequest(request, env, ctx) {
  // Pass the request to the static assets handler
  // This will serve files from the public directory
  return ctx.next();
}