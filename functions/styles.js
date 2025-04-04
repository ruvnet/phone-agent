export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Get the CSS file name from the path
  const cssFileName = path.split('/').pop();
  
  // Serve the appropriate CSS file
  let cssContent;
  try {
    // Try to read from the styles directory
    const response = await fetch(`${url.origin}/styles/${cssFileName}`);
    if (response.ok) {
      cssContent = await response.text();
    } else {
      // Fallback to reading from the public directory
      const publicResponse = await fetch(`${url.origin}/public/${cssFileName}`);
      if (publicResponse.ok) {
        cssContent = await publicResponse.text();
      } else {
        return new Response('CSS file not found', { status: 404 });
      }
    }
  } catch (error) {
    return new Response(`Error serving CSS: ${error.message}`, { status: 500 });
  }
  
  // Return the CSS content with the correct content type
  return new Response(cssContent, {
    headers: {
      'Content-Type': 'text/css',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}