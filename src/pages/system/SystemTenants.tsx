import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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

export default function SystemTenants() {
  const { user } = useSystemAuth();
  const navigate = useNavigate();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch tenant statistics
  const { data: stats } = useQuery({
    queryKey: ['tenant-stats'],
    queryFn: async () => {
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select(`
          id,
          subscription_plan,
          created_at,
          organization_members(user_id, status)
        `);

      if (error) throw error;

      const totalTenants = orgs.length;
      const activeUsers = orgs.reduce((sum, org) => 
        sum + (org.organization_members || []).filter(m => m.status === 'active').length, 0
      );
      
      // Calculate growth (placeholder logic)
      const thisMonth = orgs.filter(org => 
        new Date(org.created_at) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      ).length;
      
      const lastMonth = orgs.filter(org => {
        const orgDate = new Date(org.created_at);
        const lastMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
        const lastMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth(), 0);
        return orgDate >= lastMonthStart && orgDate <= lastMonthEnd;
      }).length;

      const growthRate = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;

      return {
        totalTenants,
        activeUsers,
        totalRevenue: '£45.2K', // Placeholder
        growthRate: `${growthRate >= 0 ? '+' : ''}${growthRate}%`
      };
    },
    enabled: !!user
  });

  // Fetch tenant list
  const { data: tenants, isLoading } = useQuery({
    queryKey: ['system-tenants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          id,
          name,
          subdomain,
          contact_email,
          subscription_plan,
          subscription_status,
          created_at,
          organization_members(user_id, status)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(org => ({
        ...org,
        activeUsers: (org.organization_members || []).filter(m => m.status === 'active').length
      }));
    },
    enabled: !!user
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <DashboardHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground">Tenant Organizations</h1>
            <p className="text-muted-foreground">Manage and monitor all tenant organizations</p>
          </div>
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
        />

        <CreateTenantDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      </main>
    </div>
  );
}