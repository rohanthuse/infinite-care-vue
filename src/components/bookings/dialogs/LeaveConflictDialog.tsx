import React, { useState } from "react";
import { AlertTriangle, CalendarOff, Check, X, UserMinus, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { RecurringLeaveValidationResult } from "@/hooks/useStaffLeaveAvailability";

export type LeaveConflictResolution = 'skip' | 'reassign' | 'cancel';

interface LeaveConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflictData: RecurringLeaveValidationResult;
  onResolve: (resolution: LeaveConflictResolution) => void;
}

export function LeaveConflictDialog({
  open,
  onOpenChange,
  conflictData,
  onResolve,
}: LeaveConflictDialogProps) {
  const [selectedResolution, setSelectedResolution] = useState<LeaveConflictResolution>('skip');

  const handleConfirm = () => {
    onResolve(selectedResolution);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onResolve('cancel');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Leave Conflict Detected
          </DialogTitle>
          <DialogDescription>
            {conflictData.carerName} is on approved {conflictData.leaveInfo?.leaveType} leave.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Leave Period Info */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-medium">
              <CalendarOff className="h-4 w-4" />
              Leave Period: {conflictData.leaveInfo?.formattedRange}
            </div>
          </div>

          {/* Conflict Summary */}
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{conflictData.conflictCount}</span> of{" "}
            <span className="font-medium text-foreground">{conflictData.totalDates}</span> bookings 
            would conflict with this leave period.
          </div>

          {/* Conflicting Dates List */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Affected dates:</p>
            <ScrollArea className="h-32 rounded-md border">
              <div className="p-3 space-y-1">
                {conflictData.conflictingDates.map((conflict) => (
                  <div
                    key={conflict.date}
                    className="flex items-center justify-between py-1 px-2 rounded bg-red-50 dark:bg-red-950/20"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs">
                        On Leave
                      </Badge>
                      <span className="text-sm">{conflict.formattedDate}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{conflict.dayOfWeek}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Resolution Options */}
          <div className="space-y-3">
            <p className="text-sm font-medium">What would you like to do?</p>
            <RadioGroup
              value={selectedResolution}
              onValueChange={(value) => setSelectedResolution(value as LeaveConflictResolution)}
              className="space-y-3"
            >
              <label
                className={cn(
                  "flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                  selectedResolution === 'skip'
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/50"
                )}
              >
                <RadioGroupItem value="skip" className="mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 font-medium">
                    <UserMinus className="h-4 w-4 text-blue-600" />
                    Skip conflicted dates
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Create {conflictData.nonConflictingDates.length} bookings, skip {conflictData.conflictCount} conflicting dates
                  </p>
                </div>
              </label>

              <label
                className={cn(
                  "flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors opacity-50 pointer-events-none",
                  selectedResolution === 'reassign'
                    ? "border-primary bg-primary/5"
                    : "border-border"
                )}
              >
                <RadioGroupItem value="reassign" disabled className="mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 font-medium text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Reassign conflicted dates (Coming soon)
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select an alternate carer for the conflicting dates
                  </p>
                </div>
              </label>

              <label
                className={cn(
                  "flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                  selectedResolution === 'cancel'
                    ? "border-destructive bg-destructive/5"
                    : "border-border hover:border-muted-foreground/50"
                )}
              >
                <RadioGroupItem value="cancel" className="mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 font-medium">
                    <X className="h-4 w-4 text-destructive" />
                    Cancel - don't create any bookings
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Go back and modify the booking details
                  </p>
                </div>
              </label>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            variant={selectedResolution === 'cancel' ? 'destructive' : 'default'}
          >
            {selectedResolution === 'skip' && (
              <>
                <Check className="h-4 w-4 mr-2" />
                Skip & Create {conflictData.nonConflictingDates.length} Bookings
              </>
            )}
            {selectedResolution === 'reassign' && 'Select Alternate Carer'}
            {selectedResolution === 'cancel' && 'Cancel Booking'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
