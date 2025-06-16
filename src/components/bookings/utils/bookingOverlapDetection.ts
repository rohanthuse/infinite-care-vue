
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
  existingBookings: Booking[]
): BookingOverlap {
  if (!carerId || !proposedStartTime || !proposedEndTime || !proposedDate) {
    return { hasOverlap: false, conflictingBookings: [] };
  }

  // Filter bookings for the specific carer on the same date
  const carerBookingsOnDate = existingBookings.filter(
    booking => 
      booking.carerId === carerId && 
      booking.date === proposedDate
  );

  const conflictingBookings = carerBookingsOnDate.filter(booking => {
    // Convert time strings to minutes for easier comparison
    const proposedStart = timeToMinutes(proposedStartTime);
    const proposedEnd = timeToMinutes(proposedEndTime);
    const existingStart = timeToMinutes(booking.startTime);
    const existingEnd = timeToMinutes(booking.endTime);

    // Check for time overlap
    return (proposedStart < existingEnd && proposedEnd > existingStart);
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
  existingBookings: Booking[]
): Array<{ id: string; name: string; initials: string }> {
  return carers.filter(carer => {
    const overlap = checkBookingOverlaps(
      carer.id,
      proposedStartTime,
      proposedEndTime,
      proposedDate,
      existingBookings
    );
    return !overlap.hasOverlap;
  });
}

function timeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}
