/**
 * Admin Logs Router
 *
 * tRPC procedures for admin users to view ALL API request logs across all users.
 * Unlike the user-facing requestLogs router, these are NOT scoped to a single user.
 */

import { z } from "zod";

import { RequestLogService } from "../lib/request-log-service.js";
import { publicProcedure, router } from "../lib/trpc.js";

export const adminLogsRouter = router({
  /**
   * Get all request logs with filtering and pagination (system-wide)
   */
  list: publicProcedure
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
        // No userId filter - get ALL logs
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
   * Get analytics for the entire system (all users)
   */
  analytics: publicProcedure
    .input(
      z.object({
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
      })
    )
    .query(async ({ ctx, input }) => {
      const logService = new RequestLogService(ctx.db);
      // No userId filter - get system-wide analytics
      return logService.getAnalytics(
        new Date(input.startDate),
        new Date(input.endDate),
        {} // Empty options = no userId filter
      );
    }),

  /**
   * Get requests by day for the entire system (for charting)
   */
  requestsByDay: publicProcedure
    .input(
      z
        .object({
          days: z.number().min(1).max(90).default(30),
          endpointPrefix: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const logService = new RequestLogService(ctx.db);
      // No userId filter - get system-wide data
      return logService.getRequestsByDay(input?.days ?? 30, {
        endpointPrefix: input?.endpointPrefix,
      });
    }),

  /**
   * Get quick stats for admin dashboard (system-wide)
   */
  quickStats: publicProcedure
    .input(
      z
        .object({
          endpointPrefix: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const logService = new RequestLogService(ctx.db);

      const endpointFilter = input?.endpointPrefix
        ? { endpointPrefix: input.endpointPrefix }
        : {};

      // Get stats for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get stats for this week
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - 7);

      // System-wide (no userId filter)
      const [todayStats, weekStats] = await Promise.all([
        logService.getAnalytics(today, tomorrow, endpointFilter),
        logService.getAnalytics(weekStart, tomorrow, endpointFilter),
      ]);

      return {
        today: {
          requests: todayStats.totalRequests,
          errors: todayStats.failedRequests,
          avgDuration: todayStats.averageDuration,
          errorRate: todayStats.errorRate,
          successRate: 100 - todayStats.errorRate,
        },
        week: {
          requests: weekStats.totalRequests,
          errors: weekStats.failedRequests,
          avgDuration: weekStats.averageDuration,
          errorRate: weekStats.errorRate,
          successRate: 100 - weekStats.errorRate,
          topEndpoints: weekStats.topEndpoints.slice(0, 5),
        },
      };
    }),
});
