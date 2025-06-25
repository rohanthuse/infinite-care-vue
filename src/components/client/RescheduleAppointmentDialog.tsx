
import React, { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useRescheduleAppointment } from "@/hooks/useRescheduleAppointment";

interface RescheduleAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: {
    id: string;
    appointment_type: string;
    provider_name: string;
    appointment_date: string;
    appointment_time: string;
    location: string;
  } | null;
}

export const RescheduleAppointmentDialog: React.FC<RescheduleAppointmentDialogProps> = ({
  open,
  onOpenChange,
  appointment,
}) => {
  const [date, setDate] = useState<Date | undefined>(appointment ? new Date(appointment.appointment_date) : undefined);
  const [timeSlot, setTimeSlot] = useState<string>(appointment?.appointment_time || "");
  const [reason, setReason] = useState<string>("");
  
  const rescheduleAppointmentMutation = useRescheduleAppointment();

  // Expanded available time slots including half-hour increments
  const availableTimeSlots = [
    "9:00 AM",
    "9:30 AM",
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "12:00 PM",
    "12:30 PM",
    "1:00 PM",
    "1:30 PM",
    "2:00 PM",
    "2:30 PM",
    "3:00 PM",
    "3:30 PM",
    "4:00 PM",
    "4:30 PM",
    "5:00 PM",
  ];

  const handleSubmit = async () => {
    if (!date || !timeSlot || !appointment) {
      console.warn('[RescheduleAppointmentDialog] Missing required fields:', {
        date: !!date,
        timeSlot: !!timeSlot,
        appointment: !!appointment
      });
      return;
    }

    try {
      console.log('[RescheduleAppointmentDialog] Submitting reschedule request:', {
        appointmentId: appointment.id,
        newDate: date,
        newTimeSlot: timeSlot,
        reason: reason.trim()
      });

      await rescheduleAppointmentMutation.mutateAsync({
        appointmentId: appointment.id,
        newDate: date,
        newTimeSlot: timeSlot,
        reason: reason.trim() || undefined,
      });

      // Reset form and close dialog
      setReason("");
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the mutation
      console.error('[RescheduleAppointmentDialog] Reschedule error:', error);
    }
  };

  const handleClose = () => {
    if (!rescheduleAppointmentMutation.isPending) {
      setReason("");
      onOpenChange(false);
    }
  };

  if (!appointment) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reschedule Appointment</DialogTitle>
          <DialogDescription>
            Please select a new date and time for your {appointment.appointment_type} appointment with {appointment.provider_name}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="date" className="text-sm font-medium">
              Select a New Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Select a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="grid gap-2">
            <label className="text-sm font-medium">
              Select a New Time
            </label>
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {availableTimeSlots.map((slot) => (
                <Button
                  key={slot}
                  type="button"
                  variant={timeSlot === slot ? "default" : "outline"}
                  className={cn("text-sm", timeSlot === slot && "bg-blue-600")}
                  onClick={() => setTimeSlot(slot)}
                >
                  <Clock className="mr-1 h-3 w-3" />
                  {slot}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="reason" className="text-sm font-medium">
              Reason for Rescheduling (Optional)
            </label>
            <Textarea
              id="reason"
              placeholder="Please explain why you need to reschedule..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              disabled={rescheduleAppointmentMutation.isPending}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={rescheduleAppointmentMutation.isPending}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit} 
            disabled={rescheduleAppointmentMutation.isPending || !date || !timeSlot}
          >
            {rescheduleAppointmentMutation.isPending ? "Rescheduling..." : "Confirm Reschedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
