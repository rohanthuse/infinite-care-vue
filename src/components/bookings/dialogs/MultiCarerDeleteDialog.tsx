import React, { useState } from "react";
import { format } from "date-fns";
import { AlertTriangle, User, Users, Trash2, RefreshCw, Calendar, Clock } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AssignedCarer {
  id: string;        // booking record id
  staff_id: string;
  staff_name: string;
}

interface MultiCarerDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: string;
    clientName: string;
    start_time: string;
    end_time: string;
    date?: string;
  };
  assignedCarers: AssignedCarer[];
  onDeleteSingleCarer: (bookingId: string, carerName: string) => Promise<void>;
  onDeleteAllCarers: (bookingIds: string[]) => Promise<void>;
  onReassignCarer: (bookingId: string, carerName: string) => void;
  isDeleting: boolean;
}

type DeleteOption = 'single' | 'all';

export function MultiCarerDeleteDialog({
  open,
  onOpenChange,
  booking,
  assignedCarers,
  onDeleteSingleCarer,
  onDeleteAllCarers,
  onReassignCarer,
  isDeleting,
}: MultiCarerDeleteDialogProps) {
  const [selectedOption, setSelectedOption] = useState<DeleteOption | null>(null);
  const [selectedCarerIndex, setSelectedCarerIndex] = useState<number | null>(null);

  // Format date and time for display
  const formatBookingDate = () => {
    if (booking.date) return booking.date;
    if (booking.start_time) {
      try {
        return format(new Date(booking.start_time), 'dd MMM yyyy');
      } catch {
        return 'Unknown date';
      }
    }
    return 'Unknown date';
  };

  const formatBookingTime = () => {
    if (booking.start_time && booking.end_time) {
      try {
        const start = format(new Date(booking.start_time), 'HH:mm');
        const end = format(new Date(booking.end_time), 'HH:mm');
        return `${start} - ${end}`;
      } catch {
        return 'Unknown time';
      }
    }
    return 'Unknown time';
  };

  const handleConfirm = async () => {
    if (selectedOption === 'all') {
      const allBookingIds = assignedCarers.map(c => c.id);
      await onDeleteAllCarers(allBookingIds);
    } else if (selectedOption === 'single' && selectedCarerIndex !== null) {
      const selectedCarer = assignedCarers[selectedCarerIndex];
      await onDeleteSingleCarer(selectedCarer.id, selectedCarer.staff_name);
    }
  };

  const handleReassign = (carer: AssignedCarer) => {
    onReassignCarer(carer.id, carer.staff_name);
  };

  const isConfirmDisabled = () => {
    if (isDeleting) return true;
    if (!selectedOption) return true;
    if (selectedOption === 'single' && selectedCarerIndex === null) return true;
    return false;
  };

  const resetState = () => {
    setSelectedOption(null);
    setSelectedCarerIndex(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetState();
    }
    onOpenChange(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md">
        {isDeleting && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              <p className="text-sm text-muted-foreground">Deleting...</p>
            </div>
          </div>
        )}

        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-500" />
            Delete 2:1 Care Booking
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-md">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">This booking has multiple carers assigned. Select which carer(s) to remove.</span>
              </div>

              {/* Booking Details */}
              <div className="bg-muted/50 p-3 rounded-md space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{booking.clientName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{formatBookingDate()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{formatBookingTime()}</span>
                </div>
              </div>

              {/* Assigned Carers Section */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Assigned Carers ({assignedCarers.length})
                </Label>

                <RadioGroup
                  value={selectedOption === 'single' && selectedCarerIndex !== null 
                    ? `carer-${selectedCarerIndex}` 
                    : selectedOption === 'all' 
                      ? 'all' 
                      : ''}
                  onValueChange={(value) => {
                    if (value === 'all') {
                      setSelectedOption('all');
                      setSelectedCarerIndex(null);
                    } else if (value.startsWith('carer-')) {
                      setSelectedOption('single');
                      setSelectedCarerIndex(parseInt(value.replace('carer-', '')));
                    }
                  }}
                  className="space-y-2"
                >
                  {/* Individual carer options */}
                  {assignedCarers.map((carer, index) => (
                    <div
                      key={carer.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-md border transition-colors",
                        selectedOption === 'single' && selectedCarerIndex === index
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={`carer-${index}`} id={`carer-${index}`} />
                        <Label 
                          htmlFor={`carer-${index}`} 
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{carer.staff_name}</span>
                        </Label>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          handleReassign(carer);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Reassign
                      </Button>
                    </div>
                  ))}

                  {/* Delete all option */}
                  <div
                    className={cn(
                      "flex items-center p-3 rounded-md border transition-colors mt-4",
                      selectedOption === 'all'
                        ? "border-destructive bg-destructive/5"
                        : "border-border hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="all" id="delete-all" />
                      <Label htmlFor="delete-all" className="flex items-center gap-2 cursor-pointer">
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="text-destructive font-medium">
                          Delete entire appointment (all {assignedCarers.length} carers)
                        </span>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isConfirmDisabled()}
          >
            {isDeleting ? "Deleting..." : selectedOption === 'all' 
              ? "Delete All" 
              : selectedOption === 'single' && selectedCarerIndex !== null
                ? `Remove ${assignedCarers[selectedCarerIndex]?.staff_name}`
                : "Confirm Deletion"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
