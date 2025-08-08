import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EditTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: any | null;
  onSuccess?: () => void;
}

export const EditTenantDialog: React.FC<EditTenantDialogProps> = ({ open, onOpenChange, tenant, onSuccess }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    subdomain: '',
    subscription_plan: 'basic',
    subscription_status: 'active',
    contact_email: '',
    contact_phone: '',
  });

  useEffect(() => {
    if (tenant) {
      setForm({
        name: tenant.name || '',
        subdomain: tenant.subdomain || '',
        subscription_plan: tenant.subscription_plan || 'basic',
        subscription_status: tenant.subscription_status || 'active',
        contact_email: tenant.contact_email || '',
        contact_phone: tenant.contact_phone || '',
      });
    }
  }, [tenant]);

  const { mutate: updateTenant, isPending } = useMutation({
    mutationFn: async () => {
      if (!tenant?.id) throw new Error('Missing tenant id');
      const { data, error } = await supabase.functions.invoke('update-system-tenant', {
        body: { id: tenant.id, ...form }
      });
      if (error) throw error;
      if (!(data as any)?.success) throw new Error((data as any)?.error || 'Update failed');
      return data;
    },
    onSuccess: () => {
      toast.success('Tenant updated');
      queryClient.invalidateQueries({ queryKey: ['tenant-stats'] });
      queryClient.invalidateQueries({ queryKey: ['system-tenants'] });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update tenant');
    }
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTenant();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Edit tenant</DialogTitle>
            <DialogDescription>Update the organization details.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Organization name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="subdomain">Subdomain</Label>
              <Input id="subdomain" value={form.subdomain} onChange={(e) => setForm({ ...form, subdomain: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="plan">Plan</Label>
              <select id="plan" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.subscription_plan} onChange={(e) => setForm({ ...form, subscription_plan: e.target.value })}>
                <option value="basic">basic</option>
                <option value="pro">pro</option>
                <option value="enterprise">enterprise</option>
              </select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select id="status" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.subscription_status} onChange={(e) => setForm({ ...form, subscription_status: e.target.value })}>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
                <option value="suspended">suspended</option>
              </select>
            </div>
            <div>
              <Label htmlFor="contact_email">Contact email</Label>
              <Input id="contact_email" type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="contact_phone">Contact phone</Label>
              <Input id="contact_phone" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
