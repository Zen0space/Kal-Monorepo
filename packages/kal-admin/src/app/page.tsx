"use client";

import { StatisticChart } from "@/components/StatisticChart";
import { trpc } from "@/lib/trpc";
import { Users, ShoppingBag, TrendingUp, Utensils } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Home() {
  const { data: foodStats, isLoading: isFoodLoading } = trpc.food.stats.useQuery();
  const { data: userStats, isLoading: isUserLoading } = trpc.user.stats.useQuery();
  const { data: userGrowth } = trpc.user.growth.useQuery();

  const stats = [
    {
      label: 'System Foods',
      value: isFoodLoading ? '...' : foodStats?.foods.toLocaleString() ?? 0,
      description: 'Total items in DB',
      icon: Utensils,
    },
    {
      label: 'Halal Foods',
      value: isFoodLoading ? '...' : foodStats?.halal.toLocaleString() ?? 0,
      description: 'Certified Halal',
      icon: Users, 
    },
    {
      label: 'Total Records',
      value: isFoodLoading ? '...' : foodStats?.total.toLocaleString() ?? 0,
      description: 'Combined records',
      icon: ShoppingBag,
    },
    {
      label: 'Registered Users',
      value: isUserLoading ? '...' : userStats?.total.toLocaleString() ?? 0,
      description: 'Total users in DB',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <StatisticChart userGrowth={userGrowth} />
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    System Verified
                  </p>
                  <p className="text-sm text-muted-foreground">
                    All systems operational
                  </p>
                </div>
                <div className="ml-auto font-medium text-green-500">
                  +100%
                </div>
              </div>
              {/* Placeholder for activity */}
              <div className="flex items-center justify-center text-sm text-muted-foreground h-[200px]">
                No recent activity logs
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
