"use client";

import { useState, useEffect } from "react";

import { trpc } from "@/lib/trpc";

// ─── Countdown hook ───────────────────────────────────────────────────────────
/** Returns a live "HHh MMm SSs" string counting down to midnight UTC. */
function useCountdownToMidnightUTC(): string {
  const [timeLeft, setTimeLeft] = useState(() => getMsUntilMidnightUTC());

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getMsUntilMidnightUTC()), 1_000);
    return () => clearInterval(id);
  }, []);

  const totalSec = Math.max(0, Math.floor(timeLeft / 1_000));
  const h = Math.floor(totalSec / 3_600);
  const m = Math.floor((totalSec % 3_600) / 60);
  const s = totalSec % 60;
  return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

function getMsUntilMidnightUTC(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCDate(midnight.getUTCDate() + 1);
  midnight.setUTCHours(0, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

/** Inline countdown badge for stat cards. */
function ResetTimer() {
  const countdown = useCountdownToMidnightUTC();
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        className="text-status-info shrink-0"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <polyline
          points="12 6 12 12 16 14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Resets in{" "}
      <span className="font-mono text-text-secondary">{countdown}</span>
    </span>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  subNode,
  color = "primary",
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  subNode?: React.ReactNode;
  color?: "primary" | "success" | "warning" | "info";
  icon: React.ReactNode;
}) {
  const colorMap = {
    primary: "text-primary-light bg-primary/10 border-primary/15",
    success:
      "text-status-success bg-status-success/10 border-status-success/15",
    warning:
      "text-status-warning bg-status-warning/10 border-status-warning/15",
    info: "text-status-info bg-status-info/10 border-status-info/15",
  };

  return (
    <div className="bg-admin-surface border border-admin-border rounded-xl p-5 flex items-start gap-4 hover:border-admin-border/80 transition-colors">
      <div
        className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${colorMap[color]}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">
          {label}
        </p>
        <p className="text-2xl font-semibold text-text-primary leading-none">
          {value}
        </p>
        {sub && <p className="text-xs text-text-muted mt-1.5">{sub}</p>}
        {subNode && <div className="mt-1.5">{subNode}</div>}
      </div>
    </div>
  );
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { data: userStats, isLoading: userLoading } =
    trpc.user.stats.useQuery();
  const { data: quickStats, isLoading: logsLoading } =
    trpc.requestLogs.quickStats.useQuery();
  const { data: foodStats, isLoading: foodLoading } =
    trpc.food.stats.useQuery();

  const isLoading = userLoading || logsLoading || foodLoading;

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      {/* Page header */}
      <div className="mb-7">
        <h1 className="text-xl font-semibold text-text-primary">Overview</h1>
        <p className="text-sm text-text-muted mt-1">
          Platform health and activity at a glance
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Users"
          value={isLoading ? "—" : (userStats?.total ?? 0).toLocaleString()}
          sub="Registered accounts"
          color="primary"
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
              <path
                d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          }
        />
        <StatCard
          label="Requests Today"
          value={
            isLoading
              ? "—"
              : (quickStats?.today?.requests ?? 0).toLocaleString()
          }
          subNode={<ResetTimer />}
          color="info"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 6l3 13h12l3-13H3z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          }
        />
        <StatCard
          label="Last 7 Days"
          value={
            isLoading ? "—" : (quickStats?.week?.requests ?? 0).toLocaleString()
          }
          sub="API requests"
          color="warning"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect
                x="3"
                y="4"
                width="18"
                height="18"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
              />
              <line
                x1="16"
                y1="2"
                x2="16"
                y2="6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="8"
                y1="2"
                x2="8"
                y2="6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="3"
                y1="10"
                x2="21"
                y2="10"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          }
        />
        <StatCard
          label="Food Database"
          value={isLoading ? "—" : (foodStats?.total ?? 0).toLocaleString()}
          sub={`${foodStats?.foods ?? 0} natural · ${foodStats?.halal ?? 0} halal`}
          color="success"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="6"
                y1="1"
                x2="6"
                y2="4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="10"
                y1="1"
                x2="10"
                y2="4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="14"
                y1="1"
                x2="14"
                y2="4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          }
        />
      </div>

      {/* Two column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick nav */}
        <div className="bg-admin-surface border border-admin-border rounded-xl p-5">
          <SectionHeader
            title="Quick Actions"
            sub="Jump to common admin tasks"
          />
          <div className="space-y-2">
            {[
              {
                label: "View all users",
                href: "/dashboard/users",
                desc: "Manage registered users",
              },
              {
                label: "Inspect API keys",
                href: "/dashboard/api-keys",
                desc: "Review key usage and status",
              },
              {
                label: "Browse request logs",
                href: "/dashboard/logs",
                desc: "Audit all API requests",
              },
              {
                label: "Review feedback",
                href: "/dashboard/feedback",
                desc: "User reviews and bug reports",
              },
              {
                label: "Configure rate limits",
                href: "/dashboard/settings",
                desc: "Per-tier limit overrides",
              },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-admin-elevated hover:bg-admin-border/40 border border-admin-border-subtle hover:border-admin-border transition-all duration-150 group"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary group-hover:text-primary-light transition-colors">
                    {item.label}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">{item.desc}</p>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-text-muted group-hover:text-primary-light transition-colors shrink-0"
                >
                  <polyline
                    points="9 18 15 12 9 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* Status panel */}
        <div className="bg-admin-surface border border-admin-border rounded-xl p-5">
          <SectionHeader title="System Status" sub="Live backend metrics" />
          <div className="space-y-3">
            <StatusRow
              label="API Backend"
              status="operational"
              detail="kal-backend"
            />
            <StatusRow label="Database" status="operational" detail="MongoDB" />
            <StatusRow label="Cache" status="operational" detail="Redis" />
            <div className="pt-3 border-t border-admin-border-subtle">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>Admin Panel</span>
                <span className="font-mono bg-admin-elevated px-2 py-0.5 rounded text-text-secondary">
                  v0.1.0
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow({
  label,
  status,
  detail,
}: {
  label: string;
  status: "operational" | "degraded" | "down";
  detail: string;
}) {
  const statusConfig = {
    operational: {
      dot: "bg-status-success",
      text: "Operational",
      color: "text-status-success",
    },
    degraded: {
      dot: "bg-status-warning",
      text: "Degraded",
      color: "text-status-warning",
    },
    down: {
      dot: "bg-status-danger",
      text: "Down",
      color: "text-status-danger",
    },
  };
  const cfg = statusConfig[status];

  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2.5">
        <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
        <span className="text-sm text-text-secondary">{label}</span>
        <span className="text-xs text-text-muted font-mono">{detail}</span>
      </div>
      <span className={`text-xs font-medium ${cfg.color}`}>{cfg.text}</span>
    </div>
  );
}
