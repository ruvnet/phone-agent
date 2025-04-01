import { config } from '../utils/config';
import { AppError, logger } from '../utils/logger';

/**
 * Interface for storage service configuration
 */
export interface StorageServiceConfig {
  namespace?: string;
  ttl?: number;
}

/**
 * Service for storing and retrieving data
 * Adapted for Cloudflare Pages with KV
 */
export class StorageService {
  private namespace: string;
  private defaultTtl: number;
  private memoryStore: Map<string, { value: any; expiry?: number }>;
  private kvNamespace: any;

  /**
   * Create a new storage service
   * @param options Configuration options
   */
  constructor(options: StorageServiceConfig = {}) {
    this.namespace = options.namespace || 'phone_agent_storage';
    this.defaultTtl = options.ttl || 86400; // Default: 1 day
    this.memoryStore = new Map();
    
    // Try to get KV namespace from environment
    // In Cloudflare Pages Functions, KV bindings are available via context.env
    try {
      // Check for KV in different environments
      const env = (globalThis as any).env || (typeof process !== 'undefined' ? process.env : {});
      
      if (env && env[this.namespace]) {
        this.kvNamespace = env[this.namespace];
        logger.debug(`Using KV namespace: ${this.namespace}`);
      } else {
        logger.debug('No KV namespace found, using memory storage');
      }
    } catch (error) {
      logger.warn(`Failed to initialize KV namespace: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Set KV namespace from context
   * This method should be called from Pages Functions to inject the KV namespace
   * @param namespace KV namespace from context.env
   */
  setKVNamespace(namespace: any): void {
    if (namespace) {
      this.kvNamespace = namespace;
      logger.debug('KV namespace set from Pages Function context');
    }
  }

  /**
   * Store a value
   * @param key Key to store under
   * @param value Value to store
   * @param ttl Time to live in seconds (0 for no expiry)
   * @returns Promise resolving to true if successful
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      if (!key) {
        throw new AppError('Key is required', 400);
      }
      
      const expirationTtl = ttl === undefined ? this.defaultTtl : ttl;
      
      // Use KV if available
      if (this.kvNamespace) {
        const options = expirationTtl > 0 ? { expirationTtl } : undefined;
        
        // Convert objects to JSON strings, but leave strings as-is
        const storedValue = typeof value === 'string' ? value : JSON.stringify(value);
        
        await this.kvNamespace.put(key, storedValue, options);
      } else {
        // Store in memory with expiry time
        const storeObj = {
          value,
          expiry: expirationTtl > 0 ? Date.now() + (expirationTtl * 1000) : undefined
        };
        
        this.memoryStore.set(key, storeObj);
      }
      
      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Storage error: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  }

  /**
   * Retrieve a value
   * @param key Key to retrieve
   * @returns Promise resolving to the value or null if not found
   */
  async get(key: string): Promise<any> {
    try {
      if (!key) {
        throw new AppError('Key is required', 400);
      }
      
      // Use KV if available
      if (this.kvNamespace) {
        const value = await this.kvNamespace.get(key);
        
        if (value === null || value === undefined) {
          return null;
        }
        
        // Try to parse JSON, but return as-is if not valid JSON
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      } else {
        // Get from memory store
        const storeObj = this.memoryStore.get(key);
        
        if (!storeObj) {
          return null;
        }
        
        // Check if expired
        if (storeObj.expiry && storeObj.expiry < Date.now()) {
          this.memoryStore.delete(key);
          return null;
        }
        
        return storeObj.value;
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Storage error: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  }

  /**
   * Delete a value
   * @param key Key to delete
   * @returns Promise resolving to true if deleted, false if not found
   */
  async delete(key: string): Promise<boolean> {
    try {
      if (!key) {
        throw new AppError('Key is required', 400);
      }
      
      // Use KV if available
      if (this.kvNamespace) {
        await this.kvNamespace.delete(key);
        return true;
      } else {
        // Delete from memory store
        return this.memoryStore.delete(key);
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Storage error: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  }

  /**
   * List keys with a prefix
   * @param prefix Prefix to filter by
   * @param limit Maximum number of keys to return
   * @returns Promise resolving to an array of keys
   */
  async listKeys(prefix: string = '', limit: number = 1000): Promise<string[]> {
    try {
      // Use KV if available
      if (this.kvNamespace) {
        const result = await this.kvNamespace.list({ prefix, limit });
        return result.keys.map((k: any) => k.name);
      } else {
        // List from memory store
        const keys: string[] = [];
        
        for (const [key, storeObj] of this.memoryStore.entries()) {
          // Skip if doesn't match prefix
          if (prefix && !key.startsWith(prefix)) {
            continue;
          }
          
          // Skip if expired
          if (storeObj.expiry && storeObj.expiry < Date.now()) {
            this.memoryStore.delete(key);
            continue;
          }
          
          keys.push(key);
          
          // Stop if we've reached the limit
          if (keys.length >= limit) {
            break;
          }
        }
        
        return keys;
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Storage error: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  }

  /**
   * Store call data
   * @param callId Call ID
   * @param data Call data
   * @returns Promise resolving to true if successful
   */
  async storeCallData(callId: string, data: any): Promise<boolean> {
    return this.set(`call:${callId}`, data);
  }

  /**
   * Get call data
   * @param callId Call ID
   * @returns Promise resolving to the call data or null if not found
   */
  async getCallData(callId: string): Promise<any> {
    return this.get(`call:${callId}`);
  }

  /**
   * Update call data
   * @param callId Call ID
   * @param updateFn Function to update the data
   * @returns Promise resolving to true if successful
   */
  async updateCallData(callId: string, updateFn: (data: any) => any): Promise<boolean> {
    const data = await this.getCallData(callId);
    const updatedData = updateFn(data);
    return this.storeCallData(callId, updatedData);
  }

  /**
   * List call IDs
   * @param limit Maximum number of IDs to return
   * @returns Promise resolving to an array of call IDs
   */
  async listCallIds(limit: number = 100): Promise<string[]> {
    const keys = await this.listKeys('call:', limit);
    return keys.map(key => key.replace('call:', ''));
  }
}

// Create and export a singleton instance
export const storageService = new StorageService();