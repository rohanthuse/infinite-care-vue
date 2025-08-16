import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ConfirmDeleteTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: any | null;
  onSuccess?: () => void;
}

export const ConfirmDeleteTenantDialog: React.FC<ConfirmDeleteTenantDialogProps> = ({ open, onOpenChange, tenant, onSuccess }) => {
  const queryClient = useQueryClient();

  const { mutate: deleteTenant, isPending } = useMutation({
    mutationFn: async () => {
      if (!tenant?.id) throw new Error('Missing tenant id');
      const { data, error } = await supabase.functions.invoke('delete-system-tenant', {
        body: { id: tenant.id }
      });
      if (error) throw error;
      if (!(data as any)?.success) throw new Error((data as any)?.error || 'Delete failed');
      return data;
    },
    onSuccess: () => {
      toast.success('Tenant deleted');
      queryClient.invalidateQueries({ queryKey: ['tenant-stats'] });
      queryClient.invalidateQueries({ queryKey: ['system-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['organizations', 'system-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['organizations-with-users'] });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete tenant');
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete tenant</DialogTitle>
          <DialogDescription>
            This action will permanently remove the tenant and all associated members. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" variant="destructive" disabled={isPending} onClick={() => deleteTenant()}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
