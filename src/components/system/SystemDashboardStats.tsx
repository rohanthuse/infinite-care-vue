import React from "react";
import { DashboardStat } from "@/components/dashboard/DashboardStat";
import { Building, Users, FileText } from "lucide-react";

interface SystemStatsData {
  totalTenants: number;
  totalUsers: number;
  systemUptime: string;
  databaseHealth: string;
  securityScore: string;
  demoRequests: {
    total: number;
    pending: number;
  };
}

interface SystemDashboardStatsProps {
  stats: SystemStatsData;
  isLoading?: boolean;
  onStatClick?: (statType: string) => void;
}

export const SystemDashboardStats = ({
  stats,
  isLoading = false,
  onStatClick
}: SystemDashboardStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <DashboardStat
        title="Total Tenants"
        value={stats.totalTenants.toString()}
        change="+12% this month"
        icon={<Building className="h-5 w-5" />}
        positive={true}
        isLoading={isLoading}
        onClick={() => onStatClick?.('tenants')}
      />
      
      <DashboardStat
        title="Tenant Users"
        value={stats.totalUsers.toString()}
        change="+3 this week"
        icon={<Users className="h-5 w-5" />}
        positive={true}
        isLoading={isLoading}
        onClick={() => onStatClick?.('users')}
      />
      
      <DashboardStat
        title="Demo Requests"
        value={stats.demoRequests.total.toString()}
        change={stats.demoRequests.pending > 0 ? `${stats.demoRequests.pending} pending` : "All reviewed"}
        icon={<FileText className="h-5 w-5" />}
        positive={stats.demoRequests.pending === 0}
        isLoading={isLoading}
        onClick={() => onStatClick?.('demo_requests')}
      />
      
    </div>
  );
};