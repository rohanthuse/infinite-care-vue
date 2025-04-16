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
import { Calendar, Clock, AlertTriangle, CalendarCheck, Users, RefreshCw, ArrowLeftRight, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { format, parseISO, isSameDay, isAfter, isBefore } from "date-fns";
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
import { EntitySelector } from "./EntitySelector";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [showSwapView, setShowSwapView] = useState<boolean>(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<{start: string, end: string}[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [carerSelectorKey, setCarerSelectorKey] = useState<number>(0); // Key to force re-render of carer selector
  const [clientSelectorKey, setClientSelectorKey] = useState<number>(0); // Key to force re-render of client selector

  useEffect(() => {
    if (open) {
      console.log("Dialog opened");
      setIsDataLoaded(false);
      setIsProcessing(false);
    } else {
      console.log("Dialog closed, resetting state");
      setSelectedClientId("");
      setSelectedCarerId("");
      setNotes("");
      setStatus("");
      setStartTime("");
      setEndTime("");
      setBookingDate("");
      setClientSchedule([]);
      setCarerSchedule([]);
      setCarerSelectorKey(prev => prev + 1);
      setClientSelectorKey(prev => prev + 1);
    }
  }, [open]);
  
  useEffect(() => {
    if (booking && open) {
      console.log("Initializing dialog with booking:", booking);
      
      setSelectedClientId(booking.clientId);
      setSelectedCarerId(booking.carerId);
      setNotes(booking.notes || "");
      setStatus(booking.status);
      setStartTime(booking.startTime);
      setEndTime(booking.endTime);
      setBookingDate(booking.date);
      
      setTimeout(() => {
        console.log("Loading schedules for client:", booking.clientId, "and carer:", booking.carerId);
        updateClientSchedule(booking.clientId);
        updateCarerSchedule(booking.carerId);
        
        setClientSelectorKey(prev => prev + 1);
        setCarerSelectorKey(prev => prev + 1);
        
        setIsDataLoaded(true);
        console.log("Dialog data loaded. Client ID:", booking.clientId, "Carer ID:", booking.carerId);
      }, 100);
    }
  }, [booking, open]);
  
  const updateClientSchedule = (clientId: string) => {
    console.log("Updating client schedule for ID:", clientId);
    const selectedClient = clients.find(c => c.id === clientId);
    if (selectedClient && selectedClient.bookings) {
      console.log("Found client bookings:", selectedClient.bookings.length);
      setClientSchedule(selectedClient.bookings);
    } else {
      console.log("No bookings found for client");
      setClientSchedule([]);
    }
  };
  
  const updateCarerSchedule = (carerId: string) => {
    console.log("Updating carer schedule for ID:", carerId);
    const selectedCarer = carers.find(c => c.id === carerId);
    if (selectedCarer && selectedCarer.bookings) {
      console.log("Found carer bookings:", selectedCarer.bookings.length);
      setCarerSchedule(selectedCarer.bookings);
    } else {
      console.log("No bookings found for carer");
      setCarerSchedule([]);
    }
  };
  
  const handleClientChange = (clientId: string | null) => {
    if (!clientId) return;
    
    console.log("Client selected:", clientId, "Previous:", selectedClientId);
    setIsProcessing(true);
    
    setSelectedClientId(clientId);
    updateClientSchedule(clientId);
    
    const selectedClient = clients.find(c => c.id === clientId);
    if (selectedClient) {
      toast.success(`Selected client: ${selectedClient.name}`);
    }
    
    setTimeout(() => {
      findAvailableTimeSlots();
      setIsProcessing(false);
    }, 100);
  };
  
  const handleCarerChange = (carerId: string | null) => {
    if (!carerId) return;
    
    console.log("Carer selected:", carerId, "Previous:", selectedCarerId);
    setIsProcessing(true);
    
    setSelectedCarerId(carerId);
    updateCarerSchedule(carerId);
    
    const selectedCarer = carers.find(c => c.id === carerId);
    if (selectedCarer) {
      toast.success(`Selected carer: ${selectedCarer.name}`);
      console.log("Carer assignment updated to:", selectedCarer.name);
    }
    
    setTimeout(() => {
      findAvailableTimeSlots();
      setIsProcessing(false);
    }, 100);
  };
  
  const findAvailableTimeSlots = () => {
    if (!selectedClientId || !selectedCarerId || !bookingDate) return;
    
    const businessHours = [];
    for (let hour = 6; hour < 22; hour++) {
      businessHours.push(`${hour.toString().padStart(2, '0')}:00`);
      businessHours.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    
    const availableTimes = businessHours.filter(time => {
      const startSlot = time;
      const [startHour, startMin] = startSlot.split(':').map(Number);
      let endHour = startHour + 1;
      let endMin = startMin;
      
      if (endHour >= 24) {
        endHour -= 24;
      }
      
      const endSlot = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
      
      const clientConflict = clientSchedule.some(b => {
        if (!isSameDay(parseISO(b.date), parseISO(bookingDate))) return false;
        if (booking && b.id === booking.id) return false;
        
        const [bStartHour, bStartMin] = b.startTime.split(':').map(Number);
        const [bEndHour, bEndMin] = b.endTime.split(':').map(Number);
        
        const bookingStart = new Date(2023, 0, 1, startHour, startMin);
        const bookingEnd = new Date(2023, 0, 1, endHour, endMin);
        const bStart = new Date(2023, 0, 1, bStartHour, bStartMin);
        const bEnd = new Date(2023, 0, 1, bEndHour, bEndMin);
        
        return !(isAfter(bookingStart, bEnd) || isAfter(bStart, bookingEnd));
      });
      
      const carerConflict = carerSchedule.some(b => {
        if (!isSameDay(parseISO(b.date), parseISO(bookingDate))) return false;
        if (booking && b.id === booking.id) return false;
        
        const [bStartHour, bStartMin] = b.startTime.split(':').map(Number);
        const [bEndHour, bEndMin] = b.endTime.split(':').map(Number);
        
        const bookingStart = new Date(2023, 0, 1, startHour, startMin);
        const bookingEnd = new Date(2023, 0, 1, endHour, endMin);
        const bStart = new Date(2023, 0, 1, bStartHour, bStartMin);
        const bEnd = new Date(2023, 0, 1, bEndHour, bEndMin);
        
        return !(isAfter(bookingStart, bEnd) || isAfter(bStart, bookingEnd));
      });
      
      return !clientConflict && !carerConflict;
    });
    
    const slots = availableTimes.map(time => {
      const [startHour, startMin] = time.split(':').map(Number);
      let endHour = startHour + 1;
      let endMin = startMin;
      
      if (endHour >= 24) {
        endHour -= 24;
      }
      
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
      return { start: time, end: endTime };
    });
    
    setAvailableTimeSlots(slots);
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
  
  const checkSchedulingConflicts = (): boolean => {
    if (!booking) return false;
    
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startInMinutes = startHour * 60 + startMin;
    const endInMinutes = endHour * 60 + endMin;
    
    const clientConflicts = clientSchedule.filter(b => {
      if (b.id === booking.id) return false;
      
      if (!isSameDay(parseISO(b.date), parseISO(bookingDate))) return false;
      
      const bStartParts = b.startTime.split(':').map(Number);
      const bEndParts = b.endTime.split(':').map(Number);
      
      const bStartInMinutes = bStartParts[0] * 60 + bStartParts[1];
      const bEndInMinutes = bEndParts[0] * 60 + bEndParts[1];
      
      return (startInMinutes < bEndInMinutes && endInMinutes > bStartInMinutes);
    });
    
    const carerConflicts = carerSchedule.filter(b => {
      if (b.id === booking.id) return false;
      
      if (!isSameDay(parseISO(b.date), parseISO(bookingDate))) return false;
      
      const bStartParts = b.startTime.split(':').map(Number);
      const bEndParts = b.endTime.split(':').map(Number);
      
      const bStartInMinutes = bStartParts[0] * 60 + bStartParts[1];
      const bEndInMinutes = bEndParts[0] * 60 + bEndParts[1];
      
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
    
    console.log("Saving booking with client:", selectedClientId, "and carer:", selectedCarerId);
    
    const selectedClient = clients.find(c => c.id === selectedClientId);
    const selectedCarer = carers.find(c => c.id === selectedCarerId);
    
    if (!selectedClient || !selectedCarer) {
      toast.error("Please select both client and carer");
      return;
    }
    
    if (checkSchedulingConflicts()) {
      return;
    }
    
    const updatedBooking: Booking = {
      ...booking,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      clientInitials: selectedClient.initials,
      carerId: selectedCarer.id,
      carerName: selectedCarer.name,
      carerInitials: selectedCarer.initials,
      startTime: startTime,
      endTime: endTime,
      date: bookingDate,
      notes: notes,
      status: status as Booking["status"],
    };
    
    console.log("Updated booking:", updatedBooking);
    onUpdateBooking(updatedBooking);
    toast.success("Booking updated successfully");
    onOpenChange(false);
  };

  const validateTimeChange = (newStartTime: string, newEndTime: string): boolean => {
    const [startHour, startMin] = newStartTime.split(':').map(Number);
    const [endHour, endMin] = newEndTime.split(':').map(Number);
    
    const startInMinutes = startHour * 60 + startMin;
    const endInMinutes = endHour * 60 + endMin;
    
    if (endInMinutes <= startInMinutes) {
      toast.error("End time must be after start time");
      return false;
    }
    
    const businessStartMinutes = 6 * 60;
    const businessEndMinutes = 22 * 60;
    
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
  
  const handleApplyTimeSlot = (slot: {start: string, end: string}) => {
    setStartTime(slot.start);
    setEndTime(slot.end);
    toast.success(`Applied time slot: ${slot.start} - ${slot.end}`);
  };
  
  const toggleSwapView = () => {
    setShowSwapView(!showSwapView);
    findAvailableTimeSlots();
  };
  
  const formatScheduleTimes = (startTime: string, endTime: string): string => {
    return `${startTime} - ${endTime}`;
  };
  
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

  const isConflictingBooking = (booking: Booking): boolean => {
    if (!startTime || !endTime) return false;
    
    const [bookingStartHour, bookingStartMin] = booking.startTime.split(':').map(Number);
    const [bookingEndHour, bookingEndMin] = booking.endTime.split(':').map(Number);
    
    const [currentStartHour, currentStartMin] = startTime.split(':').map(Number);
    const [currentEndHour, currentEndMin] = endTime.split(':').map(Number);
    
    const bookingStart = bookingStartHour * 60 + bookingStartMin;
    const bookingEnd = bookingEndHour * 60 + bookingEndMin;
    const currentStart = currentStartHour * 60 + currentStartMin;
    const currentEnd = currentEndHour * 60 + currentEndMin;
    
    return (currentStart < bookingEnd && currentEnd > bookingStart);
  };
  
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

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const selectedCarer = carers.find(c => c.id === selectedCarerId);
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md md:max-w-xl">
          <DialogHeader className="border-b pb-2">
            <DialogTitle>Edit Booking</DialogTitle>
            <DialogDescription>
              Update booking details for {booking.clientName}
            </DialogDescription>
          </DialogHeader>
          
          {!isDataLoaded ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading booking details...</span>
            </div>
          ) : (
            <ScrollArea className="max-h-[60vh] overflow-y-auto py-2 pr-3">
              <div className="grid gap-4 py-2">
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
                            className="h-7 text-xs" 
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
                            className="h-7 text-xs" 
                          />
                        </div>
                      </div>
                      <div className="col-span-1">
                        <Label className="text-xs">Duration</Label>
                        <div className="bg-white border border-slate-200 rounded p-1 text-xs h-7 flex items-center justify-center text-slate-700">
                          {calculateDuration()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="client" className="font-medium">Client</Label>
                  <EntitySelector
                    type="client"
                    entities={clients}
                    selectedEntity={selectedClientId}
                    onSelect={handleClientChange}
                    key={`client-selector-${clientSelectorKey}`}
                  />
                  
                  {selectedClientId && (
                    <div className="bg-blue-50 rounded-md p-3 border border-blue-100 mt-1">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-medium text-blue-800 flex items-center">
                          <CalendarCheck className="h-3 w-3 mr-1" />
                          {selectedClient?.name}'s Schedule for {format(parseISO(bookingDate), 'EEE, MMM d')}
                        </h4>
                      </div>
                      
                      <ScrollArea className="h-24 w-full">
                        {clientTodayBookings.length > 0 ? (
                          <div className="space-y-1.5 p-1">
                            {clientTodayBookings.map((b) => (
                              <div 
                                key={b.id} 
                                className={`text-xs p-1.5 rounded border ${
                                  b.id === booking.id ? 'bg-blue-200 border-blue-400' : 
                                  isConflictingBooking(b) ? 'bg-red-100 border-red-300 animate-pulse' : 
                                  getStatusColor(b.status)
                                } flex justify-between items-center`}
                              >
                                <div className="flex items-center">
                                  <span className="font-medium">{formatScheduleTimes(b.startTime, b.endTime)}</span>
                                  <span className="mx-2">•</span>
                                  <span className="truncate max-w-[100px]">{b.carerName.split(',')[0]}</span>
                                </div>
                                {isConflictingBooking(b) && b.id !== booking.id && (
                                  <span className="text-red-600 font-medium flex items-center text-[10px]">
                                    <AlertTriangle className="h-3 w-3 mr-0.5" />
                                    Conflict
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-white rounded p-2 text-xs text-blue-700">
                            No other bookings for today
                          </div>
                        )}
                      </ScrollArea>
                      
                      <div className="mt-2 pt-2 border-t border-blue-200 text-xs text-blue-700 flex justify-between items-center">
                        <span>
                          {clientTodayBookings.length} booking(s) today
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="carer" className="font-medium">Carer</Label>
                  {isProcessing ? (
                    <div className="flex items-center space-x-2 p-2 border rounded-md">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm">Processing selection...</span>
                    </div>
                  ) : (
                    <EntitySelector
                      type="carer"
                      entities={carers}
                      selectedEntity={selectedCarerId}
                      onSelect={handleCarerChange}
                      key={`carer-selector-${carerSelectorKey}`}
                    />
                  )}
                  
                  {selectedCarerId && (
                    <div className="bg-purple-50 rounded-md p-3 border border-purple-100 mt-1">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-medium text-purple-800 flex items-center">
                          <CalendarCheck className="h-3 w-3 mr-1" />
                          {selectedCarer?.name}'s Schedule for {format(parseISO(bookingDate), 'EEE, MMM d')}
                        </h4>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-xs text-purple-700 hover:text-purple-900 hover:bg-purple-100"
                          onClick={toggleSwapView}
                        >
                          {showSwapView ? (
                            <>
                              <CalendarCheck className="h-3 w-3 mr-1" />
                              View Schedule
                            </>
                          ) : (
                            <>
                              <ArrowLeftRight className="h-3 w-3 mr-1" />
                              Available Slots
                            </>
                          )}
                        </Button>
                      </div>
                      
                      <ScrollArea className="h-24 w-full">
                        {!showSwapView ? (
                          carerTodayBookings.length > 0 ? (
                            <div className="space-y-1.5 p-1">
                              {carerTodayBookings.map((b) => (
                                <div 
                                  key={b.id} 
                                  className={`text-xs p-1.5 rounded border ${
                                    b.id === booking.id ? 'bg-purple-200 border-purple-400' : 
                                    isConflictingBooking(b) ? 'bg-red-100 border-red-300 animate-pulse' : 
                                    getStatusColor(b.status)
                                  } flex justify-between items-center`}
                                >
                                  <div className="flex items-center">
                                    <span className="font-medium">{formatScheduleTimes(b.startTime, b.endTime)}</span>
                                    <span className="mx-2">•</span>
                                    <span className="truncate max-w-[100px]">{b.clientName.split(',')[0]}</span>
                                  </div>
                                  {isConflictingBooking(b) && b.id !== booking.id && (
                                    <span className="text-red-600 font-medium flex items-center text-[10px]">
                                      <AlertTriangle className="h-3 w-3 mr-0.5" />
                                      Conflict
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-white rounded p-2 text-xs text-purple-700">
                              No other bookings for today
                            </div>
                          )
                        ) : (
                          <div>
                            {availableTimeSlots.length > 0 ? (
                              <div className="grid grid-cols-2 gap-1.5 p-1">
                                {availableTimeSlots.slice(0, 10).map((slot, index) => (
                                  <Button 
                                    key={index} 
                                    variant="outline" 
                                    size="sm"
                                    className="h-7 text-xs bg-white hover:bg-purple-100"
                                    onClick={() => handleApplyTimeSlot(slot)}
                                  >
                                    {slot.start} - {slot.end}
                                  </Button>
                                ))}
                              </div>
                            ) : (
                              <div className="bg-white rounded p-2 text-xs text-purple-700">
                                No available time slots found
                              </div>
                            )}
                          </div>
                        )}
                      </ScrollArea>
                      
                      <div className="mt-2 pt-2 border-t border-purple-200 text-xs text-purple-700 flex justify-between items-center">
                        <span>
                          {carerTodayBookings.length} booking(s) today
                        </span>
                        {selectedClientId && selectedCarerId && (
                          <div>
                            {isConflictingBooking({...booking, startTime, endTime}) ? (
                              <span className="text-red-600 font-medium flex items-center">
                                <XCircle className="h-3 w-3 mr-1" />
                                Schedule conflict detected
                              </span>
                            ) : (
                              <span className="text-green-600 font-medium flex items-center">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Time slot available
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
                    className="resize-none h-20"
                  />
                </div>
              </div>
            </ScrollArea>
          )}
          
          <DialogFooter className="sm:justify-between border-t pt-4 mt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!isDataLoaded}
            >
              {isDataLoaded ? "Save Changes" : "Loading..."}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
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
            <AlertDialogAction onClick={() => setShowScheduleConflict(false)}>
              Review Schedule
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
