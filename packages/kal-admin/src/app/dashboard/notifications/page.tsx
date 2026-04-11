"use client";

import { useState } from "react";

import { trpc } from "@/lib/trpc";

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color = "primary",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: "primary" | "success" | "warning" | "info";
}) {
  const colorMap: Record<string, string> = {
    primary: "text-primary-light bg-primary/10 border-primary/15",
    success:
      "text-status-success bg-status-success/10 border-status-success/15",
    warning:
      "text-status-warning bg-status-warning/10 border-status-warning/15",
    info: "text-status-info bg-status-info/10 border-status-info/15",
  };

  return (
    <div className="bg-admin-surface border border-admin-border rounded-xl p-4 flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${colorMap[color]}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
          {label}
        </p>
        <p className="text-xl font-semibold text-text-primary">{value}</p>
      </div>
    </div>
  );
}

// ─── Send Result Banner ──────────────────────────────────────────────────────

function ResultBanner({
  result,
  onDismiss,
}: {
  result: { sent: number; failed: number; expired: number };
  onDismiss: () => void;
}) {
  const total = result.sent + result.failed + result.expired;
  const isSuccess = result.sent > 0 && result.failed === 0;

  return (
    <div
      className={`mb-6 relative overflow-hidden rounded-xl p-4 flex items-center justify-between gap-3 ${
        isSuccess
          ? "bg-status-success/[0.06] border border-status-success/20"
          : "bg-status-warning/[0.06] border border-status-warning/20"
      }`}
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
          isSuccess ? "bg-status-success" : "bg-status-warning"
        }`}
      />
      <div className="ml-2">
        <p
          className={`font-medium text-sm ${
            isSuccess ? "text-status-success" : "text-status-warning"
          }`}
        >
          Notification sent to {result.sent} of {total} device
          {total !== 1 ? "s" : ""}
        </p>
        {(result.failed > 0 || result.expired > 0) && (
          <p
            className={`text-xs mt-0.5 ${
              isSuccess ? "text-status-success/60" : "text-status-warning/60"
            }`}
          >
            {result.failed > 0 && `${result.failed} failed`}
            {result.failed > 0 && result.expired > 0 && ", "}
            {result.expired > 0 && `${result.expired} expired (auto-cleaned)`}
          </p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="text-text-muted hover:text-text-primary transition-colors p-1"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M18 6L6 18M6 6l12 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  // Form state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [target, setTarget] = useState<"all" | "user">("all");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [sendResult, setSendResult] = useState<{
    sent: number;
    failed: number;
    expired: number;
  } | null>(null);

  // Data queries
  const { data: stats, isLoading: statsLoading } =
    trpc.push.getStats.useQuery();
  const { data: pwaStats, isLoading: pwaStatsLoading } =
    trpc.pwa.getStats.useQuery();
  const { data: usersData } = trpc.user.list.useQuery();

  // Mutations
  const sendToAll = trpc.push.sendToAll.useMutation({
    onSuccess: (data) => {
      setSendResult(data);
      setTitle("");
      setBody("");
      setUrl("");
    },
  });

  const sendToUser = trpc.push.sendToUser.useMutation({
    onSuccess: (data) => {
      setSendResult(data);
      setTitle("");
      setBody("");
      setUrl("");
      setSelectedUserId("");
    },
  });

  const isSending = sendToAll.isPending || sendToUser.isPending;
  const error = sendToAll.error || sendToUser.error;

  const canSend =
    title.trim() &&
    body.trim() &&
    !isSending &&
    (target === "all" || selectedUserId);

  const handleSend = () => {
    if (!canSend) return;

    const payload = {
      title: title.trim(),
      body: body.trim(),
      url: url.trim() || undefined,
    };

    if (target === "all") {
      sendToAll.mutate(payload);
    } else {
      sendToUser.mutate({ ...payload, userId: selectedUserId });
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text-primary">
          Push Notifications
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Send push notifications to subscribed PWA users
        </p>
      </div>

      {/* Push Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatCard
          label="Subscribed Devices"
          value={statsLoading ? "..." : (stats?.totalSubscriptions ?? 0)}
          color="primary"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13.73 21a2 2 0 0 1-3.46 0"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
        />
        <StatCard
          label="Unique Users"
          value={statsLoading ? "..." : (stats?.uniqueUsers ?? 0)}
          color="info"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle
                cx="9"
                cy="7"
                r="4"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          }
        />
      </div>

      {/* Push Prompt Analytics */}
      {!statsLoading &&
        ((stats?.promptsConverted ?? 0) > 0 ||
          (stats?.promptsDismissed ?? 0) > 0) && (
          <div className="bg-admin-surface border border-admin-border rounded-xl p-6 mb-6">
            <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22 12h-4l-3 9L9 3l-3 9H2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Push Prompt Analytics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label="Subscribed via Prompt"
                value={stats?.promptsConverted ?? 0}
                color="success"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M22 4L12 14.01l-3-3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
              />
              <StatCard
                label="Dismissed"
                value={stats?.promptsDismissed ?? 0}
                color="warning"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                }
              />
              <StatCard
                label="Conversion Rate"
                value={
                  (() => {
                    const total =
                      (stats?.promptsConverted ?? 0) +
                      (stats?.promptsDismissed ?? 0);
                    if (total === 0) return "—";
                    return `${Math.round(((stats?.promptsConverted ?? 0) / total) * 100)}%`;
                  })()
                }
                color="info"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M23 6l-9.5 9.5-5-5L1 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M17 6h6v6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
              />
            </div>
          </div>
        )}

      {/* PWA Install Stats */}
      <div className="bg-admin-surface border border-admin-border rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points="7 10 12 15 17 10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="12"
              y1="15"
              x2="12"
              y2="3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          PWA Installs
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <StatCard
            label="Total Installs"
            value={pwaStatsLoading ? "..." : (pwaStats?.totalInstalls ?? 0)}
            color="success"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect
                  x="5"
                  y="2"
                  width="14"
                  height="20"
                  rx="2"
                  ry="2"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line
                  x1="12"
                  y1="18"
                  x2="12.01"
                  y2="18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            }
          />
          <StatCard
            label="Authenticated"
            value={
              pwaStatsLoading ? "..." : (pwaStats?.authenticatedInstalls ?? 0)
            }
            color="info"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          />
          <StatCard
            label="Anonymous"
            value={pwaStatsLoading ? "..." : (pwaStats?.anonymousInstalls ?? 0)}
            color="warning"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle
                  cx="9"
                  cy="7"
                  r="4"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line
                  x1="17"
                  y1="8"
                  x2="23"
                  y2="8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            }
          />
        </div>

        {/* Platform & Browser Breakdown */}
        {pwaStats &&
          (pwaStats.platformBreakdown.length > 0 ||
            pwaStats.browserBreakdown.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Platform Breakdown */}
              {pwaStats.platformBreakdown.length > 0 && (
                <div className="bg-admin-elevated border border-admin-border-subtle rounded-lg p-4">
                  <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">
                    By Platform
                  </p>
                  <div className="space-y-2">
                    {pwaStats.platformBreakdown.map((p) => (
                      <div
                        key={p.platform}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-text-secondary capitalize">
                          {p.platform}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-admin-border rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{
                                width: `${pwaStats.totalInstalls > 0 ? (p.count / pwaStats.totalInstalls) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium text-text-muted w-6 text-right">
                            {p.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Browser Breakdown */}
              {pwaStats.browserBreakdown.length > 0 && (
                <div className="bg-admin-elevated border border-admin-border-subtle rounded-lg p-4">
                  <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">
                    By Browser
                  </p>
                  <div className="space-y-2">
                    {pwaStats.browserBreakdown.map((b) => (
                      <div
                        key={b.browser}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-text-secondary capitalize">
                          {b.browser}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-admin-border rounded-full overflow-hidden">
                            <div
                              className="h-full bg-status-info rounded-full"
                              style={{
                                width: `${pwaStats.totalInstalls > 0 ? (b.count / pwaStats.totalInstalls) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium text-text-muted w-6 text-right">
                            {b.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        {/* Daily Installs */}
        {pwaStats && pwaStats.dailyInstalls.length > 0 && (
          <div className="mt-4 bg-admin-elevated border border-admin-border-subtle rounded-lg p-4">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">
              Last 30 Days
            </p>
            <div className="flex items-end gap-[2px] h-16">
              {pwaStats.dailyInstalls.map((d) => {
                const max = Math.max(
                  ...pwaStats.dailyInstalls.map((i) => i.count)
                );
                const heightPct = max > 0 ? (d.count / max) * 100 : 0;
                return (
                  <div
                    key={d.date}
                    className="flex-1 bg-primary/60 hover:bg-primary rounded-t transition-colors group relative"
                    style={{
                      height: `${Math.max(heightPct, 4)}%`,
                    }}
                  >
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-admin-surface border border-admin-border rounded px-1.5 py-0.5 text-[10px] text-text-secondary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {d.date}: {d.count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!pwaStatsLoading && pwaStats?.totalInstalls === 0 && (
          <p className="text-sm text-text-muted text-center py-4">
            No PWA installs recorded yet. Installs are tracked automatically
            when users add the app to their home screen.
          </p>
        )}
      </div>

      {/* Send Result */}
      {sendResult && (
        <ResultBanner
          result={sendResult}
          onDismiss={() => setSendResult(null)}
        />
      )}

      {/* Compose Form */}
      <div className="bg-admin-surface border border-admin-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Compose Notification
        </h2>

        <div className="space-y-4">
          {/* Target selection */}
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wide mb-1.5">
              Send To
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setTarget("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  target === "all"
                    ? "bg-primary/10 text-primary-light border border-primary/20"
                    : "text-text-secondary hover:text-text-primary bg-admin-elevated border border-admin-border"
                }`}
              >
                All Users ({stats?.totalSubscriptions ?? 0} devices)
              </button>
              <button
                onClick={() => setTarget("user")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  target === "user"
                    ? "bg-primary/10 text-primary-light border border-primary/20"
                    : "text-text-secondary hover:text-text-primary bg-admin-elevated border border-admin-border"
                }`}
              >
                Specific User
              </button>
            </div>
          </div>

          {/* User selector (when target = user) */}
          {target === "user" && (
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wide mb-1.5">
                Select User
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full bg-admin-elevated border border-admin-border rounded-lg px-3 py-2 text-sm text-text-primary
                  focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30"
              >
                <option value="">Choose a user...</option>
                {usersData?.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wide mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. New Feature Available!"
              maxLength={100}
              className="w-full bg-admin-elevated border border-admin-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/50
                focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30"
            />
            <p className="text-xs text-text-muted mt-1 text-right">
              {title.length}/100
            </p>
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wide mb-1.5">
              Body
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="e.g. We've added new halal food categories. Check it out!"
              maxLength={500}
              rows={3}
              className="w-full bg-admin-elevated border border-admin-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/50
                focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 resize-none"
            />
            <p className="text-xs text-text-muted mt-1 text-right">
              {body.length}/500
            </p>
          </div>

          {/* URL (optional) */}
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wide mb-1.5">
              Click URL{" "}
              <span className="normal-case tracking-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/dashboard/changelog"
              className="w-full bg-admin-elevated border border-admin-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/50
                focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30"
            />
            <p className="text-xs text-text-muted mt-1">
              Where users go when they tap the notification. Defaults to
              /dashboard.
            </p>
          </div>

          {/* Preview */}
          {(title || body) && (
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wide mb-1.5">
                Preview
              </label>
              <div className="bg-admin-bg border border-admin-border-subtle rounded-xl p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0 mt-0.5">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-primary-light"
                  >
                    <path
                      d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">
                    {title || "Notification Title"}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5 line-clamp-3">
                    {body || "Notification body text..."}
                  </p>
                  <p className="text-xs text-text-muted mt-1.5">Kalori</p>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-status-danger-muted/20 border border-status-danger/20 rounded-lg p-3">
              <p className="text-sm text-status-danger">{error.message}</p>
            </div>
          )}

          {/* Send Button */}
          <div className="pt-2 flex items-center justify-between">
            <p className="text-xs text-text-muted">
              {target === "all"
                ? `Will send to ${stats?.totalSubscriptions ?? 0} subscribed devices`
                : selectedUserId
                  ? "Will send to all devices of the selected user"
                  : "Select a user to send to"}
            </p>
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm
                hover:bg-primary/90 hover:shadow-[0_0_24px_rgba(16,185,129,0.25)] transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none
                flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {isSending ? "Sending..." : "Send Notification"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
