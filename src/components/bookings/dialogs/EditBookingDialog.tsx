
import React, { useState, useEffect, useMemo } from "react";
import { format, parse } from "date-fns";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { Calendar as CalendarIcon, Clock, Save, X, AlertCircle, CheckCircle, ChevronDown, Circle, CalendarOff, MapPin, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getBookingStatusColor, getBookingStatusLabel, BOOKING_STATUS_COLORS, BookingStatusType } from "../utils/bookingColors";
import { useConsolidatedValidation } from "../hooks/useConsolidatedValidation";
import { useStaffLeaveAvailability, validateCarersLeaveConflict } from "@/hooks/useStaffLeaveAvailability";
import { BookingValidationAlert } from "../BookingValidationAlert";
import { BookingOverlapAlert } from "../BookingOverlapAlert";
import { useClientAddresses, ClientAddress } from "@/hooks/useClientAddresses";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { MultiSelect } from "@/components/ui/multi-select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useUpdateBooking } from "@/data/hooks/useUpdateBooking";
import { useDeleteBooking } from "@/data/hooks/useDeleteBooking";
import { useUserRole } from "@/hooks/useUserRole";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { updateBookingServices, useBookingServices } from "@/hooks/useBookingServices";
import { notifyBookingCancelled } from "@/utils/bookingNotifications";
import { validateBookingAgainstClientActiveDate } from "@/utils/clientActiveValidation";
import { AdvancedCancellationDialog, CancellationData } from "./AdvancedCancellationDialog";
import { MultiCarerDeleteDialog } from "./MultiCarerDeleteDialog";
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

const isValidDate = (d: Date) => !isNaN(d.getTime());

const editBookingSchema = z.object({
  booking_date: z.date({
    required_error: "Booking date is required",
  }),
  start_time: z.string().min(5, { message: "Start time is required" }), // HH:mm format
  end_time: z.string().min(5, { message: "End time is required" }),     // HH:mm format
  service_ids: z.array(z.string()).optional(),
  staff_ids: z.array(z.string()).optional(),
  assign_later: z.boolean().optional(),
  notes: z.string().optional(),
  status: z.string().optional(),
  location_address: z.string().optional(), // Booking location
}).refine((data) => {
  // Validate end time is after start time
  const [startHour, startMin] = data.start_time.split(':').map(Number);
  const [endHour, endMin] = data.end_time.split(':').map(Number);
  return (endHour * 60 + endMin) > (startHour * 60 + startMin);
}, {
  message: "End time must be after start time",
  path: ["end_time"]
});

// Available booking statuses for manual selection
const BOOKING_STATUSES = [
  { value: 'assigned', label: 'Assigned', colorClass: 'bg-green-500' },
  { value: 'unassigned', label: 'Unassigned', colorClass: 'bg-yellow-500' },
  { value: 'in-progress', label: 'In Progress', colorClass: 'bg-purple-500' },
  { value: 'done', label: 'Done', colorClass: 'bg-blue-500' },
  { value: 'missed', label: 'Missed', colorClass: 'bg-red-500' },
  { value: 'cancelled', label: 'Cancelled', colorClass: 'bg-rose-500' },
  { value: 'departed', label: 'Departed', colorClass: 'bg-teal-500' },
  { value: 'suspended', label: 'Suspended', colorClass: 'bg-gray-500' },
  { value: 'late', label: 'Late Arrival', colorClass: 'bg-orange-500' },
  { value: 'training', label: 'Training', colorClass: 'bg-amber-500' },
] as const;

type EditBookingFormData = z.infer<typeof editBookingSchema>;

interface EditBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any;
  services: Array<{ id: string; title: string }>;
  branchId?: string;
  carers?: Array<{ id: string; name: string; status?: string }>;
  onSuccess?: (bookingId: string) => void;
}

export function EditBookingDialog({
  open,
  onOpenChange,
  booking,
  services,
  branchId,
  carers = [],
  onSuccess,
}: EditBookingDialogProps) {
  // Guard against invalid booking data
  if (!booking || !booking.id) {
    return null;
  }

  const updateBooking = useUpdateBooking(branchId);
  const deleteBooking = useDeleteBooking(branchId);
  const { data: userRole } = useUserRole();
  const queryClient = useQueryClient();
  
  // Fetch services from junction table
  const { data: bookingServices, isLoading: isLoadingServices } = useBookingServices(booking?.id || '');
  
  // Consolidated validation system
  const { validateBooking, isValidating } = useConsolidatedValidation(branchId);
  
  // Form must be declared before using form.watch
  const form = useForm<EditBookingFormData>({
    resolver: zodResolver(editBookingSchema),
    defaultValues: {
      booking_date: undefined as Date | undefined,
      start_time: "",
      end_time: "",
      service_ids: [],
      staff_ids: [],
      assign_later: false,
      notes: "",
      status: "",
      location_address: "",
    },
  });
  
  // Watch booking date for leave availability check
  const watchedBookingDate = form.watch("booking_date");
  
  // Leave availability check for the booking date
  const { 
    isStaffOnLeave, 
    getLeaveInfo, 
    approvedLeaves,
  } = useStaffLeaveAvailability(branchId, watchedBookingDate);

  // Fetch client addresses for location field
  const clientId = booking?.clientId || booking?.client_id;
  const { data: clientAddresses = [] } = useClientAddresses(clientId || "");

  // Fetch client data for active_until validation
  const { data: clientData } = useQuery({
    queryKey: ['client-active-period', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const { data } = await supabase
        .from('clients')
        .select('id, active_until, status')
        .eq('id', clientId)
        .single();
      return data;
    },
    enabled: Boolean(clientId)
  });

  // State for client active validation alert
  const [clientActiveAlert, setClientActiveAlert] = useState<{
    show: boolean;
    message: string;
  } | null>(null);

  // Format address for display
  const formatAddress = (addr: ClientAddress): string => {
    const parts = [addr.address_line_1, addr.address_line_2, addr.city, addr.state_county, addr.postcode].filter(Boolean);
    return parts.join(', ');
  };
  
  // Build carer names map for validation
  const carerNamesMap = useMemo(() => {
    const map = new Map<string, string>();
    carers.forEach(c => {
      map.set(c.id, c.name || 'Unknown');
    });
    return map;
  }, [carers]);
  
  // Validation states
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    error?: string;
    conflictingBookings: any[];
  } | null>(null);
  const [showOverlapAlert, setShowOverlapAlert] = useState(false);
  const [failedCarerName, setFailedCarerName] = useState<string | null>(null);
  
  // Cancellation workflow state
  const [showCancellationDialog, setShowCancellationDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [previousStatus, setPreviousStatus] = useState<string>("");
  
  // Multi-carer delete dialog state
  const [showMultiCarerDeleteDialog, setShowMultiCarerDeleteDialog] = useState(false);
  
  // Search input for carers dropdown
  const [carerSearchInput, setCarerSearchInput] = useState('');
  
  // Track all related booking records for this appointment
  const [relatedBookingRecords, setRelatedBookingRecords] = React.useState<Array<{
    id: string;
    staff_id: string;
    staff_name: string;
  }>>([]);
  
  // Track original staff IDs to calculate diff
  const [originalStaffIds, setOriginalStaffIds] = React.useState<string[]>([]);
  
  // Track unassigned booking ID separately (for "Assign Carer Later" bookings)
  const [unassignedBookingId, setUnassignedBookingId] = React.useState<string | null>(null);

  // Check if user can delete bookings (admins only)
  const canDelete = userRole?.role && ['super_admin', 'branch_admin'].includes(userRole.role);

  // Filtered carers based on search input
  const filteredCarers = useMemo(() => {
    if (!carerSearchInput.trim()) return carers;
    const searchLower = carerSearchInput.toLowerCase();
    return carers.filter(carer => 
      carer.name?.toLowerCase().includes(searchLower)
    );
  }, [carers, carerSearchInput]);

  // Calculate predicted status based on manual selection or staff_ids
  const predictedStatus = useMemo(() => {
    const manualStatus = form.watch('status');
    const selectedStaffIds = form.watch('staff_ids') || [];
    const assignLater = form.watch('assign_later');
    
    // If manual status is set to something other than assigned/unassigned, use it
    if (manualStatus && manualStatus !== 'assigned' && manualStatus !== 'unassigned') {
      return manualStatus;
    }
    
    if (assignLater) return 'unassigned';
    return selectedStaffIds.length > 0 ? 'assigned' : 'unassigned';
  }, [form.watch('status'), form.watch('staff_ids'), form.watch('assign_later')]);

  // Get current status from booking
  const currentStatus = booking?.status || 'unassigned';
  
  // Check if status will change
  const statusWillChange = predictedStatus !== currentStatus;

  const handleDelete = async () => {
    if (!booking) {
      console.log('[EditBookingDialog] No booking to delete');
      return;
    }
    
    console.log('[EditBookingDialog] Starting delete for booking:', booking.id);
    
    // Safety timeout to force close dialog if deletion hangs (increased to 15s)
    const safetyTimeout = setTimeout(() => {
      console.warn('[EditBookingDialog] Delete operation timed out, forcing dialog close');
      onOpenChange(false);
    }, 15000); // 15 second timeout
    
    try {
      // Wait for mutation AND all refetches to complete
      await deleteBooking.mutateAsync({
        bookingId: booking.id,
        clientId: booking.clientId || booking.client_id,
        staffId: booking.carerId || booking.staff_id,
      });
      
      console.log('[EditBookingDialog] Delete mutation and refetches completed successfully');
      clearTimeout(safetyTimeout);
      
      // No artificial delay needed - refetch already completed
      onOpenChange(false);
      console.log('[EditBookingDialog] Dialog closed, delete complete');
    } catch (error) {
      console.error('[EditBookingDialog] Delete mutation failed:', error);
      clearTimeout(safetyTimeout);
      onOpenChange(false);
    }
  };

  // Handle delete for single carer in multi-carer booking
  const handleDeleteSingleCarer = async (bookingId: string, carerName: string) => {
    console.log('[EditBookingDialog] Deleting single carer booking:', bookingId, carerName);
    
    try {
      const carerRecord = relatedBookingRecords.find(r => r.id === bookingId);
      await deleteBooking.mutateAsync({
        bookingId,
        clientId: booking.clientId || booking.client_id,
        staffId: carerRecord?.staff_id,
      });
      
      toast.success(`Removed ${carerName} from this booking`);
      setShowMultiCarerDeleteDialog(false);
      onOpenChange(false);
    } catch (error) {
      console.error('[EditBookingDialog] Failed to delete single carer:', error);
    }
  };

  // Handle delete for all carers (entire appointment)
  const handleDeleteAllCarers = async (bookingIds: string[]) => {
    console.log('[EditBookingDialog] Deleting all carer bookings:', bookingIds);
    
    try {
      for (const bookingId of bookingIds) {
        const carerRecord = relatedBookingRecords.find(r => r.id === bookingId);
        await deleteBooking.mutateAsync({
          bookingId,
          clientId: booking.clientId || booking.client_id,
          staffId: carerRecord?.staff_id,
        });
      }
      
      toast.success('Entire 2:1 appointment deleted');
      setShowMultiCarerDeleteDialog(false);
      onOpenChange(false);
    } catch (error) {
      console.error('[EditBookingDialog] Failed to delete all carers:', error);
    }
  };

  // Handle reassign carer (close delete dialog, focus on staff selection)
  const handleReassignCarer = (bookingId: string, carerName: string) => {
    console.log('[EditBookingDialog] Reassigning carer:', bookingId, carerName);
    setShowMultiCarerDeleteDialog(false);
    toast.info(`Select a new carer to replace ${carerName}`, {
      duration: 4000,
    });
  };

  // Check if this is a multi-carer booking and open appropriate dialog
  const handleDeleteClick = () => {
    if (relatedBookingRecords.length > 1) {
      // Multi-carer booking - show selection dialog
      setShowMultiCarerDeleteDialog(true);
    }
    // For single carer, the AlertDialog will handle it via AlertDialogTrigger
  };

  // Handle cancellation with advanced workflow
  const handleCancellationConfirm = async (cancellationData: CancellationData) => {
    if (!booking) return;
    
    setIsCancelling(true);
    
    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      // Update booking with cancellation details including payment type and amount
      const updateData: Record<string, any> = {
        status: 'cancelled',
        cancellation_reason: cancellationData.reasonLabel + (cancellationData.details ? ` - ${cancellationData.details}` : ''),
        cancelled_at: new Date().toISOString(),
        cancelled_by: user?.id || null,
        suspension_honor_staff_payment: cancellationData.payStaff,
        staff_payment_type: cancellationData.paymentType,
        staff_payment_amount: cancellationData.payStaff ? cancellationData.paymentAmount : null,
      };
      
      // Handle invoice removal
      if (cancellationData.removeFromInvoice) {
        updateData.is_invoiced = false;
        updateData.included_in_invoice_id = null;
      }
      
      // Update the booking
      const { error: updateError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', booking.id);
      
      if (updateError) throw updateError;
      
      // Also update related bookings (multi-staff appointments)
      if (relatedBookingRecords.length > 0) {
        const relatedIds = relatedBookingRecords.map(r => r.id).filter(id => id !== booking.id);
        if (relatedIds.length > 0) {
          await supabase
            .from('bookings')
            .update(updateData)
            .in('id', relatedIds);
        }
      }
      
      // Send notification if enabled
      if (cancellationData.sendNotification) {
        try {
          await notifyBookingCancelled({
            bookingId: booking.id,
            branchId: booking.branch_id || branchId || '',
            clientId: booking.clientId || booking.client_id,
            staffId: booking.carerId || booking.staff_id,
            clientName: booking.clientName,
            carerName: booking.carerName,
            startTime: booking.start_time || booking.startTime,
            notificationType: 'booking_cancelled',
          });
        } catch (notifyError) {
          console.error('[EditBookingDialog] Failed to send cancellation notification:', notifyError);
          // Don't fail the whole operation for notification errors
        }
      }
      
      // Update form status
      form.setValue('status', 'cancelled');
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['branch-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['client-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['carer-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['carer-appointments-full'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-records'] });
      
      const paymentInfo = cancellationData.payStaff 
        ? ` (Carer payment: £${cancellationData.paymentAmount.toFixed(2)})` 
        : '';
      
      toast.success('Booking cancelled successfully', {
        description: `Reason: ${cancellationData.reasonLabel}${paymentInfo}`,
      });
      
      setShowCancellationDialog(false);
      onOpenChange(false);
      
      if (onSuccess) {
        onSuccess(booking.id);
      }
    } catch (error) {
      console.error('[EditBookingDialog] Cancellation failed:', error);
      toast.error('Failed to cancel booking');
    } finally {
      setIsCancelling(false);
    }
  };

  // Fetch all booking records for this appointment (multiple staff)
  useEffect(() => {
    const fetchRelatedBookings = async () => {
      if (!open || !booking?.id) return;
      
      console.log('[EditBookingDialog] Fetching related booking records');
      
      // Determine the correct time values (handle both formats)
      const startTimeValue = booking.start_time || 
        (booking.date && booking.startTime ? `${booking.date}T${booking.startTime}:00Z` : null);
      const endTimeValue = booking.end_time || 
        (booking.date && booking.endTime ? `${booking.date}T${booking.endTime}:00Z` : null);
      const branchIdValue = booking.branch_id || branchId;
      const clientIdValue = booking.clientId || booking.client_id;
      
      if (!startTimeValue || !endTimeValue || !branchIdValue || !clientIdValue) {
        console.warn('[EditBookingDialog] Missing required booking data for query:', {
          startTimeValue, endTimeValue, branchIdValue, clientIdValue
        });
        return;
      }
      
      try {
        // Fetch all bookings with same client, time, and service
        const { data: sameTimeBookings, error } = await supabase
          .from('bookings')
          .select(`
            id,
            staff_id,
            service_id,
            staff:staff_id (
              id,
              first_name,
              last_name
            )
          `)
          .eq('client_id', clientIdValue)
          .eq('branch_id', branchIdValue)
          .eq('start_time', startTimeValue)
          .eq('end_time', endTimeValue);
        
        if (error) {
          console.error('[EditBookingDialog] Error fetching related bookings:', error);
          return;
        }
        
        // Find and track unassigned booking (staff_id is null)
        const unassignedBooking = (sameTimeBookings || []).find(b => !b.staff_id);
        setUnassignedBookingId(unassignedBooking?.id || null);
        
        console.log('[EditBookingDialog] Unassigned booking found:', unassignedBooking?.id);
        
        // Extract staff records (assigned bookings only)
        const staffRecords = (sameTimeBookings || [])
          .filter(b => b.staff_id && b.staff)
          .map(b => ({
            id: b.id,
            staff_id: b.staff_id,
            staff_name: `${b.staff.first_name} ${b.staff.last_name}`
          }));
        
        console.log('[EditBookingDialog] Found related bookings:', {
          staffRecords,
          unassignedBookingId: unassignedBooking?.id
        });
        
        setRelatedBookingRecords(staffRecords);
        
        // Store original staff IDs
        const staffIds = staffRecords.map(r => r.staff_id);
        setOriginalStaffIds(staffIds);
        
        // Pre-fill form with current staff
        form.setValue('staff_ids', staffIds);
        form.setValue('assign_later', staffIds.length === 0 && !!unassignedBooking);
        
      } catch (error) {
        console.error('[EditBookingDialog] Error:', error);
      }
    };
    
    fetchRelatedBookings();
  }, [open, booking?.id]);
  
  // Update form when booking changes and reset validation state
  useEffect(() => {
    if (booking && booking.id && open) {
      // Handle both ISO format (start_time) and local format (date + startTime)
      let bookingDate: Date | undefined;
      let startTimeStr = "";
      let endTimeStr = "";
      
      if (booking.start_time) {
        // ISO format from raw database
        const start = new Date(booking.start_time);
        const end = new Date(booking.end_time);
        if (isValidDate(start) && isValidDate(end)) {
          bookingDate = start;
          startTimeStr = format(start, "HH:mm");
          endTimeStr = format(end, "HH:mm");
        }
      } else if (booking.date && booking.startTime) {
        // Local format from grid/list view
        bookingDate = new Date(booking.date);
        startTimeStr = booking.startTime;
        endTimeStr = booking.endTime;
      }
      
      // Only set values if we have valid data
      if (bookingDate) form.setValue("booking_date", bookingDate);
      if (startTimeStr) form.setValue("start_time", startTimeStr);
      if (endTimeStr) form.setValue("end_time", endTimeStr);
      
      // Get services from junction table (bookingServices hook) with fallbacks
      let serviceIdsToSet: string[] = [];
      if (bookingServices && bookingServices.length > 0) {
        // Priority 1: Use services from junction table
        serviceIdsToSet = bookingServices.map(bs => bs.service_id);
      } else if (booking.service_ids?.length > 0) {
        // Priority 2: Use service_ids array from booking object
        serviceIdsToSet = booking.service_ids;
      } else if (booking.service_id) {
        // Priority 3: Fallback to single service_id for backwards compatibility
        serviceIdsToSet = [booking.service_id];
      }
      
      form.setValue("service_ids", serviceIdsToSet);
      form.setValue("notes", booking.notes || "");
      form.setValue("status", booking.status || "assigned");
      form.setValue("location_address", booking.location_address || "");
      
      console.log('[EditBookingDialog] Form initialized:', {
        bookingId: booking.id,
        booking_date: bookingDate,
        start_time: startTimeStr,
        end_time: endTimeStr,
        service_ids: serviceIdsToSet,
        fromJunctionTable: bookingServices && bookingServices.length > 0
      });
      
      // Reset validation state when dialog opens
      setValidationResult(null);
      setShowOverlapAlert(false);
    }
  }, [booking, open, form, bookingServices]);

  // Validate booking when time fields change
  const validateCurrentBooking = async () => {
    if (!booking) return true;
    
    const formValues = form.getValues();
    const bookingDate = formValues.booking_date;
    const startTime = formValues.start_time;
    const endTime = formValues.end_time;

    if (!bookingDate || !startTime || !endTime) {
      return true;
    }

    // Use date from the separate date picker
    const date = format(bookingDate, "yyyy-MM-dd");

    const selectedStaffIds = formValues.staff_ids || [];
    
    // Skip validation if no staff or "assign later"
    if (selectedStaffIds.length === 0 || formValues.assign_later) {
      return true;
    }
    
    // Collect ALL booking IDs that should be excluded (multi-staff appointments)
    const allExcludeIds = [
      booking.id,
      ...relatedBookingRecords.map(r => r.id),
      ...(unassignedBookingId ? [unassignedBookingId] : [])
    ].filter(Boolean);
    
    console.log("[EditBookingDialog] Excluding booking IDs:", allExcludeIds);
    
    // Only validate NEW staff members (not already assigned)
    const newStaffToValidate = selectedStaffIds.filter(id => !originalStaffIds.includes(id));
    
    // If no new staff being added, skip validation
    if (newStaffToValidate.length === 0) {
      console.log("[EditBookingDialog] No new staff to validate, skipping overlap check");
      setValidationResult({ isValid: true, conflictingBookings: [] });
      return true;
    }
    
    // Validate each NEW staff for overlaps
    let hasOverlap = false;
    let allConflictingBookings: any[] = [];
    
    for (const staffId of newStaffToValidate) {
      console.log("[EditBookingDialog] Validating for NEW staff:", staffId);
      
      const result = await validateBooking(
        staffId,
        startTime,
        endTime,
        date,
        allExcludeIds
      );
      
      if (!result.isValid && result.conflictingBookings.length > 0) {
        hasOverlap = true;
        allConflictingBookings = [
          ...allConflictingBookings,
          ...result.conflictingBookings
        ];
        
        // Track the carer name that failed validation
        const failedCarer = carers.find(c => c.id === staffId);
        setFailedCarerName(failedCarer?.name || "Unknown Carer");
        break; // Stop at first conflict
      }
    }
    
    if (hasOverlap) {
      setValidationResult({
        isValid: false,
        error: `Overlap detected for ${allConflictingBookings.length} booking(s)`,
        conflictingBookings: allConflictingBookings
      });
      setShowOverlapAlert(true);
      return false;
    }
    
    // Reset failed carer name on successful validation
    setFailedCarerName(null);
    
    setValidationResult({ isValid: true, conflictingBookings: [] });
    return true;
  };

  const onSubmit = async (data: EditBookingFormData) => {
    // STEP 1: Validate client active date FIRST
    if (clientData?.active_until) {
      const validation = validateBookingAgainstClientActiveDate(
        data.booking_date,
        clientData.active_until
      );
      if (!validation.isValid) {
        setClientActiveAlert({ show: true, message: validation.error! });
        return;
      }
    }

    // Validate overlaps before submitting
    const isValidBooking = await validateCurrentBooking();
    if (!isValidBooking) {
      console.log("[EditBookingDialog] Validation failed, not submitting");
      return;
    }

    // Combine date + time into full datetime
    const bookingDate = data.booking_date;
    const [startHour, startMin] = data.start_time.split(':').map(Number);
    const [endHour, endMin] = data.end_time.split(':').map(Number);

    const start = new Date(bookingDate);
    start.setHours(startHour, startMin, 0, 0);

    const end = new Date(bookingDate);
    end.setHours(endHour, endMin, 0, 0);

    if (!isValidDate(start) || !isValidDate(end)) {
      toast.error("Please provide valid date and times");
      return;
    }
    
    try {
      const newStaffIds = data.staff_ids || [];
      
      // Track which booking ID should receive service updates
      // This is crucial because the original booking may be deleted during multi-carer/assign-later flows
      let activeBookingIdForServices: string | null = booking.id;
      
      // Calculate diff: which staff to add, remove, keep
      const staffToAdd = newStaffIds.filter(id => !originalStaffIds.includes(id));
      const staffToRemove = originalStaffIds.filter(id => !newStaffIds.includes(id));
      const staffToKeep = originalStaffIds.filter(id => newStaffIds.includes(id));
      
      console.log('[EditBookingDialog] Staff changes:', {
        add: staffToAdd,
        remove: staffToRemove,
        keep: staffToKeep
      });
      
      // Common booking data - use first service_id for backwards compatibility
      const primaryServiceId = data.service_ids?.[0] || null;
      
      // Determine final status: use manual selection if set, otherwise auto-calculate
      const finalStatus = data.status || (newStaffIds.length > 0 ? 'assigned' : 'unassigned');
      
      const commonUpdates = {
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        service_id: primaryServiceId,
        notes: data.notes,
        status: finalStatus,
        location_address: data.location_address || null,
        reschedule_request_status: null,
        cancellation_request_status: null,
      };
      
      // Mark any pending change requests as superseded when admin directly edits
      if (booking.id) {
        const { error: requestUpdateError } = await supabase
          .from('booking_change_requests')
          .update({
            status: 'superseded',
            admin_notes: 'Booking was directly edited by admin',
            reviewed_at: new Date().toISOString()
          })
          .eq('booking_id', booking.id)
          .eq('status', 'pending');
        
        if (requestUpdateError) {
          console.warn('[EditBookingDialog] Could not update change requests:', requestUpdateError);
        }
      }
      
      // STEP 1: Update bookings for staff we're keeping
      for (const staffId of staffToKeep) {
        const bookingRecord = relatedBookingRecords.find(r => r.staff_id === staffId);
        if (bookingRecord) {
          await updateBooking.mutateAsync({
            bookingId: bookingRecord.id,
            updatedData: {
              ...commonUpdates,
              staff_id: staffId,
            },
          });
        }
      }
      
      // STEP 2: Delete bookings for removed staff
      for (const staffId of staffToRemove) {
        const bookingRecord = relatedBookingRecords.find(r => r.staff_id === staffId);
        if (bookingRecord) {
          await deleteBooking.mutateAsync({
            bookingId: bookingRecord.id,
            clientId: booking.clientId || booking.client_id,
            staffId: staffId,
          });
        }
      }
      
      // STEP 3: Create new bookings for added staff (or update unassigned booking first)
      let remainingStaffToAdd = [...staffToAdd];

      // If there's an unassigned booking and we're adding staff, UPDATE it first instead of creating new
      if (unassignedBookingId && remainingStaffToAdd.length > 0) {
        const firstStaffId = remainingStaffToAdd[0];
        console.log('[EditBookingDialog] Updating unassigned booking with first staff:', {
          bookingId: unassignedBookingId,
          staffId: firstStaffId
        });
        
        const { error } = await supabase
          .from('bookings')
          .update({
            ...commonUpdates,
            staff_id: firstStaffId,
            status: 'assigned',
          })
          .eq('id', unassignedBookingId);
        
        if (error) {
          console.error('[EditBookingDialog] Error updating unassigned booking:', error);
          throw error;
        }
        
        // Remove from list since we used the existing booking
        remainingStaffToAdd = remainingStaffToAdd.slice(1);
      }

      // Create new bookings only for remaining staff
      for (const staffId of remainingStaffToAdd) {
        const { error } = await supabase.from('bookings').insert({
          branch_id: booking.branch_id,
          client_id: booking.clientId || booking.client_id,
          staff_id: staffId,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          service_id: primaryServiceId,
          status: 'assigned',
          notes: data.notes,
          location_address: data.location_address || null,
        });
        
        if (error) throw error;
      }
      
      // STEP 4: Handle "assign later" case
      if (data.assign_later && originalStaffIds.length > 0) {
        // Delete all existing staff bookings
        for (const record of relatedBookingRecords) {
          await deleteBooking.mutateAsync({
            bookingId: record.id,
            clientId: booking.clientId || booking.client_id,
            staffId: record.staff_id,
          });
        }
        
        // Create one unassigned booking and capture its ID for services
        const { data: newUnassignedBooking, error } = await supabase.from('bookings').insert({
          branch_id: booking.branch_id,
          client_id: booking.clientId || booking.client_id,
          staff_id: null,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          service_id: primaryServiceId,
          status: 'unassigned',
          notes: data.notes,
          location_address: data.location_address || null,
        }).select('id').single();
        
        if (error) throw error;
        
        // Update the active booking ID for service junction table
        if (newUnassignedBooking) {
          activeBookingIdForServices = newUnassignedBooking.id;
          console.log('[EditBookingDialog] Assign Later: using new booking for services:', activeBookingIdForServices);
        }
      }
      
      // Success message
      const carerCount = newStaffIds.length;
      const message = carerCount > 1 
        ? `Booking updated with ${carerCount} carers assigned`
        : "Appointment updated successfully";
      
      toast.success(message);
      
      // Update services in junction table using the ACTIVE booking ID (not original which may be deleted)
      try {
        if (activeBookingIdForServices) {
          // Verify the booking exists before updating services
          const { data: bookingExists } = await supabase
            .from('bookings')
            .select('id')
            .eq('id', activeBookingIdForServices)
            .single();
          
          if (bookingExists) {
            await updateBookingServices(activeBookingIdForServices, data.service_ids || []);
            console.log('[EditBookingDialog] Services updated for booking:', activeBookingIdForServices);
            
            // Invalidate booking-services queries to refresh UI immediately
            queryClient.invalidateQueries({ queryKey: ["booking-services", activeBookingIdForServices] });
            queryClient.invalidateQueries({ queryKey: ["booking-services-batch"] });
          } else {
            console.warn('[EditBookingDialog] Booking no longer exists, skipping service update');
          }
        }
      } catch (serviceError) {
        console.error('[EditBookingDialog] Failed to update services:', serviceError);
      }
      
      // Invalidate other queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ["branch-bookings", branchId] });
      queryClient.invalidateQueries({ queryKey: ["client-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["carer-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["organization-calendar"] });
      
      if (onSuccess) {
        onSuccess(booking.id);
      } else {
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("Failed to update appointment");
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <Clock className="h-5 w-5" />
            Edit Appointment
          </DialogTitle>
          <DialogDescription>
            Modify the appointment details including time, carer, service, and notes.
          </DialogDescription>
        </DialogHeader>

        <>
          {/* Status Change Preview */}
            {statusWillChange && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Status will be updated
                  </p>
                  <p className="text-blue-700 dark:text-blue-300">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                      {currentStatus}
                    </span>
                    <span className="mx-2">→</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {predictedStatus}
                    </span>
                  </p>
                </div>
              </div>
            )}
            
            {/* Validation Alert */}
            <BookingValidationAlert
              isValidating={isValidating}
              validationError={validationResult?.error}
              isValid={validationResult?.isValid}
              conflictCount={validationResult?.conflictingBookings?.length}
            />
            
            {/* Scrollable Content Area */}
            <div className="overflow-y-auto flex-1 px-1 -mx-1">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                  control={form.control}
                  name="service_ids"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Services</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={services.map((service) => ({
                            label: service.title,
                            value: service.id,
                          }))}
                          selected={field.value || []}
                          onSelectionChange={field.onChange}
                          placeholder="Select services..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="staff_ids"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Assigned Carers
                        {field.value && field.value.length > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {field.value.length} carer(s) assigned
                          </span>
                        )}
                        {(!field.value || field.value.length === 0) && currentStatus === 'assigned' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Will be unassigned
                          </span>
                        )}
                      </FormLabel>
                      
                      <FormControl>
                        <div className="space-y-2">
                          {/* Multi-select dropdown */}
                          <Popover onOpenChange={(open) => { if (!open) setCarerSearchInput(''); }}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between",
                                  !field.value?.length && "text-muted-foreground"
                                )}
                                disabled={form.watch('assign_later')}
                              >
                                {field.value?.length 
                                  ? field.value.length === 1
                                    ? (() => {
                                        const carer = carers.find(c => c.id === field.value[0]);
                                        return carer?.name || "Select carer";
                                      })()
                                    : `${field.value.length} carers selected`
                                  : "Select carers..."
                                }
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[320px] p-0 bg-popover" align="start">
                              {/* Search Input */}
                              <div className="p-2 border-b">
                                <div className="relative">
                                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    placeholder="Search carers..."
                                    value={carerSearchInput}
                                    onChange={(e) => setCarerSearchInput(e.target.value)}
                                    className="pl-8 h-9"
                                  />
                                </div>
                              </div>
                              {/* Select All / Clear All */}
                              <div className="p-2 border-b flex items-center justify-between">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const allIds = filteredCarers.map(c => c.id);
                                    field.onChange([...new Set([...(field.value || []), ...allIds])]);
                                  }}
                                  className="h-6 px-2 text-xs"
                                >
                                  Select All
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => field.onChange([])}
                                  className="h-6 px-2 text-xs"
                                >
                                  Clear All
                                </Button>
                              </div>
                              {/* Scrollable Carers List */}
                              <ScrollArea className="max-h-[200px]">
                                {filteredCarers.length === 0 ? (
                                  <div className="p-4 text-center text-sm text-muted-foreground">
                                    {carerSearchInput ? 'No carers match your search' : 'No carers available'}
                                  </div>
                                ) : (
                                  <div className="p-1">
                                    {filteredCarers.map((carer) => {
                                      const isSelected = field.value?.includes(carer.id);
                                      const isActive = carer.status === 'Active';
                                      const statusColor = isActive 
                                        ? 'bg-success text-white'
                                        : 'bg-warning text-white';
                                      
                                      return (
                                        <div
                                          key={carer.id}
                                          className="flex items-center justify-between space-x-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                          onClick={() => {
                                            const currentValue = field.value || [];
                                            if (isSelected) {
                                              field.onChange(currentValue.filter(id => id !== carer.id));
                                            } else {
                                              field.onChange([...currentValue, carer.id]);
                                            }
                                            // Reset validation
                                            setValidationResult(null);
                                          }}
                                        >
                                          <div className="flex items-center space-x-2 flex-1">
                                            <Checkbox
                                              checked={isSelected}
                                              className="pointer-events-none"
                                            />
                                            <span className="flex-1">{carer.name}</span>
                                          </div>
                                          <Badge 
                                            variant={isActive ? "success" : "warning"} 
                                            className={cn("text-xs", statusColor)}
                                          >
                                            {carer.status || 'Active'}
                                          </Badge>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </ScrollArea>
                              {/* Selected count footer */}
                              {field.value?.length > 0 && (
                                <div className="p-2 border-t bg-muted/50">
                                  <div className="text-xs text-muted-foreground">
                                    {field.value.length} carer{field.value.length !== 1 ? 's' : ''} selected
                                  </div>
                                </div>
                              )}
                            </PopoverContent>
                          </Popover>
                          
                          {/* Selected carers display */}
                          {field.value && field.value.length > 0 && (
                            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                              {field.value.map((carerId) => {
                                const carer = carers.find(c => c.id === carerId);
                                const carerName = carer?.name || 'Not found';
                                
                                return (
                                  <Badge
                                    key={carerId}
                                    variant="secondary"
                                    className="text-xs px-2 py-1"
                                  >
                                    {carerName}
                                    <X 
                                      className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
                                      onClick={() => {
                                        const currentValue = field.value || [];
                                        field.onChange(currentValue.filter(id => id !== carerId));
                                      }}
                                    />
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                          
                          {/* Warning for non-active carers */}
                          {field.value && field.value.length > 0 && (
                            (() => {
                              const nonActiveCarers = field.value
                                .map(id => carers.find(c => c.id === id))
                                .filter(c => c && c.status !== 'Active');
                              
                              if (nonActiveCarers.length > 0) {
                                return (
                                  <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md text-sm mt-2">
                                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="font-medium text-yellow-800 dark:text-yellow-300">
                                        Unavailable Carer Selected
                                      </p>
                                      <p className="text-yellow-700 dark:text-yellow-400 text-xs mt-1">
                                        {nonActiveCarers.map(c => c.name).join(', ')} 
                                        {' '}is currently {nonActiveCarers[0]?.status}. 
                                        Consider selecting an active carer instead.
                                      </p>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()
                          )}
                        </div>
                      </FormControl>
                      
                      <FormMessage />
                      
                      {/* "Assign Later" Checkbox */}
                      <FormField
                        control={form.control}
                        name="assign_later"
                        render={({ field: assignLaterField }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-2">
                            <FormControl>
                              <Checkbox
                                checked={assignLaterField.value}
                                onCheckedChange={(checked) => {
                                  assignLaterField.onChange(checked);
                                  if (checked) {
                                    form.setValue('staff_ids', []);
                                  }
                                }}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-medium text-amber-700 dark:text-amber-400">
                                Assign carer later
                              </FormLabel>
                              <p className="text-xs text-muted-foreground">
                                Remove all assigned carers. You can assign them later.
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                    </FormItem>
                  )}
                />

                {/* Schedule Section - Date & Time Fields */}
                <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    Schedule
                  </h4>
                  
                  {/* Booking Date - Full width */}
                  <FormField
                    control={form.control}
                    name="booking_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col w-full">
                        <FormLabel className="font-medium">Booking Date</FormLabel>
                        <FormControl>
                          <EnhancedDatePicker
                            value={field.value}
                            onChange={(date) => {
                              field.onChange(date);
                              setValidationResult(null);
                            }}
                            placeholder="Select booking date"
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Time Fields - Responsive grid: stack on mobile, side by side on larger screens */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="start_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium">Start Time</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              className="w-full"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                setValidationResult(null);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="end_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium">End Time</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              className="w-full"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                setValidationResult(null);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Location Field */}
                <FormField
                  control={form.control}
                  name="location_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location
                      </FormLabel>
                      {clientAddresses.length === 0 ? (
                        <Input
                          placeholder="No addresses available"
                          disabled
                          value={field.value || ''}
                        />
                      ) : (
                        <Select value={field.value || ''} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            {/* Show current saved address if it doesn't match any client address */}
                            {field.value && !clientAddresses.some(addr => formatAddress(addr) === field.value) && (
                              <SelectItem value={field.value}>
                                Current: {field.value}
                              </SelectItem>
                            )}
                            {clientAddresses.map((addr) => (
                              <SelectItem key={addr.id} value={formatAddress(addr)}>
                                {addr.address_label || 'Address'}: {formatAddress(addr)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Information</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter any additional information or special requirements..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Manual Status Selection */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Booking Status
                        {field.value && (
                          <Badge 
                            variant="custom" 
                            className={cn(
                              "text-xs",
                              getBookingStatusColor(field.value, 'light')
                            )}
                          >
                            {getBookingStatusLabel(field.value)}
                          </Badge>
                        )}
                      </FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          // Intercept "cancelled" status to show cancellation dialog
                          if (value === 'cancelled') {
                            setPreviousStatus(field.value || booking?.status || 'assigned');
                            setShowCancellationDialog(true);
                          } else {
                            field.onChange(value);
                          }
                        }} 
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {BOOKING_STATUSES.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              <div className="flex items-center gap-2">
                                <Circle className={cn("h-2 w-2 fill-current", status.colorClass, "text-transparent")} />
                                <span>{status.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Manually override the booking status. Changes will sync across the entire system.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                </form>
              </Form>
            </div>
          </>

        {/* Overlap Alert Dialog */}
        <BookingOverlapAlert
          open={showOverlapAlert}
          onOpenChange={(open) => {
            setShowOverlapAlert(open);
            if (!open) {
              setFailedCarerName(null);
            }
          }}
          conflictingBookings={validationResult?.conflictingBookings || []}
          carerName={failedCarerName || "Unknown Carer"}
          proposedTime={`${form.getValues().start_time || ""} - ${form.getValues().end_time || ""}`}
          proposedDate={form.getValues().booking_date ? format(form.getValues().booking_date, 'yyyy-MM-dd') : ""}
          availableCarers={[]} // Not applicable for editing
          onChooseDifferentCarer={() => {
            setShowOverlapAlert(false);
            setFailedCarerName(null);
            // Clear current staff selection to prompt user to choose new carer
            form.setValue('staff_ids', []);
            // Reset validation state
            setValidationResult(null);
            toast.info("Please select a different carer from the dropdown above", {
              duration: 4000
            });
          }}
          onModifyTime={() => {
            setShowOverlapAlert(false);
            setFailedCarerName(null);
            // Reset validation state
            setValidationResult(null);
            toast.info("Adjust the start or end time to avoid conflicts with existing bookings", {
              duration: 4000
            });
          }}
        />

        {/* Advanced Cancellation Dialog */}
        <AdvancedCancellationDialog
          open={showCancellationDialog}
          onOpenChange={(open) => {
            setShowCancellationDialog(open);
            // If user closes without confirming, don't change status
          }}
          onConfirm={handleCancellationConfirm}
          bookingDetails={{
            clientName: booking?.clientName,
            carerName: booking?.carerName,
            date: booking?.date || (booking?.start_time ? format(new Date(booking.start_time), 'dd MMM yyyy') : undefined),
            time: booking?.startTime || (booking?.start_time ? format(new Date(booking.start_time), 'HH:mm') : undefined),
            staffId: booking?.carerId || booking?.staff_id,
            clientId: booking?.clientId || booking?.client_id,
            startTime: booking?.start_time,
            endTime: booking?.end_time,
          }}
          isLoading={isCancelling}
        />

        {/* Multi-Carer Delete Dialog */}
        <MultiCarerDeleteDialog
          open={showMultiCarerDeleteDialog}
          onOpenChange={setShowMultiCarerDeleteDialog}
          booking={{
            id: booking.id,
            clientName: booking.clientName || 'Unknown Client',
            start_time: booking.start_time,
            end_time: booking.end_time,
            date: booking.date,
          }}
          assignedCarers={relatedBookingRecords}
          onDeleteSingleCarer={handleDeleteSingleCarer}
          onDeleteAllCarers={handleDeleteAllCarers}
          onReassignCarer={handleReassignCarer}
          isDeleting={deleteBooking.isPending}
        />

        <DialogFooter className="flex-shrink-0 pt-4 border-t mt-4">
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            {canDelete && (
              <div className="flex justify-start w-full sm:w-auto">
                {/* For multi-carer bookings, use the multi-carer dialog */}
                {relatedBookingRecords.length > 1 ? (
                  <Button 
                    type="button" 
                    variant="danger" 
                    size="sm"
                    onClick={handleDeleteClick}
                  >
                    Delete Booking
                  </Button>
                ) : (
                  /* For single-carer bookings, use the simple AlertDialog */
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="danger" size="sm">
                        Delete Booking
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      {deleteBooking.isPending && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                            <p className="text-sm text-muted-foreground">Deleting booking...</p>
                          </div>
                        </div>
                      )}
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Booking</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this booking? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteBooking.isPending}>Cancel</AlertDialogCancel>
                        <Button
                          onClick={handleDelete}
                          disabled={deleteBooking.isPending}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {deleteBooking.isPending ? "Deleting..." : "Delete"}
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:ml-auto">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <>
                <Button 
                  type="button"
                  variant="outline"
                  disabled={isValidating}
                  onClick={validateCurrentBooking}
                  className="whitespace-nowrap"
                >
                  {isValidating ? "Validating..." : "Check for Conflicts"}
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateBooking.isPending || isValidating || (validationResult && !validationResult.isValid)}
                  onClick={form.handleSubmit(onSubmit)}
                  className="whitespace-nowrap"
                >
                  {updateBooking.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </>
            </div>
          </div>
        </DialogFooter>

        {/* Client Inactive Alert Dialog */}
        <AlertDialog open={clientActiveAlert?.show} onOpenChange={() => setClientActiveAlert(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Booking Not Allowed
              </AlertDialogTitle>
              <AlertDialogDescription className="whitespace-pre-line">
                {clientActiveAlert?.message}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setClientActiveAlert(null)}>
                OK
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
