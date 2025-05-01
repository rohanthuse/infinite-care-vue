
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
import { useToast } from "@/hooks/use-toast";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from "@/components/ui/form";
import { useForm } from "react-hook-form";

interface RequestAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RequestAppointmentDialog: React.FC<RequestAppointmentDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [date, setDate] = useState<Date | undefined>(
    new Date(new Date().setDate(new Date().getDate() + 3)) // Default to 3 days from now
  );
  const [timeSlot, setTimeSlot] = useState<string>("10:00 AM");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [serviceType, setServiceType] = useState<string>("");
  
  const form = useForm({
    defaultValues: {
      notes: "",
      serviceType: "",
    },
  });

  const availableTimeSlots = [
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
  ];

  const serviceTypes = [
    "Therapy Session", 
    "Consultation", 
    "Check-up", 
    "Follow-up", 
    "Specialist Appointment"
  ];

  const handleSubmit = () => {
    if (!date || !timeSlot || !serviceType) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      onOpenChange(false);
      
      toast({
        title: "Appointment Requested",
        description: `Your ${serviceType} appointment has been requested for ${format(date, "MMMM d, yyyy")} at ${timeSlot}. You will receive a confirmation shortly.`,
      });
      
      // Reset form
      setDate(new Date(new Date().setDate(new Date().getDate() + 3)));
      setTimeSlot("10:00 AM");
      setServiceType("");
      form.reset();
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request New Appointment</DialogTitle>
          <DialogDescription>
            Please select the details for the appointment you'd like to request.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Service Type */}
          <div className="grid gap-2">
            <label htmlFor="service-type" className="text-sm font-medium">
              Service Type
            </label>
            <Select 
              value={serviceType} 
              onValueChange={setServiceType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((service) => (
                  <SelectItem key={service} value={service}>
                    {service}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Date Selection */}
          <div className="grid gap-2">
            <label htmlFor="date" className="text-sm font-medium">
              Preferred Date
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
          
          {/* Time Selection */}
          <div className="grid gap-2">
            <label className="text-sm font-medium">
              Preferred Time
            </label>
            <div className="grid grid-cols-3 gap-2">
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
          
          {/* Notes */}
          <div className="grid gap-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Additional Notes (Optional)
            </label>
            <Textarea
              id="notes"
              placeholder="Please provide any details about your appointment request..."
              value={form.watch("notes")}
              onChange={(e) => form.setValue("notes", e.target.value)}
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
