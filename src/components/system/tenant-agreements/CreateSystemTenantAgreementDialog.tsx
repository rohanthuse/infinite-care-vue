import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCreateSystemTenantAgreement, useSystemTenantAgreementTypes, useSystemTenantAgreementTemplates } from '@/hooks/useSystemTenantAgreements';
import type { CreateSystemTenantAgreementData } from '@/types/systemTenantAgreements';

export const CreateSystemTenantAgreementDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<CreateSystemTenantAgreementData>({
    tenant_id: '',
    title: '',
    content: '',
    type_id: '',
    template_id: '',
    signed_by_system: '',
    signed_by_tenant: '',
    expiry_date: '',
  });

  const { data: tenants } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: types } = useSystemTenantAgreementTypes();
  const { data: templates } = useSystemTenantAgreementTemplates();
  const createAgreement = useCreateSystemTenantAgreement();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAgreement.mutateAsync(formData);
    setOpen(false);
    setFormData({
      tenant_id: '',
      title: '',
      content: '',
      type_id: '',
      template_id: '',
      signed_by_system: '',
      signed_by_tenant: '',
      expiry_date: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Agreement
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Tenant Agreement</DialogTitle>
          <DialogDescription>
            Create a new agreement between Med-Infinite and a tenant organization.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tenant">Tenant Organization *</Label>
            <Select
              value={formData.tenant_id}
              onValueChange={(value) => setFormData({ ...formData, tenant_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select tenant" />
              </SelectTrigger>
              <SelectContent>
                {tenants?.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Agreement Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Subscription Agreement 2025"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Agreement Type</Label>
            <Select
              value={formData.type_id}
              onValueChange={(value) => setFormData({ ...formData, type_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {types?.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template">Use Template (Optional)</Label>
            <Select
              value={formData.template_id}
              onValueChange={(value) => {
                const template = templates?.find(t => t.id === value);
                setFormData({
                  ...formData,
                  template_id: value,
                  content: template?.content || formData.content,
                  type_id: template?.type_id || formData.type_id,
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                {templates?.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Agreement Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Enter agreement content or select a template above..."
              rows={6}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="signed_by_system">Med-Infinite Representative</Label>
              <Input
                id="signed_by_system"
                value={formData.signed_by_system}
                onChange={(e) => setFormData({ ...formData, signed_by_system: e.target.value })}
                placeholder="Full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signed_by_tenant">Tenant Representative</Label>
              <Input
                id="signed_by_tenant"
                value={formData.signed_by_tenant}
                onChange={(e) => setFormData({ ...formData, signed_by_tenant: e.target.value })}
                placeholder="Full name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry_date">Expiry Date</Label>
            <Input
              id="expiry_date"
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createAgreement.isPending}>
              {createAgreement.isPending ? 'Creating...' : 'Create Agreement'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
