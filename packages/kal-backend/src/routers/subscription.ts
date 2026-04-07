import { TRPCError } from "@trpc/server";
import { ObjectId } from "mongodb";
import { z } from "zod";

import type { User } from "kal-shared";

import { stripe, tierToPriceId } from "../lib/stripe.js";
import { protectedProcedure, router } from "../lib/trpc.js";

export const subscriptionRouter = router({
  /**
   * Create a Stripe Checkout session for subscribing to a tier.
   * Returns the Checkout URL for the frontend to redirect to.
   */
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        tier: z.enum(["tier_1", "tier_2"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db, userId } = ctx;

      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      const user = await db
        .collection<User>("users")
        .findOne({ _id: new ObjectId(userId) as any });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Don't allow subscribing if already on the requested tier
      if (user.tier === input.tier) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `You are already on ${input.tier}`,
        });
      }

      // If user already has a subscription, redirect to portal for plan changes
      if (user.stripeSubscriptionId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "You already have an active subscription. Use the billing portal to change your plan.",
        });
      }

      const priceId = tierToPriceId(input.tier);

      if (!priceId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Price ID not configured for this tier",
        });
      }

      // Create or reuse a Stripe customer
      let stripeCustomerId = user.stripeCustomerId;

      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          name: user.name || undefined,
          metadata: {
            userId: String(user._id),
            logtoId: user.logtoId,
            platform: "kal",
          },
        });
        stripeCustomerId = customer.id;

        // Save customer ID to user record
        await db
          .collection<User>("users")
          .updateOne(
            { _id: new ObjectId(userId) as any },
            { $set: { stripeCustomerId: customer.id, updatedAt: new Date() } }
          );
      }

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        client_reference_id: String(user._id),
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${frontendUrl}/dashboard/settings?subscription=success`,
        cancel_url: `${frontendUrl}/dashboard/settings?subscription=cancelled`,
        metadata: {
          userId: String(user._id),
          tier: input.tier,
          platform: "kal",
        },
      });

      if (!session.url) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create checkout session",
        });
      }

      return { url: session.url };
    }),

  /**
   * Create a Stripe Customer Portal session for managing billing.
   * Returns the portal URL for the frontend to redirect to.
   */
  createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    const { db, userId } = ctx;

    if (!userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in",
      });
    }

    const user = await db
      .collection<User>("users")
      .findOne({ _id: new ObjectId(userId) as any });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    if (!user.stripeCustomerId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "No billing account found. You need an active subscription first.",
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${frontendUrl}/dashboard/settings`,
    });

    return { url: portalSession.url };
  }),

  /**
   * Get the current user's subscription status.
   */
  getSubscriptionStatus: protectedProcedure.query(async ({ ctx }) => {
    const { db, userId } = ctx;

    if (!userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in",
      });
    }

    const user = await db
      .collection<User>("users")
      .findOne({ _id: new ObjectId(userId) as any });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const isActive =
      user.tier !== "free" &&
      !!user.stripeSubscriptionId &&
      !!user.stripeCurrentPeriodEnd &&
      new Date(user.stripeCurrentPeriodEnd) > new Date();

    return {
      tier: user.tier,
      stripeCustomerId: user.stripeCustomerId || null,
      stripeSubscriptionId: user.stripeSubscriptionId || null,
      stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd || null,
      isActive,
    };
  }),
});
