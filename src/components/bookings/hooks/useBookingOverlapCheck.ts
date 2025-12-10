import { useMemo } from "react";
import { useBranchBookings } from "@/data/hooks/useBranchBookings";
import { checkBookingOverlaps, getAvailableCarers, BookingOverlap } from "../utils/bookingOverlapDetection";
import { Booking } from "../BookingTimeGrid";
import { formatInUserTimezone } from "@/utils/timezoneUtils";

/**
 * @deprecated Use useConsolidatedValidation instead. This hook is no longer maintained.
 */
export function useBookingOverlapCheck(branchId?: string) {
  const { data: bookingsDB = [], isLoading } = useBranchBookings(branchId);

  // Convert DB bookings to our Booking format - use SAME method as calendar display
  const bookings: Booking[] = useMemo(() => {
    console.log("[useBookingOverlapCheck] Converting DB bookings:", bookingsDB.length, "bookings");
    console.log("[useBookingOverlapCheck] Raw DB bookings:", bookingsDB);
    
    // Extract date and time in user's local timezone (consistent with calendar display)
    const extractDateLocal = (isoString: string) => {
      if (!isoString) return "";
      try {
        return formatInUserTimezone(isoString, 'yyyy-MM-dd');
      } catch {
        return isoString.split('T')[0] || "";
      }
    };

    const extractTimeLocal = (isoString: string) => {
      if (!isoString) return "07:00";
      try {
        return formatInUserTimezone(isoString, 'HH:mm');
      } catch {
        return "07:00";
      }
    };
    
    return (bookingsDB || []).map((bk: any) => {
      const startDate = extractDateLocal(bk.start_time);
      const startTime = extractTimeLocal(bk.start_time);
      const endTime = extractTimeLocal(bk.end_time);
      
      console.log("[useBookingOverlapCheck] Converting booking (FIXED):", {
        id: bk.id,
        rawStartTime: bk.start_time,
        rawEndTime: bk.end_time,
        extractedDate: startDate,
        extractedStartTime: startTime,
        extractedEndTime: endTime
      });
      
      const booking = {
        id: String(bk.id), // Ensure ID is always a string
        clientId: bk.client_id || "",
        clientName: `Client ${bk.client_id?.slice(0, 8) || "Unknown"}`,
        clientInitials: "??",
        carerId: bk.staff_id || "",
        carerName: `Carer ${bk.staff_id?.slice(0, 8) || "Unknown"}`,
        carerInitials: "??",
        startTime,
        endTime,
        date: startDate,
        status: (bk.status || "assigned") as Booking["status"],
        notes: "",
      };
      
      console.log("[useBookingOverlapCheck] Converted booking result (CONSISTENT):", {
        id: booking.id,
        carerId: booking.carerId,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        originalId: bk.id,
        originalStartTime: bk.start_time,
        originalEndTime: bk.end_time
      });
      
      return booking;
    });
  }, [bookingsDB]);

  const checkOverlap = (
    carerId: string,
    startTime: string,
    endTime: string,
    date: string,
    excludeBookingId?: string
  ): BookingOverlap => {
    console.log("[useBookingOverlapCheck] OVERLAP CHECK CALLED:", {
      carerId,
      startTime,
      endTime,
      date,
      excludeBookingId,
      totalBookings: bookings.length,
      availableBookings: bookings.map(b => ({
        id: b.id,
        carerId: b.carerId,
        date: b.date,
        startTime: b.startTime,
        endTime: b.endTime
      }))
    });
    
    // Validate inputs
    if (!carerId || !startTime || !endTime || !date) {
      console.log("[useBookingOverlapCheck] Invalid inputs, returning no overlap");
      return { hasOverlap: false, conflictingBookings: [] };
    }
    
    const result = checkBookingOverlaps(carerId, startTime, endTime, date, bookings, excludeBookingId);
    
    console.log("[useBookingOverlapCheck] OVERLAP RESULT:", {
      hasOverlap: result.hasOverlap,
      conflictingBookings: result.conflictingBookings,
      inputParams: { carerId, startTime, endTime, date, excludeBookingId }
    });
    
    return result;
  };

  const findAvailableCarers = (
    carers: Array<{ id: string; name: string; initials: string }>,
    startTime: string,
    endTime: string,
    date: string,
    excludeBookingId?: string
  ) => {
    console.log("[useBookingOverlapCheck] Finding available carers for:", {
      startTime,
      endTime,
      date,
      excludeBookingId,
      totalCarers: carers.length
    });
    
    return getAvailableCarers(carers, startTime, endTime, date, bookings, excludeBookingId);
  };

  return {
    checkOverlap,
    findAvailableCarers,
    isLoading,
    bookings
  };
}