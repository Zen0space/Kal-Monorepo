"use client";

import { RATE_LIMITS, TIER_PRICING } from "kal-shared";
import type { UserTier } from "kal-shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Zap } from "react-feather";

import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { AuthUpdater, useAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";

interface PricingClientProps {
  isAuthenticated: boolean;
  logtoId?: string;
  email?: string | null;
  name?: string | null;
  onSignIn?: () => Promise<void>;
}

export default function PricingClient({
  isAuthenticated,
  logtoId,
  email,
  name,
  onSignIn,
}: PricingClientProps) {
  return (
    <>
      {isAuthenticated && (
        <AuthUpdater logtoId={logtoId} email={email} name={name} />
      )}
      <PricingPage
        isAuthenticated={isAuthenticated}
        expectedLogtoId={logtoId}
        onSignIn={onSignIn}
      />
    </>
  );
}

function PricingPage({
  isAuthenticated,
  expectedLogtoId,
  onSignIn,
}: {
  isAuthenticated: boolean;
  expectedLogtoId?: string;
  onSignIn?: () => Promise<void>;
}) {
  const { logtoId } = useAuth();

  // If authenticated, wait for auth context to sync before showing interactive content
  const authReady =
    !isAuthenticated || !expectedLogtoId || logtoId === expectedLogtoId;

  return (
    <div className="min-h-screen bg-dark relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 transform -translate-x-1/2 left-1/2 w-[1000px] h-[500px] bg-accent/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 transform translate-x-1/2 right-1/2 w-[800px] h-[600px] bg-accent/5 blur-[120px] rounded-full" />
      </div>

      {/* Navbar */}
      <PricingNavbar isAuthenticated={isAuthenticated} onSignIn={onSignIn} />

      {/* Content */}
      <div className="relative pt-24 pb-16">
        <PricingContent
          isAuthenticated={isAuthenticated}
          authReady={authReady}
          onSignIn={onSignIn}
        />
      </div>

      {/* Footer */}
      <footer className="relative py-10 border-t border-dark-border">
        <Container>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <Logo
                size={24}
                className="group-hover:scale-110 transition-transform"
              />
            </Link>
            <div className="flex gap-6 text-sm text-content-muted">
              <Link
                href="/privacy"
                className="hover:text-accent transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="hover:text-accent transition-colors"
              >
                Terms of Service
              </Link>
            </div>
            <p className="text-content-muted text-sm">
              © {new Date().getFullYear()} Kal. All rights reserved.
            </p>
          </div>
        </Container>
      </footer>
    </div>
  );
}

function PricingNavbar({
  isAuthenticated,
  onSignIn,
}: {
  isAuthenticated: boolean;
  onSignIn?: () => Promise<void>;
}) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark/80 backdrop-blur-md border-b border-dark-border">
      <Container>
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <Logo
              size={24}
              className="group-hover:scale-110 transition-transform"
            />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/#features"
              className="text-content-secondary hover:text-content-primary transition-colors text-sm"
            >
              Features
            </Link>
            <Link
              href="/api-docs"
              className="text-content-secondary hover:text-content-primary transition-colors text-sm"
            >
              API
            </Link>
          </div>

          <div>
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-accent text-dark-bg hover:bg-accent/90 transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <button
                onClick={() => onSignIn?.()}
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-accent text-dark-bg hover:bg-accent/90 transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </Container>
    </nav>
  );
}

function PricingContent({
  isAuthenticated,
  authReady,
  onSignIn,
}: {
  isAuthenticated: boolean;
  authReady: boolean;
  onSignIn?: () => Promise<void>;
}) {
  const router = useRouter();

  // Only fetch subscription status if authenticated
  const { data: subscriptionStatus, isLoading } =
    trpc.subscription.getSubscriptionStatus.useQuery(undefined, {
      enabled: isAuthenticated && authReady,
    });

  const createCheckout = trpc.subscription.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });
  const createPortal = trpc.subscription.createPortalSession.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  const currentTier = isAuthenticated
    ? subscriptionStatus?.tier || "free"
    : null;

  const handleSubscribe = (tier: "tier_1" | "tier_2") => {
    if (!isAuthenticated) {
      onSignIn?.();
      return;
    }
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
    <div className="max-w-6xl mx-auto px-4">
      {/* Back to home */}
      {isAuthenticated && (
        <button
          onClick={() => router.push("/dashboard/settings")}
          className="flex items-center gap-2 text-content-secondary hover:text-content-primary transition-colors mb-8"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">Back to Settings</span>
        </button>
      )}

      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-content-primary mb-3">
          Simple, Transparent Pricing
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
            currentTier !== null &&
            ((tier.key === "tier_1" && currentTier === "free") ||
              (tier.key === "tier_2" &&
                (currentTier === "free" || currentTier === "tier_1")));
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
                        tier.highlighted ? "text-accent" : "text-content-muted"
                      }`}
                    />
                    <span className="text-content-secondary text-sm">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              {!isAuthenticated ? (
                // Visitor — not signed in
                <VisitorButton
                  tier={tier.key}
                  highlighted={tier.highlighted}
                  onSignIn={onSignIn}
                />
              ) : !authReady || isLoading ? (
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
                      {createPortal.isPending ? "Loading..." : "Manage Billing"}
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
  );
}

function VisitorButton({
  tier,
  highlighted,
  onSignIn,
}: {
  tier: UserTier;
  highlighted?: boolean;
  onSignIn?: () => Promise<void>;
}) {
  if (tier === "free") {
    return (
      <button
        onClick={() => onSignIn?.()}
        className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-dark-elevated text-content-primary hover:bg-dark-border border border-dark-border transition-colors"
      >
        Get Started Free
      </button>
    );
  }

  return (
    <button
      onClick={() => onSignIn?.()}
      className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
        highlighted
          ? "bg-accent text-dark-bg hover:bg-accent/90"
          : "bg-dark-elevated text-content-primary hover:bg-dark-border border border-dark-border"
      }`}
    >
      Sign In to Subscribe
    </button>
  );
}
