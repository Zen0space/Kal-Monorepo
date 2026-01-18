/**
 * API Request Logger Middleware
 * 
 * Logs all API requests to MongoDB for analytics and debugging.
 * Works for both REST API (/api/*) and tRPC (/trpc/*) endpoints.
 */

import type { NextFunction, Request, Response } from "express";
import type { User } from "kal-shared";

import { getDB } from "../lib/db.js";
import { RequestLogService } from "../lib/request-log-service.js";

/**
 * Configuration options for the logger
 */
interface LoggerOptions {
  /** Whether to log request bodies (default: false) */
  logRequestBody?: boolean;
  /** Whether to log response bodies (default: false) */
  logResponseBody?: boolean;
  /** Sampling rate (0-1, default: 1.0 = log all requests) */
  samplingRate?: number;
  /** Paths to exclude from logging */
  excludePaths?: string[];
}

/**
 * Extended request type with user info
 */
interface AuthRequest extends Request {
  apiUser?: User;
  startTime?: number;
  keyPrefix?: string;
}

/**
 * Get the request type based on path
 */
function getRequestType(path: string): "rest" | "trpc" {
  return path.startsWith("/trpc") ? "trpc" : "rest";
}

/**
 * Extract tRPC procedure name from path
 * /trpc/chat.sendMessage -> chat.sendMessage
 */
function extractEndpoint(path: string, type: "rest" | "trpc"): string {
  if (type === "trpc") {
    // Remove /trpc/ prefix and query params
    const cleanPath = path.replace(/^\/trpc\//, "").split("?")[0];
    // Handle batch requests (multiple procedures)
    if (cleanPath.includes(",")) {
      return cleanPath.split(",")[0] + "..."; // e.g., "chat.sendMessage..."
    }
    return cleanPath;
  }
  // For REST, return the path without query params
  return path.split("?")[0];
}

/**
 * Hash IP address for privacy
 */
function hashIp(ip: string | undefined): string | undefined {
  if (!ip) return undefined;
  // Simple hashing - just use first part for privacy
  if (ip.includes(".")) {
    const parts = ip.split(".");
    return `${parts[0]}.${parts[1]}.*.*`;
  }
  if (ip.includes(":")) {
    const parts = ip.split(":");
    return `${parts.slice(0, 2).join(":")}::*`;
  }
  return "unknown";
}

/**
 * Create the API request logger middleware
 */
export function createApiRequestLogger(options: LoggerOptions = {}) {
  const {
    samplingRate = 1.0,
    excludePaths = ["/health", "/favicon.ico"],
  } = options;

  return function apiRequestLogger(req: AuthRequest, res: Response, next: NextFunction): void {
    // Check if path should be excluded
    const path = req.originalUrl || req.url;
    if (excludePaths.some((excludePath) => path.startsWith(excludePath))) {
      next();
      return;
    }

    // Apply sampling
    if (samplingRate < 1.0 && Math.random() > samplingRate) {
      next();
      return;
    }

    // Record start time
    const startTime = Date.now();
    const requestId = RequestLogService.generateRequestId();

    // Store request ID for potential debugging
    res.setHeader("X-Request-Id", requestId);

    // Capture the original end function
    const originalEnd = res.end.bind(res);

    // Override res.end to capture response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res.end = function (this: Response, ...args: any[]): Response {
      // Calculate duration
      const duration = Date.now() - startTime;

      // Determine request type and endpoint
      const type = getRequestType(path);
      const endpoint = extractEndpoint(path, type);

      // Get user info from auth middleware (if available)
      const userId = req.apiUser?._id?.toString() || null;
      const apiKeyPrefix = req.keyPrefix || null;

      // Determine success based on status code
      const statusCode = res.statusCode;
      const success = statusCode >= 200 && statusCode < 400;

      // Build log entry
      const logEntry = {
        requestId,
        timestamp: new Date(),
        userId,
        apiKeyPrefix,
        type,
        method: req.method,
        endpoint,
        statusCode,
        duration,
        success,
        userAgent: req.headers["user-agent"],
        ip: hashIp(req.ip || req.socket?.remoteAddress),
      };

      // Insert log asynchronously (non-blocking)
      try {
        const db = getDB();
        const logService = new RequestLogService(db);
        logService.insertAsync(logEntry);
      } catch (error) {
        // Silently fail - logging should never break the request
        console.error("[ApiRequestLogger] Error:", error);
      }

      // Call original end with all arguments
      return originalEnd(...args);
    };

    next();
  };
}

/**
 * Admin tRPC procedures that should not be logged
 * These are internal admin operations, not public API usage
 */
const ADMIN_TRPC_PREFIXES = [
  "requestLogs.",    // Analytics queries
  "apiKeys.",        // API key management
  "user.",           // User management/stats
  "platformSettings.", // Platform settings
];

/**
 * Check if a tRPC path is an admin procedure
 */
function isAdminTrpcPath(path: string): boolean {
  // Extract the procedure name from /trpc/procedure.name
  const match = path.match(/^\/trpc\/([^?,]+)/);
  if (!match) return false;

  const procedureName = match[1];
  return ADMIN_TRPC_PREFIXES.some(prefix => procedureName.startsWith(prefix));
}

/**
 * Default middleware instance with standard options
 * 
 * Excludes:
 * - Health check endpoints
 * - Static files
 * - Admin tRPC procedures (handled separately via isAdminTrpcPath)
 */
export const apiRequestLogger = createApiRequestLogger({
  samplingRate: parseFloat(process.env.LOG_SAMPLING_RATE || "1.0"),
  excludePaths: [
    "/health",
    "/favicon.ico",
    "/openapi.json",
    "/docs",        // API documentation
    "/api-docs",    // Swagger UI
  ],
});

/**
 * Enhanced API request logger that also excludes admin tRPC procedures
 * Use this instead of the basic apiRequestLogger
 */
export function createEnhancedApiRequestLogger(options: LoggerOptions = {}) {
  const baseLogger = createApiRequestLogger(options);

  return function enhancedApiRequestLogger(req: AuthRequest, res: Response, next: NextFunction): void {
    const path = req.originalUrl || req.url;

    // Skip admin tRPC procedures
    if (isAdminTrpcPath(path)) {
      next();
      return;
    }

    // Delegate to base logger
    return baseLogger(req, res, next);
  };
}

/**
 * Default enhanced logger instance
 * This is the recommended logger to use - excludes admin operations
 */
export const enhancedApiRequestLogger = createEnhancedApiRequestLogger({
  samplingRate: parseFloat(process.env.LOG_SAMPLING_RATE || "1.0"),
  excludePaths: [
    "/health",
    "/favicon.ico",
    "/openapi.json",
    "/docs",
    "/api-docs",
  ],
});
