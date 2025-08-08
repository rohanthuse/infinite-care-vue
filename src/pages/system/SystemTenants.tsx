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
      console.log('[SystemTenants] Fetching tenant stats via edge function...')

      const { data, error } = await supabase.functions.invoke('list-system-tenants')
      if (error) {
        console.error('[SystemTenants] list-system-tenants error:', error)
        throw error
      }

      const tenants = (data as any)?.tenants || []
      const totalTenants = tenants.length
      const activeUsers = tenants.reduce((sum: number, t: any) => sum + (t.activeUsers || 0), 0)

      const now = new Date()
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

      const thisMonth = tenants.filter((t: any) => new Date(t.created_at) >= thisMonthStart).length
      const lastMonth = tenants.filter((t: any) => {
        const d = new Date(t.created_at)
        return d >= lastMonthStart && d <= lastMonthEnd
      }).length

      const growthRate = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0

      return {
        totalTenants,
        activeUsers,
        totalRevenue: '£45.2K',
        growthRate: `${growthRate >= 0 ? '+' : ''}${growthRate}%`
      }
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
      console.log('[SystemTenants] Fetching tenants list via edge function...')

      const { data, error } = await supabase.functions.invoke('list-system-tenants')
      if (error) {
        console.error('[SystemTenants] list-system-tenants error:', error)
        throw error
      }

      const tenants = (data as any)?.tenants || []
      console.log('[SystemTenants] Tenants fetched (edge):', tenants.length)
      return tenants
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