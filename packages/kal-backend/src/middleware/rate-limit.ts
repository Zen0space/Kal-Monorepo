import type { UserTier, RateLimitUsage } from "kal-shared";
import { RATE_LIMITS, VPS_SAFETY_CAPS } from "kal-shared";
import type { Db } from "mongodb";

import { logger } from "../lib/logger.js";

export interface RateLimitResult {
  limited: boolean;
  retryAfter?: number; // seconds until retry allowed
  limitType?: "second" | "minute" | "daily" | "monthly" | "burst";
  
  // Current counts
  secondCount?: number;
  minuteCount?: number;
  dailyCount?: number;
  
  // Limits
  minuteLimit?: number;
  dailyLimit?: number;
  monthlyLimit?: number;
}

/**
 * Check rate limits for a user based on their tier.
 * 
 * Rate limit hierarchy (checked in order):
 * 1. VPS Safety Cap: 20 requests/second (global)
 * 2. Minute limit: varies by tier (65/130/110 per minute)
 * 3. Daily limit: varies by tier
 * 4. Monthly limit: varies by tier
 * 
 * Uses industry-standard MongoDB pattern:
 * - Composite _id: `${userId}_${date}` for uniqueness
 * - Atomic findOneAndUpdate with $inc for race-condition safety
 */
import { getEffectiveRateLimits } from "../lib/platform-settings.js";

/**
 * Check rate limits for a user based on their tier.
 * 
 * Rate limit hierarchy (checked in order):
 * 1. VPS Safety Cap: 20 requests/second (global)
 * 2. Minute limit: varies by tier (65/130/110 per minute)
 * 3. Daily limit: varies by tier
 * 4. Monthly limit: varies by tier
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
  // Fetch effective limits (Cached DB or Defaults)
  const allLimits = await getEffectiveRateLimits(db);
  const limits = allLimits[tier] || RATE_LIMITS[tier]; // Fallback just in case tier key missing

  const now = new Date();
  const today = now.toISOString().split("T")[0]; // YYYY-MM-DD
  
  // Time windows
  const minuteStart = new Date(now);
  minuteStart.setSeconds(0, 0);
  
  const secondStart = new Date(now);
  secondStart.setMilliseconds(0);

  const collection = db.collection<RateLimitUsage>("rate_limit_usage");
  
  // Composite _id ensures one document per user per day
  const compositeId = `${userId}_${today}`;

  try {
    // First, get current usage to check windows
    const existingUsage = await collection.findOne({ _id: compositeId as unknown as string });
    
    // Check if we're in new time windows
    const isNewMinute =
      !existingUsage?.minuteWindow ||
      new Date(existingUsage.minuteWindow).getTime() < minuteStart.getTime();
    
    const isNewSecond =
      !existingUsage?.secondWindow ||
      new Date(existingUsage.secondWindow).getTime() < secondStart.getTime();

    // Build update document based on window states
    interface UpdateOperation {
      $inc: Record<string, number>;
      $set: Record<string, Date | number>;
      $setOnInsert?: Record<string, string>;
    }
    
    const updateDoc: UpdateOperation = {
      $inc: { dailyCount: 1 },
      $set: { updatedAt: now },
    };

    // Handle minute window
    if (isNewMinute || !existingUsage) {
      updateDoc.$set.minuteWindow = minuteStart;
      updateDoc.$set.minuteCount = 1;
    } else {
      updateDoc.$inc.minuteCount = 1;
    }

    // Handle second window (for VPS safety cap)
    if (isNewSecond || !existingUsage) {
      updateDoc.$set.secondWindow = secondStart;
      updateDoc.$set.secondCount = 1;
    } else {
      updateDoc.$inc.secondCount = 1;
    }

    // Set on insert for new documents
    if (!existingUsage) {
      updateDoc.$setOnInsert = {
        userId,
        date: today,
      };
    }

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
        minuteCount: 1,
        secondCount: 1,
        minuteLimit: limits.minuteLimit,
        dailyLimit: limits.dailyLimit,
        monthlyLimit: limits.monthlyLimit,
      };
    }

    // Check VPS safety cap: 20 requests per second
    const secondCount = usage.secondCount || 1;
    if (secondCount > VPS_SAFETY_CAPS.maxRequestsPerSecond) {
      logger.info("VPS safety cap exceeded (per-second)", {
        userId: userId.substring(0, 8),
        secondCount,
        limit: VPS_SAFETY_CAPS.maxRequestsPerSecond,
        tier,
      });
      return {
        limited: true,
        retryAfter: 1, // Wait 1 second
        limitType: "second",
        secondCount,
        minuteCount: usage.minuteCount,
        dailyCount: usage.dailyCount,
        minuteLimit: limits.minuteLimit,
        dailyLimit: limits.dailyLimit,
      };
    }

    // Check minute limit
    if (usage.minuteCount > limits.minuteLimit) {
      const secondsInMinute = now.getSeconds();
      const retryAfter = 60 - secondsInMinute;
      logger.info("Minute rate limit exceeded", {
        userId: userId.substring(0, 8),
        minuteCount: usage.minuteCount,
        minuteLimit: limits.minuteLimit,
        tier,
      });
      return {
        limited: true,
        retryAfter,
        limitType: "minute",
        minuteCount: usage.minuteCount,
        dailyCount: usage.dailyCount,
        minuteLimit: limits.minuteLimit,
        dailyLimit: limits.dailyLimit,
      };
    }

    // Check daily limit
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
        limitType: "daily",
        dailyCount: usage.dailyCount,
        minuteCount: usage.minuteCount,
        dailyLimit: limits.dailyLimit,
        monthlyLimit: limits.monthlyLimit,
      };
    }

    // Monthly limit is checked via aggregation in getUsageStats
    // We don't block here as it requires summing all daily counts

    return {
      limited: false,
      secondCount,
      minuteCount: usage.minuteCount,
      dailyCount: usage.dailyCount,
      minuteLimit: limits.minuteLimit,
      dailyLimit: limits.dailyLimit,
      monthlyLimit: limits.monthlyLimit,
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
      minuteCount: 0,
      secondCount: 0,
      minuteLimit: limits.minuteLimit,
      dailyLimit: limits.dailyLimit,
      monthlyLimit: limits.monthlyLimit,
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
  // Use limits from result if available (which they should be now), else fallback to static constants
  // This avoids async call here
  const { minuteLimit, dailyLimit, monthlyLimit } = result;
  // If result lacks limits (shouldn't happen with our update), use static defaults
  const staticLimits = RATE_LIMITS[tier];

  const effectiveMinuteLimit = minuteLimit ?? staticLimits.minuteLimit;
  const effectiveDailyLimit = dailyLimit ?? staticLimits.dailyLimit;
  const effectiveMonthlyLimit = monthlyLimit ?? staticLimits.monthlyLimit;

  const headers: Record<string, string> = {
    "X-RateLimit-Limit-Minute": String(effectiveMinuteLimit),
    "X-RateLimit-Limit-Daily": String(effectiveDailyLimit),
    "X-RateLimit-Limit-Monthly": String(effectiveMonthlyLimit),
  };

  if (result.minuteCount !== undefined) {
    headers["X-RateLimit-Remaining-Minute"] = String(
      Math.max(0, effectiveMinuteLimit - result.minuteCount)
    );
  }
  if (result.dailyCount !== undefined) {
    headers["X-RateLimit-Remaining-Daily"] = String(
      Math.max(0, effectiveDailyLimit - result.dailyCount)
    );
  }
  if (result.retryAfter !== undefined) {
    headers["Retry-After"] = String(result.retryAfter);
  }
  if (result.limitType) {
    headers["X-RateLimit-Type"] = result.limitType;
  }

  return headers;
}
