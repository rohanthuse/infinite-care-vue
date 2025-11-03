import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BranchInfo {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  operating_hours: string | null;
  established_date: string | null;
  status: string;
  organization_id: string | null;
}

export const useBranchInfo = (branchId: string | undefined) => {
  return useQuery({
    queryKey: ['branch-info', branchId],
    queryFn: async () => {
      if (!branchId) throw new Error('Branch ID is required');
      
      const { data, error } = await supabase
        .from('branches')
        .select('id, name, address, phone, email, operating_hours, established_date, status, organization_id')
        .eq('id', branchId)
        .single();

      if (error) {
        throw new Error(error.message);
      }
      
      if (!data) {
        throw new Error('Branch not found');
      }

      return data as BranchInfo;
    },
    enabled: !!branchId,
  });
};