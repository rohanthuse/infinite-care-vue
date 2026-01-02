import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getSystemSessionToken } from '@/utils/systemSession';
import { toast } from 'sonner';
import { useActiveSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { Calendar, CreditCard, AlertCircle } from 'lucide-react';
import { format, addMonths } from 'date-fns';

interface RenewSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: {
    id: string;
    name: string;
    subscription_plan_id?: string;
    subscription_expires_at?: string | null;
  } | null;
  onSuccess?: () => void;
}

export const RenewSubscriptionDialog: React.FC<RenewSubscriptionDialogProps> = ({ 
  open, 
  onOpenChange, 
  tenant,
  onSuccess 
}) => {
  const queryClient = useQueryClient();
  const { data: plans, isLoading: plansLoading } = useActiveSubscriptionPlans();
  
  const [form, setForm] = useState({
    plan_id: '',
    duration_months: 12,
    notes: '',
  });

  useEffect(() => {
    if (tenant && plans) {
      setForm({
        plan_id: tenant.subscription_plan_id || (plans[0]?.id || ''),
        duration_months: 12,
        notes: '',
      });
    }
  }, [tenant, plans]);

  const { mutate: renewSubscription, isPending } = useMutation({
    mutationFn: async () => {
      if (!tenant?.id) throw new Error('Missing tenant id');
      const sessionToken = getSystemSessionToken();
      if (!sessionToken) throw new Error('No system session found');

      console.log('[RenewSubscription] Invoking edge function with:', {
        organization_id: tenant.id,
        plan_id: form.plan_id,
        duration_months: form.duration_months,
        hasSessionToken: !!sessionToken,
      });

      const { data, error } = await supabase.functions.invoke('renew-subscription', {
        body: { 
          session_token: sessionToken,
          organization_id: tenant.id,
          plan_id: form.plan_id,
          duration_months: form.duration_months,
          notes: form.notes,
        }
      });

      console.log('[RenewSubscription] Response:', { data, error });

      if (error) {
        console.error('[RenewSubscription] Edge function error:', error);
        throw new Error(error.message || 'Failed to connect to renewal service');
      }
      if (!(data as any)?.success) {
        console.error('[RenewSubscription] Renewal failed:', data);
        throw new Error((data as any)?.error || 'Renewal failed');
      }
      return data;
    },
    onSuccess: () => {
      toast.success('Subscription renewed successfully');
      queryClient.invalidateQueries({ queryKey: ['system-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-stats'] });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (err: any) => {
      console.error('[RenewSubscription] Mutation error:', err);
      toast.error(err?.message || 'Failed to renew subscription');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    renewSubscription();
  };

  const selectedPlan = plans?.find(p => p.id === form.plan_id);
  
  // Calculate new expiry date
  const currentExpiry = tenant?.subscription_expires_at 
    ? new Date(tenant.subscription_expires_at)
    : new Date();
  const isExpired = currentExpiry < new Date();
  const startDate = isExpired ? new Date() : currentExpiry;
  const newExpiryDate = addMonths(startDate, form.duration_months);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Renew Subscription
            </DialogTitle>
            <DialogDescription>
              Renew subscription for <strong>{tenant?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          {/* Current Expiry Warning */}
          {tenant?.subscription_expires_at && (
            <div className={`p-3 rounded-md border flex items-start gap-2 ${
              isExpired 
                ? 'bg-destructive/10 border-destructive/30' 
                : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
            }`}>
              <AlertCircle className={`h-4 w-4 mt-0.5 ${
                isExpired ? 'text-destructive' : 'text-amber-600'
              }`} />
              <div className="text-sm">
                <div className="font-medium">
                  {isExpired ? 'Subscription Expired' : 'Current Expiry'}
                </div>
                <div className="text-muted-foreground">
                  {format(currentExpiry, 'MMM dd, yyyy')}
                  {isExpired && ' - Renewal will start from today'}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Plan Selection */}
            <div>
              <Label htmlFor="plan">Subscription Plan</Label>
              <Select 
                value={form.plan_id} 
                onValueChange={(value) => setForm({ ...form, plan_id: value })}
                disabled={plansLoading}
              >
                <SelectTrigger id="plan">
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans?.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      <div className="flex items-center justify-between w-full">
                        <span className="capitalize">{plan.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({plan.max_users} Users)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPlan && (
                <p className="text-xs text-muted-foreground mt-1">
                  £{selectedPlan.price_monthly}/month or £{selectedPlan.price_yearly}/year
                </p>
              )}
            </div>

            {/* Duration Selection */}
            <div>
              <Label htmlFor="duration">Validity Period</Label>
              <Select 
                value={form.duration_months.toString()} 
                onValueChange={(value) => setForm({ ...form, duration_months: parseInt(value) })}
              >
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Month</SelectItem>
                  <SelectItem value="3">3 Months</SelectItem>
                  <SelectItem value="6">6 Months</SelectItem>
                  <SelectItem value="12">12 Months (1 Year)</SelectItem>
                  <SelectItem value="24">24 Months (2 Years)</SelectItem>
                  <SelectItem value="36">36 Months (3 Years)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* New Expiry Date Preview */}
            <div className="p-3 bg-muted rounded-md">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-medium">New Expiry Date</div>
                  <div className="text-muted-foreground">
                    {format(newExpiryDate, 'MMMM dd, yyyy')}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Add any relevant notes about this renewal..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !form.plan_id}>
              {isPending ? 'Renewing...' : 'Confirm Renewal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
