import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSystemAuth } from '@/contexts/SystemAuthContext';
import { CustomButton } from '@/components/ui/CustomButton';
import { CreateTenantDialog } from '@/components/system/CreateTenantDialog';
import { ArrowLeft, Building, Plus, Settings, Users, Eye, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

export default function SystemTenants() {
  const navigate = useNavigate();
  const { user } = useSystemAuth();
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
          organization_members!inner(user_id, status)
        `);

      if (error) throw error;

      const totalTenants = orgs.length;
      const activeUsers = orgs.reduce((sum, org) => 
        sum + org.organization_members.filter(m => m.status === 'active').length, 0
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
          organization_members!inner(user_id, status)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(org => ({
        ...org,
        activeUsers: org.organization_members.filter(m => m.status === 'active').length
      }));
    },
    enabled: !!user
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <CustomButton
                variant="ghost"
                size="sm"
                onClick={() => navigate('/system-dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </CustomButton>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Building className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Tenant Organizations</h1>
                <p className="text-sm text-muted-foreground">Manage tenant organizations</p>
              </div>
            </div>
            
            <CustomButton 
              className="flex items-center space-x-2"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span>Add Tenant</span>
            </CustomButton>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tenants</p>
                <p className="text-2xl font-bold text-foreground">{stats?.totalTenants || 0}</p>
              </div>
              <Building className="h-8 w-8 text-primary" />
            </div>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-foreground">{stats?.activeUsers || 0}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-foreground">{stats?.totalRevenue || '£0'}</p>
              </div>
              <Settings className="h-8 w-8 text-primary" />
            </div>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Growth Rate</p>
                <p className="text-2xl font-bold text-foreground">{stats?.growthRate || '0%'}</p>
              </div>
              <Building className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>

        {/* Tenant List */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl">
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">All Tenant Organizations</h2>
                <p className="text-sm text-muted-foreground">Manage and monitor tenant organizations</p>
              </div>
              {tenants && tenants.length > 0 && (
                <CustomButton 
                  size="sm"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tenant
                </CustomButton>
              )}
            </div>
          </div>
          
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading tenant organizations...</p>
              </div>
            ) : !tenants || tenants.length === 0 ? (
              <div className="text-center py-12">
                <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Tenants Found</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first tenant organization to get started with the multi-tenant system.
                </p>
                <CustomButton onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Tenant
                </CustomButton>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Subdomain</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenants.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-foreground">{tenant.name}</div>
                            {tenant.contact_email && (
                              <div className="text-sm text-muted-foreground">{tenant.contact_email}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {tenant.subdomain}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {tenant.subscription_plan}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={tenant.subscription_status === 'active' ? 'default' : 'destructive'}
                          >
                            {tenant.subscription_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-foreground">{tenant.activeUsers}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(tenant.created_at), 'MMM dd, yyyy')}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <CustomButton
                              size="sm"
                              variant="ghost"
                              onClick={() => toast.info('View tenant details (coming soon)')}
                            >
                              <Eye className="h-4 w-4" />
                            </CustomButton>
                            <CustomButton
                              size="sm"
                              variant="ghost"
                              onClick={() => toast.info('Edit tenant (coming soon)')}
                            >
                              <Edit className="h-4 w-4" />
                            </CustomButton>
                            <CustomButton
                              size="sm"
                              variant="ghost"
                              onClick={() => toast.info('Delete tenant (coming soon)')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </CustomButton>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        {/* Create Tenant Dialog */}
        <CreateTenantDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      </main>
    </div>
  );
}