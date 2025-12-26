"use client";

import { RATE_LIMITS } from "kal-shared";
import Link from "next/link";
import { Book, Code, Key, Search, Settings } from "react-feather";

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
      <div className="p-8">
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
  const { data: userInfo, isLoading: isLoadingUser } = trpc.apiKeys.getMe.useQuery();
  const { data: stats } = trpc.apiKeys.getUsageStats.useQuery();

  const tier = stats?.tier || "free";
  const limits = RATE_LIMITS[tier];
  const dailyUsed = stats?.dailyUsed || 0;
  const dailyRemaining = Math.max(0, limits.dailyLimit - dailyUsed);
  const dailyPercentage = Math.min(100, (dailyUsed / limits.dailyLimit) * 100);

  const displayName = userInfo?.name || nameProp || "Developer";

  return (
    <div className="p-8 max-w-5xl">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-content-primary mb-2">
          Welcome back, {isLoadingUser ? "..." : displayName}
        </h1>
        <p className="text-content-secondary">Here&apos;s an overview of your API usage</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-content-secondary text-sm">Current Tier</span>
            <span className={`px-2 py-1 rounded text-xs font-medium tier-badge tier-${tier}`}>
              {tier === "free" ? "Free" : tier === "tier_1" ? "Tier 1" : "Tier 2"}
            </span>
          </div>
          <p className="text-content-muted text-sm">{limits.dailyLimit} requests/day</p>
        </div>

        <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-content-secondary text-sm">Today&apos;s Usage</span>
            <span className="text-accent font-semibold">{dailyUsed} / {limits.dailyLimit}</span>
          </div>
          <div className="h-2 bg-dark-elevated rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-accent rounded-full transition-all duration-300" 
              style={{ width: `${dailyPercentage}%` }}
            />
          </div>
          <p className="text-content-muted text-sm">{dailyRemaining} remaining</p>
        </div>

        <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-content-secondary text-sm">Active API Keys</span>
            <span className="text-accent font-semibold text-2xl">{stats?.activeKeyCount || 0}</span>
          </div>
          <Link href="/dashboard/api-keys" className="text-accent text-sm hover:underline">
            Manage keys →
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-content-primary mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Link 
            href="/dashboard/api-keys"
            className="flex items-center gap-4 p-4 bg-dark-surface border border-dark-border rounded-xl hover:border-accent/30 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <Key size={20} />
            </div>
            <div>
              <p className="font-medium text-content-primary">API Keys</p>
              <p className="text-sm text-content-muted">Generate and manage your API keys</p>
            </div>
          </Link>

          <Link 
            href="/dashboard/setup"
            className="flex items-center gap-4 p-4 bg-dark-surface border border-dark-border rounded-xl hover:border-accent/30 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <Code size={20} />
            </div>
            <div>
              <p className="font-medium text-content-primary">Setup Guide</p>
              <p className="text-sm text-content-muted">Get started with Python</p>
            </div>
          </Link>

          <Link 
            href="/api-docs"
            className="flex items-center gap-4 p-4 bg-dark-surface border border-dark-border rounded-xl hover:border-accent/30 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <Book size={20} />
            </div>
            <div>
              <p className="font-medium text-content-primary">API Documentation</p>
              <p className="text-sm text-content-muted">Explore all available endpoints</p>
            </div>
          </Link>

          <Link 
            href="/search"
            className="flex items-center gap-4 p-4 bg-dark-surface border border-dark-border rounded-xl hover:border-accent/30 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <Search size={20} />
            </div>
            <div>
              <p className="font-medium text-content-primary">Food Search</p>
              <p className="text-sm text-content-muted">Try the API in action</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Account Section */}
      <section>
        <h2 className="text-lg font-semibold text-content-primary mb-4">Account</h2>
        <Link 
          href="/dashboard/settings"
          className="flex items-center gap-4 p-4 bg-dark-surface border border-dark-border rounded-xl hover:border-accent/30 transition-all max-w-md"
        >
          <div className="w-10 h-10 rounded-lg bg-dark-elevated flex items-center justify-center text-content-secondary">
            <Settings size={20} />
          </div>
          <div>
            <p className="font-medium text-content-primary">Account Settings</p>
            <p className="text-sm text-content-muted">{userInfo?.email || "Manage your account"}</p>
          </div>
        </Link>
      </section>
    </div>
  );
}
