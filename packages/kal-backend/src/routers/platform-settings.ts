import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../lib/trpc.js";
import { RATE_LIMITS, type RateLimitConfig, type UserTier } from "kal-shared";
import { getEffectiveRateLimits, invalidateRateLimitsCache } from "../lib/platform-settings.js";

const SETTINGS_ID = "rate_limits";

export const platformSettingsRouter = router({
  getRateLimits: publicProcedure.query(async ({ ctx }) => {
    return getEffectiveRateLimits(ctx.db);
  }),

  updateRateLimits: protectedProcedure
    .input(z.object({
      tier: z.enum(['free', 'tier_1', 'tier_2']),
      config: z.object({
        minuteLimit: z.number().min(1),
        dailyLimit: z.number().min(1),
        monthlyLimit: z.number().min(1),
        // Optional strictly, but usually we want all
        burstBonus: z.number().optional(),
        burstWindowSeconds: z.number().optional(),
        maxBurstTotal: z.number().optional()
      })
    }))
    .mutation(async ({ ctx, input }) => {
      const { tier, config } = input;
      
      // Get current stored limits to merge
      const current = await getEffectiveRateLimits(ctx.db);
      
      // Merge with existing default or stored config to ensure we don't lose optional fields if valid
      const existingTierConfig = current[tier as UserTier];
      
      const newConfig: RateLimitConfig = {
          ...existingTierConfig,
          ...config,
          // Ensure defaults for optional fields if they were missing (shouldn't be with getEffective)
          burstBonus: config.burstBonus ?? existingTierConfig.burstBonus,
          burstWindowSeconds: config.burstWindowSeconds ?? existingTierConfig.burstWindowSeconds,
          maxBurstTotal: config.maxBurstTotal ?? existingTierConfig.maxBurstTotal,
      };

      // Update DB
      await ctx.db.collection("platform_settings").updateOne(
        { _id: SETTINGS_ID as any },
        { 
          $set: { 
            [`limits.${tier}`]: newConfig,
            updatedAt: new Date(),
            updatedBy: ctx.userId 
          } 
        },
        { upsert: true }
      );

      // Invalidate cache
      invalidateRateLimitsCache();

      return { success: true };
    }),
    
    // Reset to defaults
    resetToDefaults: protectedProcedure
      .input(z.object({ tier: z.enum(['free', 'tier_1', 'tier_2']) }))
      .mutation(async ({ ctx, input }) => {
         const defaultLimits = RATE_LIMITS[input.tier as UserTier];
         
         await ctx.db.collection("platform_settings").updateOne(
            { _id: SETTINGS_ID as any },
            { 
               $set: { 
                 [`limits.${input.tier}`]: defaultLimits,
                 updatedAt: new Date(),
                 updatedBy: ctx.userId 
               } 
            },
            { upsert: true }
         );
         
         invalidateRateLimitsCache();
         return { success: true };
      })
});
