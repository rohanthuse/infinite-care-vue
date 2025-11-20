import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getSystemSessionToken } from '@/utils/systemSession';

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
      
      // Get system session token for authentication
      const systemSessionToken = getSystemSessionToken();
      
      const { data, error } = await supabase.functions.invoke('delete-system-tenant', {
        body: { 
          id: tenant.id,
          systemSessionToken
        }
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

  const handleConfirm = () => {
    deleteTenant();
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete tenant</DialogTitle>
          <DialogDescription>
            This action will permanently remove the tenant "{tenant?.name}" and all associated members. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button 
            type="button" 
            variant="destructive" 
            disabled={isPending} 
            onClick={handleConfirm}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
