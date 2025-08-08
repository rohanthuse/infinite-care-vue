import React from 'react';
import { DashboardStat } from '@/components/dashboard/DashboardStat';
import { Users, Shield, UserCheck, UserX } from 'lucide-react';

interface SystemUsersStatsProps {
  stats:
    | {
        total?: number;
        superAdmins?: number;
        active?: number;
        inactive?: number;
      }
    | undefined;
  isLoading?: boolean;
}

export const SystemUsersStats = ({ stats, isLoading }: SystemUsersStatsProps) => {
  const statsData = [
    {
      title: 'Total Users',
      value: (stats?.total ?? 0).toString(),
      change: 'This month',
      icon: <Users className="h-5 w-5" />,
      positive: true,
    },
    {
      title: 'Super Admins',
      value: (stats?.superAdmins ?? 0).toString(),
      change: 'This month',
      icon: <Shield className="h-5 w-5" />,
      positive: true,
    },
    {
      title: 'Active Users',
      value: (stats?.active ?? 0).toString(),
      change: 'This month',
      icon: <UserCheck className="h-5 w-5" />,
      positive: true,
    },
    {
      title: 'Inactive Users',
      value: (stats?.inactive ?? 0).toString(),
      change: 'This month',
      icon: <UserX className="h-5 w-5" />,
      positive: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
