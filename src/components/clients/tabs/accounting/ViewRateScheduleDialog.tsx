import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ClientRateSchedule, dayLabels, rateCategoryLabels, payBasedOnLabels, servicePayerLabels, authorityCategoryLabels, ServicePayer, AuthorityCategory } from '@/types/clientAccounting';
import { formatCurrency } from '@/utils/currencyFormatter';
import { useClientAccountingSettings } from '@/hooks/useClientAccounting';

interface ViewRateScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: ClientRateSchedule;
  clientId: string;
}

export const ViewRateScheduleDialog: React.FC<ViewRateScheduleDialogProps> = ({
  open,
  onOpenChange,
  schedule,
  clientId
}) => {
  const { data: accountingSettings } = useClientAccountingSettings(clientId);
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

  const getRateLabel = () => {
    if (schedule.pay_based_on === 'hours_minutes') {
      return 'Rate Per Hour';
    }
    return 'Base Rate';
  };

  const getMultiplierLabel = (multiplier: number) => {
    if (multiplier === 1) return '1x (Normal Rate)';
    if (multiplier === 1.5) return '1.5x (Time and Half)';
    if (multiplier === 2) return '2x (Double Time)';
    return `${multiplier}x`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Rate Schedule Details</DialogTitle>
            {getStatusBadge(schedule)}
          </div>
          <DialogDescription>
            View complete rate schedule configuration
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Authority Information */}
          {(accountingSettings?.service_payer || schedule.authority_type) && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Authority Information</h4>
              <div className="flex flex-wrap gap-4">
                {accountingSettings?.service_payer && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Who Pays:</span>
                    <Badge variant="outline">
                      {servicePayerLabels[accountingSettings.service_payer as ServicePayer] || accountingSettings.service_payer}
                    </Badge>
                  </div>
                )}
                {schedule.authority_type && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Authority Category:</span>
                    <Badge variant="outline">
                      {authorityCategoryLabels[schedule.authority_type as AuthorityCategory] || schedule.authority_type}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Rate Category</label>
                <p className="text-sm">{rateCategoryLabels[schedule.rate_category]}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Pay Based On</label>
                <p className="text-sm">{payBasedOnLabels[schedule.pay_based_on]}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">{getRateLabel()}</label>
                <p className="text-sm font-semibold">{formatCurrency(schedule.base_rate)}</p>
              </div>
              
              {schedule.bank_holiday_multiplier > 1 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Bank Holiday Multiplier</label>
                  <p className="text-sm">{getMultiplierLabel(schedule.bank_holiday_multiplier)}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* VAT Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">VAT Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">VAT Applicable</label>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={schedule.is_vatable ? "default" : "secondary"}>
                    {schedule.is_vatable ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
              
              {schedule.is_vatable && schedule.vat_rate !== null && schedule.vat_rate !== undefined && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">VAT Rate</label>
                  <p className="text-sm font-semibold">{schedule.vat_rate}%</p>
                </div>
              )}
            </div>
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