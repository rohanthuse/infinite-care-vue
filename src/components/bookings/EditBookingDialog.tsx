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
import { Calendar, Clock, CalendarCheck, CheckCircle, XCircle, Loader2, AlertTriangle, Shield } from "lucide-react";
import { format, parseISO } from "date-fns";
import { EntitySelector } from "./EntitySelector";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EditBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  clients: Client[];
  carers: Carer[];
  onUpdateBooking: (booking: Booking, carers: Carer[]) => void;
  isCheckingOverlap?: boolean;
}

export const EditBookingDialog: React.FC<EditBookingDialogProps> = ({
  open,
  onOpenChange,
  booking,
  clients,
  carers,
  onUpdateBooking,
  isCheckingOverlap = false,
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedCarerId, setSelectedCarerId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [bookingDate, setBookingDate] = useState<string>("");
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [carerSelectorKey, setCarerSelectorKey] = useState<number>(0);
  const [clientSelectorKey, setClientSelectorKey] = useState<number>(0);
  const [hasValidationErrors, setHasValidationErrors] = useState<boolean>(false);
  const [validationMessage, setValidationMessage] = useState<string>("");
  const [isSaveBlocked, setIsSaveBlocked] = useState<boolean>(false);

  // Reset the dialog state when it opens/closes
  useEffect(() => {
    if (open) {
      console.log("[EditBookingDialog] Dialog opened");
      setIsDataLoaded(false);
      setIsProcessing(false);
      setHasValidationErrors(false);
      setValidationMessage("");
      setIsSaveBlocked(false);
      
      if (booking) {
        // Initialize dialog with booking data
        setSelectedClientId(booking.clientId);
        setSelectedCarerId(booking.carerId);
        setNotes(booking.notes || "");
        setStatus(booking.status);
        setStartTime(booking.startTime);
        setEndTime(booking.endTime);
        setBookingDate(booking.date);
        
        setTimeout(() => {
          setClientSelectorKey(prev => prev + 1);
          setCarerSelectorKey(prev => prev + 1);
          setIsDataLoaded(true);
          console.log("[EditBookingDialog] Data loaded. Client:", booking.clientId, "Carer:", booking.carerId);
        }, 100);
      }
    } else {
      console.log("[EditBookingDialog] Dialog closed, resetting state");
      // Reset state when dialog closes
      setSelectedClientId("");
      setSelectedCarerId("");
      setNotes("");
      setStatus("");
      setStartTime("");
      setEndTime("");
      setBookingDate("");
      setCarerSelectorKey(prev => prev + 1);
      setClientSelectorKey(prev => prev + 1);
      setHasValidationErrors(false);
      setValidationMessage("");
      setIsSaveBlocked(false);
    }
  }, [open, booking]);

  // CRITICAL: Block save when overlap check is running
  useEffect(() => {
    if (isCheckingOverlap) {
      console.log("[EditBookingDialog] 🔒 BLOCKING SAVE - Overlap check in progress");
      setIsSaveBlocked(true);
    } else {
      console.log("[EditBookingDialog] 🔓 UNBLOCKING SAVE - Overlap check completed");
      setIsSaveBlocked(false);
    }
  }, [isCheckingOverlap]);

  // Validate scheduling changes
  const validateScheduleChange = (): boolean => {
    if (!booking) return false;
    
    // Check if schedule has changed
    const hasScheduleChanged = (
      selectedCarerId !== booking.carerId ||
      startTime !== booking.startTime ||
      endTime !== booking.endTime ||
      bookingDate !== booking.date
    );

    if (!hasScheduleChanged) {
      setHasValidationErrors(false);
      setValidationMessage("");
      return true;
    }

    // CRITICAL: Validate time range
    if (startTime && endTime && startTime >= endTime) {
      setHasValidationErrors(true);
      setValidationMessage("⚠️ End time must be after start time");
      return false;
    }

    // Check business hours
    if (startTime) {
      const [hour] = startTime.split(':').map(Number);
      if (hour < 6 || hour >= 22) {
        setHasValidationErrors(true);
        setValidationMessage("⚠️ Bookings must be between 06:00 and 22:00");
        return false;
      }
    }

    if (endTime) {
      const [hour] = endTime.split(':').map(Number);
      if (hour > 22) {
        setHasValidationErrors(true);
        setValidationMessage("⚠️ Bookings must end by 22:00");
        return false;
      }
    }

    setHasValidationErrors(false);
    setValidationMessage("");
    return true;
  };

  // Validate whenever time or carer changes
  useEffect(() => {
    if (isDataLoaded && booking) {
      validateScheduleChange();
    }
  }, [selectedCarerId, startTime, endTime, bookingDate, isDataLoaded, booking]);
  
  // Handle client selection
  const handleClientChange = (clientId: string | null) => {
    if (!clientId) {
      setSelectedClientId("");
      return;
    }
    
    console.log("[EditBookingDialog] Client selected:", clientId);
    setIsProcessing(true);
    
    setSelectedClientId(clientId);
    
    const selectedClient = clients.find(c => c.id === clientId);
    if (selectedClient) {
      toast.success(`Selected client: ${selectedClient.name}`);
    }
    
    setTimeout(() => {
      setIsProcessing(false);
    }, 100);
  };
  
  // Handle carer selection
  const handleCarerChange = (carerId: string | null) => {
    if (!carerId) {
      setSelectedCarerId("");
      return;
    }
    
    console.log("[EditBookingDialog] Carer selected:", carerId);
    setIsProcessing(true);
    
    setSelectedCarerId(carerId);
    
    const selectedCarer = carers.find(c => c.id === carerId);
    if (selectedCarer) {
      toast.success(`Selected carer: ${selectedCarer.name}`);
      console.log("[EditBookingDialog] Carer assignment updated to:", selectedCarer.name);
    }
    
    setTimeout(() => {
      setIsProcessing(false);
    }, 100);
  };
  
  // Format date for display
  const formatDate = (dateString: string): string => {
    try {
      return format(parseISO(dateString), 'EEEE, MMMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };
  
  // Calculate duration between start and end times
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
  
  // CRITICAL: Handle save button click with strict validation
  const handleSave = () => {
    if (!booking) return;
    
    console.log("[EditBookingDialog] 🚀 SAVE ATTEMPTED with state:", {
      hasValidationErrors,
      isCheckingOverlap,
      isSaveBlocked,
      validationMessage
    });

    // CRITICAL: Multiple blocking conditions
    if (hasValidationErrors) {
      toast.error("❌ Please fix validation errors before saving");
      return;
    }

    if (isCheckingOverlap || isSaveBlocked) {
      toast.warning("⏳ Please wait for overlap validation to complete");
      return;
    }
    
    const selectedClient = clients.find(c => c.id === selectedClientId);
    const selectedCarer = carers.find(c => c.id === selectedCarerId);
    
    if (!selectedClient || !selectedCarer) {
      toast.error("❌ Please select both client and carer");
      return;
    }

    // Final validation before proceeding
    if (!validateScheduleChange()) {
      toast.error("❌ Please fix validation errors before saving");
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
    
    console.log("[EditBookingDialog] 🎯 INITIATING SAVE with booking:", updatedBooking);
    
    // Pass the carers array to the update handler for overlap detection
    onUpdateBooking(updatedBooking, carers);
  };

  // Handle start time change
  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime);
  };
  
  // Handle end time change
  const handleEndTimeChange = (newEndTime: string) => {
    setEndTime(newEndTime);
  };
  
  // Get background color for booking status
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
  
  // CRITICAL: Multiple conditions for blocking save
  const hasValidSelections = selectedClientId && selectedCarerId;
  const isSaveDisabled = !isDataLoaded || !hasValidSelections || isCheckingOverlap || hasValidationErrors || isSaveBlocked;
  
  // Render dialog
  return (
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
              {/* CRITICAL: Enhanced validation alerts */}
              {hasValidationErrors && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{validationMessage}</AlertDescription>
                </Alert>
              )}

              {/* CRITICAL: Overlap checking status */}
              {(isCheckingOverlap || isSaveBlocked) && (
                <Alert>
                  <Shield className="h-4 w-4 animate-pulse" />
                  <AlertDescription>
                    🔐 <strong>Save Blocked:</strong> Validating for booking conflicts... Please wait.
                  </AlertDescription>
                </Alert>
              )}

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
                          disabled={isSaveBlocked}
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
                          disabled={isSaveBlocked}
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
                  selectedEntity={selectedClientId || null}
                  onSelect={handleClientChange}
                  key={`client-selector-${clientSelectorKey}`}
                />
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
                    selectedEntity={selectedCarerId || null}
                    onSelect={handleCarerChange}
                    key={`carer-selector-${carerSelectorKey}`}
                  />
                )}
                
                {hasValidSelections && !hasValidationErrors && !isCheckingOverlap && !isSaveBlocked && (
                  <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-slate-700 flex justify-between items-center">
                    <span>✅ Ready to save - overlap detection will run automatically</span>
                    <div className="text-green-600 font-medium flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Validated
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={status}
                  onValueChange={setStatus}
                  disabled={isSaveBlocked}
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
                  disabled={isSaveBlocked}
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
            disabled={isSaveDisabled}
          >
            {(isCheckingOverlap || isSaveBlocked) ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                🔐 Validating conflicts...
              </>
            ) : hasValidationErrors ? (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Fix errors to save
              </>
            ) : isDataLoaded ? (
              "💾 Save Changes"
            ) : (
              "Loading..."
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
