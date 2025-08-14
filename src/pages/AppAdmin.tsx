import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Building2, Users, Globe, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface Organization {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  contact_email: string;
  contact_phone?: string;
  address?: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  subscription_status: string;
  subscription_plan: string;
  created_at: string;
  updated_at: string;
}

interface CreateTenantFormData {
  name: string;
  slug: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
}

export const AppAdmin: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateTenantFormData>({
    name: '',
    slug: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    logoUrl: '',
    primaryColor: '#1E40AF',
    secondaryColor: '#F3F4F6'
  });

  // Fetch organizations
  const { data: organizations, isLoading } = useQuery({
    queryKey: ['app-admin-organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Organization[];
    },
    enabled: !!user,
  });

  // Create tenant mutation
  const createTenantMutation = useMutation({
    mutationFn: async (tenantData: CreateTenantFormData) => {
      console.log('Mutation function called with data:', tenantData);
      
      const { data, error } = await supabase.functions.invoke('create-app-tenant', {
        body: tenantData
      });

      console.log('Edge function response:', { data, error });
      
      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      console.log('Mutation success:', data);
      toast.success('Tenant created successfully!');
      setIsCreateDialogOpen(false);
      setFormData({
        name: '',
        slug: '',
        contactEmail: '',
        contactPhone: '',
        address: '',
        logoUrl: '',
        primaryColor: '#1E40AF',
        secondaryColor: '#F3F4F6'
      });
      queryClient.invalidateQueries({ queryKey: ['app-admin-organizations'] });
    },
    onError: (error: any) => {
      console.error('Mutation error:', error);
      toast.error(error.message || 'Failed to create tenant. Please check console for details.');
    }
  });

  const handleInputChange = (field: keyof CreateTenantFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug from name
    if (field === 'name') {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submission started:', formData);
    
    if (!formData.name || !formData.slug || !formData.contactEmail) {
      console.error('Validation failed: Missing required fields');
      toast.error('Please fill in all required fields');
      return;
    }

    console.log('Calling create tenant mutation...');
    createTenantMutation.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge variant="default" className="gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Active
      </Badge>
    ) : (
      <Badge variant="secondary" className="gap-1">
        <XCircle className="h-3 w-3" />
        Inactive
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">App Administration</h1>
          <p className="text-muted-foreground">Manage all tenants and organizations</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Tenant
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Create New Tenant</DialogTitle>
              <DialogDescription>
                Create a new tenant organization with automatic Super Admin assignment
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto pr-2">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Tenant Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="ABC Hospital"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">URL Slug *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => handleInputChange('slug', e.target.value)}
                      placeholder="abc-hospital"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      URL: med-infinite.care/{formData.slug}
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="contactEmail">Contact Email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    placeholder="admin@abc-hospital.com"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This email will be assigned as Super Admin
                  </p>
                </div>

                <div>
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="123 Healthcare St, Medical City, MC 12345"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    value={formData.logoUrl}
                    onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <Input
                      id="primaryColor"
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="flex-shrink-0 border-t pt-4 mt-4">
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={createTenantMutation.isPending || !formData.name || !formData.slug || !formData.contactEmail}
                  className="min-w-[120px]"
                >
                  {createTenantMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Creating...
                    </div>
                  ) : (
                    'Create Tenant'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organizations?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizations?.filter(org => org.subscription_status === 'active').length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>
      </div>

      {/* Organizations Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {organizations?.map((org) => (
          <Card key={org.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{org.name}</CardTitle>
                {getStatusBadge(org.subscription_status)}
              </div>
              <CardDescription className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                med-infinite.care/{org.slug}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <strong>Plan:</strong> {org.subscription_plan}
              </div>
              <div className="text-sm">
                <strong>Contact:</strong> {org.contact_email}
              </div>
              {org.contact_phone && (
                <div className="text-sm">
                  <strong>Phone:</strong> {org.contact_phone}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Created: {new Date(org.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!organizations?.length && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tenants found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first tenant to get started with multi-tenancy
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create First Tenant
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};