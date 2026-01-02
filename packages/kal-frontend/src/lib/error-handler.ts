/**
 * Centralized Error Handler Utility
 * 
 * Provides consistent error handling across the application.
 * Maps API errors to user-friendly messages and determines error types.
 */

export type ErrorType = 
  | 'network'
  | 'timeout'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'rate_limited'
  | 'validation'
  | 'server'
  | 'unknown';

export interface ParsedError {
  type: ErrorType;
  message: string;
  title: string;
  shouldLogout: boolean;
  retryable: boolean;
}

/**
 * Parse any error into a structured format
 */
export function parseError(error: unknown): ParsedError {
  // Default error
  const defaultError: ParsedError = {
    type: 'unknown',
    message: 'Something went wrong. Please try again.',
    title: 'Error',
    shouldLogout: false,
    retryable: true,
  };

  if (!error) {
    return defaultError;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      ...defaultError,
      message: error,
    };
  }

  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Check for timeout errors first (more specific than network)
    if (
      error.name === 'TimeoutError' ||
      error.name === 'AbortError' ||
      message.includes('timeout') ||
      message.includes('aborted')
    ) {
      return {
        type: 'timeout',
        message: 'Request timed out. Please check your connection and try again.',
        title: 'Request Timeout',
        shouldLogout: false,
        retryable: true,
      };
    }

    // Network errors
    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('failed to fetch') ||
      message.includes('econnrefused')
    ) {
      return {
        type: 'network',
        message: 'Unable to connect to the server. Please check your internet connection.',
        title: 'Connection Error',
        shouldLogout: false,
        retryable: true,
      };
    }

    // tRPC errors have a 'data' property with code
    const trpcError = error as Error & { data?: { code?: string; httpStatus?: number } };
    const httpStatus = trpcError.data?.httpStatus;
    const code = trpcError.data?.code;

    // Unauthorized (401)
    if (httpStatus === 401 || code === 'UNAUTHORIZED') {
      return {
        type: 'unauthorized',
        message: 'Your session has expired. Please sign in again.',
        title: 'Session Expired',
        shouldLogout: true,
        retryable: false,
      };
    }

    // Forbidden (403)
    if (httpStatus === 403 || code === 'FORBIDDEN') {
      return {
        type: 'forbidden',
        message: 'You don\'t have permission to perform this action.',
        title: 'Access Denied',
        shouldLogout: false,
        retryable: false,
      };
    }

    // Not Found (404)
    if (httpStatus === 404 || code === 'NOT_FOUND') {
      return {
        type: 'not_found',
        message: 'The requested resource was not found.',
        title: 'Not Found',
        shouldLogout: false,
        retryable: false,
      };
    }

    // Rate Limited (429)
    if (httpStatus === 429 || message.includes('rate limit')) {
      return {
        type: 'rate_limited',
        message: 'Too many requests. Please wait a moment before trying again.',
        title: 'Rate Limited',
        shouldLogout: false,
        retryable: true,
      };
    }

    // Validation errors (400)
    if (httpStatus === 400 || code === 'BAD_REQUEST') {
      return {
        type: 'validation',
        message: error.message || 'Invalid request. Please check your input.',
        title: 'Validation Error',
        shouldLogout: false,
        retryable: false,
      };
    }

    // Server errors (500+)
    if (httpStatus && httpStatus >= 500) {
      return {
        type: 'server',
        message: 'The server encountered an error. Our team has been notified.',
        title: 'Server Error',
        shouldLogout: false,
        retryable: true,
      };
    }

    // Return the error message if we have one
    return {
      ...defaultError,
      message: error.message || defaultError.message,
    };
  }

  // Handle objects with message property
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return {
      ...defaultError,
      message: String((error as { message: unknown }).message),
    };
  }

  return defaultError;
}

/**
 * Get a user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  return parseError(error).message;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  return parseError(error).type === 'network';
}

/**
 * Check if error requires logout
 */
export function isAuthError(error: unknown): boolean {
  const parsed = parseError(error);
  return parsed.type === 'unauthorized' || parsed.shouldLogout;
}

/**
 * Check if the operation can be retried
 */
export function isRetryable(error: unknown): boolean {
  return parseError(error).retryable;
}

/**
 * Log error to console in development
 */
export function logError(context: string, error: unknown): void {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}]`, error);
  }
}
