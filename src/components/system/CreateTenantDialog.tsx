import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSystemAuth } from '@/contexts/SystemAuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface CreateTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateTenantDialog({ open, onOpenChange, onSuccess }: CreateTenantDialogProps) {
  const { user } = useSystemAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    subscription_plan: '0-10',
  });

  const createTenant = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user) throw new Error('User not authenticated');

      // Call the system edge function to create organization
      const { data: result, error } = await supabase.functions.invoke('create-system-tenant', {
        body: {
          name: data.name,
          slug: data.slug,
          contactEmail: data.contact_email,
          contactPhone: data.contact_phone,
          address: data.address,
          subscriptionPlan: data.subscription_plan,
          creatorEmail: user.email,
          creatorUserId: user.id
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (!result?.success) {
        throw new Error(result?.error || 'Failed to create organisation');
      }
      
      return result.data;
    },
    onSuccess: (org) => {
      toast.success(`Organisation "${org.name}" created successfully!`);
      queryClient.invalidateQueries({ queryKey: ['system-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-stats'] });
      queryClient.invalidateQueries({ queryKey: ['organizations', 'system-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['organizations-with-users'] });
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error('Error creating organisation:', error);
      if (error.message?.includes('slug')) {
        toast.error('URL slug already exists. Please choose a different slug.');
      } else {
        toast.error('Failed to create organisation. Please try again.');
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate slug
    if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      toast.error('URL slug can only contain lowercase letters, numbers, and hyphens');
      return;
    }

    if (formData.slug.length < 3) {
      toast.error('URL slug must be at least 3 characters long');
      return;
    }

    createTenant.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      contact_email: '',
      contact_phone: '',
      address: '',
      subscription_plan: '0-10',
    });
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) resetForm();
      onOpenChange(value);
    }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Create New Tenant Organisation
          </DialogTitle>
          <DialogDescription>
            Create a new tenant organisation in the system
          </DialogDescription>
        </DialogHeader>
        
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
              <Label htmlFor="slug">URL Slug *</Label>
              <Input
                id="slug"
                placeholder="abc-care"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value.toLowerCase())}
                pattern="^[a-z0-9-]+$"
                required
              />
              <p className="text-xs text-muted-foreground">
                Organisation will be accessible at: med-infinite.care/{formData.slug || 'slug'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email *</Label>
              <Input
                id="contact_email"
                type="email"
                placeholder="contact@abc-care.com"
                value={formData.contact_email}
                onChange={(e) => handleInputChange('contact_email', e.target.value)}
                required
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
                <SelectItem value="0-10">0–10 users | £99/month | £1,070/year (10% discount)</SelectItem>
                <SelectItem value="11-25">11–25 users | £149/month | £1,610/year (10% discount)</SelectItem>
                <SelectItem value="26-50">26–50 users | £249/month | £2,690/year (10% discount)</SelectItem>
                <SelectItem value="51-100">51–100 users | £499/month | £5,390/year (10% discount)</SelectItem>
                <SelectItem value="101-250">101–250 users | £749/month | £8,090/year (10% discount)</SelectItem>
                <SelectItem value="251-500">251–500 users | £999/month | £10,790/year (10% discount)</SelectItem>
                <SelectItem value="500+">500+ users | Bespoke pricing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button 
              type="button"
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createTenant.isPending || !formData.name || !formData.slug || !formData.contact_email}
            >
              {createTenant.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Tenant
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}