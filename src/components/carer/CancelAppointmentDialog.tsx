
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
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface CancelAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: any;
  onCancelRequest: (appointmentId: string, reason: string, notes: string) => void;
}

const CancelAppointmentDialog: React.FC<CancelAppointmentDialogProps> = ({
  open,
  onOpenChange,
  appointment,
  onCancelRequest,
}) => {
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!reason) {
      toast.error("Please select a cancellation reason");
      return;
    }

    setIsSubmitting(true);
    
    try {
      onCancelRequest(appointment.id, reason, notes);
      setIsSubmitting(false);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error submitting cancellation request:", error);
      setIsSubmitting(false);
      toast.error("Failed to submit cancellation request. Please try again.");
    }
  };

  const resetForm = () => {
    setReason("");
    setNotes("");
  };

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetForm();
      onOpenChange(newOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Appointment Cancellation</DialogTitle>
          <DialogDescription>
            Please provide a reason for cancelling this appointment. Your request will be reviewed by an administrator.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex flex-col space-y-2 border rounded-lg p-3 bg-gray-50">
            <p className="text-sm font-medium">Appointment Details</p>
            <p className="text-sm">{appointment.clientName}</p>
            <p className="text-xs text-gray-500">{format(appointment.date, "EEEE, MMMM d, yyyy")}</p>
            <p className="text-xs text-gray-500">{appointment.time}</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason">Cancellation Reason <span className="text-red-500">*</span></Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="illness">Carer Illness</SelectItem>
                <SelectItem value="emergency">Personal Emergency</SelectItem>
                <SelectItem value="scheduling_conflict">Scheduling Conflict</SelectItem>
                <SelectItem value="transport_issue">Transportation Issue</SelectItem>
                <SelectItem value="other">Other Reason</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Please provide any additional details about your cancellation request"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-24"
            />
          </div>
          
          <div className="flex items-center space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <p className="text-xs text-amber-700">
              Your request will need to be approved by an administrator. You are still responsible for this appointment until the request is approved.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancelAppointmentDialog;
