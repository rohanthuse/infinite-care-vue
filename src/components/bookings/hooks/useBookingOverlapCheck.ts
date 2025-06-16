
import { useMemo } from "react";
import { useBranchBookings } from "@/data/hooks/useBranchBookings";
import { checkBookingOverlaps, getAvailableCarers, BookingOverlap } from "../utils/bookingOverlapDetection";
import { Booking } from "../BookingTimeGrid";

export function useBookingOverlapCheck(branchId?: string) {
  const { data: bookingsDB = [], isLoading } = useBranchBookings(branchId);

  // Convert DB bookings to our Booking format with better date handling
  const bookings: Booking[] = useMemo(() => {
    console.log("[useBookingOverlapCheck] Converting DB bookings:", bookingsDB.length, "bookings");
    
    return (bookingsDB || []).map((bk: any) => {
      // Extract date and time properly from ISO strings
      const startDateTime = new Date(bk.start_time);
      const endDateTime = new Date(bk.end_time);
      
      // Format date as YYYY-MM-DD
      const date = startDateTime.toISOString().slice(0, 10);
      
      // Format time as HH:MM
      const startTime = startDateTime.toTimeString().slice(0, 5);
      const endTime = endDateTime.toTimeString().slice(0, 5);
      
      const booking = {
        id: bk.id, // Preserve the actual booking ID
        clientId: bk.client_id,
        clientName: `Client ${bk.client_id?.slice(0, 8)}`, // Placeholder - would be resolved in real app
        clientInitials: "??",
        carerId: bk.staff_id,
        carerName: `Carer ${bk.staff_id?.slice(0, 8)}`, // Placeholder - would be resolved in real app
        carerInitials: "??",
        startTime,
        endTime,
        date,
        status: bk.status || "assigned",
        notes: "",
      };
      
      console.log("[useBookingOverlapCheck] Converted booking:", {
        id: booking.id,
        carerId: booking.carerId,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime
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
    console.log("[useBookingOverlapCheck] Checking overlap for:", {
      carerId,
      startTime,
      endTime,
      date,
      excludeBookingId,
      totalBookings: bookings.length
    });
    
    return checkBookingOverlaps(carerId, startTime, endTime, date, bookings, excludeBookingId);
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
