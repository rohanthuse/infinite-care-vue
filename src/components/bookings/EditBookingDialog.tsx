
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Booking, Client, Carer } from "./BookingTimeGrid";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Calendar, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";

interface EditBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  clients: Client[];
  carers: Carer[];
  onUpdateBooking: (booking: Booking) => void;
}

export const EditBookingDialog: React.FC<EditBookingDialogProps> = ({
  open,
  onOpenChange,
  booking,
  clients,
  carers,
  onUpdateBooking,
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedCarerId, setSelectedCarerId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [bookingDate, setBookingDate] = useState<string>("");
  
  useEffect(() => {
    if (booking) {
      setSelectedClientId(booking.clientId);
      setSelectedCarerId(booking.carerId);
      setNotes(booking.notes || "");
      setStatus(booking.status);
      setStartTime(booking.startTime);
      setEndTime(booking.endTime);
      setBookingDate(booking.date);
    }
  }, [booking]);
  
  const formatDate = (dateString: string): string => {
    try {
      return format(parseISO(dateString), 'EEEE, MMMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };
  
  const calculateDuration = (): string => {
    if (!startTime || !endTime) return "";
    
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    let durationHours = endHour - startHour;
    let durationMinutes = endMin - startMin;
    
    if (durationMinutes < 0) {
      durationHours -= 1;
      durationMinutes += 60;
    }
    
    if (durationHours < 0) {
      durationHours += 24;
    }
    
    const hours = durationHours > 0 ? `${durationHours} hour${durationHours !== 1 ? 's' : ''}` : '';
    const minutes = durationMinutes > 0 ? `${durationMinutes} minute${durationMinutes !== 1 ? 's' : ''}` : '';
    
    if (hours && minutes) {
      return `${hours} and ${minutes}`;
    }
    
    return hours || minutes || "0 minutes";
  };
  
  const handleSave = () => {
    if (!booking) return;
    
    const selectedClient = clients.find(c => c.id === selectedClientId);
    const selectedCarer = carers.find(c => c.id === selectedCarerId);
    
    if (!selectedClient || !selectedCarer) {
      toast.error("Please select both client and carer");
      return;
    }
    
    const updatedBooking: Booking = {
      ...booking,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      clientInitials: selectedClient.initials,
      carerId: selectedCarer.id,
      carerName: selectedCarer.name,
      startTime: startTime,
      endTime: endTime,
      date: bookingDate,
      notes: notes,
      status: status as Booking["status"],
    };
    
    onUpdateBooking(updatedBooking);
    toast.success("Booking updated successfully");
    onOpenChange(false);
  };

  const validateTimeChange = (newStartTime: string, newEndTime: string): boolean => {
    // Parse the times
    const [startHour, startMin] = newStartTime.split(':').map(Number);
    const [endHour, endMin] = newEndTime.split(':').map(Number);
    
    // Convert to total minutes for easy comparison
    const startInMinutes = startHour * 60 + startMin;
    const endInMinutes = endHour * 60 + endMin;
    
    // Check if end time is after start time
    if (endInMinutes <= startInMinutes) {
      toast.error("End time must be after start time");
      return false;
    }
    
    // Check if booking is within business hours (6:00 to 22:00)
    const businessStartMinutes = 6 * 60; // 6:00
    const businessEndMinutes = 22 * 60; // 22:00
    
    if (startInMinutes < businessStartMinutes) {
      toast.error("Bookings can only start at or after 06:00");
      return false;
    }
    
    if (endInMinutes > businessEndMinutes) {
      toast.error("Bookings must end at or before 22:00");
      return false;
    }
    
    return true;
  };
  
  const handleStartTimeChange = (newStartTime: string) => {
    if (validateTimeChange(newStartTime, endTime)) {
      setStartTime(newStartTime);
    }
  };
  
  const handleEndTimeChange = (newEndTime: string) => {
    if (validateTimeChange(startTime, newEndTime)) {
      setEndTime(newEndTime);
    }
  };
  
  if (!booking) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Booking</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Schedule section */}
          <div className="rounded-md bg-slate-50 p-3 border border-slate-200">
            <h3 className="text-sm font-medium text-slate-900 mb-2 flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Schedule Information
            </h3>
            <div className="grid gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Date:</span>
                <span className="font-medium">{formatDate(bookingDate)}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 items-center">
                <div className="col-span-1">
                  <Label htmlFor="startTime" className="text-xs">Start Time</Label>
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1 text-slate-400" />
                    <Input 
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      className="h-8 text-sm" 
                    />
                  </div>
                </div>
                <div className="col-span-1">
                  <Label htmlFor="endTime" className="text-xs">End Time</Label>
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1 text-slate-400" />
                    <Input 
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => handleEndTimeChange(e.target.value)}
                      className="h-8 text-sm" 
                    />
                  </div>
                </div>
                <div className="col-span-1">
                  <Label className="text-xs">Duration</Label>
                  <div className="bg-white border border-slate-200 rounded p-1 text-xs h-8 flex items-center justify-center text-slate-700">
                    {calculateDuration()}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="client">Client</Label>
            <Select
              value={selectedClientId}
              onValueChange={setSelectedClientId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    <div className="flex items-center">
                      <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium mr-2">
                        {client.initials}
                      </div>
                      <span>{client.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="carer">Carer</Label>
            <Select
              value={selectedCarerId}
              onValueChange={setSelectedCarerId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select carer" />
              </SelectTrigger>
              <SelectContent>
                {carers.map((carer) => (
                  <SelectItem key={carer.id} value={carer.id}>
                    <div className="flex items-center">
                      <div className="h-6 w-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-medium mr-2">
                        {carer.initials}
                      </div>
                      <span>{carer.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={status}
              onValueChange={setStatus}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <SelectItem value="done">Done</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="departed">Departed</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this booking"
              className="resize-none"
            />
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
