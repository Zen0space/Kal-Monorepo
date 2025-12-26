"use client";

import { RATE_LIMITS } from "kal-shared";
import { Mail, Shield, User } from "react-feather";

import { AuthUpdater, useAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";

interface SettingsClientProps {
  logtoId?: string;
  email?: string | null;
  name?: string | null;
}

export default function SettingsClient({ logtoId, email, name }: SettingsClientProps) {
  return (
    <>
      <AuthUpdater logtoId={logtoId} email={email} name={name} />
      <SettingsContentWrapper expectedLogtoId={logtoId} nameProp={name} emailProp={email} />
    </>
  );
}

function SettingsContentWrapper({ 
  expectedLogtoId, 
  nameProp,
  emailProp 
}: { 
  expectedLogtoId?: string; 
  nameProp?: string | null;
  emailProp?: string | null;
}) {
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

  return <SettingsContent nameProp={nameProp} emailProp={emailProp} />;
}

function SettingsContent({ nameProp, emailProp }: { nameProp?: string | null; emailProp?: string | null }) {
  const { data: userInfo, isLoading } = trpc.apiKeys.getMe.useQuery();
  const { data: stats } = trpc.apiKeys.getUsageStats.useQuery();

  const displayName = userInfo?.name || nameProp || "Developer";
  const displayEmail = userInfo?.email || emailProp || "";
  const tier = stats?.tier || "free";
  const limits = RATE_LIMITS[tier];

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-content-primary mb-2">Account Settings</h1>
        <p className="text-content-secondary">Manage your account information</p>
      </div>

      {/* Profile Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-content-primary mb-4 flex items-center gap-2">
          <User size={20} /> Profile Information
        </h2>
        <div className="bg-dark-surface border border-dark-border rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-content-muted mb-1">Name</label>
            <p className="text-content-primary text-lg">
              {isLoading ? (
                <span className="animate-pulse bg-dark-elevated h-6 w-32 inline-block rounded" />
              ) : (
                displayName
              )}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-content-muted mb-1 flex items-center gap-1">
              <Mail size={14} /> Email
            </label>
            <p className="text-content-primary">{displayEmail}</p>
          </div>
        </div>
      </section>

      {/* Subscription Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-content-primary mb-4 flex items-center gap-2">
          <Shield size={20} /> Subscription
        </h2>
        <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-content-muted text-sm">Current Plan</p>
              <p className="text-content-primary text-xl font-semibold">
                {tier === "free" ? "Free" : tier === "tier_1" ? "Tier 1" : "Tier 2"}
              </p>
            </div>
            <span className={`px-4 py-2 rounded-lg text-sm font-medium tier-badge tier-${tier}`}>
              {tier.toUpperCase().replace("_", " ")}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dark-border">
            <div>
              <p className="text-content-muted text-sm">Daily Limit</p>
              <p className="text-content-primary font-medium">{limits.dailyLimit.toLocaleString()} requests</p>
            </div>
            <div>
              <p className="text-content-muted text-sm">Rate Limit</p>
              <p className="text-content-primary font-medium">{limits.burstLimit} req/min</p>
            </div>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section>
        <h2 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h2>
        <div className="bg-dark-surface border border-red-500/30 rounded-xl p-6">
          <p className="text-content-secondary mb-4">
            Account deletion is not available through this interface. Please contact support if you need to delete your account.
          </p>
          <button 
            className="px-4 py-2 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors cursor-not-allowed opacity-50"
            disabled
          >
            Delete Account
          </button>
        </div>
      </section>
    </div>
  );
}
