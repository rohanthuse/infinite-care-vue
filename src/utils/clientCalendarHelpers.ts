import { CalendarEvent } from '@/types/calendar';

// Transform appointment to CalendarEvent format
export function appointmentToCalendarEvent(appointment: any): CalendarEvent {
  const startDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
  
  // Calculate end time (default to +1 hour if not available)
  let endDateTime: Date;
  if (appointment._booking_data?.end_time) {
    endDateTime = new Date(appointment._booking_data.end_time);
  } else {
    endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);
  }
  
  return {
    id: appointment.id,
    type: appointment._source === 'booking' ? 'booking' : 'meeting',
    title: appointment.appointment_type,
    startTime: startDateTime,
    endTime: endDateTime,
    participants: [{
      id: appointment.provider_name,
      name: appointment.provider_name,
      role: 'provider'
    }],
    location: appointment.location,
    status: mapAppointmentStatus(appointment.status),
    branchId: appointment.branch_id || '',
    branchName: appointment.location,
    staffIds: appointment._booking_data?.staff_id ? [appointment._booking_data.staff_id] : [],
    priority: 'medium',
    clientId: appointment.client_id,
    _rawAppointmentData: {
      id: appointment.id,
      appointment_type: appointment.appointment_type,
      provider_name: appointment.provider_name,
      appointment_date: appointment.appointment_date,
      appointment_time: appointment.appointment_time,
      location: appointment.location,
      client_id: appointment.client_id,
      branch_id: appointment.branch_id,
      organization_id: appointment.organization_id,
      cancellation_request_status: appointment.cancellation_request_status,
      reschedule_request_status: appointment.reschedule_request_status
    }
  };
}

// Map appointment status to CalendarEvent status
function mapAppointmentStatus(status: string): 'scheduled' | 'in-progress' | 'completed' | 'cancelled' {
  const statusMap: Record<string, 'scheduled' | 'in-progress' | 'completed' | 'cancelled'> = {
    'scheduled': 'scheduled',
    'assigned': 'scheduled',
    'confirmed': 'scheduled',
    'in-progress': 'in-progress',
    'completed': 'completed',
    'done': 'completed',
    'cancelled': 'cancelled'
  };
  
  return statusMap[status?.toLowerCase()] || 'scheduled';
}

// Get status badge color
export function getAppointmentStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    'scheduled': 'bg-blue-100 text-blue-800 border-blue-200',
    'assigned': 'bg-purple-100 text-purple-800 border-purple-200',
    'confirmed': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'completed': 'bg-gray-100 text-gray-800 border-gray-200',
    'done': 'bg-green-100 text-green-800 border-green-200',
    'cancelled': 'bg-red-100 text-red-800 border-red-200'
  };
  return statusColors[status?.toLowerCase()] || 'bg-secondary text-secondary-foreground';
}

// Get event type color for calendar display
export function getEventTypeColor(source: string): string {
  return source === 'booking' ? 'hsl(var(--primary))' : 'hsl(var(--accent))';
}

// Get event type badge color
export function getEventTypeBadgeColor(source: string): string {
  return source === 'booking' 
    ? 'bg-blue-100 text-blue-800 border-blue-200' 
    : 'bg-purple-100 text-purple-800 border-purple-200';
}

// Get calendar event color based on request status
export function getEventColorByRequestStatus(
  cancellationStatus?: string | null,
  rescheduleStatus?: string | null,
  defaultColor?: string
): string {
  if (cancellationStatus === 'pending') {
    return '#fb923c'; // Orange for pending cancellation
  }
  if (rescheduleStatus === 'pending') {
    return '#3b82f6'; // Blue for pending reschedule
  }
  return defaultColor || 'hsl(var(--primary))';
}
