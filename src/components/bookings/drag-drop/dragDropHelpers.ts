/**
 * Helper functions for drag-and-drop booking management
 */

/**
 * Calculate time from Y position in pixels
 * @param yPosition - Y coordinate in pixels
 * @param hourHeight - Height of one hour in pixels (default: 60)
 * @param timeInterval - Time interval in minutes (default: 30)
 * @returns Time string in HH:MM format
 */
export function calculateTimeFromPosition(
  yPosition: number,
  hourHeight: number = 60,
  timeInterval: number = 30
): string {
  const SLOT_HEIGHT = hourHeight / (60 / timeInterval);
  
  // Snap to nearest slot
  const slotIndex = Math.round(yPosition / SLOT_HEIGHT);
  const totalMinutes = slotIndex * timeInterval;
  
  let hours = Math.floor(totalMinutes / 60);
  let minutes = totalMinutes % 60;
  
  // Clamp hours to valid range (0-23)
  hours = Math.max(0, Math.min(23, hours));
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Calculate duration between two time strings
 * @param startTime - Start time in HH:MM format
 * @param endTime - End time in HH:MM format
 * @returns Duration in minutes
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  let duration = endMinutes - startMinutes;
  
  // Handle midnight crossing
  if (duration < 0) {
    duration += 1440; // Add 24 hours
  }
  
  return duration;
}

/**
 * Add minutes to a time string
 * @param time - Time in HH:MM format
 * @param minutes - Minutes to add
 * @returns New time string in HH:MM format
 */
export function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  
  let newHours = Math.floor(totalMinutes / 60) % 24;
  let newMinutes = totalMinutes % 60;
  
  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
}

/**
 * Extract staff ID from droppable ID
 * @param droppableId - Droppable ID in format "staff-{staffId}" or "staff-{staffId}-{date}"
 * @returns Staff ID
 */
export function extractStaffIdFromDroppableId(droppableId: string): string {
  // Format: "staff-{uuid}"
  // Since UUIDs contain hyphens, we need to remove only the "staff-" prefix
  const match = droppableId.match(/^staff-(.+)$/);
  return match ? match[1] : '';
}

/**
 * Extract client ID from droppable ID
 * @param droppableId - Droppable ID in format "client-{clientId}"
 * @returns Client ID or empty string
 */
export function extractClientIdFromDroppableId(droppableId: string): string {
  // Format: "client-{uuid}"
  const match = droppableId.match(/^client-(.+)$/);
  return match ? match[1] : '';
}

/**
 * Extract date from droppable ID (for weekly view)
 * @param droppableId - Droppable ID in format "staff-{staffId}-{date}"
 * @returns Date string or null
 */
export function extractDateFromDroppableId(droppableId: string): string | null {
  const parts = droppableId.split('-');
  // Format: "staff-{uuid}-{date}"
  if (parts.length >= 3 && parts[0] === 'staff') {
    return parts.slice(2).join('-'); // In case date has dashes
  }
  return null;
}

/**
 * Parse time string to minutes from midnight
 * @param time - Time in HH:MM format
 * @returns Minutes from midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Check if two bookings overlap
 * @param start1 - Start time of first booking in HH:MM format
 * @param end1 - End time of first booking in HH:MM format
 * @param start2 - Start time of second booking in HH:MM format
 * @param end2 - End time of second booking in HH:MM format
 * @returns True if bookings overlap
 */
export function doBookingsOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const start1Mins = timeToMinutes(start1);
  const end1Mins = timeToMinutes(end1);
  const start2Mins = timeToMinutes(start2);
  const end2Mins = timeToMinutes(end2);
  
  return start1Mins < end2Mins && end1Mins > start2Mins;
}
