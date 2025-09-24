
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient, useIsFetching } from "@tanstack/react-query";
import { Booking } from "../BookingTimeGrid";
import { useCreateMultipleBookings } from "@/data/hooks/useCreateMultipleBookings";
import { useUpdateBooking } from "@/data/hooks/useUpdateBooking";
import { useBookingOverlapCheck } from "./useBookingOverlapCheck";
import { useRealTimeOverlapCheck } from "./useRealTimeOverlapCheck";
import { createBookingDateTime, addDaysToDateString, getDayOfWeekFromString } from "../utils/bookingUtils";
import { useEnhancedOverlapValidation } from "./useEnhancedOverlapValidation";

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
    if (!bookingData.carerId) {
      proceedWithBookingCreation(bookingData);
      return;
    }

    // Check for overlaps in the first schedule
    const firstSchedule = bookingData.schedules[0];
    if (!firstSchedule) {
      proceedWithBookingCreation(bookingData);
      return;
    }

    // Extract date as plain string - no Date objects
    const fromDateStr = typeof bookingData.fromDate === 'string' 
      ? (bookingData.fromDate.includes('T') ? bookingData.fromDate.split('T')[0] : bookingData.fromDate)
      : bookingData.fromDate.toISOString().split('T')[0];

    // Build selected days object from the schedule
    const { days } = firstSchedule;
    const dayBooleans: Partial<Record<number, boolean>> = {};
    if (days) {
      if (days.mon) dayBooleans[1] = true;
      if (days.tue) dayBooleans[2] = true;
      if (days.wed) dayBooleans[3] = true;
      if (days.thu) dayBooleans[4] = true;
      if (days.fri) dayBooleans[5] = true;
      if (days.sat) dayBooleans[6] = true;
      if (days.sun) dayBooleans[0] = true;
    }

    const anyDaysSelected = Object.values(dayBooleans).some(Boolean);
    const selectedDays = anyDaysSelected
      ? dayBooleans
      : { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true };

    // Helper function to find the first actual recurring date
    const findFirstRecurringDate = (fromDateStr: string, selectedDays: Partial<Record<number, boolean>>) => {
      let currentDate = fromDateStr;
      const untilDateStr = typeof bookingData.untilDate === 'string' 
        ? (bookingData.untilDate.includes('T') ? bookingData.untilDate.split('T')[0] : bookingData.untilDate)
        : bookingData.untilDate.toISOString().split('T')[0];

      while (currentDate <= untilDateStr) {
        const dayNum = getDayOfWeekFromString(currentDate);
        if (selectedDays[dayNum]) {
          return currentDate;
        }
        currentDate = addDaysToDateString(currentDate, 1);
      }
      return fromDateStr; // fallback
    };

    // Find the first actual recurring date instead of using fromDate
    const firstRecurringDate = findFirstRecurringDate(fromDateStr, selectedDays);
    
    console.log("[useBookingHandlers] Conflict check:", {
      fromDate: fromDateStr,
      firstRecurringDate,
      selectedDays,
      carerId: bookingData.carerId,
      time: `${firstSchedule.startTime} - ${firstSchedule.endTime}`
    });

    const overlap = checkOverlap(
      bookingData.carerId,
      firstSchedule.startTime,
      firstSchedule.endTime,
      firstRecurringDate
    );

    if (overlap.hasOverlap) {
      const selectedCarer = carers.find(c => c.id === bookingData.carerId);
      const carerName = selectedCarer?.name || "Unknown Carer";
      const availableCarers = findAvailableCarers(
        carers,
        firstSchedule.startTime,
        firstSchedule.endTime,
        firstRecurringDate
      );

      // Enhanced error messaging with toast notification
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
        proposedDate: firstRecurringDate,
        availableCarers,
      });
      setPendingBookingData(bookingData);
      setOverlapAlertOpen(true);
    } else {
      proceedWithBookingCreation(bookingData);
    }
  };

  const proceedWithBookingCreation = (bookingData: any) => {
    if (!user) {
      toast.error("You must be logged in to create bookings");
      return;
    }
    if (!branchId) {
      toast.error("Branch ID is required");
      return;
    }
    if (
      !bookingData ||
      !bookingData.schedules ||
      !Array.isArray(bookingData.schedules) ||
      bookingData.schedules.length === 0
    ) {
      toast.error("Invalid booking data. Please select at least one schedule.");
      return;
    }

    // Extract date strings - no Date objects needed
    const fromDateStr = typeof bookingData.fromDate === 'string' 
      ? (bookingData.fromDate.includes('T') ? bookingData.fromDate.split('T')[0] : bookingData.fromDate)
      : bookingData.fromDate.toISOString().split('T')[0];
    const untilDateStr = typeof bookingData.untilDate === 'string' 
      ? (bookingData.untilDate.includes('T') ? bookingData.untilDate.split('T')[0] : bookingData.untilDate)
      : bookingData.untilDate.toISOString().split('T')[0];
    
    if (!fromDateStr || !untilDateStr) {
      toast.error("Please select both a start and end date.");
      return;
    }

    // String-based date validation
    if (fromDateStr > untilDateStr) {
      toast.error("Invalid date range", {
        description: "From date must be before or equal to until date.",
      });
      return;
    }

    // Same-day time validation
    if (fromDateStr === untilDateStr) {
      const hasInvalidTimes = bookingData.schedules.some((schedule: any) => 
        schedule.startTime && schedule.endTime && schedule.startTime >= schedule.endTime
      );
      
      if (hasInvalidTimes) {
        toast.error("Invalid time range", {
          description: "For same-day bookings, start time must be before end time.",
        });
        return;
      }
    }

    const bookingsToCreate: any[] = [];
    for (const schedule of bookingData.schedules) {
      const { startTime, endTime, services, days } = schedule;
      if (!startTime || !endTime) continue;

      let serviceId: string | null = null;
      if (
        Array.isArray(services) &&
        services[0] &&
        /^[0-9a-fA-F-]{36}$/.test(services[0])
      ) {
        serviceId = services[0];
      }

      const dayBooleans: Partial<Record<number, boolean>> = {};
      if (days) {
        if (days.mon) dayBooleans[1] = true;
        if (days.tue) dayBooleans[2] = true;
        if (days.wed) dayBooleans[3] = true;
        if (days.thu) dayBooleans[4] = true;
        if (days.fri) dayBooleans[5] = true;
        if (days.sat) dayBooleans[6] = true;
        if (days.sun) dayBooleans[0] = true;
      }

      const anyDaysSelected = Object.values(dayBooleans).some(Boolean);
      const daysSelected = anyDaysSelected
        ? dayBooleans
        : { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true };

      const recurrenceFrequencyWeeks = parseInt(bookingData.recurrenceFrequency || "1");

      // COMPREHENSIVE DEBUGGING FOR BOOKING CREATION
      console.log("[useBookingHandlers] DEBUGGING BOOKING CREATION:");
      console.log("- Date range:", fromDateStr, "to", untilDateStr);
      console.log("- Raw days object:", days);
      console.log("- DayBooleans object:", dayBooleans);
      console.log("- Recurrence frequency (weeks):", recurrenceFrequencyWeeks);
      
      // Get the selected days as an array for easier processing
      const selectedDayNumbers = Object.keys(daysSelected)
        .filter(day => daysSelected[parseInt(day)])
        .map(day => parseInt(day))
        .sort((a, b) => a - b);
      
      console.log("[useBookingHandlers] Selected day numbers:", selectedDayNumbers);
      
      // Test the getDayOfWeekFromString function for the start date
      const startDayOfWeek = getDayOfWeekFromString(fromDateStr);
      console.log("[useBookingHandlers] Start date", fromDateStr, "is day of week:", startDayOfWeek, "(" + 
        ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][startDayOfWeek] + ")");
      
      // For each selected day of week, find all matching dates in the range
      for (const targetDayNum of selectedDayNumbers) {
        console.log("[useBookingHandlers] Processing target day:", targetDayNum, "(" + 
          ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][targetDayNum] + ")");
        
        // Find the first occurrence of this day of week from the start date
        let currentDateStr = fromDateStr;
        let foundFirstOccurrence = false;
        
        // Search for the first occurrence of the target day
        while (currentDateStr <= untilDateStr && !foundFirstOccurrence) {
          const dayNum = getDayOfWeekFromString(currentDateStr);
          console.log("[useBookingHandlers] Checking date:", currentDateStr, "day of week:", dayNum, 
            "target:", targetDayNum, "match:", dayNum === targetDayNum);
          
          if (dayNum === targetDayNum) {
            foundFirstOccurrence = true;
            let bookingDateStr = currentDateStr;
            let bookingCount = 0;
            
            // Create bookings with the recurrence frequency
            while (bookingDateStr <= untilDateStr) {
              bookingCount++;
              const verifyDayOfWeek = getDayOfWeekFromString(bookingDateStr);
              
              console.log("[useBookingHandlers] Creating booking #" + bookingCount + 
                " for date:", bookingDateStr, 
                "expected day:", targetDayNum, 
                "actual day:", verifyDayOfWeek,
                "time:", startTime, "-", endTime);
              
              // Double-check that we're creating the booking on the correct day
              if (verifyDayOfWeek !== targetDayNum) {
                console.error("[useBookingHandlers] ERROR: Day mismatch! Expected", targetDayNum, "but got", verifyDayOfWeek, "for date", bookingDateStr);
                break;
              }
              
              bookingsToCreate.push({
                branch_id: branchId,
                client_id: bookingData.clientId,
                staff_id: bookingData.carerId,
                start_time: createBookingDateTime(bookingDateStr, startTime),
                end_time: createBookingDateTime(bookingDateStr, endTime),
                service_id: serviceId,
                revenue: null,
                status: "assigned",
                notes: bookingData.notes || null,
              });
              
              console.log("[useBookingHandlers] ✅ Generated booking:", {
                date: bookingDateStr,
                dayOfWeek: verifyDayOfWeek,
                dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][verifyDayOfWeek],
                start_time: createBookingDateTime(bookingDateStr, startTime),
                end_time: createBookingDateTime(bookingDateStr, endTime)
              });
              
              // Increment by the recurrence frequency in weeks (7 days per week)
              const nextBookingDate = addDaysToDateString(bookingDateStr, recurrenceFrequencyWeeks * 7);
              console.log("[useBookingHandlers] Next recurrence: incrementing", bookingDateStr, 
                "by", recurrenceFrequencyWeeks * 7, "days to get", nextBookingDate);
              bookingDateStr = nextBookingDate;
            }
            
            console.log("[useBookingHandlers] Completed", bookingCount, "bookings for day", targetDayNum);
          } else {
            // Move to next day to find the target day of week
            currentDateStr = addDaysToDateString(currentDateStr, 1);
          }
        }
        
        if (!foundFirstOccurrence) {
          console.warn("[useBookingHandlers] No occurrence found for target day", targetDayNum, "in date range");
        }
      }
    }

    if (bookingsToCreate.length === 0) {
      toast.error("No valid days/times selected for recurrence.");
      return;
    }

    console.log("[useBookingHandlers] Creating", bookingsToCreate.length, "bookings for branch:", branchId);
    console.log("[useBookingHandlers] Bookings to create:", bookingsToCreate.map(b => ({
      client_id: b.client_id,
      staff_id: b.staff_id,
      start_time: b.start_time,
      end_time: b.end_time
    })));

    createMultipleBookingsMutation.mutate(bookingsToCreate, {
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
        toast.success("Bookings created!", {
          description: `Created ${data?.length || bookingsToCreate.length} bookings. Refreshing calendar...`,
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
