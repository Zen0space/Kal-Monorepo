"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter,
  Search,
  X,
} from "react-feather";

import { AuthUpdater, useAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";

interface LogsClientProps {
  logtoId?: string;
  email?: string | null;
  name?: string | null;
}

export default function LogsClient({ logtoId, email, name }: LogsClientProps) {
  return (
    <>
      <AuthUpdater logtoId={logtoId} email={email} name={name} />
      <LogsContentWrapper expectedLogtoId={logtoId} />
    </>
  );
}

function LogsContentWrapper({ expectedLogtoId }: { expectedLogtoId?: string }) {
  const { logtoId } = useAuth();

  if (expectedLogtoId && logtoId !== expectedLogtoId) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-dark-elevated rounded w-48 mb-4" />
          <div className="h-4 bg-dark-elevated rounded w-32" />
        </div>
      </div>
    );
  }

  return <LogsContent />;
}

// ─── Filter state ────────────────────────────────────────────────────────────

interface Filters {
  endpoint: string;
  success: boolean | undefined;
  type: "rest" | "trpc" | undefined;
}

const DEFAULT_FILTERS: Filters = {
  endpoint: "",
  success: undefined,
  type: "rest",
};

const PAGE_SIZE = 50;

// ─── Status badge ────────────────────────────────────────────────────────────

function StatusBadge({
  statusCode,
  success,
}: {
  statusCode: number;
  success: boolean;
}) {
  const bg = success
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    : statusCode >= 500
      ? "bg-red-500/10 text-red-400 border-red-500/20"
      : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono border ${bg}`}
    >
      {statusCode}
    </span>
  );
}

// ─── Duration badge ──────────────────────────────────────────────────────────

function DurationBadge({ ms }: { ms: number }) {
  const color =
    ms < 200
      ? "text-emerald-400"
      : ms < 800
        ? "text-yellow-400"
        : "text-red-400";
  return <span className={`text-xs font-mono ${color}`}>{ms}ms</span>;
}

// ─── Expanded row ────────────────────────────────────────────────────────────

interface LogRow {
  _id?: string;
  requestId: string;
  timestamp: string; // serialised as ISO string over the wire
  type: "rest" | "trpc";
  method: string;
  endpoint: string;
  statusCode: number;
  duration: number;
  success: boolean;
  error?: string;
  userAgent?: string;
  ip?: string;
}

function ExpandedRow({ log }: { log: LogRow }) {
  return (
    <div className="px-4 py-3 bg-dark-elevated border-t border-dark-border text-xs space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <span className="text-content-muted">Request ID</span>
          <p className="font-mono text-content-secondary break-all">
            {log.requestId}
          </p>
        </div>
        {log.userAgent && (
          <div>
            <span className="text-content-muted">User Agent</span>
            <p
              className="font-mono text-content-secondary truncate"
              title={log.userAgent}
            >
              {log.userAgent}
            </p>
          </div>
        )}
        {log.ip && (
          <div>
            <span className="text-content-muted">IP</span>
            <p className="font-mono text-content-secondary">{log.ip}</p>
          </div>
        )}
        <div>
          <span className="text-content-muted">Type</span>
          <p className="font-mono text-content-secondary uppercase">
            {log.type}
          </p>
        </div>
      </div>
      {log.error && (
        <div className="mt-2 p-2 rounded bg-red-500/8 border border-red-500/20">
          <span className="text-red-400 font-medium">Error</span>
          <p className="font-mono text-red-300 mt-1 break-all">{log.error}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────────

function LogsContent() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [offset, setOffset] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Build query input — only pass defined values
  const queryInput = {
    limit: PAGE_SIZE,
    offset,
    ...(filters.endpoint.trim() ? { endpoint: filters.endpoint.trim() } : {}),
    ...(filters.success !== undefined ? { success: filters.success } : {}),
    ...(filters.type !== undefined ? { type: filters.type } : {}),
  };

  const { data, isLoading, isFetching } =
    trpc.requestLogs.list.useQuery(queryInput);

  const logs = (data?.logs ?? []) as unknown as LogRow[];
  const total = data?.total ?? 0;
  const hasMore = data?.hasMore ?? false;
  const hasPrev = offset > 0;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  function applyFilter(patch: Partial<Filters>) {
    setFilters((f) => ({ ...f, ...patch }));
    setOffset(0);
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
    setOffset(0);
  }

  const hasActiveFilters =
    filters.endpoint !== "" ||
    filters.success !== undefined ||
    filters.type !== "rest";

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-content-primary mb-1">
          Request Logs
        </h1>
        <p className="text-content-secondary text-sm">
          Your recent API calls, errors, and response times
        </p>
      </div>

      {/* Filter bar */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Endpoint search */}
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted"
            />
            <input
              type="text"
              placeholder="Filter by endpoint…"
              value={filters.endpoint}
              onChange={(e) => applyFilter({ endpoint: e.target.value })}
              className="w-full pl-8 pr-3 py-2 text-sm bg-dark-surface border border-dark-border rounded-lg text-content-primary placeholder-content-muted focus:ring-1 focus:ring-accent/50 focus:border-accent/50"
            />
          </div>

          {/* Toggle advanced filters */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
              showFilters || hasActiveFilters
                ? "bg-accent/10 border-accent/30 text-accent"
                : "bg-dark-surface border-dark-border text-content-secondary hover:text-content-primary"
            }`}
          >
            <Filter size={14} />
            Filters
            {hasActiveFilters && (
              <span className="w-4 h-4 rounded-full bg-accent text-dark text-[10px] font-bold flex items-center justify-center">
                !
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-content-muted hover:text-red-400 transition-colors"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>

        {/* Advanced filters panel */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 p-3 bg-dark-surface border border-dark-border rounded-lg">
            {/* Status filter */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-content-muted mr-1">Status:</span>
              {(
                [
                  { label: "All", value: undefined },
                  { label: "Success", value: true },
                  { label: "Errors", value: false },
                ] as { label: string; value: boolean | undefined }[]
              ).map(({ label, value }) => (
                <button
                  key={label}
                  onClick={() => applyFilter({ success: value })}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    filters.success === value
                      ? "bg-accent text-dark font-medium"
                      : "bg-dark-elevated text-content-secondary hover:text-content-primary"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Type filter */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-content-muted mr-1">Type:</span>
              {(
                [
                  { label: "All", value: undefined },
                  { label: "REST", value: "rest" as const },
                  { label: "tRPC", value: "trpc" as const },
                ] as { label: string; value: "rest" | "trpc" | undefined }[]
              ).map(({ label, value }) => (
                <button
                  key={label}
                  onClick={() => applyFilter({ type: value })}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    filters.type === value
                      ? "bg-accent text-dark font-medium"
                      : "bg-dark-elevated text-content-secondary hover:text-content-primary"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
        {/* Desktop table header */}
        <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-3 px-5 py-3 bg-dark-elevated text-xs font-medium text-content-muted uppercase tracking-wider">
          <span>Endpoint</span>
          <span>Method</span>
          <span>Status</span>
          <span>Duration</span>
          <span>Time</span>
          <span />
        </div>

        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="px-5 py-4 border-t border-dark-border animate-pulse flex gap-4"
            >
              <div className="h-4 bg-dark-elevated rounded flex-1" />
              <div className="h-4 bg-dark-elevated rounded w-16" />
              <div className="h-4 bg-dark-elevated rounded w-12" />
            </div>
          ))
        ) : logs.length === 0 ? (
          <div className="px-5 py-12 text-center text-content-muted text-sm">
            {hasActiveFilters
              ? "No logs match your filters."
              : "No API calls recorded yet. Make your first request using your API key."}
          </div>
        ) : (
          logs.map((log) => {
            const rowId = log._id ?? log.requestId;
            const isExpanded = expandedId === rowId;
            const time = new Date(log.timestamp);

            return (
              <div key={rowId} className={isFetching ? "opacity-60" : ""}>
                {/* Desktop row */}
                <button
                  className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-3 w-full px-5 py-3 border-t border-dark-border hover:bg-dark-elevated/50 transition-colors text-left items-center"
                  onClick={() => setExpandedId(isExpanded ? null : rowId)}
                >
                  <span
                    className="font-mono text-sm text-content-primary truncate"
                    title={log.endpoint}
                  >
                    {log.endpoint}
                  </span>
                  <span className="text-xs font-mono text-content-secondary uppercase">
                    {log.method}
                  </span>
                  <StatusBadge
                    statusCode={log.statusCode}
                    success={log.success}
                  />
                  <DurationBadge ms={log.duration} />
                  <span className="text-xs text-content-muted whitespace-nowrap">
                    {time.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    {time.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="text-content-muted">
                    {isExpanded ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </span>
                </button>

                {/* Mobile card */}
                <button
                  className="md:hidden w-full px-4 py-3 border-t border-dark-border hover:bg-dark-elevated/50 transition-colors text-left"
                  onClick={() => setExpandedId(isExpanded ? null : rowId)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="font-mono text-sm text-content-primary truncate flex-1 mr-2"
                      title={log.endpoint}
                    >
                      {log.endpoint}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {log.success ? (
                        <CheckCircle size={14} className="text-emerald-400" />
                      ) : (
                        <AlertCircle size={14} className="text-red-400" />
                      )}
                      <ChevronDown
                        size={14}
                        className={`text-content-muted transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-content-muted">
                    <span className="uppercase font-mono">{log.method}</span>
                    <StatusBadge
                      statusCode={log.statusCode}
                      success={log.success}
                    />
                    <DurationBadge ms={log.duration} />
                    <span className="flex items-center gap-1 ml-auto">
                      <Clock size={11} />
                      {time.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && <ExpandedRow log={log} />}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {!isLoading && total > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-content-muted">
          <span>
            {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of{" "}
            {total.toLocaleString()} logs
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
              disabled={!hasPrev || isFetching}
              className="px-3 py-1.5 rounded-lg bg-dark-surface border border-dark-border hover:border-accent/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>
            <span className="px-3 py-1.5 text-content-secondary">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setOffset((o) => o + PAGE_SIZE)}
              disabled={!hasMore || isFetching}
              className="px-3 py-1.5 rounded-lg bg-dark-surface border border-dark-border hover:border-accent/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
