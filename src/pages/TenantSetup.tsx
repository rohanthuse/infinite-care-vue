import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export const TenantSetup: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    subscription_plan: 'basic',
  });

  const createOrganization = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user) throw new Error('User not authenticated');

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: data.name,
          subdomain: data.slug, // Keep subdomain for backward compatibility
          slug: data.slug,
          contact_email: data.contact_email,
          contact_phone: data.contact_phone,
          address: data.address,
          subscription_plan: data.subscription_plan,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Add user as organization owner
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: 'owner',
          status: 'active',
          joined_at: new Date().toISOString(),
        });

      if (memberError) throw memberError;

      return org;
    },
    onSuccess: (org) => {
      toast.success('Organization created successfully!');
      
      // For development, store tenant in localStorage
      if (window.location.hostname === 'localhost') {
        localStorage.setItem('dev-tenant', org.slug);
        navigate(`/${org.slug}/dashboard`);
      } else {
        // In production, redirect to path-based URL
        window.location.href = `/${org.slug}/dashboard`;
      }
    },
    onError: (error) => {
      console.error('Error creating organization:', error);
      toast.error('Failed to create organization. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate slug
    if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      toast.error('Organization slug can only contain lowercase letters, numbers, and hyphens');
      return;
    }

    if (formData.slug.length < 3) {
      toast.error('Organization slug must be at least 3 characters long');
      return;
    }

    createOrganization.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Building className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Create Your Organisation</CardTitle>
          <CardDescription>
            Set up your organisation to get started with the care management system
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organisation Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., ABC Care Services"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Organisation Slug *</Label>
                <Input
                  id="slug"
                  placeholder="abc-care"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value.toLowerCase())}
                  pattern="^[a-z0-9-]+$"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Your organisation will be accessible at: med-infinite.care/{formData.slug || 'your-org-slug'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  placeholder="contact@abc-care.com"
                  value={formData.contact_email}
                  onChange={(e) => handleInputChange('contact_email', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.contact_phone}
                  onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="123 Main St, City, State, ZIP"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscription_plan">Subscription Plan</Label>
              <Select
                value={formData.subscription_plan}
                onValueChange={(value) => handleInputChange('subscription_plan', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic - Up to 50 users</SelectItem>
                  <SelectItem value="professional">Professional - Up to 200 users</SelectItem>
                  <SelectItem value="enterprise">Enterprise - Unlimited users</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={createOrganization.isPending || !formData.name || !formData.slug}
            >
              {createOrganization.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Organization...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Organization
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-muted-foreground text-center">
              By creating an organisation, you agree to our Terms of Service and Privacy Policy.
              You will be set as the organisation owner and can invite other team members later.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};