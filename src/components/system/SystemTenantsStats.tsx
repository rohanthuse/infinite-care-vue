import React from 'react';
import { DashboardStat } from '@/components/dashboard/DashboardStat';
import { Building, Users } from 'lucide-react';

interface SystemTenantsStatsProps {
  stats: {
    totalTenants: number;
    activeUsers: number;
  } | undefined;
  isLoading?: boolean;
}


export const SystemTenantsStats = ({ stats, isLoading }: SystemTenantsStatsProps) => {
  const statsData = [
    {
      title: 'Total Tenants',
      value: stats?.totalTenants?.toString() || '0',
      change: '+12% from last month',
      icon: <Building className="h-5 w-5" />,
      positive: true,
    },
    {
      title: 'Active Users',
      value: stats?.activeUsers?.toString() || '0',
      change: '+8% from last month',
      icon: <Users className="h-5 w-5" />,
      positive: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
      {statsData.map((stat, index) => (
        <DashboardStat
          key={index}
          title={stat.title}
          value={stat.value}
          change={stat.change}
          icon={stat.icon}
          positive={stat.positive}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
};