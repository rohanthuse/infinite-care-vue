import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { getUserTimezone } from "@/utils/timezoneUtils";
import { Eye, Clock, User, Calendar, FileText, Trash2, AlertCircle, Check, X, XCircle, RefreshCw, ClipboardList, AlertTriangle, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AppointmentApprovalDialog from "@/components/bookings/AppointmentApprovalDialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { useDeleteMultipleBookings } from "@/hooks/useDeleteMultipleBookings";
import { useUserRole } from "@/hooks/useUserRole";
import { useBookingServices } from "@/hooks/useBookingServices";
import { DeleteBookingConfirmationDialog } from "./DeleteBookingConfirmationDialog";
import { CarePlanPreviewSection } from "@/components/care/CarePlanPreviewSection";

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
  const deleteMultipleBookings = useDeleteMultipleBookings(branchId);
  const { data: userRole } = useUserRole();
  const [relatedBookings, setRelatedBookings] = React.useState<any[]>([]);
  const [assignedStaff, setAssignedStaff] = React.useState<Array<{
    id: string;
    name: string;
  }>>([]);
  const [showApprovalForCancellation, setShowApprovalForCancellation] = React.useState(false);
  const [showApprovalForReschedule, setShowApprovalForReschedule] = React.useState(false);
  const [changeRequest, setChangeRequest] = React.useState<any>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [visitRecord, setVisitRecord] = React.useState<any>(null);
  
  // Fetch services from junction table
  const { data: bookingServices } = useBookingServices(booking?.id || '');
  
  // Fetch visit record for late arrival info
  React.useEffect(() => {
    const fetchVisitRecord = async () => {
      if (!booking?.id) return;
      
      const { data } = await supabase
        .from('visit_records')
        .select(`
          visit_start_time, 
          arrival_delay_minutes, 
          late_arrival_reason,
          late_submitted_at,
          late_submitted_by,
          staff:late_submitted_by (
            first_name,
            last_name
          )
        `)
        .eq('booking_id', booking.id)
        .maybeSingle();
      
      setVisitRecord(data);
    };
    
    if (open) fetchVisitRecord();
  }, [open, booking?.id]);
  
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

  // Get services - prefer junction table, fallback to single service_id
  const bookingServicesList = React.useMemo(() => {
    // If we have services from junction table, use those
    if (bookingServices && bookingServices.length > 0) {
      return bookingServices.map(bs => ({
        id: bs.service?.id || bs.service_id,
        title: bs.service?.title || services.find(s => s.id === bs.service_id)?.title || 'Unknown Service'
      }));
    }
    // Fallback to single service_id for backward compatibility
    if (booking?.service_id) {
      const singleService = services.find(s => s.id === booking.service_id);
      if (singleService) {
        return [singleService];
      }
    }
    return [];
  }, [bookingServices, booking?.service_id, services]);
  
  // Keep backward compat for single service reference
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
    
    // Priority 2: Extract time from ISO string and convert to local timezone
    if (booking?.start_time) {
      try {
        const parsed = parseISO(booking.start_time);
        // Format in user's local timezone to display correct time
        const timeInLocalTZ = formatInTimeZone(parsed, getUserTimezone(), 'HH:mm');
        console.log('[ViewBookingDialog] Extracted time from ISO (local timezone):', timeInLocalTZ);
        return timeInLocalTZ;
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
    
    // Priority 2: Extract time from ISO string and convert to local timezone
    if (booking?.end_time) {
      try {
        const parsed = parseISO(booking.end_time);
        // Format in user's local timezone to display correct time
        const timeInLocalTZ = formatInTimeZone(parsed, getUserTimezone(), 'HH:mm');
        console.log('[ViewBookingDialog] Extracted time from ISO (local timezone):', timeInLocalTZ);
        return timeInLocalTZ;
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

  // Calculate duration from time strings to avoid timezone issues (handles overnight bookings)
  const durationInMinutes = React.useMemo(() => {
    if (!startTimeStr || !endTimeStr) return null;
    
    try {
      const [startHour, startMin] = startTimeStr.split(':').map(Number);
      const [endHour, endMin] = endTimeStr.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      let durationMinutes = endMinutes - startMinutes;
      
      // Handle overnight bookings (when end time is earlier than start time)
      if (durationMinutes < 0) {
        durationMinutes += 1440; // Add 24 hours (1440 minutes)
      }
      
      return durationMinutes;
    } catch (error) {
      console.error('[ViewBookingDialog] Error calculating duration:', error);
      return null;
    }
  }, [startTimeStr, endTimeStr]);
  
  // Fetch change request details
  React.useEffect(() => {
    const fetchChangeRequest = async () => {
      if (!open || !booking?.id) return;
      
      if (booking.cancellation_request_status === 'pending' || 
          booking.reschedule_request_status === 'pending') {
        const { data } = await supabase
          .from('booking_change_requests')
          .select('*')
          .eq('booking_id', booking.id)
          .eq('status', 'pending')
          .single();
        
        if (data) setChangeRequest(data);
      }
    };
    
    fetchChangeRequest();
  }, [open, booking?.id, booking?.cancellation_request_status, booking?.reschedule_request_status]);

  // Fetch all assigned staff and related bookings
  // Note: When multiple staff are assigned to the same booking,
  // the system creates separate booking records with the same
  // client_id, start_time, end_time, and service_id, but different staff_ids.
  React.useEffect(() => {
    const fetchRelatedBookingsAndStaff = async () => {
      console.log('[ViewBookingDialog] Fetching related bookings and staff:', { 
        open, 
        hasBooking: !!booking, 
        bookingId: booking?.id
      });
      
      if (!open || !booking?.id) {
        console.log('[ViewBookingDialog] Skipping fetch - dialog closed or missing data');
        return;
      }
      
      try {
        // Fetch all bookings for same client and time slot
        // This will capture all staff assigned to this appointment
        // Note: We handle null service_id separately to avoid query issues
        let query = supabase
          .from('bookings')
          .select(`
            id,
            staff_id,
            staff (
              id,
              first_name,
              last_name
            )
          `)
          .eq('client_id', booking.clientId || booking.client_id)
          .eq('start_time', booking.start_time)
          .eq('end_time', booking.end_time);
        
        // Handle null service_id properly - eq() doesn't work with null
        if (booking.service_id) {
          query = query.eq('service_id', booking.service_id);
        } else {
          query = query.is('service_id', null);
        }
        
        const { data: sameTimeBookings, error: staffError } = await query;
        
        console.log('[ViewBookingDialog] Query result:', { 
          bookingCount: sameTimeBookings?.length, 
          error: staffError,
          serviceId: booking.service_id 
        });
        
        if (!staffError && sameTimeBookings) {
          // Extract all unique staff members
          const staffList = sameTimeBookings
            .filter(b => b.staff && b.staff.first_name) // Only include valid staff
            .map(b => ({
              id: b.staff_id,
              name: `${b.staff.first_name} ${b.staff.last_name}`
            }));
          
          // Remove duplicates based on staff_id
          const uniqueStaff = Array.from(
            new Map(staffList.map(s => [s.id, s])).values()
          );
          
          console.log('[ViewBookingDialog] Found assigned staff:', uniqueStaff);
          setAssignedStaff(uniqueStaff);
        }
        
        // Fetch related bookings (different services for same staff in same batch)
        // This is for the "Additional Services" section
        if (booking?.created_at) {
          const createdAt = new Date(booking.created_at);
          const startWindow = new Date(createdAt.getTime() - 2000);
          const endWindow = new Date(createdAt.getTime() + 2000);
          
          const { data: relatedServices, error: servicesError } = await supabase
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
            .neq('service_id', booking.service_id) // Different service
            .order('start_time', { ascending: true });
          
          if (!servicesError && relatedServices) {
            setRelatedBookings(relatedServices);
          }
        }
      } catch (error) {
        console.error('[ViewBookingDialog] Error fetching related data:', error);
      }
    };
    
    fetchRelatedBookingsAndStaff();
  }, [open, booking?.id, booking?.start_time, booking?.end_time, booking?.service_id, booking?.clientId, booking?.client_id, booking?.created_at, booking?.carerId, booking?.staff_id]);
  
  // Check if user can delete bookings (admins only)
  const canDelete = userRole?.role && ['super_admin', 'branch_admin'].includes(userRole.role);

  const handleDelete = async () => {
    if (!booking) {
      console.log('[ViewBookingDialog] No booking to delete');
      return;
    }
    
    console.log('[ViewBookingDialog] Starting delete for booking:', booking.id);
    
    // Safety timeout to force close dialog if deletion hangs (increased to 15s)
    const safetyTimeout = setTimeout(() => {
      console.warn('[ViewBookingDialog] Delete operation timed out, forcing dialog close');
      onOpenChange(false);
    }, 15000); // 15 second timeout
    
    try {
      // Wait for mutation AND all refetches to complete
      await deleteBooking.mutateAsync({
        bookingId: booking.id,
        clientId: booking.clientId,
        staffId: booking.carerId,
      });
      
      console.log('[ViewBookingDialog] Delete mutation and refetches completed successfully');
      clearTimeout(safetyTimeout);
      
      // No artificial delay needed - refetch already completed
      onOpenChange(false);
      console.log('[ViewBookingDialog] Dialog closed, delete complete');
    } catch (error) {
      console.error('[ViewBookingDialog] Delete mutation failed:', error);
      clearTimeout(safetyTimeout);
      onOpenChange(false);
    }
  };

  const handleApproveCancellation = async () => {
    if (!booking?.id) {
      console.error('[ViewBookingDialog] No booking ID for cancellation approval');
      toast.error('Cannot approve cancellation', {
        description: 'Booking information is missing'
      });
      return;
    }
    
    console.log('[ViewBookingDialog] Starting cancellation approval:', {
      bookingId: booking.id,
      branchId: booking.branchId || booking.branch_id,
      status: booking.cancellation_request_status
    });
    
    try {
      // Step 1: Fetch the change request with better error handling
      const { data: changeRequestData, error: fetchError } = await supabase
        .from('booking_change_requests')
        .select('id, client_id, branch_id, organization_id')
        .eq('booking_id', booking.id)
        .eq('status', 'pending')
        .eq('request_type', 'cancellation')
        .maybeSingle();
      
      if (fetchError) {
        console.error('[ViewBookingDialog] Database error fetching change request:', fetchError);
        
        // Check if it's an RLS policy issue
        if (fetchError.code === 'PGRST301' || fetchError.message?.includes('policy')) {
          toast.error('Access Denied', {
            description: 'You do not have permission to approve requests for this branch. Please contact your system administrator.'
          });
        } else {
          toast.error('Database error', {
            description: fetchError.message
          });
        }
        return;
      }
      
      if (!changeRequestData) {
        console.error('[ViewBookingDialog] No pending change request found for booking:', booking.id);
        toast.error('Change Request Not Found', {
          description: 'The cancellation request may have already been processed or deleted. Please refresh the page.'
        });
        return;
      }
      
      console.log('[ViewBookingDialog] Found change request:', changeRequestData);
      
      // Step 2: Update the change request status to 'approved'
      const { error: updateError } = await supabase
        .from('booking_change_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          admin_notes: 'Cancellation approved - booking deleted'
        })
        .eq('id', changeRequestData.id);
      
      if (updateError) {
        console.error('[ViewBookingDialog] Error updating change request:', updateError);
        toast.error('Failed to approve cancellation', {
          description: updateError.message
        });
        return;
      }
      
      // Step 3: Send notification to client
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          title: 'Cancellation Approved',
          message: 'Your cancellation request has been approved. The booking has been removed.',
          type: 'booking',
          category: 'success',
          priority: 'high',
          user_id: changeRequestData.client_id,
          branch_id: changeRequestData.branch_id,
          organization_id: changeRequestData.organization_id,
          data: {
            booking_id: booking.id,
            request_id: changeRequestData.id
          }
        });
      
      if (notificationError) {
        console.warn('[ViewBookingDialog] Failed to send notification:', notificationError);
        // Continue anyway - notification failure shouldn't block deletion
      } else {
        console.log('[ViewBookingDialog] Notification sent to client');
      }
      
      // Step 4: Delete the booking using the existing hook
      await deleteBooking.mutateAsync({
        bookingId: booking.id,
        clientId: booking.clientId || booking.client_id,
        staffId: booking.carerId || booking.staff_id,
      });
      
      console.log('[ViewBookingDialog] Booking deleted successfully');
      
      // Step 5: Show custom success toast
      toast.success('Cancellation Approved — Booking Deleted', {
        description: 'The client has been notified.'
      });
      
      // Step 6: Close the dialog
      onOpenChange(false);
      
    } catch (error) {
      console.error('[ViewBookingDialog] Error in cancellation approval:', error);
      toast.error('Failed to approve cancellation', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const handleApproveCancellationFallback = async () => {
    if (!booking?.id) return;
    
    console.log('[ViewBookingDialog] Using fallback approval method');
    
    try {
      // Step 1: Try to update any pending cancellation requests for this booking
      const { error: updateError } = await supabase
        .from('booking_change_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          admin_notes: 'Cancellation approved via fallback method'
        })
        .eq('booking_id', booking.id)
        .eq('status', 'pending')
        .eq('request_type', 'cancellation');
      
      if (updateError) {
        console.error('[ViewBookingDialog] Failed to update change request:', updateError);
      }
      
      // Step 2: Send notification using booking's client_id
      const clientId = booking.clientId || booking.client_id;
      const branchId = booking.branchId || booking.branch_id;
      
      if (clientId) {
        await supabase
          .from('notifications')
          .insert({
            title: 'Cancellation Approved',
            message: 'Your cancellation request has been approved. The booking has been removed.',
            type: 'booking',
            category: 'success',
            priority: 'high',
            user_id: clientId,
            branch_id: branchId,
            data: {
              booking_id: booking.id
            }
          });
      }
      
      // Step 3: Delete the booking
      await deleteBooking.mutateAsync({
        bookingId: booking.id,
        clientId: clientId,
        staffId: booking.carerId || booking.staff_id,
      });
      
      console.log('[ViewBookingDialog] Cancellation approved successfully via fallback');
      
      toast.success('Cancellation Approved — Booking Deleted', {
        description: 'The client has been notified.'
      });
      
      onOpenChange(false);
      
    } catch (error) {
      console.error('[ViewBookingDialog] Fallback approval failed:', error);
      toast.error('Failed to approve cancellation', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
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
            <Badge variant="custom" className={getStatusColor(booking.status)}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </Badge>
          </div>

          <Separator />

          {/* Request Status Section - ENHANCED */}
          {(booking.cancellation_request_status === 'pending' || booking.reschedule_request_status === 'pending') && (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <AlertCircle className="h-4 w-4" />
                  Change Request
                </div>
                <div className="pl-6 space-y-3">
                  {booking.cancellation_request_status === 'pending' && (
                    <>
                      <Alert className="bg-red-50 border-red-200">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800 text-sm">
                          <strong>Cancellation Request Pending Admin Review</strong>
                          <p className="mt-1">Client has requested to cancel this appointment.</p>
                        </AlertDescription>
                      </Alert>
                      
                      {/* Direct Action Buttons for Cancellation */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={async () => {
                            try {
                              await handleApproveCancellation();
                            } catch (error) {
                              console.log('[ViewBookingDialog] Primary method failed, trying fallback');
                              await handleApproveCancellationFallback();
                            }
                          }}
                          disabled={deleteBooking.isPending}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          {deleteBooking.isPending ? (
                            <>
                              <Clock className="h-4 w-4 mr-1 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Approve Cancellation
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => {
                            setShowApprovalForCancellation(true);
                          }}
                          variant="outline"
                          className="w-full border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </>
                  )}
                  
                  {booking.reschedule_request_status === 'pending' && (
                    <>
                      <Alert className="bg-orange-50 border-orange-200">
                        <RefreshCw className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-800 text-sm">
                          <strong>Reschedule Request Pending Admin Review</strong>
                          <p className="mt-1">Client has requested to reschedule this appointment.</p>
                        </AlertDescription>
                      </Alert>
                      
                      {/* Edit Appointment Button for Reschedule */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => {
                            onOpenChange(false);
                            onEdit?.();
                          }}
                          className="w-full bg-orange-600 hover:bg-orange-700"
                        >
                          <Calendar className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => {
                            setShowApprovalForReschedule(true);
                          }}
                          variant="outline"
                          className="w-full border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject Request
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Client Information */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <User className="h-4 w-4" />
              Assigned Staff
            </div>
            <div className="pl-6 space-y-1">
              {assignedStaff.length === 0 ? (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Carer:</span>
                  <span className="text-sm font-medium">
                    {booking.carerName || booking.staff_name || 'Not assigned'}
                  </span>
                </div>
              ) : assignedStaff.length === 1 ? (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Carer:</span>
                  <span className="text-sm font-medium">
                    {assignedStaff[0].name}
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-sm text-gray-600">Carers ({assignedStaff.length}):</span>
                  <div className="flex flex-wrap gap-2">
                    {assignedStaff.map((staff) => (
                      <Badge 
                        key={staff.id} 
                        variant="outline" 
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {staff.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
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
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Duration:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {Math.floor(durationInMinutes / 60)}h {durationInMinutes % 60 > 0 ? `${durationInMinutes % 60}m` : ''}
                    </span>
                    {(() => {
                      const [startHour] = (startTimeStr || '').split(':').map(Number);
                      const [endHour] = (endTimeStr || '').split(':').map(Number);
                      if (endHour < startHour) {
                        return (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            Overnight
                          </Badge>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Location Information */}
          {booking?.location_address && (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <MapPin className="h-4 w-4" />
                  Location
                </div>
                <div className="pl-6">
                  <p className="text-sm text-gray-600 break-words">{booking.location_address}</p>
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Late Arrival Information */}
          {(booking?.is_late_start || visitRecord?.arrival_delay_minutes > 0) && (
            <div className="space-y-2">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-medium mb-2">
                  <AlertCircle className="h-4 w-4" />
                  Late Arrival Recorded
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Planned Time:</span>
                    <span className="font-medium">{startTimeStr}</span>
                  </div>
                  {visitRecord?.visit_start_time && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Actual Arrival:</span>
                      <span className="font-medium text-amber-700 dark:text-amber-400">
                        {format(parseISO(visitRecord.visit_start_time), 'HH:mm')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Late By:</span>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      {booking?.late_start_minutes || visitRecord?.arrival_delay_minutes || 0} minutes
                    </span>
                  </div>
                  {visitRecord?.late_arrival_reason && (
                    <div className="mt-2 pt-2 border-t border-amber-200 dark:border-amber-700">
                      <span className="text-gray-600 dark:text-gray-400">Reason:</span>
                      <p className="mt-1 text-gray-800 dark:text-gray-200">{visitRecord.late_arrival_reason}</p>
                    </div>
                  )}
                  {visitRecord?.late_submitted_by && (
                    <div className="mt-2 pt-2 border-t border-amber-200 dark:border-amber-700 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Reported By:</span>
                        <span className="font-medium">
                          {visitRecord.staff?.first_name} {visitRecord.staff?.last_name}
                        </span>
                      </div>
                      {visitRecord?.late_submitted_at && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Reported At:</span>
                          <span className="font-medium">
                            {format(parseISO(visitRecord.late_submitted_at), 'd MMM yyyy, HH:mm')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Missed Booking Alert */}
          {booking?.is_missed && (
            <div className="space-y-2">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-400 font-medium">
                  <XCircle className="h-4 w-4" />
                  Booking Marked as Missed
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  The carer did not start this visit on time and it was marked as missed.
                </p>
              </div>
            </div>
          )}

          {/* Cancellation Information with Staff Payment Details */}
          {booking?.status === 'cancelled' && (
            <div className="space-y-2">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-medium mb-2">
                  <XCircle className="h-4 w-4" />
                  Booking Cancelled
                  {booking.suspension_honor_staff_payment && (
                    <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700 ml-2">
                      Staff Payment Applied
                    </Badge>
                  )}
                </div>
                <div className="space-y-1 text-sm">
                  {booking.cancellation_reason && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Reason:</span>
                      <span className="font-medium">{booking.cancellation_reason}</span>
                    </div>
                  )}
                  {booking.cancelled_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Cancelled At:</span>
                      <span className="font-medium">{format(parseISO(booking.cancelled_at), 'dd MMM yyyy, HH:mm')}</span>
                    </div>
                  )}
                  {booking.suspension_honor_staff_payment && (
                    <>
                      <Separator className="my-2" />
                      <div className="flex justify-between text-green-700 dark:text-green-400">
                        <span>Staff Payment Type:</span>
                        <span className="font-medium capitalize">{booking.staff_payment_type || 'Full'}</span>
                      </div>
                      {booking.staff_payment_amount && (
                        <div className="flex justify-between text-green-700 dark:text-green-400">
                          <span>Payment Amount:</span>
                          <span className="font-medium">£{booking.staff_payment_amount.toFixed(2)}</span>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                        Despite cancellation, staff payment will be processed as per the selected option.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Service Information */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <FileText className="h-4 w-4" />
              {bookingServicesList.length > 1 ? 'Services' : 'Service'}
            </div>
            <div className="pl-6 space-y-3">
              {/* All services displayed as clean badges */}
              {bookingServicesList.length > 0 ? (
                <div className="space-y-3">
                  {/* Service names as badges in a row */}
                  <div className="flex flex-wrap gap-2">
                    {bookingServicesList.map((svc, index) => (
                      <Badge 
                        key={svc.id || index} 
                        variant="secondary" 
                        className="bg-blue-100 text-blue-800 text-sm py-1 px-3"
                      >
                        {svc.title}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Appointment time shown below all services */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{startTimeStr || ''} - {endTimeStr || ''}</span>
                  </div>
                </div>
              ) : (
                <div className="p-2 bg-muted rounded-md">
                  <span className="text-sm text-muted-foreground">No service selected</span>
                </div>
              )}
              
              {/* Related services from other bookings in same session */}
              {relatedBookings.length > 0 && (
                <>
                  <div className="text-xs text-muted-foreground font-medium mt-2">
                    Additional Services (Same Booking Session):
                  </div>
                  {relatedBookings.map((relatedBooking) => {
                    const relatedService = services.find(s => s.id === relatedBooking.service_id);
                    const relatedStart = parseISO(relatedBooking.start_time);
                    const relatedEnd = parseISO(relatedBooking.end_time);
                    const relatedStartTime = formatInTimeZone(relatedStart, getUserTimezone(), 'HH:mm');
                    const relatedEndTime = formatInTimeZone(relatedEnd, getUserTimezone(), 'HH:mm');
                    
                    return (
                      <div key={relatedBooking.id} className="p-2 bg-muted rounded-md">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <span className="text-sm font-medium">
                              {relatedService?.title || "Unknown Service"}
                            </span>
                            <div className="text-xs text-muted-foreground mt-1">
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

          {/* Care Plan Preview */}
          {(booking.clientId || booking.client_id) && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <ClipboardList className="h-4 w-4" />
                  Care Plan Preview
                </div>
                <div className="pl-2">
                  <CarePlanPreviewSection 
                    clientId={booking.clientId || booking.client_id}
                    compact={true}
                    showHeader={false}
                  />
                </div>
              </div>
            </>
          )}

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

        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <div className="flex justify-between w-full">
            <div className="flex gap-2">
              {canDelete && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={() => setShowDeleteConfirmation(true)}
                  disabled={deleteBooking.isPending || deleteMultipleBookings.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Booking
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {onEdit && (
                <Button type="button" onClick={onEdit}>
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <DeleteBookingConfirmationDialog
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
        booking={{
          id: booking.id,
          clientId: booking.clientId || booking.client_id,
          clientName: booking.clientName || 'Unknown Client',
          carerId: booking.carerId || booking.staff_id,
          carerName: booking.carerName,
          start_time: booking.start_time,
          end_time: booking.end_time,
          serviceName: service?.title,
          branchId: branchId || booking.branchId || booking.branch_id
        }}
        onDeleteSingle={async () => {
          await handleDelete();
          setShowDeleteConfirmation(false);
        }}
        onDeleteMultiple={async (bookingIds, bookings) => {
          await deleteMultipleBookings.mutateAsync({ 
            bookingIds, 
            bookings: bookings.map(b => ({
              id: b.id,
              clientId: booking.clientId || booking.client_id,
              staffId: b.staff_id
            }))
          });
          setShowDeleteConfirmation(false);
          onOpenChange(false);
        }}
        isDeleting={deleteBooking.isPending || deleteMultipleBookings.isPending}
      />

      {/* Approval Dialog for Cancellation/Reschedule */}
      {changeRequest && (showApprovalForCancellation || showApprovalForReschedule) && (
        <AppointmentApprovalDialog
          open={showApprovalForCancellation || showApprovalForReschedule}
          onOpenChange={(open) => {
            setShowApprovalForCancellation(false);
            setShowApprovalForReschedule(false);
          }}
          appointment={{
            ...changeRequest,
            booking_id: booking.id,
            client_name: booking.clientName,
            staff_name: booking.carerName,
            service_title: service?.title
          }}
          onApprove={() => {
            setShowApprovalForCancellation(false);
            setShowApprovalForReschedule(false);
            onOpenChange(false);
          }}
          onReject={() => {
            setShowApprovalForCancellation(false);
            setShowApprovalForReschedule(false);
            onOpenChange(false);
          }}
        />
      )}
    </Dialog>
  );
}