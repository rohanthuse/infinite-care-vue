import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SystemTenantsStats } from "@/components/system/SystemTenantsStats";
import { SystemUsersStats } from "@/components/system/SystemUsersStats";
import { useSystemUserStats } from "@/hooks/useSystemUsers";
import { DemoRequestsTable } from "@/components/system/DemoRequestsTable";
import { Building, Users, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TenantItem {
  id?: string;
  name?: string;
  organization_name?: string;
  subdomain?: string;
  activeUsers?: number;
  [key: string]: any;
}

export const SystemReports: React.FC = () => {
  const { data: tenants, isLoading: tenantsLoading, error: tenantsError } = useQuery<TenantItem[]>({
    queryKey: ["system-tenants"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("list-system-tenants");
      if (error) throw error;
      const list = Array.isArray(data) ? data : (data as any)?.tenants || [];
      return list as TenantItem[];
    },
  });

  const tenantsList = tenants ?? [];
  const totalTenants = tenantsList.length;
  const activeUsersSum = tenantsList.reduce((sum, t) => sum + (t?.activeUsers ?? 0), 0);
  const topTenants = [...tenantsList]
    .sort((a, b) => (b?.activeUsers ?? 0) - (a?.activeUsers ?? 0))
    .slice(0, 5);

  // System users stats
  // Using existing hook to keep consistency with dashboard
  // Importing here avoids UI changes elsewhere
  const { data: userStats, isLoading: usersLoading } = useSystemUserStats();

  return (
    <div className="space-y-6 p-6">
      {/* Tenant Organizations Section */}
      <section>
        <div className="border-b border-border/50 pb-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Building className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Tenant Organizations</h3>
            <Badge variant="secondary" className="text-xs">
              {totalTenants} total
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Overview of all tenant organizations and their user activity
          </p>
        </div>

        <div className="bg-card/30 backdrop-blur-sm border border-border/30 rounded-lg p-4 mb-6">
          <SystemTenantsStats
            stats={{ totalTenants, activeUsers: activeUsersSum }}
            isLoading={tenantsLoading}
          />
        </div>

        <div className="bg-card/30 backdrop-blur-sm border border-border/30 rounded-lg">
          <div className="p-4 border-b border-border/30">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h4 className="text-md font-medium">Top Performing Tenants</h4>
              <Badge variant="outline" className="text-xs">
                By Active Users
              </Badge>
            </div>
          </div>
          
          <div className="p-4">
            {tenantsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2 text-muted-foreground">Loading tenant data...</span>
              </div>
            ) : tenantsError ? (
              <div className="text-center py-8">
                <p className="text-destructive">Failed to load tenant data</p>
                <p className="text-xs text-muted-foreground mt-1">Please check system connectivity</p>
              </div>
            ) : topTenants.length === 0 ? (
              <div className="text-center py-8">
                <Building className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No tenant organizations found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topTenants.map((t, idx) => (
                  <div key={(t.id ?? idx) as React.Key} className="flex items-center justify-between p-3 bg-card/20 rounded-lg border border-border/20">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                        <span className="text-sm font-medium text-primary">#{idx + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {t.name || t.organization_name || t.subdomain || "Unnamed Organization"}
                        </p>
                        {t.subdomain && (
                          <p className="text-sm text-muted-foreground">{t.subdomain}.app</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {t.activeUsers ?? 0} active users
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* System Users Section */}
      <section>
        <div className="border-b border-border/50 pb-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">System Users</h3>
            <Badge variant="secondary" className="text-xs">
              {userStats?.total ?? 0} total
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Organization super admin accounts and access management
          </p>
        </div>

        <div className="bg-card/30 backdrop-blur-sm border border-border/30 rounded-lg p-4">
          <SystemUsersStats stats={userStats} isLoading={usersLoading} />
        </div>
      </section>

      {/* Demo Requests Section */}
      <section>
        <div className="border-b border-border/50 pb-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Demo Requests</h3>
            <Badge variant="secondary" className="text-xs">
              Lead Management
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Track and manage demo requests from potential customers
          </p>
        </div>

        <div className="bg-card/30 backdrop-blur-sm border border-border/30 rounded-lg">
          <DemoRequestsTable />
        </div>
      </section>
    </div>
  );
};
