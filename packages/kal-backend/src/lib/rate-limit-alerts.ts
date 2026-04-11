import type { UserTier } from "kal-shared";
import type { Db } from "mongodb";

import { logger } from "./logger.js";
import { sendPushToUser } from "./web-push.js";
import type { PushPayload } from "./web-push.js";

// ---------------------------------------------------------------------------
// Rate Limit Alert Notifications
//
// Sends push notifications when a user reaches 80% or 100% of their
// daily/monthly API rate limits. Uses an in-memory dedup map so each
// alert fires at most once per user per period.
// ---------------------------------------------------------------------------

// ─── Dedup Map ──────────────────────────────────────────────────────────────

// Key format: "${userId}_daily_80_2026-04-11" or "${userId}_monthly_100_2026-04"
const sentAlerts = new Map<string, number>(); // key → timestamp

// Clean stale entries every hour (entries older than 48h)
const STALE_MS = 48 * 60 * 60 * 1000;
setInterval(() => {
  const cutoff = Date.now() - STALE_MS;
  for (const [key, ts] of sentAlerts) {
    if (ts < cutoff) sentAlerts.delete(key);
  }
}, 3600_000);

// ─── Helpers ────────────────────────────────────────────────────────────────

function dedupKey(
  userId: string,
  type: "daily" | "monthly",
  threshold: 80 | 100,
  period: string
): string {
  return `${userId}_${type}_${threshold}_${period}`;
}

function markSent(key: string): void {
  sentAlerts.set(key, Date.now());
}

function alreadySent(key: string): boolean {
  return sentAlerts.has(key);
}

function today(): string {
  return new Date().toISOString().split("T")[0]; // "2026-04-11"
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; // "2026-04"
}

// ─── Monthly Aggregation ────────────────────────────────────────────────────

async function getMonthlyUsage(db: Db, userId: string): Promise<number> {
  const month = currentMonth(); // "2026-04"
  const result = await db
    .collection("rate_limit_usage")
    .aggregate([
      {
        $match: {
          // _id format: "${userId}_YYYY-MM-DD"
          _id: { $regex: `^${userId}_${month}` },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$dailyCount" },
        },
      },
    ])
    .toArray();

  return result[0]?.total ?? 0;
}

// ─── Alert Payloads ─────────────────────────────────────────────────────────

function dailyWarningPayload(used: number, limit: number): PushPayload {
  return {
    title: "API Usage Warning",
    body: `You've used 80% of your daily limit (${used.toLocaleString()}/${limit.toLocaleString()} requests). Consider pacing your requests.`,
    url: "/dashboard",
    tag: "rate-limit-daily-80",
  };
}

function dailyReachedPayload(limit: number): PushPayload {
  return {
    title: "Daily Limit Reached",
    body: `You've hit your daily API limit (${limit.toLocaleString()} requests). Requests will be blocked until tomorrow.`,
    url: "/dashboard",
    tag: "rate-limit-daily-100",
  };
}

function monthlyWarningPayload(used: number, limit: number): PushPayload {
  return {
    title: "Monthly Usage Warning",
    body: `You've used 80% of your monthly limit (${used.toLocaleString()}/${limit.toLocaleString()} requests). Consider upgrading your plan.`,
    url: "/dashboard/settings",
    tag: "rate-limit-monthly-80",
  };
}

function monthlyReachedPayload(limit: number): PushPayload {
  return {
    title: "Monthly Limit Reached",
    body: `You've hit your monthly API limit (${limit.toLocaleString()} requests). Upgrade your plan to continue.`,
    url: "/dashboard/settings",
    tag: "rate-limit-monthly-100",
  };
}

// ─── Main Check ─────────────────────────────────────────────────────────────

/**
 * Check if rate limit thresholds have been crossed and send push notifications.
 *
 * Called fire-and-forget from the API middleware — must never throw or block.
 * Uses in-memory dedup to avoid sending the same alert repeatedly.
 */
export async function checkRateLimitAlerts(
  db: Db,
  userId: string,
  _tier: UserTier,
  dailyCount: number,
  dailyLimit: number,
  monthlyLimit: number
): Promise<void> {
  try {
    const todayStr = today();
    const monthStr = currentMonth();

    // ── Daily 100% ──────────────────────────────────────────────────────
    if (dailyCount >= dailyLimit) {
      const key = dedupKey(userId, "daily", 100, todayStr);
      if (!alreadySent(key)) {
        markSent(key);
        sendPushToUser(db, userId, dailyReachedPayload(dailyLimit)).catch(
          () => {}
        );
        logger.info("Rate limit alert: daily 100%", {
          userId: userId.substring(0, 8),
          dailyCount,
          dailyLimit,
        });
      }
    }
    // ── Daily 80% ───────────────────────────────────────────────────────
    else if (dailyCount >= dailyLimit * 0.8) {
      const key = dedupKey(userId, "daily", 80, todayStr);
      if (!alreadySent(key)) {
        markSent(key);
        sendPushToUser(
          db,
          userId,
          dailyWarningPayload(dailyCount, dailyLimit)
        ).catch(() => {});
        logger.info("Rate limit alert: daily 80%", {
          userId: userId.substring(0, 8),
          dailyCount,
          dailyLimit,
        });
      }
    }

    // ── Monthly checks ──────────────────────────────────────────────────
    // Only run the aggregation if we haven't already sent both monthly alerts
    const monthly80Key = dedupKey(userId, "monthly", 80, monthStr);
    const monthly100Key = dedupKey(userId, "monthly", 100, monthStr);

    if (alreadySent(monthly80Key) && alreadySent(monthly100Key)) {
      return; // Both monthly alerts already sent, skip aggregation
    }

    // Optimization: only aggregate if today's daily count is meaningful
    // (if dailyCount is tiny, monthly total can't have just crossed a threshold)
    const monthlyThreshold80 = monthlyLimit * 0.8;
    if (dailyCount < 10) return; // Too few requests today to matter

    const monthlyTotal = await getMonthlyUsage(db, userId);

    // ── Monthly 100% ────────────────────────────────────────────────────
    if (monthlyTotal >= monthlyLimit && !alreadySent(monthly100Key)) {
      markSent(monthly100Key);
      sendPushToUser(
        db,
        userId,
        monthlyReachedPayload(monthlyLimit)
      ).catch(() => {});
      logger.info("Rate limit alert: monthly 100%", {
        userId: userId.substring(0, 8),
        monthlyTotal,
        monthlyLimit,
      });
    }
    // ── Monthly 80% ─────────────────────────────────────────────────────
    else if (monthlyTotal >= monthlyThreshold80 && !alreadySent(monthly80Key)) {
      markSent(monthly80Key);
      sendPushToUser(
        db,
        userId,
        monthlyWarningPayload(monthlyTotal, monthlyLimit)
      ).catch(() => {});
      logger.info("Rate limit alert: monthly 80%", {
        userId: userId.substring(0, 8),
        monthlyTotal,
        monthlyLimit,
      });
    }
  } catch (err) {
    // Never let alert checking crash the API
    logger.warn("Rate limit alert check failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
