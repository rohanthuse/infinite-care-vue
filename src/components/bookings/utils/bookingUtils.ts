
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
  
  // Validate input
  if (!year || !month || !day) {
    console.error("[addDaysToDateString] Invalid date string:", dateString);
    return dateString;
  }
  
  // Use UTC to avoid timezone issues
  const tempDate = new Date(Date.UTC(year, month - 1, day));
  tempDate.setUTCDate(tempDate.getUTCDate() + days);
  
  const resultYear = tempDate.getUTCFullYear();
  const resultMonth = String(tempDate.getUTCMonth() + 1).padStart(2, '0');
  const resultDay = String(tempDate.getUTCDate()).padStart(2, '0');
  
  const result = `${resultYear}-${resultMonth}-${resultDay}`;
  
  console.log("[addDaysToDateString] Added", days, "days to", dateString, "->", result);
  
  return result;
}

// Helper: Get day of week from date string (0 = Sunday, 1 = Monday, etc.)
export function getDayOfWeekFromString(dateString: string): number {
  // Use UTC to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Validate the date components
  if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
    console.error("[getDayOfWeekFromString] Invalid date components:", { year, month, day, dateString });
    return 0; // Default to Sunday
  }
  
  // Create UTC date to avoid timezone shifts
  const tempDate = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = tempDate.getUTCDay();
  
  console.log("[getDayOfWeekFromString] Input:", dateString, "-> Components:", { year, month, day }, 
    "-> UTC Date:", tempDate.toISOString(), "-> Day of week:", dayOfWeek, 
    "(" + ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek] + ")");
  
  return dayOfWeek;
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
