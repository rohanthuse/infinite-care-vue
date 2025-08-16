import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';

import { supabase } from '@/integrations/supabase/client';
import { useSystemAuth } from '@/contexts/SystemAuthContext';
import { DashboardHeader } from '@/components/DashboardHeader';
import { SystemTenantsInfoHeader } from '@/components/system/SystemTenantsInfoHeader';
import { SystemTenantsStats } from '@/components/system/SystemTenantsStats';
import { TenantsTable } from '@/components/system/TenantsTable';
import { CreateTenantDialog } from '@/components/system/CreateTenantDialog';


import { toast } from 'sonner';
import { ViewTenantDialog } from '@/components/system/ViewTenantDialog';
import { EditTenantDialog } from '@/components/system/EditTenantDialog';
import { ConfirmDeleteTenantDialog } from '@/components/system/ConfirmDeleteTenantDialog';
import { Tabs } from '@/components/ui/tabs';
import { SystemSectionTabs } from '@/components/system/SystemSectionTabs';
import { SystemInfoHeader } from '@/components/system/SystemInfoHeader';

export default function SystemTenants() {
  const { user } = useSystemAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Check for action=create URL parameter and auto-open dialog
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'create') {
      setIsCreateDialogOpen(true);
      // Remove the action parameter from URL
      params.delete('action');
      navigate(`${location.pathname}${params.toString() ? '?' + params.toString() : ''}`, { replace: true });
    }
  }, [location.search, navigate, location.pathname]);

  const handleCreateSuccess = () => {
    // Invalidate queries to refresh the data
    queryClient.invalidateQueries({ queryKey: ['tenant-stats'] });
    queryClient.invalidateQueries({ queryKey: ['system-tenants'] });
    setIsCreateDialogOpen(false);
    toast.success('Tenant created successfully! The list has been refreshed.');
  };

  const handleViewTenant = (tenant: any) => {
    setSelectedTenant(tenant);
    setIsViewOpen(true);
  };

  const handleEditTenant = (tenant: any) => {
    setSelectedTenant(tenant);
    setIsEditOpen(true);
  };

  const handleDeleteTenant = (tenant: any) => {
    setSelectedTenant(tenant);
    setIsDeleteOpen(true);
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
        {/* System Info Header */}
        <SystemInfoHeader
          systemInfo={{
            status: "Operational",
            version: "v1.0.0",
            uptime: "99.99%",
            serverLocation: "EU-West",
            lastUpdate: new Date().toLocaleString(),
          }}
          onQuickAction={() => {}}
        />
        {/* System Tabs */}
        <Tabs value="tenants" className="w-full">
          <SystemSectionTabs value="tenants" />
        </Tabs>

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

        <ViewTenantDialog
          open={isViewOpen}
          onOpenChange={setIsViewOpen}
          tenant={selectedTenant}
        />

        <EditTenantDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          tenant={selectedTenant}
          onSuccess={handleCreateSuccess}
        />

        <ConfirmDeleteTenantDialog
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          tenant={selectedTenant}
          onSuccess={handleCreateSuccess}
        />
      </main>
    </div>
  );
}