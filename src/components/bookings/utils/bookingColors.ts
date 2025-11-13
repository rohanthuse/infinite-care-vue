/**
 * Centralized booking status colors utility
 * Ensures consistent color scheme across all calendar views
 */

export const BOOKING_STATUS_COLORS = {
  assigned: {
    light: "bg-green-100 border-green-300 text-green-800",
    solid: "bg-green-500 border-green-600",
    label: "Assigned"
  },
  unassigned: {
    light: "bg-amber-100 border-amber-300 text-amber-800",
    solid: "bg-amber-500 border-amber-600",
    label: "Unassigned"
  },
  done: {
    light: "bg-blue-100 border-blue-300 text-blue-800",
    solid: "bg-blue-500 border-blue-600",
    label: "Done"
  },
  "in-progress": {
    light: "bg-purple-100 border-purple-300 text-purple-800",
    solid: "bg-purple-500 border-purple-600",
    label: "In Progress"
  },
  cancelled: {
    light: "bg-red-100 border-red-300 text-red-800",
    solid: "bg-red-500 border-red-600",
    label: "Cancelled"
  },
  departed: {
    light: "bg-teal-100 border-teal-300 text-teal-800",
    solid: "bg-teal-500 border-teal-600",
    label: "Departed"
  },
  suspended: {
    light: "bg-gray-100 border-gray-300 text-gray-800",
    solid: "bg-gray-500 border-gray-600",
    label: "Suspended"
  },
  training: {
    light: "bg-amber-50 border-amber-400 text-amber-900",
    solid: "bg-amber-500 border-amber-600",
    label: "Training"
  },
  meeting: {
    light: "bg-indigo-50 border-indigo-400 text-indigo-900",
    solid: "bg-indigo-500 border-indigo-600",
    label: "Meeting"
  }
} as const;

export type BookingStatusType = keyof typeof BOOKING_STATUS_COLORS;

/**
 * Get color classes for a booking status
 * @param status - The booking status
 * @param variant - Color variant (light for calendar blocks, solid for badges)
 * @returns CSS classes for the status color
 */
export function getBookingStatusColor(
  status: string, 
  variant: 'light' | 'solid' = 'light'
): string {
  // Handle special pseudo-statuses for calendar events
  if (status === 'off-shift') {
    return 'bg-gray-100 text-gray-400 border-gray-200';
  }

  const statusKey = status as BookingStatusType;
  return BOOKING_STATUS_COLORS[statusKey]?.[variant] || BOOKING_STATUS_COLORS.assigned[variant];
}

/**
 * Get label for a booking status
 * @param status - The booking status
 * @returns Human-readable label
 */
export function getBookingStatusLabel(status: string): string {
  const statusKey = status as BookingStatusType;
  return BOOKING_STATUS_COLORS[statusKey]?.label || status;
}
