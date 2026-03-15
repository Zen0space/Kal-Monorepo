"use client";

import { useState } from "react";

import { trpc } from "@/lib/trpc";

type Tier = "free" | "tier_1" | "tier_2";

interface RateLimitConfig {
  minuteLimit: number;
  dailyLimit: number;
  monthlyLimit: number;
  burstBonus: number;
  burstWindowSeconds: number;
  maxBurstTotal: number;
}

const defaultLimits: Record<Tier, RateLimitConfig> = {
  free: {
    minuteLimit: 65,
    dailyLimit: 3300,
    monthlyLimit: 95000,
    burstBonus: 15,
    burstWindowSeconds: 10,
    maxBurstTotal: 80,
  },
  tier_1: {
    minuteLimit: 130,
    dailyLimit: 6600,
    monthlyLimit: 195000,
    burstBonus: 30,
    burstWindowSeconds: 10,
    maxBurstTotal: 160,
  },
  tier_2: {
    minuteLimit: 145,
    dailyLimit: 7500,
    monthlyLimit: 215000,
    burstBonus: 45,
    burstWindowSeconds: 10,
    maxBurstTotal: 190,
  },
};

const tierLabels: Record<Tier, string> = {
  free: "Free",
  tier_1: "Tier 1",
  tier_2: "Tier 2",
};

function RateLimitInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-text-muted">{label}</label>
      <input
        type="number"
        min="1"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 1)}
        disabled={disabled}
        className="w-full bg-admin-elevated border border-admin-border rounded-lg px-3 py-2 text-sm text-text-primary
          focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}

function TierCard({
  tier,
  config,
  onUpdate,
  onReset,
  isSaving,
  isResetting,
}: {
  tier: Tier;
  config: RateLimitConfig;
  onUpdate: (config: RateLimitConfig) => void;
  onReset: () => void;
  isSaving: boolean;
  isResetting: boolean;
}) {
  const [localConfig, setLocalConfig] = useState(config);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: keyof RateLimitConfig, value: number) => {
    setLocalConfig((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdate(localConfig);
    setHasChanges(false);
  };

  const isDefault =
    JSON.stringify(localConfig) === JSON.stringify(defaultLimits[tier]);

  return (
    <div className="bg-admin-surface border border-admin-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">
          {tierLabels[tier]}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={onReset}
            disabled={isResetting || isDefault}
            className="px-3 py-1.5 text-xs font-medium border border-admin-border rounded-lg text-text-secondary hover:text-status-danger hover:border-status-danger/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isResetting ? "Resetting..." : "Reset to Default"}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="px-3 py-1.5 text-xs font-medium bg-primary/10 border border-primary/20 rounded-lg text-primary-light hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <RateLimitInput
          label="Minute Limit"
          value={localConfig.minuteLimit}
          onChange={(v) => handleChange("minuteLimit", v)}
          disabled={isSaving}
        />
        <RateLimitInput
          label="Daily Limit"
          value={localConfig.dailyLimit}
          onChange={(v) => handleChange("dailyLimit", v)}
          disabled={isSaving}
        />
        <RateLimitInput
          label="Monthly Limit"
          value={localConfig.monthlyLimit}
          onChange={(v) => handleChange("monthlyLimit", v)}
          disabled={isSaving}
        />
        <RateLimitInput
          label="Burst Bonus"
          value={localConfig.burstBonus}
          onChange={(v) => handleChange("burstBonus", v)}
          disabled={isSaving}
        />
        <RateLimitInput
          label="Burst Window (sec)"
          value={localConfig.burstWindowSeconds}
          onChange={(v) => handleChange("burstWindowSeconds", v)}
          disabled={isSaving}
        />
        <RateLimitInput
          label="Max Burst Total"
          value={localConfig.maxBurstTotal}
          onChange={(v) => handleChange("maxBurstTotal", v)}
          disabled={isSaving}
        />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const {
    data: rateLimits,
    isLoading,
    refetch,
  } = trpc.platformSettings.getRateLimits.useQuery();

  const updateMutation = trpc.platformSettings.updateRateLimits.useMutation({
    onSuccess: () => refetch(),
  });

  const resetMutation = trpc.platformSettings.resetToDefaults.useMutation({
    onSuccess: () => refetch(),
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto animate-fade-in">
        <div className="mb-6">
          <div className="h-7 w-48 bg-admin-elevated rounded-lg animate-pulse mb-2" />
          <div className="h-5 w-64 bg-admin-elevated rounded-lg animate-pulse" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-48 bg-admin-elevated rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const tiers: Tier[] = ["free", "tier_1", "tier_2"];

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Rate Limits</h1>
        <p className="text-sm text-text-muted mt-1">
          Configure API rate limits per tier. Changes take effect immediately.
        </p>
      </div>

      {/* Tier Cards */}
      <div className="space-y-4">
        {tiers.map((tier) => (
          <TierCard
            key={tier}
            tier={tier}
            config={rateLimits?.[tier] || defaultLimits[tier]}
            onUpdate={(config) => updateMutation.mutate({ tier, config })}
            onReset={() => resetMutation.mutate({ tier })}
            isSaving={updateMutation.isPending}
            isResetting={resetMutation.isPending}
          />
        ))}
      </div>

      {/* Error/Success Messages */}
      {updateMutation.error && (
        <div className="mt-4 p-3 bg-status-danger/10 border border-status-danger/20 rounded-lg text-sm text-status-danger">
          Failed to update: {updateMutation.error.message}
        </div>
      )}
      {resetMutation.error && (
        <div className="mt-4 p-3 bg-status-danger/10 border border-status-danger/20 rounded-lg text-sm text-status-danger">
          Failed to reset: {resetMutation.error.message}
        </div>
      )}
      {(updateMutation.isSuccess || resetMutation.isSuccess) && (
        <div className="mt-4 p-3 bg-status-success/10 border border-status-success/20 rounded-lg text-sm text-status-success">
          Changes saved successfully!
        </div>
      )}
    </div>
  );
}
