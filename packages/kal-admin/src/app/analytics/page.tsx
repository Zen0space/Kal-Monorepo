"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Activity, AlertTriangle, Clock, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import { useMemo } from "react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0,0,0,0.05)',
      },
      border: { display: false }
    },
    x: {
      grid: { display: false },
      border: { display: false }
    }
  },
};

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  isLoading,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  isLoading?: boolean;
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-emerald-500" : trend === "down" ? "text-red-500" : "text-muted-foreground";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-muted-foreground">Loading...</span>
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <p className={`text-xs flex items-center gap-1 ${trendColor}`}>
              {trend && <TrendIcon className="h-3 w-3" />}
              {subtitle}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  // Get real-time stats from backend
  const { data: quickStats, isLoading: statsLoading } = trpc.requestLogs.quickStats.useQuery();

  // Get analytics for the last 24 hours for the chart
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const { data: analytics, isLoading: analyticsLoading } = trpc.requestLogs.analytics.useQuery({
    startDate: yesterday.toISOString(),
    endDate: now.toISOString(),
  });

  // Transform hourly data for the chart
  const chartData = useMemo(() => {
    // Create an array for all 24 hours with defaults
    const hourlyData: number[] = new Array(24).fill(0);

    if (analytics?.requestsByHour) {
      analytics.requestsByHour.forEach(({ hour, count }) => {
        hourlyData[hour] = count;
      });
    }

    // Generate hour labels
    const labels = Array.from({ length: 24 }, (_, i) =>
      i.toString().padStart(2, '0') + ':00'
    );

    return {
      labels,
      datasets: [
        {
          fill: true,
          label: 'API Requests',
          data: hourlyData,
          borderColor: 'rgb(139, 92, 246)', // Primary Violet
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          backgroundColor: (context: any) => {
            const ctx = context?.chart?.ctx;
            if (!ctx) return 'rgba(139, 92, 246, 0.3)';
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(139, 92, 246, 0.5)');
            gradient.addColorStop(1, 'rgba(139, 92, 246, 0.0)');
            return gradient;
          },
          tension: 0.4,
        }
      ]
    };
  }, [analytics]);

  // Calculate trend based on today vs week average
  const getTrend = (today: number, weekTotal: number): "up" | "down" | "neutral" => {
    const weekAverage = weekTotal / 7;
    if (today > weekAverage * 1.1) return "up";
    if (today < weekAverage * 0.9) return "down";
    return "neutral";
  };

  // Calculate error rate trend
  const getErrorTrend = (todayRate: number, weekRate: number): "up" | "down" | "neutral" => {
    // For error rate, down is good, up is bad
    if (todayRate < weekRate * 0.9) return "down"; // Good - errors decreased
    if (todayRate > weekRate * 1.1) return "up";   // Bad - errors increased  
    return "neutral";
  };

  const requestsTrend = quickStats
    ? getTrend(quickStats.today.requests, quickStats.week.requests)
    : "neutral";

  const latencyTrend = quickStats
    ? getTrend(quickStats.week.avgDuration, quickStats.today.avgDuration) // Inverted - lower is better
    : "neutral";

  const errorTrend = quickStats
    ? getErrorTrend(quickStats.today.errorRate, quickStats.week.errorRate)
    : "neutral";

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">In-depth analysis of system performance and usage</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total API Calls (Today)"
          value={statsLoading ? "..." : formatNumber(quickStats?.today.requests ?? 0)}
          subtitle={`${formatNumber(quickStats?.week.requests ?? 0)} this week`}
          icon={Activity}
          trend={requestsTrend}
          isLoading={statsLoading}
        />
        <StatCard
          title="Avg. Latency"
          value={statsLoading ? "..." : `${quickStats?.today.avgDuration ?? 0}ms`}
          subtitle={`Week avg: ${quickStats?.week.avgDuration ?? 0}ms`}
          icon={Clock}
          trend={latencyTrend}
          isLoading={statsLoading}
        />
        <StatCard
          title="Error Rate (Today)"
          value={statsLoading ? "..." : `${quickStats?.today.errorRate ?? 0}%`}
          subtitle={`Week avg: ${quickStats?.week.errorRate ?? 0}%`}
          icon={AlertTriangle}
          trend={errorTrend}
          isLoading={statsLoading}
        />
        <StatCard
          title="Errors Today"
          value={statsLoading ? "..." : formatNumber(quickStats?.today.errors ?? 0)}
          subtitle={`${formatNumber(quickStats?.week.errors ?? 0)} this week`}
          icon={AlertTriangle}
          trend={errorTrend}
          isLoading={statsLoading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 max-h-[500px]">
          <CardHeader>
            <CardTitle>API Traffic (24h)</CardTitle>
            <CardDescription>
              {analyticsLoading
                ? "Loading traffic data..."
                : `${formatNumber(analytics?.totalRequests ?? 0)} requests in the last 24 hours`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {analyticsLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="relative w-full h-full">
                <Line options={chartOptions} data={chartData} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Top Endpoints</CardTitle>
            <CardDescription>
              {analyticsLoading
                ? "Loading..."
                : `${analytics?.topEndpoints?.length || 0} unique endpoints (24h)`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : analytics?.topEndpoints && analytics.topEndpoints.length > 0 ? (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                {analytics.topEndpoints.map((route, i) => {
                  // Calculate percentage relative to the top endpoint
                  const maxCount = analytics.topEndpoints[0]?.count || 1;
                  const pct = Math.round((route.count / maxCount) * 100);

                  return (
                    <div key={i} className="flex items-center">
                      <div className="flex-1 space-y-1 min-w-0">
                        <p className="text-sm font-medium leading-none truncate" title={route.endpoint}>
                          {route.endpoint}
                        </p>
                        <div className="h-2 w-full bg-secondary rounded-full mt-2 overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <div className="ml-4 font-medium text-sm text-muted-foreground min-w-[50px] text-right">
                        {formatNumber(route.count)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No API traffic data yet</p>
                <p className="text-xs">Make some requests to see analytics</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
