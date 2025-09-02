import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Building2, Search, ArrowRight, MapPin, Globe, Loader2, Plus } from 'lucide-react';
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

  // Fetch branches with role-based filtering - super admins see all accessible branches
  const { data: branches, isLoading, error } = useQuery({
    queryKey: ['organization-branches', organizationId, userRole?.role, userRole?.id],
    queryFn: async () => {
      console.log('Fetching branches for organization:', organizationId, 'with role:', userRole?.role);
      
      if (userRole?.role === 'super_admin') {
        // Super admins can see ALL branches they have access to across organizations
        console.log('Fetching all accessible branches for super admin');
        
        // First, get all organizations the super admin has access to
        const { data: organizationAccess, error: orgError } = await supabase
          .from('app_admin_organizations')
          .select('organization_id')
          .eq('app_admin_id', userRole.id);

        if (orgError) {
          console.error('Error fetching organization access:', orgError);
          // Fallback: show branches from current organization only
          const { data, error } = await supabase
            .from('branches')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('status', 'Active');

          if (error) throw error;
          return data || [];
        }

        // Get all organization IDs the super admin has access to
        const orgIds = organizationAccess?.map(org => org.organization_id) || [organizationId];
        console.log('Super admin has access to organizations:', orgIds);

        // Fetch branches from all accessible organizations
        const { data, error } = await supabase
          .from('branches')
          .select('*')
          .in('organization_id', orgIds)
          .eq('status', 'Active')
          .order('name');

        if (error) {
          console.error('Error fetching super admin branches:', error);
          throw error;
        }

        console.log('All accessible branches for super admin:', data?.length, 'branches');
        return data || [];
      } else if (userRole?.role === 'branch_admin') {
        // Branch admins can only see their assigned branches
        // First get the assigned branch IDs
        const { data: adminBranches, error: adminError } = await supabase
          .from('admin_branches')
          .select('branch_id')
          .eq('admin_id', userRole.id);

        if (adminError) {
          console.error('Error fetching admin branches:', adminError);
          throw adminError;
        }

        if (!adminBranches || adminBranches.length === 0) {
          console.log('No branches assigned to branch admin');
          return [];
        }

        const branchIds = adminBranches.map(ab => ab.branch_id);

        // Then get the actual branches
        const { data, error } = await supabase
          .from('branches')
          .select('*')
          .eq('organization_id', organizationId)
          .ilike('status', 'active')
          .in('id', branchIds);

        if (error) {
          console.error('Error fetching branch admin branches:', error);
          throw error;
        }

        console.log('Branch admin branches:', data);
        return data || [];
      } else {
        // Other roles have no branch access
        console.log('User role has no branch access:', userRole?.role);
        return [];
      }
    },
    enabled: !!organizationId && !!userRole && !roleLoading,
  });

  const handleEnterBranch = (branch: Branch) => {
    // For tenant context, navigate to tenant-specific branch dashboard
    const encodedBranchName = encodeURIComponent(branch.name);
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
      className="bg-card rounded-lg border border-border p-6 mb-8"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {userRole?.role === 'super_admin' ? 'All Accessible Branches' : 'Organization Branches'}
            </h2>
            <p className="text-muted-foreground text-sm">
              {userRole?.role === 'super_admin' 
                ? 'Navigate to any branch across all organizations you manage'
                : 'Navigate to any branch within your organization'
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {branches?.length || 0} active branches
          </div>
          <AddBranchDialog />
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
              : "No active branches found for this organization."
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
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-border hover:border-primary/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1 line-clamp-1">
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
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {branch.currency}
                    </span>
                    <span className="capitalize">{branch.branch_type}</span>
                  </div>

                  <Button
                    onClick={() => handleEnterBranch(branch)}
                    className="w-full"
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