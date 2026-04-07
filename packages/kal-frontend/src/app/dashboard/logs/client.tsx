"use client";

import { useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Filter,
  Search,
  X,
} from "react-feather";

import { AuthUpdater, useAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";

// ─── Types ───────────────────────────────────────────────────────────────────

interface LogsClientProps {
  logtoId?: string;
  email?: string | null;
  name?: string | null;
}

interface Filters {
  endpoint: string;
  success: boolean | undefined;
  type: "rest" | "trpc" | undefined;
}

interface LogRow {
  _id?: string;
  requestId: string;
  timestamp: string;
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

const DEFAULT_FILTERS: Filters = {
  endpoint: "",
  success: undefined,
  type: "rest",
};

const PAGE_SIZE = 50;

// ─── Entry / wrapper ─────────────────────────────────────────────────────────

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
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/[0.04] rounded w-48" />
          <div className="h-4 bg-white/[0.04] rounded w-32" />
          <div className="h-10 bg-white/[0.04] rounded-xl mt-6" />
          <div className="space-y-2 mt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 bg-white/[0.04] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <LogsContent />;
}

// ─── Status badge ────────────────────────────────────────────────────────────

function StatusBadge({
  statusCode,
  success,
}: {
  statusCode: number;
  success: boolean;
}) {
  const classes = success
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    : statusCode >= 500
      ? "bg-red-500/10 text-red-400 border-red-500/20"
      : "bg-amber-500/10 text-amber-400 border-amber-500/20";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${classes}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          success
            ? "bg-emerald-500"
            : statusCode >= 500
              ? "bg-red-500"
              : "bg-amber-500"
        }`}
      />
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
        ? "text-amber-400"
        : "text-red-400";
  return <span className={`text-xs font-mono ${color}`}>{ms}ms</span>;
}

// ─── Method badge ────────────────────────────────────────────────────────────

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "text-sky-400 bg-sky-500/10",
    POST: "text-emerald-400 bg-emerald-500/10",
    PUT: "text-amber-400 bg-amber-500/10",
    PATCH: "text-orange-400 bg-orange-500/10",
    DELETE: "text-red-400 bg-red-500/10",
  };
  const cls =
    colors[method.toUpperCase()] ?? "text-content-muted bg-white/[0.04]";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold font-mono uppercase tracking-wide ${cls}`}
    >
      {method}
    </span>
  );
}

// ─── Expanded detail panel ───────────────────────────────────────────────────

function ExpandedRow({ log }: { log: LogRow }) {
  return (
    <div className="mx-4 mb-3 mt-1 rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 text-xs space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <DetailItem label="Request ID" value={log.requestId} mono breakAll />
        {log.userAgent && (
          <DetailItem label="User Agent" value={log.userAgent} mono truncate />
        )}
        {log.ip && <DetailItem label="IP Address" value={log.ip} mono />}
        <DetailItem label="Type" value={log.type.toUpperCase()} mono />
      </div>

      {log.error && (
        <div className="rounded-lg bg-red-500/[0.06] border border-red-500/20 p-3">
          <p className="text-red-400 text-[11px] font-semibold mb-1">Error</p>
          <p className="font-mono text-red-300 text-xs break-all leading-relaxed">
            {log.error}
          </p>
        </div>
      )}
    </div>
  );
}

function DetailItem({
  label,
  value,
  mono,
  breakAll,
  truncate: truncateText,
}: {
  label: string;
  value: string;
  mono?: boolean;
  breakAll?: boolean;
  truncate?: boolean;
}) {
  return (
    <div>
      <span className="text-content-muted text-[11px] uppercase tracking-wider font-medium">
        {label}
      </span>
      <p
        className={`text-content-secondary text-xs mt-0.5 ${mono ? "font-mono" : ""} ${breakAll ? "break-all" : ""} ${truncateText ? "truncate" : ""}`}
        title={truncateText ? value : undefined}
      >
        {value}
      </p>
    </div>
  );
}

// ─── Filter pill ─────────────────────────────────────────────────────────────

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
        active
          ? "bg-accent text-dark shadow-[0_0_12px_rgba(16,185,129,0.15)]"
          : "bg-white/[0.04] text-content-secondary border border-white/[0.06] hover:border-white/[0.12] hover:text-content-primary"
      }`}
    >
      {label}
    </button>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────────

function LogsContent() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [offset, setOffset] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

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
      {/* ── Header ── */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-content-primary mb-1">
          Request Logs
        </h1>
        <p className="text-content-secondary text-sm md:text-base">
          Your recent API calls, errors, and response times
        </p>
        <div className="mt-3 h-px bg-gradient-to-r from-accent/40 via-accent/10 to-transparent" />
      </div>

      {/* ── Filter bar ── */}
      <div className="mb-5 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Endpoint search */}
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted"
            />
            <input
              type="text"
              placeholder="Filter by endpoint…"
              value={filters.endpoint}
              onChange={(e) => applyFilter({ endpoint: e.target.value })}
              className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white/[0.02] border border-white/[0.06] rounded-xl
                text-content-primary placeholder-content-muted
                focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/20
                transition-all duration-200"
            />
          </div>

          {/* Toggle advanced filters */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border transition-all duration-200 ${
              showFilters || hasActiveFilters
                ? "bg-accent/[0.1] border-accent/20 text-accent"
                : "bg-white/[0.02] border-white/[0.06] text-content-secondary hover:text-content-primary hover:border-white/[0.1]"
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
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-content-muted hover:text-red-400 transition-colors"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>

        {/* Advanced filters panel */}
        {showFilters && (
          <div className="flex flex-wrap gap-4 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
            {/* Status filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-content-muted uppercase tracking-wider font-medium mr-1">
                Status
              </span>
              {(
                [
                  { label: "All", value: undefined },
                  { label: "Success", value: true },
                  { label: "Errors", value: false },
                ] as { label: string; value: boolean | undefined }[]
              ).map(({ label, value }) => (
                <FilterPill
                  key={label}
                  label={label}
                  active={filters.success === value}
                  onClick={() => applyFilter({ success: value })}
                />
              ))}
            </div>

            {/* Type filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-content-muted uppercase tracking-wider font-medium mr-1">
                Type
              </span>
              {(
                [
                  { label: "All", value: undefined },
                  { label: "REST", value: "rest" as const },
                  { label: "tRPC", value: "trpc" as const },
                ] as { label: string; value: "rest" | "trpc" | undefined }[]
              ).map(({ label, value }) => (
                <FilterPill
                  key={label}
                  label={label}
                  active={filters.type === value}
                  onClick={() => applyFilter({ type: value })}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Logs table ── */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
        {/* Desktop table header */}
        <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-5 py-3 bg-white/[0.04] text-[11px] font-semibold text-content-muted uppercase tracking-wider">
          <span>Endpoint</span>
          <span>Method</span>
          <span>Status</span>
          <span>Duration</span>
          <span>Time</span>
          <span />
        </div>

        {isLoading ? (
          <div className="divide-y divide-white/[0.04]">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-5 py-4 animate-pulse flex gap-4">
                <div className="h-4 bg-white/[0.04] rounded flex-1" />
                <div className="h-4 bg-white/[0.04] rounded w-16" />
                <div className="h-4 bg-white/[0.04] rounded w-12" />
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          /* Empty state */
          <div className="py-16 px-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-accent/[0.08] flex items-center justify-center mb-4">
              <Activity size={22} className="text-accent/60" />
            </div>
            <p className="text-content-primary text-sm font-medium mb-1">
              {hasActiveFilters ? "No matching logs" : "No API calls yet"}
            </p>
            <p className="text-content-muted text-xs max-w-xs">
              {hasActiveFilters
                ? "Try adjusting your filters to find what you're looking for."
                : "Make your first request using your API key and it will show up here."}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-accent/[0.1] border border-accent/20 text-accent
                  text-xs font-medium rounded-lg hover:bg-accent/[0.15] transition-colors"
              >
                <X size={12} />
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {logs.map((log) => {
              const rowId = log._id ?? log.requestId;
              const isExpanded = expandedId === rowId;
              const time = new Date(log.timestamp);

              return (
                <div
                  key={rowId}
                  className={`transition-opacity ${isFetching ? "opacity-50" : ""}`}
                >
                  {/* Desktop row */}
                  <button
                    className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 w-full px-5 py-3.5
                      hover:bg-white/[0.03] transition-colors text-left items-center"
                    onClick={() => setExpandedId(isExpanded ? null : rowId)}
                  >
                    <span
                      className="font-mono text-sm text-content-primary truncate"
                      title={log.endpoint}
                    >
                      {log.endpoint}
                    </span>
                    <MethodBadge method={log.method} />
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
                    className="md:hidden w-full px-4 py-3.5 hover:bg-white/[0.03] transition-colors text-left"
                    onClick={() => setExpandedId(isExpanded ? null : rowId)}
                  >
                    <div className="flex items-center justify-between mb-2">
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
                          className={`text-content-muted transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-content-muted">
                      <MethodBadge method={log.method} />
                      <StatusBadge
                        statusCode={log.statusCode}
                        success={log.success}
                      />
                      <DurationBadge ms={log.duration} />
                      <span className="flex items-center gap-1 ml-auto">
                        <Clock size={10} className="text-accent/40" />
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
            })}
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {!isLoading && total > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-content-muted text-xs">
            {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of{" "}
            {total.toLocaleString()} logs
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
              disabled={!hasPrev || isFetching}
              className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] text-content-secondary
                hover:border-white/[0.1] hover:text-content-primary
                disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-3 py-1.5 text-xs text-content-secondary font-medium">
              {currentPage}
              <span className="text-content-muted mx-1">/</span>
              {totalPages}
            </span>
            <button
              onClick={() => setOffset((o) => o + PAGE_SIZE)}
              disabled={!hasMore || isFetching}
              className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] text-content-secondary
                hover:border-white/[0.1] hover:text-content-primary
                disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
