import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CalendarEvent } from '@/types/calendar';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

interface UseOrganizationCalendarParams {
  date: Date;
  viewType: 'daily' | 'weekly' | 'monthly';
  searchTerm?: string;
  branchId?: string;
  eventType?: string;
}

const fetchOrganizationCalendarEvents = async (params: UseOrganizationCalendarParams): Promise<CalendarEvent[]> => {
  console.log('[fetchOrganizationCalendarEvents] Fetching events with params:', params);
  
  const { date, viewType, searchTerm, branchId, eventType } = params;
  
  // Determine date range based on view type
  let startDate: Date;
  let endDate: Date;
  
  switch (viewType) {
    case 'daily':
      startDate = startOfDay(date);
      endDate = endOfDay(date);
      break;
    case 'weekly':
      startDate = startOfWeek(date, { weekStartsOn: 1 });
      endDate = endOfWeek(date, { weekStartsOn: 1 });
      break;
    case 'monthly':
      startDate = startOfMonth(date);
      endDate = endOfMonth(date);
      break;
    default:
      startDate = startOfDay(date);
      endDate = endOfDay(date);
  }

  const events: CalendarEvent[] = [];

  try {
    // Fetch bookings
    let bookingsQuery = supabase
      .from('bookings')
      .select(`
        id,
        start_time,
        end_time,
        status,
        notes,
        client_id,
        staff_id,
        branch_id,
        service_id,
        clients (
          id,
          first_name,
          last_name
        ),
        staff (
          id,
          first_name,
          last_name
        ),
        branches (
          id,
          name
        ),
        services (
          id,
          title
        )
      `)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .order('start_time', { ascending: true });

    if (branchId) {
      bookingsQuery = bookingsQuery.eq('branch_id', branchId);
    }

    const { data: bookings, error: bookingsError } = await bookingsQuery;

    if (bookingsError) {
      console.error('[fetchOrganizationCalendarEvents] Bookings error:', bookingsError);
    } else if (bookings) {
      const bookingEvents = bookings.map(booking => ({
        id: booking.id,
        type: 'booking' as const,
        title: booking.clients 
          ? `${booking.clients.first_name} ${booking.clients.last_name}` 
          : 'Appointment',
        startTime: new Date(booking.start_time),
        endTime: new Date(booking.end_time),
        status: (booking.status as 'scheduled' | 'in-progress' | 'completed' | 'cancelled') || 'scheduled',
        branchId: booking.branch_id,
        branchName: booking.branches?.name || 'Unknown Branch',
        participants: [
          ...(booking.clients ? [{
            id: booking.clients.id,
            name: `${booking.clients.first_name} ${booking.clients.last_name}`,
            role: 'client'
          }] : []),
          ...(booking.staff ? [{
            id: booking.staff.id,
            name: `${booking.staff.first_name} ${booking.staff.last_name}`,
            role: 'staff'
          }] : [])
        ],
        location: booking.branches?.name,
        priority: 'medium' as const,
        clientId: booking.client_id,
        staffIds: booking.staff_id ? [booking.staff_id] : []
      }));
      
      events.push(...bookingEvents);
    }

    // Filter by event type if specified
    const filteredEvents = eventType && eventType !== 'all' 
      ? events.filter(event => event.type === eventType)
      : events;

    // Filter by search term if specified
    const searchFilteredEvents = searchTerm
      ? filteredEvents.filter(event => 
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.branchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.participants?.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      : filteredEvents;

    console.log('[fetchOrganizationCalendarEvents] Successfully fetched', searchFilteredEvents.length, 'events');
    return searchFilteredEvents;

  } catch (error) {
    console.error('[fetchOrganizationCalendarEvents] Error:', error);
    throw error;
  }
};

export const useOrganizationCalendar = (params: UseOrganizationCalendarParams) => {
  return useQuery({
    queryKey: ['organization-calendar', params],
    queryFn: () => fetchOrganizationCalendarEvents(params),
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: true,
  });
};