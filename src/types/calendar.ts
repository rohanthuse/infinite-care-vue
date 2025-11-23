export interface CalendarEvent {
  id: string;
  type: 'booking' | 'meeting' | 'leave' | 'training' | 'agreement';
  title: string;
  startTime: Date;
  endTime: Date;
  participants: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  location?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  branchId: string;
  branchName: string;
  clientId?: string;
  staffIds: string[];
  priority: 'low' | 'medium' | 'high';
  conflictsWith?: string[];
  _rawAppointmentData?: {
    id: string;
    appointment_type: string;
    provider_name: string;
    appointment_date: string;
    appointment_time: string;
    location: string;
    client_id?: string;
    branch_id?: string;
    organization_id?: string;
  };
}

export interface CalendarFilters {
  searchTerm: string;
  branchId?: string;
  eventType?: string;
  staffId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface CalendarViewProps {
  date: Date;
  events?: CalendarEvent[];
  isLoading?: boolean;
  onEventClick?: (event: CalendarEvent) => void;
  onTimeSlotClick?: (date: Date, hour?: number) => void;
}