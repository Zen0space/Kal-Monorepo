/**
 * Request Timeout Middleware
 *
 * Uses Node.js native req.setTimeout() for zero per-request overhead.
 * Scalable to thousands of concurrent users with automatic cleanup.
 *
 * @see https://nodejs.org/api/http.html#requestsettimeouttimeout-callback
 */

import type { Server } from "http";

import type { Request, Response, NextFunction } from "express";

// Default timeout in milliseconds
const DEFAULT_TIMEOUT_MS = parseInt(
  process.env.REQUEST_TIMEOUT_MS || "30000",
  10
);

/**
 * Lightweight timeout middleware using native request timeout.
 * Zero memory overhead - uses Node.js http module internals.
 *
 * @param timeoutMs - Timeout in milliseconds (default: 30000)
 */
export function requestTimeout(timeoutMs: number = DEFAULT_TIMEOUT_MS) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip timeout for specific routes if needed
    const skipTimeoutPaths = ["/health", "/openapi.json"];
    if (skipTimeoutPaths.some((path) => req.path === path)) {
      return next();
    }

    // Use native request timeout - no custom timers needed
    req.setTimeout(timeoutMs, () => {
      // Only send response if headers haven't been sent yet
      if (!res.headersSent) {
        console.warn(
          `[TIMEOUT] Request timed out after ${timeoutMs}ms: ${req.method} ${req.path}`
        );
        res.status(408).json({
          success: false,
          error: {
            code: "REQUEST_TIMEOUT",
            message: "Request timed out. Please try again.",
          },
        });
      }
    });

    next();
  };
}

/**
 * Configure server-level timeouts for Express.
 * Call this after app.listen() with the returned server instance.
 *
 * @param server - HTTP server instance from app.listen()
 * @param options - Timeout configuration options
 */
export function configureServerTimeouts(
  server: Server,
  options: {
    /** Socket timeout in ms (default: 30000) */
    timeout?: number;
    /** Keep-alive timeout for load balancers (default: 65000) */
    keepAliveTimeout?: number;
    /** Headers parsing timeout (default: 60000) */
    headersTimeout?: number;
  } = {}
) {
  const {
    timeout = DEFAULT_TIMEOUT_MS,
    keepAliveTimeout = 65000, // Slightly higher than typical load balancer (60s)
    headersTimeout = 60000,
  } = options;

  // Socket-level timeout
  server.timeout = timeout;

  // Keep-alive for persistent connections (important for load balancers)
  server.keepAliveTimeout = keepAliveTimeout;

  // Headers parsing timeout (protection against slowloris attacks)
  server.headersTimeout = headersTimeout;

  console.log(
    `⏱️  Server timeouts configured: socket=${timeout}ms, keepAlive=${keepAliveTimeout}ms, headers=${headersTimeout}ms`
  );
}
