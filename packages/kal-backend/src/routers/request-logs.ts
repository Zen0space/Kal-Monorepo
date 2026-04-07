/**
 * Request Logs Router
 *
 * tRPC procedures for querying and analyzing API request logs.
 * All queries are automatically scoped to the authenticated user —
 * users can only see their own logs.
 */

import { z } from "zod";

import { RequestLogService } from "../lib/request-log-service.js";
import { CacheKeys, CacheTTL } from "../lib/cache-keys.js";
import { cache } from "../lib/cache.js";
import { protectedProcedure, publicProcedure, router } from "../lib/trpc.js";

export const requestLogsRouter = router({
  /**
   * Get recent logs for the current user with filtering and pagination
   */
  list: protectedProcedure
    .input(
      z
        .object({
          endpoint: z.string().optional(),
          type: z.enum(["rest", "trpc"]).optional(),
          statusCode: z.number().optional(),
          success: z.boolean().optional(),
          startDate: z.string().datetime().optional(),
          endDate: z.string().datetime().optional(),
          limit: z.number().min(1).max(200).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input = {} }) => {
      const logService = new RequestLogService(ctx.db);

      const options = {
        ...input,
        // Always scope to the authenticated user
        userId: ctx.userId,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
      };

      const [logs, total] = await Promise.all([
        logService.query(options),
        logService.count(options),
      ]);

      return {
        logs: logs.map((log) => ({
          ...log,
          _id: log._id?.toString(),
        })),
        total,
        limit: options.limit ?? 50,
        offset: options.offset ?? 0,
        hasMore: (options.offset ?? 0) + logs.length < total,
      };
    }),

  /**
   * Get analytics for the current user for a time period
   */
  analytics: protectedProcedure
    .input(
      z.object({
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
      })
    )
    .query(async ({ ctx, input }) => {
      const logService = new RequestLogService(ctx.db);
      return logService.getAnalytics(
        new Date(input.startDate),
        new Date(input.endDate),
        { userId: ctx.userId }
      );
    }),

  /**
   * Get requests by day for the current user (for charting)
   */
  requestsByDay: protectedProcedure
    .input(
      z
        .object({
          days: z.number().min(1).max(90).default(30),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const logService = new RequestLogService(ctx.db);
      return logService.getRequestsByDay(input?.days ?? 30, {
        userId: ctx.userId,
      });
    }),

  /**
   * Get quick stats for the current user for dashboard overview
   */
  quickStats: protectedProcedure.query(async ({ ctx }) => {
    const logService = new RequestLogService(ctx.db);
    const userOpts = { userId: ctx.userId };

    // Get stats for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get stats for this week
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);

    const [todayStats, weekStats] = await Promise.all([
      logService.getAnalytics(today, tomorrow, userOpts),
      logService.getAnalytics(weekStart, tomorrow, userOpts),
    ]);

    return {
      today: {
        requests: todayStats.totalRequests,
        errors: todayStats.failedRequests,
        avgDuration: todayStats.averageDuration,
        errorRate: todayStats.errorRate,
      },
      week: {
        requests: weekStats.totalRequests,
        errors: weekStats.failedRequests,
        avgDuration: weekStats.averageDuration,
        errorRate: weekStats.errorRate,
        topEndpoints: weekStats.topEndpoints.slice(0, 5),
      },
    };
  }),

  /**
   * Get total successful requests this month across all users (public, cached 1hr)
   */
  publicMonthlyStats: publicProcedure.query(async ({ ctx }) => {
    const cacheKey = CacheKeys.trpcPublicMonthlyStats();

    return cache.wrap(cacheKey, CacheTTL.CATEGORIES, async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const successfulRequests = await ctx.db
        .collection("api_request_logs")
        .countDocuments({
          success: true,
          timestamp: { $gte: monthStart },
        });

      return { successfulRequests };
    });
  }),
});
