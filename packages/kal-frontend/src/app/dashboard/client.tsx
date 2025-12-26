"use client";

import { RATE_LIMITS } from "kal-shared";
import Link from "next/link";
import { Book, Code, Key, Search, Settings } from "react-feather";

import { useBreakpoint } from "@/hooks/useBreakpoint";
import { AuthUpdater, useAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";

interface DashboardClientProps {
  logtoId?: string;
  email?: string | null;
  name?: string | null;
}

export default function DashboardClient({ logtoId, email, name }: DashboardClientProps) {
  return (
    <>
      <AuthUpdater logtoId={logtoId} email={email} name={name} />
      <DashboardContentWrapper expectedLogtoId={logtoId} nameProp={name} />
    </>
  );
}

function DashboardContentWrapper({ expectedLogtoId, nameProp }: { expectedLogtoId?: string; nameProp?: string | null }) {
  const { logtoId } = useAuth();
  
  if (expectedLogtoId && logtoId !== expectedLogtoId) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-dark-elevated rounded w-48 mb-4" />
          <div className="h-4 bg-dark-elevated rounded w-32" />
        </div>
      </div>
    );
  }

  return <DashboardContent nameProp={nameProp} />;
}

function DashboardContent({ nameProp }: { nameProp?: string | null }) {
  const { isMobile } = useBreakpoint();
  const { data: userInfo, isLoading: isLoadingUser } = trpc.apiKeys.getMe.useQuery();
  const { data: stats } = trpc.apiKeys.getUsageStats.useQuery();

  const tier = stats?.tier || "free";
  const limits = RATE_LIMITS[tier];
  const dailyUsed = stats?.dailyUsed || 0;
  const dailyRemaining = Math.max(0, limits.dailyLimit - dailyUsed);
  const dailyPercentage = Math.min(100, (dailyUsed / limits.dailyLimit) * 100);

  const displayName = userInfo?.name || nameProp || "Developer";

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl">
      {/* Welcome Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-content-primary mb-1 md:mb-2">
          Welcome back, {isLoadingUser ? "..." : displayName}
        </h1>
        <p className="text-content-secondary text-sm md:text-base">Here&apos;s an overview of your API usage</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="bg-dark-surface border border-dark-border rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-content-secondary text-xs md:text-sm">Current Tier</span>
            <span className={`px-2 py-1 rounded text-xs font-medium tier-badge tier-${tier}`}>
              {tier === "free" ? "Free" : tier === "tier_1" ? "Tier 1" : "Tier 2"}
            </span>
          </div>
          <p className="text-content-muted text-xs md:text-sm">{limits.dailyLimit} requests/day</p>
        </div>

        <div className="bg-dark-surface border border-dark-border rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-content-secondary text-xs md:text-sm">Today&apos;s Usage</span>
            <span className="text-accent font-semibold text-sm md:text-base">{dailyUsed} / {limits.dailyLimit}</span>
          </div>
          <div className="h-2 bg-dark-elevated rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-accent rounded-full transition-all duration-300" 
              style={{ width: `${dailyPercentage}%` }}
            />
          </div>
          <p className="text-content-muted text-xs md:text-sm">{dailyRemaining} remaining</p>
        </div>

        <div className="bg-dark-surface border border-dark-border rounded-xl p-4 md:p-6 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-content-secondary text-xs md:text-sm">Active API Keys</span>
            <span className="text-accent font-semibold text-xl md:text-2xl">{stats?.activeKeyCount || 0}</span>
          </div>
          <Link href="/dashboard/api-keys" className="text-accent text-xs md:text-sm hover:underline">
            Manage keys →
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <section className="mb-6 md:mb-8">
        <h2 className="text-base md:text-lg font-semibold text-content-primary mb-3 md:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <Link 
            href="/dashboard/api-keys"
            className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-dark-surface border border-dark-border rounded-xl hover:border-accent/30 transition-all"
          >
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
              <Key size={isMobile ? 16 : 20} />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-content-primary text-sm md:text-base">API Keys</p>
              <p className="text-xs md:text-sm text-content-muted truncate">Generate and manage your API keys</p>
            </div>
          </Link>

          <Link 
            href="/dashboard/setup"
            className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-dark-surface border border-dark-border rounded-xl hover:border-accent/30 transition-all"
          >
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
              <Code size={isMobile ? 16 : 20} />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-content-primary text-sm md:text-base">Setup Guide</p>
              <p className="text-xs md:text-sm text-content-muted truncate">Get started with Python</p>
            </div>
          </Link>

          <Link 
            href="/api-docs"
            className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-dark-surface border border-dark-border rounded-xl hover:border-accent/30 transition-all"
          >
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
              <Book size={isMobile ? 16 : 20} />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-content-primary text-sm md:text-base">API Documentation</p>
              <p className="text-xs md:text-sm text-content-muted truncate">Explore all available endpoints</p>
            </div>
          </Link>

          <Link 
            href="/search"
            className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-dark-surface border border-dark-border rounded-xl hover:border-accent/30 transition-all"
          >
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
              <Search size={isMobile ? 16 : 20} />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-content-primary text-sm md:text-base">Food Search</p>
              <p className="text-xs md:text-sm text-content-muted truncate">Try the API in action</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Account Section */}
      <section>
        <h2 className="text-base md:text-lg font-semibold text-content-primary mb-3 md:mb-4">Account</h2>
        <Link 
          href="/dashboard/settings"
          className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-dark-surface border border-dark-border rounded-xl hover:border-accent/30 transition-all max-w-md"
        >
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-dark-elevated flex items-center justify-center text-content-secondary flex-shrink-0">
            <Settings size={isMobile ? 16 : 20} />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-content-primary text-sm md:text-base">Account Settings</p>
            <p className="text-xs md:text-sm text-content-muted truncate">{userInfo?.email || "Manage your account"}</p>
          </div>
        </Link>
      </section>
    </div>
  );
}
