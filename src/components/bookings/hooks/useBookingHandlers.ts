import { useState } from "react";
import { toast } from "sonner";
import { Booking } from "../BookingTimeGrid";
import { useCreateMultipleBookings } from "@/data/hooks/useCreateMultipleBookings";
import { useUpdateBooking } from "@/data/hooks/useUpdateBooking";
import { useBookingOverlapCheck } from "./useBookingOverlapCheck";
import { combineDateAndTimeToISO } from "../utils/bookingUtils";

export function useBookingHandlers(branchId?: string, user?: any) {
  const [newBookingDialogOpen, setNewBookingDialogOpen] = useState(false);
  const [editBookingDialogOpen, setEditBookingDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [newBookingData, setNewBookingData] = useState<{
    date: Date;
    startTime: string;
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

  const createMultipleBookingsMutation = useCreateMultipleBookings(branchId);
  const updateBookingMutation = useUpdateBooking(branchId);
  const { checkOverlap, findAvailableCarers } = useBookingOverlapCheck(branchId);

  const handleRefresh = () => {
    toast.success("Bookings refreshed successfully");
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
    setNewBookingData({
      date,
      startTime: time,
      clientId,
      carerId
    });
    setNewBookingDialogOpen(true);
  };

  const handleUpdateBooking = (bookingToUpdate: Booking & {notes?: string}, carers: any[] = []) => {
    console.log("[useBookingHandlers] === UPDATE BOOKING START ===");
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

    // Check for overlaps if carer, time, or date has changed from the original booking
    const hasChangedSchedule = selectedBooking && (
      bookingToUpdate.carerId !== selectedBooking.carerId ||
      bookingToUpdate.startTime !== selectedBooking.startTime ||
      bookingToUpdate.endTime !== selectedBooking.endTime ||
      bookingToUpdate.date !== selectedBooking.date
    );

    console.log("[useBookingHandlers] Schedule change analysis:", {
      hasChangedSchedule,
      selectedBooking: selectedBooking ? {
        id: selectedBooking.id,
        carerId: selectedBooking.carerId,
        startTime: selectedBooking.startTime,
        endTime: selectedBooking.endTime,
        date: selectedBooking.date
      } : null,
      updatedBooking: {
        id: bookingToUpdate.id,
        carerId: bookingToUpdate.carerId,
        startTime: bookingToUpdate.startTime,
        endTime: bookingToUpdate.endTime,
        date: bookingToUpdate.date
      },
      carerChanged: selectedBooking ? bookingToUpdate.carerId !== selectedBooking.carerId : false,
      startTimeChanged: selectedBooking ? bookingToUpdate.startTime !== selectedBooking.startTime : false,
      endTimeChanged: selectedBooking ? bookingToUpdate.endTime !== selectedBooking.endTime : false,
      dateChanged: selectedBooking ? bookingToUpdate.date !== selectedBooking.date : false
    });

    if (hasChangedSchedule && bookingToUpdate.carerId) {
      console.log("[useBookingHandlers] SCHEDULE CHANGED - Checking for overlaps");
      console.log("[useBookingHandlers] Calling overlap check with excludeId:", bookingToUpdate.id);
      
      // Pass the booking ID to exclude it from overlap checking
      const overlap = checkOverlap(
        bookingToUpdate.carerId,
        bookingToUpdate.startTime,
        bookingToUpdate.endTime,
        bookingToUpdate.date,
        bookingToUpdate.id // Exclude current booking
      );

      console.log("[useBookingHandlers] Overlap check completed:", {
        hasOverlap: overlap.hasOverlap,
        conflictingBookings: overlap.conflictingBookings,
        excludedBookingId: bookingToUpdate.id
      });

      if (overlap.hasOverlap) {
        console.log("[useBookingHandlers] OVERLAP DETECTED - Setting up alert");
        
        const selectedCarer = carers.find(c => c.id === bookingToUpdate.carerId);
        const availableCarers = findAvailableCarers(
          carers,
          bookingToUpdate.startTime,
          bookingToUpdate.endTime,
          bookingToUpdate.date,
          bookingToUpdate.id // Exclude current booking
        );

        console.log("[useBookingHandlers] Overlap alert data:", {
          selectedCarer: selectedCarer?.name,
          availableCarersCount: availableCarers.length,
          conflictCount: overlap.conflictingBookings.length
        });

        setUpdateOverlapData({
          conflictingBookings: overlap.conflictingBookings,
          carerName: selectedCarer?.name || bookingToUpdate.carerName,
          proposedTime: `${bookingToUpdate.startTime} - ${bookingToUpdate.endTime}`,
          proposedDate: bookingToUpdate.date,
          availableCarers,
        });
        setPendingUpdateData(bookingToUpdate);
        setUpdateOverlapAlertOpen(true);
        console.log("[useBookingHandlers] Overlap alert should now be visible");
        return;
      } else {
        console.log("[useBookingHandlers] No overlaps detected, proceeding with update");
      }
    } else {
      console.log("[useBookingHandlers] No schedule changes detected or no carer assigned, proceeding with update");
    }

    // Proceed with update if no conflicts
    proceedWithBookingUpdate(bookingToUpdate);
  };

  const proceedWithBookingUpdate = (bookingToUpdate: Booking & {notes?: string}) => {
    console.log("[useBookingHandlers] Proceeding with booking update:", bookingToUpdate.id);
    
    const payload: any = {
      client_id: bookingToUpdate.clientId,
      staff_id: bookingToUpdate.carerId,
      status: bookingToUpdate.status,
    };
    
    if (bookingToUpdate.date && bookingToUpdate.startTime) {
        payload.start_time = combineDateAndTimeToISO(new Date(bookingToUpdate.date), bookingToUpdate.startTime);
    }
    if (bookingToUpdate.date && bookingToUpdate.endTime) {
        payload.end_time = combineDateAndTimeToISO(new Date(bookingToUpdate.date), bookingToUpdate.endTime);
    }

    updateBookingMutation.mutate({ bookingId: bookingToUpdate.id, updatedData: payload }, {
        onSuccess: () => {
            if (editBookingDialogOpen) {
                setEditBookingDialogOpen(false);
            }
            toast.success("Booking updated successfully");
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

    const proposedDate = bookingData.fromDate instanceof Date 
      ? bookingData.fromDate.toISOString().slice(0, 10)
      : new Date(bookingData.fromDate).toISOString().slice(0, 10);

    const overlap = checkOverlap(
      bookingData.carerId,
      firstSchedule.startTime,
      firstSchedule.endTime,
      proposedDate
    );

    if (overlap.hasOverlap) {
      const selectedCarer = carers.find(c => c.id === bookingData.carerId);
      const availableCarers = findAvailableCarers(
        carers,
        firstSchedule.startTime,
        firstSchedule.endTime,
        proposedDate
      );

      setOverlapData({
        conflictingBookings: overlap.conflictingBookings,
        carerName: selectedCarer?.name || "Unknown Carer",
        proposedTime: `${firstSchedule.startTime} - ${firstSchedule.endTime}`,
        proposedDate,
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

    const from = bookingData.fromDate instanceof Date
      ? bookingData.fromDate
      : new Date(bookingData.fromDate);
    const until = bookingData.untilDate instanceof Date
      ? bookingData.untilDate
      : new Date(bookingData.untilDate);
    
    if (!from || !until) {
      toast.error("Please select both a start and end date.");
      return;
    }

    // Server-side date validation
    if (from > until) {
      toast.error("Invalid date range", {
        description: "From date must be before or equal to until date.",
      });
      return;
    }

    // Same-day time validation
    if (from.toDateString() === until.toDateString()) {
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

      let curr = new Date(from);
      curr.setHours(0, 0, 0, 0);
      const end = new Date(until);
      end.setHours(0, 0, 0, 0);

      while (curr <= end) {
        const dayNum = curr.getDay();
        if (daysSelected[dayNum]) {
          bookingsToCreate.push({
            branch_id: branchId,
            client_id: bookingData.clientId,
            staff_id: bookingData.carerId,
            start_time: combineDateAndTimeToISO(curr, startTime),
            end_time: combineDateAndTimeToISO(curr, endTime),
            service_id: serviceId,
            revenue: null,
            status: "assigned",
          });
        }
        curr.setDate(curr.getDate() + 1);
      }
    }

    if (bookingsToCreate.length === 0) {
      toast.error("No valid days/times selected for recurrence.");
      return;
    }

    createMultipleBookingsMutation.mutate(bookingsToCreate, {
      onError: (error: any) => {
        console.error("[BookingsTab] Booking creation error:", error);
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
        toast.success("Bookings created!", {
          description: `Created ${data.length || bookingsToCreate.length} bookings for selected range.`,
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
    if (pendingUpdateData) {
      proceedWithBookingUpdate(pendingUpdateData);
    }
    setUpdateOverlapAlertOpen(false);
    setPendingUpdateData(null);
    setUpdateOverlapData(null);
  };

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
