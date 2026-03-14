"use client";

import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { useMemo } from "react";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

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

/**
 * Fills in missing days in the data so the chart always shows a continuous
 * timeline, even when there were zero requests on some days.
 */
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

export function UsageChart({
  data,
  days = 30,
  isLoading = false,
}: UsageChartProps) {
  const timeline = useMemo(
    () => buildContinuousTimeline(data, days),
    [data, days]
  );

  const labels = timeline.map((d) => formatLabel(d.date));
  const requestCounts = timeline.map((d) => d.count);
  const errorCounts = timeline.map((d) => d.errors);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Requests",
        data: requestCounts,
        borderColor: "#10b981",
        // gradient filled inline via canvas — done via backgroundColor as a callback
        backgroundColor: "rgba(16, 185, 129, 0.12)",
        pointBackgroundColor: "#10b981",
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
      {
        label: "Errors",
        data: errorCounts,
        borderColor: "#ef4444",
        backgroundColor: "rgba(239, 68, 68, 0.08)",
        pointBackgroundColor: "#ef4444",
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 1.5,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
        align: "end" as const,
        labels: {
          boxWidth: 8,
          boxHeight: 8,
          usePointStyle: true,
          pointStyle: "circle" as const,
          color: "#a3a3a3",
          font: { size: 12 },
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: "#141414",
        borderColor: "#262626",
        borderWidth: 1,
        titleColor: "#ffffff",
        bodyColor: "#a3a3a3",
        padding: 10,
        callbacks: {
          title: (items: { label: string }[]) => items[0]?.label ?? "",
          label: (item: {
            dataset: { label?: string };
            formattedValue: string;
          }) => `  ${item.dataset.label}: ${item.formattedValue}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: "#525252",
          font: { size: 11 },
          // Only show a tick every ~7 days to avoid crowding
          maxTicksLimit: 7,
          maxRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(255,255,255,0.04)" },
        border: { display: false },
        ticks: {
          color: "#525252",
          font: { size: 11 },
          precision: 0,
        },
      },
    },
  };

  if (isLoading) {
    return (
      <div className="bg-dark-surface border border-dark-border rounded-xl p-4 md:p-6">
        <div className="h-5 w-36 bg-dark-elevated rounded animate-pulse mb-1" />
        <div className="h-4 w-52 bg-dark-elevated rounded animate-pulse mb-4" />
        <div className="h-48 bg-dark-elevated rounded animate-pulse" />
      </div>
    );
  }

  const totalRequests = requestCounts.reduce((a, b) => a + b, 0);
  const totalErrors = errorCounts.reduce((a, b) => a + b, 0);

  return (
    <div className="bg-dark-surface border border-dark-border rounded-xl p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-base md:text-lg font-semibold text-content-primary">
            API Usage
          </h2>
          <p className="text-xs md:text-sm text-content-secondary">
            Last {days} days &mdash; {totalRequests.toLocaleString()} requests,{" "}
            {totalErrors.toLocaleString()} errors
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48 md:h-56">
        {totalRequests === 0 ? (
          <div className="flex items-center justify-center h-full text-content-muted text-sm">
            No API calls in the last {days} days
          </div>
        ) : (
          <Line data={chartData} options={options} />
        )}
      </div>
    </div>
  );
}
