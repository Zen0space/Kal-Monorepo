import {
  RATE_LIMITS,
  VPS_SAFETY_CAPS,
  type UserTier,
  type RateLimitUsage,
} from "kal-shared";
import type { Db } from "mongodb";

// eslint-disable-next-line import/order
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

  // Burst tracking
  burstUsed?: number;
  burstRemaining?: number;
  burstWindowActive?: boolean;
  effectiveMinuteLimit?: number;
}

/**
 * Check rate limits for a user based on their tier.
 *
 * Rate limit hierarchy (checked in order):
 * 1. VPS Safety Cap: 20 requests/second (global)
 * 2. Minute limit: varies by tier (65/130/145 per minute)
 *    - Burst window: First 10 seconds of each minute allows up to maxBurstTotal
 *    - After burst window: Standard minuteLimit applies
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
 * 2. Minute limit with burst: varies by tier
 *    - Burst window (first N seconds): allows up to maxBurstTotal requests
 *    - After burst window: standard minuteLimit applies
 * 3. Daily limit: varies by tier
 * 4. Monthly limit: varies by tier
 *
 * IMPORTANT: Counters are only incremented for ALLOWED requests.
 * Rate-limited requests do NOT count towards usage.
 *
 * Uses industry-standard MongoDB pattern:
 * - Composite _id: `${userId}_${date}` for uniqueness
 * - Check limits BEFORE incrementing to ensure accurate counting
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

  // Burst window calculation: first N seconds of each minute
  const burstWindowEnd = new Date(minuteStart);
  burstWindowEnd.setSeconds(limits.burstWindowSeconds); // e.g., 10 seconds
  const isInBurstWindow = now < burstWindowEnd;

  // Determine effective minute limit based on burst window
  const effectiveMinuteLimit = isInBurstWindow
    ? limits.maxBurstTotal // e.g., 160 for tier_1
    : limits.minuteLimit; // e.g., 130 for tier_1

  const collection = db.collection<RateLimitUsage>("rate_limit_usage");

  // Composite _id ensures one document per user per day
  const compositeId = `${userId}_${today}`;

  try {
    // Step 1: Get current usage WITHOUT incrementing
    const existingUsage = await collection.findOne({
      _id: compositeId as unknown as string,
    });

    // Check if we're in new time windows
    const isNewMinute =
      !existingUsage?.minuteWindow ||
      new Date(existingUsage.minuteWindow).getTime() < minuteStart.getTime();

    const isNewSecond =
      !existingUsage?.secondWindow ||
      new Date(existingUsage.secondWindow).getTime() < secondStart.getTime();

    // Step 2: Calculate PROJECTED counts (what they would be after this request)
    const projectedSecondCount = isNewSecond
      ? 1
      : (existingUsage?.secondCount || 0) + 1;
    const projectedMinuteCount = isNewMinute
      ? 1
      : (existingUsage?.minuteCount || 0) + 1;
    const projectedDailyCount = (existingUsage?.dailyCount || 0) + 1;

    // Calculate burst usage based on projected counts
    const projectedBurstUsed = Math.max(
      0,
      projectedMinuteCount - limits.minuteLimit
    );
    const projectedBurstRemaining = Math.max(
      0,
      limits.burstBonus - projectedBurstUsed
    );

    // Step 3: Check VPS safety cap BEFORE incrementing
    if (projectedSecondCount > VPS_SAFETY_CAPS.maxRequestsPerSecond) {
      logger.info("VPS safety cap exceeded (per-second)", {
        userId: userId.substring(0, 8),
        secondCount: projectedSecondCount - 1, // Current count (not projected)
        limit: VPS_SAFETY_CAPS.maxRequestsPerSecond,
        tier,
      });
      // DON'T increment - return limited
      return {
        limited: true,
        retryAfter: 1, // Wait 1 second
        limitType: "second",
        secondCount: existingUsage?.secondCount || 0,
        minuteCount: existingUsage?.minuteCount || 0,
        dailyCount: existingUsage?.dailyCount || 0,
        minuteLimit: limits.minuteLimit,
        dailyLimit: limits.dailyLimit,
        burstUsed: Math.max(
          0,
          (existingUsage?.minuteCount || 0) - limits.minuteLimit
        ),
        burstRemaining: Math.max(
          0,
          limits.burstBonus -
            Math.max(0, (existingUsage?.minuteCount || 0) - limits.minuteLimit)
        ),
        burstWindowActive: isInBurstWindow,
        effectiveMinuteLimit,
      };
    }

    // Step 4: Check minute limit BEFORE incrementing
    if (projectedMinuteCount > effectiveMinuteLimit) {
      const secondsInMinute = now.getSeconds();
      const retryAfter = 60 - secondsInMinute;
      logger.info("Minute rate limit exceeded", {
        userId: userId.substring(0, 8),
        minuteCount: existingUsage?.minuteCount || 0, // Current count
        minuteLimit: limits.minuteLimit,
        effectiveMinuteLimit,
        burstWindowActive: isInBurstWindow,
        tier,
      });
      // DON'T increment - return limited
      return {
        limited: true,
        retryAfter,
        limitType: "minute",
        minuteCount: existingUsage?.minuteCount || 0,
        dailyCount: existingUsage?.dailyCount || 0,
        minuteLimit: limits.minuteLimit,
        dailyLimit: limits.dailyLimit,
        burstUsed: Math.max(
          0,
          (existingUsage?.minuteCount || 0) - limits.minuteLimit
        ),
        burstRemaining: Math.max(
          0,
          limits.burstBonus -
            Math.max(0, (existingUsage?.minuteCount || 0) - limits.minuteLimit)
        ),
        burstWindowActive: isInBurstWindow,
        effectiveMinuteLimit,
      };
    }

    // Step 5: Check daily limit BEFORE incrementing
    if (projectedDailyCount > limits.dailyLimit) {
      const secondsUntilMidnight = getSecondsUntilMidnight();
      logger.info("Daily rate limit exceeded", {
        userId: userId.substring(0, 8),
        dailyCount: existingUsage?.dailyCount || 0, // Current count
        dailyLimit: limits.dailyLimit,
        tier,
      });
      // DON'T increment - return limited
      return {
        limited: true,
        retryAfter: secondsUntilMidnight,
        limitType: "daily",
        dailyCount: existingUsage?.dailyCount || 0,
        minuteCount: existingUsage?.minuteCount || 0,
        dailyLimit: limits.dailyLimit,
        monthlyLimit: limits.monthlyLimit,
        burstUsed: Math.max(
          0,
          (existingUsage?.minuteCount || 0) - limits.minuteLimit
        ),
        burstRemaining: Math.max(
          0,
          limits.burstBonus -
            Math.max(0, (existingUsage?.minuteCount || 0) - limits.minuteLimit)
        ),
        burstWindowActive: isInBurstWindow,
        effectiveMinuteLimit,
      };
    }

    // Step 6: All checks passed - NOW increment counters
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
        compositeId,
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

    // Calculate actual burst usage after increment
    const burstUsed = Math.max(0, usage.minuteCount - limits.minuteLimit);
    const burstRemaining = Math.max(0, limits.burstBonus - burstUsed);

    // Monthly limit is checked via aggregation in getUsageStats
    // We don't block here as it requires summing all daily counts

    return {
      limited: false,
      secondCount: usage.secondCount || 1,
      minuteCount: usage.minuteCount,
      dailyCount: usage.dailyCount,
      minuteLimit: limits.minuteLimit,
      dailyLimit: limits.dailyLimit,
      monthlyLimit: limits.monthlyLimit,
      burstUsed,
      burstRemaining,
      burstWindowActive: isInBurstWindow,
      effectiveMinuteLimit,
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
    if (
      errorMessage.includes("E11000") ||
      errorMessage.includes("duplicate key")
    ) {
      logger.error(
        "CRITICAL: Duplicate key error in rate_limit_usage - possible _id issue",
        {
          compositeId,
          error: errorMessage,
        }
      );
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

  // Burst-related headers
  if (result.burstRemaining !== undefined) {
    headers["X-RateLimit-Burst-Remaining"] = String(result.burstRemaining);
  }
  if (result.burstUsed !== undefined) {
    headers["X-RateLimit-Burst-Used"] = String(result.burstUsed);
  }
  if (result.burstWindowActive !== undefined) {
    headers["X-RateLimit-Burst-Window-Active"] = result.burstWindowActive
      ? "true"
      : "false";
  }
  if (result.effectiveMinuteLimit !== undefined) {
    headers["X-RateLimit-Effective-Limit"] = String(
      result.effectiveMinuteLimit
    );
  }

  return headers;
}
