import type { UserTier, RateLimitUsage } from "kal-shared";
import { RATE_LIMITS } from "kal-shared";
import type { Db } from "mongodb";

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

  // Get current usage
  let usage = await collection.findOne({ userId, date: today });

  // Check if we're in a new minute window
  const isNewMinute =
    !usage?.minuteWindow ||
    new Date(usage.minuteWindow).getTime() < minuteStart.getTime();

  // Update or create usage record
  if (!usage) {
    // First request of the day
    usage = {
      _id: "" as any,
      userId,
      date: today,
      dailyCount: 1,
      minuteWindow: minuteStart,
      minuteCount: 1,
      updatedAt: now,
    };
    await collection.insertOne(usage as any);
  } else if (isNewMinute) {
    // New minute - reset minute counter
    await collection.updateOne(
      { userId, date: today },
      {
        $inc: { dailyCount: 1 },
        $set: {
          minuteWindow: minuteStart,
          minuteCount: 1,
          updatedAt: now,
        },
      }
    );
    usage.dailyCount += 1;
    usage.minuteCount = 1;
  } else {
    // Same minute - increment both counters
    await collection.updateOne(
      { userId, date: today },
      {
        $inc: { dailyCount: 1, minuteCount: 1 },
        $set: { updatedAt: now },
      }
    );
    usage.dailyCount += 1;
    usage.minuteCount += 1;
  }

  // Check daily limit (soft throttle until midnight)
  if (usage.dailyCount > limits.dailyLimit) {
    const secondsUntilMidnight = getSecondsUntilMidnight();
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
