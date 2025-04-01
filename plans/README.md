# AI Phone Agent

A Cloudflare Worker that receives emails via Resend, parses calendar invites, and schedules a Bland.ai agent to join conference calls. The worker handles the entire process automatically, from receiving the email to scheduling the AI agent with specific instructions.

## Features

- Receives emails with calendar attachments
- Parses calendar invites to extract meeting details
- Extracts dial-in information from meeting descriptions
- Schedules Bland.ai agents to join conference calls
- Sends email confirmations for scheduled calls
- Handles webhook events from Bland.ai
- Provides API endpoints for manual call scheduling
- Supports rescheduling and cancellation of calls
- Stores call data for tracking and management

## Project Structure

```
ai-phone-agent/
├── .dev.vars                # Local development environment variables
├── src/
│   ├── index.ts             # Main worker entry point
│   ├── services/
│   │   ├── agent-scheduling-service.ts # Agent scheduling orchestration
│   │   ├── email-service.ts # Email handling with Resend
│   │   ├── calendar-service.ts # Calendar parsing with ical.js
│   │   ├── bland-service.ts # Bland.ai integration
│   │   ├── storage-service.ts # Data persistence
│   │   └── index.ts         # Services export
│   ├── types/
│   │   ├── global.d.ts      # Global type declarations
│   │   └── bland.ts         # Bland.ai type definitions
│   └── utils/
│       ├── config.ts        # Configuration management
│       └── logger.ts        # Logging utility
└── wrangler.jsonc           # Cloudflare Worker configuration
```

## Setup Instructions

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Resend account](https://resend.com/) for email handling
- [Bland.ai account](https://www.bland.ai/) for AI phone agent

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ai-phone-agent.git
   cd ai-phone-agent
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Create a `.dev.vars` file in the project root with the following variables:
     ```
     # Email service configuration
     RESEND_API_KEY=your_resend_api_key_here
     SENDER_EMAIL=noreply@example.com
     SENDER_NAME=AI Phone Agent
     
     # Calendar service configuration
     DEFAULT_TIMEZONE=UTC
     
     # Bland.ai service configuration
     BLAND_AI_API_KEY=your_bland_ai_api_key_here
     BLAND_AI_WEBHOOK_SECRET=your_bland_ai_webhook_secret_here
     BLAND_AI_AGENT_ID=your_bland_ai_agent_id_here
     BLAND_AI_BASE_URL=https://api.bland.ai
     MAX_CALL_DURATION_MINUTES=30
     DEFAULT_RETRY_COUNT=2
     ```

4. Configure KV namespace:
   - Create a KV namespace in your Cloudflare dashboard
   - Update `wrangler.jsonc` with your KV namespace IDs:
     ```json
     "kv_namespaces": [
       {
         "binding": "AI_PHONE_AGENT",
         "id": "your_kv_namespace_id_here",
         "preview_id": "your_preview_kv_namespace_id_here"
       }
     ]
     ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Deployment

1. Authenticate with Cloudflare:
   ```bash
   npx wrangler login
   ```

2. Deploy to Cloudflare Workers:
   ```bash
   npm run deploy
   ```

3. Set up environment variables in Cloudflare:
   - Go to your Cloudflare Workers dashboard
   - Navigate to your worker settings
   - Add the environment variables from your `.dev.vars` file

4. Configure webhook endpoints:
   - In your Resend dashboard, set up a webhook to point to `https://your-worker-url.workers.dev/api/email`
   - In your Bland.ai dashboard, set up a webhook to point to `https://your-worker-url.workers.dev/api/bland/webhook`

## API Endpoints

### `/api/email` (POST)
Webhook endpoint for receiving emails from Resend.

This endpoint processes incoming emails, extracts calendar attachments, parses meeting details, and schedules AI agents to join conference calls.

### `/api/bland/webhook` (POST)
Webhook endpoint for receiving events from Bland.ai.

This endpoint processes call status updates from Bland.ai, including call started, ended, and failed events.

### `/api/schedule` (POST)
Endpoint for manually scheduling calls.

Example request:
```json
{
  "phoneNumber": "+1234567890",
  "scheduledTime": "2023-12-31T12:00:00Z",
  "duration": 30,
  "topic": "Project Discussion",
  "recipientName": "John Doe",
  "recipientEmail": "john@example.com",
  "task": "Join the project discussion call",
  "goal": "Provide updates on project status and answer questions"
}
```

Example response:
```json
{
  "status": "success",
  "callId": "call_abc123",
  "scheduledTime": "2023-12-31T12:00:00Z"
}
```

### `/api/health` (GET)
Health check endpoint.

Example response:
```json
{
  "status": "ok"
}
```

## Environment Variables

### Email Configuration
- `RESEND_API_KEY`: API key for Resend
- `SENDER_EMAIL`: Email address to send from
- `SENDER_NAME`: Name to display as sender

### Calendar Configuration
- `DEFAULT_TIMEZONE`: Default timezone for calendar events (e.g., "UTC")

### Bland.ai Configuration
- `BLAND_AI_API_KEY`: API key for Bland.ai
- `BLAND_AI_WEBHOOK_SECRET`: Webhook secret for verifying Bland.ai requests
- `BLAND_AI_AGENT_ID`: Default agent ID to use
- `BLAND_AI_BASE_URL`: Bland.ai API base URL
- `MAX_CALL_DURATION_MINUTES`: Maximum call duration in minutes
- `DEFAULT_RETRY_COUNT`: Number of retries for failed API calls

### Storage Configuration
- `AI_PHONE_AGENT`: KV namespace binding for storing call data

## Agent Scheduling Service

The Agent Scheduling Service orchestrates the entire call scheduling process, including:

- Scheduling new calls with Bland.ai
- Generating calendar events
- Sending confirmation emails
- Storing call data
- Handling rescheduling and cancellation
- Processing webhook events

### Usage Example

```typescript
import { scheduleAgentCall } from './services/agent-scheduling-service';

// Schedule a call
const result = await scheduleAgentCall({
  phoneNumber: "+1234567890",
  scheduledTime: new Date("2023-12-31T12:00:00Z"),
  duration: 30,
  recipientName: "John Doe",
  recipientEmail: "john@example.com",
  topic: "Project Discussion",
  description: "Monthly project status update call"
});

console.log(`Call scheduled with ID: ${result.callId}`);
```

## License

MIT
