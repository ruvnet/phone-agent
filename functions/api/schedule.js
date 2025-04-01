// Schedule handler for Cloudflare Pages Functions
import { StorageService } from '../../src/services/storage-service';
import { BlandService } from '../../src/services/bland-service';
import { CalendarService } from '../../src/services/calendar-service';
import { AgentSchedulingService } from '../../src/services/agent-scheduling-service';

export async function onRequest(context) {
  try {
    // Get the request URL
    const url = new URL(context.request.url);
    
    // Get the requestId from query parameters
    const requestId = url.searchParams.get('requestId');
    
    // Validate requestId
    if (!requestId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing requestId parameter'
        }),
        {
          headers: {
            'Content-Type': 'application/json'
          },
          status: 400
        }
      );
    }
    
    // Initialize services
    const storageService = new StorageService();
    storageService.setKVNamespace(context.env.PHONE_AGENT_STORAGE);
    
    const blandService = new BlandService();
    const calendarService = new CalendarService();
    
    const schedulingService = new AgentSchedulingService(
      storageService,
      blandService,
      calendarService
    );
    
    // Schedule the call
    const result = await schedulingService.scheduleCall(requestId);
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      {
        headers: {
          'Content-Type': 'application/json'
        },
        status: 200
      }
    );
  } catch (error) {
    // Log the error
    console.error('Schedule processing error:', error);
    
    // Return error response
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      {
        headers: {
          'Content-Type': 'application/json'
        },
        status: error.statusCode || 500
      }
    );
  }
}