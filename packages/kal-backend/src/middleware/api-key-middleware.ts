import { createHash } from "crypto";

import type { NextFunction, Request, Response } from "express";
import type { ApiKey, User } from "kal-shared";
import type { Db } from "mongodb";

import { getDB } from "../lib/db.js";
import { logger } from "../lib/logger.js";

import { checkRateLimit, getRateLimitHeaders } from "./rate-limit.js";

/**
 * Hash an API key using SHA-256 for secure storage/lookup
 */
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Generate a new API key with the kal_ prefix
 */
export function generateApiKey(): string {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  const hex = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `kal_${hex}`;
}

/**
 * Get key prefix for logging (first 12 chars)
 */
function getKeyPrefix(apiKey: string): string {
  return apiKey.substring(0, 12);
}

/**
 * Validate an API key and return the associated user
 */
export async function validateApiKeyAndGetUser(
  db: Db,
  apiKey: string
): Promise<{ valid: boolean; user?: User; error?: string; statusCode?: number }> {
  const hashedKey = hashApiKey(apiKey);

  // Find the API key
  const keyDoc = await db.collection<ApiKey>("api_keys").findOne({
    key: hashedKey,
    isRevoked: false,
  });

  if (!keyDoc) {
    return { valid: false, error: "Invalid API key", statusCode: 401 };
  }

  // Check expiration
  if (keyDoc.expiresAt && new Date(keyDoc.expiresAt) < new Date()) {
    return { valid: false, error: "API key has expired", statusCode: 401 };
  }

  // Get the user
  const { ObjectId } = await import("mongodb");
  const user = await db.collection<User>("users").findOne({
    _id: new ObjectId(keyDoc.userId) as unknown as string,
  });

  if (!user) {
    return { valid: false, error: "User not found", statusCode: 401 };
  }

  // Update last used timestamp (fire and forget)
  db.collection("api_keys").updateOne(
    { _id: keyDoc._id } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    { $set: { lastUsedAt: new Date() } }
  ).catch(console.error);

  return { valid: true, user };
}

/**
 * Express middleware to validate API key for REST endpoints
 */
export function validateApiKeyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();
  const apiKey = req.headers["x-api-key"] as string | undefined;
  const method = req.method;
  const endpoint = req.originalUrl.split("?")[0]; // Remove query string for logging

  if (!apiKey) {
    logger.authFailed("No API key provided");
    res.status(401).json({
      success: false,
      error: "API key required. Provide X-API-Key header.",
      docs: "/api-docs",
    });
    return;
  }

  const keyPrefix = getKeyPrefix(apiKey);

  if (!apiKey.startsWith("kal_")) {
    logger.authFailed("Invalid format", keyPrefix);
    res.status(401).json({
      success: false,
      error: "Invalid API key format",
    });
    return;
  }

  logger.apiRequest(method, endpoint, keyPrefix);

  const db = getDB();

  validateApiKeyAndGetUser(db, apiKey)
    .then(async (result) => {
      if (!result.valid || !result.user) {
        const duration = Date.now() - startTime;
        logger.authFailed(result.error || "Unknown", keyPrefix);
        logger.apiError(method, endpoint, result.statusCode || 401, result.error || "Auth failed", { duration });
        res.status(result.statusCode || 401).json({
          success: false,
          error: result.error,
        });
        return;
      }

      const userId = result.user._id.toString();
      logger.authSuccess(keyPrefix, userId);

      // Check rate limits
      const rateResult = await checkRateLimit(
        db,
        userId,
        result.user.tier
      );

      // Add rate limit headers
      const headers = getRateLimitHeaders(rateResult, result.user.tier);
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      if (rateResult.limited) {
        const duration = Date.now() - startTime;
        logger.rateLimited(userId, result.user.tier);
        logger.apiError(method, endpoint, 429, "Rate limit exceeded", { duration, userId });
        res.status(429).json({
          success: false,
          error: "Rate limit exceeded",
          retryAfter: rateResult.retryAfter,
        });
        return;
      }

      // Attach user and timing to request for downstream use
      (req as Request & { apiUser?: User; startTime?: number; keyPrefix?: string }).apiUser = result.user;
      (req as Request & { startTime?: number }).startTime = startTime;
      (req as Request & { keyPrefix?: string }).keyPrefix = keyPrefix;

      next();
    })
    .catch((error) => {
      const duration = Date.now() - startTime;
      logger.error("API key validation error", { error: error.message, endpoint, duration });
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    });
}
