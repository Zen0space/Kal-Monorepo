"use client";

import { RATE_LIMITS, TIER_PRICING } from "kal-shared";
import type { UserTier } from "kal-shared";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Check, Zap } from "react-feather";

import { AuthUpdater, useAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";

interface PricingClientProps {
  logtoId?: string;
  email?: string | null;
  name?: string | null;
}

export default function PricingClient({
  logtoId,
  email,
  name,
}: PricingClientProps) {
  return (
    <>
      <AuthUpdater logtoId={logtoId} email={email} name={name} />
      <PricingContentWrapper expectedLogtoId={logtoId} />
    </>
  );
}

function PricingContentWrapper({
  expectedLogtoId,
}: {
  expectedLogtoId?: string;
}) {
  const { logtoId } = useAuth();

  if (expectedLogtoId && logtoId !== expectedLogtoId) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-dark-elevated rounded w-48 mb-4" />
          <div className="h-4 bg-dark-elevated rounded w-32" />
        </div>
      </div>
    );
  }

  return <PricingContent />;
}

function PricingContent() {
  const router = useRouter();
  const { data: subscriptionStatus, isLoading } =
    trpc.subscription.getSubscriptionStatus.useQuery();
  const createCheckout = trpc.subscription.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    },
  });
  const createPortal = trpc.subscription.createPortalSession.useMutation({
    onSuccess: (data) => {
      // Redirect to Stripe Customer Portal
      window.location.href = data.url;
    },
  });

  const currentTier = subscriptionStatus?.tier || "free";

  const handleSubscribe = (tier: "tier_1" | "tier_2") => {
    createCheckout.mutate({ tier });
  };

  const handleManageBilling = () => {
    createPortal.mutate();
  };

  const tiers: {
    key: UserTier;
    features: string[];
    highlighted?: boolean;
  }[] = [
    {
      key: "free",
      features: [
        `${RATE_LIMITS.free.minuteLimit} requests/minute`,
        `${RATE_LIMITS.free.dailyLimit.toLocaleString()} requests/day`,
        `${RATE_LIMITS.free.monthlyLimit.toLocaleString()} requests/month`,
        "Full food database access",
        "AI-powered nutrition chat",
        "Community support",
      ],
    },
    {
      key: "tier_1",
      highlighted: true,
      features: [
        `${RATE_LIMITS.tier_1.minuteLimit} requests/minute`,
        `${RATE_LIMITS.tier_1.dailyLimit.toLocaleString()} requests/day`,
        `${RATE_LIMITS.tier_1.monthlyLimit.toLocaleString()} requests/month`,
        "Full food database access",
        "AI-powered nutrition chat",
        "Priority support",
        "Higher burst limits",
      ],
    },
    {
      key: "tier_2",
      features: [
        `${RATE_LIMITS.tier_2.minuteLimit} requests/minute`,
        `${RATE_LIMITS.tier_2.dailyLimit.toLocaleString()} requests/day`,
        `${RATE_LIMITS.tier_2.monthlyLimit.toLocaleString()} requests/month`,
        "Full food database access",
        "AI-powered nutrition chat",
        "Priority support",
        "Maximum burst limits",
        "Dedicated support channel",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-dark">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-16">
        {/* Back button */}
        <button
          onClick={() => router.push("/dashboard/settings")}
          className="flex items-center gap-2 text-content-secondary hover:text-content-primary transition-colors mb-8"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">Back to Settings</span>
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-content-primary mb-3">
            Choose Your Plan
          </h1>
          <p className="text-content-secondary text-base md:text-lg max-w-2xl mx-auto">
            Scale your application with higher rate limits and priority support.
            All plans include full access to the Malaysian food nutrition
            database.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {tiers.map((tier) => {
            const pricing = TIER_PRICING[tier.key];
            const isCurrent = currentTier === tier.key;
            const isHigherTier =
              (tier.key === "tier_1" && currentTier === "free") ||
              (tier.key === "tier_2" &&
                (currentTier === "free" || currentTier === "tier_1"));
            const isPaid = tier.key !== "free";

            return (
              <div
                key={tier.key}
                className={`relative bg-dark-surface border rounded-2xl p-6 md:p-8 flex flex-col ${
                  tier.highlighted
                    ? "border-accent shadow-lg shadow-accent/10"
                    : "border-dark-border"
                }`}
              >
                {/* Popular badge */}
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-accent text-dark-bg text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Zap size={12} /> POPULAR
                    </span>
                  </div>
                )}

                {/* Tier name */}
                <h2 className="text-xl font-bold text-content-primary mb-1">
                  {pricing.label}
                </h2>
                <p className="text-content-secondary text-sm mb-6">
                  {pricing.description}
                </p>

                {/* Price */}
                <div className="mb-6">
                  {pricing.price === 0 ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-content-primary">
                        Free
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm text-content-muted">RM</span>
                      <span className="text-4xl font-bold text-content-primary">
                        {pricing.price}
                      </span>
                      <span className="text-content-muted text-sm">/month</span>
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check
                        size={16}
                        className={`mt-0.5 flex-shrink-0 ${
                          tier.highlighted
                            ? "text-accent"
                            : "text-content-muted"
                        }`}
                      />
                      <span className="text-content-secondary text-sm">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                {isLoading ? (
                  <div className="h-11 bg-dark-elevated rounded-lg animate-pulse" />
                ) : isCurrent ? (
                  <div className="text-center">
                    <span className="inline-block w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-dark-elevated text-content-muted border border-dark-border">
                      Current Plan
                    </span>
                    {isPaid && subscriptionStatus?.stripeCustomerId && (
                      <button
                        onClick={handleManageBilling}
                        disabled={createPortal.isPending}
                        className="mt-3 text-accent hover:underline text-sm disabled:opacity-50"
                      >
                        {createPortal.isPending
                          ? "Loading..."
                          : "Manage Billing"}
                      </button>
                    )}
                  </div>
                ) : isHigherTier ? (
                  <button
                    onClick={() =>
                      handleSubscribe(tier.key as "tier_1" | "tier_2")
                    }
                    disabled={createCheckout.isPending}
                    className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                      tier.highlighted
                        ? "bg-accent text-dark-bg hover:bg-accent/90"
                        : "bg-dark-elevated text-content-primary hover:bg-dark-border border border-dark-border"
                    }`}
                  >
                    {createCheckout.isPending
                      ? "Redirecting..."
                      : `Subscribe to ${pricing.label}`}
                  </button>
                ) : (
                  // Lower tier than current — show manage billing
                  <button
                    onClick={handleManageBilling}
                    disabled={createPortal.isPending}
                    className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-dark-elevated text-content-primary hover:bg-dark-border border border-dark-border transition-colors disabled:opacity-50"
                  >
                    {createPortal.isPending ? "Loading..." : "Manage Billing"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-content-muted text-xs mt-8">
          All prices are in Malaysian Ringgit (MYR). Subscriptions are billed
          monthly and can be cancelled anytime.
        </p>

        {/* Error display */}
        {(createCheckout.error || createPortal.error) && (
          <div className="mt-6 max-w-md mx-auto bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
            <p className="text-red-400 text-sm">
              {createCheckout.error?.message || createPortal.error?.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
