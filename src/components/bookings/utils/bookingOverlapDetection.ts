
import { Booking } from "../BookingTimeGrid";

export interface BookingOverlap {
  hasOverlap: boolean;
  conflictingBookings: Array<{
    id: string;
    clientName: string;
    startTime: string;
    endTime: string;
    date: string;
  }>;
}

export function checkBookingOverlaps(
  carerId: string,
  proposedStartTime: string,
  proposedEndTime: string,
  proposedDate: string,
  existingBookings: Booking[],
  excludeBookingId?: string
): BookingOverlap {
  console.log("[checkBookingOverlaps] Starting overlap check:", {
    carerId,
    proposedStartTime,
    proposedEndTime,
    proposedDate,
    excludeBookingId,
    totalBookings: existingBookings.length
  });

  if (!carerId || !proposedStartTime || !proposedEndTime || !proposedDate) {
    console.log("[checkBookingOverlaps] Missing required parameters");
    return { hasOverlap: false, conflictingBookings: [] };
  }

  // Filter bookings for the specific carer on the same date
  const carerBookingsOnDate = existingBookings.filter(
    booking => {
      const matches = booking.carerId === carerId && booking.date === proposedDate;
      console.log("[checkBookingOverlaps] Booking filter check:", {
        bookingId: booking.id,
        bookingCarerId: booking.carerId,
        bookingDate: booking.date,
        targetCarerId: carerId,
        targetDate: proposedDate,
        matches
      });
      return matches;
    }
  );

  console.log("[checkBookingOverlaps] Found carer bookings on date:", carerBookingsOnDate.length);

  const conflictingBookings = carerBookingsOnDate.filter(booking => {
    // Exclude the current booking being edited
    if (excludeBookingId && booking.id === excludeBookingId) {
      console.log("[checkBookingOverlaps] Excluding current booking:", booking.id);
      return false;
    }

    // Convert time strings to minutes for easier comparison
    const proposedStart = timeToMinutes(proposedStartTime);
    const proposedEnd = timeToMinutes(proposedEndTime);
    const existingStart = timeToMinutes(booking.startTime);
    const existingEnd = timeToMinutes(booking.endTime);

    // Check for time overlap
    const hasOverlap = (proposedStart < existingEnd && proposedEnd > existingStart);
    
    console.log("[checkBookingOverlaps] Time overlap check:", {
      bookingId: booking.id,
      proposedStart,
      proposedEnd,
      existingStart,
      existingEnd,
      hasOverlap
    });

    return hasOverlap;
  });

  console.log("[checkBookingOverlaps] Final result:", {
    hasOverlap: conflictingBookings.length > 0,
    conflictingCount: conflictingBookings.length
  });

  return {
    hasOverlap: conflictingBookings.length > 0,
    conflictingBookings: conflictingBookings.map(booking => ({
      id: booking.id,
      clientName: booking.clientName,
      startTime: booking.startTime,
      endTime: booking.endTime,
      date: booking.date,
    }))
  };
}

export function getAvailableCarers(
  carers: Array<{ id: string; name: string; initials: string }>,
  proposedStartTime: string,
  proposedEndTime: string,
  proposedDate: string,
  existingBookings: Booking[],
  excludeBookingId?: string
): Array<{ id: string; name: string; initials: string }> {
  console.log("[getAvailableCarers] Checking availability for", carers.length, "carers");
  
  return carers.filter(carer => {
    const overlap = checkBookingOverlaps(
      carer.id,
      proposedStartTime,
      proposedEndTime,
      proposedDate,
      existingBookings,
      excludeBookingId
    );
    
    const isAvailable = !overlap.hasOverlap;
    console.log("[getAvailableCarers] Carer availability:", {
      carerId: carer.id,
      carerName: carer.name,
      isAvailable
    });
    
    return isAvailable;
  });
}

function timeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}
