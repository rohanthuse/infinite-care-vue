import React, { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertCircle, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Booking, Carer } from "./BookingTimeGrid";
import { doBookingsOverlap } from "./drag-drop/dragDropHelpers";

interface BookingBatchReassignDialogProps {
  open: boolean;
  selectedBookings: Booking[];
  carers: Carer[];
  existingBookings: Booking[];
  isLoading?: boolean;
  onConfirm: (newStaffId: string) => void;
  onCancel: () => void;
}

export function BookingBatchReassignDialog({
  open,
  selectedBookings,
  carers,
  existingBookings,
  isLoading = false,
  onConfirm,
  onCancel,
}: BookingBatchReassignDialogProps) {
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");

  // Check for conflicts when a staff is selected
  const getConflicts = (staffId: string) => {
    if (!staffId) return [];
    
    const conflicts: Array<{ booking: Booking; conflictCount: number }> = [];
    
    selectedBookings.forEach(booking => {
      const conflictingBookings = existingBookings.filter(b => 
        b.carerId === staffId && 
        b.id !== booking.id &&
        b.date === booking.date &&
        doBookingsOverlap(booking.startTime, booking.endTime, b.startTime, b.endTime)
      );
      
      if (conflictingBookings.length > 0) {
        conflicts.push({
          booking,
          conflictCount: conflictingBookings.length
        });
      }
    });
    
    return conflicts;
  };

  const conflicts = selectedStaffId ? getConflicts(selectedStaffId) : [];
  const hasConflicts = conflicts.length > 0;
  const selectedStaff = carers.find(c => c.id === selectedStaffId);

  const handleConfirm = () => {
    if (selectedStaffId && !isLoading) {
      onConfirm(selectedStaffId);
      setSelectedStaffId("");
    }
  };

  const handleCancel = () => {
    setSelectedStaffId("");
    onCancel();
  };

  return (
    <AlertDialog open={open} onOpenChange={(open) => !open && handleCancel()}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Batch Reassign Appointments
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left space-y-3">
            <p>
              You are about to reassign <strong>{selectedBookings.length}</strong> appointment{selectedBookings.length > 1 ? 's' : ''} to a new staff member.
            </p>
            
            <div className="space-y-2 mt-4">
              <Label htmlFor="staff-select">Select New Staff Member</Label>
              <Select 
                value={selectedStaffId} 
                onValueChange={setSelectedStaffId}
                disabled={isLoading}
              >
                <SelectTrigger id="staff-select">
                  <SelectValue placeholder="Choose a staff member..." />
                </SelectTrigger>
                <SelectContent>
                  {carers.map((carer) => (
                    <SelectItem key={carer.id} value={carer.id}>
                      {carer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasConflicts && selectedStaff && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Scheduling Conflicts Detected</strong>
                  <div className="mt-2 text-sm">
                    {conflicts.length} appointment{conflicts.length > 1 ? 's' : ''} will overlap with {selectedStaff.name}'s existing schedule. This may cause double-booking issues.
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {selectedStaffId && !hasConflicts && (
              <Alert className="mt-4 border-green-200 bg-green-50">
                <AlertCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  No conflicts detected. {selectedStaff?.name} is available for all selected appointments.
                </AlertDescription>
              </Alert>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={!selectedStaffId || hasConflicts || isLoading}
          >
            {isLoading ? "Reassigning..." : `Reassign ${selectedBookings.length} Appointment${selectedBookings.length > 1 ? 's' : ''}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
