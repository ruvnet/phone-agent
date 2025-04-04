export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const response = await next();
  
  // Clone the response to modify headers
  const newResponse = new Response(response.body, response);
  
  // Set appropriate content type headers based on file extension
  if (url.pathname.endsWith('.css')) {
    newResponse.headers.set('Content-Type', 'text/css');
  } else if (url.pathname.endsWith('.js')) {
    newResponse.headers.set('Content-Type', 'application/javascript');
  } else if (url.pathname.endsWith('.json')) {
    newResponse.headers.set('Content-Type', 'application/json');
  } else if (url.pathname.endsWith('.html')) {
    newResponse.headers.set('Content-Type', 'text/html; charset=utf-8');
  }
  
  return newResponse;
}