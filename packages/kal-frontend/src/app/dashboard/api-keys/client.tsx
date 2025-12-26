"use client";

import type { ApiKeyExpiration } from "kal-shared";
import { RATE_LIMITS } from "kal-shared";
import { useState } from "react";
import { AlertTriangle, Check, CheckCircle, Plus } from "react-feather";

import { AuthUpdater, useAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";

interface SerializedApiKey {
  _id: string;
  keyPrefix: string;
  name: string;
  expiration: ApiKeyExpiration;
  expiresAt: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  isRevoked: boolean;
}

interface ApiKeysClientProps {
  logtoId?: string;
  email?: string | null;
  name?: string | null;
}

export default function ApiKeysClient({ logtoId, email, name }: ApiKeysClientProps) {
  return (
    <>
      <AuthUpdater logtoId={logtoId} email={email} name={name} />
      <ApiKeysContentWrapper expectedLogtoId={logtoId} />
    </>
  );
}

function ApiKeysContentWrapper({ expectedLogtoId }: { expectedLogtoId?: string }) {
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

  return <ApiKeysContent />;
}

function ApiKeysContent() {
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyExpiration, setNewKeyExpiration] = useState<"1_week" | "1_month" | "never">("1_month");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: apiKeys, refetch: refetchKeys } = trpc.apiKeys.list.useQuery();
  const { data: stats } = trpc.apiKeys.getUsageStats.useQuery();

  const generateMutation = trpc.apiKeys.generate.useMutation({
    onSuccess: (data) => {
      setGeneratedKey(data.key);
      refetchKeys();
    },
  });

  const revokeMutation = trpc.apiKeys.revoke.useMutation({
    onSuccess: () => {
      refetchKeys();
    },
  });

  const handleGenerate = () => {
    if (!newKeyName.trim()) return;
    generateMutation.mutate({
      name: newKeyName,
      expiration: newKeyExpiration,
    });
  };

  const handleCopyKey = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCloseModal = () => {
    setShowGenerateModal(false);
    setNewKeyName("");
    setNewKeyExpiration("1_month");
    setGeneratedKey(null);
    setCopied(false);
  };

  const handleRevoke = (keyId: string, keyName: string) => {
    if (confirm(`Are you sure you want to revoke "${keyName}"? This action cannot be undone.`)) {
      revokeMutation.mutate({ keyId });
    }
  };

  const tier = stats?.tier || "free";
  const limits = RATE_LIMITS[tier];
  const dailyUsed = stats?.dailyUsed || 0;
  const dailyRemaining = Math.max(0, limits.dailyLimit - dailyUsed);
  const dailyPercentage = Math.min(100, (dailyUsed / limits.dailyLimit) * 100);

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-content-primary mb-2">API Keys</h1>
        <p className="text-content-secondary">Manage your API keys and view rate limit analytics</p>
      </div>

      {/* Usage Stats */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-content-primary mb-4">Rate Limit Analytics</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-content-secondary text-sm">Current Tier</span>
              <span className={`px-2 py-1 rounded text-xs font-medium tier-badge tier-${tier}`}>
                {tier === "free" ? "Free" : tier === "tier_1" ? "Tier 1" : "Tier 2"}
              </span>
            </div>
            <p className="text-content-muted text-sm">{limits.dailyLimit} requests/day</p>
            <p className="text-content-muted text-sm">{limits.burstLimit} requests/minute</p>
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
            <p className="text-content-muted text-sm">{dailyRemaining} requests remaining</p>
          </div>

          <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-content-secondary text-sm">Active Keys</span>
              <span className="text-accent font-semibold text-2xl">{stats?.activeKeyCount || 0}</span>
            </div>
          </div>
        </div>
      </section>

      {/* API Keys List */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-content-primary">Your API Keys</h2>
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-accent text-dark font-medium rounded-lg hover:bg-accent/90 transition-colors"
            onClick={() => setShowGenerateModal(true)}
          >
            <Plus size={18} /> Generate New Key
          </button>
        </div>

        {apiKeys && apiKeys.length > 0 ? (
          <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
            <div className="grid grid-cols-5 gap-4 px-6 py-3 bg-dark-elevated text-xs font-medium text-content-muted uppercase tracking-wider">
              <span>Name</span>
              <span>Key</span>
              <span>Expires</span>
              <span>Last Used</span>
              <span>Actions</span>
            </div>
            {apiKeys.map((key: SerializedApiKey) => (
              <div key={key._id} className="grid grid-cols-5 gap-4 px-6 py-4 border-t border-dark-border items-center">
                <span className="font-medium text-content-primary">{key.name}</span>
                <code className="text-content-secondary text-sm bg-dark-elevated px-2 py-1 rounded">{key.keyPrefix}</code>
                <span className="text-content-secondary text-sm">
                  {key.expiresAt ? new Date(key.expiresAt).toLocaleDateString() : "Never"}
                </span>
                <span className="text-content-muted text-sm">
                  {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : "Never"}
                </span>
                <button
                  className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                  onClick={() => handleRevoke(key._id, key.name)}
                  disabled={revokeMutation.isPending}
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-dark-surface border border-dark-border rounded-xl p-12 text-center">
            <p className="text-content-secondary">No API keys yet. Generate one to get started!</p>
          </div>
        )}
      </section>

      {/* Generate Key Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={handleCloseModal}>
          <div className="bg-dark-surface border border-dark-border rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            {!generatedKey ? (
              <>
                <h3 className="text-xl font-semibold text-content-primary mb-6">Generate New API Key</h3>
                <div className="mb-4">
                  <label htmlFor="keyName" className="block text-sm font-medium text-content-secondary mb-2">Key Name</label>
                  <input
                    id="keyName"
                    type="text"
                    placeholder="e.g., Production App"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    maxLength={50}
                    className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-lg text-content-primary placeholder-content-muted focus:ring-2 focus:ring-accent/50 focus:border-accent/50"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-content-secondary mb-2">Expiration</label>
                  <div className="flex gap-2">
                    {[
                      { value: "1_week", label: "1 Week" },
                      { value: "1_month", label: "1 Month" },
                      { value: "never", label: "Never" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                          newKeyExpiration === opt.value
                            ? "bg-accent text-dark"
                            : "bg-dark-elevated text-content-secondary border border-dark-border hover:border-accent/30"
                        }`}
                        onClick={() => setNewKeyExpiration(opt.value as "1_week" | "1_month" | "never")}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="flex-1 py-3 rounded-lg font-medium bg-dark-elevated text-content-secondary hover:text-content-primary transition-colors" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button
                    className="flex-1 py-3 rounded-lg font-medium bg-accent text-dark hover:bg-accent/90 transition-colors disabled:opacity-50"
                    onClick={handleGenerate}
                    disabled={!newKeyName.trim() || generateMutation.isPending}
                  >
                    {generateMutation.isPending ? "Generating..." : "Generate Key"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold text-content-primary mb-4 flex items-center gap-2">
                  <CheckCircle size={20} className="text-accent" /> API Key Generated!
                </h3>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                  <p className="text-yellow-400 text-sm flex items-center gap-2">
                    <AlertTriangle size={16} /> <strong>Save this key now!</strong>
                  </p>
                  <p className="text-yellow-400/80 text-sm mt-1">This is the only time you&apos;ll see this key.</p>
                </div>
                <div className="bg-dark-elevated rounded-lg p-4 mb-6 flex items-center gap-3">
                  <code className="flex-1 text-content-primary text-sm break-all">{generatedKey}</code>
                  <button 
                    className="px-4 py-2 bg-accent text-dark font-medium rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-1"
                    onClick={handleCopyKey}
                  >
                    {copied ? <><Check size={14} /> Copied!</> : "Copy"}
                  </button>
                </div>
                <button 
                  className="w-full py-3 rounded-lg font-medium bg-accent text-dark hover:bg-accent/90 transition-colors"
                  onClick={handleCloseModal}
                >
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
