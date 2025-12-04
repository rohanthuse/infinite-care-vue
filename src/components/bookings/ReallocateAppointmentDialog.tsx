
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
import { Calendar, Clock, MapPin, User, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

// Safe date formatter to prevent crashes on null/undefined dates
const formatDate = (date: string | Date | null | undefined, formatStr: string): string => {
  if (!date) return "N/A";
  try {
    return format(date instanceof Date ? date : new Date(date), formatStr);
  } catch {
    return "Invalid date";
  }
};

interface ReallocateAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: any;
  onReallocate: (appointmentId: string, newCarerId: string) => void;
}

// Mock data for available carers
const availableCarers = [
  { id: "c1", name: "John Smith", rating: 4.8, distance: "2 miles", availability: "Full day" },
  { id: "c2", name: "Alice Johnson", rating: 4.9, distance: "3 miles", availability: "Morning only" },
  { id: "c3", name: "Robert Davis", rating: 4.7, distance: "1 mile", availability: "Afternoon only" },
  { id: "c4", name: "Maria Garcia", rating: 4.5, distance: "5 miles", availability: "Full day" }
];

const ReallocateAppointmentDialog: React.FC<ReallocateAppointmentDialogProps> = ({
  open,
  onOpenChange,
  appointment,
  onReallocate,
}) => {
  const [selectedCarer, setSelectedCarer] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!selectedCarer) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      onReallocate(appointment.id, selectedCarer);
      setIsSubmitting(false);
      resetForm();
    } catch (error) {
      console.error("Error reallocating appointment:", error);
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedCarer("");
  };

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetForm();
      onOpenChange(newOpen);
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reallocate Appointment</DialogTitle>
          <DialogDescription>
            Select a new carer to take over this appointment.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="flex flex-col space-y-2 border rounded-lg p-3 bg-gray-50">
            <p className="text-sm font-medium">Appointment Details</p>
            <p className="text-sm">{appointment.clientName || appointment.client_name || "Unknown Client"}</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="flex items-center text-xs text-gray-600">
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                <span>{formatDate(appointment.date || appointment.new_date || appointment.bookings?.start_time, "EEE, MMM d, yyyy")}</span>
              </div>
              <div className="flex items-center text-xs text-gray-600">
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                <span>{appointment.time || appointment.new_time || formatDate(appointment.bookings?.start_time, "HH:mm") || "N/A"}</span>
              </div>
              <div className="flex items-center text-xs text-gray-600">
                <MapPin className="h-3.5 w-3.5 mr-1.5" />
                <span>{appointment.location || "No location specified"}</span>
              </div>
              <div className="flex items-center text-xs text-gray-600">
                <User className="h-3.5 w-3.5 mr-1.5" />
                <span>{appointment.type || appointment.service_title || "N/A"}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="carer">Select New Carer <span className="text-red-500">*</span></Label>
            <Select value={selectedCarer} onValueChange={setSelectedCarer}>
              <SelectTrigger id="carer">
                <SelectValue placeholder="Choose a carer" />
              </SelectTrigger>
              <SelectContent>
                {availableCarers.map(carer => (
                  <SelectItem key={carer.id} value={carer.id}>
                    {carer.name} - {carer.distance} - {carer.availability}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {availableCarers.map(carer => (
            selectedCarer === carer.id && (
              <div key={carer.id} className="border rounded-md p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium">
                      {carer.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className="font-medium">{carer.name}</p>
                      <p className="text-xs text-gray-500">Rating: {carer.rating}/5.0</p>
                    </div>
                  </div>
                  <Badge>{carer.availability}</Badge>
                </div>
              </div>
            )
          ))}
          
          <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg mt-2">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <p className="text-xs text-blue-700">
              Both carers will be notified about this reassignment once confirmed.
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
            disabled={!selectedCarer || isSubmitting}
          >
            Confirm Reallocation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReallocateAppointmentDialog;
