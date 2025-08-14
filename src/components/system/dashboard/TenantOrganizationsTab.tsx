import React from "react";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useOrganizationsWithUsers } from "@/hooks/useOrganizationsWithUsers";
import { SystemTenantsStats } from "@/components/system/SystemTenantsStats";
import { Badge } from "@/components/ui/badge";
import { User, Users } from "lucide-react";

export const TenantOrganizationsTab: React.FC = () => {
  const { data: organizations, isLoading, error } = useOrganizations();
  const { data: organizationsWithUsers, isLoading: isLoadingUsers } = useOrganizationsWithUsers();

  const stats = {
    totalTenants: organizations?.length ?? 0,
    activeUsers: organizationsWithUsers?.reduce((total, org) => total + org.system_users.length, 0) ?? 0,
  };

  return (
    <section>
      <SystemTenantsStats stats={stats} isLoading={isLoading} />

      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Tenant Organizations</h3>
        {(isLoading || isLoadingUsers) && (
          <p className="text-muted-foreground">Loading tenants...</p>
        )}
        {!isLoading && !isLoadingUsers && error && (
          <p className="text-destructive">Failed to load tenants.</p>
        )}
        {!isLoading && !isLoadingUsers && !error && (
          <>
            {organizationsWithUsers && organizationsWithUsers.length > 0 ? (
              <div className="space-y-4">
                {organizationsWithUsers.map((org) => (
                  <div key={org.id} className="border border-border/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-foreground">{org.name}</h4>
                        {org.slug && (
                          <p className="text-sm text-muted-foreground">{org.slug}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{org.system_users.length} users</span>
                        </Badge>
                        <Badge 
                          variant={org.subscription_status === 'active' ? 'success' : 'secondary'}
                        >
                          {org.subscription_plan}
                        </Badge>
                      </div>
                    </div>
                    
                    {org.system_users.length > 0 ? (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-muted-foreground">Assigned Users:</h5>
                        <div className="flex flex-wrap gap-2">
                          {org.system_users.map((user) => (
                            <div 
                              key={user.id}
                              className="flex items-center space-x-2 bg-muted/30 rounded-md px-3 py-1"
                            >
                              <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                                <User className="h-3 w-3 text-primary" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {user.first_name} {user.last_name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {user.email}
                                </span>
                              </div>
                              <Badge 
                                variant={user.is_active ? 'success' : 'destructive'}
                                className="text-xs"
                              >
                                {user.role}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No users assigned</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No tenant organizations found.</p>
            )}
          </>
        )}
      </div>
    </section>
  );
};
