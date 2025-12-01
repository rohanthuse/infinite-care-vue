import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getSystemSessionToken } from '@/utils/systemSession';
import { toast } from 'sonner';
import { TenantStatusChangeConfirmDialog } from './TenantStatusChangeConfirmDialog';
import { AlertTriangle, CheckCircle2, Pause, Ban } from 'lucide-react';

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
    slug: '',
    subscription_status: 'active',
    contact_email: '',
    contact_phone: '',
  });
  const [originalStatus, setOriginalStatus] = useState('active');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (tenant) {
      const status = tenant.subscription_status || 'active';
      setForm({
        name: tenant.name || '',
        slug: tenant.slug || '',
        subscription_status: status,
        contact_email: tenant.contact_email || '',
        contact_phone: tenant.contact_phone || '',
      });
      setOriginalStatus(status);
    }
  }, [tenant]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setShowConfirmDialog(false);
      setPendingStatus(null);
    }
  }, [open]);

  const { mutate: updateTenant, isPending } = useMutation({
    mutationFn: async () => {
      if (!tenant?.id) throw new Error('Missing tenant id');
      const sessionToken = getSystemSessionToken();
      const { data, error } = await supabase.functions.invoke('update-system-tenant', {
        body: { id: tenant.id, ...form, session_token: sessionToken }
      });
      if (error) throw error;
      if (!(data as any)?.success) throw new Error((data as any)?.error || 'Update failed');
      return data;
    },
    onSuccess: (data: any) => {
      const prevStatus = data?.previous_status || originalStatus;
      const newStatus = form.subscription_status;
      
      if (prevStatus !== newStatus) {
        toast.success(`Tenant status changed from ${prevStatus} to ${newStatus}`);
      } else {
        toast.success('Tenant updated');
      }
      
      queryClient.invalidateQueries({ queryKey: ['tenant-stats'] });
      queryClient.invalidateQueries({ queryKey: ['system-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['organizations', 'system-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['organizations-with-users'] });
      queryClient.invalidateQueries({ queryKey: ['system-audit-logs'] });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update tenant');
    }
  });

  const handleStatusChange = (newStatus: string) => {
    // Simply update the form state - no confirmation here
    setForm({ ...form, subscription_status: newStatus });
  };

  const handleConfirmStatusChange = () => {
    // Close confirmation dialog first
    setShowConfirmDialog(false);
    setPendingStatus(null);
    
    // Actually submit the update - this will close EditTenantDialog on success
    updateTenant();
  };

  const handleCancelStatusChange = () => {
    setPendingStatus(null);
    setShowConfirmDialog(false);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const statusChanged = form.subscription_status !== originalStatus;
    const requiresConfirmation = (form.subscription_status === 'inactive' || form.subscription_status === 'suspended') && statusChanged;
    
    if (requiresConfirmation) {
      // Just open confirmation - the actual submit happens in handleConfirmStatusChange
      setPendingStatus(form.subscription_status);
      setShowConfirmDialog(true);
    } else {
      // No confirmation needed, submit directly
      updateTenant();
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'active') return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (status === 'inactive') return <Pause className="h-4 w-4 text-muted-foreground" />;
    if (status === 'suspended') return <Ban className="h-4 w-4 text-destructive" />;
    return null;
  };

  const isWarningStatus = form.subscription_status === 'inactive' || form.subscription_status === 'suspended';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Edit tenant</DialogTitle>
              <DialogDescription>Update the organisation details.</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Organisation name</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="slug">URL Slug</Label>
                <Input id="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={form.subscription_status} onValueChange={handleStatusChange}>
                  <SelectTrigger id="status">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(form.subscription_status)}
                        <span className="capitalize">{form.subscription_status}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">
                      <div className="flex items-center gap-2">
                        {getStatusIcon('active')}
                        <span>Active</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="inactive">
                      <div className="flex items-center gap-2">
                        {getStatusIcon('inactive')}
                        <span>Inactive</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="suspended">
                      <div className="flex items-center gap-2">
                        {getStatusIcon('suspended')}
                        <span>Suspended</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {form.subscription_status === 'active' && 'Tenant is fully operational'}
                  {form.subscription_status === 'inactive' && 'Limited functionality access'}
                  {form.subscription_status === 'suspended' && 'All access blocked'}
                </p>
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

            {isWarningStatus && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Warning:</strong> Changing status to <span className="capitalize">{form.subscription_status}</span> may affect tenant access and functionality.
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <TenantStatusChangeConfirmDialog
        open={showConfirmDialog}
        onOpenChange={handleCancelStatusChange}
        tenantName={tenant?.name || ''}
        currentStatus={originalStatus}
        newStatus={pendingStatus || form.subscription_status}
        onConfirm={handleConfirmStatusChange}
      />
    </>
  );
};
