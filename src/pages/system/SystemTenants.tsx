import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSystemAuth } from '@/contexts/SystemAuthContext';
import { DashboardHeader } from '@/components/DashboardHeader';
import { SystemTenantsInfoHeader } from '@/components/system/SystemTenantsInfoHeader';
import { SystemTenantsStats } from '@/components/system/SystemTenantsStats';
import { TenantsTable } from '@/components/system/TenantsTable';
import { CreateTenantDialog } from '@/components/system/CreateTenantDialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function SystemTenants() {
  const { user } = useSystemAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleCreateSuccess = () => {
    // Invalidate queries to refresh the data
    queryClient.invalidateQueries({ queryKey: ['tenant-stats'] });
    queryClient.invalidateQueries({ queryKey: ['system-tenants'] });
    setIsCreateDialogOpen(false);
    toast.success('Tenant created successfully! The list has been refreshed.');
  };

  const handleViewTenant = (tenant: any) => {
    // For now, show tenant details in a toast
    toast.info(`Viewing details for ${tenant.name}`, {
      description: `Subdomain: ${tenant.subdomain} | Plan: ${tenant.subscription_plan} | Status: ${tenant.subscription_status}`
    });
  };

  const handleEditTenant = (tenant: any) => {
    // For now, show edit intent
    toast.info(`Edit functionality for ${tenant.name} coming soon`);
  };

  const handleDeleteTenant = (tenant: any) => {
    // For now, show delete confirmation
    toast.warning(`Delete functionality for ${tenant.name} coming soon`, {
      description: 'This will permanently remove the tenant and all associated data.'
    });
  };

  // Fetch tenant statistics
  const { data: stats, error: statsError } = useQuery({
    queryKey: ['tenant-stats'],
    queryFn: async () => {
      console.log('Fetching tenant stats...');
      
      // Simplified query without nested organization_members
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select('id, subscription_plan, created_at');

      if (error) {
        console.error('Stats query error:', error);
        throw error;
      }

      console.log('Stats orgs fetched:', orgs?.length || 0);

      // Get organization members count separately
      const { data: members, error: membersError } = await supabase
        .from('organization_members')
        .select('organization_id, status')
        .eq('status', 'active');

      if (membersError) {
        console.error('Members query error:', membersError);
        // Don't throw, just use 0 for active users
      }

      const totalTenants = orgs?.length || 0;
      const activeUsers = members?.length || 0;
      
      // Calculate growth (placeholder logic)
      const thisMonth = orgs?.filter(org => 
        new Date(org.created_at) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      ).length || 0;
      
      const lastMonth = orgs?.filter(org => {
        const orgDate = new Date(org.created_at);
        const lastMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
        const lastMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth(), 0);
        return orgDate >= lastMonthStart && orgDate <= lastMonthEnd;
      }).length || 0;

      const growthRate = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;

      return {
        totalTenants,
        activeUsers,
        totalRevenue: '£45.2K', // Placeholder
        growthRate: `${growthRate >= 0 ? '+' : ''}${growthRate}%`
      };
    },
    enabled: !!user,
    retry: 2
  });

  // Log stats errors
  if (statsError) {
    console.error('Stats error:', statsError);
  }

  // Fetch tenant list
  const { data: tenants, isLoading, error: tenantsError } = useQuery({
    queryKey: ['system-tenants'],
    queryFn: async () => {
      console.log('Fetching tenants list...');
      
      // Simplified query without nested organization_members
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          id,
          name,
          subdomain,
          contact_email,
          subscription_plan,
          subscription_status,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Tenants query error:', error);
        throw error;
      }

      console.log('Tenants fetched:', data?.length || 0, data);

      // Get active users count for each organization separately
      const { data: membersData, error: membersError } = await supabase
        .from('organization_members')
        .select('organization_id, status')
        .eq('status', 'active');

      if (membersError) {
        console.error('Members query error:', membersError);
      }

      // Map active users to organizations
      const memberCounts = membersData?.reduce((acc, member) => {
        acc[member.organization_id] = (acc[member.organization_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return data?.map(org => ({
        ...org,
        activeUsers: memberCounts[org.id] || 0
      })) || [];
    },
    enabled: !!user,
    retry: 2
  });

  // Log tenants errors
  if (tenantsError) {
    console.error('Tenants error:', tenantsError);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <DashboardHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/system-dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <SystemTenantsInfoHeader 
          totalTenants={stats?.totalTenants || 0}
          onAddTenant={() => setIsCreateDialogOpen(true)}
        />
        
        <SystemTenantsStats 
          stats={stats}
          isLoading={!stats}
        />
        
        <TenantsTable 
          tenants={tenants}
          isLoading={isLoading}
          onAddTenant={() => setIsCreateDialogOpen(true)}
          onViewTenant={handleViewTenant}
          onEditTenant={handleEditTenant}
          onDeleteTenant={handleDeleteTenant}
        />

        <CreateTenantDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSuccess={handleCreateSuccess}
        />
      </main>
    </div>
  );
}