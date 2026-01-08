import React from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ServicePlanData, DAYS_OF_WEEK, FREQUENCY_OPTIONS } from "@/types/servicePlan";

interface ViewServicePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: ServicePlanData | null;
}

export function ViewServicePlanDialog({ open, onOpenChange, plan }: ViewServicePlanDialogProps) {
  if (!plan) return null;

  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return "—";
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return format(dateObj, "MMMM d, yyyy");
    } catch {
      return "—";
    }
  };

  const formatDateTime = (dateString: string | undefined): string => {
    if (!dateString) return "—";
    try {
      return format(new Date(dateString), "MMMM d, yyyy 'at' h:mm a");
    } catch {
      return "—";
    }
  };

  const formatTime = (time: string | undefined): string => {
    if (!time) return "—";
    try {
      const [hours, minutes] = time.split(":");
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return format(date, "h:mm a");
    } catch {
      return time;
    }
  };

  const getFrequencyLabel = (value: string): string => {
    const option = FREQUENCY_OPTIONS.find((opt) => opt.value === value);
    return option?.label || value || "—";
  };

  const getServiceNames = (): string => {
    if (plan.service_names && plan.service_names.length > 0) {
      return plan.service_names.join(", ");
    }
    return plan.service_name || "—";
  };

  const getSelectedDaysLabels = (): string[] => {
    if (!plan.selected_days || plan.selected_days.length === 0) return [];
    if (plan.selected_days.length === 7) return ["All Days"];
    return plan.selected_days.map((key) => {
      const day = DAYS_OF_WEEK.find((d) => d.key === key);
      return day?.label || key;
    });
  };

  const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2 border-b border-border last:border-b-0">
      <span className="text-sm font-medium text-muted-foreground sm:w-40 shrink-0">
        {label}
      </span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );

  const selectedDays = getSelectedDaysLabels();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-0 flex-shrink-0">
          <DialogTitle className="text-xl">Service Plan Details</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <div className="space-y-6 py-4">
            {/* General Information */}
            <div>
              <h3 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wide">
                General Information
              </h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <DetailRow label="Caption" value={plan.caption || "—"} />
                <DetailRow
                  label="Status"
                  value={
                    <Badge
                      variant="custom"
                      className={
                        plan.status === "active"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }
                    >
                      {plan.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  }
                />
              </div>
            </div>

          {/* Service Details */}
          <div>
            <h3 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wide">
              Service Details
            </h3>
            <div className="bg-muted/30 rounded-lg p-4">
              <DetailRow label="Service(s)" value={getServiceNames()} />
              <DetailRow label="Authority" value={plan.authority || "—"} />
              <DetailRow label="Authority Category" value={plan.authority_category || "—"} />
              <DetailRow label="Location" value={plan.location || "—"} />
            </div>
          </div>

          {/* Schedule */}
          <div>
            <h3 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wide">
              Schedule
            </h3>
            <div className="bg-muted/30 rounded-lg p-4">
              <DetailRow label="Start Date" value={formatDate(plan.start_date)} />
              <DetailRow label="End Date" value={formatDate(plan.end_date)} />
              <DetailRow label="Start Time" value={formatTime(plan.start_time)} />
              <DetailRow label="End Time" value={formatTime(plan.end_time)} />
              <DetailRow
                label="Days"
                value={
                  selectedDays.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {selectedDays.map((day) => (
                        <Badge key={day} variant="outline" className="text-xs">
                          {day}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    "—"
                  )
                }
              />
              <DetailRow label="Frequency" value={getFrequencyLabel(plan.frequency)} />
            </div>
          </div>

          {/* Notes */}
          {plan.note && (
            <div>
              <h3 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wide">
                Notes
              </h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-foreground whitespace-pre-wrap">{plan.note}</p>
              </div>
            </div>
          )}

            {/* Registration Info */}
            <div>
              <h3 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wide">
                Registration Info
              </h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <DetailRow label="Registered On" value={formatDateTime(plan.registered_on)} />
                <DetailRow
                  label="Registered By"
                  value={
                    plan.registered_by_name && plan.registered_by_name !== "Unknown"
                      ? plan.registered_by_name
                      : "—"
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 pt-4 flex-shrink-0 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
