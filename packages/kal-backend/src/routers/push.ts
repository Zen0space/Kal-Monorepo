import { z } from "zod";

import { protectedProcedure, publicProcedure, router } from "../lib/trpc.js";
import {
  broadcastPushNotification,
  getPushCollection,
  getVapidPublicKey,
  sendPushToUser,
} from "../lib/web-push.js";

// ─── Input Schemas ───────────────────────────────────────────────────────────

const subscribeInput = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  userAgent: z.string().optional(),
});

const unsubscribeInput = z.object({
  endpoint: z.string().url(),
});

const sendNotificationInput = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  url: z.string().optional(),
  tag: z.string().optional(),
});

const sendToUserInput = sendNotificationInput.extend({
  userId: z.string().min(1),
});

const trackPromptEventInput = z.object({
  action: z.enum(["dismissed", "subscribed"]),
});

// ─── Router ──────────────────────────────────────────────────────────────────

export const pushRouter = router({
  /**
   * Get the VAPID public key (needed by the frontend to subscribe).
   * Public — no auth required.
   */
  getVapidPublicKey: publicProcedure.query(() => {
    return { vapidPublicKey: getVapidPublicKey() };
  }),

  /**
   * Subscribe the current user's device to push notifications.
   * Requires the user to be logged in.
   */
  subscribe: protectedProcedure
    .input(subscribeInput)
    .mutation(async ({ ctx, input }) => {
      const col = getPushCollection(ctx.db);

      // Upsert by endpoint — if same device re-subscribes, update keys
      await col.updateOne(
        { endpoint: input.endpoint },
        {
          $set: {
            userId: ctx.userId,
            endpoint: input.endpoint,
            keys: input.keys,
            userAgent: input.userAgent,
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );

      return { success: true };
    }),

  /**
   * Unsubscribe a specific device (by endpoint) for the current user.
   */
  unsubscribe: protectedProcedure
    .input(unsubscribeInput)
    .mutation(async ({ ctx, input }) => {
      const col = getPushCollection(ctx.db);

      // Only allow users to remove their own subscriptions
      const result = await col.deleteOne({
        endpoint: input.endpoint,
        userId: ctx.userId,
      });

      return { success: result.deletedCount > 0 };
    }),

  /**
   * Check if the current user has any push subscriptions.
   */
  getSubscriptionStatus: protectedProcedure.query(async ({ ctx }) => {
    const col = getPushCollection(ctx.db);
    const count = await col.countDocuments({ userId: ctx.userId });
    return { subscribed: count > 0, deviceCount: count };
  }),

  // ─── Admin-Only Endpoints ────────────────────────────────────────────────
  // These use publicProcedure because admin auth is handled via x-admin-secret
  // header in the context layer (same pattern as admin-logs, platform-settings).

  /**
   * Broadcast a push notification to ALL subscribed users.
   */
  sendToAll: publicProcedure
    .input(sendNotificationInput)
    .mutation(async ({ ctx, input }) => {
      const result = await broadcastPushNotification(ctx.db, {
        title: input.title,
        body: input.body,
        url: input.url,
        tag: input.tag,
      });

      return result;
    }),

  /**
   * Send a push notification to a specific user (all their devices).
   */
  sendToUser: publicProcedure
    .input(sendToUserInput)
    .mutation(async ({ ctx, input }) => {
      const result = await sendPushToUser(ctx.db, input.userId, {
        title: input.title,
        body: input.body,
        url: input.url,
        tag: input.tag,
      });

      return result;
    }),

  /**
   * Track a push prompt interaction (dismissed or subscribed).
   * Used by PushPermissionPrompt for analytics.
   */
  trackPromptEvent: protectedProcedure
    .input(trackPromptEventInput)
    .mutation(async ({ ctx, input }) => {
      const col = ctx.db.collection("push_prompt_events");

      await col.insertOne({
        userId: ctx.userId,
        action: input.action,
        timestamp: new Date(),
      });

      return { success: true };
    }),

  /**
   * Get push notification stats (admin dashboard).
   */
  getStats: publicProcedure.query(async ({ ctx }) => {
    const col = getPushCollection(ctx.db);
    const promptCol = ctx.db.collection("push_prompt_events");

    const [
      totalSubscriptions,
      uniqueUsers,
      promptsDismissed,
      promptsConverted,
    ] = await Promise.all([
      col.countDocuments(),
      col.distinct("userId").then((ids) => ids.length),
      promptCol.countDocuments({ action: "dismissed" }),
      promptCol.countDocuments({ action: "subscribed" }),
    ]);

    return {
      totalSubscriptions,
      uniqueUsers,
      promptsDismissed,
      promptsConverted,
    };
  }),
});
