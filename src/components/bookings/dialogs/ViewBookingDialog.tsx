import React from "react";
import { format, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { Eye, Clock, User, Calendar, FileText, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useDeleteBooking } from "@/data/hooks/useDeleteBooking";
import { useUserRole } from "@/hooks/useUserRole";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ViewBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any;
  services: Array<{ id: string; title: string }>;
  onEdit?: () => void;
  branchId?: string;
}

export function ViewBookingDialog({
  open,
  onOpenChange,
  booking,
  services,
  onEdit,
  branchId,
}: ViewBookingDialogProps) {
  const deleteBooking = useDeleteBooking(branchId);
  const { data: userRole } = useUserRole();
  const [relatedBookings, setRelatedBookings] = React.useState<any[]>([]);
  
  // Early validation - prevent dialog from opening with invalid data
  React.useEffect(() => {
    console.log('[ViewBookingDialog] Dialog state changed:', { 
      open, 
      hasBooking: !!booking, 
      bookingId: booking?.id,
      hasStartTime: !!booking?.start_time,
      hasEndTime: !!booking?.end_time,
      hasServiceId: !!booking?.service_id,
      serviceId: booking?.service_id,
      startTime: booking?.start_time,
      endTime: booking?.end_time
    });
    
    if (open && !booking) {
      console.error('[ViewBookingDialog] Dialog opened without booking data');
      toast.error('Unable to load appointment details');
      onOpenChange(false);
    }
  }, [open, booking, onOpenChange]);

  // Safe calculations that handle null booking (moved AFTER hooks to prevent violations)
  const service = booking ? services.find((s) => s.id === booking.service_id) : null;
  
  // Extract time strings in UTC to avoid timezone conversion issues
  const startTimeStr = React.useMemo(() => {
    console.log('[ViewBookingDialog] Parsing start time:', {
      start_time: booking?.start_time,
      startTime: booking?.startTime,
    });
    
    // Priority 1: Use the simplified startTime field (already correct)
    if (booking?.startTime) {
      console.log('[ViewBookingDialog] Using simplified startTime:', booking.startTime);
      return booking.startTime;
    }
    
    // Priority 2: Extract time from ISO string in UTC (avoid timezone conversion)
    if (booking?.start_time) {
      try {
        const parsed = parseISO(booking.start_time);
        // Format in UTC timezone to get the original stored time
        const timeInUTC = formatInTimeZone(parsed, 'UTC', 'HH:mm');
        console.log('[ViewBookingDialog] Extracted time from ISO (UTC):', timeInUTC);
        return timeInUTC;
      } catch (error) {
        console.error('[ViewBookingDialog] Error parsing start_time:', error);
        return null;
      }
    }
    
    return null;
  }, [booking?.start_time, booking?.startTime]);

  const endTimeStr = React.useMemo(() => {
    console.log('[ViewBookingDialog] Parsing end time:', {
      end_time: booking?.end_time,
      endTime: booking?.endTime,
    });
    
    // Priority 1: Use the simplified endTime field (already correct)
    if (booking?.endTime) {
      console.log('[ViewBookingDialog] Using simplified endTime:', booking.endTime);
      return booking.endTime;
    }
    
    // Priority 2: Extract time from ISO string in UTC (avoid timezone conversion)
    if (booking?.end_time) {
      try {
        const parsed = parseISO(booking.end_time);
        // Format in UTC timezone to get the original stored time
        const timeInUTC = formatInTimeZone(parsed, 'UTC', 'HH:mm');
        console.log('[ViewBookingDialog] Extracted time from ISO (UTC):', timeInUTC);
        return timeInUTC;
      } catch (error) {
        console.error('[ViewBookingDialog] Error parsing end_time:', error);
        return null;
      }
    }
    
    return null;
  }, [booking?.end_time, booking?.endTime]);

  // Keep Date objects for date formatting and comparison
  const startTimeDate = booking?.start_time ? parseISO(booking.start_time) : null;
  const endTimeDate = booking?.end_time ? parseISO(booking.end_time) : null;

  // Calculate duration from time strings to avoid timezone issues
  const durationInMinutes = React.useMemo(() => {
    if (!startTimeStr || !endTimeStr) return null;
    
    try {
      const [startHour, startMin] = startTimeStr.split(':').map(Number);
      const [endHour, endMin] = endTimeStr.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      return endMinutes - startMinutes;
    } catch (error) {
      console.error('[ViewBookingDialog] Error calculating duration:', error);
      return null;
    }
  }, [startTimeStr, endTimeStr]);
  
  // Fetch related bookings (bookings created in the same batch)
  React.useEffect(() => {
    const fetchRelatedBookings = async () => {
      console.log('[ViewBookingDialog] Fetching related bookings:', { 
        open, 
        hasBooking: !!booking, 
        bookingId: booking?.id,
        hasCreatedAt: !!booking?.created_at 
      });
      
      if (!open || !booking?.id || !booking?.created_at) {
        console.log('[ViewBookingDialog] Skipping fetch - dialog closed or missing data');
        return;
      }
      
      try {
        // Fetch bookings created within 2 seconds (same batch)
        const createdAt = new Date(booking.created_at);
        const startWindow = new Date(createdAt.getTime() - 2000);
        const endWindow = new Date(createdAt.getTime() + 2000);
        
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            id,
            service_id,
            start_time,
            end_time,
            services (
              id,
              title
            )
          `)
          .eq('client_id', booking.clientId || booking.client_id)
          .eq('staff_id', booking.carerId || booking.staff_id)
          .gte('created_at', startWindow.toISOString())
          .lte('created_at', endWindow.toISOString())
          .neq('id', booking.id)
          .order('start_time', { ascending: true });
        
        if (!error && data) {
          setRelatedBookings(data);
        }
      } catch (error) {
        console.error('[ViewBookingDialog] Error fetching related bookings:', error);
        // Don't show error toast for related bookings failure - main booking still works
      }
    };
    
    fetchRelatedBookings();
  }, [open, booking?.id, booking?.created_at, booking?.clientId, booking?.client_id, booking?.carerId, booking?.staff_id]);
  
  // Check if user can delete bookings (admins only)
  const canDelete = userRole?.role && ['super_admin', 'branch_admin'].includes(userRole.role);
  
  // Determine if the appointment has already started
  const hasStarted = startTimeDate && startTimeDate <= new Date();

  const handleDelete = async () => {
    if (!booking) return;
    
    try {
      await deleteBooking.mutateAsync({
        bookingId: booking.id,
        clientId: booking.clientId,
        staffId: booking.carerId,
      });
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation's onError callback
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Early return AFTER all hooks - prevents hooks violation
  if (!booking) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto"
        onInteractOutside={(e) => {
          console.log('[ViewBookingDialog] Dialog interaction outside');
        }}
        onEscapeKeyDown={(e) => {
          console.log('[ViewBookingDialog] Dialog escape key pressed');
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <Eye className="h-5 w-5" />
            View Appointment
          </DialogTitle>
          <DialogDescription>
            Appointment details and information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Status</span>
            <Badge className={getStatusColor(booking.status)}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </Badge>
          </div>

          <Separator />

          {/* Client Information */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <User className="h-4 w-4" />
              Client Information
            </div>
            <div className="pl-6 space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Assigned Carer:</span>
                <span className="text-sm font-medium">
                  {booking.carerName || booking.staff_name || 'Not assigned'}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Schedule Information */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Calendar className="h-4 w-4" />
              Schedule
            </div>
            <div className="pl-6 space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Date:</span>
                <span className="text-sm font-medium">
                  {startTimeDate ? format(startTimeDate, "EEEE, MMMM d, yyyy") : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Start Time:</span>
                <span className="text-sm font-medium">
                  {startTimeStr || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">End Time:</span>
                <span className="text-sm font-medium">
                  {endTimeStr || 'N/A'}
                </span>
              </div>
              {durationInMinutes && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Duration:</span>
                  <span className="text-sm font-medium">
                    {durationInMinutes} minutes
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Service Information */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <FileText className="h-4 w-4" />
              {relatedBookings.length > 0 ? 'Services Scheduled' : 'Service'}
            </div>
            <div className="pl-6 space-y-2">
              {/* Current booking's service */}
              <div className="p-2 bg-blue-50 rounded-md">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <span className="text-sm font-medium text-blue-900">
                      {service?.title || "No service selected"}
                    </span>
                    <div className="text-xs text-blue-700 mt-1">
                      {startTimeStr || ''} - {endTimeStr || ''}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
                    Current
                  </Badge>
                </div>
              </div>
              
              {/* Related services */}
              {relatedBookings.length > 0 && (
                <>
                  <div className="text-xs text-gray-500 font-medium mt-2">
                    Additional Services (Same Booking Session):
                  </div>
                  {relatedBookings.map((relatedBooking) => {
                    const relatedService = services.find(s => s.id === relatedBooking.service_id);
                    const relatedStart = parseISO(relatedBooking.start_time);
                    const relatedEnd = parseISO(relatedBooking.end_time);
                    // Format related times in UTC to match main booking display
                    const relatedStartTime = formatInTimeZone(relatedStart, 'UTC', 'HH:mm');
                    const relatedEndTime = formatInTimeZone(relatedEnd, 'UTC', 'HH:mm');
                    
                    return (
                      <div key={relatedBooking.id} className="p-2 bg-gray-50 rounded-md">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900">
                              {relatedService?.title || "Unknown Service"}
                            </span>
                            <div className="text-xs text-gray-600 mt-1">
                              {relatedStartTime} - {relatedEndTime}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Related
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {booking.notes && (
            <>
              <Separator />
              
              {/* Additional Information */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FileText className="h-4 w-4" />
                  Additional Information
                </div>
                <div className="pl-6">
                  <div className="space-y-1">
                    <span className="text-sm text-gray-600">Notes:</span>
                    <div className="text-sm font-medium whitespace-pre-wrap break-words bg-gray-50 p-3 rounded-md">
                      {booking.notes}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Booking Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Clock className="h-4 w-4" />
              Booking Details
            </div>
            <div className="pl-6 space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Booking ID:</span>
                <span className="text-sm font-medium font-mono">{booking.id}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <div className="flex justify-between w-full">
            <div className="flex gap-2">
              {canDelete && !hasStarted && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      type="button" 
                      variant="destructive" 
                      disabled={deleteBooking.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Booking
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Booking</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this booking? This action cannot be undone.
                        The booking will be permanently removed from the system.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleteBooking.isPending ? "Deleting..." : "Delete Booking"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {onEdit && (
                <Button type="button" onClick={onEdit}>
                  Edit Appointment
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}