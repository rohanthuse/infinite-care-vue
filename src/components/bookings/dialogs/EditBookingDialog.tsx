
import React, { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, Save, X, AlertCircle, CheckCircle, ChevronDown } from "lucide-react";
import { useConsolidatedValidation } from "../hooks/useConsolidatedValidation";
import { BookingValidationAlert } from "../BookingValidationAlert";
import { BookingOverlapAlert } from "../BookingOverlapAlert";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useUpdateBooking } from "@/data/hooks/useUpdateBooking";
import { useDeleteBooking } from "@/data/hooks/useDeleteBooking";
import { useUserRole } from "@/hooks/useUserRole";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

const toLocalInput = (value?: string | Date) => {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return "";
  try {
    return format(d, "yyyy-MM-dd'T'HH:mm");
  } catch {
    return "";
  }
};

const isValidDate = (d: Date) => !isNaN(d.getTime());

const editBookingSchema = z.object({
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  service_id: z.string().optional().transform(val => val === "" ? undefined : val),
  staff_ids: z.array(z.string()).optional(),
  assign_later: z.boolean().optional(),
  notes: z.string().optional(),
});

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
  
  // Consolidated validation system
  const { validateBooking, isValidating } = useConsolidatedValidation(branchId);
  
  // Validation states
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    error?: string;
    conflictingBookings: any[];
  } | null>(null);
  const [showOverlapAlert, setShowOverlapAlert] = useState(false);
  
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

  const form = useForm<EditBookingFormData>({
    resolver: zodResolver(editBookingSchema),
    defaultValues: {
      start_time: "",
      end_time: "",
      service_id: "",
      staff_ids: [],
      assign_later: false,
      notes: "",
    },
  });

  // Check if user can delete bookings (admins only)
  const canDelete = userRole?.role && ['super_admin', 'branch_admin'].includes(userRole.role);

  // Calculate predicted status based on staff_ids selection
  const predictedStatus = useMemo(() => {
    const selectedStaffIds = form.watch('staff_ids') || [];
    const assignLater = form.watch('assign_later');
    
    if (assignLater) return 'unassigned';
    return selectedStaffIds.length > 0 ? 'assigned' : 'unassigned';
  }, [form.watch('staff_ids'), form.watch('assign_later')]);

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

  // Fetch all booking records for this appointment (multiple staff)
  useEffect(() => {
    const fetchRelatedBookings = async () => {
      if (!open || !booking?.id) return;
      
      console.log('[EditBookingDialog] Fetching related booking records');
      
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
          .eq('client_id', booking.clientId || booking.client_id)
          .eq('branch_id', booking.branch_id)
          .eq('start_time', booking.start_time)
          .eq('end_time', booking.end_time);
        
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
  }, [open, booking?.id, booking?.start_time, booking?.end_time, booking?.service_id]);
  
  // Update form when booking changes and reset validation state
  useEffect(() => {
    if (booking && booking.id && open) {
      const startStr = toLocalInput(booking.start_time);
      const endStr = toLocalInput(booking.end_time);
      
      // Only set values if we have valid data
      if (startStr) form.setValue("start_time", startStr);
      if (endStr) form.setValue("end_time", endStr);
      form.setValue("service_id", booking.service_id || "");
      form.setValue("notes", booking.notes || "");
      
      // Reset validation state when dialog opens
      setValidationResult(null);
      setShowOverlapAlert(false);
    }
  }, [booking, open, form]);

  // Validate booking when time fields change
  const validateCurrentBooking = async () => {
    if (!booking) return true;
    
    const formValues = form.getValues();
    const startDateTime = new Date(formValues.start_time);
    const endDateTime = new Date(formValues.end_time);

    if (!isValidDate(startDateTime) || !isValidDate(endDateTime)) {
      return true;
    }

    const date = format(startDateTime, "yyyy-MM-dd");
    const startTime = format(startDateTime, "HH:mm");
    const endTime = format(endDateTime, "HH:mm");

    const selectedStaffIds = formValues.staff_ids || [];
    
    // Skip validation if no staff or "assign later"
    if (selectedStaffIds.length === 0 || formValues.assign_later) {
      return true;
    }
    
    // Validate each selected staff for overlaps
    let hasOverlap = false;
    let allConflictingBookings: any[] = [];
    
    for (const staffId of selectedStaffIds) {
      console.log("[EditBookingDialog] Validating for staff:", staffId);
      
      const result = await validateBooking(
        staffId,
        startTime,
        endTime,
        date,
        booking.id
      );
      
      if (!result.isValid && result.conflictingBookings.length > 0) {
        hasOverlap = true;
        allConflictingBookings = [
          ...allConflictingBookings,
          ...result.conflictingBookings
        ];
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
    
    setValidationResult({ isValid: true, conflictingBookings: [] });
    return true;
  };

  const onSubmit = async (data: EditBookingFormData) => {
    // Validate before submitting
    const isValidBooking = await validateCurrentBooking();
    if (!isValidBooking) {
      console.log("[EditBookingDialog] Validation failed, not submitting");
      return;
    }

    const start = new Date(data.start_time);
    const end = new Date(data.end_time);
    if (!isValidDate(start) || !isValidDate(end)) {
      toast.error("Please provide valid start and end times");
      return;
    }
    
    try {
      const newStaffIds = data.staff_ids || [];
      
      // Calculate diff: which staff to add, remove, keep
      const staffToAdd = newStaffIds.filter(id => !originalStaffIds.includes(id));
      const staffToRemove = originalStaffIds.filter(id => !newStaffIds.includes(id));
      const staffToKeep = originalStaffIds.filter(id => newStaffIds.includes(id));
      
      console.log('[EditBookingDialog] Staff changes:', {
        add: staffToAdd,
        remove: staffToRemove,
        keep: staffToKeep
      });
      
      // Common booking data
      const commonUpdates = {
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        service_id: data.service_id || null,
        notes: data.notes,
        status: newStaffIds.length > 0 ? 'assigned' : 'unassigned',
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
          service_id: data.service_id || null,
          status: 'assigned',
          notes: data.notes,
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
        
        // Create one unassigned booking
        const { error } = await supabase.from('bookings').insert({
          branch_id: booking.branch_id,
          client_id: booking.clientId || booking.client_id,
          staff_id: null,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          service_id: data.service_id || null,
          status: 'unassigned',
          notes: data.notes,
        });
        
        if (error) throw error;
      }
      
      // Success message
      const carerCount = newStaffIds.length;
      const message = carerCount > 1 
        ? `Booking updated with ${carerCount} carers assigned`
        : "Appointment updated successfully";
      
      toast.success(message);
      
      // Invalidate queries to refresh UI
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
                  name="service_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a service" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                          <Popover>
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
                            <PopoverContent className="w-[320px] p-0" align="start">
                              <div className="p-2 border-b flex items-center justify-between">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const allIds = carers.map(c => c.id);
                                    field.onChange(allIds);
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
                              <div className="max-h-60 overflow-y-auto pointer-events-auto">
                                {carers.length === 0 ? (
                                  <div className="p-4 text-center text-sm text-muted-foreground">
                                    No carers available
                                  </div>
                                ) : (
                                  <div className="p-1">
                                    {carers.map((carer) => {
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
                              </div>
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              // Reset validation when time changes
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
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              // Reset validation when time changes
                              setValidationResult(null);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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

                </form>
              </Form>
            </div>
          </>

        {/* Overlap Alert Dialog */}
        <BookingOverlapAlert
          open={showOverlapAlert}
          onOpenChange={setShowOverlapAlert}
          conflictingBookings={validationResult?.conflictingBookings || []}
          carerName={booking?.carerName || "Unknown Carer"}
          proposedTime={(form.getValues().start_time && isValidDate(new Date(form.getValues().start_time))) ? format(new Date(form.getValues().start_time), "HH:mm") : ""}
          proposedDate={(form.getValues().start_time && isValidDate(new Date(form.getValues().start_time))) ? format(new Date(form.getValues().start_time), "yyyy-MM-dd") : ""}
          availableCarers={[]} // Not applicable for editing
          onChooseDifferentCarer={() => {
            setShowOverlapAlert(false);
            toast.info("Please contact an administrator to assign a different carer");
          }}
          onModifyTime={() => {
            setShowOverlapAlert(false);
            toast.info("Please adjust the appointment times to avoid conflicts");
          }}
        />

        <DialogFooter className="flex-shrink-0 pt-4 border-t mt-4">
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            {canDelete && (
              <div className="flex justify-start w-full sm:w-auto">
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
      </DialogContent>
    </Dialog>
  );
}
