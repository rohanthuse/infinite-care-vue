import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CalendarEvent } from '@/types/calendar';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, getMonth, getDate } from 'date-fns';
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
  console.log('🔍 [fetchOrganizationCalendarEvents] ========== FETCH START ==========');
  console.log('🔍 [fetchOrganizationCalendarEvents] Params:', {
    date: format(params.date, 'yyyy-MM-dd'),
    viewType: params.viewType,
    searchTerm: params.searchTerm,
    branchId: params.branchId,
    eventType: params.eventType,
    organizationId: params.organizationId
  });
  
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
    // Use date-only comparison to avoid timezone issues with daily view
    const startDateStr = format(startDate, 'yyyy-MM-dd');
    const endDateStr = format(endDate, 'yyyy-MM-dd');
    
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
        is_late_start,
        is_missed,
        late_start_minutes,
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
        ),
        visit_records (
          visit_start_time,
          arrival_delay_minutes,
          late_arrival_reason
        )
      `)
      .gte('start_time', `${startDateStr}T00:00:00.000Z`)
      .lt('start_time', `${format(new Date(endDate.getTime() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd')}T00:00:00.000Z`)
      .in('branch_id', targetBranchIds)
      .order('start_time', { ascending: true });

    const { data: bookings, error: bookingsError } = await bookingsQuery;

    // Fetch branch admins for the target branches
    const { data: branchAdminLinks } = await supabase
      .from('admin_branches')
      .select('branch_id, admin_id')
      .in('branch_id', targetBranchIds);

    // Fetch profiles for the admin IDs
    const adminIds = branchAdminLinks?.map(a => a.admin_id) || [];
    const uniqueAdminIds = [...new Set(adminIds)];
    
    let adminProfiles: Array<{ id: string; first_name: string; last_name: string }> = [];
    if (uniqueAdminIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', uniqueAdminIds);
      adminProfiles = profiles || [];
    }

    // Create a map of branch_id -> admin names
    const branchAdminMap = new Map<string, Array<{ id: string; name: string }>>();
    if (branchAdminLinks) {
      branchAdminLinks.forEach(link => {
        const profile = adminProfiles.find(p => p.id === link.admin_id);
        if (profile && link.branch_id) {
          if (!branchAdminMap.has(link.branch_id)) {
            branchAdminMap.set(link.branch_id, []);
          }
          branchAdminMap.get(link.branch_id)!.push({
            id: profile.id,
            name: `${profile.first_name} ${profile.last_name}`
          });
        }
      });
    }

    if (bookingsError) {
      console.error('[fetchOrganizationCalendarEvents] Bookings error:', bookingsError);
    } else if (bookings) {
      // Group bookings by client_id + start_time + end_time + service_id to aggregate multi-carer assignments
      const bookingGroups = new Map<string, typeof bookings>();
      
      bookings.forEach(booking => {
        // Create a composite key for grouping related bookings
        const groupKey = `${booking.client_id || 'no-client'}-${booking.start_time}-${booking.end_time}-${booking.service_id || 'no-service'}`;
        
        if (!bookingGroups.has(groupKey)) {
          bookingGroups.set(groupKey, []);
        }
        bookingGroups.get(groupKey)!.push(booking);
      });
      
      // Create one CalendarEvent per group, aggregating all staff
      const bookingEvents = Array.from(bookingGroups.values()).map(groupedBookings => {
        const primaryBooking = groupedBookings[0];
        
        // JavaScript automatically converts UTC ISO strings to local timezone
        const startTime = new Date(primaryBooking.start_time);
        const endTime = new Date(primaryBooking.end_time);

        // Debug logging for timezone conversion verification
        console.log('[useOrganizationCalendar] Booking time conversion:', {
          bookingId: primaryBooking.id,
          raw_start_time: primaryBooking.start_time,
          raw_end_time: primaryBooking.end_time,
          parsed_start_time: startTime.toISOString(),
          parsed_end_time: endTime.toISOString(),
          local_start_time: format(startTime, 'yyyy-MM-dd HH:mm'),
          local_end_time: format(endTime, 'yyyy-MM-dd HH:mm'),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          totalCarers: groupedBookings.length
        });

        // Get visit record data if available
        const visitRecord = primaryBooking.visit_records?.[0];
        
        // Aggregate all staff from grouped bookings
        const allStaff: Array<{ id: string; name: string; role: string }> = [];
        const seenStaffIds = new Set<string>();
        
        groupedBookings.forEach(booking => {
          if (booking.staff && booking.staff_id && !seenStaffIds.has(booking.staff_id)) {
            seenStaffIds.add(booking.staff_id);
            allStaff.push({
              id: booking.staff.id,
              name: `${booking.staff.first_name} ${booking.staff.last_name}`,
              role: 'carer'
            });
          }
        });
        
        // If no staff assigned, add placeholder
        if (allStaff.length === 0) {
          allStaff.push({
            id: 'unassigned',
            name: 'Needs Carer Assignment',
            role: 'carer'
          });
        }
        
        // Get branch admins for this booking's branch
        const branchAdminsForBooking = primaryBooking.branch_id 
          ? branchAdminMap.get(primaryBooking.branch_id) || []
          : [];
        
        return {
          id: primaryBooking.id,
          type: 'booking' as const,
          title: primaryBooking.clients 
            ? `${primaryBooking.clients.first_name} ${primaryBooking.clients.last_name}` 
            : 'Appointment',
          startTime,
          endTime,
          status: (primaryBooking.status as 'scheduled' | 'in-progress' | 'completed' | 'cancelled') || 'scheduled',
          branchId: primaryBooking.branch_id,
          branchName: primaryBooking.branches?.name || 'Unknown Branch',
          participants: [
            // Client
            ...(primaryBooking.clients ? [{
              id: primaryBooking.clients.id,
              name: `${primaryBooking.clients.first_name} ${primaryBooking.clients.last_name}`,
              role: 'client'
            }] : []),
            // All carers/staff
            ...allStaff,
            // Branch admins
            ...branchAdminsForBooking.map(admin => ({
              id: admin.id,
              name: admin.name,
              role: 'branch_admin'
            }))
          ],
          location: primaryBooking.branches?.name,
          priority: 'medium' as const,
          clientId: primaryBooking.client_id,
          staffIds: Array.from(seenStaffIds),
          // Late/Missed tracking fields
          isLateStart: primaryBooking.is_late_start || false,
          isMissed: primaryBooking.is_missed || false,
          lateStartMinutes: primaryBooking.late_start_minutes || visitRecord?.arrival_delay_minutes || 0,
          actualStartTime: visitRecord?.visit_start_time || undefined,
          lateArrivalReason: visitRecord?.late_arrival_reason || undefined
        };
      });
      
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

    // Helper function to parse time from training_notes
    const parseTrainingTime = (notes: string | null, assignedDate: string): { start: Date, end: Date } => {
      const defaultStart = new Date(`${assignedDate}T09:00:00`);
      const defaultEnd = new Date(`${assignedDate}T17:00:00`);
      
      if (!notes) return { start: defaultStart, end: defaultEnd };
      
      // Parse "Time: HH:MM - HH:MM" from notes
      const timeMatch = notes.match(/Time:\s*(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/i);
      if (timeMatch) {
        const [_, startHour, startMin, endHour, endMin] = timeMatch;
        return {
          start: new Date(`${assignedDate}T${startHour.padStart(2, '0')}:${startMin}:00`),
          end: new Date(`${assignedDate}T${endHour.padStart(2, '0')}:${endMin}:00`)
        };
      }
      
      return { start: defaultStart, end: defaultEnd };
    };

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
            training_notes,
            staff (
              first_name,
              last_name
            ),
            branches (
              name
            ),
            training_courses (
              title,
              category
            )
          `)
          .gte('assigned_date', startDate.toISOString().split('T')[0])
          .lte('assigned_date', endDate.toISOString().split('T')[0])
          .in('branch_id', targetBranchIds)
          .order('assigned_date', { ascending: true });

        if (trainingsError) {
          console.error('[fetchOrganizationCalendarEvents] Trainings error:', trainingsError);
        } else if (trainings) {
          const trainingEvents = trainings.map(training => {
            const times = parseTrainingTime(training.training_notes, training.assigned_date);
            const courseTitle = training.training_courses?.title || 'Training Session';
            
            return {
              id: training.id,
              type: 'training' as const,
              title: courseTitle,
              startTime: times.start,
              endTime: times.end,
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
              staffIds: [training.staff_id],
              description: training.training_notes || undefined
            };
          });
          
          console.log('✅ [fetchOrganizationCalendarEvents] Training events processed:', {
            count: trainingEvents.length,
            events: trainingEvents.map(e => ({
              id: e.id,
              title: e.title,
              date: format(e.startTime, 'yyyy-MM-dd'),
              time: `${format(e.startTime, 'HH:mm')} - ${format(e.endTime, 'HH:mm')}`,
              branch: e.branchName,
              staff: e.participants.map(p => p.name).join(', ')
            }))
          });
          
          events.push(...trainingEvents);
        }
      } catch (error) {
        console.error('[fetchOrganizationCalendarEvents] Trainings fetch error:', error);
      }
    }

    // Fetch annual leave calendar events (with recurring support)
    if (!eventType || eventType === 'all' || eventType === 'leave') {
      try {
        // For recurring holidays, we need to fetch ALL holidays and then filter manually
        // because recurring holidays from any year can match the current date range
        
        // Build base query
        let leavesQuery = supabase
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
          .order('leave_date', { ascending: true });

        // Apply branch filter: include company-wide OR matching branch
        if (branchId) {
          leavesQuery = leavesQuery.or(`is_company_wide.eq.true,branch_id.eq.${branchId}`);
        } else {
          // For "All Branches", get company-wide plus all branch-specific for this org
          leavesQuery = leavesQuery.or(`is_company_wide.eq.true,branch_id.in.(${targetBranchIds.join(',')})`);
        }

        const { data: allLeaves, error: leavesError } = await leavesQuery;

        if (leavesError) {
          console.error('[fetchOrganizationCalendarEvents] Leaves error:', leavesError);
        } else if (allLeaves) {
          // Filter and generate events for holidays
          const leaveEvents: CalendarEvent[] = [];
          
          for (const leave of allLeaves) {
            const holidayDate = new Date(leave.leave_date);
            const holidayMonth = getMonth(holidayDate);
            const holidayDay = getDate(holidayDate);
            
            if (leave.is_recurring) {
              // For recurring holidays, check if month/day falls within our date range
              // We need to check the current year's occurrence
              const currentYearDate = new Date(startDate.getFullYear(), holidayMonth, holidayDay);
              
              // Check if this date falls within our view range
              if (currentYearDate >= startDate && currentYearDate <= endDate) {
                leaveEvents.push({
                  id: leave.id,
                  type: 'leave' as const,
                  title: leave.leave_name,
                  startTime: new Date(`${format(currentYearDate, 'yyyy-MM-dd')}T00:00:00`),
                  endTime: new Date(`${format(currentYearDate, 'yyyy-MM-dd')}T23:59:59`),
                  status: 'scheduled' as const,
                  branchId: leave.branch_id || targetBranchIds[0],
                  branchName: leave.is_company_wide ? 'Company-wide' : (leave.branches?.name || 'Unknown Branch'),
                  participants: [],
                  location: leave.is_company_wide ? 'All Locations' : leave.branches?.name,
                  priority: 'low' as const,
                  staffIds: []
                });
              }
            } else {
              // For non-recurring holidays, check exact date match
              if (holidayDate >= startDate && holidayDate <= endDate) {
                leaveEvents.push({
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
                });
              }
            }
          }
          
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
            branch_id,
            clients (
              first_name,
              last_name,
              branch_id
            ),
            branches (
              id,
              name,
              organization_id
            )
          `)
          .gte('appointment_date', startDate.toISOString().split('T')[0])
          .lte('appointment_date', endDate.toISOString().split('T')[0])
          .in('branch_id', targetBranchIds)
          .order('appointment_date', { ascending: true });

        if (appointmentsError) {
          console.error('[fetchOrganizationCalendarEvents] Appointments error:', appointmentsError);
        } else if (appointments) {
          const appointmentEvents = appointments.map(appointment => ({
            id: appointment.id,
            type: 'meeting' as const,
            title: appointment.clients 
              ? `${appointment.appointment_type} - ${appointment.clients.first_name} ${appointment.clients.last_name}`
              : appointment.appointment_type,
            startTime: new Date(`${appointment.appointment_date}T${appointment.appointment_time}`),
            endTime: (() => {
              const start = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
              // Add default 1 hour duration for meetings
              return new Date(start.getTime() + 60 * 60 * 1000);
            })(),
            status: (appointment.status as 'scheduled' | 'in-progress' | 'completed' | 'cancelled') || 'scheduled',
            branchId: appointment.branch_id || targetBranchIds[0],
            branchName: appointment.branches?.name || 'Unknown Branch',
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

    // Enhanced debug logging with detailed event information
    console.log('🔍 [Filter Debug]:', {
      selectedBranch: branchId || 'all',
      totalEvents: events.length,
      afterTypeFilter: filteredEvents.length,
      afterSearchFilter: searchFilteredEvents.length,
      eventDetails: searchFilteredEvents.map(e => ({
        id: e.id,
        type: e.type,
        title: e.title,
        branchId: e.branchId,
        branchName: e.branchName,
        startTime: format(e.startTime, 'yyyy-MM-dd HH:mm')
      })),
      byBranch: searchFilteredEvents.reduce((acc, e) => {
        acc[e.branchName] = (acc[e.branchName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byType: searchFilteredEvents.reduce((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    });

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

      // Detailed event breakdown for debugging
      console.log('✅ [fetchOrganizationCalendarEvents] Event breakdown:', {
        total: eventsWithConflicts.length,
        byType: {
          bookings: eventsWithConflicts.filter(e => e.type === 'booking').length,
          meetings: eventsWithConflicts.filter(e => e.type === 'meeting').length,
          training: eventsWithConflicts.filter(e => e.type === 'training').length,
          agreements: eventsWithConflicts.filter(e => e.type === 'agreement').length,
          leave: eventsWithConflicts.filter(e => e.type === 'leave').length,
        },
        conflicts: eventsWithConflicts.filter(e => e.conflictsWith && e.conflictsWith.length > 0).length
      });
      
      // Log first 5 events for debugging
      eventsWithConflicts.slice(0, 5).forEach(event => {
        console.log(`  📅 [${event.type}] ${event.title}: ${format(event.startTime, 'yyyy-MM-dd HH:mm')}`);
      });
      
      console.log('✅ [fetchOrganizationCalendarEvents] ========== FETCH END ==========');
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