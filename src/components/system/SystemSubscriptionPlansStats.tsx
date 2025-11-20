import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, CheckCircle2, XCircle, Building2 } from 'lucide-react';
import { useSubscriptionPlanStats } from '@/hooks/useSubscriptionPlanStats';
import { Skeleton } from '@/components/ui/skeleton';

export const SystemSubscriptionPlansStats: React.FC = () => {
  const { data: stats, isLoading } = useSubscriptionPlanStats();

  const statCards = [
    {
      title: 'Total Plans',
      value: stats?.total_plans || 0,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      title: 'Active Plans',
      value: stats?.active_plans || 0,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
    },
    {
      title: 'Inactive Plans',
      value: stats?.inactive_plans || 0,
      icon: XCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 dark:bg-gray-950',
    },
    {
      title: 'Organizations',
      value: stats?.total_organizations || 0,
      icon: Building2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`${stat.bgColor} p-2 rounded-md`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
