# Ai Phone Agent

This implementation creates a Cloudflare Worker that receives emails via Resend, parses calendar invites, and schedules a Bland.ai agent to join conference calls. The worker handles the entire process automatically, from receiving the email to scheduling the AI agent with specific instructions.

## Implementation Plan

1. Set up a Cloudflare Worker project
2. Create an email handling function using Resend API
3. Implement calendar invite parsing
4. Set up Bland.ai integration for the AI agent
5. Create the main worker script
6. Write unit tests using Jest

## Setup Instructions

1. Install Wrangler CLI:
```bash
npm install -g wrangler
```

2. Create a new Worker project:
```bash
wrangler init agent-scheduler
cd agent-scheduler
```

3. Install dependencies:
```bash
npm install @resend/node ical.js @bland/sdk jest
```

4. Set up environment variables in `.dev.vars` file:
```
RESEND_API_KEY=your_resend_api_key
BLAND_AI_API_KEY=your_bland_ai_api_key
AGENT_EMAIL=agent@example.com
```

## Main Worker Script (index.js)

```javascript
import { Resend } from '@resend/node';
import ICAL from 'ical.js';
import { BlandAPI } from '@bland/sdk';

const resend = new Resend(RESEND_API_KEY);
const bland = new BlandAPI(BLAND_AI_API_KEY);

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'POST') {
      const email = await request.json();
      if (email.to === env.AGENT_EMAIL) {
        const calendarEvent = parseCalendarInvite(email.attachments[0].content);
        if (calendarEvent) {
          await scheduleAgent(calendarEvent);
          return new Response('Agent scheduled', { status: 200 });
        }
      }
    }
    return new Response('Not Found', { status: 404 });
  },
};

function parseCalendarInvite(icsContent) {
  const jcalData = ICAL.parse(icsContent);
  const comp = new ICAL.Component(jcalData);
  const vevent = comp.getFirstSubcomponent('vevent');
  
  if (vevent) {
    const summary = vevent.getFirstPropertyValue('summary');
    const dtstart = vevent.getFirstPropertyValue('dtstart');
    const duration = vevent.getFirstPropertyValue('duration');
    const description = vevent.getFirstPropertyValue('description');
    
    const conferenceDetails = description.match(/Dial-In: (.+)/);
    const dialIn = conferenceDetails ? conferenceDetails[1] : null;

    return {
      summary,
      startTime: dtstart.toJSDate(),
      duration: duration.toSeconds(),
      dialIn
    };
  }
  return null;
}

async function scheduleAgent(calendarEvent) {
  const { summary, startTime, duration, dialIn } = calendarEvent;
  
  const callInstructions = `
    You are an AI assistant joining a conference call.
    Stay silent unless directly addressed.
    When asked a question, provide concise and helpful responses.
    Do not interrupt other speakers.
    Call summary: ${summary}
  `;

  await bland.scheduleCall({
    phoneNumber: dialIn,
    taskDescription: callInstructions,
    scheduledTime: startTime.toISOString(),
    maxDuration: duration
  });
}
```

## Unit Tests (index.test.js)

```javascript
import { unstable_dev } from 'wrangler';
import { jest } from '@jest/globals';

jest.mock('@resend/node');
jest.mock('ical.js');
jest.mock('@bland/sdk');

describe('Agent Scheduler Worker', () => {
  let worker;

  beforeAll(async () => {
    worker = await unstable_dev('index.js', {
      experimental: { disableExperimentalWarning: true }
    });
  });

  afterAll(async () => {
    await worker.stop();
  });

  it('should schedule agent when receiving a valid calendar invite', async () => {
    const mockEmail = {
      to: 'agent@example.com',
      attachments: [{ content: 'mock_ics_content' }]
    };

    const resp = await worker.fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockEmail)
    });

    expect(resp.status).toBe(200);
    expect(await resp.text()).toBe('Agent scheduled');
  });

  it('should return 404 for non-POST requests', async () => {
    const resp = await worker.fetch('/');
    expect(resp.status).toBe(404);
  });
});
```

## Additional Setup

1. Configure Resend to forward emails to your Worker's URL.

2. Deploy the worker:
```bash
wrangler publish
```

3. Run tests:
```bash
npm test
```
