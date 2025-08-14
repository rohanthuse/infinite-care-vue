import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SystemTenantsStats } from "@/components/system/SystemTenantsStats";
import { SystemUsersStats } from "@/components/system/SystemUsersStats";
import { useSystemUserStats } from "@/hooks/useSystemUsers";

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
    <div className="space-y-8">
      <section>
        <h3 className="text-lg font-semibold mb-4">Tenant Organizations</h3>
        <SystemTenantsStats
          stats={{ totalTenants, activeUsers: activeUsersSum }}
          isLoading={tenantsLoading}
        />

        <div className="mt-4">
          <h4 className="text-md font-medium mb-2">Top Tenants by Active Users</h4>
          {tenantsLoading ? (
            <p className="text-muted-foreground">Loading top tenants...</p>
          ) : tenantsError ? (
            <p className="text-destructive">Failed to load tenants.</p>
          ) : topTenants.length === 0 ? (
            <p className="text-muted-foreground">No tenants found.</p>
          ) : (
            <ul className="divide-y divide-border">
              {topTenants.map((t, idx) => (
                <li key={(t.id ?? idx) as React.Key} className="py-2 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t.name || t.organization_name || t.subdomain || "Unnamed"}</p>
                    {t.subdomain && (
                      <p className="text-sm text-muted-foreground">{t.subdomain}</p>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">{t.activeUsers ?? 0} active</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-4">System Users</h3>
        <SystemUsersStats stats={userStats as any} isLoading={usersLoading} />
      </section>
    </div>
  );
};
