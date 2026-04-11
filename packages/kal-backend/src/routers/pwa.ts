import { z } from "zod";

import { getPwaInstallsCollection } from "../lib/pwa-installs.js";
import { publicProcedure, router } from "../lib/trpc.js";

// ─── Input Schemas ───────────────────────────────────────────────────────────

const trackInstallInput = z.object({
  platform: z.enum(["ios", "android", "desktop", "unknown"]),
  browser: z.string().min(1).max(50),
  userAgent: z.string().max(500),
  screenResolution: z.string().max(20),
  displayMode: z.string().max(30),
  fingerprint: z.string().min(1).max(128),
});

// ─── Router ──────────────────────────────────────────────────────────────────

export const pwaRouter = router({
  /**
   * Track a PWA install event.
   * Public — works for both anonymous and authenticated users.
   * Upserts by fingerprint to deduplicate same-device installs.
   */
  trackInstall: publicProcedure
    .input(trackInstallInput)
    .mutation(async ({ ctx, input }) => {
      const col = getPwaInstallsCollection(ctx.db);
      const now = new Date();

      // userId is available if the user is logged in (from context)
      const userId = ctx.userId ?? null;

      await col.updateOne(
        { fingerprint: input.fingerprint },
        {
          $set: {
            // Update userId if user is now logged in (was previously anonymous)
            ...(userId ? { userId } : {}),
            userAgent: input.userAgent,
            updatedAt: now,
          },
          $setOnInsert: {
            // Only set these on first insert
            ...(userId ? {} : { userId: null }),
            platform: input.platform,
            browser: input.browser,
            screenResolution: input.screenResolution,
            displayMode: input.displayMode,
            fingerprint: input.fingerprint,
            installedAt: now,
          },
        },
        { upsert: true }
      );

      return { success: true };
    }),

  /**
   * Get PWA install statistics (admin dashboard).
   * Uses publicProcedure — admin auth is handled via x-admin-secret header.
   */
  getStats: publicProcedure.query(async ({ ctx }) => {
    const col = getPwaInstallsCollection(ctx.db);

    // Run aggregations in parallel
    const [totalInstalls, platformBreakdown, browserBreakdown, dailyInstalls] =
      await Promise.all([
        // Total installs
        col.countDocuments(),

        // Breakdown by platform
        col
          .aggregate<{
            _id: string;
            count: number;
          }>([{ $group: { _id: "$platform", count: { $sum: 1 } } }, { $sort: { count: -1 } }])
          .toArray(),

        // Breakdown by browser
        col
          .aggregate<{
            _id: string;
            count: number;
          }>([{ $group: { _id: "$browser", count: { $sum: 1 } } }, { $sort: { count: -1 } }])
          .toArray(),

        // Daily installs for last 30 days
        col
          .aggregate<{ _id: string; count: number }>([
            {
              $match: {
                installedAt: {
                  $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                },
              },
            },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$installedAt",
                  },
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ])
          .toArray(),
      ]);

    // Count unique authenticated users (non-null userId)
    const authenticatedInstalls = await col.countDocuments({
      userId: { $ne: null },
    });

    return {
      totalInstalls,
      authenticatedInstalls,
      anonymousInstalls: totalInstalls - authenticatedInstalls,
      platformBreakdown: platformBreakdown.map((p) => ({
        platform: p._id,
        count: p.count,
      })),
      browserBreakdown: browserBreakdown.map((b) => ({
        browser: b._id,
        count: b.count,
      })),
      dailyInstalls: dailyInstalls.map((d) => ({
        date: d._id,
        count: d.count,
      })),
    };
  }),
});
