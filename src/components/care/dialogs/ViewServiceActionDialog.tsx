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
import {
  ServiceActionData,
  SHIFT_OPTIONS,
  ACTION_FREQUENCY_OPTIONS,
} from "@/types/serviceAction";

const DAYS_OF_WEEK_SHORT: Record<string, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

interface ViewServiceActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: ServiceActionData | null;
}

export function ViewServiceActionDialog({
  open,
  onOpenChange,
  action,
}: ViewServiceActionDialogProps) {
  if (!action) return null;

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
    const option = ACTION_FREQUENCY_OPTIONS.find((opt) => opt.value === value);
    return option?.label || value || "—";
  };

  const getShiftLabels = (): string[] => {
    if (!action.shift_times || action.shift_times.length === 0) return [];
    return action.shift_times.map((key) => {
      const shift = SHIFT_OPTIONS.find((s) => s.key === key);
      return shift?.label || key;
    });
  };

  const getSelectedDaysLabels = (): string[] => {
    if (!action.selected_days || action.selected_days.length === 0) return [];
    if (action.selected_days.length === 7) return ["All Days"];
    return action.selected_days.map((key) => DAYS_OF_WEEK_SHORT[key] || key);
  };

  const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2 border-b border-border last:border-b-0">
      <span className="text-sm font-medium text-muted-foreground sm:w-44 shrink-0">
        {label}
      </span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );

  const shiftLabels = getShiftLabels();
  const selectedDays = getSelectedDaysLabels();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-0 flex-shrink-0">
          <DialogTitle className="text-xl">Service Action Details</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <div className="space-y-6 py-4">
            {/* Action Information */}
            <div>
              <h3 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wide">
                Action Information
              </h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <DetailRow label="Action Name" value={action.action_name || "—"} />
                <DetailRow
                  label="Action Type"
                  value={
                    <Badge
                      variant="custom"
                      className={
                        action.action_type === "existing"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                      }
                    >
                      {action.action_type === "existing" ? "Existing Action" : "New Action"}
                    </Badge>
                  }
                />
                <DetailRow
                  label="Status"
                  value={
                    <Badge
                      variant="custom"
                      className={
                        action.status === "active"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }
                    >
                      {action.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  }
                />
              </div>
            </div>

          {/* Requirements */}
          <div>
            <h3 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wide">
              Requirements
            </h3>
            <div className="bg-muted/30 rounded-lg p-4">
              <DetailRow
                label="Has Instructions"
                value={action.has_instructions ? "Yes" : "No"}
              />
              {action.has_instructions && action.instructions && (
                <DetailRow label="Instructions" value={action.instructions} />
              )}
              <DetailRow
                label="Required Written Outcome"
                value={action.required_written_outcome ? "Yes" : "No"}
              />
              {action.required_written_outcome && action.written_outcome && (
                <DetailRow label="Written Outcome" value={action.written_outcome} />
              )}
              <DetailRow
                label="Service Specific"
                value={action.is_service_specific ? "Yes" : "No"}
              />
              {action.is_service_specific && action.linked_service_name && (
                <DetailRow label="Linked Service" value={action.linked_service_name} />
              )}
            </div>
          </div>

          {/* Schedule */}
          <div>
            <h3 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wide">
              Schedule
            </h3>
            <div className="bg-muted/30 rounded-lg p-4">
              <DetailRow label="Start Date" value={formatDate(action.start_date)} />
              <DetailRow label="End Date" value={formatDate(action.end_date)} />
              <DetailRow
                label="Schedule Type"
                value={
                  action.schedule_type === "shift" ? "Shift-Based" : "Time Specific"
                }
              />
              {action.schedule_type === "shift" ? (
                <DetailRow
                  label="Shift Times"
                  value={
                    shiftLabels.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {shiftLabels.map((shift) => (
                          <Badge key={shift} variant="outline" className="text-xs">
                            {shift}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      "—"
                    )
                  }
                />
              ) : (
                <>
                  <DetailRow label="Start Time" value={formatTime(action.start_time)} />
                  <DetailRow label="End Time" value={formatTime(action.end_time)} />
                </>
              )}
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
              <DetailRow label="Frequency" value={getFrequencyLabel(action.frequency)} />
            </div>
          </div>

          {/* Notes */}
          {action.notes && (
            <div>
              <h3 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wide">
                Notes
              </h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-foreground whitespace-pre-wrap">{action.notes}</p>
              </div>
            </div>
          )}

          {/* Registration Info */}
          <div>
            <h3 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wide">
              Registration Info
            </h3>
            <div className="bg-muted/30 rounded-lg p-4">
              <DetailRow label="Registered On" value={formatDateTime(action.registered_on)} />
              <DetailRow
                label="Registered By"
                value={
                  action.registered_by_name && action.registered_by_name !== "Unknown"
                    ? action.registered_by_name
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
