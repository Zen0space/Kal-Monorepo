"use client";

import type { ApiKeyExpiration } from "kal-shared";
import { RATE_LIMITS } from "kal-shared";
import { useState } from "react";

import { AuthUpdater, useAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";

/** API key as returned from tRPC (dates are serialized as strings) */
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
  
  // Wait until context is updated with the Logto ID
  if (expectedLogtoId && logtoId !== expectedLogtoId) {
    return (
      <div className="dashboard-loading">
        <p>Loading session...</p>
      </div>
    );
  }

  return <DashboardContent nameProp={nameProp} />;
}

function DashboardContent({ nameProp }: { nameProp?: string | null }) {
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyExpiration, setNewKeyExpiration] = useState<"1_week" | "1_month" | "never">("1_month");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch current user info (triggers sync from Logto to MongoDB)
  const { data: userInfo, isLoading: isLoadingUser } = trpc.apiKeys.getMe.useQuery();

  // Fetch API keys
  const { data: apiKeys, refetch: refetchKeys } = trpc.apiKeys.list.useQuery();

  // Fetch usage stats
  const { data: stats } = trpc.apiKeys.getUsageStats.useQuery();

  // Generate API key mutation
  const generateMutation = trpc.apiKeys.generate.useMutation({
    onSuccess: (data) => {
      setGeneratedKey(data.key);
      refetchKeys();
    },
  });

  // Revoke API key mutation
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

  // Use userInfo from backend, or fall back to prop from Logto claims
  const displayName = userInfo?.name || nameProp || "Developer";

  return (
    <div className="dashboard-content">
      {/* Usage Stats Section */}
      <section className="dashboard-section">
        <h2>Your Account</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Profile</span>
            </div>
            <div className="profile-info">
              <p className="profile-name">
                {isLoadingUser ? "Loading..." : displayName}
              </p>
              <p className="profile-email">{userInfo?.email}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Current Tier</span>
              <span className={`tier-badge tier-${tier}`}>
                {tier === "free" ? "Free" : tier === "tier_1" ? "Tier 1" : "Tier 2"}
              </span>
            </div>
            <div className="stat-details">
              <p>{limits.dailyLimit} requests/day</p>
              <p>{limits.burstLimit} requests/minute</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Today&apos;s Usage</span>
              <span className="stat-value">{dailyUsed} / {limits.dailyLimit}</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${dailyPercentage}%` }}
              />
            </div>
            <p className="stat-remaining">{dailyRemaining} requests remaining</p>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Active API Keys</span>
              <span className="stat-value">{stats?.activeKeyCount || 0}</span>
            </div>
          </div>
        </div>
      </section>

      {/* API Keys Section */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2>API Keys</h2>
          <button 
            className="btn-primary"
            onClick={() => setShowGenerateModal(true)}
          >
            + Generate New Key
          </button>
        </div>

        {apiKeys && apiKeys.length > 0 ? (
          <div className="api-keys-table">
            <div className="table-header">
              <span>Name</span>
              <span>Key</span>
              <span>Expires</span>
              <span>Last Used</span>
              <span>Actions</span>
            </div>
            {apiKeys.map((key: SerializedApiKey) => (
              <div key={key._id} className="table-row">
                <span className="key-name">{key.name}</span>
                <span className="key-prefix">
                  <code>{key.keyPrefix}</code>
                </span>
                <span className="key-expiry">
                  {key.expiresAt 
                    ? new Date(key.expiresAt).toLocaleDateString()
                    : "Never"
                  }
                </span>
                <span className="key-last-used">
                  {key.lastUsedAt 
                    ? new Date(key.lastUsedAt).toLocaleDateString()
                    : "Never"
                  }
                </span>
                <span className="key-actions">
                  <button
                    className="btn-danger"
                    onClick={() => handleRevoke(key._id, key.name)}
                    disabled={revokeMutation.isPending}
                  >
                    Revoke
                  </button>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No API keys yet. Generate one to get started!</p>
          </div>
        )}
      </section>

      {/* Quick Links */}
      <section className="dashboard-section">
        <h2>Quick Links</h2>
        <div className="quick-links">
          <a href="/api-docs" className="quick-link">
            <span className="link-icon">📖</span>
            <span>API Documentation</span>
          </a>
          <a href="/search" className="quick-link">
            <span className="link-icon">🔍</span>
            <span>Food Search</span>
          </a>
        </div>
      </section>

      {/* Generate Key Modal */}
      {showGenerateModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {!generatedKey ? (
              <>
                <h3>Generate New API Key</h3>
                <div className="form-group">
                  <label htmlFor="keyName">Key Name</label>
                  <input
                    id="keyName"
                    type="text"
                    placeholder="e.g., Production App"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    maxLength={50}
                  />
                </div>
                <div className="form-group">
                  <label>Expiration</label>
                  <div className="expiration-options">
                    <button
                      className={`exp-option ${newKeyExpiration === "1_week" ? "active" : ""}`}
                      onClick={() => setNewKeyExpiration("1_week")}
                    >
                      1 Week
                    </button>
                    <button
                      className={`exp-option ${newKeyExpiration === "1_month" ? "active" : ""}`}
                      onClick={() => setNewKeyExpiration("1_month")}
                    >
                      1 Month
                    </button>
                    <button
                      className={`exp-option ${newKeyExpiration === "never" ? "active" : ""}`}
                      onClick={() => setNewKeyExpiration("never")}
                    >
                      Never
                    </button>
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleGenerate}
                    disabled={!newKeyName.trim() || generateMutation.isPending}
                  >
                    {generateMutation.isPending ? "Generating..." : "Generate Key"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>🎉 API Key Generated!</h3>
                <div className="warning-box">
                  <strong>⚠️ Save this key now!</strong>
                  <p>This is the only time you&apos;ll see this key. Copy it and store it securely.</p>
                </div>
                <div className="key-display">
                  <code>{generatedKey}</code>
                  <button className="copy-btn" onClick={handleCopyKey}>
                    {copied ? "✓ Copied!" : "Copy"}
                  </button>
                </div>
                <div className="modal-actions">
                  <button className="btn-primary" onClick={handleCloseModal}>
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
