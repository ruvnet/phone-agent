/**
 * Logger utility for the AI Phone Agent
 * Provides structured logging with different log levels
 */

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

/**
 * Custom error class with status code
 */
export class AppError extends Error {
  statusCode: number;
  
  /**
   * Creates a new AppError
   * @param message - Error message
   * @param statusCode - HTTP status code
   */
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

/**
 * Logger class for structured logging
 */
class Logger {
  private minLevel: LogLevel;
  
  /**
   * Creates a new Logger instance
   * @param minLevel - Minimum log level to output
   */
  constructor(minLevel: LogLevel = LogLevel.INFO) {
    this.minLevel = minLevel;
  }
  
  /**
   * Sets the minimum log level
   * @param level - Minimum log level
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }
  
  /**
   * Logs a debug message
   * @param message - Log message
   * @param data - Optional data to include
   */
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }
  
  /**
   * Logs an info message
   * @param message - Log message
   * @param data - Optional data to include
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }
  
  /**
   * Logs a warning message
   * @param message - Log message
   * @param data - Optional data to include
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }
  
  /**
   * Logs an error message
   * @param message - Log message
   * @param error - Error object or data
   */
  error(message: string, error?: any): void {
    const errorData = error instanceof Error
      ? { 
          message: error.message, 
          name: error.name, 
          stack: error.stack,
          ...(error instanceof AppError ? { statusCode: error.statusCode } : {})
        }
      : error;
    
    this.log(LogLevel.ERROR, message, errorData);
  }
  
  /**
   * Internal log method
   * @param level - Log level
   * @param message - Log message
   * @param data - Optional data to include
   */
  private log(level: LogLevel, message: string, data?: any): void {
    // Skip if below minimum level
    if (!this.shouldLog(level)) {
      return;
    }
    
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(data !== undefined ? { data } : {})
    };
    
    // In production, we'd use structured logging
    // For development, format for readability
    if (level === LogLevel.ERROR) {
      console.error(JSON.stringify(logEntry, null, 2));
    } else if (level === LogLevel.WARN) {
      console.warn(JSON.stringify(logEntry, null, 2));
    } else {
      console.log(JSON.stringify(logEntry, null, 2));
    }
  }
  
  /**
   * Determines if a message should be logged based on level
   * @param level - Log level to check
   * @returns True if the message should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const minLevelIndex = levels.indexOf(this.minLevel);
    const currentLevelIndex = levels.indexOf(level);
    
    return currentLevelIndex >= minLevelIndex;
  }
}

// Determine if we're in production mode
const isProduction = () => {
  // Check for Cloudflare Workers environment
  if (typeof globalThis.env !== 'undefined') {
    return globalThis.env.NODE_ENV === 'production';
  }
  
  // Fallback for other environments
  return false;
};

// Export a default instance for convenience
export const logger = new Logger(
  // Set log level based on environment
  isProduction() ? LogLevel.INFO : LogLevel.DEBUG
);