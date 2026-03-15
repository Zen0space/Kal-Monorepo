"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { formatDistanceToNow } from "date-fns";
import { useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";

import { trpc } from "@/lib/trpc";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

type TierFilter = "all" | "free" | "tier_1" | "tier_2";

function StatCard({
  label,
  value,
  color = "primary",
}: {
  label: string;
  value: string | number;
  color?: "primary" | "success" | "info" | "warning";
}) {
  const colorMap = {
    primary: "text-primary-light bg-primary/10 border-primary/15",
    success:
      "text-status-success bg-status-success/10 border-status-success/15",
    info: "text-status-info bg-status-info/10 border-status-info/15",
    warning:
      "text-status-warning bg-status-warning/10 border-status-warning/15",
  };

  return (
    <div className="bg-admin-surface border border-admin-border rounded-xl p-4 flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${colorMap[color]}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
          <path
            d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
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

function TierBadge({ tier }: { tier: string }) {
  const tierStyles: Record<string, string> = {
    free: "bg-slate-500/15 text-slate-400 border-slate-500/20",
    tier_1: "bg-status-info/15 text-status-info-light border-status-info/20",
    tier_2: "bg-primary/15 text-primary-light border-primary/20",
  };

  const tierLabels: Record<string, string> = {
    free: "Free",
    tier_1: "Tier 1",
    tier_2: "Tier 2",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${tierStyles[tier] || tierStyles.free}`}
    >
      {tierLabels[tier] || tier}
    </span>
  );
}

function UsersTable({
  users,
  loading,
}: {
  users: Array<{
    _id: string;
    name: string | null;
    email: string | null;
    tier: string;
    createdAt: Date;
    apiKeyCount: number;
  }>;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-14 bg-admin-elevated rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          className="mx-auto mb-3 opacity-50"
        >
          <path
            d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <p>No users found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs font-medium text-text-muted uppercase tracking-wide border-b border-admin-border">
            <th className="pb-3 pl-2">User</th>
            <th className="pb-3">Tier</th>
            <th className="pb-3">API Keys</th>
            <th className="pb-3 pr-2">Joined</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-admin-border-subtle">
          {users.map((user) => (
            <tr
              key={user._id}
              className="hover:bg-admin-elevated/50 transition-colors"
            >
              <td className="py-3 pl-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-admin-elevated border border-admin-border flex items-center justify-center text-xs font-medium text-text-secondary shrink-0">
                    {(user.name?.[0] || user.email?.[0] || "?").toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {user.name || "Unknown"}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      {user.email || "No email"}
                    </p>
                  </div>
                </div>
              </td>
              <td className="py-3">
                <TierBadge tier={user.tier} />
              </td>
              <td className="py-3">
                <span className="text-sm text-text-secondary">
                  {user.apiKeyCount}
                </span>
              </td>
              <td className="py-3 pr-2">
                <span className="text-sm text-text-muted">
                  {formatDistanceToNow(new Date(user.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GrowthChart({
  data,
  loading,
}: {
  data: Array<{ year: number; month: number; week: number; count: number }>;
  loading: boolean;
}) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return { labels: [], datasets: [] };
    }

    const sorted = [...data].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      if (a.month !== b.month) return a.month - b.month;
      return a.week - b.week;
    });

    const last12 = sorted.slice(-12);

    const labels = last12.map((d) => `W${d.week}`);
    const values = last12.map((d) => d.count);

    return {
      labels,
      datasets: [
        {
          label: "New Users",
          data: values,
          backgroundColor: "rgba(99, 102, 241, 0.6)",
          borderColor: "rgba(99, 102, 241, 1)",
          borderWidth: 1,
          borderRadius: 4,
          barThickness: 24,
        },
      ],
    };
  }, [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#1c2333",
        titleColor: "#f1f5f9",
        bodyColor: "#94a3b8",
        borderColor: "#2a3347",
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#475569",
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "#1e2a3d",
        },
        ticks: {
          color: "#475569",
          font: {
            size: 11,
          },
        },
      },
    },
  };

  if (loading) {
    return <div className="h-48 bg-admin-elevated rounded-lg animate-pulse" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-text-muted text-sm">
        No growth data available
      </div>
    );
  }

  return (
    <div className="h-48">
      <Bar data={chartData} options={options} />
    </div>
  );
}

export default function UsersPage() {
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");

  const { data: users, isLoading: usersLoading } = trpc.user.list.useQuery();
  const { data: stats, isLoading: statsLoading } = trpc.user.stats.useQuery();
  const { data: growth, isLoading: growthLoading } =
    trpc.user.growth.useQuery();

  const _isLoading = usersLoading || statsLoading;

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (tierFilter === "all") return users;
    return users.filter((u) => u.tier === tierFilter);
  }, [users, tierFilter]);

  const tierCounts = useMemo(() => {
    if (!users) return { free: 0, paid: 0 };
    const free = users.filter((u) => u.tier === "free").length;
    const paid = users.filter(
      (u) => u.tier === "tier_1" || u.tier === "tier_2"
    ).length;
    return { free, paid };
  }, [users]);

  const filterTabs: { key: TierFilter; label: string; count?: number }[] = [
    { key: "all", label: "All" },
    { key: "free", label: "Free" },
    { key: "tier_1", label: "Tier 1" },
    { key: "tier_2", label: "Tier 2" },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Users</h1>
        <p className="text-sm text-text-muted mt-1">
          Manage all registered users
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Total Users"
          value={statsLoading ? "—" : (stats?.total ?? 0).toLocaleString()}
          color="primary"
        />
        <StatCard
          label="Free Tier"
          value={statsLoading ? "—" : tierCounts.free.toLocaleString()}
          color="info"
        />
        <StatCard
          label="Paid Tier"
          value={statsLoading ? "—" : tierCounts.paid.toLocaleString()}
          color="success"
        />
      </div>

      {/* Growth Chart */}
      <div className="bg-admin-surface border border-admin-border rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-text-primary mb-4">
          User Growth
        </h2>
        <GrowthChart data={growth || []} loading={growthLoading} />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-2">
        {filterTabs.map((tab) => {
          const isActive = tierFilter === tab.key;
          const count =
            tab.key === "all"
              ? users?.length
              : users?.filter((u) => u.tier === tab.key).length;

          return (
            <button
              key={tab.key}
              onClick={() => setTierFilter(tab.key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                ${
                  isActive
                    ? "bg-primary/10 text-primary-light border border-primary/20"
                    : "text-text-secondary hover:text-text-primary hover:bg-admin-elevated border border-transparent"
                }`}
            >
              {tab.label}
              {count !== undefined && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    isActive
                      ? "bg-primary/20 text-primary-light"
                      : "bg-admin-elevated text-text-muted"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Users Table */}
      <div className="bg-admin-surface border border-admin-border rounded-xl overflow-hidden">
        <UsersTable users={filteredUsers} loading={usersLoading} />
      </div>
    </div>
  );
}
