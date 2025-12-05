import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calendar, Clock, User } from "lucide-react";
import { format } from "date-fns";

interface CarerUnavailabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: any;
  onSubmit: (reason: string, notes: string) => void;
  isSubmitting?: boolean;
}

const UNAVAILABILITY_REASONS = [
  { value: 'illness', label: 'Personal Illness' },
  { value: 'emergency', label: 'Personal/Family Emergency' },
  { value: 'scheduling_conflict', label: 'Scheduling Conflict' },
  { value: 'transport_issue', label: 'Transportation Issue' },
  { value: 'other', label: 'Other Reason' },
];

export const CarerUnavailabilityDialog: React.FC<CarerUnavailabilityDialogProps> = ({
  open,
  onOpenChange,
  appointment,
  onSubmit,
  isSubmitting = false
}) => {
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const handleSubmit = () => {
    if (!reason) {
      return;
    }
    onSubmit(reason, notes);
    resetForm();
  };

  const resetForm = () => {
    setReason("");
    setNotes("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Request Unavailability
          </DialogTitle>
          <DialogDescription>
            Please provide a reason why you're not available for this appointment. 
            An administrator will review your request and reassign if necessary.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Appointment Details Card */}
          <div className="flex flex-col space-y-3 border rounded-lg p-4 bg-muted">
            <h4 className="text-sm font-semibold">Appointment Details</h4>
            
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {appointment.clients?.first_name} {appointment.clients?.last_name}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(appointment.start_time), "EEEE, MMMM d, yyyy")}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(new Date(appointment.start_time), 'HH:mm')} - 
                {format(new Date(appointment.end_time), 'HH:mm')}
              </span>
            </div>
            
            <div className="text-sm">
              <span className="font-medium">
                {appointment.service_names && appointment.service_names.length > 1 ? 'Services:' : 'Service:'}
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {appointment.service_names && appointment.service_names.length > 0 ? (
                  appointment.service_names.map((name: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-xs bg-primary/10 text-primary">
                      {name}
                    </Badge>
                  ))
                ) : appointment.services?.title ? (
                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                    {appointment.services.title}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">No service selected</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Reason Selection */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason for Unavailability <span className="text-destructive">*</span>
            </Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {UNAVAILABILITY_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Details (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Provide any additional information that might help with reassignment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-24 resize-none"
            />
          </div>
          
          {/* Warning Message */}
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              <strong>Note:</strong> Once submitted, an administrator will review your request. 
              You will be notified of the decision. The appointment will remain assigned to you 
              until it has been reassigned.
            </p>
          </div>
        </div>
        
        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason || isSubmitting}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
