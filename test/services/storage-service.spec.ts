import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { StorageService } from '../../src/services/storage-service';
import { AppError } from '../../src/utils/logger';

// Mock dependencies
vi.mock('../../src/utils/logger', () => {
  return {
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    },
    AppError: class extends Error {
      statusCode: number;
      constructor(message: string, statusCode = 500) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
      }
    }
  };
});

vi.mock('../../src/utils/config', () => {
  return {
    config: {
      get: vi.fn().mockImplementation((key, defaultValue) => 
        key === 'KV_NAMESPACE' ? 'TEST_NAMESPACE' : defaultValue
      )
    }
  };
});

// Unmock the storage-service module to test the actual implementation
vi.unmock('../../src/services/storage-service');

describe('StorageService', () => {
  let storageService: StorageService;
  
  // Mock for Cloudflare KV namespace
  const mockKVNamespace = {
    put: vi.fn().mockResolvedValue(undefined),
    get: vi.fn(),
    delete: vi.fn().mockResolvedValue(undefined),
    list: vi.fn()
  };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Reset the global environment mock
    (globalThis as any).env = undefined;
    
    // Create a fresh instance for each test
    storageService = new StorageService({
      namespace: 'test_namespace',
      ttl: 3600 // 1 hour
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    
    // Clean up global mocks
    (globalThis as any).env = undefined;
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      const service = new StorageService();
      
      expect(service).toBeInstanceOf(StorageService);
      expect((service as any).defaultTtl).toBe(86400); // Default: 1 day
      expect((service as any).memoryStore).toBeInstanceOf(Map);
    });

    it('should initialize with custom options', () => {
      const service = new StorageService({
        namespace: 'custom_namespace',
        ttl: 7200 // 2 hours
      });
      
      expect((service as any).namespace).toBe('custom_namespace');
      expect((service as any).defaultTtl).toBe(7200);
    });
  });

  describe('set', () => {
    it('should store a value in memory when no KV is available', async () => {
      const key = 'test-key';
      const value = { test: 'data' };
      
      const result = await storageService.set(key, value);
      
      expect(result).toBe(true);
      
      // Verify it's in the memory store
      const memoryStore = (storageService as any).memoryStore;
      expect(memoryStore.has(key)).toBe(true);
      expect(memoryStore.get(key).value).toEqual(value);
    });

    it('should store a value in KV when available', async () => {
      // Mock Cloudflare KV environment
      (globalThis as any).env = {
        test_namespace: mockKVNamespace
      };
      
      // Create a new instance with the mocked environment
      const service = new StorageService({
        namespace: 'test_namespace',
        ttl: 3600
      });
      
      // Ensure the KV namespace is detected
      expect((service as any).kvNamespace).toBe(mockKVNamespace);
      
      const key = 'test-key';
      const value = { test: 'data' };
      
      const result = await service.set(key, value);
      
      expect(result).toBe(true);
      expect(mockKVNamespace.put).toHaveBeenCalledWith(key, JSON.stringify(value), { expirationTtl: 3600 });
    });

    it('should handle string values without JSON conversion', async () => {
      // Mock Cloudflare KV environment
      (globalThis as any).env = {
        test_namespace: mockKVNamespace
      };
      
      // Create a new instance with the mocked environment
      const service = new StorageService({
        namespace: 'test_namespace',
        ttl: 3600
      });
      
      const key = 'test-key';
      const value = 'string-value';
      
      const result = await service.set(key, value);
      
      expect(result).toBe(true);
      expect(mockKVNamespace.put).toHaveBeenCalledWith(key, value, { expirationTtl: 3600 });
    });

    it('should store without TTL when ttl is 0', async () => {
      // Mock Cloudflare KV environment
      (globalThis as any).env = {
        test_namespace: mockKVNamespace
      };
      
      // Create a new instance with the mocked environment
      const service = new StorageService({
        namespace: 'test_namespace',
        ttl: 3600
      });
      
      // Reset the mock to ensure clean state
      mockKVNamespace.put.mockClear();
      
      const key = 'test-key';
      const value = { test: 'data' };
      
      const result = await service.set(key, value, 0);
      
      expect(result).toBe(true);
      
      // Check that put was called with exactly these arguments and nothing else
      expect(mockKVNamespace.put).toHaveBeenCalledTimes(1);
      expect(mockKVNamespace.put.mock.calls[0][0]).toBe(key);
      expect(mockKVNamespace.put.mock.calls[0][1]).toBe(JSON.stringify(value));
      expect(mockKVNamespace.put.mock.calls[0][2]).toBeUndefined();
    });

    it('should throw an error when key is empty', async () => {
      await expect(storageService.set('', 'value')).rejects.toThrow('Key is required');
    });

    it('should throw an error when KV operations fail', async () => {
      // Mock Cloudflare KV environment with failing put
      (globalThis as any).env = {
        test_namespace: {
          ...mockKVNamespace,
          put: vi.fn().mockRejectedValue(new Error('KV operation failed'))
        }
      };
      
      // Create a new instance with the mocked environment
      const service = new StorageService({
        namespace: 'test_namespace',
        ttl: 3600
      });
      
      await expect(service.set('test-key', 'value')).rejects.toThrow('Storage error: KV operation failed');
    });
  });

  describe('get', () => {
    it('should retrieve a value from memory when no KV is available', async () => {
      const key = 'test-key';
      const value = { test: 'data' };
      
      // Manually set in memory store
      (storageService as any).memoryStore.set(key, { value });
      
      const result = await storageService.get(key);
      
      expect(result).toEqual(value);
    });

    it('should retrieve a value from KV when available', async () => {
      // Mock Cloudflare KV environment with a value
      const storedValue = JSON.stringify({ test: 'data' });
      mockKVNamespace.get.mockResolvedValue(storedValue);
      
      (globalThis as any).env = {
        test_namespace: mockKVNamespace
      };
      
      // Create a new instance with the mocked environment
      const service = new StorageService({
        namespace: 'test_namespace',
        ttl: 3600
      });
      
      const key = 'test-key';
      const result = await service.get(key);
      
      expect(result).toEqual({ test: 'data' });
      expect(mockKVNamespace.get).toHaveBeenCalledWith(key);
    });

    it('should return non-JSON values from KV as-is', async () => {
      // Mock Cloudflare KV environment with a string value
      const storedValue = 'string-value';
      mockKVNamespace.get.mockResolvedValue(storedValue);
      
      (globalThis as any).env = {
        test_namespace: mockKVNamespace
      };
      
      // Create a new instance with the mocked environment
      const service = new StorageService({
        namespace: 'test_namespace',
        ttl: 3600
      });
      
      const key = 'test-key';
      const result = await service.get(key);
      
      expect(result).toBe('string-value');
    });

    it('should return null for non-existent keys', async () => {
      const key = 'non-existent-key';
      const result = await storageService.get(key);
      
      expect(result).toBeNull();
    });

    it('should return null and remove expired items from memory store', async () => {
      const key = 'expired-key';
      
      // Set an expired item in memory store
      (storageService as any).memoryStore.set(key, {
        value: 'expired-value',
        expiry: Date.now() - 1000 // Expired 1 second ago
      });
      
      const result = await storageService.get(key);
      
      expect(result).toBeNull();
      
      // Verify it was removed from the memory store
      const memoryStore = (storageService as any).memoryStore;
      expect(memoryStore.has(key)).toBe(false);
    });

    it('should throw an error when key is empty', async () => {
      await expect(storageService.get('')).rejects.toThrow('Key is required');
    });

    it('should throw an error when KV operations fail', async () => {
      // Mock Cloudflare KV environment with failing get
      (globalThis as any).env = {
        test_namespace: {
          ...mockKVNamespace,
          get: vi.fn().mockRejectedValue(new Error('KV operation failed'))
        }
      };
      
      // Create a new instance with the mocked environment
      const service = new StorageService({
        namespace: 'test_namespace',
        ttl: 3600
      });
      
      await expect(service.get('test-key')).rejects.toThrow('Storage error: KV operation failed');
    });
  });

  describe('delete', () => {
    it('should delete a value from memory when no KV is available', async () => {
      const key = 'test-key';
      
      // Manually set in memory store
      (storageService as any).memoryStore.set(key, { value: 'test-value' });
      
      const result = await storageService.delete(key);
      
      expect(result).toBe(true);
      
      // Verify it's deleted from the memory store
      const memoryStore = (storageService as any).memoryStore;
      expect(memoryStore.has(key)).toBe(false);
    });

    it('should delete a value from KV when available', async () => {
      // Mock Cloudflare KV environment
      (globalThis as any).env = {
        test_namespace: mockKVNamespace
      };
      
      // Create a new instance with the mocked environment
      const service = new StorageService({
        namespace: 'test_namespace',
        ttl: 3600
      });
      
      const key = 'test-key';
      const result = await service.delete(key);
      
      expect(result).toBe(true);
      expect(mockKVNamespace.delete).toHaveBeenCalledWith(key);
    });

    it('should return false when deleting non-existent key from memory', async () => {
      const key = 'non-existent-key';
      const result = await storageService.delete(key);
      
      expect(result).toBe(false);
    });

    it('should throw an error when key is empty', async () => {
      await expect(storageService.delete('')).rejects.toThrow('Key is required');
    });

    it('should throw an error when KV operations fail', async () => {
      // Mock Cloudflare KV environment with failing delete
      (globalThis as any).env = {
        test_namespace: {
          ...mockKVNamespace,
          delete: vi.fn().mockRejectedValue(new Error('KV operation failed'))
        }
      };
      
      // Create a new instance with the mocked environment
      const service = new StorageService({
        namespace: 'test_namespace',
        ttl: 3600
      });
      
      await expect(service.delete('test-key')).rejects.toThrow('Storage error: KV operation failed');
    });
  });

  describe('listKeys', () => {
    it('should list keys from memory when no KV is available', async () => {
      // Manually set some values in memory store
      (storageService as any).memoryStore.set('key1', { value: 'value1' });
      (storageService as any).memoryStore.set('key2', { value: 'value2' });
      (storageService as any).memoryStore.set('prefix-key3', { value: 'value3' });
      
      const result = await storageService.listKeys('prefix-');
      
      expect(result).toEqual(['prefix-key3']);
    });

    it('should list all keys from memory when prefix is empty', async () => {
      // Manually set some values in memory store
      (storageService as any).memoryStore.set('key1', { value: 'value1' });
      (storageService as any).memoryStore.set('key2', { value: 'value2' });
      
      const result = await storageService.listKeys();
      
      expect(result).toHaveLength(2);
      expect(result).toContain('key1');
      expect(result).toContain('key2');
    });

    it('should skip expired items in memory', async () => {
      // Manually set some values in memory store, including an expired one
      (storageService as any).memoryStore.set('key1', { value: 'value1' });
      (storageService as any).memoryStore.set('key2', {
        value: 'value2',
        expiry: Date.now() - 1000 // Expired 1 second ago
      });
      
      const result = await storageService.listKeys();
      
      expect(result).toEqual(['key1']);
    });

    it('should respect the limit parameter', async () => {
      // Manually set multiple values in memory store
      for (let i = 0; i < 10; i++) {
        (storageService as any).memoryStore.set(`key${i}`, { value: `value${i}` });
      }
      
      const result = await storageService.listKeys('', 5);
      
      expect(result).toHaveLength(5);
    });

    it('should list keys from KV when available', async () => {
      // Mock Cloudflare KV environment with list result
      mockKVNamespace.list.mockResolvedValue({
        keys: [
          { name: 'key1' },
          { name: 'key2' },
          { name: 'prefix-key3' }
        ]
      });
      
      (globalThis as any).env = {
        test_namespace: mockKVNamespace
      };
      
      // Create a new instance with the mocked environment
      const service = new StorageService({
        namespace: 'test_namespace',
        ttl: 3600
      });
      
      // Mock the implementation of list to filter by prefix
      mockKVNamespace.list.mockImplementation(({ prefix }) => {
        const allKeys = [
          { name: 'key1' },
          { name: 'key2' },
          { name: 'prefix-key3' }
        ];
        
        const filteredKeys = allKeys.filter(k => !prefix || k.name.startsWith(prefix));
        return Promise.resolve({ keys: filteredKeys });
      });
      
      const result = await service.listKeys('prefix-');
      
      expect(result).toEqual(['prefix-key3']);
      expect(mockKVNamespace.list).toHaveBeenCalledWith({ prefix: 'prefix-', limit: 1000 });
    });

    it('should throw an error when KV operations fail', async () => {
      // Mock Cloudflare KV environment with failing list
      (globalThis as any).env = {
        test_namespace: {
          ...mockKVNamespace,
          list: vi.fn().mockRejectedValue(new Error('KV operation failed'))
        }
      };
      
      // Create a new instance with the mocked environment
      const service = new StorageService({
        namespace: 'test_namespace',
        ttl: 3600
      });
      
      await expect(service.listKeys()).rejects.toThrow('Storage error: KV operation failed');
    });
  });

  describe('storeCallData', () => {
    it('should store call data with the correct key prefix', async () => {
      // Spy on the set method
      const setSpy = vi.spyOn(storageService, 'set');
      
      const callId = 'test-call';
      const callData = { status: 'scheduled', time: '2025-04-01T14:00:00Z' };
      
      await storageService.storeCallData(callId, callData);
      
      expect(setSpy).toHaveBeenCalledWith(`call:${callId}`, callData);
    });
  });

  describe('getCallData', () => {
    it('should get call data with the correct key prefix', async () => {
      // Spy on the get method
      const getSpy = vi.spyOn(storageService, 'get');
      
      const callId = 'test-call';
      await storageService.getCallData(callId);
      
      expect(getSpy).toHaveBeenCalledWith(`call:${callId}`);
    });
  });

  describe('updateCallData', () => {
    it('should update call data correctly', async () => {
      const callId = 'test-call';
      const initialData = { status: 'scheduled', time: '2025-04-01T14:00:00Z' };
      
      // Spy on the methods we'll use
      const storeCallDataSpy = vi.spyOn(storageService, 'storeCallData');
      const getCallDataSpy = vi.spyOn(storageService, 'getCallData')
        .mockResolvedValueOnce(initialData)
        .mockResolvedValueOnce({ status: 'completed', time: '2025-04-01T14:00:00Z' });
      
      // Now update it
      const updateFn = (data: any) => {
        return { ...data, status: 'completed' };
      };
      
      await storageService.updateCallData(callId, updateFn);
      
      // Verify the calls
      expect(getCallDataSpy).toHaveBeenCalledWith(callId);
      expect(storeCallDataSpy).toHaveBeenCalledWith(callId, { 
        status: 'completed', 
        time: '2025-04-01T14:00:00Z' 
      });
      
      // Verify the updated data
      const updatedData = await storageService.getCallData(callId);
      expect(updatedData).toEqual({
        status: 'completed',
        time: '2025-04-01T14:00:00Z'
      });
    });

    it('should handle updates when data doesn\'t exist', async () => {
      const callId = 'non-existent-call';
      
      // Spy on the methods we'll use
      const storeCallDataSpy = vi.spyOn(storageService, 'storeCallData');
      const getCallDataSpy = vi.spyOn(storageService, 'getCallData')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ status: 'new', created: true });
      
      // Update non-existent data
      const updateFn = (data: any) => {
        return { status: 'new', created: true };
      };
      
      await storageService.updateCallData(callId, updateFn);
      
      // Verify the calls
      expect(getCallDataSpy).toHaveBeenCalledWith(callId);
      expect(storeCallDataSpy).toHaveBeenCalledWith(callId, { 
        status: 'new', 
        created: true 
      });
      
      // Verify the new data
      const newData = await storageService.getCallData(callId);
      expect(newData).toEqual({
        status: 'new',
        created: true
      });
    });
  });

  describe('listCallIds', () => {
    it('should list call IDs by stripping the prefix', async () => {
      // Spy on the listKeys method
      const listKeysSpy = vi.spyOn(storageService, 'listKeys').mockResolvedValue([
        'call:call-1',
        'call:call-2',
        'call:call-3'
      ]);
      
      const result = await storageService.listCallIds();
      
      expect(listKeysSpy).toHaveBeenCalledWith('call:', 100);
      expect(result).toEqual(['call-1', 'call-2', 'call-3']);
    });

    it('should respect the limit parameter', async () => {
      // Spy on the listKeys method
      const listKeysSpy = vi.spyOn(storageService, 'listKeys').mockResolvedValue([
        'call:call-1',
        'call:call-2'
      ]);
      
      const result = await storageService.listCallIds(2);
      
      expect(listKeysSpy).toHaveBeenCalledWith('call:', 2);
      expect(result).toHaveLength(2);
    });
  });
});