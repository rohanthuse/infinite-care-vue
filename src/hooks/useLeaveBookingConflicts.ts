import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";

export interface AffectedBooking {
  id: string;
  client_id: string;
  client_name: string;
  booking_date: string;
  formatted_date: string;
  start_time: string;
  end_time: string;
  scheduled_time: string;
  status: string;
  service_name?: string;
  is_recurring: boolean;
}

export interface LeaveBookingConflictResult {
  affectedBookings: AffectedBooking[];
  totalConflicts: number;
  isLoading: boolean;
  error: Error | null;
}

export function useLeaveBookingConflicts(
  staffId: string | undefined,
  startDate: string | undefined,
  endDate: string | undefined,
  enabled: boolean = true
): LeaveBookingConflictResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ['leave-booking-conflicts', staffId, startDate, endDate],
    queryFn: async () => {
      if (!staffId || !startDate || !endDate) {
        return [];
      }

      console.log('[useLeaveBookingConflicts] Checking conflicts for staff:', staffId, 'from', startDate, 'to', endDate);

      // Query bookings that overlap with the leave period
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          client_id,
          start_time,
          end_time,
          status,
          service_id,
          clients (
            id,
            first_name,
            last_name
          ),
          services (
            id,
            title
          )
        `)
        .eq('staff_id', staffId)
        .gte('start_time', `${startDate}T00:00:00`)
        .lte('start_time', `${endDate}T23:59:59`)
        .not('status', 'in', '("cancelled","completed")');

      if (bookingsError) {
        console.error('[useLeaveBookingConflicts] Error fetching bookings:', bookingsError);
        throw bookingsError;
      }

      console.log('[useLeaveBookingConflicts] Found bookings:', bookings?.length || 0);

      // Transform bookings to AffectedBooking format
      const affectedBookings: AffectedBooking[] = (bookings || []).map(booking => {
        const startTime = parseISO(booking.start_time);
        const endTime = parseISO(booking.end_time);
        const bookingDate = format(startTime, 'yyyy-MM-dd');
        
        return {
          id: booking.id,
          client_id: booking.client_id || '',
          client_name: booking.clients 
            ? `${booking.clients.first_name} ${booking.clients.last_name}` 
            : 'Unknown Client',
          booking_date: bookingDate,
          formatted_date: format(startTime, 'EEE, dd MMM yyyy'),
          start_time: booking.start_time,
          end_time: booking.end_time,
          scheduled_time: `${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`,
          status: booking.status || 'scheduled',
          service_name: booking.services?.title || undefined,
          is_recurring: false // Could be enhanced to check if part of recurring series
        };
      });

      // Sort by date
      affectedBookings.sort((a, b) => 
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );

      return affectedBookings;
    },
    enabled: enabled && Boolean(staffId) && Boolean(startDate) && Boolean(endDate),
    staleTime: 30000, // 30 seconds
  });

  return {
    affectedBookings: data || [],
    totalConflicts: data?.length || 0,
    isLoading,
    error: error as Error | null
  };
}
