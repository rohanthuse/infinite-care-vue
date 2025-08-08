import React from "react";
import { useOrganizations } from "@/hooks/useOrganizations";
import { SystemTenantsStats } from "@/components/system/SystemTenantsStats";

export const TenantOrganizationsTab: React.FC = () => {
  const { data: organizations, isLoading, error } = useOrganizations();

  const stats = {
    totalTenants: organizations?.length ?? 0,
    activeUsers: 0,
  };

  return (
    <section>
      <SystemTenantsStats stats={stats} isLoading={isLoading} />

      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Tenant Organizations</h3>
        {isLoading && (
          <p className="text-muted-foreground">Loading tenants...</p>
        )}
        {!isLoading && error && (
          <p className="text-destructive">Failed to load tenants.</p>
        )}
        {!isLoading && !error && (
          <>
            {organizations && organizations.length > 0 ? (
              <ul className="divide-y divide-border">
                {organizations.map((org) => (
                  <li key={org.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{org.name}</p>
                      {org.subdomain && (
                        <p className="text-sm text-muted-foreground">{org.subdomain}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No tenant organizations found.</p>
            )}
          </>
        )}
      </div>
    </section>
  );
};
