
import React, { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, Save, X, AlertCircle, CheckCircle } from "lucide-react";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useUpdateBooking } from "@/data/hooks/useUpdateBooking";
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
  service_id: z.string().optional(),
  staff_id: z.string().optional().refine(
    (val) => !val || val === "UNASSIGNED" || val.length > 0,
    "Invalid staff selection"
  ),
  notes: z.string().optional(),
});

type EditBookingFormData = z.infer<typeof editBookingSchema>;

interface EditBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any;
  services: Array<{ id: string; title: string }>;
  branchId?: string;
  carers?: Array<{ id: string; name: string }>;
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
  
  // Consolidated validation system
  const { validateBooking, isValidating } = useConsolidatedValidation(branchId);
  
  // Validation states
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    error?: string;
    conflictingBookings: any[];
  } | null>(null);
  const [showOverlapAlert, setShowOverlapAlert] = useState(false);

  const form = useForm<EditBookingFormData>({
    resolver: zodResolver(editBookingSchema),
    defaultValues: {
      start_time: "",
      end_time: "",
      service_id: "",
      staff_id: "UNASSIGNED",
      notes: "",
    },
  });

  // Check if user can delete bookings (admins only)
  const canDelete = userRole?.role && ['super_admin', 'branch_admin'].includes(userRole.role);

  // Calculate predicted status based on staff_id selection
  const predictedStatus = useMemo(() => {
    const selectedStaffId = form.watch('staff_id');
    return (selectedStaffId && selectedStaffId !== "UNASSIGNED") ? 'assigned' : 'unassigned';
  }, [form.watch('staff_id')]);

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

  // Update form when booking changes and reset validation state
  useEffect(() => {
    if (booking && booking.id && open) {
      const startStr = toLocalInput(booking.start_time);
      const endStr = toLocalInput(booking.end_time);
      
      // Only set values if we have valid data
      if (startStr) form.setValue("start_time", startStr);
      if (endStr) form.setValue("end_time", endStr);
      form.setValue("service_id", booking.service_id || "");
      form.setValue("staff_id", booking.carerId || booking.staff_id || "UNASSIGNED");
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
      return true; // Skip validation if times are not set/invalid yet
    }

    const date = format(startDateTime, "yyyy-MM-dd");
    const startTime = format(startDateTime, "HH:mm");
    const endTime = format(endDateTime, "HH:mm");

    const selectedCarerId = form.getValues('staff_id');
    if (!selectedCarerId || selectedCarerId === "UNASSIGNED") {
      return true; // No carer assigned; skip overlap validation
    }
    
    const carerId = selectedCarerId;
    
    console.log("[EditBookingDialog] Validating booking:", {
      carerId,
      date,
      startTime,
      endTime,
      excludeBookingId: booking.id
    });
    
    const result = await validateBooking(
      carerId,
      startTime,
      endTime,
      date,
      booking.id // Exclude current booking from validation
    );
    
    setValidationResult(result);
    
    if (!result.isValid && result.conflictingBookings.length > 0) {
      setShowOverlapAlert(true);
      return false;
    }
    
    return result.isValid;
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
      await updateBooking.mutateAsync({
        bookingId: booking.id,
        updatedData: {
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          service_id: data.service_id,
          staff_id: (data.staff_id && data.staff_id !== "UNASSIGNED") ? data.staff_id : null,
          status: (data.staff_id && data.staff_id !== "UNASSIGNED") ? 'assigned' : 'unassigned',
          notes: data.notes,
        },
      });
      
      if (onSuccess) {
        onSuccess(booking.id);
      } else {
        onOpenChange(false);
        toast.success("Appointment updated successfully");
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("Failed to update appointment");
    }
  };

  // Check if appointment has already started
  const hasStarted = (() => {
    if (!booking?.start_time) return false;
    const d = new Date(booking.start_time);
    return isValidDate(d) && d <= new Date();
  })();

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
            Modify the appointment details. Changes can only be made before the appointment starts.
          </DialogDescription>
        </DialogHeader>

        {hasStarted ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              This appointment has already started and cannot be edited.
            </p>
          </div>
        ) : (
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
                  name="staff_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Assigned Carer
                        {field.value && field.value !== "UNASSIGNED" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Will be assigned
                          </span>
                        )}
                        {(!field.value || field.value === "UNASSIGNED") && currentStatus === 'assigned' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Will be unassigned
                          </span>
                        )}
                      </FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Reset validation when carer changes
                          setValidationResult(null);
                        }} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a carer (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="UNASSIGNED">No carer (unassigned)</SelectItem>
                          {carers.map((carer) => (
                            <SelectItem key={carer.id} value={carer.id}>
                              {carer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
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
        )}

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
            {canDelete && !hasStarted && (
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
              {!hasStarted && (
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
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
