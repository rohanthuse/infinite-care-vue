import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Building2, Search, ArrowRight, MapPin, Globe, Loader2, Plus, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { AddBranchDialog } from '@/components/AddBranchDialog';
import { useUserRole } from '@/hooks/useUserRole';

interface Branch {
  id: string;
  name: string;
  country: string;
  currency: string;
  status: string;
  branch_type: string;
  organization_id: string;
  client_count?: number;
}

interface TenantBranchNavigationProps {
  organizationId: string;
}

export const TenantBranchNavigation: React.FC<TenantBranchNavigationProps> = ({ 
  organizationId 
}) => {
  const navigate = useNavigate();
  const { tenantSlug } = useTenant();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: userRole, isLoading: roleLoading, error: roleError } = useUserRole();

  // Fetch branches for this organization with role-based filtering
  const { data: branches, isLoading, error } = useQuery({
    queryKey: ['organization-branches', organizationId, userRole?.role],
    queryFn: async () => {
      console.log('[TenantBranchNavigation] Fetching branches for organization:', organizationId, 'with role:', userRole?.role);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[TenantBranchNavigation] No authenticated user');
        return [];
      }

      console.log('[TenantBranchNavigation] Role check order:', {
        userRole: userRole?.role,
        userId: user.id
      });

      // PRIORITY 1: Organization members with owner role get FULL access
      // Only 'owner' gets full access - 'branch_admin' role should follow branch restrictions
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('role, status')
        .eq('organization_id', organizationId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (orgMember && ['owner'].includes(orgMember.role)) {
        console.log('[TenantBranchNavigation] User is organization owner - fetching ALL branches');
        
        const { data, error } = await supabase
          .from('branches')
          .select('*')
          .eq('organization_id', organizationId)
          .ilike('status', 'active');

        if (error) {
          console.error('[TenantBranchNavigation] Error fetching organization branches:', error);
          throw error;
        }

        // Fetch active client counts separately (status = Active AND active_until is null or >= today)
        const branchIds = data?.map(b => b.id) || [];
        const today = new Date().toISOString().split('T')[0];
        
        const { data: activeClients } = await supabase
          .from('clients')
          .select('branch_id')
          .in('branch_id', branchIds)
          .eq('status', 'Active')
          .or(`active_until.is.null,active_until.gte.${today}`);

        // Count clients per branch
        const countsByBranch = activeClients?.reduce((acc, client) => {
          acc[client.branch_id] = (acc[client.branch_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

        const transformedData = data?.map(branch => ({
          ...branch,
          client_count: countsByBranch[branch.id] || 0
        }));

        console.log('[TenantBranchNavigation] Organisation branches (all):', transformedData, 'for org member role:', orgMember.role);
        return transformedData || [];
      }

      // PRIORITY 2: Branch admins without org admin role get RESTRICTED view (assigned branches only)
      if (userRole?.role === 'branch_admin') {
        console.log('[TenantBranchNavigation] User is branch_admin - fetching ONLY assigned branches');
        
        const { data: adminBranches, error: adminError } = await supabase
          .from('admin_branches')
          .select('branch_id')
          .eq('admin_id', user.id);

        if (adminError) {
          console.error('[TenantBranchNavigation] Error fetching admin branches:', adminError);
          throw adminError;
        }

        if (!adminBranches || adminBranches.length === 0) {
          console.log('[TenantBranchNavigation] No branches assigned to branch admin');
          return [];
        }

        const branchIds = adminBranches.map(ab => ab.branch_id);
        console.log('[TenantBranchNavigation] Branch admin assigned to branches:', branchIds);

        const { data, error } = await supabase
          .from('branches')
          .select('*')
          .eq('organization_id', organizationId)
          .ilike('status', 'active')
          .in('id', branchIds);

        if (error) {
          console.error('[TenantBranchNavigation] Error fetching branch admin branches:', error);
          throw error;
        }

        // Fetch active client counts for these branches
        const today = new Date().toISOString().split('T')[0];
        
        const { data: activeClients } = await supabase
          .from('clients')
          .select('branch_id')
          .in('branch_id', branchIds)
          .eq('status', 'Active')
          .or(`active_until.is.null,active_until.gte.${today}`);

        const countsByBranch = activeClients?.reduce((acc, client) => {
          acc[client.branch_id] = (acc[client.branch_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

        const transformedData = data?.map(branch => ({
          ...branch,
          client_count: countsByBranch[branch.id] || 0
        }));

        console.log('[TenantBranchNavigation] Branch admin branches (filtered):', transformedData);
        return transformedData || [];
      }

      // PRIORITY 3: Super admins get FULL access (all branches)
      if (userRole?.role === 'super_admin') {
        console.log('[TenantBranchNavigation] Fetching all branches for super admin');
        
        const { data, error } = await supabase
          .from('branches')
          .select('*')
          .eq('organization_id', organizationId)
          .ilike('status', 'active');

        if (error) {
          console.error('[TenantBranchNavigation] Error fetching organization branches:', error);
          throw error;
        }

        // Fetch active client counts for super admin
        const branchIds = data?.map(b => b.id) || [];
        const today = new Date().toISOString().split('T')[0];
        
        const { data: activeClients } = await supabase
          .from('clients')
          .select('branch_id')
          .in('branch_id', branchIds)
          .eq('status', 'Active')
          .or(`active_until.is.null,active_until.gte.${today}`);

        const countsByBranch = activeClients?.reduce((acc, client) => {
          acc[client.branch_id] = (acc[client.branch_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

        const transformedData = data?.map(branch => ({
          ...branch,
          client_count: countsByBranch[branch.id] || 0
        }));

        console.log('[TenantBranchNavigation] Organisation branches (super admin):', transformedData);
        return transformedData || [];
      }

      // Unknown roles have no branch access
      console.log('[TenantBranchNavigation] User has no branch access');
      return [];
    },
    enabled: !!organizationId && !!userRole && !roleLoading,
  });

  const handleEnterBranch = (branch: Branch) => {
    // For tenant context, navigate to tenant-specific branch dashboard
    // Trim branch name to handle any leading/trailing whitespace
    const encodedBranchName = encodeURIComponent(branch.name.trim());
    console.log('Navigating to tenant branch:', branch.id, branch.name, encodedBranchName);
    
    // Use tenant-aware path
    if (tenantSlug) {
      navigate(`/${tenantSlug}/branch-dashboard/${branch.id}/${encodedBranchName}`);
    } else {
      // Fallback for non-tenant context
      navigate(`/branch-dashboard/${branch.id}/${encodedBranchName}`);
    }
  };

  const filteredBranches = branches?.filter(branch =>
    branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    branch.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    branch.branch_type.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (roleLoading || isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border p-6 mb-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">
            {roleLoading ? 'Loading user permissions...' : 'Loading organization branches...'}
          </span>
        </div>
      </div>
    );
  }

  if (error || roleError) {
    return (
      <div className="bg-card rounded-lg border border-border p-6 mb-8">
        <div className="text-center py-8">
          <p className="text-destructive">
            Error loading {roleError ? 'user permissions' : 'branches'}: {(error || roleError)?.message}
          </p>
        </div>
      </div>
    );
  }

  // Handle case where user has no branch access
  if (userRole && !['super_admin', 'branch_admin'].includes(userRole.role)) {
    return (
      <div className="bg-card rounded-lg border border-border p-6 mb-8">
        <div className="text-center py-8">
          <p className="text-muted-foreground">You don't have permission to access branches.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-gradient-to-br from-card via-card to-blue-50/30 dark:to-blue-950/10 rounded-xl border border-border shadow-md shadow-blue-100/20 dark:shadow-blue-900/10 p-6 mb-8 relative overflow-hidden"
    >
      {/* Gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500" />
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl shadow-sm">
            <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Organisation Branches</h2>
            <p className="text-muted-foreground text-sm">Navigate to any branch within your organisation</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {branches?.length || 0} active branches
          </div>
          {/* Hide "New Branch" button for branch admins */}
          {userRole?.role !== 'branch_admin' && <AddBranchDialog />}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search branches by name, country, or type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Branches Grid */}
      {filteredBranches.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchQuery 
            ? "No branches match your search." 
            : userRole?.role === 'branch_admin' 
              ? "No branches assigned to you." 
              : "No active branches found for this organisation."
          }
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBranches.map((branch) => (
            <motion.div
              key={branch.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="hover:shadow-lg hover:shadow-blue-100/30 dark:hover:shadow-blue-900/20 transition-all cursor-pointer border-border hover:border-primary/50 bg-gradient-to-br from-card to-blue-50/20 dark:to-blue-950/10 border-t-2 border-t-blue-500 group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {branch.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <MapPin className="h-3 w-3" />
                        <span>{branch.country}</span>
                      </div>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="text-xs"
                    >
                      {branch.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {branch.currency}
                      </span>
                      <span className="capitalize">{branch.branch_type}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-xs">
                      <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 rounded-md">
                        <Users className="h-3 w-3" />
                        <span className="font-medium">{branch.client_count || 0}</span>
                        <span className="text-blue-600/70 dark:text-blue-400/70">
                          {branch.client_count === 1 ? 'client' : 'clients'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleEnterBranch(branch)}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-sm shadow-blue-200/50 dark:shadow-blue-900/30"
                    size="sm"
                  >
                    Enter Branch
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};