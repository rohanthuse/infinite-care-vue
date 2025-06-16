
import { useMemo } from "react";
import { useBranchBookings } from "@/data/hooks/useBranchBookings";
import { checkBookingOverlaps, getAvailableCarers, BookingOverlap } from "../utils/bookingOverlapDetection";
import { Booking } from "../BookingTimeGrid";

export function useBookingOverlapCheck(branchId?: string) {
  const { data: bookingsDB = [], isLoading } = useBranchBookings(branchId);

  // Convert DB bookings to our Booking format with better date handling
  const bookings: Booking[] = useMemo(() => {
    console.log("[useBookingOverlapCheck] Converting DB bookings:", bookingsDB.length, "bookings");
    console.log("[useBookingOverlapCheck] Raw DB bookings:", bookingsDB);
    
    return (bookingsDB || []).map((bk: any) => {
      // Extract date and time properly from ISO strings
      const startDateTime = new Date(bk.start_time);
      const endDateTime = new Date(bk.end_time);
      
      console.log("[useBookingOverlapCheck] Converting booking:", {
        id: bk.id,
        rawStartTime: bk.start_time,
        rawEndTime: bk.end_time,
        parsedStartTime: startDateTime.toISOString(),
        parsedEndTime: endDateTime.toISOString()
      });
      
      // Format date as YYYY-MM-DD (using UTC to avoid timezone issues)
      const year = startDateTime.getUTCFullYear();
      const month = String(startDateTime.getUTCMonth() + 1).padStart(2, '0');
      const day = String(startDateTime.getUTCDate()).padStart(2, '0');
      const date = `${year}-${month}-${day}`;
      
      // Format time as HH:MM (using UTC to avoid timezone issues)
      const startHours = String(startDateTime.getUTCHours()).padStart(2, '0');
      const startMinutes = String(startDateTime.getUTCMinutes()).padStart(2, '0');
      const startTime = `${startHours}:${startMinutes}`;
      
      const endHours = String(endDateTime.getUTCHours()).padStart(2, '0');
      const endMinutes = String(endDateTime.getUTCMinutes()).padStart(2, '0');
      const endTime = `${endHours}:${endMinutes}`;
      
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
        date,
        status: (bk.status || "assigned") as Booking["status"],
        notes: "",
      };
      
      console.log("[useBookingOverlapCheck] Converted booking result:", {
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
