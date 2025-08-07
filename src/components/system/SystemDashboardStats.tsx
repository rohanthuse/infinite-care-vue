import React from "react";
import { DashboardStat } from "@/components/dashboard/DashboardStat";
import { Building, Users, Activity, Database, Globe, Shield } from "lucide-react";

interface SystemStatsData {
  totalTenants: number;
  totalUsers: number;
  systemUptime: string;
  databaseHealth: string;
  activeConnections: number;
  securityScore: string;
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6 mb-8">
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
        title="System Users"
        value={stats.totalUsers.toString()}
        change="+3 this week"
        icon={<Users className="h-5 w-5" />}
        positive={true}
        isLoading={isLoading}
        onClick={() => onStatClick?.('users')}
      />
      
      <DashboardStat
        title="System Uptime"
        value={stats.systemUptime}
        change="99.9% availability"
        icon={<Activity className="h-5 w-5" />}
        positive={true}
        isLoading={isLoading}
        onClick={() => onStatClick?.('uptime')}
      />
      
      <DashboardStat
        title="Database Health"
        value={stats.databaseHealth}
        change="Optimal performance"
        icon={<Database className="h-5 w-5" />}
        positive={true}
        isLoading={isLoading}
        onClick={() => onStatClick?.('database')}
      />
      
      <DashboardStat
        title="Active Connections"
        value={stats.activeConnections.toString()}
        change="+15% peak hours"
        icon={<Globe className="h-5 w-5" />}
        positive={true}
        isLoading={isLoading}
        onClick={() => onStatClick?.('connections')}
      />
      
      <DashboardStat
        title="Security Score"
        value={stats.securityScore}
        change="All checks passed"
        icon={<Shield className="h-5 w-5" />}
        positive={true}
        isLoading={isLoading}
        onClick={() => onStatClick?.('security')}
      />
    </div>
  );
};