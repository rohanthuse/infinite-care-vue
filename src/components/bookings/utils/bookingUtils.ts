
import { Booking } from "../BookingTimeGrid";

// Helper: Combine date and time to ISO (timezone-aware)
export function combineDateAndTimeToISO(date: Date, time: string): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  let [h, m] = time.split(':');
  h = h.padStart(2, '0');
  m = m.padStart(2, '0');
  // Create local datetime without forcing UTC - let the database handle timezone conversion
  return `${yyyy}-${mm}-${dd}T${h}:${m}:00`;
}

// Filter bookings by search and status
export function filterBookings(
  bookings: Booking[], 
  searchQuery: string, 
  selectedStatuses: string[]
) {
  return bookings.filter(bk => {
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(bk.status);
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (bk.clientName && bk.clientName.toLowerCase().includes(q)) ||
      (bk.carerName && bk.carerName.toLowerCase().includes(q)) ||
      (bk.clientInitials && bk.clientInitials.toLowerCase().includes(q)) ||
      (bk.carerInitials && bk.carerInitials.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });
}

// Get status counts for filters
export function getStatusCounts(bookings: Booking[]): Record<string, number> {
  return bookings.reduce<Record<string, number>>((acc, booking) => {
    acc[booking.status] = (acc[booking.status] || 0) + 1;
    return acc;
  }, {});
}
