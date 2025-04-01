// Mock implementation of email service for testing
export class EmailService {
  processWebhook(payload: any) {
    return Promise.resolve({
      success: true,
      data: {
        id: 'test-email-id',
        calendarData: {
          summary: 'Test Meeting',
          startTime: new Date('2025-04-01T14:00:00Z'),
          endTime: new Date('2025-04-01T15:00:00Z'),
          dialIn: '+15551234567',
          conferenceDetails: '123-456-789'
        }
      }
    });
  }

  sendCallConfirmation(data: any) {
    return Promise.resolve({ id: 'email-id', status: 'sent' });
  }

  sendRescheduleNotification(data: any) {
    return Promise.resolve({ id: 'email-id', status: 'sent' });
  }

  sendCancellationNotification(data: any) {
    return Promise.resolve({ id: 'email-id', status: 'sent' });
  }
}

export const emailService = new EmailService();