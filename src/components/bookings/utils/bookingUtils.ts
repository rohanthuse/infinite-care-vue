
import { Booking } from "../BookingTimeGrid";

// Helper: Pure string-based date-time combination (no Date objects or timezone conversions)
export function createBookingDateTime(dateString: string, timeString: string): string {
  // Extract date from string (handle both ISO dates and simple YYYY-MM-DD format)
  const dateStr = dateString.includes('T') ? dateString.split('T')[0] : dateString;
  
  // Ensure time is properly formatted
  const [h, m] = timeString.split(':');
  const formattedHour = h.padStart(2, '0');
  const formattedMinute = m.padStart(2, '0');
  
  // Simple string concatenation - no timezone processing
  return `${dateStr}T${formattedHour}:${formattedMinute}:00`;
}

// Helper: Add days to a date string without Date objects
export function addDaysToDateString(dateString: string, days: number): string {
  // Parse date string manually
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Create date only for arithmetic, then extract result as string
  const tempDate = new Date(year, month - 1, day);
  tempDate.setDate(tempDate.getDate() + days);
  
  const resultYear = tempDate.getFullYear();
  const resultMonth = String(tempDate.getMonth() + 1).padStart(2, '0');
  const resultDay = String(tempDate.getDate()).padStart(2, '0');
  
  return `${resultYear}-${resultMonth}-${resultDay}`;
}

// Helper: Get day of week from date string (0 = Sunday, 1 = Monday, etc.)
export function getDayOfWeekFromString(dateString: string): number {
  const [year, month, day] = dateString.split('-').map(Number);
  const tempDate = new Date(year, month - 1, day);
  return tempDate.getDay();
}

// Legacy function - use createBookingDateTime instead
export function combineDateAndTimeToISO(date: Date, time: string): string {
  console.warn('combineDateAndTimeToISO is deprecated, use createBookingDateTime with string dates');
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return createBookingDateTime(`${yyyy}-${mm}-${dd}`, time);
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
