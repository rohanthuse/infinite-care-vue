
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { validateBranchInOrganization } from './useTenantAware';
import { startOfDay, isBefore } from 'date-fns';

export interface BranchStaffWithStatus {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  status: string;
  specialization?: string;
  address?: string;
  postcode?: string;
  isInactive: boolean;
}

const fetchBranchStaffWithInactive = async (
  branchId: string, 
  organizationId: string,
  selectedDate: Date
): Promise<BranchStaffWithStatus[]> => {
  // Validate branch belongs to organization
  const isValidBranch = await validateBranchInOrganization(branchId, organizationId);
  if (!isValidBranch) {
    throw new Error('Branch does not belong to current organization');
  }

  // Fetch all active staff
  const { data: activeStaff, error: activeError } = await supabase
    .from('staff')
    .select('id, first_name, last_name, email, status, specialization, address, postcode')
    .eq('branch_id', branchId)
    .eq('status', 'Active')
    .order('first_name');

  if (activeError) {
    console.error('Error fetching active staff:', activeError);
    throw activeError;
  }

  const activeStaffWithStatus: BranchStaffWithStatus[] = (activeStaff || []).map(staff => ({
    ...staff,
    isInactive: false
  }));

  // Check if the selected date is in the past
  const today = startOfDay(new Date());
  const selectedDayStart = startOfDay(selectedDate);
  const isPastDate = isBefore(selectedDayStart, today);

  // If viewing past date, also fetch inactive staff who have bookings on that date
  if (isPastDate) {
    const dateString = selectedDate.toISOString().split('T')[0];
    
    // Get unique staff IDs from bookings on this date
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('staff_id')
      .eq('branch_id', branchId)
      .gte('start_time', `${dateString}T00:00:00`)
      .lt('start_time', `${dateString}T23:59:59`)
      .not('staff_id', 'is', null);

    if (bookingsError) {
      console.error('Error fetching bookings for inactive staff:', bookingsError);
      // Don't throw, just return active staff
      return activeStaffWithStatus;
    }

    // Get unique staff IDs that aren't in active staff
    const activeStaffIds = new Set(activeStaffWithStatus.map(s => s.id));
    const inactiveStaffIds = [...new Set(
      (bookingsData || [])
        .map(b => b.staff_id)
        .filter(id => id && !activeStaffIds.has(id))
    )];

    if (inactiveStaffIds.length > 0) {
      // Fetch inactive staff details
      const { data: inactiveStaff, error: inactiveError } = await supabase
        .from('staff')
        .select('id, first_name, last_name, email, status, specialization, address, postcode')
        .in('id', inactiveStaffIds)
        .neq('status', 'Active')
        .order('first_name');

      if (!inactiveError && inactiveStaff) {
        const inactiveStaffWithStatus: BranchStaffWithStatus[] = inactiveStaff.map(staff => ({
          ...staff,
          isInactive: true
        }));
        
        // Return active staff first, then inactive staff
        return [...activeStaffWithStatus, ...inactiveStaffWithStatus];
      }
    }
  }

  return activeStaffWithStatus;
};

export const useBranchStaffWithInactive = (branchId: string, selectedDate: Date) => {
  const { organization } = useTenant();
  
  // Create a stable date key for the query
  const dateKey = selectedDate.toISOString().split('T')[0];
  
  return useQuery({
    queryKey: ['branch-staff-with-inactive', branchId, organization?.id, dateKey],
    queryFn: () => {
      if (!organization?.id) {
        throw new Error('Organization context required');
      }
      return fetchBranchStaffWithInactive(branchId, organization.id, selectedDate);
    },
    enabled: Boolean(branchId) && Boolean(organization?.id),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
};
