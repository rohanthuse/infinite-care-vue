
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient, useIsFetching } from "@tanstack/react-query";
import { Booking } from "../BookingTimeGrid";
import { useCreateMultipleBookings } from "@/data/hooks/useCreateMultipleBookings";
import { useUpdateBooking } from "@/data/hooks/useUpdateBooking";
import { useBookingOverlapCheck } from "./useBookingOverlapCheck";
import { useRealTimeOverlapCheck } from "./useRealTimeOverlapCheck";
import { createBookingDateTime } from "../utils/dateUtils";
import { useEnhancedOverlapValidation } from "./useEnhancedOverlapValidation";
import { generateRecurringBookings, previewRecurringBookings } from "../utils/recurringBookingLogic";
import { validateBookingFormData } from "../utils/bookingValidation";

export function useBookingHandlers(branchId?: string, user?: any) {
  const [newBookingDialogOpen, setNewBookingDialogOpen] = useState(false);
  const [editBookingDialogOpen, setEditBookingDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [newBookingData, setNewBookingData] = useState<{
    date: Date;
    startTime: string;
    endTime?: string;
    clientId?: string;
    carerId?: string;
  } | null>(null);
  const [overlapAlertOpen, setOverlapAlertOpen] = useState(false);
  const [overlapData, setOverlapData] = useState<any>(null);
  const [pendingBookingData, setPendingBookingData] = useState<any>(null);
  
  // Add state for update overlaps
  const [updateOverlapAlertOpen, setUpdateOverlapAlertOpen] = useState(false);
  const [updateOverlapData, setUpdateOverlapData] = useState<any>(null);
  const [pendingUpdateData, setPendingUpdateData] = useState<any>(null);
  const [isValidatingUpdate, setIsValidatingUpdate] = useState(false);

  const queryClient = useQueryClient();
  const isRefreshing = useIsFetching({
    predicate: (query) => {
      const queryKey = query.queryKey;
      return (queryKey[0] === "branch-bookings" || 
              queryKey[0] === "branch-carers" || 
              queryKey[0] === "branch-clients") && 
              queryKey[1] === branchId;
    }
  }) > 0;

  const createMultipleBookingsMutation = useCreateMultipleBookings(branchId);
  const updateBookingMutation = useUpdateBooking(branchId);
  const { checkOverlap, findAvailableCarers } = useBookingOverlapCheck(branchId);
  const { checkOverlapRealTime, isChecking } = useRealTimeOverlapCheck(branchId);
  const { validateBooking, isValidating: isEnhancedValidating } = useEnhancedOverlapValidation(branchId);

  const handleRefresh = async () => {
    if (!branchId) {
      toast.error("Branch ID is required for refresh");
      return;
    }

    try {
      toast.info("Refreshing bookings data...", {
        duration: 1000
      });

      // Invalidate and refetch all booking-related queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["branch-bookings", branchId] }),
        queryClient.invalidateQueries({ queryKey: ["branch-carers", branchId] }),
        queryClient.invalidateQueries({ 
          predicate: (query) => {
            const queryKey = query.queryKey;
            return queryKey[0] === "branch-clients" && 
                   (queryKey.length > 1 && queryKey[1] && 
                    typeof queryKey[1] === 'object' && 
                    'branchId' in queryKey[1] && 
                    (queryKey[1] as any).branchId === branchId);
          }
        })
      ]);

      toast.success("Data refreshed successfully!");
    } catch (error) {
      console.error("Failed to refresh data:", error);
      toast.error("Failed to refresh data. Please try again.");
    }
  };

  const handleNewBooking = () => {
    setNewBookingData(null);
    setNewBookingDialogOpen(true);
  };

  const handleEditBooking = (booking: Booking) => {
    console.log("[useBookingHandlers] Opening edit dialog for booking:", booking.id);
    setSelectedBooking(booking);
    setEditBookingDialogOpen(true);
  };

  const handleContextMenuBooking = (date: Date, time: string, clientId?: string, carerId?: string) => {
    // Calculate end time (1 hour after start time)
    const [hour, minutes] = time.split(':').map(Number);
    const endHour = (hour + 1) % 24;
    const endTime = `${String(endHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    
    setNewBookingData({
      date,
      startTime: time,
      endTime,
      clientId,
      carerId
    });
    setNewBookingDialogOpen(true);
  };

  const handleUpdateBooking = async (bookingToUpdate: Booking & {notes?: string}, carers: any[] = []) => {
    console.log("[useBookingHandlers] === ENHANCED UPDATE BOOKING START ===");
    console.log("[useBookingHandlers] Updating booking:", {
      bookingId: bookingToUpdate.id,
      carerId: bookingToUpdate.carerId,
      startTime: bookingToUpdate.startTime,
      endTime: bookingToUpdate.endTime,
      date: bookingToUpdate.date
    });

    if (!bookingToUpdate.id) {
      console.log("[useBookingHandlers] ERROR: Cannot update booking without an ID");
      toast.error("Cannot update booking without an ID.");
      return;
    }

    setIsValidatingUpdate(true);

    try {
      // Check if schedule has changed
      const hasChangedSchedule = selectedBooking && (
        bookingToUpdate.carerId !== selectedBooking.carerId ||
        bookingToUpdate.startTime !== selectedBooking.startTime ||
        bookingToUpdate.endTime !== selectedBooking.endTime ||
        bookingToUpdate.date !== selectedBooking.date
      );

      if (hasChangedSchedule && bookingToUpdate.carerId) {
        console.log("[useBookingHandlers] SCHEDULE CHANGED - PERFORMING ENHANCED VALIDATION");
        console.log("[useBookingHandlers] Branch context:", { branchId });
        
        // Use enhanced validation
        const validation = await validateBooking(
          bookingToUpdate.carerId,
          bookingToUpdate.startTime,
          bookingToUpdate.endTime,
          bookingToUpdate.date,
          bookingToUpdate.id
        );

        if (!validation.isValid) {
          console.log("[useBookingHandlers] ENHANCED VALIDATION FAILED");
          
          const selectedCarer = carers.find(c => c.id === bookingToUpdate.carerId);
          const availableCarers = findAvailableCarers(
            carers,
            bookingToUpdate.startTime,
            bookingToUpdate.endTime,
            bookingToUpdate.date,
            bookingToUpdate.id
          );

          setUpdateOverlapData({
            conflictingBookings: validation.conflictingBookings || [],
            carerName: selectedCarer?.name || bookingToUpdate.carerName,
            proposedTime: `${bookingToUpdate.startTime} - ${bookingToUpdate.endTime}`,
            proposedDate: bookingToUpdate.date,
            availableCarers,
          });
          setPendingUpdateData(bookingToUpdate);
          setUpdateOverlapAlertOpen(true);
          
          const carerName = carers.find(c => c.id === bookingToUpdate.carerId)?.name || "This carer";
          toast.error(`${carerName} Unavailable`, {
            description: validation.error || "The selected carer has a conflicting appointment at the new time",
            duration: 5000,
            action: {
              label: "Choose Different Carer",
              onClick: () => setUpdateOverlapAlertOpen(true)
            }
          });
          
          return;
        }
      }

      // Proceed with update if validation passes
      proceedWithBookingUpdate(bookingToUpdate);
      
    } catch (error) {
      console.error("[useBookingHandlers] CRITICAL ERROR during enhanced validation:", error);
      toast.error("Failed to validate booking conflicts. Please try again.", {
        description: error instanceof Error ? error.message : "Unknown validation error"
      });
      return;
    } finally {
      setIsValidatingUpdate(false);
    }
  };

  const proceedWithBookingUpdate = (bookingToUpdate: Booking & {notes?: string}) => {
    console.log("[useBookingHandlers] Proceeding with booking update:", bookingToUpdate.id);
    
    const payload: any = {
      client_id: bookingToUpdate.clientId,
      staff_id: bookingToUpdate.carerId,
      status: bookingToUpdate.status,
    };
    
    if (bookingToUpdate.date && bookingToUpdate.startTime) {
        payload.start_time = createBookingDateTime(bookingToUpdate.date, bookingToUpdate.startTime);
    }
    if (bookingToUpdate.date && bookingToUpdate.endTime) {
        payload.end_time = createBookingDateTime(bookingToUpdate.date, bookingToUpdate.endTime);
    }

    updateBookingMutation.mutate({ bookingId: bookingToUpdate.id, updatedData: payload }, {
        onSuccess: () => {
            if (editBookingDialogOpen) {
                setEditBookingDialogOpen(false);
            }
            toast.success("Booking updated successfully", {
              description: "Calendar will refresh automatically"
            });
        },
        onError: (error: any) => {
            console.error("[useBookingHandlers] Failed to update booking:", error);
            
            // Handle database constraint errors
            if (error?.message?.includes('Booking conflict detected')) {
              toast.error("Database Blocked Save", {
                description: "The database detected a booking conflict. This is an additional safety check."
              });
            } else {
              toast.error("Failed to update booking", {
                  description: error?.message || "Please try again"
              });
            }
        }
    });
  };

  const checkForOverlapsAndCreate = (bookingData: any, carers: any[]) => {
    console.log("[useBookingHandlers] Starting overlap check and creation process");
    
    // Enhanced validation first
    const validation = validateBookingFormData(bookingData);
    if (!validation.isValid) {
      validation.errors.forEach(error => {
        toast.error("Booking Validation Failed", { description: error });
      });
      return;
    }

    // Show warnings but don't stop creation
    validation.warnings.forEach(warning => {
      toast.warning("Booking Warning", { description: warning });
    });

    // If no carer selected, proceed directly to creation (unassigned booking)
    if (!bookingData.carerId) {
      console.log("[useBookingHandlers] No carer selected, proceeding with unassigned booking");
      proceedWithBookingCreation(bookingData);
      return;
    }

    // Check for overlaps in the first schedule only (for efficiency)
    const firstSchedule = bookingData.schedules[0];
    if (!firstSchedule) {
      toast.error("No schedule data found");
      return;
    }

    // Preview the bookings to find the first occurrence for overlap checking
    const preview = previewRecurringBookings(bookingData, branchId || '');
    if (preview.errors.length > 0) {
      preview.errors.forEach(error => {
        toast.error("Preview Generation Failed", { description: error });
      });
      return;
    }

    if (preview.dates.length === 0) {
      toast.error("No valid booking dates found in the selected range");
      return;
    }

    const firstBookingDate = preview.dates[0];
    console.log("[useBookingHandlers] Checking overlap for first booking date:", firstBookingDate);

    const overlap = checkOverlap(
      bookingData.carerId,
      firstSchedule.startTime,
      firstSchedule.endTime,
      firstBookingDate
    );

    if (overlap.hasOverlap) {
      const selectedCarer = carers.find(c => c.id === bookingData.carerId);
      const carerName = selectedCarer?.name || "Unknown Carer";
      const availableCarers = findAvailableCarers(
        carers,
        firstSchedule.startTime,
        firstSchedule.endTime,
        firstBookingDate
      );

      toast.error(`${carerName} Already Assigned`, {
        description: `This carer has ${overlap.conflictingBookings.length} conflicting appointment${overlap.conflictingBookings.length > 1 ? 's' : ''} at the selected time`,
        duration: 5000,
        action: {
          label: "View Alternatives",
          onClick: () => setOverlapAlertOpen(true)
        }
      });

      setOverlapData({
        conflictingBookings: overlap.conflictingBookings,
        carerName,
        proposedTime: `${firstSchedule.startTime} - ${firstSchedule.endTime}`,
        proposedDate: firstBookingDate,
        availableCarers,
      });
      setPendingBookingData(bookingData);
      setOverlapAlertOpen(true);
    } else {
      proceedWithBookingCreation(bookingData);
    }
  };

  const proceedWithBookingCreation = (bookingData: any) => {
    console.log("[useBookingHandlers] Starting enhanced booking creation process");
    
    if (!user) {
      toast.error("You must be logged in to create bookings");
      return;
    }
    if (!branchId) {
      toast.error("Branch ID is required");
      return;
    }

    // Use the enhanced recurring booking logic
    const result = generateRecurringBookings(bookingData, branchId);
    
    if (!result.success) {
      console.error("[useBookingHandlers] Booking generation failed:", result.errors);
      result.errors.forEach(error => {
        toast.error("Booking Generation Failed", { description: error });
      });
      return;
    }

    // Show warnings but continue
    result.warnings.forEach(warning => {
      toast.warning("Booking Warning", { description: warning });
    });

    if (result.bookings.length === 0) {
      toast.error("No valid bookings could be generated from the selected criteria");
      return;
    }

    // Show creation summary
    const { summary } = result;
    const dayNames = summary.selectedDays.map(d => 
      ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]
    ).join(', ');

    console.log("[useBookingHandlers] Creating bookings:", {
      total: result.bookings.length,
      dateRange: summary.dateRange,
      selectedDays: dayNames,
      recurrenceWeeks: summary.recurrenceWeeks
    });

    toast.info("Creating Bookings...", {
      description: `Generating ${result.bookings.length} bookings for ${dayNames} from ${summary.dateRange.start} to ${summary.dateRange.end}`,
      duration: 3000
    });

    createMultipleBookingsMutation.mutate(result.bookings, {
      onError: (error: any) => {
        console.error("[useBookingHandlers] Booking creation error:", error);
        if (error.message?.includes("row-level security")) {
          toast.error("Access denied. You may not be authorized for this branch.", {
            description: "Contact your administrator or create an admin user for this branch.",
          });
        } else {
          toast.error("Failed to create bookings", {
            description: error?.message || "Unknown error on booking creation. Please check all fields.",
          });
        }
      },
      onSuccess: (data: any) => {
        console.log("[useBookingHandlers] ✅ Bookings created successfully:", data);
        
        // Enhanced success message with details
        const actualCount = data?.length || result.bookings.length;
        const preview = previewRecurringBookings(bookingData, branchId);
        
        let successDescription = `Created ${actualCount} bookings successfully!`;
        if (preview.dayBreakdown.length > 0) {
          const breakdown = preview.dayBreakdown
            .map(d => `${d.day}: ${d.dates.length}`)
            .join(', ');
          successDescription += ` (${breakdown})`;
        }

        toast.success("Bookings Created Successfully! ✅", {
          description: successDescription,
          duration: 5000
        });
        
        setNewBookingDialogOpen(false);
        createMultipleBookingsMutation.reset();
      },
    });
  };

  const handleCreateBooking = (bookingData: any, carers: any[] = []) => {
    checkForOverlapsAndCreate(bookingData, carers);
  };

  const handleOverlapChooseDifferentCarer = () => {
    setOverlapAlertOpen(false);
    // Keep the dialog open to allow carer selection
  };

  const handleOverlapModifyTime = () => {
    setOverlapAlertOpen(false);
    // Keep the dialog open to allow time modification
  };

  const handleOverlapForceCreate = () => {
    if (pendingBookingData) {
      proceedWithBookingCreation(pendingBookingData);
    }
    setOverlapAlertOpen(false);
    setPendingBookingData(null);
    setOverlapData(null);
  };

  // Add handlers for update overlaps
  const handleUpdateOverlapChooseDifferentCarer = () => {
    setUpdateOverlapAlertOpen(false);
    // Keep the edit dialog open to allow carer selection
  };

  const handleUpdateOverlapModifyTime = () => {
    setUpdateOverlapAlertOpen(false);
    // Keep the edit dialog open to allow time modification
  };

  const handleUpdateOverlapForceUpdate = () => {
    console.log("[useBookingHandlers] FORCE UPDATE REQUESTED - This should be rare!");
    if (pendingUpdateData) {
      proceedWithBookingUpdate(pendingUpdateData);
    }
    setUpdateOverlapAlertOpen(false);
    setPendingUpdateData(null);
    setUpdateOverlapData(null);
  };

  const isCheckingOverlap = isChecking || isValidatingUpdate || isEnhancedValidating;

  return {
    newBookingDialogOpen,
    setNewBookingDialogOpen,
    editBookingDialogOpen,
    setEditBookingDialogOpen,
    selectedBooking,
    newBookingData,
    overlapAlertOpen,
    setOverlapAlertOpen,
    overlapData,
    updateOverlapAlertOpen,
    setUpdateOverlapAlertOpen,
    updateOverlapData,
    isCheckingOverlap,
    isRefreshing,
    handleRefresh,
    handleNewBooking,
    handleEditBooking,
    handleContextMenuBooking,
    handleUpdateBooking,
    handleCreateBooking,
    handleOverlapChooseDifferentCarer,
    handleOverlapModifyTime,
    handleOverlapForceCreate,
    handleUpdateOverlapChooseDifferentCarer,
    handleUpdateOverlapModifyTime,
    handleUpdateOverlapForceUpdate,
    createMultipleBookingsMutation,
    updateBookingMutation
  };
}
