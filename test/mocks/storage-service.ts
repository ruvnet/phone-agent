// Mock implementation of storage service for testing
export class StorageService {
  private memoryStore: Map<string, any> = new Map();

  setKVNamespace(namespace: any): void {
    // Mock implementation
  }

  async set(key: string, value: any): Promise<boolean> {
    this.memoryStore.set(key, value);
    return true;
  }

  async get(key: string): Promise<any> {
    return this.memoryStore.get(key) || null;
  }

  async delete(key: string): Promise<boolean> {
    return this.memoryStore.delete(key);
  }

  async listKeys(prefix: string = '', limit: number = 1000): Promise<string[]> {
    const keys: string[] = [];
    for (const key of this.memoryStore.keys()) {
      if (key.startsWith(prefix)) {
        keys.push(key);
        if (keys.length >= limit) break;
      }
    }
    return keys;
  }

  async storeCallData(callId: string, data: any): Promise<boolean> {
    return this.set(`call:${callId}`, data);
  }

  async getCallData(callId: string): Promise<any> {
    return this.get(`call:${callId}`) || {
      callId: 'test-call-id',
      status: 'scheduled',
      scheduledTime: '2025-04-01T14:00:00Z',
      duration: 60,
      phoneNumber: '+15551234567',
      recipientName: 'John Doe',
      recipientEmail: 'john@example.com',
      topic: 'Test Meeting'
    };
  }

  async updateCallData(callId: string, updateFn: (data: any) => any): Promise<boolean> {
    const data = await this.getCallData(callId);
    const updatedData = updateFn(data);
    return this.storeCallData(callId, updatedData);
  }

  async listCallIds(limit: number = 100): Promise<string[]> {
    const keys = await this.listKeys('call:', limit);
    return keys.map(key => key.replace('call:', ''));
  }
}

export const storageService = new StorageService();