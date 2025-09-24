
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient, useIsFetching } from "@tanstack/react-query";
import { format } from "date-fns";
import { Booking } from "../BookingTimeGrid";
import { useCreateMultipleBookings } from "@/data/hooks/useCreateMultipleBookings";
import { useCreateBooking } from "@/data/hooks/useCreateBooking";
import { useUpdateBooking } from "@/data/hooks/useUpdateBooking";
import { useBookingOverlapCheck } from "./useBookingOverlapCheck";
import { useRealTimeOverlapCheck } from "./useRealTimeOverlapCheck";
import { createBookingDateTime, formatDateForBooking } from "../utils/dateUtils";
import { useConsolidatedValidation } from "./useConsolidatedValidation";
import { generateRecurringBookings, previewRecurringBookings } from "../utils/recurringBookingLogic";
import { validateBookingFormData } from "../utils/bookingValidation";
import { useBookingVerification } from "./useBookingVerification";
import { useBookingDateNavigation } from "./useBookingDateNavigation";

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
  const createBookingMutation = useCreateBooking(branchId);
  const updateBookingMutation = useUpdateBooking(branchId);
  const { checkOverlap, findAvailableCarers } = useBookingOverlapCheck(branchId);
  const { checkOverlapRealTime, isChecking } = useRealTimeOverlapCheck(branchId);
  const { validateBooking, isValidating: isEnhancedValidating } = useConsolidatedValidation(branchId);
  const { isVerifying, verifyBookingsAppear, forceRefresh } = useBookingVerification({ branchId });
  const { navigateToBookingDate } = useBookingDateNavigation();

  const handleRefresh = async () => {
    if (!branchId) {
      toast.error("Branch ID is required for refresh");
      return;
    }

    // Clear validation cache to prevent false conflicts
    console.log("[useBookingHandlers] Clearing validation cache for branch:", branchId);
    queryClient.invalidateQueries({ queryKey: ["branch-bookings", branchId] });
    queryClient.invalidateQueries({ queryKey: ["bookings"] });
    queryClient.removeQueries({ queryKey: ["booking-validation"] });
    queryClient.removeQueries({ queryKey: ["overlap-check"] });

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
        console.log("[useBookingHandlers] SCHEDULE CHANGED - PERFORMING CONSOLIDATED VALIDATION");
        console.log("[useBookingHandlers] Branch context:", { branchId });
        console.log("[useBookingHandlers] Validation parameters:", {
          carerId: bookingToUpdate.carerId,
          startTime: bookingToUpdate.startTime,
          endTime: bookingToUpdate.endTime,
          date: bookingToUpdate.date,
          excludeBookingId: bookingToUpdate.id
        });

        // Clear any stale validation data before new validation
        queryClient.removeQueries({ queryKey: ["booking-validation"] });
        
        // Use consolidated validation (the single source of truth)
        const validation = await validateBooking(
          bookingToUpdate.carerId,
          bookingToUpdate.startTime,
          bookingToUpdate.endTime,
          bookingToUpdate.date,
          bookingToUpdate.id
        );

        if (!validation.isValid) {
          console.log("[useBookingHandlers] CONSOLIDATED VALIDATION FAILED");
          console.log("[useBookingHandlers] Validation error:", validation.error);
          console.log("[useBookingHandlers] Conflicting bookings:", validation.conflictingBookings);
          
          const selectedCarer = carers.find(c => c.id === bookingToUpdate.carerId);
          
          // Use available carers from validation result if available
          const availableCarers = validation.availableCarers || findAvailableCarers(
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

  const proceedWithSingleBookingCreation = (bookingData: any) => {
    console.log("[useBookingHandlers] Creating single booking");
    console.log("[useBookingHandlers] Single booking data:", JSON.stringify(bookingData, null, 2));
    
    if (!user) {
      toast.error("You must be logged in to create bookings");
      return;
    }
    if (!branchId) {
      toast.error("Branch ID is required");
      return;
    }

    const schedule = bookingData.schedules[0];
    if (!schedule) {
      toast.error("No schedule data found");
      return;
    }

    // Create single booking directly without recurring logic
    console.log("[useBookingHandlers] Original fromDate from form data:", bookingData.fromDate);
    console.log("[useBookingHandlers] Original fromDate type:", typeof bookingData.fromDate);
    console.log("[useBookingHandlers] Original fromDate toString:", bookingData.fromDate?.toString());
    
    const bookingDateStr = formatDateForBooking(bookingData.fromDate);
    console.log("[useBookingHandlers] Formatted booking date string:", bookingDateStr);
    
    const singleBooking = {
      branch_id: branchId,
      client_id: bookingData.clientId,
      staff_id: bookingData.carerId || null,
      start_time: createBookingDateTime(bookingDateStr, schedule.startTime),
      end_time: createBookingDateTime(bookingDateStr, schedule.endTime),
      service_id: schedule.services[0],
      status: bookingData.carerId ? "assigned" : "unassigned",
      notes: bookingData.notes || null,
    };
    
    console.log("[useBookingHandlers] Final booking object with start_time:", singleBooking.start_time);
    console.log("[useBookingHandlers] Final booking object with end_time:", singleBooking.end_time);

    console.log("[useBookingHandlers] Creating single booking:", singleBooking);

    toast.info("Creating Single Booking...", {
      description: `Creating booking for ${format(bookingData.fromDate, "PPP")}`,
      duration: 2000
    });

    // Use the single booking creation hook
    createBookingMutation.mutateAsync(singleBooking).then((createdBooking) => {
      console.log("[useBookingHandlers] ✅ Single booking created successfully:", createdBooking);
      
      setNewBookingDialogOpen(false);
      
      toast.success("Single Booking Created! ✅", {
        description: `Booking created for ${format(bookingData.fromDate, "PPP")} at ${schedule.startTime}-${schedule.endTime}`,
        duration: 3000
      });

      // Navigate to the booking date
      const navigationDateStr = formatDateForBooking(bookingData.fromDate);
      navigateToBookingDate(navigationDateStr, createdBooking.id);

      // Verify booking appears
      setTimeout(() => {
        verifyBookingsAppear([createdBooking.id]);
      }, 500);
    }).catch((error) => {
      console.error("[useBookingHandlers] Single booking creation error:", error);
      if (error.message?.includes("row-level security")) {
        toast.error("Access denied. You may not be authorized for this branch.", {
          description: "Contact your administrator or create an admin user for this branch.",
        });
      } else {
        toast.error("Failed to create single booking", {
          description: error?.message || "Unknown error on booking creation. Please check all fields.",
        });
      }
    });
  };

  const proceedWithBookingCreation = (bookingData: any) => {
    console.log("[useBookingHandlers] Starting enhanced booking creation process");
    console.log("[useBookingHandlers] Raw booking data received:", JSON.stringify(bookingData, null, 2));
    
    // Check if this is a single booking
    if (bookingData.bookingMode === "single") {
      return proceedWithSingleBookingCreation(bookingData);
    }
    
    if (!user) {
      toast.error("You must be logged in to create bookings");
      return;
    }
    if (!branchId) {
      toast.error("Branch ID is required");
      return;
    }

    // CRITICAL FIX: Transform flat day structure to nested structure
    const transformedBookingData = {
      ...bookingData,
      schedules: bookingData.schedules.map((schedule: any, index: number) => {
        // Check if days are already nested (correct format) or flat (needs transformation)
        if (schedule.days) {
          console.log(`[useBookingHandlers] Schedule ${index + 1} already has nested days structure:`, schedule.days);
          return schedule;
        }

        // Transform flat day structure to nested
        const daysObject = {
          sun: schedule.sun || false,
          mon: schedule.mon || false,
          tue: schedule.tue || false,
          wed: schedule.wed || false,
          thu: schedule.thu || false,
          fri: schedule.fri || false,
          sat: schedule.sat || false,
        };

        console.log(`[useBookingHandlers] Transforming schedule ${index + 1} flat days to nested:`, {
          original: { sun: schedule.sun, mon: schedule.mon, tue: schedule.tue, wed: schedule.wed, thu: schedule.thu, fri: schedule.fri, sat: schedule.sat },
          transformed: daysObject
        });

        // Remove the flat day properties and add nested days
        const { sun, mon, tue, wed, thu, fri, sat, ...scheduleWithoutFlatDays } = schedule;
        
        return {
          ...scheduleWithoutFlatDays,
          days: daysObject
        };
      })
    };

    console.log("[useBookingHandlers] Transformed booking data for processing:", JSON.stringify(transformedBookingData, null, 2));

    // Use the enhanced recurring booking logic with transformed data
    const result = generateRecurringBookings(transformedBookingData, branchId);
    
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
      onSuccess: async (data: any) => {
        console.log("[useBookingHandlers] ✅ Bookings created successfully:", data);
        
        // Close dialog immediately
        setNewBookingDialogOpen(false);
        createMultipleBookingsMutation.reset();
        
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
          duration: 3000
        });
        
        // Verify bookings appear in calendar
        if (data && Array.isArray(data) && data.length > 0) {
          const createdBookingIds = data.map((booking: any) => booking.id).filter(Boolean);
          if (createdBookingIds.length > 0) {
            console.log("[useBookingHandlers] Starting verification for booking IDs:", createdBookingIds);
            
            // Navigate to the first booking's date immediately
            const firstBooking = data[0];
            if (firstBooking?.start_time) {
              const bookingDate = new Date(firstBooking.start_time);
              const dateStr = bookingDate.toISOString().split('T')[0];
              
              console.log("[useBookingHandlers] Navigating to booking date:", dateStr);
              
              // Update URL to show the booking date and focus on the first booking
              const params = new URLSearchParams(window.location.search);
              params.set('date', dateStr);
              params.set('focusBookingId', createdBookingIds[0]);
              
              const newUrl = `${window.location.pathname}?${params.toString()}`;
              console.log("[useBookingHandlers] New URL:", newUrl);
              
              // Use history.pushState to navigate without reloading
              window.history.pushState({}, '', newUrl);
              
              // Trigger a window location change event to notify components
              window.dispatchEvent(new PopStateEvent('popstate'));
              
              toast.success(`Booking created for ${dateStr}!`, {
                description: 'Navigating to booking date...',
                duration: 2000
              });
            }
            
            // Start verification process
            const verificationSuccess = await verifyBookingsAppear(createdBookingIds);
            
            if (!verificationSuccess) {
              toast.warning('Bookings created but may not be visible', {
                description: 'Click "Force Refresh" if you don\'t see your bookings on the calendar',
                duration: 8000,
                action: {
                  label: 'Force Refresh',
                  onClick: forceRefresh
                }
              });
             } else {
               // Force a page reload to ensure fresh data after successful verification
               setTimeout(() => {
                 console.log("[useBookingHandlers] Reloading page to ensure fresh data");
                 window.location.reload();
               }, 1500);
             }
           }
         }
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

  const isCheckingOverlap = isChecking || isValidatingUpdate || isEnhancedValidating || isVerifying;

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
    updateBookingMutation,
    forceRefresh
  };
}
