
import { useMemo } from "react";
import { useBranchBookings } from "@/data/hooks/useBranchBookings";
import { checkBookingOverlaps, getAvailableCarers, BookingOverlap } from "../utils/bookingOverlapDetection";
import { Booking } from "../BookingTimeGrid";

export function useBookingOverlapCheck(branchId?: string) {
  const { data: bookingsDB = [], isLoading } = useBranchBookings(branchId);

  // Convert DB bookings to our Booking format
  const bookings: Booking[] = useMemo(() => {
    return (bookingsDB || []).map((bk: any) => ({
      id: bk.id,
      clientId: bk.client_id,
      clientName: `Client ${bk.client_id?.slice(0, 8)}`, // Placeholder - would be resolved in real app
      clientInitials: "??",
      carerId: bk.staff_id,
      carerName: `Carer ${bk.staff_id?.slice(0, 8)}`, // Placeholder - would be resolved in real app
      carerInitials: "??",
      startTime: bk.start_time ? bk.start_time.slice(11, 16) : "07:00",
      endTime: bk.end_time ? bk.end_time.slice(11, 16) : "07:30",
      date: bk.start_time ? bk.start_time.slice(0, 10) : "",
      status: bk.status || "assigned",
      notes: "",
    }));
  }, [bookingsDB]);

  const checkOverlap = (
    carerId: string,
    startTime: string,
    endTime: string,
    date: string
  ): BookingOverlap => {
    return checkBookingOverlaps(carerId, startTime, endTime, date, bookings);
  };

  const findAvailableCarers = (
    carers: Array<{ id: string; name: string; initials: string }>,
    startTime: string,
    endTime: string,
    date: string
  ) => {
    return getAvailableCarers(carers, startTime, endTime, date, bookings);
  };

  return {
    checkOverlap,
    findAvailableCarers,
    isLoading,
    bookings
  };
}
