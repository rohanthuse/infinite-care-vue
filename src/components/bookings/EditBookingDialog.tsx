
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Calendar, Clock, AlertTriangle, CalendarCheck, Users } from "lucide-react";
import { format, parseISO, isSameDay } from "date-fns";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

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
  const [showScheduleConflict, setShowScheduleConflict] = useState<boolean>(false);
  const [conflictType, setConflictType] = useState<"client" | "carer" | null>(null);
  const [conflictEntity, setConflictEntity] = useState<string>("");
  const [clientSchedule, setClientSchedule] = useState<Booking[]>([]);
  const [carerSchedule, setCarerSchedule] = useState<Booking[]>([]);
  
  useEffect(() => {
    if (booking) {
      setSelectedClientId(booking.clientId);
      setSelectedCarerId(booking.carerId);
      setNotes(booking.notes || "");
      setStatus(booking.status);
      setStartTime(booking.startTime);
      setEndTime(booking.endTime);
      setBookingDate(booking.date);
      
      // Load client schedule when booking changes
      updateClientSchedule(booking.clientId);
      
      // Load carer schedule when booking changes
      updateCarerSchedule(booking.carerId);
    }
  }, [booking]);
  
  // Update client schedule when client changes
  const updateClientSchedule = (clientId: string) => {
    const selectedClient = clients.find(c => c.id === clientId);
    if (selectedClient && selectedClient.bookings) {
      // Get all bookings for this client
      setClientSchedule(selectedClient.bookings);
    } else {
      setClientSchedule([]);
    }
  };
  
  // Update carer schedule when carer changes
  const updateCarerSchedule = (carerId: string) => {
    const selectedCarer = carers.find(c => c.id === carerId);
    if (selectedCarer && selectedCarer.bookings) {
      // Get all bookings for this carer
      setCarerSchedule(selectedCarer.bookings);
    } else {
      setCarerSchedule([]);
    }
  };
  
  // Handle client selection
  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    updateClientSchedule(clientId);
  };
  
  // Handle carer selection
  const handleCarerChange = (carerId: string) => {
    setSelectedCarerId(carerId);
    updateCarerSchedule(carerId);
  };
  
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
  
  // Check for scheduling conflicts
  const checkSchedulingConflicts = (): boolean => {
    if (!booking) return false;
    
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startInMinutes = startHour * 60 + startMin;
    const endInMinutes = endHour * 60 + endMin;
    
    // Check client schedule
    const clientConflicts = clientSchedule.filter(b => {
      // Skip the current booking when checking conflicts
      if (b.id === booking.id) return false;
      
      // Only check bookings on the same day
      if (!isSameDay(parseISO(b.date), parseISO(bookingDate))) return false;
      
      const bStartParts = b.startTime.split(':').map(Number);
      const bEndParts = b.endTime.split(':').map(Number);
      
      const bStartInMinutes = bStartParts[0] * 60 + bStartParts[1];
      const bEndInMinutes = bEndParts[0] * 60 + bEndParts[1];
      
      // Check if there's overlap
      return (startInMinutes < bEndInMinutes && endInMinutes > bStartInMinutes);
    });
    
    // Check carer schedule
    const carerConflicts = carerSchedule.filter(b => {
      // Skip the current booking when checking conflicts
      if (b.id === booking.id) return false;
      
      // Only check bookings on the same day
      if (!isSameDay(parseISO(b.date), parseISO(bookingDate))) return false;
      
      const bStartParts = b.startTime.split(':').map(Number);
      const bEndParts = b.endTime.split(':').map(Number);
      
      const bStartInMinutes = bStartParts[0] * 60 + bStartParts[1];
      const bEndInMinutes = bEndParts[0] * 60 + bEndParts[1];
      
      // Check if there's overlap
      return (startInMinutes < bEndInMinutes && endInMinutes > bStartInMinutes);
    });
    
    if (clientConflicts.length > 0) {
      const client = clients.find(c => c.id === selectedClientId);
      setConflictType("client");
      setConflictEntity(client ? client.name : "Client");
      setShowScheduleConflict(true);
      return true;
    }
    
    if (carerConflicts.length > 0) {
      const carer = carers.find(c => c.id === selectedCarerId);
      setConflictType("carer");
      setConflictEntity(carer ? carer.name : "Carer");
      setShowScheduleConflict(true);
      return true;
    }
    
    return false;
  };
  
  const handleSave = () => {
    if (!booking) return;
    
    const selectedClient = clients.find(c => c.id === selectedClientId);
    const selectedCarer = carers.find(c => c.id === selectedCarerId);
    
    if (!selectedClient || !selectedCarer) {
      toast.error("Please select both client and carer");
      return;
    }
    
    // Check for scheduling conflicts
    if (checkSchedulingConflicts()) {
      // Dialog will be shown by checkSchedulingConflicts
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
  
  // Format schedule times for display
  const formatScheduleTimes = (startTime: string, endTime: string): string => {
    return `${startTime} - ${endTime}`;
  };
  
  // Get bookings for today for the selected client or carer
  const getTodayBookings = (schedule: Booking[]): Booking[] => {
    if (!bookingDate || !schedule.length) return [];
    
    return schedule.filter(b => 
      isSameDay(parseISO(b.date), parseISO(bookingDate))
    ).sort((a, b) => {
      const [aHour, aMin] = a.startTime.split(':').map(Number);
      const [bHour, bMin] = b.startTime.split(':').map(Number);
      
      const aMinutes = aHour * 60 + aMin;
      const bMinutes = bHour * 60 + bMin;
      
      return aMinutes - bMinutes;
    });
  };
  
  const clientTodayBookings = getTodayBookings(clientSchedule);
  const carerTodayBookings = getTodayBookings(carerSchedule);
  
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'assigned': return 'bg-green-100 text-green-800 border-green-300';
      case 'unassigned': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'done': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'in-progress': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      case 'departed': return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'suspended': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  if (!booking) return null;
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Booking</DialogTitle>
            <DialogDescription>
              Update booking details for {booking.clientName}
            </DialogDescription>
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
                onValueChange={handleClientChange}
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
            
            {/* Client Schedule section */}
            {selectedClientId && (
              <div className="bg-blue-50 rounded-md p-2 border border-blue-100">
                <h4 className="text-xs font-medium text-blue-800 flex items-center mb-1">
                  <CalendarCheck className="h-3 w-3 mr-1" />
                  Client Schedule for Today
                </h4>
                
                {clientTodayBookings.length > 0 ? (
                  <div className="space-y-1 max-h-24 overflow-y-auto p-1">
                    {clientTodayBookings.map((b) => (
                      <div 
                        key={b.id} 
                        className={`text-xs p-1 rounded border ${
                          b.id === booking.id ? 'bg-blue-200 border-blue-400' : getStatusColor(b.status)
                        } flex justify-between`}
                      >
                        <span>{formatScheduleTimes(b.startTime, b.endTime)}</span>
                        <span className="truncate max-w-[80px]">{b.carerName.split(',')[0]}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-blue-700 p-1">No other bookings for today</div>
                )}
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="carer">Carer</Label>
              <Select
                value={selectedCarerId}
                onValueChange={handleCarerChange}
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
            
            {/* Carer Schedule section */}
            {selectedCarerId && (
              <div className="bg-purple-50 rounded-md p-2 border border-purple-100">
                <h4 className="text-xs font-medium text-purple-800 flex items-center mb-1">
                  <CalendarCheck className="h-3 w-3 mr-1" />
                  Carer Schedule for Today
                </h4>
                
                {carerTodayBookings.length > 0 ? (
                  <div className="space-y-1 max-h-24 overflow-y-auto p-1">
                    {carerTodayBookings.map((b) => (
                      <div 
                        key={b.id} 
                        className={`text-xs p-1 rounded border ${
                          b.id === booking.id ? 'bg-purple-200 border-purple-400' : getStatusColor(b.status)
                        } flex justify-between`}
                      >
                        <span>{formatScheduleTimes(b.startTime, b.endTime)}</span>
                        <span className="truncate max-w-[80px]">{b.clientName.split(',')[0]}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-purple-700 p-1">No other bookings for today</div>
                )}
              </div>
            )}
            
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
      
      {/* Scheduling Conflict Alert */}
      <AlertDialog open={showScheduleConflict} onOpenChange={setShowScheduleConflict}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
              Scheduling Conflict
            </AlertDialogTitle>
            <AlertDialogDescription>
              This booking time conflicts with another booking for {conflictEntity} on {formatDate(bookingDate)}.
              
              {conflictType === "client" && (
                <p className="mt-2 font-medium text-amber-600">
                  The client already has a booking during this time period.
                </p>
              )}
              
              {conflictType === "carer" && (
                <p className="mt-2 font-medium text-amber-600">
                  The carer already has a booking during this time period.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave}>
              Continue Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

