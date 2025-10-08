import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CalendarEvent } from '@/types/calendar';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { useTenant } from '@/contexts/TenantContext';
import { createTenantQuery } from '@/hooks/useTenantAware';

interface UseOrganizationCalendarParams {
  date: Date;
  viewType: 'daily' | 'weekly' | 'monthly';
  searchTerm?: string;
  branchId?: string;
  eventType?: string;
}

const fetchOrganizationCalendarEvents = async (params: UseOrganizationCalendarParams & { organizationId: string }): Promise<CalendarEvent[]> => {
  console.log('[fetchOrganizationCalendarEvents] Fetching events with params:', params);
  
  const { date, viewType, searchTerm, branchId, eventType, organizationId } = params;
  
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
    // Create tenant-aware query helper
    const tenantQuery = createTenantQuery(organizationId);
    
    // First, get all branch IDs for this organization to ensure proper data isolation
    const { data: organizationBranches, error: branchesError } = await supabase
      .from('branches')
      .select('id')
      .eq('organization_id', organizationId);

    if (branchesError) {
      console.error('[fetchOrganizationCalendarEvents] Error fetching branches:', branchesError);
      throw branchesError;
    }

    // If organization has no branches, return empty array
    if (!organizationBranches || organizationBranches.length === 0) {
      console.log('[fetchOrganizationCalendarEvents] Organization has no branches, returning empty events');
      return [];
    }

    const organizationBranchIds = organizationBranches.map(branch => branch.id);
    console.log('[fetchOrganizationCalendarEvents] Organization branch IDs:', organizationBranchIds);

    // Filter by specific branch if provided, otherwise use all organization branches
    const targetBranchIds = branchId ? [branchId] : organizationBranchIds;
    
    // Fetch bookings with proper organization isolation using branch IDs
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
          name,
          organization_id
        ),
        services (
          id,
          title
        )
      `)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .in('branch_id', targetBranchIds)
      .order('start_time', { ascending: true });

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
          }] : [{
            id: 'unassigned',
            name: 'Needs Carer Assignment',
            role: 'staff'
          }])
        ],
        location: booking.branches?.name,
        priority: 'medium' as const,
        clientId: booking.client_id,
        staffIds: booking.staff_id ? [booking.staff_id] : []
      }));
      
    events.push(...bookingEvents);
    }

    // Fetch scheduled agreements
    if (!eventType || eventType === 'all' || eventType === 'agreement') {
      try {
        const { data: agreements, error: agreementsError } = await supabase
          .from('scheduled_agreements')
          .select(`
            id,
            title,
            scheduled_for,
            scheduled_with_name,
            scheduled_with_client_id,
            scheduled_with_staff_id,
            branch_id,
            notes,
            status,
            agreement_types (
              name
            ),
            branches (
              name
            )
          `)
          .gte('scheduled_for', startDate.toISOString().split('T')[0])
          .lte('scheduled_for', endDate.toISOString().split('T')[0])
          .in('branch_id', targetBranchIds)
          .order('scheduled_for', { ascending: true });

        if (agreementsError) {
          console.error('[fetchOrganizationCalendarEvents] Agreements error:', agreementsError);
        } else if (agreements) {
          const agreementEvents = agreements.map(agreement => ({
            id: agreement.id,
            type: 'agreement' as const,
            title: agreement.title || 'Agreement Meeting',
            startTime: new Date(`${agreement.scheduled_for}T09:00:00`),
            endTime: new Date(`${agreement.scheduled_for}T10:00:00`),
            status: (agreement.status as 'scheduled' | 'in-progress' | 'completed' | 'cancelled') || 'scheduled',
            branchId: agreement.branch_id,
            branchName: agreement.branches?.name || 'Unknown Branch',
            participants: agreement.scheduled_with_name ? [{
              id: agreement.scheduled_with_client_id || agreement.scheduled_with_staff_id || '',
              name: agreement.scheduled_with_name,
              role: agreement.scheduled_with_client_id ? 'client' : 'staff'
            }] : [],
            location: agreement.branches?.name,
            priority: 'medium' as const,
            clientId: agreement.scheduled_with_client_id,
            staffIds: agreement.scheduled_with_staff_id ? [agreement.scheduled_with_staff_id] : []
          }));
          
          events.push(...agreementEvents);
        }
      } catch (error) {
        console.error('[fetchOrganizationCalendarEvents] Agreements fetch error:', error);
      }
    }

    // Fetch staff training records
    if (!eventType || eventType === 'all' || eventType === 'training') {
      try {
        const { data: trainings, error: trainingsError } = await supabase
          .from('staff_training_records')
          .select(`
            id,
            assigned_date,
            completion_date,
            status,
            staff_id,
            branch_id,
            training_course_id,
            staff (
              first_name,
              last_name
            ),
            branches (
              name
            )
          `)
          .gte('assigned_date', startDate.toISOString().split('T')[0])
          .lte('assigned_date', endDate.toISOString().split('T')[0])
          .in('branch_id', targetBranchIds)
          .order('assigned_date', { ascending: true });

        if (trainingsError) {
          console.error('[fetchOrganizationCalendarEvents] Trainings error:', trainingsError);
        } else if (trainings) {
          const trainingEvents = trainings.map(training => ({
            id: training.id,
            type: 'training' as const,
            title: `Training Session`,
            startTime: new Date(`${training.assigned_date}T14:00:00`),
            endTime: new Date(`${training.assigned_date}T16:00:00`),
            status: (training.status as 'scheduled' | 'in-progress' | 'completed' | 'cancelled') || 'scheduled',
            branchId: training.branch_id,
            branchName: training.branches?.name || 'Unknown Branch',
            participants: training.staff ? [{
              id: training.staff_id,
              name: `${training.staff.first_name} ${training.staff.last_name}`,
              role: 'staff'
            }] : [],
            location: training.branches?.name,
            priority: 'medium' as const,
            staffIds: [training.staff_id]
          }));
          
          events.push(...trainingEvents);
        }
      } catch (error) {
        console.error('[fetchOrganizationCalendarEvents] Trainings fetch error:', error);
      }
    }

    // Fetch annual leave calendar events
    if (!eventType || eventType === 'all' || eventType === 'leave') {
      try {
        const { data: leaves, error: leavesError } = await supabase
          .from('annual_leave_calendar')
          .select(`
            id,
            leave_name,
            leave_date,
            is_company_wide,
            is_recurring,
            branch_id,
            branches (
              name
            )
          `)
          .gte('leave_date', startDate.toISOString().split('T')[0])
          .lte('leave_date', endDate.toISOString().split('T')[0])
          .or(`branch_id.in.(${targetBranchIds.join(',')}),is_company_wide.eq.true`)
          .order('leave_date', { ascending: true });

        if (leavesError) {
          console.error('[fetchOrganizationCalendarEvents] Leaves error:', leavesError);
        } else if (leaves) {
          const leaveEvents = leaves.map(leave => ({
            id: leave.id,
            type: 'leave' as const,
            title: leave.leave_name,
            startTime: new Date(`${leave.leave_date}T00:00:00`),
            endTime: new Date(`${leave.leave_date}T23:59:59`),
            status: 'scheduled' as const,
            branchId: leave.branch_id || targetBranchIds[0],
            branchName: leave.is_company_wide ? 'Company-wide' : (leave.branches?.name || 'Unknown Branch'),
            participants: [],
            location: leave.is_company_wide ? 'All Locations' : leave.branches?.name,
            priority: 'low' as const,
            staffIds: []
          }));
          
          events.push(...leaveEvents);
        }
      } catch (error) {
        console.error('[fetchOrganizationCalendarEvents] Leaves fetch error:', error);
      }
    }

    // Fetch client appointments
    if (!eventType || eventType === 'all' || eventType === 'meeting') {
      try {
        const { data: appointments, error: appointmentsError } = await supabase
          .from('client_appointments')
          .select(`
            id,
            appointment_type,
            provider_name,
            appointment_date,
            appointment_time,
            location,
            status,
            client_id,
            clients (
              first_name,
              last_name,
              branch_id
            )
          `)
          .gte('appointment_date', startDate.toISOString().split('T')[0])
          .lte('appointment_date', endDate.toISOString().split('T')[0])
          .order('appointment_date', { ascending: true });

        if (appointmentsError) {
          console.error('[fetchOrganizationCalendarEvents] Appointments error:', appointmentsError);
        } else if (appointments) {
          const appointmentEvents = appointments
            .filter(appointment => appointment.clients && targetBranchIds.includes(appointment.clients.branch_id))
            .map(appointment => ({
              id: appointment.id,
              type: 'meeting' as const,
              title: `${appointment.appointment_type} - ${appointment.provider_name}`,
              startTime: new Date(`${appointment.appointment_date}T${appointment.appointment_time}`),
              endTime: new Date(`${appointment.appointment_date}T${appointment.appointment_time}`),
              status: (appointment.status as 'scheduled' | 'in-progress' | 'completed' | 'cancelled') || 'scheduled',
              branchId: appointment.clients?.branch_id || targetBranchIds[0],
              branchName: 'External Appointment',
              participants: appointment.clients ? [{
                id: appointment.client_id,
                name: `${appointment.clients.first_name} ${appointment.clients.last_name}`,
                role: 'client'
              }] : [],
              location: appointment.location || 'External',
              priority: 'medium' as const,
              clientId: appointment.client_id,
              staffIds: []
            }));
          
          events.push(...appointmentEvents);
        }
      } catch (error) {
        console.error('[fetchOrganizationCalendarEvents] Appointments fetch error:', error);
      }
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

      // Add conflict detection
      const eventsWithConflicts = searchFilteredEvents.map(event => {
        const conflicts: string[] = [];
        
        // Check for overlapping events with same staff
        searchFilteredEvents.forEach(otherEvent => {
          if (event.id !== otherEvent.id) {
            // Check if events have overlapping staff and time
            const hasCommonStaff = event.staffIds.some(staffId => otherEvent.staffIds.includes(staffId));
            
            if (hasCommonStaff) {
              const start1 = new Date(event.startTime);
              const end1 = new Date(event.endTime);
              const start2 = new Date(otherEvent.startTime);
              const end2 = new Date(otherEvent.endTime);
              
              // Check for time overlap
              if (start1 < end2 && start2 < end1) {
                conflicts.push(otherEvent.id);
              }
            }
          }
        });
        
        return {
          ...event,
          conflictsWith: conflicts
        };
      });

      console.log('[fetchOrganizationCalendarEvents] Successfully fetched', eventsWithConflicts.length, 'events with conflicts detected');
      return eventsWithConflicts;

  } catch (error) {
    console.error('[fetchOrganizationCalendarEvents] Error:', error);
    throw error;
  }
};

export const useOrganizationCalendar = (params: UseOrganizationCalendarParams) => {
  const { organization } = useTenant();
  
  return useQuery({
    queryKey: ['organization-calendar', params, organization?.id],
    queryFn: () => {
      if (!organization?.id) {
        throw new Error('Organization context required for organization calendar');
      }
      return fetchOrganizationCalendarEvents({ ...params, organizationId: organization.id });
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: true,
  });
};