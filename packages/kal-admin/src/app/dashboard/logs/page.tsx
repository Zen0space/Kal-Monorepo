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
import { format } from "date-fns";
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

type StatusFilter = "all" | "success" | "error";
type EndpointPreset = "api" | "health" | "all";

function StatCard({
  label,
  value,
  sub,
  color = "primary",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: "primary" | "success" | "info" | "warning" | "danger";
}) {
  const colorMap: Record<string, string> = {
    primary: "text-primary-light bg-primary/10 border-primary/15",
    success:
      "text-status-success bg-status-success/10 border-status-success/15",
    info: "text-status-info bg-status-info/10 border-status-info/15",
    warning:
      "text-status-warning bg-status-warning/10 border-status-warning/15",
    danger: "text-status-danger bg-status-danger/10 border-status-danger/15",
  };

  return (
    <div className="bg-admin-surface border border-admin-border rounded-xl p-4 flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${colorMap[color]}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="14 2 14 8 20 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div>
        <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
          {label}
        </p>
        <p className="text-xl font-semibold text-text-primary">{value}</p>
        {sub && <p className="text-xs text-text-muted">{sub}</p>}
      </div>
    </div>
  );
}

function MethodBadge({ method }: { method: string }) {
  const methodColors: Record<string, string> = {
    GET: "bg-status-success/15 text-status-success border-status-success/20",
    POST: "bg-status-info/15 text-status-info border-status-info/20",
    PUT: "bg-status-warning/15 text-status-warning border-status-warning/20",
    PATCH: "bg-status-warning/15 text-status-warning border-status-warning/20",
    DELETE: "bg-status-danger/15 text-status-danger border-status-danger/20",
  };

  const color =
    methodColors[method] ||
    "bg-admin-elevated text-text-secondary border-admin-border";

  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${color}`}
    >
      {method}
    </span>
  );
}

function StatusBadge({ statusCode }: { statusCode: number }) {
  let color = "bg-text-muted/15 text-text-muted border-text-muted/20";
  if (statusCode >= 200 && statusCode < 300) {
    color = "bg-status-success/15 text-status-success border-status-success/20";
  } else if (statusCode >= 300 && statusCode < 400) {
    color = "bg-status-info/15 text-status-info border-status-info/20";
  } else if (statusCode >= 400 && statusCode < 500) {
    color = "bg-status-warning/15 text-status-warning border-status-warning/20";
  } else if (statusCode >= 500) {
    color = "bg-status-danger/15 text-status-danger border-status-danger/20";
  }

  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${color}`}
    >
      {statusCode}
    </span>
  );
}

function LogsTable({
  logs,
  loading,
  onPageChange: _onPageChange,
  currentPage: _currentPage,
  pageSize: _pageSize,
  userMap = {},
}: {
  logs: Array<{
    _id?: string;
    timestamp: Date | string;
    userId: string | null;
    apiKeyPrefix: string | null;
    method: string;
    endpoint: string;
    statusCode: number;
    duration: number;
    success: boolean;
  }>;
  loading: boolean;
  onPageChange: (page: number) => void;
  currentPage: number;
  pageSize: number;
  userMap?: Record<string, string>;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="h-12 bg-admin-elevated rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
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
            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <polyline
            points="14 2 14 8 20 8"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
        <p>No request logs found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs font-medium text-text-muted uppercase tracking-wide border-b border-admin-border">
            <th className="pb-3 pl-2">Time</th>
            <th className="pb-3">User</th>
            <th className="pb-3">Method</th>
            <th className="pb-3">Endpoint</th>
            <th className="pb-3">Status</th>
            <th className="pb-3">Duration</th>
            <th className="pb-3 pr-2">Key</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-admin-border-subtle">
          {logs.map((log) => (
            <tr
              key={log._id || `${log.endpoint}-${log.timestamp}`}
              className="hover:bg-admin-elevated/50 transition-colors text-sm"
            >
              <td className="py-2.5 pl-2 whitespace-nowrap">
                <span className="text-text-secondary">
                  {format(new Date(log.timestamp), "MMM d, HH:mm:ss")}
                </span>
              </td>
              <td className="py-2.5">
                <span
                  className="text-text-muted font-mono text-xs"
                  title={log.userId || undefined}
                >
                  {log.userId
                    ? userMap[log.userId] || log.userId.slice(-8)
                    : "—"}
                </span>
              </td>
              <td className="py-2.5">
                <MethodBadge method={log.method} />
              </td>
              <td className="py-2.5 max-w-xs">
                <span className="text-text-secondary font-mono text-xs truncate block">
                  {log.endpoint}
                </span>
              </td>
              <td className="py-2.5">
                <StatusBadge statusCode={log.statusCode} />
              </td>
              <td className="py-2.5">
                <span className="text-text-muted">{log.duration}ms</span>
              </td>
              <td className="py-2.5 pr-2">
                <span className="text-text-muted font-mono text-xs">
                  {log.apiKeyPrefix || "—"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RequestsChart({
  data,
  loading,
}: {
  data: Array<{ date: string; count: number; errors: number }>;
  loading: boolean;
}) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return { labels: [], datasets: [] };
    }

    const labels = data.map((d) => format(new Date(d.date), "MMM d"));
    const requests = data.map((d) => d.count);
    const errors = data.map((d) => d.errors);

    return {
      labels,
      datasets: [
        {
          label: "Requests",
          data: requests,
          backgroundColor: "rgba(99, 102, 241, 0.6)",
          borderColor: "rgba(99, 102, 241, 1)",
          borderWidth: 1,
          borderRadius: 4,
          barThickness: 16,
        },
        {
          label: "Errors",
          data: errors,
          backgroundColor: "rgba(239, 68, 68, 0.6)",
          borderColor: "rgba(239, 68, 68, 1)",
          borderWidth: 1,
          borderRadius: 4,
          barThickness: 16,
        },
      ],
    };
  }, [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
        labels: {
          color: "#94a3b8",
          boxWidth: 12,
          padding: 15,
          font: { size: 11 },
        },
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
        stacked: false,
        grid: { display: false },
        ticks: { color: "#475569", font: { size: 10 } },
      },
      y: {
        stacked: false,
        beginAtZero: true,
        grid: { color: "#1e2a3d" },
        ticks: { color: "#475569", font: { size: 10 } },
      },
    },
  };

  if (loading) {
    return <div className="h-48 bg-admin-elevated rounded-lg animate-pulse" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-text-muted text-sm">
        No request data available
      </div>
    );
  }

  return (
    <div className="h-48">
      <Bar data={chartData} options={options} />
    </div>
  );
}

export default function LogsPage() {
  const [endpointFilter, setEndpointFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [presetFilter, setPresetFilter] = useState<EndpointPreset>("api");
  const [page, setPage] = useState(0);

  const limit = 50;

  // Build endpoint filter based on preset
  const getEndpointFilter = () => {
    if (presetFilter === "api") return "/api/v1/";
    if (presetFilter === "health") return "/health";
    return undefined; // all
  };

  const { data: usersData } = trpc.user.list.useQuery();

  const userMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (usersData) {
      for (const u of usersData) {
        map[u._id] = u.name || u.email || "Unknown";
      }
    }
    return map;
  }, [usersData]);

  const { data: logsData, isLoading: logsLoading } =
    trpc.adminLogs.list.useQuery({
      endpoint: endpointFilter || getEndpointFilter(),
      success: statusFilter === "all" ? undefined : statusFilter === "success",
      limit,
      offset: page * limit,
    });

  // Chart and stats always show API logs only (/api/v1/)
  const { data: quickStats, isLoading: statsLoading } =
    trpc.adminLogs.quickStats.useQuery({
      endpointPrefix: "/api/v1/",
    });
  const { data: chartData, isLoading: chartLoading } =
    trpc.adminLogs.requestsByDay.useQuery({
      days: 30,
      endpointPrefix: "/api/v1/",
    });

  const _isLoading = logsLoading || statsLoading;
  const totalPages = logsData ? Math.ceil(logsData.total / limit) : 0;

  const _currentPreset =
    presetFilter === "api"
      ? "API"
      : presetFilter === "health"
        ? "Health"
        : "all";

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text-primary">
          Request Logs
        </h1>
        <p className="text-sm text-text-muted mt-1">
          {presetFilter === "api" && "View API requests (/api/v1/*)"}
          {presetFilter === "health" && "View health check requests (/health)"}
          {presetFilter === "all" &&
            "View all API requests across the platform"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Today"
          value={
            statsLoading
              ? "—"
              : (quickStats?.today?.requests ?? 0).toLocaleString()
          }
          sub={`${quickStats?.today?.successRate?.toFixed(1) ?? 0}% success`}
          color="primary"
        />
        <StatCard
          label="This Week"
          value={
            statsLoading
              ? "—"
              : (quickStats?.week?.requests ?? 0).toLocaleString()
          }
          sub={`${quickStats?.week?.successRate?.toFixed(1) ?? 0}% success`}
          color="info"
        />
        <StatCard
          label="Avg Duration"
          value={
            statsLoading ? "—" : `${quickStats?.today?.avgDuration ?? 0}ms`
          }
          sub="today"
          color="warning"
        />
        <StatCard
          label="Errors Today"
          value={
            statsLoading
              ? "—"
              : (quickStats?.today?.errors ?? 0).toLocaleString()
          }
          sub={`${quickStats?.today?.errorRate?.toFixed(1) ?? 0}% error rate`}
          color="danger"
        />
      </div>

      {/* Chart */}
      <div className="bg-admin-surface border border-admin-border rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-text-primary mb-4">
          Requests (Last 30 Days)
        </h2>
        <RequestsChart data={chartData || []} loading={chartLoading} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={presetFilter}
          onChange={(e) => {
            setPresetFilter(e.target.value as EndpointPreset);
            setEndpointFilter("");
            setPage(0);
          }}
          className="bg-admin-elevated border border-admin-border rounded-lg px-3 py-2 text-sm text-text-primary
            focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/60"
        >
          <option value="api">API Logs</option>
          <option value="health">Health Checks</option>
          <option value="all">All Logs</option>
        </select>

        <input
          type="text"
          placeholder="Search endpoint..."
          value={endpointFilter}
          onChange={(e) => {
            setEndpointFilter(e.target.value);
            setPage(0);
          }}
          className="bg-admin-elevated border border-admin-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted
            focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/60 w-64"
        />

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as StatusFilter);
            setPage(0);
          }}
          className="bg-admin-elevated border border-admin-border rounded-lg px-3 py-2 text-sm text-text-primary
            focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/60"
        >
          <option value="all">All Status</option>
          <option value="success">Success (2xx)</option>
          <option value="error">Error (4xx/5xx)</option>
        </select>

        <span className="text-sm text-text-muted ml-auto">
          {logsData?.total !== undefined && (
            <>
              Showing {logsData.logs.length} of{" "}
              {logsData.total.toLocaleString()} logs
            </>
          )}
        </span>
      </div>

      {/* Table */}
      <div className="bg-admin-surface border border-admin-border rounded-xl overflow-hidden mb-4">
        <LogsTable
          logs={logsData?.logs || []}
          loading={logsLoading}
          onPageChange={setPage}
          currentPage={page}
          pageSize={limit}
          userMap={userMap}
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-admin-border bg-admin-elevated text-text-secondary
              hover:text-text-primary hover:border-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-text-muted px-3">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!logsData?.hasMore}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-admin-border bg-admin-elevated text-text-secondary
              hover:text-text-primary hover:border-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
