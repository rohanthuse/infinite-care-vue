import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSystemAuth } from '@/contexts/SystemAuthContext';
import { useActiveSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Building, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateTenantDialog({ open, onOpenChange, onSuccess }: CreateTenantDialogProps) {
  const { user } = useSystemAuth();
  const queryClient = useQueryClient();
  const { data: plans, isLoading: plansLoading } = useActiveSubscriptionPlans();
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    subscription_plan_id: plans?.[0]?.id || '',
    billing_cycle: 'monthly' as 'monthly' | 'yearly',
    subscription_duration: 1,
    subscription_start_date: new Date(),
    subscription_end_date: null as Date | null,
    discount: 0,
    total_amount: 0,
  });

  // Calculate end date and total amount when any relevant field changes
  useEffect(() => {
    if (formData.subscription_start_date && formData.subscription_duration > 0 && plans) {
      // Calculate end date
      const endDate = new Date(formData.subscription_start_date);
      if (formData.billing_cycle === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + formData.subscription_duration);
      } else {
        endDate.setMonth(endDate.getMonth() + formData.subscription_duration);
      }
      
      // Calculate total amount with discount
      const selectedPlan = plans.find(p => p.id === formData.subscription_plan_id);
      let subtotal = 0;
      let totalAmount = 0;
      
      if (selectedPlan) {
        if (formData.billing_cycle === 'yearly') {
          subtotal = selectedPlan.price_yearly * formData.subscription_duration;
        } else {
          subtotal = selectedPlan.price_monthly * formData.subscription_duration;
        }
        
        // Apply discount
        const discountMultiplier = 1 - (formData.discount / 100);
        totalAmount = subtotal * discountMultiplier;
      }
      
      setFormData(prev => ({ 
        ...prev, 
        subscription_end_date: endDate,
        total_amount: totalAmount 
      }));
    }
  }, [
    formData.subscription_start_date, 
    formData.billing_cycle, 
    formData.subscription_plan_id,
    formData.subscription_duration,
    formData.discount,
    plans
  ]);

  // Reset duration to 1 when billing cycle changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, subscription_duration: 1 }));
  }, [formData.billing_cycle]);

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
          subscriptionPlanId: data.subscription_plan_id,
          billingCycle: data.billing_cycle,
          subscriptionDuration: data.subscription_duration,
          subscriptionStartDate: data.subscription_start_date.toISOString(),
          subscriptionEndDate: data.subscription_end_date?.toISOString(),
          discount: data.discount,
          totalAmount: data.total_amount,
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

  const handleInputChange = (field: string, value: string | Date | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      contact_email: '',
      contact_phone: '',
      address: '',
      subscription_plan_id: plans?.[0]?.id || '',
      billing_cycle: 'monthly',
      subscription_duration: 1,
      subscription_start_date: new Date(),
      subscription_end_date: null,
      discount: 0,
      total_amount: 0,
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

          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium">Subscription Details</h3>
            
            <div className="space-y-2">
              <Label htmlFor="subscription_plan">Subscription Plan</Label>
              <Select
                value={formData.subscription_plan_id}
                onValueChange={(value) => handleInputChange('subscription_plan_id', value)}
                disabled={plansLoading || !plans || plans.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={plansLoading ? "Loading plans..." : "Select a plan"} />
                </SelectTrigger>
                <SelectContent>
                  {plans?.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} – {plan.max_users || 'Unlimited'} Users – £{plan.price_monthly.toFixed(2)}/mo – £{plan.price_yearly.toFixed(2)}/yr
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Billing Cycle</Label>
              <RadioGroup
                value={formData.billing_cycle}
                onValueChange={(value) => handleInputChange('billing_cycle', value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="monthly" id="monthly" />
                  <Label htmlFor="monthly" className="font-normal cursor-pointer">
                    Monthly
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yearly" id="yearly" />
                  <Label htmlFor="yearly" className="font-normal cursor-pointer">
                    Yearly (10% discount)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscription_duration">Subscription Duration</Label>
              <Select
                value={formData.subscription_duration.toString()}
                onValueChange={(value) => handleInputChange('subscription_duration', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formData.billing_cycle === 'monthly' ? (
                    // Monthly: 1-24 months
                    Array.from({ length: 24 }, (_, i) => i + 1).map((months) => (
                      <SelectItem key={months} value={months.toString()}>
                        {months} {months === 1 ? 'Month' : 'Months'}
                      </SelectItem>
                    ))
                  ) : (
                    // Yearly: 1-5 years
                    Array.from({ length: 5 }, (_, i) => i + 1).map((years) => (
                      <SelectItem key={years} value={years.toString()}>
                        {years} {years === 1 ? 'Year' : 'Years'}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.billing_cycle === 'monthly' 
                  ? 'Select 1-24 months' 
                  : 'Select 1-5 years'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount">Discount (%)</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="0"
                value={formData.discount || ''}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  const clampedValue = Math.min(Math.max(value, 0), 100);
                  handleInputChange('discount', clampedValue);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Enter a discount percentage (0-100)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subscription_start_date">Subscription Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.subscription_start_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.subscription_start_date ? (
                        format(formData.subscription_start_date, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.subscription_start_date}
                      onSelect={(date) => handleInputChange('subscription_start_date', date || new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subscription_end_date">Subscription End Date</Label>
                <Input
                  id="subscription_end_date"
                  value={formData.subscription_end_date ? format(formData.subscription_end_date, 'PPP') : ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Auto-calculated based on billing cycle and duration
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_amount">Total Amount</Label>
              <Input
                id="total_amount"
                value={`£${formData.total_amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                disabled
                className="bg-muted font-semibold text-base"
              />
              {formData.discount > 0 && (
                <div className="text-xs space-y-1 p-2 bg-muted/50 rounded">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>£{(() => {
                      const selectedPlan = plans?.find(p => p.id === formData.subscription_plan_id);
                      if (!selectedPlan) return '0.00';
                      const subtotal = formData.billing_cycle === 'yearly' 
                        ? selectedPlan.price_yearly * formData.subscription_duration
                        : selectedPlan.price_monthly * formData.subscription_duration;
                      return subtotal.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    })()}</span>
                  </div>
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Discount ({formData.discount}%):</span>
                    <span>-£{(() => {
                      const selectedPlan = plans?.find(p => p.id === formData.subscription_plan_id);
                      if (!selectedPlan) return '0.00';
                      const subtotal = formData.billing_cycle === 'yearly' 
                        ? selectedPlan.price_yearly * formData.subscription_duration
                        : selectedPlan.price_monthly * formData.subscription_duration;
                      const discountAmount = subtotal * (formData.discount / 100);
                      return discountAmount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    })()}</span>
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {formData.discount > 0 
                  ? `Price after ${formData.discount}% discount` 
                  : `Auto-calculated: ${formData.billing_cycle === 'yearly' ? 'Yearly' : 'Monthly'} Fee × Duration`
                }
              </p>
            </div>
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