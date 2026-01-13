"use client";

import React from 'react';
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
import { Line } from 'react-chartjs-2';

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

interface StatisticChartProps {
  userGrowth?: { year: number; month: number; week: number; count: number }[];
}

export const options = {
  responsive: true,
  maintainAspectRatio: false, // Allow it to fill height
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'User Growth (Weekly Cumulative)',
    },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function StatisticChart({ userGrowth = [] }: StatisticChartProps) {
  // If no data, show empty state
  if (!userGrowth.length) {
    return (
      <Card className="h-full flex items-center justify-center p-6 text-muted-foreground">
        No data available
      </Card>
    );
  }

  // 1. Generate labels: "Jan W1", "Jan W2", etc.
  // 2. Calculate cumulative counts
  
  // 1. Generate continuous timeline for the CURRENT MONTH only (W1-W4)
  const labels: string[] = [];
  const dataPoints: number[] = [];
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  // Calculate users accumulated BEFORE this month
  let runningTotal = userGrowth
    .filter(i => i.year < currentYear || (i.year === currentYear && i.month < currentMonth))
    .reduce((acc, curr) => acc + curr.count, 0);

  // Iterate strictly 4 weeks for the current month
  for (let w = 1; w <= 4; w++) {
     const monthName = new Date(currentYear, currentMonth - 1, 1).toLocaleString('default', { month: 'short' });
     labels.push(`${monthName} W${w}`);

     // Find data for this specific week
     const match = userGrowth.find(i => i.year === currentYear && i.month === currentMonth && i.week === w);
     if (match) {
         runningTotal += match.count;
     }
     dataPoints.push(runningTotal);
  }

  // Placeholder revenue calculation (e.g. 10 * users maybe?) 
  const revenueData = dataPoints.map(count => count * 0); 

  const data = {
    labels,
    datasets: [
      {
        fill: true,
        label: 'Users',
        data: dataPoints,
        borderColor: 'rgb(139, 92, 246)', // Vibrant Purple 
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
      },
      {
         fill: true,
         label: 'Revenue',
         data: revenueData,
         borderColor: 'rgb(6, 182, 212)', // Cyan
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         backgroundColor: (context: any) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ctx = (context as any).chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(6, 182, 212, 0.5)');
          gradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
          return gradient;
        },
         tension: 0.4,
       },
    ],
  };

  // Override options to remove title since CardHeader has it
  const chartOptions = {
    ...options,
    plugins: {
      ...options.plugins,
      title: { display: false },
      legend: {
         display: true,
         position: 'top' as const,
         align: 'end' as const,
         labels: {
            boxWidth: 10,
            usePointStyle: true,
            pointStyle: 'circle',
         }
      }
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
    }
  };

  return (
    <Card className="col-span-4 h-full">
      <CardHeader>
        <CardTitle>User Growth & Revenue</CardTitle>
        <CardDescription>Weekly cumulative growth for current month</CardDescription>
      </CardHeader>
      <CardContent className="h-[350px]">
        <div className="relative w-full h-full">
          <Line options={chartOptions} data={data} />
        </div>
      </CardContent>
    </Card>
  );
}
