// Mock implementation of Bland.ai service for testing
export class BlandService {
  scheduleCall(options: any) {
    return Promise.resolve({
      callId: 'test-call-id',
      status: 'scheduled',
      scheduledTime: '2025-04-01T14:00:00Z',
      estimatedDuration: 60
    });
  }

  getCallDetails(callId: string) {
    return Promise.resolve({
      id: callId,
      status: 'scheduled',
      scheduled_time: '2025-04-01T14:00:00Z',
      metadata: {
        recipientName: 'John Doe',
        recipientEmail: 'john@example.com',
        topic: 'Test Meeting'
      }
    });
  }

  cancelCall(callId: string) {
    return Promise.resolve({
      callId: callId,
      status: 'cancelled',
      cancelledAt: new Date().toISOString()
    });
  }

  rescheduleCall(callId: string, scheduledTime: string | Date) {
    return Promise.resolve({
      callId: callId,
      status: 'rescheduled',
      newScheduledTime: typeof scheduledTime === 'string' ? scheduledTime : scheduledTime.toISOString(),
      rescheduledAt: new Date().toISOString()
    });
  }

  processWebhookEvent(event: any) {
    return Promise.resolve({
      status: 'processed',
      callId: event.callId || 'test-call-id'
    });
  }
}

export const blandService = new BlandService();