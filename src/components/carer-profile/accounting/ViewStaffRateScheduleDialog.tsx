import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { StaffRateSchedule } from "@/hooks/useStaffAccounting";

interface ViewStaffRateScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: StaffRateSchedule;
}

export const ViewStaffRateScheduleDialog: React.FC<ViewStaffRateScheduleDialogProps> = ({
  open,
  onOpenChange,
  schedule,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const formatDays = (days: string[]) => {
    if (!days || days.length === 0) return "None";
    if (days.length === 7) return "All Days";
    return days.join(", ");
  };

  const getStatusBadge = () => {
    const now = new Date();
    const start = new Date(schedule.start_date);
    const end = schedule.end_date ? new Date(schedule.end_date) : null;

    if (!schedule.is_active) {
      return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
    }
    if (now < start) {
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
    if (end && now > end) {
      return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">Active</Badge>;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Ongoing";
    return format(new Date(dateString), "dd/MM/yyyy");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Rate Schedule Details</DialogTitle>
              <DialogDescription>
                View complete rate schedule information
              </DialogDescription>
            </div>
            {getStatusBadge()}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold border-b pb-2">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Authority Type:</span>
                <p className="font-medium capitalize">{schedule.authority_type}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Service Type:</span>
                <p className="font-medium">
                  {schedule.service_types?.name || schedule.service_type_code || 'General Service'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Start Date:</span>
                <p className="font-medium">{formatDate(schedule.start_date)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">End Date:</span>
                <p className="font-medium">{formatDate(schedule.end_date)}</p>
              </div>
            </div>
          </div>

          {/* Days & Time */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold border-b pb-2">Days & Time</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Days Covered:</span>
                <p className="font-medium">{formatDays(schedule.days_covered)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Time Range:</span>
                <p className="font-medium">{schedule.time_from} - {schedule.time_until}</p>
              </div>
            </div>
          </div>

          {/* Rate Configuration */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold border-b pb-2">Rate Configuration</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Rate Category:</span>
                <p className="font-medium capitalize">{schedule.rate_category}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Pay Based On:</span>
                <p className="font-medium capitalize">{schedule.pay_based_on}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Charge Type:</span>
                <p className="font-medium capitalize">{schedule.charge_type.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Base Rate:</span>
                <p className="font-medium text-lg">
                  {formatCurrency(schedule.base_rate)}
                  {schedule.is_vatable && (
                    <Badge variant="outline" className="ml-2 text-xs">+VAT</Badge>
                  )}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Bank Holiday Multiplier:</span>
                <p className="font-medium">{schedule.bank_holiday_multiplier}x</p>
              </div>
            </div>
          </div>

          {/* Incremental Rates */}
          {(schedule.rate_15_minutes || schedule.rate_30_minutes || schedule.rate_45_minutes || schedule.rate_60_minutes || schedule.consecutive_hours_rate) && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold border-b pb-2">Incremental Rates</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {schedule.rate_15_minutes && (
                  <div>
                    <span className="text-muted-foreground">15 Minutes:</span>
                    <p className="font-medium">{formatCurrency(schedule.rate_15_minutes)}</p>
                  </div>
                )}
                {schedule.rate_30_minutes && (
                  <div>
                    <span className="text-muted-foreground">30 Minutes:</span>
                    <p className="font-medium">{formatCurrency(schedule.rate_30_minutes)}</p>
                  </div>
                )}
                {schedule.rate_45_minutes && (
                  <div>
                    <span className="text-muted-foreground">45 Minutes:</span>
                    <p className="font-medium">{formatCurrency(schedule.rate_45_minutes)}</p>
                  </div>
                )}
                {schedule.rate_60_minutes && (
                  <div>
                    <span className="text-muted-foreground">60 Minutes:</span>
                    <p className="font-medium">{formatCurrency(schedule.rate_60_minutes)}</p>
                  </div>
                )}
                {schedule.consecutive_hours_rate && (
                  <div>
                    <span className="text-muted-foreground">Consecutive Hours:</span>
                    <p className="font-medium">{formatCurrency(schedule.consecutive_hours_rate)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold border-b pb-2">Metadata</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Created:</span>
                <p className="font-medium">{format(new Date(schedule.created_at), "dd/MM/yyyy HH:mm")}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Last Updated:</span>
                <p className="font-medium">{format(new Date(schedule.updated_at), "dd/MM/yyyy HH:mm")}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
