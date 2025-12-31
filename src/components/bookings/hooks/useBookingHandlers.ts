
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient, useIsFetching } from "@tanstack/react-query";
import { format } from "date-fns";
import { Booking } from "../BookingTimeGrid";
import { useCreateMultipleBookings } from "@/data/hooks/useCreateMultipleBookings";
import { useCreateBooking } from "@/data/hooks/useCreateBooking";
import { useUpdateBooking } from "@/data/hooks/useUpdateBooking";
// Removed deprecated useBookingOverlapCheck - using useConsolidatedValidation instead
import { useRealTimeOverlapCheck } from "./useRealTimeOverlapCheck";
import { createBookingDateTime, createBookingEndDateTime, formatDateForBooking } from "../utils/dateUtils";
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
  // Removed deprecated useBookingOverlapCheck - using useConsolidatedValidation instead
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
          
          // Use available carers from validation result (new consolidated validation)
          const availableCarers = validation.availableCarers || [];

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
    if (bookingToUpdate.date && bookingToUpdate.endTime && bookingToUpdate.startTime) {
        payload.end_time = createBookingEndDateTime(bookingToUpdate.date, bookingToUpdate.startTime, bookingToUpdate.endTime);
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

  const checkForOverlapsAndCreate = async (bookingData: any, carers: any[]) => {
    console.log("[useBookingHandlers] Starting overlap check and creation process with consolidated validation");
    console.log("[useBookingHandlers] 🎯 RAW BOOKING DATA:", {
      fromDate: bookingData.fromDate,
      fromDateType: typeof bookingData.fromDate,
      fromDateString: bookingData.fromDate?.toString(),
      untilDate: bookingData.untilDate,
      carerId: bookingData.carerId,
      schedules: bookingData.schedules
    });
    
    // Enhanced validation first
    console.log('[useBookingHandlers] Validating booking data:', {
      fromDate: bookingData.fromDate,
      schedules: bookingData.schedules.map((s: any) => ({
        startTime: s.startTime,
        endTime: s.endTime,
        isOvernightCheck: s.startTime > s.endTime
      }))
    });
    
    const validation = validateBookingFormData(bookingData);
    console.log('[useBookingHandlers] Validation result:', validation);
    
    if (!validation.isValid) {
      console.error('[useBookingHandlers] Validation failed:', validation.errors);
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
    console.log("[useBookingHandlers] 🎯 GENERATING PREVIEW TO GET FIRST BOOKING DATE...");
    const preview = previewRecurringBookings(bookingData, branchId || '');
    console.log("[useBookingHandlers] 🎯 PREVIEW RESULT:", {
      dates: preview.dates,
      totalBookings: preview.totalBookings,
      errors: preview.errors,
      dayBreakdown: preview.dayBreakdown
    });
    
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
    console.log("[useBookingHandlers] 🎯 FIRST BOOKING DATE FOR VALIDATION:", firstBookingDate);
    console.log("[useBookingHandlers] 🎯 VALIDATION PARAMETERS:", {
      carerId: bookingData.carerId,
      startTime: firstSchedule.startTime,
      endTime: firstSchedule.endTime,
      date: firstBookingDate,
      branchId: branchId
    });

    try {
      // Use the new consolidated validation system instead of deprecated checkOverlap
      const consolidatedValidation = await validateBooking(
        bookingData.carerId,
        firstSchedule.startTime,
        firstSchedule.endTime,
        firstBookingDate
      );

      console.log("[useBookingHandlers] 🎯 CONSOLIDATED VALIDATION RESULT:", consolidatedValidation);

      if (!consolidatedValidation.isValid) {
        const selectedCarer = carers.find(c => c.id === bookingData.carerId);
        const carerName = selectedCarer?.name || "Unknown Carer";
        
        console.log("[useBookingHandlers] ❌ VALIDATION FAILED FOR:", {
          carerName,
          requestedDate: firstBookingDate,
          conflictingBookings: consolidatedValidation.conflictingBookings
        });
        
        // Use available carers from validation result
        const availableCarers = consolidatedValidation.availableCarers || [];

        toast.error(`SAVE BLOCKED: ${carerName} has conflicting appointments on ${firstBookingDate} at ${firstSchedule.startTime} - ${firstSchedule.endTime}.`, {
          description: `${consolidatedValidation.error || 'Scheduling conflict detected'}\n\nEven 1-minute overlaps are blocked to ensure proper scheduling and prevent conflicts.\n\nConflicting Bookings (${consolidatedValidation.conflictingBookings?.length || 0}):\n${consolidatedValidation.conflictingBookings?.map(b => `${b.clientName}\nConflict\n${b.startTime} - ${b.endTime}\nID: ${b.id} | Date: ${firstBookingDate}`).join('\n\n') || 'No details available'}`,
          duration: 8000,
          action: {
            label: "View Alternatives",
            onClick: () => setOverlapAlertOpen(true)
          }
        });

        setOverlapData({
          conflictingBookings: consolidatedValidation.conflictingBookings || [],
          carerName,
          proposedTime: `${firstSchedule.startTime} - ${firstSchedule.endTime}`,
          proposedDate: firstBookingDate,
          availableCarers,
        });
        setPendingBookingData(bookingData);
        setOverlapAlertOpen(true);
        return;
      }

      // If validation passes, proceed with booking creation
      console.log("[useBookingHandlers] ✅ VALIDATION PASSED - PROCEEDING WITH BOOKING CREATION");
      proceedWithBookingCreation(bookingData);
      
    } catch (error) {
      console.error("[useBookingHandlers] Error during consolidated validation:", error);
      toast.error("Failed to validate booking conflicts", {
        description: "Please try again or contact support if the issue persists"
      });
    }
  };

  const proceedWithSingleBookingCreation = (bookingData: any) => {
    console.log("[useBookingHandlers] Creating single booking with multiple schedules");
    console.log("[useBookingHandlers] Single booking data:", JSON.stringify(bookingData, null, 2));
    
    if (!user) {
      toast.error("You must be logged in to create bookings");
      return;
    }
    if (!branchId) {
      toast.error("Branch ID is required");
      return;
    }

    if (!bookingData.schedules || bookingData.schedules.length === 0) {
      toast.error("No schedule data found");
      return;
    }

    // Create booking directly without recurring logic
    console.log("[useBookingHandlers] Original fromDate from form data:", bookingData.fromDate);
    console.log("[useBookingHandlers] Original fromDate type:", typeof bookingData.fromDate);
    console.log("[useBookingHandlers] Original fromDate toString:", bookingData.fromDate?.toString());
    
    const bookingDateStr = formatDateForBooking(bookingData.fromDate);
    console.log("[useBookingHandlers] Formatted booking date string:", bookingDateStr);
    console.log(`[useBookingHandlers] Processing ${bookingData.schedules.length} schedule(s)`);
    
    // Map ALL schedules to booking objects
    const bookingsToCreate = bookingData.schedules.map((schedule: any, index: number) => {
      console.log(`[useBookingHandlers] Schedule ${index + 1}:`, {
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        services: schedule.services
      });
      
      return {
        branch_id: branchId,
        client_id: bookingData.clientId,
        staff_id: bookingData.carerId || null,
        start_time: createBookingDateTime(bookingDateStr, schedule.startTime),
        end_time: createBookingEndDateTime(bookingDateStr, schedule.startTime, schedule.endTime),
        service_id: schedule.services?.[0] || null,
        service_ids: schedule.services || [],
        status: bookingData.carerId ? "assigned" : "unassigned",
        notes: bookingData.notes || null,
      };
    });
    
    console.log(`[useBookingHandlers] Creating ${bookingsToCreate.length} booking(s)`);
    bookingsToCreate.forEach((booking, index) => {
      console.log(`[useBookingHandlers] Booking ${index + 1}:`, {
        start_time: booking.start_time,
        end_time: booking.end_time,
        service_id: booking.service_id
      });
    });

    toast.info(`Creating ${bookingsToCreate.length} Booking(s)...`, {
      description: `Creating ${bookingsToCreate.length} schedule(s) for ${format(bookingData.fromDate, "PPP")}`,
      duration: 2000
    });

    // Use multiple bookings creation hook to ensure same created_at timestamp
    createMultipleBookingsMutation.mutate(bookingsToCreate, {
      onSuccess: (result) => {
        const createdBookings = result?.bookings || [];
        console.log(`[useBookingHandlers] ✅ Created ${createdBookings.length} bookings successfully`);
        
        if (createdBookings.length > 0) {
          console.log("[useBookingHandlers] ✅ Sample created booking:", createdBookings[0]);
          createdBookings.forEach((booking, index) => {
            console.log(`[useBookingHandlers] ✅ Booking ${index + 1} ID:`, booking.id);
          });
        }
        
        setNewBookingDialogOpen(false);
        
        toast.success(`${createdBookings.length} Booking(s) Created! ✅`, {
          description: `Created ${createdBookings.length} schedule(s) for ${format(bookingData.fromDate, "PPP")}`,
          duration: 3000
        });

        // Force immediate calendar refresh
        queryClient.invalidateQueries({ queryKey: ["organization-calendar"] });
        queryClient.invalidateQueries({ queryKey: ["organization-bookings"] });
        
        // Navigate to the first booking
        if (createdBookings.length > 0) {
          const navigationDateStr = formatDateForBooking(bookingData.fromDate);
          navigateToBookingDate(navigationDateStr, createdBookings[0].id);

          // Verify all bookings appear
          setTimeout(() => {
            verifyBookingsAppear(createdBookings.map((b: any) => b.id));
          }, 500);
        }
      },
      onError: (error) => {
        console.error("[useBookingHandlers] ❌ CRITICAL: Booking creation FAILED:", error);
        console.error("[useBookingHandlers] ❌ Error details:", error?.message || 'Unknown error');
        console.error("[useBookingHandlers] ❌ Bookings were NOT saved to database");
        
        if (error.message?.includes("row-level security")) {
          toast.error("Access denied. You may not be authorized for this branch.", {
            description: "Contact your administrator or create an admin user for this branch.",
          });
        } else {
          toast.error("Failed to create bookings", {
            description: error?.message || "Unknown error on booking creation. Please check all fields.",
          });
        }
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
    // Pass excludeDates if provided (from leave conflict resolution)
    const excludeDates = transformedBookingData.excludeDates || undefined;
    console.log("[useBookingHandlers] Exclude dates for leave conflicts:", excludeDates);
    
    const result = generateRecurringBookings(transformedBookingData, branchId, excludeDates);
    
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

    // Log booking creation (removed info toast to avoid multiple popups)
    console.log("[useBookingHandlers] Creating bookings:", {
      total: result.bookings.length,
      days: dayNames,
      range: `${summary.dateRange.start} to ${summary.dateRange.end}`
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
        
        // Build comprehensive summary for SINGLE toast
        const actualCount = data?.length || result.bookings.length;
        
        // Get date range from created bookings
        let dateRangeText = '';
        if (data && Array.isArray(data) && data.length > 0) {
          const dates = data.map((b: any) => new Date(b.start_time)).sort((a: Date, b: Date) => a.getTime() - b.getTime());
          const startDate = format(dates[0], 'dd MMM yyyy');
          const endDate = format(dates[dates.length - 1], 'dd MMM yyyy');
          dateRangeText = startDate === endDate ? startDate : `${startDate} to ${endDate}`;
        }
        
        // Build summary description
        const summaryParts: string[] = [];
        summaryParts.push(`${actualCount} session${actualCount > 1 ? 's' : ''} scheduled`);
        if (dateRangeText) {
          summaryParts.push(dateRangeText);
        }
        
        // Show SINGLE comprehensive success toast
        toast.success("Recurring Booking Created Successfully!", {
          description: summaryParts.join(' • '),
          duration: 5000
        });
        
        // Navigate to first booking date and verify (without additional toasts)
        if (data && Array.isArray(data) && data.length > 0) {
          const createdBookingIds = data.map((booking: any) => booking.id).filter(Boolean);
          if (createdBookingIds.length > 0) {
            console.log("[useBookingHandlers] Starting verification for booking IDs:", createdBookingIds);
            
            // Navigate to the first booking's date
            const firstBooking = data[0];
            if (firstBooking?.start_time) {
              const bookingDate = new Date(firstBooking.start_time);
              const dateStr = bookingDate.toISOString().split('T')[0];
              
              console.log("[useBookingHandlers] Navigating to booking date:", dateStr);
              
              const params = new URLSearchParams(window.location.search);
              params.set('date', dateStr);
              params.set('focusBookingId', createdBookingIds[0]);
              
              const newUrl = `${window.location.pathname}?${params.toString()}`;
              window.history.pushState({}, '', newUrl);
              window.dispatchEvent(new PopStateEvent('popstate'));
            }
            
            // Start verification process (only show warning if needed)
            const verificationSuccess = await verifyBookingsAppear(createdBookingIds);
            
            if (!verificationSuccess) {
              toast.warning('Calendar may need refresh', {
                description: 'Click "Force Refresh" if bookings are not visible',
                duration: 8000,
                action: {
                  label: 'Force Refresh',
                  onClick: forceRefresh
                }
              });
            } else {
              console.log("[useBookingHandlers] Bookings verified and visible in calendar");
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
    // Clear pending booking data's carer selection to prompt user to choose new carer
    if (pendingBookingData) {
      setPendingBookingData({
        ...pendingBookingData,
        carerId: null,
        staff_ids: []
      });
    }
    // Dialog stays open - user can select new carer
    toast.info("Please select a different carer for this booking");
  };

  const handleOverlapModifyTime = () => {
    setOverlapAlertOpen(false);
    // Dialog stays open - user can modify time
    toast.info("Please adjust the booking time to avoid conflicts");
  };

  const handleOverlapProceedWithoutCarer = () => {
    if (!pendingBookingData) {
      toast.error("No pending booking data found");
      return;
    }
    
    console.log("[useBookingHandlers] Creating booking without carer assignment due to conflict");
    
    // Create booking with null carer
    const unassignedBookingData = {
      ...pendingBookingData,
      carerId: null,
      staff_ids: [],
    };
    
    // Close the overlap dialog
    setOverlapAlertOpen(false);
    setOverlapData(null);
    setPendingBookingData(null);
    
    // Proceed with creation
    proceedWithBookingCreation(unassignedBookingData);
    
    toast.success("Booking created as unassigned", {
      description: "You can assign a carer later when availability is confirmed."
    });
  };

  // Add handlers for update overlaps
  const handleUpdateOverlapChooseDifferentCarer = () => {
    setUpdateOverlapAlertOpen(false);
    // Keep the edit dialog open to allow carer selection
    toast.info("Please select a different carer in the edit dialog");
  };

  const handleUpdateOverlapModifyTime = () => {
    setUpdateOverlapAlertOpen(false);
    // Keep the edit dialog open to allow time modification
    toast.info("Please adjust the appointment times in the edit dialog");
  };

  const handleUpdateOverlapProceedWithoutCarer = () => {
    if (!pendingUpdateData) {
      toast.error("No pending update data found");
      return;
    }
    
    console.log("[useBookingHandlers] Updating booking without carer assignment due to conflict");
    
    // Update booking with null carer
    const unassignedUpdateData = {
      ...pendingUpdateData,
      carerId: null,
    };
    
    // Close the overlap dialog
    setUpdateOverlapAlertOpen(false);
    setUpdateOverlapData(null);
    setPendingUpdateData(null);
    
    // Proceed with update
    proceedWithBookingUpdate(unassignedUpdateData);
    
    toast.success("Booking updated as unassigned", {
      description: "You can assign a carer later when availability is confirmed."
    });
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
    handleOverlapProceedWithoutCarer,
    handleUpdateOverlapChooseDifferentCarer,
    handleUpdateOverlapModifyTime,
    handleUpdateOverlapProceedWithoutCarer,
    createMultipleBookingsMutation,
    updateBookingMutation,
    forceRefresh
  };
}
