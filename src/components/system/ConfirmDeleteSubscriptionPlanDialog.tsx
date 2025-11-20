import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useDeleteSubscriptionPlan } from '@/hooks/useDeleteSubscriptionPlan';
import { SubscriptionPlan } from '@/hooks/useSubscriptionPlans';

interface ConfirmDeleteSubscriptionPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: SubscriptionPlan | null;
  onSuccess?: () => void;
}

export function ConfirmDeleteSubscriptionPlanDialog({
  open,
  onOpenChange,
  plan,
  onSuccess,
}: ConfirmDeleteSubscriptionPlanDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const deletePlan = useDeleteSubscriptionPlan();

  const handleDelete = () => {
    if (!plan || confirmText !== 'DELETE') return;

    deletePlan.mutate(plan.id, {
      onSuccess: () => {
        onSuccess?.();
        onOpenChange(false);
        setConfirmText('');
      },
    });
  };

  const handleClose = () => {
    if (!deletePlan.isPending) {
      setConfirmText('');
      onOpenChange(false);
    }
  };

  if (!plan) return null;

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>Delete Subscription Plan</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete the subscription plan{' '}
              <span className="font-semibold">{plan.name}</span>?
            </p>
            <p className="text-sm bg-destructive/10 p-3 rounded-md border border-destructive/20">
              <strong>Warning:</strong> This action cannot be undone. However, the plan cannot be
              deleted if any organizations are currently using it.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="confirm-delete">
            Type <span className="font-mono font-bold">DELETE</span> to confirm
          </Label>
          <Input
            id="confirm-delete"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            disabled={deletePlan.isPending}
          />
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={deletePlan.isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={confirmText !== 'DELETE' || deletePlan.isPending}
          >
            {deletePlan.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Plan'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
