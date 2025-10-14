import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StaffAuthInfo {
  id: string;
  auth_user_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
}

export const useStaffAuthInfo = (staffId: string) => {
  return useQuery({
    queryKey: ['staff-auth-info', staffId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('id, auth_user_id, first_name, last_name, email')
        .eq('id', staffId)
        .single();
      
      if (error) throw error;
      if (!data.auth_user_id) {
        throw new Error('Staff member does not have an auth user account');
      }
      
      return data as StaffAuthInfo;
    },
    enabled: !!staffId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};
