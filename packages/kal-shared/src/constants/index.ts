export const API_VERSION = "v1" as const;

export const API_BASE_PATH = `/api/${API_VERSION}` as const;

// ===================
// Subscription Pricing
// ===================
export const TIER_PRICING = {
  free: {
    price: 0,
    currency: "MYR",
    label: "Free",
    description: "Get started with generous free limits",
  },
  tier_1: {
    price: 45,
    currency: "MYR",
    label: "Tier 1",
    description: "For growing applications",
  },
  tier_2: {
    price: 75,
    currency: "MYR",
    label: "Tier 2",
    description: "For high-traffic production apps",
  },
} as const;

export type TierPricing = typeof TIER_PRICING;
