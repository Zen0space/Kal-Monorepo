import type { UserTier, RateLimitUsage } from "kal-shared";
import { RATE_LIMITS } from "kal-shared";
import type { Db } from "mongodb";

import { logger } from "../lib/logger.js";

export interface RateLimitResult {
  limited: boolean;
  retryAfter?: number; // seconds until retry allowed
  dailyCount?: number;
  dailyLimit?: number;
  minuteCount?: number;
  burstLimit?: number;
}

/**
 * Check rate limits for a user based on their tier.
 * Uses soft throttling - returns 429 with Retry-After, not permanent bans.
 * 
 * Uses industry-standard MongoDB pattern:
 * - Composite _id: `${userId}_${date}` for uniqueness
 * - Atomic findOneAndUpdate with $inc for race-condition safety
 */
export async function checkRateLimit(
  db: Db,
  userId: string,
  tier: UserTier = "free"
): Promise<RateLimitResult> {
  const limits = RATE_LIMITS[tier];
  const now = new Date();
  const today = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const minuteStart = new Date(now);
  minuteStart.setSeconds(0, 0);

  const collection = db.collection<RateLimitUsage>("rate_limit_usage");
  
  // Composite _id ensures one document per user per day
  const compositeId = `${userId}_${today}`;

  try {
    // First, get current usage to check minute window
    const existingUsage = await collection.findOne({ _id: compositeId as unknown as string });
    
    // Check if we're in a new minute window
    const isNewMinute =
      !existingUsage?.minuteWindow ||
      new Date(existingUsage.minuteWindow).getTime() < minuteStart.getTime();

    // Use atomic upsert - single operation for both create and update
    // This prevents race conditions and duplicate key errors
    const updateDoc = isNewMinute || !existingUsage
      ? {
          // New minute or first request: reset minute counter
          $inc: { dailyCount: 1 },
          $set: {
            minuteWindow: minuteStart,
            minuteCount: 1,
            updatedAt: now,
          },
          $setOnInsert: {
            userId,
            date: today,
          },
        }
      : {
          // Same minute: increment both counters
          $inc: { dailyCount: 1, minuteCount: 1 },
          $set: { updatedAt: now },
        };

    const result = await collection.findOneAndUpdate(
      { _id: compositeId as unknown as string },
      updateDoc,
      { upsert: true, returnDocument: "after" }
    );

    const usage = result;
    
    if (!usage) {
      // This shouldn't happen with upsert, but handle gracefully
      logger.warn("Rate limit upsert returned null", { 
        userId: userId.substring(0, 8), 
        compositeId 
      });
      return {
        limited: false,
        dailyCount: 1,
        dailyLimit: limits.dailyLimit,
        minuteCount: 1,
        burstLimit: limits.burstLimit,
      };
    }

    // Check daily limit (soft throttle until midnight)
    if (usage.dailyCount > limits.dailyLimit) {
      const secondsUntilMidnight = getSecondsUntilMidnight();
      logger.info("Daily rate limit exceeded", {
        userId: userId.substring(0, 8),
        dailyCount: usage.dailyCount,
        dailyLimit: limits.dailyLimit,
        tier,
      });
      return {
        limited: true,
        retryAfter: secondsUntilMidnight,
        dailyCount: usage.dailyCount,
        dailyLimit: limits.dailyLimit,
      };
    }

    // Check burst limit (soft throttle for remaining seconds in minute)
    if (usage.minuteCount > limits.burstLimit) {
      const secondsInMinute = now.getSeconds();
      const retryAfter = 60 - secondsInMinute;
      logger.info("Burst rate limit exceeded", {
        userId: userId.substring(0, 8),
        minuteCount: usage.minuteCount,
        burstLimit: limits.burstLimit,
        tier,
      });
      return {
        limited: true,
        retryAfter,
        minuteCount: usage.minuteCount,
        burstLimit: limits.burstLimit,
      };
    }

    return {
      limited: false,
      dailyCount: usage.dailyCount,
      dailyLimit: limits.dailyLimit,
      minuteCount: usage.minuteCount,
      burstLimit: limits.burstLimit,
    };
  } catch (error) {
    // Log the error with full context for debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error("Rate limit check failed", {
      userId: userId.substring(0, 8),
      compositeId,
      tier,
      error: errorMessage,
    });
    
    // Log additional details for MongoDB-specific errors
    if (errorMessage.includes("E11000") || errorMessage.includes("duplicate key")) {
      logger.error("CRITICAL: Duplicate key error in rate_limit_usage - possible _id issue", {
        compositeId,
        error: errorMessage,
      });
    }
    
    // Log stack trace for debugging
    if (errorStack) {
      console.error("Rate limit error stack trace:", errorStack);
    }
    
    // Return non-limiting result to avoid blocking users due to DB issues
    // But log it so we can investigate
    return {
      limited: false,
      dailyCount: 0,
      dailyLimit: limits.dailyLimit,
      minuteCount: 0,
      burstLimit: limits.burstLimit,
    };
  }
}

/**
 * Get seconds until midnight (UTC)
 */
function getSecondsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(24, 0, 0, 0);
  return Math.ceil((midnight.getTime() - now.getTime()) / 1000);
}

/**
 * Format rate limit headers for response
 */
export function getRateLimitHeaders(
  result: RateLimitResult,
  tier: UserTier = "free"
): Record<string, string> {
  const limits = RATE_LIMITS[tier];
  const headers: Record<string, string> = {
    "X-RateLimit-Limit-Daily": String(limits.dailyLimit),
    "X-RateLimit-Limit-Burst": String(limits.burstLimit),
  };

  if (result.dailyCount !== undefined) {
    headers["X-RateLimit-Remaining-Daily"] = String(
      Math.max(0, limits.dailyLimit - result.dailyCount)
    );
  }
  if (result.minuteCount !== undefined) {
    headers["X-RateLimit-Remaining-Burst"] = String(
      Math.max(0, limits.burstLimit - result.minuteCount)
    );
  }
  if (result.retryAfter !== undefined) {
    headers["Retry-After"] = String(result.retryAfter);
  }

  return headers;
}
