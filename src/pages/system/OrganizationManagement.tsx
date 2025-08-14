import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Building, 
  Users, 
  Calendar,
  Settings,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Organization {
  id: string;
  name: string;
  subdomain: string;
  contact_email: string;
  subscription_status: string;
  subscription_plan: string;
  is_trial: boolean;
  trial_ends_at: string | null;
  created_at: string;
  max_users: number;
  max_branches: number;
  user_count?: number;
  branch_count?: number;
}

export const OrganizationManagement: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: organizations, isLoading } = useQuery({
    queryKey: ['system-organizations'],
    queryFn: async (): Promise<Organization[]> => {
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          subscription_plans(name, max_users, max_branches)
        `);
      
      if (error) throw error;
      
      // Get additional counts separately
      const [membersResult, branchesResult] = await Promise.all([
        supabase.from('organization_members').select('organization_id', { count: 'exact' }),
        supabase.from('branches').select('organization_id', { count: 'exact' })
      ]);
      
      return data.map(org => ({
        ...org,
        subscription_plan: (org.subscription_plans as any)?.name || 'Unknown',
        max_users: (org.subscription_plans as any)?.max_users || 0,
        max_branches: (org.subscription_plans as any)?.max_branches || 0,
        user_count: 0, // Would need actual count query
        branch_count: 0  // Would need actual count query
      }));
    }
  });

  const suspendOrganization = useMutation({
    mutationFn: async (orgId: string) => {
      const { error } = await supabase
        .from('organizations')
        .update({ subscription_status: 'suspended' })
        .eq('id', orgId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-organizations'] });
      toast.success('Organization suspended successfully');
    },
    onError: (error) => {
      toast.error('Failed to suspend organization: ' + error.message);
    }
  });

  const activateOrganization = useMutation({
    mutationFn: async (orgId: string) => {
      const { error } = await supabase
        .from('organizations')
        .update({ subscription_status: 'active' })
        .eq('id', orgId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-organizations'] });
      toast.success('Organization activated successfully');
    },
    onError: (error) => {
      toast.error('Failed to activate organization: ' + error.message);
    }
  });

  const filteredOrganizations = organizations?.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.subdomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.contact_email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusBadge = (org: Organization) => {
    if (org.subscription_status === 'active') {
      return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
    } else if (org.subscription_status === 'suspended') {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Suspended</Badge>;
    } else if (org.is_trial) {
      return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Trial</Badge>;
    }
    return <Badge variant="outline">Unknown</Badge>;
  };

  const getTrialStatus = (org: Organization) => {
    if (!org.is_trial || !org.trial_ends_at) return null;
    
    const trialEnd = new Date(org.trial_ends_at);
    const now = new Date();
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 0) {
      return <span className="text-red-600 text-sm">Trial expired</span>;
    } else if (daysLeft <= 3) {
      return <span className="text-orange-600 text-sm">Trial ends in {daysLeft} days</span>;
    } else {
      return <span className="text-blue-600 text-sm">Trial ends in {daysLeft} days</span>;
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading organizations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organization Management</h1>
          <p className="text-muted-foreground">
            Manage all organizations in your system
          </p>
        </div>
        <Button onClick={() => navigate('/system/organizations/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Organization
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, subdomain, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organizations Grid */}
      <div className="grid gap-6">
        {filteredOrganizations.map((org) => (
          <Card key={org.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Building className="h-6 w-6 text-blue-600" />
                    <CardTitle className="text-xl">{org.name}</CardTitle>
                    {getStatusBadge(org)}
                  </div>
                  <CardDescription className="space-y-1">
                    <div>Subdomain: <span className="font-medium">{org.subdomain}</span></div>
                    <div>Contact: <span className="font-medium">{org.contact_email}</span></div>
                    <div>Plan: <span className="font-medium capitalize">{org.subscription_plan}</span></div>
                    {getTrialStatus(org)}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/system/organizations/${org.id}`)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage
                  </Button>
                  {org.subscription_status === 'active' ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => suspendOrganization.mutate(org.id)}
                      disabled={suspendOrganization.isPending}
                    >
                      Suspend
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => activateOrganization.mutate(org.id)}
                      disabled={activateOrganization.isPending}
                    >
                      Activate
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>Users: {org.user_count} / {org.max_users}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span>Branches: {org.branch_count} / {org.max_branches}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>Created: {new Date(org.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrganizations.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by creating your first organization.'}
            </p>
            <Button onClick={() => navigate('/system/organizations/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Organization
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};