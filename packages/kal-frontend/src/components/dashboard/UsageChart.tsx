"use client";

import { useMemo, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DayData {
  date: string; // "YYYY-MM-DD"
  count: number;
  errors: number;
}

interface UsageChartProps {
  data: DayData[];
  days?: number;
  isLoading?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildContinuousTimeline(data: DayData[], days: number): DayData[] {
  const map = new Map(data.map((d) => [d.date, d]));
  const result: DayData[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push(map.get(key) ?? { date: key, count: 0, errors: 0 });
  }

  return result;
}

function formatLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** Pick ~5 evenly-spaced indices for x-axis labels so it doesn't crowd. */
function getLabelIndices(total: number, maxLabels = 5): Set<number> {
  if (total <= maxLabels) {
    return new Set(Array.from({ length: total }, (_, i) => i));
  }
  const step = (total - 1) / (maxLabels - 1);
  const indices = new Set<number>();
  for (let i = 0; i < maxLabels; i++) {
    indices.add(Math.round(i * step));
  }
  return indices;
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function BarTooltip({ day }: { day: DayData }) {
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 pointer-events-none whitespace-nowrap">
      <div className="bg-[#141414] border border-white/[0.08] rounded-lg px-3 py-2 shadow-xl">
        <p className="text-[11px] text-content-secondary font-medium mb-1.5">
          {formatFullDate(day.date)}
        </p>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-content-primary font-medium">
              {day.count.toLocaleString()}
            </span>
          </span>
          {day.errors > 0 && (
            <span className="flex items-center gap-1.5 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-red-400 font-medium">
                {day.errors.toLocaleString()}
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Chart ────────────────────────────────────────────────────────────────────

export function UsageChart({
  data,
  days = 30,
  isLoading = false,
}: UsageChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const timeline = useMemo(
    () => buildContinuousTimeline(data, days),
    [data, days]
  );

  const totalRequests = useMemo(
    () => timeline.reduce((sum, d) => sum + d.count, 0),
    [timeline]
  );
  const totalErrors = useMemo(
    () => timeline.reduce((sum, d) => sum + d.errors, 0),
    [timeline]
  );
  const maxCount = useMemo(
    () => Math.max(1, ...timeline.map((d) => d.count)),
    [timeline]
  );

  const labelIndices = useMemo(
    () => getLabelIndices(timeline.length, 6),
    [timeline.length]
  );

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <div className="min-w-0 bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 md:p-6">
        <div className="h-5 w-36 bg-white/[0.04] rounded animate-pulse mb-1" />
        <div className="h-4 w-52 bg-white/[0.04] rounded animate-pulse mb-4" />
        <div className="h-48 bg-white/[0.04] rounded animate-pulse" />
      </div>
    );
  }

  // ── Empty state ──
  if (totalRequests === 0) {
    return (
      <div className="min-w-0 bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 md:p-6">
        <ChartHeader days={days} requests={0} errors={0} />
        <div className="flex items-center justify-center h-48 md:h-56 text-content-muted text-sm">
          No API calls in the last {days} days
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 md:p-6 overflow-hidden">
      <ChartHeader days={days} requests={totalRequests} errors={totalErrors} />

      {/* Bar chart area */}
      <div className="relative">
        {/* Y-axis grid lines (3 lines at 25%, 50%, 75%) */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none h-48 md:h-56">
          {[0.75, 0.5, 0.25].map((pct) => (
            <div key={pct} className="flex items-center w-full">
              <span className="text-[10px] text-content-muted/50 font-mono w-8 text-right pr-2 shrink-0">
                {Math.round(maxCount * pct)}
              </span>
              <div className="flex-1 border-t border-white/[0.04]" />
            </div>
          ))}
        </div>

        {/* Bars container */}
        <div
          className="relative flex items-end gap-[1px] md:gap-[2px] h-48 md:h-56 pl-8"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {timeline.map((day, i) => {
            const heightPct = (day.count / maxCount) * 100;
            const errorPct = day.count > 0 ? (day.errors / day.count) * 100 : 0;
            const isHovered = hoveredIndex === i;

            return (
              <div
                key={day.date}
                className="relative flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
              >
                {/* Tooltip */}
                {isHovered && <BarTooltip day={day} />}

                {/* Bar */}
                <div
                  className={`w-full rounded-t-sm transition-all duration-200 relative overflow-hidden ${
                    isHovered
                      ? "bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                      : "bg-emerald-500/70"
                  }`}
                  style={{
                    height: `${Math.max(heightPct, day.count > 0 ? 2 : 0)}%`,
                  }}
                >
                  {/* Error portion at the top of the bar */}
                  {day.errors > 0 && (
                    <div
                      className={`absolute top-0 left-0 right-0 transition-colors duration-200 ${
                        isHovered ? "bg-red-400" : "bg-red-500/80"
                      }`}
                      style={{ height: `${errorPct}%`, minHeight: 2 }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div className="flex gap-[1px] md:gap-[2px] mt-2 pl-8">
          {timeline.map((day, i) => (
            <div key={day.date} className="flex-1 text-center">
              {labelIndices.has(i) ? (
                <span className="text-[10px] text-content-muted/60 font-mono">
                  {formatLabel(day.date)}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.04]">
        <span className="flex items-center gap-1.5 text-xs text-content-secondary">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Requests
        </span>
        <span className="flex items-center gap-1.5 text-xs text-content-secondary">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          Errors
        </span>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChartHeader({
  days,
  requests,
  errors,
}: {
  days: number;
  requests: number;
  errors: number;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
      <div>
        <h2 className="text-base md:text-lg font-semibold text-content-primary">
          API Usage
        </h2>
        <p className="text-xs md:text-sm text-content-secondary">
          Last {days} days &mdash; {requests.toLocaleString()} requests,{" "}
          {errors.toLocaleString()} errors
        </p>
      </div>
    </div>
  );
}
