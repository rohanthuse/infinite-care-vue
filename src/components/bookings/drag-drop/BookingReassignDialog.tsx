import React from "react";
import { format } from "date-fns";
import { AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Booking } from "../BookingTimeGrid";

interface BookingReassignDialogProps {
  open: boolean;
  booking: Booking | null;
  oldStaffName: string;
  newStaffName: string;
  oldStartTime: string;
  oldEndTime: string;
  newStartTime: string;
  newEndTime: string;
  hasConflict?: boolean;
  conflictMessage?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function BookingReassignDialog({
  open,
  booking,
  oldStaffName,
  newStaffName,
  oldStartTime,
  oldEndTime,
  newStartTime,
  newEndTime,
  hasConflict = false,
  conflictMessage,
  onConfirm,
  onCancel,
}: BookingReassignDialogProps) {
  if (!booking) return null;

  const isStaffChanged = oldStaffName !== newStaffName;
  const isTimeChanged = oldStartTime !== newStartTime || oldEndTime !== newEndTime;

  return (
    <AlertDialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isStaffChanged && isTimeChanged
              ? "Reassign Appointment & Change Time?"
              : isStaffChanged
              ? "Reassign Appointment?"
              : "Change Appointment Time?"}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Move <span className="font-semibold">{booking.clientName}</span>'s appointment:
              </p>
              
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">From:</p>
                  {isStaffChanged && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Staff:</span>{" "}
                      <span className="text-foreground">{oldStaffName}</span>
                    </p>
                  )}
                  <p className="text-sm">
                    <span className="text-muted-foreground">Time:</span>{" "}
                    <span className="text-foreground">{oldStartTime} - {oldEndTime}</span>
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">To:</p>
                  {isStaffChanged && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Staff:</span>{" "}
                      <span className="text-foreground font-semibold">{newStaffName}</span>
                    </p>
                  )}
                  <p className="text-sm">
                    <span className="text-muted-foreground">Time:</span>{" "}
                    <span className="text-foreground font-semibold">{newStartTime} - {newEndTime}</span>
                  </p>
                </div>
              </div>

              {hasConflict && conflictMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{conflictMessage}</AlertDescription>
                </Alert>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            disabled={hasConflict}
          >
            Confirm Reassignment
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
