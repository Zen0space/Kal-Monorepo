import { RATE_LIMITS, type RateLimitConfig, type UserTier } from "kal-shared";
import { cache } from "./cache.js";
import type { Db } from "mongodb";

const SETTINGS_ID = "rate_limits";
const CACHE_KEY = "platform:rate_limits";
const CACHE_TTL = 60 * 5; // 5 minutes cache for middleware to pick up

// Helper to get effective limits (DB > Default)
export async function getEffectiveRateLimits(db: Db): Promise<Record<UserTier, RateLimitConfig>> {
  // Try cache first
  const cached = await cache.get<Record<UserTier, RateLimitConfig>>(CACHE_KEY);
  if (cached) return cached;

  // Try DB
  // Note: db.collection might throw if db is not connected, but assumed connected here
  const doc = await db.collection("platform_settings").findOne({ _id: SETTINGS_ID as any });
  
  let merged = { ...RATE_LIMITS };

  if (doc && doc.limits) {
    // Merge DB limits with defaults
    // We'll replace per tier if exists in DB to override code defaults
    merged = {
        ...merged,
        ...doc.limits
    };
  }

  // Set Cache
  cache.set(CACHE_KEY, merged, CACHE_TTL);
  return merged;
}

export function invalidateRateLimitsCache() {
    cache.del(CACHE_KEY);
}
