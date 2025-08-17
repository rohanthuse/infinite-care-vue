import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [password, setPassword] = useState('');
  const [showPasswordStep, setShowPasswordStep] = useState(false);

  const { mutate: deleteTenant, isPending } = useMutation({
    mutationFn: async () => {
      if (!tenant?.id) throw new Error('Missing tenant id');
      if (!password) throw new Error('Password is required');
      
      // Get system session token for authentication
      const systemSessionToken = getSystemSessionToken();
      
      const { data, error } = await supabase.functions.invoke('delete-system-tenant', {
        body: { 
          id: tenant.id,
          systemSessionToken,
          password
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
      setPassword('');
      setShowPasswordStep(false);
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete tenant');
      if (err?.message?.includes('Invalid password')) {
        setPassword('');
      }
    }
  });

  const handleConfirm = () => {
    if (!showPasswordStep) {
      setShowPasswordStep(true);
    } else {
      deleteTenant();
    }
  };

  const handleCancel = () => {
    setPassword('');
    setShowPasswordStep(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete tenant</DialogTitle>
          <DialogDescription>
            {!showPasswordStep ? (
              <>
                This action will permanently remove the tenant "{tenant?.name}" and all associated members. This cannot be undone.
              </>
            ) : (
              <>
                Please enter your administrator password to confirm the deletion of "{tenant?.name}".
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        
        {showPasswordStep && (
          <div className="space-y-2">
            <Label htmlFor="admin-password">Administrator Password</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && password) {
                  handleConfirm();
                }
              }}
            />
          </div>
        )}
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button 
            type="button" 
            variant="destructive" 
            disabled={isPending || (showPasswordStep && !password)} 
            onClick={handleConfirm}
          >
            {showPasswordStep ? 'Confirm Delete' : 'Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
