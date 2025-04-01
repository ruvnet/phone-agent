/**
 * Global type definitions for the AI Phone Agent
 */

/**
 * Extend the global namespace to include our environment variables
 */
declare global {
  /**
   * Environment variables accessible globally
   */
  var env: Record<string, string | undefined>;
  
  /**
   * Cloudflare Worker execution context
   */
  interface ExecutionContext {
    waitUntil(promise: Promise<any>): void;
    passThroughOnException(): void;
  }
  
  /**
   * Cloudflare KV Namespace
   */
  interface KVNamespace<K extends string = string> {
    get(key: K, options?: { type: 'text' }): Promise<string | null>;
    get(key: K, options: { type: 'json' }): Promise<any | null>;
    get(key: K, options: { type: 'arrayBuffer' }): Promise<ArrayBuffer | null>;
    get(key: K, options: { type: 'stream' }): Promise<ReadableStream | null>;
    get(key: K, options?: KVNamespaceGetOptions): Promise<string | ArrayBuffer | ReadableStream | null>;
    
    put(
      key: K,
      value: string | ArrayBuffer | ReadableStream | FormData,
      options?: KVNamespacePutOptions
    ): Promise<void>;
    
    delete(key: K): Promise<void>;
    
    list(options?: KVNamespaceListOptions): Promise<{
      keys: { name: K; expiration?: number; metadata?: any }[];
      list_complete: boolean;
      cursor?: string;
    }>;
  }
  
  /**
   * Options for KV get operations
   */
  interface KVNamespaceGetOptions {
    type?: 'text' | 'json' | 'arrayBuffer' | 'stream';
    cacheTtl?: number;
  }
  
  /**
   * Options for KV put operations
   */
  interface KVNamespacePutOptions {
    expiration?: number;
    expirationTtl?: number;
    metadata?: any;
  }
  
  /**
   * Options for KV list operations
   */
  interface KVNamespaceListOptions {
    prefix?: string;
    limit?: number;
    cursor?: string;
  }
}

// This export is needed to make this a module
export {};