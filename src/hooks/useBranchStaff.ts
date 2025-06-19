
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BranchStaff {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  status: string;
  specialization?: string;
}

const fetchBranchStaff = async (branchId: string): Promise<BranchStaff[]> => {
  const { data, error } = await supabase
    .from('staff')
    .select('id, first_name, last_name, email, status, specialization')
    .eq('branch_id', branchId)
    .eq('status', 'Active')
    .order('first_name');

  if (error) {
    console.error('Error fetching branch staff:', error);
    throw error;
  }

  return data || [];
};

export const useBranchStaff = (branchId: string) => {
  return useQuery({
    queryKey: ['branch-staff', branchId],
    queryFn: () => fetchBranchStaff(branchId),
    enabled: Boolean(branchId),
  });
};
