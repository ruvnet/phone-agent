// Main entry point for the application
console.log('Phone Agent application initialized');

// This file serves as the entry point for the application
// The actual functionality is implemented in the services directory
// and exposed through Cloudflare Pages Functions

// For local development, this ensures the application has an entry point
document.addEventListener('DOMContentLoaded', () => {
  console.log('Phone Agent UI loaded');
  
  // Add any client-side functionality here
  const appInfo = document.getElementById('app-info');
  if (appInfo) {
    appInfo.textContent = `App version: 1.0.0 | Environment: production`;
  }
});