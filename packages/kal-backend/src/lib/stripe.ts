import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn(
    "⚠️  STRIPE_SECRET_KEY is not set. Stripe functionality will not work."
  );
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

/**
 * Maps a Stripe Price ID to a UserTier.
 * Returns "free" if the price ID doesn't match any known tier.
 */
export function priceIdToTier(priceId: string): "free" | "tier_1" | "tier_2" {
  if (priceId === process.env.STRIPE_TIER1_PRICE_ID) return "tier_1";
  if (priceId === process.env.STRIPE_TIER2_PRICE_ID) return "tier_2";
  return "free";
}

/**
 * Maps a UserTier to a Stripe Price ID.
 * Returns null for the free tier (no Stripe price).
 */
export function tierToPriceId(tier: "tier_1" | "tier_2"): string | null {
  if (tier === "tier_1") return process.env.STRIPE_TIER1_PRICE_ID || null;
  if (tier === "tier_2") return process.env.STRIPE_TIER2_PRICE_ID || null;
  return null;
}
