"use client";

import type { ApiKeyExpiration } from "kal-shared";
import { useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle,
  Clock,
  Copy,
  Key,
  Plus,
  Shield,
  Slash,
  Trash2,
  X,
} from "react-feather";

import { useBreakpoint } from "@/hooks/useBreakpoint";
import { AuthUpdater, useAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatExpiry(dateStr: string | null): string {
  if (!dateStr) return "No expiry";
  const now = Date.now();
  const expires = new Date(dateStr).getTime();
  const diff = expires - now;

  // Already expired — show actual date
  if (diff <= 0) {
    return `Expired ${new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  }

  // Future — show relative countdown
  const days = Math.floor(diff / 86_400_000);
  if (days > 30) {
    return `Expires ${new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  }
  if (days > 0) return `Expires in ${days}d`;
  const hrs = Math.floor(diff / 3_600_000);
  if (hrs > 0) return `Expires in ${hrs}h`;
  const mins = Math.floor(diff / 60_000);
  return `Expires in ${mins}m`;
}

function getKeyStatus(key: SerializedApiKey): "active" | "revoked" | "expired" {
  if (key.isRevoked) return "revoked";
  if (key.expiresAt && new Date(key.expiresAt) < new Date()) return "expired";
  return "active";
}

const STATUS_CONFIG = {
  active: {
    label: "Active",
    dotClass: "bg-emerald-500",
    badgeClass:
      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  },
  revoked: {
    label: "Revoked",
    dotClass: "bg-red-500",
    badgeClass: "bg-red-500/10 text-red-400 border border-red-500/20",
  },
  expired: {
    label: "Expired",
    dotClass: "bg-amber-500",
    badgeClass: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  },
} as const;

// ─── Entry / wrapper ──────────────────────────────────────────────────────────

export default function ApiKeysClient({
  logtoId,
  email,
  name,
}: ApiKeysClientProps) {
  return (
    <>
      <AuthUpdater logtoId={logtoId} email={email} name={name} />
      <ApiKeysContentWrapper expectedLogtoId={logtoId} />
    </>
  );
}

function ApiKeysContentWrapper({
  expectedLogtoId,
}: {
  expectedLogtoId?: string;
}) {
  const { logtoId } = useAuth();

  if (expectedLogtoId && logtoId !== expectedLogtoId) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/[0.04] rounded w-48" />
          <div className="h-4 bg-white/[0.04] rounded w-32" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-white/[0.04] rounded-xl" />
            ))}
          </div>
          <div className="space-y-3 mt-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-white/[0.04] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <ApiKeysContent />;
}

// ─── Main content ─────────────────────────────────────────────────────────────

function ApiKeysContent() {
  const { isMobile } = useBreakpoint();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyExpiration, setNewKeyExpiration] = useState<
    "1_week" | "1_month" | "never"
  >("1_month");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: apiKeys, refetch: refetchKeys } = trpc.apiKeys.list.useQuery();
  const { data: keyStats } = trpc.apiKeys.getKeyStats.useQuery();

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
    if (
      confirm(
        `Are you sure you want to revoke "${keyName}"? This action cannot be undone.`
      )
    ) {
      revokeMutation.mutate({ keyId });
    }
  };

  const activeKeys =
    apiKeys?.filter((k: SerializedApiKey) => getKeyStatus(k) === "active") ??
    [];
  const inactiveKeys =
    apiKeys?.filter((k: SerializedApiKey) => getKeyStatus(k) !== "active") ??
    [];

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full">
      {/* ── Header ── */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-content-primary mb-1">
              API Keys
            </h1>
            <p className="text-content-secondary text-sm md:text-base">
              Create and manage your API authentication keys
            </p>
          </div>
          <button
            className="group flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-dark font-semibold rounded-xl
              hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all duration-200 text-sm"
            onClick={() => setShowGenerateModal(true)}
          >
            <Plus
              size={16}
              className="group-hover:rotate-90 transition-transform duration-200"
            />
            Generate Key
          </button>
        </div>
        <div className="mt-3 h-px bg-gradient-to-r from-accent/40 via-accent/10 to-transparent" />
      </div>

      {/* ── Stats ── */}
      <section className="mb-6 md:mb-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            icon={<Key size={16} />}
            label="Active"
            value={keyStats?.active ?? 0}
            accentFrom="from-emerald-500/[0.08]"
            iconBg="bg-emerald-500/[0.1]"
            iconColor="text-emerald-400"
            valueColor="text-emerald-400"
          />
          <StatCard
            icon={<Slash size={16} />}
            label="Revoked"
            value={keyStats?.revoked ?? 0}
            accentFrom="from-red-500/[0.06]"
            iconBg="bg-red-500/10"
            iconColor="text-red-400"
          />
          <StatCard
            icon={<Clock size={16} />}
            label="Expired"
            value={keyStats?.expired ?? 0}
            accentFrom="from-amber-500/[0.06]"
            iconBg="bg-amber-500/10"
            iconColor="text-amber-400"
          />
          <StatCard
            icon={<Shield size={16} />}
            label="Total"
            value={keyStats?.total ?? 0}
            accentFrom="from-white/[0.03]"
            iconBg="bg-white/[0.06]"
            iconColor="text-content-muted"
          />
        </div>
      </section>

      {/* ── Active Keys ── */}
      <section className="mb-6 md:mb-8">
        <h2 className="text-sm font-semibold text-content-secondary uppercase tracking-wider mb-3">
          Active Keys
        </h2>

        {activeKeys.length > 0 ? (
          <div className="space-y-2.5">
            {activeKeys.map((key: SerializedApiKey) => (
              <KeyCard
                key={key._id}
                apiKey={key}
                onRevoke={handleRevoke}
                isRevoking={revokeMutation.isPending}
              />
            ))}
          </div>
        ) : (
          <EmptyState onGenerate={() => setShowGenerateModal(true)} />
        )}
      </section>

      {/* ── Inactive Keys ── */}
      {inactiveKeys.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-content-secondary uppercase tracking-wider mb-3">
            Inactive Keys
          </h2>
          <div className="space-y-2.5">
            {inactiveKeys.map((key: SerializedApiKey) => (
              <KeyCard
                key={key._id}
                apiKey={key}
                onRevoke={handleRevoke}
                isRevoking={revokeMutation.isPending}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Generate Modal ── */}
      {showGenerateModal && (
        <GenerateModal
          isMobile={isMobile}
          newKeyName={newKeyName}
          setNewKeyName={setNewKeyName}
          newKeyExpiration={newKeyExpiration}
          setNewKeyExpiration={setNewKeyExpiration}
          generatedKey={generatedKey}
          copied={copied}
          isPending={generateMutation.isPending}
          onGenerate={handleGenerate}
          onCopy={handleCopyKey}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  accentFrom,
  iconBg,
  iconColor,
  valueColor = "text-content-primary",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accentFrom: string;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
}) {
  return (
    <div
      className={`bg-gradient-to-br ${accentFrom} to-transparent border border-white/[0.06] rounded-xl p-4 md:p-5
        hover:border-white/[0.1] transition-all duration-200`}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center ${iconColor}`}
        >
          {icon}
        </div>
        <span className="text-content-secondary text-xs md:text-sm font-medium">
          {label}
        </span>
      </div>
      <span className={`${valueColor} font-bold text-2xl md:text-3xl`}>
        {value}
      </span>
    </div>
  );
}

// ─── Key Card ─────────────────────────────────────────────────────────────────

function KeyCard({
  apiKey,
  onRevoke,
  isRevoking,
}: {
  apiKey: SerializedApiKey;
  onRevoke: (id: string, name: string) => void;
  isRevoking: boolean;
}) {
  const status = getKeyStatus(apiKey);
  const config = STATUS_CONFIG[status];
  const isInactive = status !== "active";

  return (
    <div
      className={`group rounded-xl border transition-all duration-200 ${
        isInactive
          ? "bg-white/[0.01] border-white/[0.04] opacity-60"
          : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.1] hover:bg-white/[0.03]"
      }`}
    >
      <div className="p-4 md:px-5 md:py-4">
        {/* Top row: name + status + revoke */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Key icon */}
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                isInactive
                  ? "bg-white/[0.04] text-content-muted"
                  : "bg-accent/[0.08] text-accent"
              }`}
            >
              <Key size={16} />
            </div>

            {/* Name + created */}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-content-primary truncate">
                {apiKey.name}
              </p>
              <p className="text-[11px] text-content-muted">
                Created {relativeTime(apiKey.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Status badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold ${config.badgeClass}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
              {config.label}
            </span>

            {/* Revoke button */}
            {!isInactive && (
              <button
                className="p-1.5 rounded-lg text-content-muted hover:text-red-400 hover:bg-red-500/10
                  opacity-0 group-hover:opacity-100 transition-all duration-150"
                onClick={() => onRevoke(apiKey._id, apiKey.name)}
                disabled={isRevoking}
                title="Revoke key"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Bottom row: key prefix + meta */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pl-12">
          <code className="text-xs text-content-secondary bg-white/[0.04] px-2.5 py-1 rounded-md font-mono">
            {apiKey.keyPrefix}
          </code>

          <div className="flex items-center gap-3 text-[11px] text-content-muted">
            <span className="flex items-center gap-1">
              <Clock size={10} className="text-accent/40" />
              {formatExpiry(apiKey.expiresAt)}
            </span>
            <span className="w-px h-3 bg-white/[0.06]" />
            <span>Last used {relativeTime(apiKey.lastUsedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] border-dashed rounded-xl p-8 md:p-12 flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-xl bg-accent/[0.08] flex items-center justify-center mb-4">
        <Key size={22} className="text-accent/60" />
      </div>
      <p className="text-content-primary text-sm font-medium mb-1">
        No active API keys
      </p>
      <p className="text-content-muted text-xs mb-4 max-w-xs">
        Generate your first key to start making API requests
      </p>
      <button
        className="flex items-center gap-2 px-4 py-2 bg-accent/[0.1] border border-accent/20 text-accent
          text-xs font-medium rounded-lg hover:bg-accent/[0.15] transition-colors"
        onClick={onGenerate}
      >
        <Plus size={14} />
        Generate Key
      </button>
    </div>
  );
}

// ─── Generate Modal ───────────────────────────────────────────────────────────

function GenerateModal({
  isMobile,
  newKeyName,
  setNewKeyName,
  newKeyExpiration,
  setNewKeyExpiration,
  generatedKey,
  copied,
  isPending,
  onGenerate,
  onCopy,
  onClose,
}: {
  isMobile: boolean;
  newKeyName: string;
  setNewKeyName: (v: string) => void;
  newKeyExpiration: "1_week" | "1_month" | "never";
  setNewKeyExpiration: (v: "1_week" | "1_month" | "never") => void;
  generatedKey: string | null;
  copied: boolean;
  isPending: boolean;
  onGenerate: () => void;
  onCopy: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#141414] border border-white/[0.08] rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent top line */}
        <div className="h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

        <div className="p-5 md:p-6">
          {!generatedKey ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-accent/[0.08] flex items-center justify-center">
                    <Key size={16} className="text-accent" />
                  </div>
                  <h3 className="text-lg font-semibold text-content-primary">
                    New API Key
                  </h3>
                </div>
                <button
                  className="p-1.5 rounded-lg text-content-muted hover:text-content-primary hover:bg-white/[0.06] transition-colors"
                  onClick={onClose}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Name */}
              <div className="mb-4">
                <label
                  htmlFor="keyName"
                  className="block text-xs font-medium text-content-secondary mb-2"
                >
                  Key Name
                </label>
                <input
                  id="keyName"
                  type="text"
                  placeholder="e.g., Production App"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  maxLength={50}
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl
                    text-content-primary text-sm placeholder-content-muted
                    focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/20
                    transition-all duration-200"
                />
              </div>

              {/* Expiration */}
              <div className="mb-6">
                <label className="block text-xs font-medium text-content-secondary mb-2">
                  Expiration
                </label>
                <div className="flex gap-2">
                  {(
                    [
                      { value: "1_week", label: "1 Week" },
                      { value: "1_month", label: "1 Month" },
                      { value: "never", label: "Never" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        newKeyExpiration === opt.value
                          ? "bg-accent text-dark shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                          : "bg-white/[0.04] text-content-secondary border border-white/[0.06] hover:border-white/[0.12] hover:text-content-primary"
                      }`}
                      onClick={() => setNewKeyExpiration(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  className="flex-1 py-2.5 rounded-xl font-medium bg-white/[0.04] text-content-secondary
                    hover:bg-white/[0.06] hover:text-content-primary transition-colors text-sm"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 py-2.5 rounded-xl font-semibold bg-accent text-dark
                    hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  onClick={onGenerate}
                  disabled={!newKeyName.trim() || isPending}
                >
                  {isPending ? "Generating..." : "Generate"}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Success header */}
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle
                    size={isMobile ? 16 : 18}
                    className="text-emerald-400"
                  />
                </div>
                <h3 className="text-lg font-semibold text-content-primary">
                  Key Generated
                </h3>
              </div>

              {/* Warning */}
              <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-xl p-3.5 mb-4">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle
                    size={15}
                    className="text-amber-400 shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="text-amber-300 text-xs font-semibold">
                      Save this key now
                    </p>
                    <p className="text-amber-400/70 text-[11px] mt-0.5">
                      You won&apos;t be able to see it again after closing this
                      dialog.
                    </p>
                  </div>
                </div>
              </div>

              {/* Key display */}
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 mb-5">
                <code className="block text-content-primary text-xs md:text-sm break-all font-mono leading-relaxed mb-3">
                  {generatedKey}
                </code>
                <button
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-accent text-dark text-xs font-semibold
                    rounded-lg hover:shadow-[0_0_12px_rgba(16,185,129,0.2)] transition-all duration-200"
                  onClick={onCopy}
                >
                  {copied ? (
                    <>
                      <Check size={13} /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={13} /> Copy Key
                    </>
                  )}
                </button>
              </div>

              <button
                className="w-full py-2.5 rounded-xl font-medium bg-white/[0.04] text-content-secondary
                  hover:bg-white/[0.06] hover:text-content-primary transition-colors text-sm"
                onClick={onClose}
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
