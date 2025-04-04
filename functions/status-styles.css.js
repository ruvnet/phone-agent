export async function onRequest(context) {
  // Return a hardcoded CSS content for status-styles.css
  const cssContent = `
    /* Status Styles */
    .status-indicator {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-right: 5px;
    }

    .status-online {
      background-color: #28a745;
    }

    .status-offline {
      background-color: #dc3545;
    }

    .status-maintenance {
      background-color: #ffc107;
    }

    .status-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      padding: 15px;
      z-index: 1000;
      max-width: 300px;
      font-size: 14px;
    }

    .status-header {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      font-weight: bold;
    }

    .status-details {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #eee;
    }

    .status-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }

    .status-timestamp {
      color: #666;
      font-size: 12px;
      margin-top: 10px;
      text-align: right;
    }

    .status-close {
      position: absolute;
      top: 10px;
      right: 10px;
      cursor: pointer;
      color: #999;
      font-size: 16px;
    }

    .status-close:hover {
      color: #333;
    }
  `;
  
  // Return the CSS content with the correct content type
  return new Response(cssContent, {
    headers: {
      'Content-Type': 'text/css',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}