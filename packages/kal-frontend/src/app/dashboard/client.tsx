"use client";

import { RATE_LIMITS } from "kal-shared";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Calendar, Clock, Zap } from "react-feather";

import { UsageChart } from "@/components/dashboard/UsageChart";
import { AuthUpdater, useAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";

// ─── Countdown helpers ────────────────────────────────────────────────────────

function getMsUntilMidnightUTC(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCDate(midnight.getUTCDate() + 1);
  midnight.setUTCHours(0, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

function getMsUntilNextMonthUTC(): number {
  const now = new Date();
  const nextMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
  );
  return nextMonth.getTime() - now.getTime();
}

function getMsUntilNextMinute(): number {
  const now = new Date();
  return (60 - now.getSeconds()) * 1_000 - now.getMilliseconds();
}

function formatCountdown(ms: number, compact = false): string {
  const totalSec = Math.max(0, Math.floor(ms / 1_000));

  if (compact) {
    const s = totalSec % 60;
    return `${s}s`;
  }

  const d = Math.floor(totalSec / 86_400);
  const h = Math.floor((totalSec % 86_400) / 3_600);
  const m = Math.floor((totalSec % 3_600) / 60);
  const s = totalSec % 60;

  if (d > 0) {
    return `${d}d ${h}h ${String(m).padStart(2, "0")}m`;
  }
  return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

function useCountdown(getMsFn: () => number, interval = 1_000): number {
  const [ms, setMs] = useState(getMsFn);

  useEffect(() => {
    const id = setInterval(() => setMs(getMsFn()), interval);
    return () => clearInterval(id);
  }, [getMsFn, interval]);

  return ms;
}

// ─── Progress bar helpers ─────────────────────────────────────────────────────

function getBarColor(percentage: number): string {
  if (percentage >= 95) return "bg-red-500";
  if (percentage >= 80) return "bg-amber-500";
  return "bg-accent";
}

function getAccentGradient(percentage: number): string {
  if (percentage >= 95) return "from-red-500/[0.08]";
  if (percentage >= 80) return "from-amber-500/[0.06]";
  return "from-emerald-500/[0.06]";
}

function getIconColor(percentage: number): string {
  if (percentage >= 95) return "text-red-400";
  if (percentage >= 80) return "text-amber-400";
  return "text-emerald-400";
}

function getIconBg(percentage: number): string {
  if (percentage >= 95) return "bg-red-500/10";
  if (percentage >= 80) return "bg-amber-500/10";
  return "bg-emerald-500/[0.1]";
}

function getValueColor(percentage: number): string {
  if (percentage >= 95) return "text-red-400";
  if (percentage >= 80) return "text-amber-400";
  return "text-emerald-400";
}

// ─── Entry / wrapper ──────────────────────────────────────────────────────────

interface DashboardClientProps {
  logtoId?: string;
  email?: string | null;
  name?: string | null;
}

export default function DashboardClient({
  logtoId,
  email,
  name,
}: DashboardClientProps) {
  return (
    <>
      <AuthUpdater logtoId={logtoId} email={email} name={name} />
      <DashboardContentWrapper expectedLogtoId={logtoId} nameProp={name} />
    </>
  );
}

function DashboardContentWrapper({
  expectedLogtoId,
  nameProp,
}: {
  expectedLogtoId?: string;
  nameProp?: string | null;
}) {
  const { logtoId } = useAuth();

  if (expectedLogtoId && logtoId !== expectedLogtoId) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/[0.04] rounded w-48" />
          <div className="h-4 bg-white/[0.04] rounded w-32" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-white/[0.04] rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 mt-4">
            <div className="h-48 bg-white/[0.04] rounded-xl" />
            <div className="h-48 bg-white/[0.04] rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return <DashboardContent nameProp={nameProp} />;
}

// ─── Main content ─────────────────────────────────────────────────────────────

function DashboardContent({ nameProp }: { nameProp?: string | null }) {
  const { data: userInfo, isLoading: isLoadingUser } =
    trpc.apiKeys.getMe.useQuery();
  const { data: stats } = trpc.apiKeys.getUsageStats.useQuery();
  const { data: chartData, isLoading: isLoadingChart } =
    trpc.requestLogs.requestsByDay.useQuery({ days: 30 });

  const dailyResetMs = useCountdown(getMsUntilMidnightUTC);
  const monthlyResetMs = useCountdown(getMsUntilNextMonthUTC);
  const minuteResetMs = useCountdown(getMsUntilNextMinute, 1_000);

  const tier = stats?.tier || "free";
  const limits = RATE_LIMITS[tier];
  const dailyUsed = stats?.dailyUsed || 0;
  const dailyPercentage = Math.min(100, (dailyUsed / limits.dailyLimit) * 100);
  const monthlyUsed = stats?.monthlyUsed || 0;
  const monthlyPercentage = Math.min(
    100,
    (monthlyUsed / limits.monthlyLimit) * 100
  );
  const minuteUsed = stats?.minuteUsed || 0;
  const minutePercentage = Math.min(
    100,
    (minuteUsed / limits.minuteLimit) * 100
  );

  const displayName = userInfo?.name || nameProp || "Developer";

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full">
      {/* ── Welcome Header ── */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-content-primary mb-1">
          Welcome back, {isLoadingUser ? "..." : displayName}
        </h1>
        <p className="text-content-secondary text-sm md:text-base">
          Here&apos;s an overview of your API usage
        </p>
        <div className="mt-3 h-px bg-gradient-to-r from-accent/40 via-accent/10 to-transparent" />
      </div>

      {/* ── Usage Stats ── */}
      <section className="mb-6 md:mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <UsageStatCard
            icon={<Clock size={16} />}
            label="Today"
            used={dailyUsed}
            limit={limits.dailyLimit}
            percentage={dailyPercentage}
            resetMs={dailyResetMs}
          />
          <UsageStatCard
            icon={<Calendar size={16} />}
            label="This Month"
            used={monthlyUsed}
            limit={limits.monthlyLimit}
            percentage={monthlyPercentage}
            resetMs={monthlyResetMs}
          />
          <UsageStatCard
            icon={<Zap size={16} />}
            label="Per Minute"
            used={minuteUsed}
            limit={limits.minuteLimit}
            percentage={minutePercentage}
            resetMs={minuteResetMs}
            compactReset
          />
        </div>
      </section>

      {/* ── Tier + Chart row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 md:gap-5">
        {/* Tier card */}
        <div className="rounded-xl p-4 md:p-5 bg-gradient-to-br from-accent/[0.06] via-white/[0.02] to-transparent border border-accent/[0.12] transition-all duration-200 hover:border-accent/20">
          <div className="flex items-center justify-between mb-4">
            <span className="text-content-secondary text-xs md:text-sm font-medium">
              Current Plan
            </span>
            <span
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wide tier-badge tier-${tier}`}
            >
              {tier === "free"
                ? "Free"
                : tier === "tier_1"
                  ? "Tier 1"
                  : "Tier 2"}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-content-muted text-xs flex items-center gap-1.5">
                <Zap size={11} className="text-accent/50" />
                Per minute
              </span>
              <span className="text-content-primary text-xs font-medium">
                {limits.minuteLimit}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-content-muted text-xs flex items-center gap-1.5">
                <Clock size={11} className="text-accent/50" />
                Per day
              </span>
              <span className="text-content-primary text-xs font-medium">
                {limits.dailyLimit.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-content-muted text-xs flex items-center gap-1.5">
                <Calendar size={11} className="text-accent/50" />
                Per month
              </span>
              <span className="text-content-primary text-xs font-medium">
                {limits.monthlyLimit.toLocaleString()}
              </span>
            </div>
          </div>

          {tier === "free" && (
            <Link
              href="/pricing"
              className="mt-4 flex items-center justify-center gap-1.5 w-full py-2 rounded-lg
                bg-accent/[0.1] border border-accent/20 text-accent text-xs font-medium
                hover:bg-accent/[0.15] transition-colors"
            >
              <Zap size={12} />
              Upgrade Plan
            </Link>
          )}
        </div>

        {/* Chart */}
        <UsageChart
          data={chartData ?? []}
          days={30}
          isLoading={isLoadingChart}
        />
      </div>
    </div>
  );
}

// ─── Usage Stat Card ──────────────────────────────────────────────────────────

function UsageStatCard({
  icon,
  label,
  used,
  limit,
  percentage,
  resetMs,
  compactReset = false,
}: {
  icon: React.ReactNode;
  label: string;
  used: number;
  limit: number;
  percentage: number;
  resetMs: number;
  compactReset?: boolean;
}) {
  return (
    <div
      className={`bg-gradient-to-br ${getAccentGradient(percentage)} to-transparent
        border border-white/[0.06] rounded-xl p-4 md:p-5
        hover:border-white/[0.1] transition-all duration-200`}
    >
      {/* Icon + label */}
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className={`w-8 h-8 rounded-lg ${getIconBg(percentage)} flex items-center justify-center ${getIconColor(percentage)}`}
        >
          {icon}
        </div>
        <span className="text-content-secondary text-xs md:text-sm font-medium">
          {label}
        </span>
      </div>

      {/* Value */}
      <div className="mb-3">
        <span
          className={`text-2xl md:text-3xl font-bold ${getValueColor(percentage)}`}
        >
          {used.toLocaleString()}
        </span>
        <span className="text-content-muted text-sm font-normal ml-1">
          / {limit.toLocaleString()}
        </span>
      </div>

      {/* Thin progress bar */}
      <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden mb-2.5">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getBarColor(percentage)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Footer: resets in */}
      <p className="text-content-muted text-[11px] flex items-center gap-1">
        <Clock size={9} className="text-accent/40 shrink-0" />
        Resets in{" "}
        <span className="font-mono">
          {formatCountdown(resetMs, compactReset)}
        </span>
      </p>
    </div>
  );
}
