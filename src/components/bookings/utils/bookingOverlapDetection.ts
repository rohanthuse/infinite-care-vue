
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
  console.log("[checkBookingOverlaps] === OVERLAP DETECTION START ===");
  console.log("[checkBookingOverlaps] Input parameters:", {
    carerId,
    proposedStartTime,
    proposedEndTime,
    proposedDate,
    excludeBookingId,
    totalBookings: existingBookings.length
  });

  if (!carerId || !proposedStartTime || !proposedEndTime || !proposedDate) {
    console.log("[checkBookingOverlaps] ERROR: Missing required parameters");
    return { hasOverlap: false, conflictingBookings: [] };
  }

  // Filter bookings for the specific carer on the same date
  console.log("[checkBookingOverlaps] Filtering bookings for carer:", carerId, "on date:", proposedDate);
  const carerBookingsOnDate = existingBookings.filter(
    booking => {
      const carerMatches = booking.carerId === carerId;
      const dateMatches = booking.date === proposedDate;
      const matches = carerMatches && dateMatches;
      
      console.log("[checkBookingOverlaps] Booking filter check:", {
        bookingId: booking.id,
        bookingCarerId: booking.carerId,
        bookingDate: booking.date,
        targetCarerId: carerId,
        targetDate: proposedDate,
        carerMatches,
        dateMatches,
        matches,
        bookingStartTime: booking.startTime,
        bookingEndTime: booking.endTime
      });
      
      return matches;
    }
  );

  console.log("[checkBookingOverlaps] Found", carerBookingsOnDate.length, "bookings for carer on date");
  console.log("[checkBookingOverlaps] Carer bookings on date:", carerBookingsOnDate.map(b => ({
    id: b.id,
    startTime: b.startTime,
    endTime: b.endTime,
    clientName: b.clientName
  })));

  const conflictingBookings = carerBookingsOnDate.filter(booking => {
    // Exclude the current booking being edited
    if (excludeBookingId) {
      const shouldExclude = String(booking.id) === String(excludeBookingId);
      console.log("[checkBookingOverlaps] Exclusion check:", {
        bookingId: booking.id,
        excludeBookingId,
        bookingIdType: typeof booking.id,
        excludeIdType: typeof excludeBookingId,
        stringComparison: String(booking.id) === String(excludeBookingId),
        shouldExclude
      });
      
      if (shouldExclude) {
        console.log("[checkBookingOverlaps] EXCLUDING current booking:", booking.id);
        return false;
      }
    }

    // Convert time strings to minutes for easier comparison
    const proposedStart = timeToMinutes(proposedStartTime);
    const proposedEnd = timeToMinutes(proposedEndTime);
    const existingStart = timeToMinutes(booking.startTime);
    const existingEnd = timeToMinutes(booking.endTime);

    // Check for time overlap: overlaps if (start1 < end2 && end1 > start2)
    const hasOverlap = (proposedStart < existingEnd && proposedEnd > existingStart);
    
    console.log("[checkBookingOverlaps] Time overlap analysis:", {
      bookingId: booking.id,
      proposedTimeRange: `${proposedStartTime} - ${proposedEndTime}`,
      existingTimeRange: `${booking.startTime} - ${booking.endTime}`,
      proposedStart,
      proposedEnd,
      existingStart,
      existingEnd,
      condition1: proposedStart < existingEnd,
      condition2: proposedEnd > existingStart,
      hasOverlap,
      clientName: booking.clientName,
      bookingStatus: booking.status || 'unknown'
    });

    return hasOverlap;
  });

  const result = {
    hasOverlap: conflictingBookings.length > 0,
    conflictingBookings: conflictingBookings.map(booking => ({
      id: booking.id,
      clientName: booking.clientName,
      startTime: booking.startTime,
      endTime: booking.endTime,
      date: booking.date,
    }))
  };

  console.log("[checkBookingOverlaps] === FINAL RESULT ===");
  console.log("[checkBookingOverlaps] Conflicts found:", result.hasOverlap);
  console.log("[checkBookingOverlaps] Number of conflicts:", conflictingBookings.length);
  console.log("[checkBookingOverlaps] Conflicting bookings:", result.conflictingBookings);
  console.log("[checkBookingOverlaps] === OVERLAP DETECTION END ===");

  return result;
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
      isAvailable,
      conflicts: overlap.conflictingBookings.length
    });
    
    return isAvailable;
  });
}

function timeToMinutes(timeString: string): number {
  if (!timeString || typeof timeString !== 'string') {
    console.log("[timeToMinutes] Invalid time string:", timeString);
    return 0;
  }
  
  const [hours, minutes] = timeString.split(':').map(Number);
  
  if (isNaN(hours) || isNaN(minutes)) {
    console.log("[timeToMinutes] Failed to parse time:", timeString);
    return 0;
  }
  
  const result = hours * 60 + minutes;
  console.log("[timeToMinutes] Converted", timeString, "to", result, "minutes");
  return result;
}
