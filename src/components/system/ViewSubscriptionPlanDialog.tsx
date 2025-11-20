import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { SubscriptionPlan } from '@/hooks/useSubscriptionPlans';
import { format } from 'date-fns';

interface ViewSubscriptionPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: SubscriptionPlan | null;
}

export function ViewSubscriptionPlanDialog({
  open,
  onOpenChange,
  plan,
}: ViewSubscriptionPlanDialogProps) {
  if (!plan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Subscription Plan Details</DialogTitle>
          <DialogDescription>View complete plan information</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Plan Name</p>
            <p className="text-lg font-semibold">{plan.name}</p>
          </div>

          {plan.description && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
              <p className="text-sm">{plan.description}</p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-muted-foreground">Max Users</p>
            <p className="text-lg font-semibold">{plan.max_users?.toLocaleString() || 'Unlimited'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Monthly Price</p>
              <p className="text-lg font-semibold">£{plan.price_monthly.toFixed(2)}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Yearly Price</p>
              <p className="text-lg font-semibold">£{plan.price_yearly.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                {plan.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <p className="text-sm">{format(new Date(plan.created_at), 'PPP')}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
            <p className="text-sm">{format(new Date(plan.updated_at), 'PPP p')}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
