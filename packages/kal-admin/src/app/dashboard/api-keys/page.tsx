"use client";

import { trpc } from "@/lib/trpc";

function StatCard({
  label,
  value,
  color = "primary",
}: {
  label: string;
  value: string | number;
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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"
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

export default function ApiKeysPage() {
  const { data: userKeyCounts, isLoading } =
    trpc.apiKeys.adminGetUserKeyCounts.useQuery();
  const { data: userStats } = trpc.user.stats.useQuery();

  const totalKeys =
    userKeyCounts?.reduce((sum, u) => sum + u.totalKeys, 0) ?? 0;
  const activeKeys =
    userKeyCounts?.reduce((sum, u) => sum + u.activeKeys, 0) ?? 0;

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text-primary">API Keys</h1>
        <p className="text-sm text-text-muted mt-1">
          View API key usage across all users
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Total Users"
          value={userStats?.total ?? 0}
          color="primary"
        />
        <StatCard label="Total Keys" value={totalKeys} color="info" />
        <StatCard label="Active Keys" value={activeKeys} color="success" />
      </div>

      {/* Table */}
      <div className="bg-admin-surface border border-admin-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-admin-elevated rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : userKeyCounts?.length === 0 ? (
          <div className="p-12 text-center text-text-muted">
            No API keys found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-text-muted uppercase tracking-wide border-b border-admin-border">
                  <th className="pb-3 pl-4">User</th>
                  <th className="pb-3">Total Keys</th>
                  <th className="pb-3">Active</th>
                  <th className="pb-3 pr-4">Revoked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border-subtle">
                {userKeyCounts?.map((user) => (
                  <tr
                    key={user.userId}
                    className="hover:bg-admin-elevated/50 transition-colors"
                  >
                    <td className="py-3 pl-4">
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {user.userName || "Unknown"}
                        </p>
                        <p className="text-xs text-text-muted">
                          {user.userEmail || "No email"}
                        </p>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="text-text-secondary font-medium">
                        {user.totalKeys}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-status-success font-medium">
                        {user.activeKeys}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-text-muted">
                        {user.revokedKeys}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
