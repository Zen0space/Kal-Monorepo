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
import { Activity, Server, AlertTriangle, Clock } from "lucide-react";

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

// Mock data for API usage
const apiUsageData = {
  labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "23:59"],
  datasets: [
    {
      fill: true,
      label: 'API Requests',
      data: [1200, 800, 2500, 5000, 4500, 3000, 2000],
      borderColor: 'rgb(139, 92, 246)', // Primary Violet
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      backgroundColor: (context: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ctx = (context as any).chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0.5)');
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0.0)');
        return gradient;
      },
      tension: 0.4,
    }
  ]
};

const options = {
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

export default function AnalyticsPage() {
  // Use real user growth data where possible
  trpc.user.growth.useQuery();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">In-depth analysis of system performance and usage</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total API Calls</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128.4k</div>
            <p className="text-xs text-muted-foreground">+12% from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Latency</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45ms</div>
            <p className="text-xs text-muted-foreground">-5ms improvement</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0.12%</div>
            <p className="text-xs text-muted-foreground">Stable within SLA</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Nodes</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 max-h-[500px]">
          <CardHeader>
            <CardTitle>API Traffic (24h)</CardTitle>
            <CardDescription>Request volume over the last 24 hours</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <div className="relative w-full h-full">
              <Line options={options} data={apiUsageData} />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Top Endpoints</CardTitle>
            <CardDescription>Most accessed API routes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { path: "/api/trpc/food.list", count: "45.2k", pct: 35 },
                { path: "/api/trpc/user.get", count: "32.1k", pct: 25 },
                { path: "/api/trpc/search", count: "21.5k", pct: 16 },
                { path: "/api/trpc/chat.send", count: "12.8k", pct: 10 },
              ].map((route, i) => (
                <div key={i} className="flex items-center">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{route.path}</p>
                    <div className="h-2 w-full bg-secondary rounded-full mt-2 overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${route.pct}%` }} 
                      />
                    </div>
                  </div>
                  <div className="ml-4 font-medium text-sm text-muted-foreground">
                    {route.count}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
