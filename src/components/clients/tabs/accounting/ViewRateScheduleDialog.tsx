import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ClientRateSchedule, dayLabels, rateCategoryLabels, payBasedOnLabels, chargeTypeLabels } from '@/types/clientAccounting';
import { formatCurrency } from '@/utils/currencyFormatter';

interface ViewRateScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: ClientRateSchedule;
}

export const ViewRateScheduleDialog: React.FC<ViewRateScheduleDialogProps> = ({
  open,
  onOpenChange,
  schedule
}) => {
  const formatDays = (days: string[]) => {
    return days.map(day => dayLabels[day] || day).join(', ');
  };

  const getStatusBadge = (schedule: ClientRateSchedule) => {
    const today = new Date();
    const startDate = new Date(schedule.start_date);
    const endDate = schedule.end_date ? new Date(schedule.end_date) : null;

    if (!schedule.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }

    if (startDate > today) {
      return <Badge variant="outline">Pending</Badge>;
    }

    if (endDate && endDate < today) {
      return <Badge variant="destructive">Expired</Badge>;
    }

    return <Badge variant="default">Active</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rate Schedule Details</DialogTitle>
          <DialogDescription>
            View complete rate schedule configuration
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Basic Information</h3>
              {getStatusBadge(schedule)}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Authority Type</label>
                <p className="text-sm">{schedule.authority_type}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Service Type</label>
                <p className="text-sm">{schedule.service_type_code || 'General Service'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                <p className="text-sm">{formatDate(schedule.start_date)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">End Date</label>
                <p className="text-sm">{schedule.end_date ? formatDate(schedule.end_date) : 'Ongoing'}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Days & Time */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Days & Time</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Days Covered</label>
                <p className="text-sm">{formatDays(schedule.days_covered)}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Time From</label>
                  <p className="text-sm">{schedule.time_from}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Time Until</label>
                  <p className="text-sm">{schedule.time_until}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Rate Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Rate Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Rate Category</label>
                <p className="text-sm">{rateCategoryLabels[schedule.rate_category]}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Pay Based On</label>
                <p className="text-sm">{payBasedOnLabels[schedule.pay_based_on]}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Charge Type</label>
                <p className="text-sm">{chargeTypeLabels[schedule.charge_type]}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Base Rate</label>
                <p className="text-sm font-semibold">{formatCurrency(schedule.base_rate)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Bank Holiday Multiplier</label>
                <p className="text-sm">{schedule.bank_holiday_multiplier}x</p>
              </div>
            </div>

            {/* Incremental Rates */}
            {(schedule.rate_15_minutes || schedule.rate_30_minutes || schedule.rate_45_minutes || 
              schedule.rate_60_minutes || schedule.consecutive_hours_rate) && (
              <div className="space-y-4">
                <h4 className="font-medium">Incremental Rates</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {schedule.rate_15_minutes && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">15 Minutes</label>
                      <p className="text-sm">{formatCurrency(schedule.rate_15_minutes)}</p>
                    </div>
                  )}
                  
                  {schedule.rate_30_minutes && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">30 Minutes</label>
                      <p className="text-sm">{formatCurrency(schedule.rate_30_minutes)}</p>
                    </div>
                  )}
                  
                  {schedule.rate_45_minutes && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">45 Minutes</label>
                      <p className="text-sm">{formatCurrency(schedule.rate_45_minutes)}</p>
                    </div>
                  )}
                  
                  {schedule.rate_60_minutes && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">60 Minutes</label>
                      <p className="text-sm">{formatCurrency(schedule.rate_60_minutes)}</p>
                    </div>
                  )}
                </div>
                
                {schedule.consecutive_hours_rate && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Consecutive Hours Rate</label>
                    <p className="text-sm">{formatCurrency(schedule.consecutive_hours_rate)}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Metadata */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="text-sm">{formatDate(schedule.created_at)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="text-sm">{formatDate(schedule.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};