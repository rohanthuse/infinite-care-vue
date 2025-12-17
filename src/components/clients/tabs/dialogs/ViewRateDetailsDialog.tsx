import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface ServiceRateDetails {
  id: string;
  service_name: string;
  service_code: string;
  rate_type: string;
  amount: number;
  currency: string;
  effective_from: string;
  effective_to: string | null;
  client_type: string;
  funding_source: string;
  applicable_days: string[];
  is_default: boolean;
  status: string;
  description: string | null;
  time_from: string | null;
  time_until: string | null;
  rate_category: string | null;
  pay_based_on: string | null;
  charge_type: string | null;
  rate_15_minutes: number | null;
  rate_30_minutes: number | null;
  rate_45_minutes: number | null;
  rate_60_minutes: number | null;
}

interface ViewRateDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rate: ServiceRateDetails | null;
  authorityName?: string;
}

const rateTypeLabels: Record<string, string> = {
  hourly: 'Per Hour',
  daily: 'Per Day',
  weekly: 'Per Week',
  per_visit: 'Per Visit',
  fixed: 'Fixed Rate',
};

const chargeTypeLabels: Record<string, string> = {
  flat_rate: 'Flat Rate',
  pro_rata: 'Pro Rata',
  hourly_rate: 'Hourly Rate',
  hour_minutes: 'Hours & Minutes',
  rate_per_hour: 'Rate Per Hour',
  rate_per_minutes_pro_rata: 'Rate Per Minutes (Pro Rata)',
  rate_per_minutes_flat_rate: 'Rate Per Minutes (Flat Rate)',
  daily_flat_rate: 'Daily Flat Rate',
};

const payBasedOnLabels: Record<string, string> = {
  service: 'Service',
  hours_minutes: 'Hours/Minutes',
  daily_flat_rate: 'Daily Flat Rate',
};

const rateCategoryLabels: Record<string, string> = {
  standard: 'Standard',
  adult: 'Adult',
  cyp: 'Children & Young People',
};

const dayLabels: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

export const ViewRateDetailsDialog: React.FC<ViewRateDetailsDialogProps> = ({
  open,
  onOpenChange,
  rate,
  authorityName,
}) => {
  if (!rate) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'N/A';
    return timeString.substring(0, 5); // HH:MM format
  };

  const formatDays = (days: string[]) => {
    if (!days || days.length === 0) return 'None';
    if (days.length === 7) return 'All Days';
    return days.map(d => dayLabels[d] || d).join(', ');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rate Details</DialogTitle>
          <DialogDescription>
            View complete details of the selected rate from Rate Management
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Service Name</Label>
                <Input value={rate.service_name} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Service Code</Label>
                <Input value={rate.service_code} disabled className="bg-muted" />
              </div>
              {authorityName && (
                <div className="space-y-2 col-span-2">
                  <Label>Authority</Label>
                  <Input value={authorityName} disabled className="bg-muted" />
                </div>
              )}
              <div className="space-y-2">
                <Label>Status</Label>
                <div>
                  <Badge 
                    variant={rate.status === 'active' ? 'default' : 'secondary'}
                    className="capitalize"
                  >
                    {rate.status}
                  </Badge>
                </div>
              </div>
              {rate.is_default && (
                <div className="space-y-2">
                  <Label>Default Rate</Label>
                  <div>
                    <Badge variant="outline">Default</Badge>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Rate Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Rate Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input 
                  value={formatCurrency(rate.amount)} 
                  disabled 
                  className="bg-muted font-semibold" 
                />
              </div>
              <div className="space-y-2">
                <Label>Rate Type</Label>
                <Input 
                  value={rateTypeLabels[rate.rate_type] || rate.rate_type} 
                  disabled 
                  className="bg-muted" 
                />
              </div>
              {rate.charge_type && (
                <div className="space-y-2">
                  <Label>Charge Type</Label>
                  <Input 
                    value={chargeTypeLabels[rate.charge_type] || rate.charge_type} 
                    disabled 
                    className="bg-muted" 
                  />
                </div>
              )}
              {rate.pay_based_on && (
                <div className="space-y-2">
                  <Label>Pay Based On</Label>
                  <Input 
                    value={payBasedOnLabels[rate.pay_based_on] || rate.pay_based_on} 
                    disabled 
                    className="bg-muted" 
                  />
                </div>
              )}
              {rate.rate_category && (
                <div className="space-y-2">
                  <Label>Rate Category</Label>
                  <Input 
                    value={rateCategoryLabels[rate.rate_category] || rate.rate_category} 
                    disabled 
                    className="bg-muted" 
                  />
                </div>
              )}
            </div>

            {/* Minute-based rates if available */}
            {(rate.rate_15_minutes || rate.rate_30_minutes || rate.rate_45_minutes || rate.rate_60_minutes) && (
              <div className="grid grid-cols-4 gap-4 mt-4">
                {rate.rate_15_minutes !== null && (
                  <div className="space-y-2">
                    <Label className="text-xs">15 Min Rate</Label>
                    <Input 
                      value={formatCurrency(rate.rate_15_minutes)} 
                      disabled 
                      className="bg-muted text-sm" 
                    />
                  </div>
                )}
                {rate.rate_30_minutes !== null && (
                  <div className="space-y-2">
                    <Label className="text-xs">30 Min Rate</Label>
                    <Input 
                      value={formatCurrency(rate.rate_30_minutes)} 
                      disabled 
                      className="bg-muted text-sm" 
                    />
                  </div>
                )}
                {rate.rate_45_minutes !== null && (
                  <div className="space-y-2">
                    <Label className="text-xs">45 Min Rate</Label>
                    <Input 
                      value={formatCurrency(rate.rate_45_minutes)} 
                      disabled 
                      className="bg-muted text-sm" 
                    />
                  </div>
                )}
                {rate.rate_60_minutes !== null && (
                  <div className="space-y-2">
                    <Label className="text-xs">60 Min Rate</Label>
                    <Input 
                      value={formatCurrency(rate.rate_60_minutes)} 
                      disabled 
                      className="bg-muted text-sm" 
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Schedule Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Schedule
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Effective From</Label>
                <Input 
                  value={formatDate(rate.effective_from)} 
                  disabled 
                  className="bg-muted" 
                />
              </div>
              <div className="space-y-2">
                <Label>Effective To</Label>
                <Input 
                  value={rate.effective_to ? formatDate(rate.effective_to) : 'Ongoing'} 
                  disabled 
                  className="bg-muted" 
                />
              </div>
              {(rate.time_from || rate.time_until) && (
                <>
                  <div className="space-y-2">
                    <Label>Time From</Label>
                    <Input 
                      value={formatTime(rate.time_from)} 
                      disabled 
                      className="bg-muted" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time Until</Label>
                    <Input 
                      value={formatTime(rate.time_until)} 
                      disabled 
                      className="bg-muted" 
                    />
                  </div>
                </>
              )}
              <div className="space-y-2 col-span-2">
                <Label>Applicable Days</Label>
                <Input 
                  value={formatDays(rate.applicable_days)} 
                  disabled 
                  className="bg-muted" 
                />
              </div>
            </div>
          </div>

          {rate.description && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  Description
                </h3>
                <div className="p-3 bg-muted rounded-md text-sm">
                  {rate.description}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
