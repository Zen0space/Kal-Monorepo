import type { ApiKey, ApiKeyExpiration, ApiKeyPublic, RateLimitUsage } from "kal-shared";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { protectedProcedure, router } from "../lib/trpc.js";
import {
  generateApiKey,
  hashApiKey,
} from "../middleware/api-key-middleware.js";

/**
 * Calculate expiration date based on expiration type
 */
function calculateExpiresAt(expiration: ApiKeyExpiration): Date | null {
  const now = new Date();
  switch (expiration) {
    case "1_week":
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case "1_month":
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    case "never":
      return null;
  }
}

/**
 * Convert API key document to public format (hides the actual key)
 */
function toPublic(doc: ApiKey): ApiKeyPublic {
  return {
    _id: doc._id.toString(),
    keyPrefix: doc.keyPrefix,
    name: doc.name,
    expiration: doc.expiration,
    expiresAt: doc.expiresAt,
    createdAt: doc.createdAt,
    lastUsedAt: doc.lastUsedAt,
    isRevoked: doc.isRevoked,
  };
}

export const apiKeysRouter = router({
  /**
   * Get current user info (triggers sync from Logto)
   */
  getMe: protectedProcedure.query(async ({ ctx }) => {
    return {
      _id: ctx.user?._id?.toString() || "",
      name: ctx.user?.name || "",
      email: ctx.user?.email || "",
      tier: ctx.user?.tier || "free",
    };
  }),

  /**
   * List user's API keys (public info only, never the actual key)
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const keys = await ctx.db
      .collection<ApiKey>("api_keys")
      .find({
        userId: ctx.userId,
        isRevoked: false,
      })
      .sort({ createdAt: -1 })
      .toArray();

    return keys.map(toPublic);
  }),

  /**
   * Generate a new API key
   * Returns the plain key ONCE - user must save it
   */
  generate: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(50),
        expiration: z.enum(["1_week", "1_month", "never"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const plainKey = generateApiKey();
      const hashedKey = hashApiKey(plainKey);
      const keyPrefix = plainKey.substring(0, 12) + "...";

      const now = new Date();
      const expiresAt = calculateExpiresAt(input.expiration);

      const doc: Omit<ApiKey, "_id"> = {
        userId: ctx.userId!,
        key: hashedKey,
        keyPrefix,
        name: input.name,
        expiration: input.expiration,
        expiresAt,
        createdAt: now,
        lastUsedAt: null,
        isRevoked: false,
        revokedAt: null,
      };

      const result = await ctx.db.collection("api_keys").insertOne(doc);

      return {
        // Return the plain key ONLY on creation
        key: plainKey,
        keyPublic: {
          _id: result.insertedId.toString(),
          keyPrefix,
          name: input.name,
          expiration: input.expiration,
          expiresAt,
          createdAt: now,
          lastUsedAt: null,
          isRevoked: false,
        } as ApiKeyPublic,
      };
    }),

  /**
   * Revoke an API key
   */
  revoke: protectedProcedure
    .input(z.object({ keyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.collection("api_keys").updateOne(
        {
          _id: new ObjectId(input.keyId),
          userId: ctx.userId,
          isRevoked: false,
        },
        {
          $set: {
            isRevoked: true,
            revokedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        throw new Error("API key not found or already revoked");
      }

      return { success: true };
    }),

  /**
   * Get usage statistics for the dashboard
   */
  getUsageStats: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date().toISOString().split("T")[0];

    // Get today's usage
    const usage = await ctx.db
      .collection<RateLimitUsage>("rate_limit_usage")
      .findOne({
        userId: ctx.userId,
        date: today,
      });

    // Get user's tier info
    const user = ctx.user;

    // Count active keys
    const activeKeyCount = await ctx.db
      .collection("api_keys")
      .countDocuments({
        userId: ctx.userId,
        isRevoked: false,
      });

    return {
      tier: user?.tier || "free",
      dailyUsed: usage?.dailyCount || 0,
      activeKeyCount,
    };
  }),
});
