import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { CalendarEvent } from '@/types/calendar';
import { format, startOfDay, endOfDay } from 'date-fns';

interface CalendarStats {
  activeStaff: number;
  capacityPercentage: number;
  conflictCount: number;
}

const fetchOrganizationStats = async (organizationId: string, events: CalendarEvent[], date: Date, branchId?: string): Promise<CalendarStats> => {
  console.log('[fetchOrganizationStats] Calculating stats for organization:', organizationId, 'branch:', branchId);

  try {
    // Get total active staff count for organization (or specific branch)
    let staffQuery = supabase
      .from('staff')
      .select('id, branch_id, branches!inner(organization_id)')
      .eq('branches.organization_id', organizationId)
      .eq('status', 'Active');
    
    // Add branch filter if specific branch is selected
    if (branchId && branchId !== 'all') {
      staffQuery = staffQuery.eq('branch_id', branchId);
    }

    const { data: staffData, error: staffError } = await staffQuery;

    if (staffError) {
      console.error('[fetchOrganizationStats] Staff query error:', staffError);
      throw staffError;
    }

    const activeStaff = staffData?.length || 0;

    // Calculate conflicts - events where same staff member has overlapping bookings
    const conflicts = new Set<string>();
    
    if (events && events.length > 0) {
      for (let i = 0; i < events.length; i++) {
        for (let j = i + 1; j < events.length; j++) {
          const event1 = events[i];
          const event2 = events[j];
          
          // Check if events have overlapping staff and time
          const hasCommonStaff = event1.staffIds.some(staffId => event2.staffIds.includes(staffId));
          
          if (hasCommonStaff) {
            const start1 = new Date(event1.startTime);
            const end1 = new Date(event1.endTime);
            const start2 = new Date(event2.startTime);
            const end2 = new Date(event2.endTime);
            
            // Check for time overlap
            if (start1 < end2 && start2 < end1) {
              conflicts.add(event1.id);
              conflicts.add(event2.id);
            }
          }
        }
      }
    }

    // Calculate capacity - total booking hours vs available staff hours
    const totalBookingHours = events?.reduce((sum, event) => {
      const duration = (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60);
      return sum + duration;
    }, 0) || 0;

    // Assuming 8 hours per day per staff member as available capacity
    const availableCapacity = activeStaff * 8;
    const capacityPercentage = availableCapacity > 0 ? Math.min(100, Math.round((totalBookingHours / availableCapacity) * 100)) : 0;

    const stats = {
      activeStaff,
      capacityPercentage,
      conflictCount: conflicts.size
    };

    console.log('[fetchOrganizationStats] Calculated stats:', stats);
    return stats;

  } catch (error) {
    console.error('[fetchOrganizationStats] Error:', error);
    throw error;
  }
};

export const useOrganizationCalendarStats = (events: CalendarEvent[], date: Date, branchId?: string) => {
  const { organization } = useTenant();

  return useQuery({
    queryKey: ['organization-calendar-stats', organization?.id, events?.length, format(date, 'yyyy-MM-dd'), branchId],
    queryFn: () => {
      if (!organization?.id) {
        throw new Error('Organization context required for calendar stats');
      }
      return fetchOrganizationStats(organization.id, events || [], date, branchId);
    },
    enabled: !!organization?.id && Array.isArray(events),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
};