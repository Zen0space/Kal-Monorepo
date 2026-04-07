"use client";

import { RATE_LIMITS } from "kal-shared";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import {
  AlertTriangle,
  Clock,
  CreditCard,
  ExternalLink,
  LogOut,
  Mail,
  Monitor,
  Shield,
  User,
  Zap,
} from "react-feather";

import { AuthUpdater, useAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";

interface SettingsClientProps {
  logtoId?: string;
  email?: string | null;
  name?: string | null;
  onSignOut?: () => Promise<void>;
}

export default function SettingsClient({
  logtoId,
  email,
  name,
  onSignOut,
}: SettingsClientProps) {
  return (
    <>
      <AuthUpdater logtoId={logtoId} email={email} name={name} />
      <SettingsContentWrapper
        expectedLogtoId={logtoId}
        nameProp={name}
        emailProp={email}
        onSignOut={onSignOut}
      />
    </>
  );
}

/* ================================================================
   Loading skeleton — matches bento grid layout
   ================================================================ */
function SettingsContentWrapper({
  expectedLogtoId,
  nameProp,
  emailProp,
  onSignOut,
}: {
  expectedLogtoId?: string;
  nameProp?: string | null;
  emailProp?: string | null;
  onSignOut?: () => Promise<void>;
}) {
  const { logtoId } = useAuth();

  if (expectedLogtoId && logtoId !== expectedLogtoId) {
    return (
      <div className="p-4 md:p-6 lg:p-8 w-full">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-8 w-52 rounded-xl bg-white/[0.04] animate-pulse" />
          <div className="h-4 w-72 rounded-lg bg-white/[0.03] animate-pulse mt-2" />
          <div className="mt-3 h-px bg-gradient-to-r from-accent/40 via-accent/10 to-transparent" />
        </div>
        {/* Bento skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 h-48 animate-pulse" />
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 h-48 animate-pulse" />
          <div className="md:col-span-2 grid grid-cols-3 gap-4">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 h-24 animate-pulse" />
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 h-24 animate-pulse" />
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 h-24 animate-pulse" />
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 h-32 animate-pulse" />
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 h-32 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <SettingsContent
      nameProp={nameProp}
      emailProp={emailProp}
      onSignOut={onSignOut}
    />
  );
}

/* ================================================================
   Tier config — colors, gradients, glows per plan
   ================================================================ */
const TIER_CONFIG = {
  free: {
    label: "Free",
    color: "text-gray-400",
    bg: "bg-gray-400/10",
    border: "border-gray-400/20",
    glow: "",
    gradient: "from-gray-500/10 to-transparent",
  },
  tier_1: {
    label: "Tier 1",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
    glow: "shadow-[0_0_24px_rgba(59,130,246,0.06)]",
    gradient: "from-blue-500/10 to-transparent",
  },
  tier_2: {
    label: "Tier 2",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    border: "border-purple-400/20",
    glow: "shadow-[0_0_24px_rgba(168,85,247,0.06)]",
    gradient: "from-purple-500/10 to-transparent",
  },
} as const;

/* ================================================================
   Main settings content — bento grid
   ================================================================ */
function SettingsContent({
  nameProp,
  emailProp,
  onSignOut,
}: {
  nameProp?: string | null;
  emailProp?: string | null;
  onSignOut?: () => Promise<void>;
}) {
  const { data: userInfo, isLoading } = trpc.apiKeys.getMe.useQuery();
  const { data: stats } = trpc.apiKeys.getUsageStats.useQuery();
  const { data: subscriptionStatus } =
    trpc.subscription.getSubscriptionStatus.useQuery();
  const createPortal = trpc.subscription.createPortalSession.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  const searchParams = useSearchParams();
  const subscriptionResult = searchParams.get("subscription");

  useEffect(() => {
    if (subscriptionResult) {
      const timer = setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete("subscription");
        window.history.replaceState({}, "", url.toString());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [subscriptionResult]);

  const displayName = userInfo?.name || nameProp || "Developer";
  const displayEmail = userInfo?.email || emailProp || "";
  const tier = (stats?.tier || "free") as keyof typeof TIER_CONFIG;
  const limits = RATE_LIMITS[tier];
  const hasStripeCustomer = !!subscriptionStatus?.stripeCustomerId;
  const tierCfg = TIER_CONFIG[tier] || TIER_CONFIG.free;

  const initials = useMemo(() => {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return displayName.slice(0, 2).toUpperCase();
  }, [displayName]);

  const handleManageBilling = () => {
    createPortal.mutate();
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full">
      {/* ─── Page Header ─── */}
      <div className="mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-content-primary mb-1">
          Account Settings
        </h1>
        <p className="text-content-secondary text-sm">
          Manage your profile, subscription, and account preferences
        </p>
        <div className="mt-3 h-px bg-gradient-to-r from-accent/40 via-accent/10 to-transparent" />
      </div>

      {/* ─── Subscription Banners (full-width, above grid) ─── */}
      {subscriptionResult === "success" && (
        <div className="mb-6 relative overflow-hidden bg-green-500/[0.06] border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-400 rounded-l-xl" />
          <div className="w-9 h-9 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0 ml-2">
            <CreditCard size={16} className="text-green-400" />
          </div>
          <div>
            <p className="text-green-400 font-medium text-sm">
              Subscription activated!
            </p>
            <p className="text-green-400/60 text-xs mt-0.5">
              Your plan has been upgraded. It may take a moment to reflect.
            </p>
          </div>
        </div>
      )}
      {subscriptionResult === "cancelled" && (
        <div className="mb-6 relative overflow-hidden bg-yellow-500/[0.06] border border-yellow-500/20 rounded-xl p-4 flex items-center gap-3">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400 rounded-l-xl" />
          <div className="w-9 h-9 rounded-full bg-yellow-500/15 flex items-center justify-center flex-shrink-0 ml-2">
            <CreditCard size={16} className="text-yellow-400" />
          </div>
          <div>
            <p className="text-yellow-400 font-medium text-sm">
              Checkout cancelled
            </p>
            <p className="text-yellow-400/60 text-xs mt-0.5">
              No charges were made. You can try again anytime.
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          BENTO GRID
          Row 1: Profile  |  Plan & Billing
          Row 2: Daily    |  Monthly   |  Per Minute   (col-span-2)
          Row 3: Session  |  Danger Zone
          ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ─── ROW 1, LEFT: Profile Card ─── */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 md:p-6 hover:border-white/[0.1] transition-all duration-200 flex flex-col">
          {/* Card header */}
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-accent/[0.08] flex items-center justify-center">
              <User size={14} className="text-accent/70" />
            </div>
            <h2 className="text-xs font-semibold text-content-muted uppercase tracking-wider">
              Profile
            </h2>
          </div>

          {/* Avatar + identity */}
          <div className="flex items-center gap-4 flex-1">
            {/* Avatar with gradient ring */}
            <div className="relative flex-shrink-0">
              <div className="absolute -inset-[2px] rounded-full bg-gradient-to-br from-accent/60 via-accent/20 to-transparent" />
              <div className="relative w-16 h-16 rounded-full bg-[#141414] flex items-center justify-center">
                {isLoading ? (
                  <div className="w-full h-full rounded-full bg-white/[0.04] animate-pulse" />
                ) : (
                  <span className="text-lg font-bold text-accent/80 select-none">
                    {initials}
                  </span>
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-[#141414]" />
            </div>

            <div className="flex-1 min-w-0">
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-5 w-32 rounded-lg bg-white/[0.04] animate-pulse" />
                  <div className="h-4 w-44 rounded-lg bg-white/[0.03] animate-pulse" />
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-content-primary truncate">
                    {displayName}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Mail
                      size={12}
                      className="text-content-muted flex-shrink-0"
                    />
                    <p className="text-sm text-content-secondary truncate">
                      {displayEmail}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tier badge pinned at the bottom */}
          <div className="mt-5 pt-4 border-t border-white/[0.06]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-content-muted">Current Plan</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${tierCfg.bg} ${tierCfg.color} ${tierCfg.border} border`}
              >
                {tierCfg.label}
              </span>
            </div>
          </div>
        </div>

        {/* ─── ROW 1, RIGHT: Plan & Billing Card ─── */}
        <div
          className={`bg-gradient-to-br ${tierCfg.gradient} border ${tier !== "free" ? tierCfg.border : "border-white/[0.06]"} rounded-xl p-5 md:p-6 hover:border-white/[0.1] transition-all duration-200 flex flex-col ${tierCfg.glow}`}
        >
          {/* Card header */}
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-accent/[0.08] flex items-center justify-center">
              <Shield size={14} className="text-accent/70" />
            </div>
            <h2 className="text-xs font-semibold text-content-muted uppercase tracking-wider">
              Plan & Billing
            </h2>
          </div>

          {/* Plan name */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className={`text-2xl font-bold ${tierCfg.color}`}>
                {tierCfg.label}
              </h3>
              {tier !== "free" && (
                <div
                  className={`w-2 h-2 rounded-full ${tierCfg.bg} animate-pulse`}
                  style={{
                    boxShadow:
                      tier === "tier_1"
                        ? "0 0 8px rgba(59,130,246,0.4)"
                        : "0 0 8px rgba(168,85,247,0.4)",
                  }}
                />
              )}
            </div>
            <p className="text-content-muted text-xs">
              {tier === "free"
                ? "Upgrade to unlock higher rate limits and priority support"
                : "You have access to elevated rate limits and priority support"}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-white/[0.06]">
            {tier === "free" ? (
              <Link
                href="/pricing"
                className="group inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-dark font-semibold rounded-xl text-sm
                  hover:shadow-[0_0_24px_rgba(16,185,129,0.25)] transition-all duration-200"
              >
                <Zap size={14} className="group-hover:animate-pulse" />
                Upgrade Plan
              </Link>
            ) : (
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] text-content-primary rounded-xl text-sm font-medium
                  border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.06] transition-all duration-200"
              >
                <Zap size={14} />
                Change Plan
              </Link>
            )}
            {hasStripeCustomer && (
              <button
                onClick={handleManageBilling}
                disabled={createPortal.isPending}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] text-content-primary rounded-xl text-sm font-medium
                  border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.06] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ExternalLink size={14} />
                {createPortal.isPending ? "Loading..." : "Manage Billing"}
              </button>
            )}
          </div>
          {createPortal.error && (
            <p className="text-red-400 text-xs mt-2">
              {createPortal.error.message}
            </p>
          )}
        </div>

        {/* ─── ROW 2: Rate Limit Stats (spans full width) ─── */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Daily */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 md:p-5 hover:border-white/[0.1] transition-all duration-200 group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/[0.06] flex items-center justify-center group-hover:bg-accent/[0.1] transition-colors duration-200">
                <Zap size={18} className="text-accent/70" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-content-muted mb-0.5">Daily Limit</p>
                <p className="text-xl font-bold text-content-primary tabular-nums">
                  {limits.dailyLimit.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Monthly */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 md:p-5 hover:border-white/[0.1] transition-all duration-200 group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/[0.06] flex items-center justify-center group-hover:bg-accent/[0.1] transition-colors duration-200">
                <CreditCard size={18} className="text-accent/70" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-content-muted mb-0.5">
                  Monthly Limit
                </p>
                <p className="text-xl font-bold text-content-primary tabular-nums">
                  {limits.monthlyLimit.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Per Minute */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 md:p-5 hover:border-white/[0.1] transition-all duration-200 group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/[0.06] flex items-center justify-center group-hover:bg-accent/[0.1] transition-colors duration-200">
                <Clock size={18} className="text-accent/70" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-content-muted mb-0.5">Per Minute</p>
                <p className="text-xl font-bold text-content-primary tabular-nums">
                  {limits.minuteLimit}
                  <span className="text-sm text-content-muted font-normal ml-0.5">
                    /min
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── ROW 3, LEFT: Session Card ─── */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 md:p-6 hover:border-white/[0.1] transition-all duration-200 flex flex-col">
          {/* Card header */}
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-accent/[0.08] flex items-center justify-center">
              <Monitor size={14} className="text-accent/70" />
            </div>
            <h2 className="text-xs font-semibold text-content-muted uppercase tracking-wider">
              Session
            </h2>
          </div>

          {/* Device info */}
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center flex-shrink-0">
              <Monitor size={18} className="text-content-secondary" />
            </div>
            <div>
              <p className="text-content-primary text-sm font-medium">
                Current Device
              </p>
              <p className="text-content-muted text-xs mt-0.5">
                You are currently signed in on this device
              </p>
            </div>
          </div>

          {/* Sign out */}
          {onSignOut && (
            <div className="mt-5 pt-4 border-t border-white/[0.06]">
              <button
                onClick={onSignOut}
                className="group inline-flex items-center gap-2 px-4 py-2.5 border border-red-500/20 text-red-400 rounded-xl
                  hover:bg-red-500/[0.08] hover:border-red-500/30 transition-all duration-200 text-sm font-medium"
              >
                <LogOut
                  size={14}
                  className="group-hover:-translate-x-0.5 transition-transform duration-200"
                />
                Sign Out
              </button>
            </div>
          )}
        </div>

        {/* ─── ROW 3, RIGHT: Danger Zone Card ─── */}
        <div className="relative overflow-hidden bg-red-500/[0.02] border border-red-500/15 rounded-xl p-5 md:p-6 flex flex-col">
          {/* Subtle red glow */}
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-red-500/[0.04] rounded-full blur-2xl pointer-events-none" />

          {/* Card header */}
          <div className="relative flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-red-500/[0.08] flex items-center justify-center">
              <AlertTriangle size={14} className="text-red-400/70" />
            </div>
            <h2 className="text-xs font-semibold text-red-400/80 uppercase tracking-wider">
              Danger Zone
            </h2>
          </div>

          {/* Content */}
          <div className="relative flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-red-500/[0.06] border border-red-500/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={18} className="text-red-400/60" />
            </div>
            <div>
              <p className="text-content-primary text-sm font-medium">
                Delete Account
              </p>
              <p className="text-content-muted text-xs mt-0.5">
                Contact support to permanently delete your account
              </p>
            </div>
          </div>

          {/* Action */}
          <div className="relative mt-5 pt-4 border-t border-red-500/10">
            <button
              className="px-4 py-2.5 border border-red-500/20 text-red-400/50 rounded-xl
                cursor-not-allowed text-sm font-medium"
              disabled
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
