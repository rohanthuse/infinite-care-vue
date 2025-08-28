
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SystemTenantsStats } from "@/components/system/SystemTenantsStats";
import { Badge } from "@/components/ui/badge";
import { User, Users } from "lucide-react";

interface OrganizationWithUsers {
  id: string;
  name: string;
  slug: string;
  subscription_plan: string;
  subscription_status: string;
  system_users: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    is_active: boolean;
  }[];
}

const fetchOrganizationsWithUsers = async (): Promise<OrganizationWithUsers[]> => {
  console.log('[TenantOrganizationsTab] Fetching organizations with users...');
  const startTime = performance.now();

  // Use a single query to get all organization data with users
  const { data, error } = await supabase
    .from('organizations')
    .select(`
      id,
      name,
      slug,
      subscription_plan,
      subscription_status,
      organization_members!inner(
        user_id,
        role,
        status,
        auth_users:user_id(
          id,
          email
        )
      )
    `)
    .eq('organization_members.status', 'active')
    .order('name');

  if (error) {
    console.error('[TenantOrganizationsTab] Error fetching organizations:', error);
    throw error;
  }

  // Transform the data to match our interface
  const organizations: OrganizationWithUsers[] = (data || []).map(org => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    subscription_plan: org.subscription_plan,
    subscription_status: org.subscription_status,
    system_users: (org.organization_members || []).map((member: any) => ({
      id: member.user_id,
      first_name: member.auth_users?.email?.split('@')[0] || 'User',
      last_name: '',
      email: member.auth_users?.email || '',
      role: member.role,
      is_active: member.status === 'active',
    })),
  }));

  const endTime = performance.now();
  console.log(`[TenantOrganizationsTab] Data fetched in ${endTime - startTime}ms`);
  
  return organizations;
};

export const TenantOrganizationsTab: React.FC = () => {
  const { data: organizationsWithUsers, isLoading, error } = useQuery({
    queryKey: ['tenant-organizations-with-users'],
    queryFn: fetchOrganizationsWithUsers,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  const stats = {
    totalTenants: organizationsWithUsers?.length ?? 0,
    activeUsers: organizationsWithUsers?.reduce((total, org) => 
      total + org.system_users.filter(user => user.is_active).length, 0) ?? 0,
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
                          <span>{org.system_users.length} total</span>
                        </Badge>
                        <Badge variant="secondary" className="flex items-center space-x-1">
                          <span>{org.system_users.filter(user => user.is_active).length} active</span>
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
                                  {!user.is_active && <span className="ml-1 text-xs text-destructive">(Inactive)</span>}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {user.email}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className="text-xs">
                                  {user.role}
                                </Badge>
                                <Badge 
                                  variant={user.is_active ? 'default' : 'secondary'}
                                  className={`text-xs ${user.is_active ? 'bg-green-100 text-green-800' : ''}`}
                                >
                                  {user.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
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
